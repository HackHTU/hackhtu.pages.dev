#!/usr/bin/env bash
# htu-tui —— 河南师范大学校园网 TUI（macOS 版）
#
# 零依赖：只用到 bash / curl / stty / sed / grep / launchctl，均为系统自带。
# 用法：
#   ./macos.sh            打开 TUI
#   ./macos.sh login      单次登录（自启用）
#   ./macos.sh watch      常驻，断线自动重连
#   ./macos.sh install    安装开机自启（LaunchAgent）
#   ./macos.sh uninstall  卸载开机自启
#   ./macos.sh status     打印当前状态

set -u

# 门户页面是 GBK/UTF-8 混合的旧页面，UTF-8 locale 下 tr/grep 会因非法字节中断，
# 导致 302 头和 common.js 解析被截断。这里统一按字节处理。
export LC_ALL=C

if [ "$(uname -s 2>/dev/null)" != "Darwin" ]; then
  printf '提示：这是 macOS 版脚本，当前系统不是 macOS，请改用对应平台的脚本。\n' >&2
fi

VERSION="1.1.6"
PLATFORM="macos"
APP_NAME="htu-tui"

CONF_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/$APP_NAME"
CONF_FILE="$CONF_DIR/config"
LOG_FILE="$CONF_DIR/login.log"
DAEMON_LOG="$CONF_DIR/daemon.log"

PORTAL_ORIGIN="http://10.101.2.194:6060"
PROBE_URL="http://www.msftconnecttest.com/connecttest.txt"
PROBE_MARK="Microsoft Connect Test"
PROBE_URL_ALT="http://captive.apple.com/hotspot-detect.html"
PROBE_MARK_ALT="Success"
HTTP_UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.2 Safari/605.1.15"

# 未认证时访问这些地址会被门户 302 到 portal.do?wlanuserip=...
# 网关根地址最稳：直接问网关要跳转，不依赖 DNS 和外网。
CAPTIVE_URLS="http://10.101.2.194:6060/ http://10.101.2.194:6060/portal.do http://www.qq.com/ http://connectivitycheck.gstatic.com/generate_204 http://www.baidu.com/ http://captive.apple.com/hotspot-detect.html http://www.msftconnecttest.com/connecttest.txt http://192.168.0.1/"

# 动态发现失败时的兜底（与 alsjddsg/HTU_Network_Auto_Login 抓包值一致）
FALLBACK_AUTH_URL="http://10.101.2.205:8081/aaa-auth/api/v1/auth"
FALLBACK_CHECK_URL="http://10.101.2.239:8081/user/check-only"
FALLBACK_CAMPUS_CODE="3def184ad8f4755ff269862ea77393dd,1afa34a7f984eeabdbb0a7d494132ee5,65ded5353c5ee48d0b7d48c591b8f430,fc512637643a493799a7073e4bad6cf8"

# 校园 WiFi：未认证时先连上它，再走门户登录。公开网络，不需要密码。
# 广播名称可能带大小写/下划线/2.4G 后缀，匹配时统一去掉非字母数字。
DEFAULT_WIFI_NAMES="Htu_AuteWiFi Htu_AuteWiFi_2.4G HTU_AutoWiFi HTU_AutoWiFi_2.4G"

SERVICE_LABEL="cn.hackhtu.htu-tui"
PLIST_DIR="$HOME/Library/LaunchAgents"
PLIST_FILE="$PLIST_DIR/$SERVICE_LABEL.plist"

SCRIPT_PATH="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"

LAST_MSG=""
ONLINE_STATE="unknown"
STTY_SAVE=""
TOP_ROW=1

# 动态发现结果
DISC_ROOT=""
DISC_QUERY=""
DISC_AUTH=""
DISC_CHECK=""
DISC_CAMPUS=""

# 网卡名缓存（macOS 的 Wi-Fi 口不一定是 en0）
WIFI_IFACE=""
WIFI_STATE=""

if [ -t 1 ]; then
  RST=$'\033[0m'
  DIM=$'\033[2m'
  BOLD=$'\033[1m'
  CYAN=$'\033[36m'
  GREEN=$'\033[32m'
  RED=$'\033[31m'
  YELLOW=$'\033[33m'
else
  RST=""; DIM=""; BOLD=""; CYAN=""; GREEN=""; RED=""; YELLOW=""
fi

# ---------------------------------------------------------------- 基础工具

usage() {
  cat <<'EOF'
HTU 校园网 TUI

  htu-tui              打开界面
  htu-tui login        单次登录
  htu-tui watch        常驻并断线重连
  htu-tui install      安装开机自启
  htu-tui uninstall    卸载开机自启
  htu-tui status       打印状态
  htu-tui doctor       网络诊断（登录失败时先跑这个）
EOF
}

log_line() {
  mkdir -p "$CONF_DIR" 2>/dev/null
  printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >>"$LOG_FILE" 2>/dev/null
}

conf_get() {
  [ -f "$CONF_FILE" ] || return 0
  sed -n "s/^$1=//p" "$CONF_FILE" 2>/dev/null | head -n 1
}

conf_set() {
  local key="$1" value="$2" tmp
  mkdir -p "$CONF_DIR" 2>/dev/null || return 1
  [ -f "$CONF_FILE" ] || : >"$CONF_FILE"
  chmod 600 "$CONF_FILE" 2>/dev/null
  tmp="$CONF_FILE.tmp"
  grep -v "^$key=" "$CONF_FILE" >"$tmp" 2>/dev/null
  printf '%s=%s\n' "$key" "$value" >>"$tmp"
  mv "$tmp" "$CONF_FILE"
  chmod 600 "$CONF_FILE" 2>/dev/null
}

op_suffix() {
  case "${1:-}" in
    yd) printf '@yd' ;;
    lt) printf '@lt' ;;
    dx) printf '@dx' ;;
    hsd) printf '@hsd' ;;
    *) printf '@hsd' ;;
  esac
}

op_label() {
  case "${1:-}" in
    yd) printf '中国移动' ;;
    lt) printf '中国联通' ;;
    dx) printf '中国电信' ;;
    hsd) printf '校园直连' ;;
    *) printf '未设置' ;;
  esac
}

# 运营商展示：未配置时不显示默认后缀
op_display() {
  local op
  op=$(conf_get operator)
  if [ -z "$op" ]; then
    printf '未设置'
    return
  fi
  printf '%s %s' "$(op_label "$op")" "$(op_suffix "$op")"
}

state_label() {
  case "${1:-}" in
    enabled) printf '已开启' ;;
    *) printf '未开启' ;;
  esac
}

json_field() {
  printf '%s' "$1" | tr -d '\r\n' | grep -oE "\"$2\"[[:space:]]*:[[:space:]]*\"?[^\",}]*" 2>/dev/null \
    | head -n 1 | sed -E 's/.*:[[:space:]]*"?//'
}

# ---------------------------------------------------------------- 网络

# 校园网认证必须走直连。macOS 上 curl 会跟系统 HTTP 代理，外网探测和 302 捕获都会失真。
http_get() {
  curl --noproxy '*' -4 --silent --show-error --location \
    --connect-timeout 4 --max-time "${2:-8}" \
    -A "$HTTP_UA" "$1" 2>/dev/null
}

http_post_form() {
  local url="$1" origin="$2"
  shift 2
  curl --noproxy '*' --silent --show-error --location \
    --connect-timeout 3 --max-time 12 \
    -X POST "$url" \
    -H "Content-Type: application/x-www-form-urlencoded; charset=UTF-8" \
    -H "Origin: $origin" \
    -H "Referer: $origin/" \
    -H "Accept: */*" \
    -A "$HTTP_UA" \
    "$@" 2>/dev/null
}

extract_portal() {
  local text="$1" url
  url=$(printf '%s' "$text" | tr -d '\r\n' \
    | grep -oE 'https?://[^[:space:]"'\'']*portal\.do[^[:space:]"'\'']*' \
    | head -n 1)
  if [ -z "$url" ]; then
    url=$(printf '%s' "$text" | tr -d '\r\n' \
      | grep -oE "location\\.replace\\(['\"]https?://[^'\"]+['\"]" \
      | grep -oE "https?://[^'\"]+" | head -n 1)
  fi
  printf '%s' "$url"
}

extract_base() {
  printf '%s' "$1" | grep -oE '<base[^>]*href=["'\''][^"'\'']+' \
    | sed -E 's/.*href=["'\'']//' | head -n 1
}

extract_common_js() {
  printf '%s' "$1" | grep -oE "src=[\"'][^\"']*common\\.js[^\"']*" \
    | head -n 1 | sed -E "s/^src=[\"']//"
}

# 把 ./front/js/common.js 解析成绝对地址，尊重 <base href>。
resolve_url() {
  local root="$1" base="${2:-/}" path="$3"
  case "$path" in
    http://*|https://*) printf '%s' "$path"; return ;;
  esac
  case "$base" in
    http://*|https://*) ;;
    /*) base="$root$base" ;;
    *) base="$root/$base" ;;
  esac
  case "$base" in
    */) ;;
    *) base="${base%/*}/" ;;
  esac
  case "$path" in
    /*) printf '%s%s' "$root" "$path"; return ;;
    ./*) path="${path#./}" ;;
  esac
  printf '%s%s' "$base" "$path"
}

# 学校当前把 authApiUrl 写成 API + "/api/v1/auth"，不是带引号的完整 URL。
parse_js_config() {
  local js="$1" api api_path
  DISC_CAMPUS=$(printf '%s' "$js" \
    | sed -nE "s/.*authSchoolCodes[[:space:]]*=[[:space:]]*['\"]([^'\"]+)['\"].*/\1/p" | head -n 1)
  DISC_AUTH=$(printf '%s' "$js" \
    | sed -nE "s/.*authApiUrl[[:space:]]*=[[:space:]]*['\"](https?:\\/\\/[^'\"]+)['\"].*/\1/p" | head -n 1)
  if [ -z "$DISC_AUTH" ]; then
    api=$(printf '%s' "$js" \
      | sed -nE "s/.*(const|var|let)[[:space:]]+API[[:space:]]*=[[:space:]]*['\"]([^'\"]+)['\"].*/\2/p" | head -n 1)
    if [ -z "$api" ]; then
      api=$(printf '%s' "$js" \
        | sed -nE "s/.*[[:space:]]API[[:space:]]*=[[:space:]]*['\"]([^'\"]+)['\"].*/\1/p" | head -n 1)
    fi
    api_path=$(printf '%s' "$js" \
      | sed -nE "s/.*authApiUrl[[:space:]]*=[[:space:]]*API[[:space:]]*[+][[:space:]]*['\"]([^'\"]+)['\"].*/\1/p" | head -n 1)
    [ -n "$api_path" ] || api_path="/api/v1/auth"
    if [ -n "$api" ]; then
      DISC_AUTH="$api$api_path"
    fi
  fi
  DISC_CHECK=$(printf '%s' "$js" \
    | sed -nE "s/.*checkApiUrl[[:space:]]*=[[:space:]]*['\"]([^'\"]+)['\"].*/\1/p" | head -n 1)
}

# 未认证时门户会把任意网页 302 到 portal.do?wlanuserip=...；把跳转头抓下来。
captive_dump() {
  curl --noproxy '*' -4 --silent --show-error --include --location --max-redirs 3 \
    --connect-timeout 4 --max-time 8 \
    -A "$HTTP_UA" "$1" 2>/dev/null
}

# 门户有时给相对地址（/portal.do?...），补成绝对地址。
absolute_url() {
  local origin="$1" loc="$2" scheme host
  case "$loc" in
    http://*|https://*|//*) ;;
    /*)
      scheme=$(printf '%s' "$origin" | sed -E 's#^(https?)://.*#\1#')
      host=$(printf '%s' "$origin" | sed -E 's#^https?://([^/]+).*#\1#')
      printf '%s://%s%s' "$scheme" "$host" "$loc"
      return
      ;;
    *) printf '%s' "$loc"; return ;;
  esac
  case "$loc" in
    //*) printf '%s:%s' "$(printf '%s' "$origin" | sed -E 's#^(https?).*#\1#')" "$loc" ;;
    *) printf '%s' "$loc" ;;
  esac
}

find_portal() {
  local url dump loc portal
  for url in $CAPTIVE_URLS; do
    dump=$(captive_dump "$url")
    [ -n "$dump" ] || continue
    loc=$(printf '%s' "$dump" | tr -d '\r' \
      | sed -nE 's/^[Ll]ocation:[[:space:]]*//p' | grep -i 'portal\.do' | head -n 1)
    if [ -z "$loc" ]; then
      loc=$(printf '%s' "$dump" | tr -d '\r\n' \
        | grep -oE '(https?:)?//[^"'"'"' <>]*portal\.do[^"'"'"' <>]*' | head -n 1)
    fi
    [ -n "$loc" ] || continue
    portal=$(absolute_url "$url" "$loc")
    case "$portal" in
      *portal.do*) printf '%s' "$portal"; return 0 ;;
    esac
  done
  return 1
}

is_online() {
  local body timeout="${1:-6}"
  body=$(http_get "$PROBE_URL" "$timeout")
  case "$body" in
    *"$PROBE_MARK"*) return 0 ;;
  esac
  body=$(http_get "$PROBE_URL_ALT" "$timeout")
  case "$body" in
    *"$PROBE_MARK_ALT"*) return 0 ;;
  esac
  return 1
}

# 认证接口返回成功后，校园网放行可能有一两秒延迟，多探测几次再判定失败。
verify_online() {
  local i
  for i in 1 2 3 4 5 6 7 8; do
    if is_online 3; then
      return 0
    fi
    [ "$i" -lt 8 ] && sleep 1.5
  done
  return 1
}

# ---------------------------------------------------------------- 校园 WiFi

wifi_iface() {
  if [ -n "$WIFI_IFACE" ]; then
    printf '%s' "$WIFI_IFACE"
    return 0
  fi
  local iface
  iface=$(networksetup -listallhardwareports 2>/dev/null \
    | awk '/Hardware Port: Wi-Fi|Hardware Port: AirPort/{getline; print $2; exit}')
  if [ -z "$iface" ]; then
    return 1
  fi
  WIFI_IFACE="$iface"
  printf '%s' "$iface"
}

wifi_current() {
  local iface out
  iface=$(wifi_iface) || return 1
  out=$(networksetup -getairportnetwork "$iface" 2>/dev/null)
  case "$out" in
    *"Current Wi-Fi Network: "*) printf '%s' "${out#*Current Wi-Fi Network: }" ;;
    *) return 1 ;;
  esac
}

wifi_display() {
  local cur
  cur=$(wifi_current) || cur=""
  printf '%s' "${cur:-未关联}"
}

# Htu_AuteWiFi / HTU-AUTO-WIFI / htu_autowifi_2.4G 都算同一个名字。
wifi_norm() {
  printf '%s' "${1:-}" | tr '[:upper:]' '[:lower:]' | tr -cd 'a-z0-9'
}

wifi_names() {
  local names
  names=$(conf_get wifi_names)
  if [ -z "$names" ]; then
    names="$DEFAULT_WIFI_NAMES"
  fi
  printf '%s' "$names" | tr ',' '\n' | tr -s '\n' ' '
}

wifi_is_campus() {
  local n name
  n=$(wifi_norm "$1")
  [ -n "$n" ] || return 1
  case "$n" in
    htuautewifi*|htuautowifi*) return 0 ;;
  esac
  for name in $(wifi_names); do
    if [ "$n" = "$(wifi_norm "$name")" ]; then
      return 0
    fi
  done
  return 1
}

# 未认证时确保连上校园 WiFi：已连好就直接返回，否则逐个候选名称尝试。
wifi_ensure() {
  local iface ssid cur pass
  iface=$(wifi_iface) || return 1
  cur=$(wifi_current) || cur=""
  if [ -n "$cur" ] && wifi_is_campus "$cur"; then
    return 0
  fi

  pass=$(conf_get wifi_password)
  for ssid in $(wifi_names); do
    if [ -n "$pass" ]; then
      networksetup -setairportnetwork "$iface" "$ssid" "$pass" >/dev/null 2>&1
    else
      networksetup -setairportnetwork "$iface" "$ssid" >/dev/null 2>&1
    fi
    sleep 2
    cur=$(wifi_current) || cur=""
    if [ -n "$cur" ] && wifi_is_campus "$cur"; then
      log_line "WiFi：已连接 $cur"
      return 0
    fi
  done

  log_line "WiFi：没连上校园网（当前 ${cur:-未关联}）"
  return 1
}

# 动态发现：普通网页 302 -> portal.do -> common.js -> authApiUrl / authSchoolCodes
discover() {
  DISC_ROOT=""; DISC_QUERY=""; DISC_AUTH=""; DISC_CHECK=""; DISC_CAMPUS=""
  local portal root html script js full base
  portal=$(find_portal)
  if [ -z "$portal" ]; then
    log_line "发现失败：没能从网页拿到 portal.do 跳转"
    return 1
  fi
  log_line "门户地址：$portal"

  root=$(printf '%s' "$portal" | sed -E 's#^(https?://[^/?]+).*#\1#')
  case "$portal" in
    *\?*) DISC_QUERY="${portal#*\?}" ;;
  esac
  if [ -z "$DISC_QUERY" ]; then
    log_line "发现失败：门户地址缺少查询参数"
    return 1
  fi

  html=$(http_get "$portal" 6)
  if [ -z "$html" ]; then
    log_line "发现失败：门户页面打不开"
    return 1
  fi
  html=$(printf '%s' "$html" | tr -d '\r\n')
  script=$(extract_common_js "$html")
  if [ -z "$script" ]; then
    log_line "发现失败：门户页面里找不到 common.js"
    return 1
  fi
  base=$(extract_base "$html")
  full=$(resolve_url "$root" "$base" "$script")
  log_line "配置脚本：$full"

  js=$(http_get "$full" 6)
  js=$(printf '%s' "$js" | tr -d '\r\n')
  parse_js_config "$js"
  if [ -z "$DISC_AUTH" ]; then
    log_line "发现失败：配置脚本里没有 authApiUrl"
    return 1
  fi
  DISC_ROOT="$root"
  return 0
}

login_once() {
  local user pass op suffix auth campus check origin resp code msg userid
  local check_resp check_code check_msg quick quick_code quick_msg

  user=$(conf_get username)
  pass=$(conf_get password)
  op=$(conf_get operator)
  if [ -z "$user" ] || [ -z "$pass" ]; then
    LAST_MSG="账号或密码未配置"
    log_line "失败：$LAST_MSG"
    return 1
  fi
  suffix=$(op_suffix "$op")

  if is_online; then
    LAST_MSG="已经在线，无需登录"
    log_line "$LAST_MSG"
    return 0
  fi

  # 未认证先确保连的是校园 WiFi；没有无线网卡或已连好时保持原样。
  if [ "$(conf_get wifi_auto)" != "off" ]; then
    wifi_ensure || true
  fi

  if discover; then
    auth="$DISC_AUTH"
    campus="$DISC_CAMPUS"
    check="$DISC_CHECK"
    [ -n "$campus" ] || campus="$FALLBACK_CAMPUS_CODE"
    origin="$DISC_ROOT"
    log_line "认证接口：$auth"
  else
    auth="$FALLBACK_AUTH_URL"
    campus="$FALLBACK_CAMPUS_CODE"
    check="$FALLBACK_CHECK_URL"
    origin="$PORTAL_ORIGIN"
    log_line "改用内置接口（没有门户地址，无法完成最后一步）"
  fi
  [ -n "$check" ] || check="$FALLBACK_CHECK_URL"

  # 网页未点运营商时 JS 默认 localSuffix=@hsd，curl 直连缺少该字段会返回「运营商后缀不能为空」。
  log_line "运营商后缀：$suffix"
  resp=$(http_post_form "$auth" "$origin" \
    --data-urlencode "campusCode=$campus" \
    --data-urlencode "username=$user" \
    --data-urlencode "password=$pass" \
    --data-urlencode "operatorSuffix=$suffix")
  code=$(json_field "$resp" code)
  msg=$(json_field "$resp" msg)
  userid=$(json_field "$resp" data)
  log_line "认证结果：code=${code:-空} msg=${msg:-空} data=${userid:-空}"
  case "$userid" in
    *@*) ;;
    *) userid="$user$suffix" ;;
  esac

  check_resp=$(http_post_form "$check" "$origin" \
    --data-urlencode "username=$user" \
    --data-urlencode "password=$pass" \
    --data-urlencode "operatorSuffix=$suffix")
  check_code=$(json_field "$check_resp" code)
  check_msg=$(json_field "$check_resp" msg)
  log_line "密码校验：code=${check_code:-空} msg=${check_msg:-空}"
  if [ -n "$check_code" ] && [ "$check_code" != "1" ] && [ "$check_code" != "-1" ]; then
    LAST_MSG="${check_msg:-账号或密码错误}"
    log_line "失败：$LAST_MSG"
    return 1
  fi

  # 门户的登录提交是 quickauth.do，必须带上 portal.do 上的 wlanuserip 等参数。
  if [ -n "$DISC_ROOT" ] && [ -n "$DISC_QUERY" ]; then
    quick=$(curl --noproxy '*' -4 --silent --show-error --location \
      --connect-timeout 4 --max-time 10 \
      -A "$HTTP_UA" \
      -G "$DISC_ROOT/quickauth.do?$DISC_QUERY" \
      --data-urlencode "userid=$userid" \
      --data-urlencode "passwd=$pass" 2>/dev/null)
    quick_code=$(json_field "$quick" code)
    quick_msg=$(json_field "$quick" message)
    [ -n "$quick_msg" ] || quick_msg=$(json_field "$quick" msg)
    log_line "quickauth：code=${quick_code:-空} msg=${quick_msg:-空}"
    if [ "$quick_code" != "0" ] && [ -n "$quick_msg" ]; then
      LAST_MSG="门户认证失败：$quick_msg"
      log_line "失败：$LAST_MSG"
      return 1
    fi
  fi

  if verify_online; then
    LAST_MSG="登录成功"
    log_line "$LAST_MSG"
    return 0
  fi

  if [ -z "$DISC_QUERY" ]; then
    LAST_MSG="没有拿到门户跳转地址，登录没走完（先在浏览器打开任意网页再试）"
  else
    LAST_MSG="认证已提交，但外网仍不可达"
  fi
  log_line "失败：$LAST_MSG"
  return 1
}

# ---------------------------------------------------------------- 开机自启

autostart_state() {
  if launchctl print "gui/$UID/$SERVICE_LABEL" >/dev/null 2>&1; then
    printf 'enabled'
  else
    printf 'disabled'
  fi
}

autostart_install() {
  mkdir -p "$PLIST_DIR" "$CONF_DIR" 2>/dev/null || return 1
  cat >"$PLIST_FILE" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$SERVICE_LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$SCRIPT_PATH</string>
    <string>watch</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardOutPath</key>
  <string>$DAEMON_LOG</string>
  <key>StandardErrorPath</key>
  <string>$DAEMON_LOG</string>
</dict>
</plist>
EOF
  launchctl bootout "gui/$UID" "$PLIST_FILE" >/dev/null 2>&1
  if launchctl bootstrap "gui/$UID" "$PLIST_FILE" >/dev/null 2>&1; then
    printf '已开启开机自启（LaunchAgent）\n'
    return 0
  fi
  printf '启用失败，请检查：launchctl print gui/%s/%s\n' "$UID" "$SERVICE_LABEL" >&2
  return 1
}

autostart_uninstall() {
  launchctl bootout "gui/$UID" "$PLIST_FILE" >/dev/null 2>&1
  rm -f "$PLIST_FILE"
  printf '已关闭开机自启\n'
}

# ---------------------------------------------------------------- TUI 底层

ui_end() {
  [ -n "$STTY_SAVE" ] && stty "$STTY_SAVE" 2>/dev/null
  STTY_SAVE=""
  printf '\033[?25h\033[0m\n'
  trap - EXIT INT TERM
}

ui_begin() {
  STTY_SAVE=$(stty -g 2>/dev/null)
  stty -echo -icanon min 1 time 0 2>/dev/null || stty -echo 2>/dev/null || true
  printf '\033[?25l'
  trap ui_end EXIT INT TERM
}

KEY=""
read_key() {
  local c tail1 tail2 save
  KEY=""
  IFS= read -rsn1 c || return 1
  if [ "$c" = $'\033' ]; then
    # bash 3.2（macOS 自带）不支持小数 -t，改用 stty 的 0.1s 读超时
    save=$(stty -g 2>/dev/null)
    stty -icanon min 0 time 1 2>/dev/null
    IFS= read -rsn1 tail1 || tail1=""
    IFS= read -rsn1 tail2 || tail2=""
    [ -n "$save" ] && stty "$save" 2>/dev/null
    if [ "$tail1" = "[" ]; then
      case "$tail2" in
        A) KEY=up ;;
        B) KEY=down ;;
        C) KEY=right ;;
        D) KEY=left ;;
        *) KEY=esc ;;
      esac
    else
      KEY=esc
    fi
  elif [ -z "$c" ] || [ "$c" = $'\r' ] || [ "$c" = $'\n' ]; then
    KEY=enter
  elif [ "$c" = $'\177' ] || [ "$c" = $'\010' ]; then
    KEY=backspace
  else
    KEY="$c"
  fi
  return 0
}

ui_header() {
  printf '\033[H\033[2J'
  printf '  %sHackHTU · HTU 校园网一键登录脚本%s  %s%s · v%s%s\n' \
    "$BOLD$CYAN" "$RST" "$DIM" "$PLATFORM" "$VERSION" "$RST"
  printf '  %sHackHTU 官网：' "$DIM"
  printf '\033]8;;https://hackhtu.pages.dev\033\\https://hackhtu.pages.dev\033]8;;\033\\%s\n\n' "$RST"
  printf '  %s%s%s\n\n' "$BOLD" "$1" "$RST"
}

ui_hint() {
  printf '\n  %s%s%s' "$DIM" "$1" "$RST"
}

ui_wait() {
  printf '\n  %s按任意键返回%s' "$DIM" "$RST"
  read_key >/dev/null
}

draw_items() {
  local sel="$1"
  shift
  local i=0
  for item in "$@"; do
    if [ "$i" = "$sel" ]; then
      printf '  %s❯ %s%s\n' "$CYAN$BOLD" "$item" "$RST"
    else
      printf '    %s\n' "$item"
    fi
    i=$((i + 1))
  done
}

# 输入框：结果写入 PROMPT_VALUE，返回 0 表示确认
PROMPT_VALUE=""
ui_prompt() {
  local title="$1" def="$2" secret="$3" value="" shown c
  while :; do
    printf '\033[H\033[2J'
    printf '  %sHackHTU · HTU 校园网一键登录脚本%s  %s%s · v%s%s\n' \
      "$BOLD$CYAN" "$RST" "$DIM" "$PLATFORM" "$VERSION" "$RST"
    printf '  %sHackHTU 官网：' "$DIM"
    printf '\033]8;;https://hackhtu.pages.dev\033\\https://hackhtu.pages.dev\033]8;;\033\\%s\n\n' "$RST"
    printf '  %s%s%s\n\n' "$BOLD" "$title" "$RST"
    printf '  %sEnter 确认   Esc 取消   Backspace 删除%s\n\n' "$DIM" "$RST"
    if [ -n "$def" ]; then
      printf '  %s当前：%s%s\n\n' "$DIM" "$def" "$RST"
    else
      printf '\n'
    fi
    if [ "$secret" = "1" ]; then
      shown=$(printf '%*s' "${#value}" '' | tr ' ' '*')
    else
      shown="$value"
    fi
    printf '  > %s' "$shown"
    read_key || return 1
    case "$KEY" in
      enter)
        PROMPT_VALUE="$value"
        return 0
        ;;
      esc)
        return 1
        ;;
      backspace)
        if [ ${#value} -gt 0 ]; then
          value="${value%?}"
        fi
        ;;
      *)
        c="$KEY"
        case "$c" in
          up|down|left|right) ;;
          *) value="$value$c" ;;
        esac
        ;;
    esac
  done
}

refresh_state() {
  if is_online; then
    ONLINE_STATE="online"
  else
    ONLINE_STATE="offline"
  fi
  WIFI_STATE=$(wifi_display)
}

# ---------------------------------------------------------------- TUI 页面

page_login() {
  ui_header "立即登录"
  printf '  %s正在认证…%s\n' "$DIM" "$RST"
  if login_once; then
    printf '\n  %s✔ %s%s\n' "$GREEN" "$LAST_MSG" "$RST"
  else
    printf '\n  %s✘ %s%s\n' "$RED" "$LAST_MSG" "$RST"
  fi
  refresh_state
  ui_hint "按任意键返回"
  read_key >/dev/null
}

page_operator() {
  local cur sel=0 i
  cur=$(conf_get operator)
  [ -n "$cur" ] || cur=yd
  local codes=(yd lt dx hsd)
  local labels=("中国移动  @yd" "中国联通  @lt" "中国电信  @dx" "校园直连  @hsd")
  while :; do
    printf '\033[H\033[2J'
    printf '  %sHackHTU · HTU 校园网一键登录脚本%s  %s%s · v%s%s\n' \
      "$BOLD$CYAN" "$RST" "$DIM" "$PLATFORM" "$VERSION" "$RST"
    printf '  %sHackHTU 官网：' "$DIM"
    printf '\033]8;;https://hackhtu.pages.dev\033\\https://hackhtu.pages.dev\033]8;;\033\\%s\n' "$RST"
    printf '  %s切换运营商%s\n' "$BOLD" "$RST"
    printf '  %s↑↓ 选择   Enter 保存   Esc 返回%s\n\n' "$DIM" "$RST"
    for i in 0 1 2 3; do
      if [ "${codes[$i]}" = "$cur" ] && [ "$i" = "$sel" ]; then
        printf '  %s❯ %s  ← 当前%s\n' "$CYAN$BOLD" "${labels[$i]}" "$RST"
      elif [ "${codes[$i]}" = "$cur" ]; then
        printf '    %s  ← 当前\n' "${labels[$i]}"
      elif [ "$i" = "$sel" ]; then
        printf '  %s❯ %s%s\n' "$CYAN$BOLD" "${labels[$i]}" "$RST"
      else
        printf '    %s\n' "${labels[$i]}"
      fi
    done
    ui_hint "↑↓ 选择   Enter 保存   Esc 返回"
    read_key || return
    case "$KEY" in
      up|k) sel=$(((sel + 3) % 4)) ;;
      down|j) sel=$(((sel + 1) % 4)) ;;
      enter)
        conf_set operator "${codes[$sel]}"
        return
        ;;
      esc|q) return ;;
    esac
  done
}

page_config() {
  local sel=0
  while :; do
    ui_header "账号配置"
    draw_items "$sel" "修改账号" "修改密码" "切换运营商" "WiFi 设置" "返回"
    printf '\n  %s账号 %s · 运营商 %s · WiFi %s%s\n' \
      "$DIM" "$(conf_get username)" "$(op_label "$(conf_get operator)")" "${WIFI_STATE:-未知}" "$RST"
    ui_hint "↑↓ 选择   Enter 确认   Esc 返回"
    read_key || return
    case "$KEY" in
      up|k) sel=$(((sel + 4) % 5)) ;;
      down|j) sel=$(((sel + 1) % 5)) ;;
      enter)
        case "$sel" in
          0)
            if ui_prompt "修改账号" "$(conf_get username)" 0; then
              [ -n "$PROMPT_VALUE" ] && conf_set username "$PROMPT_VALUE"
            fi
            ;;
          1)
            if ui_prompt "修改密码" "" 1; then
              [ -n "$PROMPT_VALUE" ] && conf_set password "$PROMPT_VALUE"
            fi
            ;;
          2) page_operator ;;
          3) page_wifi ;;
          4) return ;;
        esac
        ;;
      esc|q) return ;;
    esac
  done
}

page_status() {
  local user state_text
  ui_header "连接状态"
  refresh_state
  user=$(conf_get username)
  if [ "$ONLINE_STATE" = "online" ]; then
    state_text="${GREEN}已认证（外网可达）${RST}"
  else
    state_text="${YELLOW}未认证（外网不可达）${RST}"
  fi
  printf '  账号      %s\n' "${user:-未设置}"
  printf '  运营商    %s\n' "$(op_display)"
  printf '  网络      %s\n' "$state_text"
  printf '  WiFi      %s\n' "$(wifi_display)"
  printf '  配置文件  %s\n' "$CONF_FILE"
  if [ -f "$LOG_FILE" ]; then
    printf '\n  %s最近记录%s\n' "$DIM" "$RST"
    tail -n 5 "$LOG_FILE" 2>/dev/null | sed 's/^/    /'
  fi
  ui_hint "按任意键返回"
  read_key >/dev/null
}

page_autostart() {
  ui_header "开机自启"
  local state
  state=$(autostart_state)
  if [ "$state" = "enabled" ]; then
    printf '  当前状态  %s已开启%s\n' "$GREEN" "$RST"
  else
    printf '  当前状态  %s未开启%s\n' "$YELLOW" "$RST"
  fi
  printf '  启动方式  LaunchAgent · %s\n' "$SERVICE_LABEL"
  printf '\n  Enter %s   Esc 返回\n' "$( [ "$state" = "enabled" ] && printf '关闭' || printf '开启' )"
  read_key || return
  case "$KEY" in
    enter)
      if [ "$state" = "enabled" ]; then
        autostart_uninstall
      else
        autostart_install
      fi
      printf '\n'
      ui_hint "按任意键返回"
      read_key >/dev/null
      ;;
    *) return ;;
  esac
}

page_clear_storage() {
  printf '\033[H\033[2J'
  printf '  %sHackHTU · HTU 校园网一键登录脚本%s\n' "$BOLD$CYAN" "$RST"
  printf '  %sHackHTU 官网：' "$DIM"
  printf '\033]8;;https://hackhtu.pages.dev\033\\https://hackhtu.pages.dev\033]8;;\033\\%s\n\n' "$RST"
  printf '  清理本地存储\n\n'
  printf '  将删除账号、密码和登录日志；不会关闭开机自启。\n'
  printf '  配置目录：%s\n\n' "$CONF_DIR"
  printf '  输入 y 确认删除，其他按键取消：'
  read_key || return
  case "$KEY" in
    y|Y)
      rm -f "$CONF_FILE" "$LOG_FILE"
      LAST_MSG="已清理账号配置和登录日志（开机自启未更改）"
      ;;
    *) LAST_MSG="已取消清理" ;;
  esac
  printf '\n  %s\n' "$LAST_MSG"
  ui_hint "按任意键返回"
  read_key >/dev/null
}

menu_draw() {
  local sel="$1" user
  user=$(conf_get username)
  printf '\033[H\033[2J'
  printf '  %sHackHTU · HTU 校园网一键登录脚本%s  %s%s · v%s%s\n' \
    "$BOLD$CYAN" "$RST" "$DIM" "$PLATFORM" "$VERSION" "$RST"
    printf '  %sHackHTU 官网：' "$DIM"
    printf '\033]8;;https://hackhtu.pages.dev\033\\https://hackhtu.pages.dev\033]8;;\033\\%s\n\n' "$RST"
  draw_items "$sel" "立即登录" "账号配置" "网络诊断" "连接状态" "开机自启" "清理存储" "退出"
  printf '\n  %s──────────────────────────────────────────────%s\n' "$DIM" "$RST"
  printf '  账号      %s\n' "${user:-未设置}"
  printf '  运营商    %s\n' "$(op_display)"
  if [ "$ONLINE_STATE" = "online" ]; then
    printf '  网络      %s已认证%s\n' "$GREEN" "$RST"
  elif [ "$ONLINE_STATE" = "offline" ]; then
    printf '  网络      %s未认证%s\n' "$YELLOW" "$RST"
  else
    printf '  网络      %s检测中%s\n' "$DIM" "$RST"
  fi
  printf '  WiFi      %s\n' "${WIFI_STATE:-未知}"
  printf '  开机自启  %s\n' "$(state_label "$(autostart_state)")"
  printf '  %s──────────────────────────────────────────────%s\n' "$DIM" "$RST"
  printf '  %s↑↓ 移动   Enter 确认   q 退出%s\n' "$DIM" "$RST"
}

page_diag() {
  ui_header "网络诊断"
  printf '  %s正在检测，最多需要半分钟…%s\n\n' "$DIM" "$RST"
  cmd_doctor
  ui_hint "按任意键返回"
  read_key >/dev/null
}

page_wifi() {
  local sel=0 auto
  while :; do
    auto=$(conf_get wifi_auto)
    [ "$auto" = "off" ] || auto=on
    ui_header "WiFi 设置"
    draw_items "$sel" \
      "$( [ "$auto" = "on" ] && printf '自动连接：已开启' || printf '自动连接：已关闭' )" \
      "编辑网络名称" "立即连接一次" "返回"
    printf '\n  当前网络  %s\n' "$(wifi_display)"
    printf '  名称列表  %s\n' "$(wifi_names)"
    printf '  说明      未认证时先连上校园 WiFi 再走门户登录；公开网络不需要密码。\n'
    printf '            名称按去掉符号后比较，Htu_AuteWiFi / htu-autowifi 视为同一个。\n'
    ui_hint "↑↓ 选择   Enter 确认   Esc 返回"
    read_key || return
    case "$KEY" in
      up|k) sel=$(((sel + 3) % 4)) ;;
      down|j) sel=$(((sel + 1) % 4)) ;;
      enter)
        case "$sel" in
          0)
            if [ "$auto" = "on" ]; then
              conf_set wifi_auto off
            else
              conf_set wifi_auto on
            fi
            ;;
          1)
            if ui_prompt "网络名称（逗号分隔）" "$(conf_get wifi_names)" 0; then
              [ -n "$PROMPT_VALUE" ] && conf_set wifi_names "$PROMPT_VALUE"
            fi
            ;;
          2)
            if wifi_ensure; then
              LAST_MSG="WiFi：已连接 $(wifi_display)"
            else
              LAST_MSG="WiFi：没连上 ${WIFI_STATE:-校园网}"
            fi
            printf '\n  %s\n' "$LAST_MSG"
            ui_hint "按任意键返回"
            read_key >/dev/null
            ;;
          3) return ;;
        esac
        refresh_state
        ;;
      esc|q) return ;;
    esac
  done
}

main_tui() {
  if [ ! -t 0 ] || [ ! -t 1 ]; then
    printf '当前不是交互式终端，请使用 login / status / install\n' >&2
    return 1
  fi
  local sel=0
  ui_begin
  refresh_state
  while :; do
    menu_draw "$sel"
    read_key || break
    case "$KEY" in
      up|k) sel=$(((sel + 6) % 7)) ;;
      down|j) sel=$(((sel + 1) % 7)) ;;
      enter)
        case "$sel" in
          0) page_login ;;
          1) page_config ;;
          2) page_diag ;;
          3) page_status ;;
          4) page_autostart ;;
          5) page_clear_storage ;;
          6) break ;;
        esac
        refresh_state
        ;;
      q|Q) break ;;
    esac
  done
  ui_end
}

# ---------------------------------------------------------------- 命令行

cmd_login() {
  if login_once; then
    printf '%s\n' "$LAST_MSG"
  else
    printf '失败：%s\n' "$LAST_MSG" >&2
    return 1
  fi
}

cmd_watch() {
  trap 'exit 0' INT TERM
  while :; do
    if ! is_online; then
      log_line "检测到未认证，开始登录"
      login_once >/dev/null 2>&1 || true
    fi
    sleep 60
  done
}

cmd_status() {
  refresh_state
  printf '账号　　%s\n' "$(conf_get username)"
  printf '运营商　%s\n' "$(op_display)"
  printf '网络　　%s\n' "$( [ "$ONLINE_STATE" = "online" ] && printf '已认证' || printf '未认证' )"
  printf 'WiFi　　%s\n' "$(wifi_display)"
  printf '配置　　%s\n' "$CONF_FILE"
  printf '自启　　%s\n' "$(state_label "$(autostart_state)")"
}

# 登录失败时先跑这个：看清是外网不通、还是门户没跳转、还是认证接口取不到。
cmd_doctor() {
  local url dump status loc portal
  printf '平台　　%s %s\n' "$PLATFORM" "$VERSION"
  printf '配置　　%s\n' "$CONF_FILE"
  if is_online; then
    printf '外网　　可达\n'
  else
    printf '外网　　不可达（未认证）\n'
  fi
  printf 'WiFi　　%s（网卡 %s）\n' "$(wifi_display)" "$(wifi_iface 2>/dev/null || printf '无')"
  printf '\n跳转探测：\n'
  for url in $CAPTIVE_URLS; do
    dump=$(captive_dump "$url")
    if [ -z "$dump" ]; then
      printf '  %-56s 无响应\n' "$url"
      continue
    fi
    status=$(printf '%s' "$dump" | tr -d '\r' \
      | sed -nE 's#^HTTP/[0-9.]+[[:space:]]+([0-9]+).*#\1#p' | head -n 1)
    loc=$(printf '%s' "$dump" | tr -d '\r' \
      | sed -nE 's/^[Ll]ocation:[[:space:]]*//p' | grep -i 'portal\.do' | head -n 1)
    printf '  %-56s %s %s\n' "$url" "${status:-?}" "${loc:--}"
  done

  printf '\n门户发现：\n'
  portal=$(find_portal)
  if [ -z "$portal" ]; then
    printf '  未拿到 portal.do（未认证时会跳转；已认证时属正常）\n'
    return 1
  fi
  printf '  %s\n' "$portal"
  if discover; then
    printf '  认证接口  %s\n' "$DISC_AUTH"
    printf '  密码校验  %s\n' "$DISC_CHECK"
    printf '  campus    %s\n' "$DISC_CAMPUS"
  fi
}

case "${1:-tui}" in
  tui) main_tui ;;
  login) cmd_login ;;
  watch) cmd_watch ;;
  install) autostart_install ;;
  uninstall) autostart_uninstall ;;
  status) cmd_status ;;
  doctor|diag) cmd_doctor ;;
  -h|--help|help) usage ;;
  *)
    usage
    exit 1
    ;;
esac
