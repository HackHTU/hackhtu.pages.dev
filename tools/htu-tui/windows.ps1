# htu-tui —— 河南师范大学校园网 TUI（Windows 版）
#
# 零依赖：只用 Windows PowerShell 5.1、系统自带 curl.exe 和当前用户启动项。
# 用法：
#   .\windows.ps1            打开 TUI
#   .\windows.ps1 login      单次登录（自启用）
#   .\windows.ps1 watch      常驻，断线自动重连
#   .\windows.ps1 install    安装开机自启（当前用户启动项）
#   .\windows.ps1 uninstall  卸载开机自启
#   .\windows.ps1 status     打印当前状态

param(
  [Parameter(Position = 0)]
  [string]$Command = 'tui'
)

$ErrorActionPreference = 'Stop'

$Version = '1.1.6'
$Platform = 'windows'
$AppName = 'htu-tui'

$ConfDir = Join-Path $env:APPDATA $AppName
$ConfFile = Join-Path $ConfDir 'config'
$LogFile = Join-Path $ConfDir 'login.log'
$LaunchVbs = Join-Path $ConfDir 'launch.vbs'
$ScriptPath = $MyInvocation.MyCommand.Path

$Esc = [char]27
$Curl = Join-Path $env:SystemRoot 'System32\curl.exe'
$RunKey = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run'
$RunValueName = 'HTUCampusNetLogin'

$PortalOrigin = 'http://10.101.2.194:6060'
$ProbeUrl = 'http://www.msftconnecttest.com/connecttest.txt'
$ProbeMark = 'Microsoft Connect Test'
$ProbeUrlAlt = 'http://captive.apple.com/hotspot-detect.html'
$ProbeMarkAlt = 'Success'
$HttpUa = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'
# 网关根地址最稳：直接问网关要跳转，不依赖 DNS 和外网。
$CaptiveUrls = @(
  'http://10.101.2.194:6060/'
  'http://10.101.2.194:6060/portal.do'
  'http://www.qq.com/'
  'http://connectivitycheck.gstatic.com/generate_204'
  'http://www.baidu.com/'
  'http://captive.apple.com/hotspot-detect.html'
  'http://www.msftconnecttest.com/connecttest.txt'
  'http://192.168.0.1/'
)

# 动态发现失败时的兜底（与 alsjddsg/HTU_Network_Auto_Login 抓包值一致）
$FallbackAuthUrl = 'http://10.101.2.205:8081/aaa-auth/api/v1/auth'
$FallbackCheckUrl = 'http://10.101.2.239:8081/user/check-only'
$FallbackCampusCode = '3def184ad8f4755ff269862ea77393dd,1afa34a7f984eeabdbb0a7d494132ee5,65ded5353c5ee48d0b7d48c591b8f430,fc512637643a493799a7073e4bad6cf8'

# 校园 WiFi：未认证时先连上它，再走门户登录。公开网络，不需要密码。
# 广播名称可能带大小写/下划线/2.4G 后缀，匹配时统一去掉非字母数字。
$DefaultWifiNames = @('Htu_AuteWiFi', 'Htu_AuteWiFi_2.4G', 'HTU_AutoWiFi', 'HTU_AutoWiFi_2.4G')

$Script:LastMsg = ''
$Script:OnlineState = 'unknown'
$Script:LastFrameLines = 0

$DiscRoot = ''
$DiscQuery = ''
$DiscAuth = ''
$DiscCheck = ''
$DiscCampus = ''

try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }

# ---------------------------------------------------------------- 基础工具

function Show-Usage {
  Write-Output @'
HTU 校园网 TUI

  .\windows.ps1            打开界面
  .\windows.ps1 login      单次登录
  .\windows.ps1 watch      常驻并断线重连
  .\windows.ps1 install    安装开机自启
  .\windows.ps1 uninstall  卸载开机自启
  .\windows.ps1 status     打印状态
  .\windows.ps1 doctor     网络诊断（登录失败时先跑这个）
'@
}

function Write-AppLog([string]$Message) {
  try {
    if (-not (Test-Path $ConfDir)) {
      New-Item -ItemType Directory -Force -Path $ConfDir | Out-Null
    }
    $line = '{0} {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
    Add-Content -LiteralPath $LogFile -Value $line -Encoding UTF8
  } catch { }
}

function Get-Conf([string]$Key) {
  if (-not (Test-Path $ConfFile)) { return '' }
  foreach ($line in Get-Content -LiteralPath $ConfFile -Encoding UTF8) {
    if ($line -like "$Key=*") { return $line.Substring($Key.Length + 1) }
  }
  return ''
}

function Set-Conf([string]$Key, [string]$Value) {
  $map = [ordered]@{}
  if (Test-Path $ConfFile) {
    foreach ($line in Get-Content -LiteralPath $ConfFile -Encoding UTF8) {
      $i = $line.IndexOf('=')
      if ($i -gt 0) { $map[$line.Substring(0, $i)] = $line.Substring($i + 1) }
    }
  }
  $map[$Key] = $Value
  if (-not (Test-Path $ConfDir)) {
    New-Item -ItemType Directory -Force -Path $ConfDir | Out-Null
  }
  $out = foreach ($k in $map.Keys) { '{0}={1}' -f $k, $map[$k] }
  Set-Content -LiteralPath $ConfFile -Value $out -Encoding UTF8
  try {
    $acl = Get-Acl -LiteralPath $ConfFile
    $acl.SetAccessRuleProtection($true, $false)
    foreach ($rule in @($acl.Access)) { [void]$acl.RemoveAccessRule($rule) }
    $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
      $identity, 'FullControl', 'Allow'
    )
    [void]$acl.AddAccessRule($accessRule)
    Set-Acl -LiteralPath $ConfFile -AclObject $acl
  } catch { }
}

function Get-OpSuffix([string]$Operator) {
  switch ($Operator) {
    'yd' { return '@yd' }
    'lt' { return '@lt' }
    'dx' { return '@dx' }
    'hsd' { return '@hsd' }
    default { return '@hsd' }
  }
}

function Get-OpLabel([string]$Operator) {
  switch ($Operator) {
    'yd' { return '中国移动' }
    'lt' { return '中国联通' }
    'dx' { return '中国电信' }
    'hsd' { return '校园直连' }
    default { return '未设置' }
  }
}

function Get-OpDisplay([string]$Operator) {
  if (-not $Operator) { return '未设置' }
  return "$(Get-OpLabel $Operator) $(Get-OpSuffix $Operator)"
}

function Get-AutostartLabel {
  if ((Get-AutostartState) -eq 'enabled') { return '已开启' }
  return '未开启'
}

# ---------------------------------------------------------------- 网络

# 统一走 curl.exe：Windows 10 1803+ 自带，--connect-timeout/--max-time 是硬超时。
# PowerShell 5.1 的 Invoke-WebRequest -TimeoutSec 不能可靠限制连接阶段，断网时会长时间卡住。
function Invoke-CurlText {
  param(
    [string]$Url,
    [string[]]$Headers = @(),
    [string[]]$Data = @(),
    [string]$Method = 'GET',
    [int]$MaxTime = 12
  )

  if (-not (Test-Path $Curl)) {
    throw '未找到 curl.exe，需要 Windows 10 1803 或更高版本'
  }

  $curlArgs = @(
    '--silent', '--show-error', '--location',
    '--noproxy', '*',
    '--connect-timeout', '3',
    '--max-time', [string]$MaxTime,
    '--user-agent', $HttpUa
  )
  if ($Method -ne 'GET') { $curlArgs += @('--request', $Method) }
  foreach ($header in $Headers) { $curlArgs += @('--header', $header) }
  foreach ($item in $Data) { $curlArgs += @('--data-urlencode', $item) }
  $curlArgs += $Url

  $output = & $Curl @curlArgs 2>$null
  if ($LASTEXITCODE -ne 0) { return $null }
  return ($output -join "`n")
}

function Test-Online([int]$MaxTime = 6) {
  try {
    $body = Invoke-CurlText -Url $ProbeUrl -MaxTime $MaxTime
    if ($body -like "*$ProbeMark*") { return $true }
    $body = Invoke-CurlText -Url $ProbeUrlAlt -MaxTime $MaxTime
    return ($body -like "*$ProbeMarkAlt*")
  } catch {
    return $false
  }
}

function Get-PortalFromText([string]$Text) {
  if (-not $Text) { return '' }
  $m = [regex]::Match($Text, 'https?://[^\s"''<>]*portal\.do[^\s"''<>]*')
  if ($m.Success) { return $m.Value }
  $m = [regex]::Match($Text, '(?i)["''](/{1,2}[^"'']*portal\.do[^"'']*)["'']')
  if ($m.Success) { return $m.Groups[1].Value }
  $m = [regex]::Match($Text, 'location\.replace\(\s*["'']([^"'']+)["'']')
  if ($m.Success) { return $m.Groups[1].Value }
  return ''
}

# 未认证时访问普通网页会被 302 到 portal.do?...；不跟随跳转，才能拿到 wlanuserip 等参数。
function Resolve-Url([string]$Origin, [string]$Location) {
  if (-not $Location) { return '' }
  if ($Location -match '^(?i)https?://') { return $Location }
  try { $u = [uri]$Origin } catch { return $Location }
  if ($Location.StartsWith('//')) { return ('{0}:{1}' -f $u.Scheme, $Location) }
  if ($Location.StartsWith('/')) {
    return ('{0}://{1}{2}' -f $u.Scheme, $u.Authority, $Location)
  }
  return $Location
}

function Find-PortalUrl {
  if (-not (Test-Path $Curl)) { return '' }
  foreach ($url in $CaptiveUrls) {
    $raw = & $Curl --silent --show-error --include --location --max-redirs 3 --ipv4 `
      --noproxy '*' --connect-timeout 4 --max-time 8 --user-agent $HttpUa $url 2>$null
    if (-not $raw) { continue }
    $text = ($raw -join "`n")
    $m = [regex]::Match($text, '(?im)^Location:\s*(\S+)')
    if ($m.Success) {
      $loc = Resolve-Url $url ($m.Groups[1].Value.Trim())
      if ($loc -like '*portal.do*') { return $loc }
    }
    $portal = Get-PortalFromText $text
    if ($portal) { return (Resolve-Url $url $portal) }
  }
  return ''
}

# 动态发现：普通网页 302 -> portal.do -> js/common.js -> authApiUrl / authSchoolCodes
# ---------------------------------------------------------------- 校园 WiFi

function Get-WifiSsid {
  try {
    $out = & netsh wlan show interfaces 2>$null
    foreach ($line in $out) {
      if ($line -match '^\s*SSID\s*:\s*(.+?)\s*$') { return $matches[1] }
    }
  } catch { }
  return ''
}

function Get-WifiNames {
  $names = Get-Conf 'wifi_names'
  if ($names) {
    $list = @($names -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    if ($list.Count -gt 0) { return $list }
  }
  return $DefaultWifiNames
}

# Htu_AuteWiFi / HTU-AUTO-WIFI / htu_autowifi_2.4G 都算同一个名字。
function Get-WifiNorm([string]$Name) {
  if (-not $Name) { return '' }
  return ($Name -replace '[^0-9A-Za-z]', '').ToLower()
}

function Test-CampusWifi([string]$Name) {
  $n = Get-WifiNorm $Name
  if (-not $n) { return $false }
  if ($n -like 'htuautewifi*' -or $n -like 'htuautowifi*') { return $true }
  foreach ($item in (Get-WifiNames)) {
    if ($n -eq (Get-WifiNorm $item)) { return $true }
  }
  return $false
}

function Get-WifiDisplay {
  $ssid = Get-WifiSsid
  if ($ssid) { return $ssid }
  return '未关联'
}

# 公开网络不需要密码；配置了 wifi_password 则按 WPA2 生成 profile。
function New-WifiProfileXml([string]$Ssid, [string]$Key) {
  $name = [System.Security.SecurityElement]::Escape($Ssid)
  $security = '<MSM><security><authEncryption><authentication>open</authentication><encryption>none</encryption><useOneX>false</useOneX></authEncryption></security></MSM>'
  if ($Key) {
    $secret = [System.Security.SecurityElement]::Escape($Key)
    $security = '<MSM><security><authEncryption><authentication>WPA2PSK</authentication><encryption>AES</encryption><useOneX>false</useOneX></authEncryption><sharedKey><keyType>passPhrase</keyType><protected>false</protected><keyMaterial>' + $secret + '</keyMaterial></sharedKey></security></MSM>'
  }
  return '<?xml version="1.0" encoding="UTF-8"?>' + "`n" +
    '<WLANProfile xmlns="http://www.microsoft.com/networking/WLAN/profile/v1">' + "`n" +
    "  <name>$name</name>" + "`n" +
    "  <SSIDConfig><SSID><name>$name</name></SSID></SSIDConfig>" + "`n" +
    '  <connectionType>ESS</connectionType>' + "`n" +
    '  <connectionMode>auto</connectionMode>' + "`n" +
    "  $security" + "`n" +
    '</WLANProfile>'
}

function Test-WifiProfile([string]$Ssid) {
  try {
    $out = & netsh wlan show profiles 2>$null
    foreach ($line in $out) {
      if ($line -match ':\s*(.+?)\s*$') {
        if ($matches[1].Trim() -ieq $Ssid) { return $true }
      }
    }
  } catch { }
  return $false
}

function Connect-CampusWifi {
  $current = Get-WifiSsid
  if ($current -and (Test-CampusWifi $current)) { return $true }

  $key = Get-Conf 'wifi_password'
  foreach ($ssid in (Get-WifiNames)) {
    if (-not (Test-WifiProfile $ssid)) {
      $tmp = Join-Path $env:TEMP ('htu-wifi-' + [guid]::NewGuid().ToString('N') + '.xml')
      try {
        [System.IO.File]::WriteAllText($tmp, (New-WifiProfileXml $ssid $key))
        & netsh wlan add profile filename="$tmp" user=current 2>$null | Out-Null
      } catch { } finally {
        Remove-Item -LiteralPath $tmp -ErrorAction SilentlyContinue
      }
    }
    try { & netsh wlan connect name="$ssid" ssid="$ssid" 2>$null | Out-Null } catch { }
    Start-Sleep -Seconds 3
    $current = Get-WifiSsid
    if ($current -and (Test-CampusWifi $current)) {
      Write-AppLog "WiFi：已连接 $current"
      return $true
    }
  }

  Write-AppLog "WiFi：没连上校园网（当前 $(Get-WifiDisplay)）"
  return $false
}

function Invoke-Discover {
  $script:DiscRoot = ''
  $script:DiscQuery = ''
  $script:DiscAuth = ''
  $script:DiscCheck = ''
  $script:DiscCampus = ''

  $portal = Find-PortalUrl
  if (-not $portal) { return $false }
  Write-AppLog "门户地址：$portal"

  try {
    $u = [uri]$portal
    $script:DiscRoot = '{0}://{1}' -f $u.Scheme, $u.Authority
    $script:DiscQuery = $u.Query.TrimStart('?')
  } catch { return $false }
  if (-not $DiscQuery) { return $false }

  try { $html = Invoke-CurlText -Url $portal -MaxTime 6 } catch { return $false }
  if (-not $html) { return $false }

  $m = [regex]::Match($html, 'src=["'']([^"'']*common\.js[^"'']*)')
  if (-not $m.Success) { return $false }
  $src = $m.Groups[1].Value
  $base = ''
  $bm = [regex]::Match($html, '<base[^>]*href=["'']([^"'']+)')
  if ($bm.Success) { $base = $bm.Groups[1].Value }

  if ($src -match '^https?://') {
    $full = $src
  } else {
    $baseUrl = $DiscRoot + '/'
    if ($base) {
      if ($base -match '^https?://') { $baseUrl = $base }
      elseif ($base.StartsWith('/')) { $baseUrl = $DiscRoot + $base }
      else { $baseUrl = $DiscRoot + '/' + $base }
    }
    if (-not $baseUrl.EndsWith('/')) {
      $baseUrl = $baseUrl.Substring(0, $baseUrl.LastIndexOf('/') + 1)
    }
    if ($src.StartsWith('/')) { $full = $DiscRoot + $src }
    else {
      if ($src.StartsWith('./')) { $src = $src.Substring(2) }
      $full = $baseUrl + $src
    }
  }
  Write-AppLog "配置脚本：$full"

  try { $js = Invoke-CurlText -Url $full -MaxTime 6 } catch { return $false }
  if (-not $js) { return $false }

  $m = [regex]::Match($js, 'authApiUrl\s*=\s*[''"](https?://[^''"]+)[''"]')
  if ($m.Success) {
    $script:DiscAuth = $m.Groups[1].Value
  } else {
    $api = ''
    $am = [regex]::Match($js, '(?:const|var|let)\s+API\s*=\s*[''"]([^''"]+)[''"]')
    if ($am.Success) { $api = $am.Groups[1].Value }
    $path = '/api/v1/auth'
    $pm = [regex]::Match($js, 'authApiUrl\s*=\s*API\s*\+\s*[''"]([^''"]+)[''"]')
    if ($pm.Success) { $path = $pm.Groups[1].Value }
    if ($api) { $script:DiscAuth = $api + $path }
  }
  $m = [regex]::Match($js, 'authSchoolCodes\s*=\s*[''"]([^''"]+)[''"]')
  if ($m.Success) { $script:DiscCampus = $m.Groups[1].Value }
  $m = [regex]::Match($js, 'checkApiUrl\s*=\s*[''"]([^''"]+)[''"]')
  if ($m.Success) { $script:DiscCheck = $m.Groups[1].Value }

  return ($DiscAuth -ne '')
}

function Invoke-Login {
  $user = Get-Conf 'username'
  $pass = Get-Conf 'password'
  $op = Get-Conf 'operator'
  $suffix = Get-OpSuffix $op

  if (-not $user -or -not $pass) {
    $Script:LastMsg = '账号或密码未配置'
    Write-AppLog "失败：$($Script:LastMsg)"
    return $false
  }

  if (Test-Online) {
    $Script:LastMsg = '已经在线，无需登录'
    Write-AppLog $Script:LastMsg
    return $true
  }

  # 未认证先确保连的是校园 WiFi；没有无线网卡或已连好时保持原样。
  if ((Get-Conf 'wifi_auto') -ne 'off') {
    Connect-CampusWifi | Out-Null
  }

  $origin = $PortalOrigin
  $check = $FallbackCheckUrl
  if (Invoke-Discover) {
    $auth = $DiscAuth
    $campus = $DiscCampus
    if ($DiscCheck) { $check = $DiscCheck }
    if (-not $campus) { $campus = $FallbackCampusCode }
    if ($DiscRoot) { $origin = $DiscRoot }
    Write-AppLog "认证接口：$auth"
  } else {
    $auth = $FallbackAuthUrl
    $campus = $FallbackCampusCode
    Write-AppLog '动态发现失败，改用内置接口'
  }

  $headers = @(
    "Origin: $origin"
    "Referer: $origin/"
    'Accept: */*'
    "User-Agent: $HttpUa"
  )
  $data = @(
    "campusCode=$campus"
    "username=$user"
    "password=$pass"
    "operatorSuffix=$suffix"
  )
  Write-AppLog "运营商后缀：$suffix"

  try {
    $resp = Invoke-CurlText -Url $auth -Headers $headers -Data $data -Method POST -MaxTime 12
  } catch {
    $Script:LastMsg = "认证失败：$($_.Exception.Message)"
    Write-AppLog "失败：$($Script:LastMsg)"
    return $false
  }

  $userid = "$user$suffix"
  $json = $null
  if ($resp) {
    try { $json = $resp | ConvertFrom-Json } catch { }
  }
  if ($json) {
    Write-AppLog "认证结果：code=$($json.code) msg=$($json.msg)"
    if ($json.data -and [string]$json.data -like '*@*') {
      $userid = [string]$json.data
    }
  } else {
    Write-AppLog '认证接口无有效返回，继续密码校验'
  }

  $checkData = @(
    "username=$user"
    "password=$pass"
    "operatorSuffix=$suffix"
  )
  try {
    $checkResp = Invoke-CurlText -Url $check -Headers $headers -Data $checkData -Method POST -MaxTime 8
  } catch { $checkResp = $null }
  $checkJson = $null
  if ($checkResp) {
    try { $checkJson = $checkResp | ConvertFrom-Json } catch { }
  }
  if ($checkJson) {
    Write-AppLog "密码校验：code=$($checkJson.code) msg=$($checkJson.msg)"
    $checkCode = [string]$checkJson.code
    if ($checkCode -and $checkCode -ne '1' -and $checkCode -ne '-1') {
      $reason = $checkJson.msg
      if (-not $reason) { $reason = '账号或密码错误' }
      $Script:LastMsg = $reason
      Write-AppLog "失败：$($Script:LastMsg)"
      return $false
    }
  }

  if ($DiscRoot -and $DiscQuery) {
    $uid = [uri]::EscapeDataString($userid)
    $pwd = [uri]::EscapeDataString($pass)
    $parts = @()
    if ($DiscQuery) { $parts += $DiscQuery }
    $parts += "userid=$uid"
    $parts += "passwd=$pwd"
    $quickUrl = "$DiscRoot/quickauth.do?" + ($parts -join '&')

    try {
      $quick = Invoke-CurlText -Url $quickUrl -MaxTime 8
      $quickCode = ''
      $quickMatch = [regex]::Match($quick, '"code"\s*:\s*"?([^",}]+)"?')
      if ($quickMatch.Success) { $quickCode = $quickMatch.Groups[1].Value }
      $quickMsg = ''
      $quickMsgMatch = [regex]::Match($quick, '"message"\s*:\s*"([^"]*)"')
      if ($quickMsgMatch.Success) { $quickMsg = $quickMsgMatch.Groups[1].Value }
      if (-not $quickMsg) {
        $quickMsgMatch = [regex]::Match($quick, '"msg"\s*:\s*"([^"]*)"')
        if ($quickMsgMatch.Success) { $quickMsg = $quickMsgMatch.Groups[1].Value }
      }
      Write-AppLog "quickauth：code=$quickCode msg=$quickMsg"
      if ($quickCode -eq '0') {
        $Script:LastMsg = '登录成功'
        Write-AppLog $Script:LastMsg
        return $true
      }
    } catch { }
  }

  # 认证接口返回成功后，校园网放行可能有一两秒延迟，多探测几次再判定失败。
  for ($attempt = 0; $attempt -lt 8; $attempt++) {
    if (Test-Online 3) {
      $Script:LastMsg = '登录成功'
      Write-AppLog $Script:LastMsg
      return $true
    }
    if ($attempt -lt 7) { Start-Sleep -Milliseconds 1500 }
  }

  if (-not $DiscQuery) {
    $Script:LastMsg = '没有拿到门户跳转地址，登录没走完（先在浏览器打开任意网页再试）'
  } else {
    $Script:LastMsg = '认证已提交，但外网仍不可达'
  }
  Write-AppLog "失败：$($Script:LastMsg)"
  return $false
}

# ---------------------------------------------------------------- 开机自启

# 登录失败时先跑这个：看清是外网不通、还是门户没跳转、还是认证接口取不到。
function Invoke-Doctor {
  Write-Output "平台　　$Platform $Version"
  Write-Output "配置　　$ConfFile"
  if (Test-Online) {
    Write-Output '外网　　可达'
  } else {
    Write-Output '外网　　不可达（未认证）'
  }
  Write-Output "WiFi　　$(Get-WifiDisplay)"
  Write-Output ''
  Write-Output '跳转探测：'
  foreach ($url in $CaptiveUrls) {
    $raw = @()
    try { $raw = & $Curl --silent --show-error --include --location --max-redirs 3 --ipv4 --noproxy '*' --connect-timeout 4 --max-time 8 --user-agent $HttpUa $url 2>$null } catch { }
    if (-not $raw) { Write-Output ("  {0,-56} 无响应" -f $url); continue }
    $text = ($raw -join "`n")
    $status = '?'
    $sm = [regex]::Match($text, '(?m)^HTTP/[0-9.]+\s+([0-9]+)')
    if ($sm.Success) { $status = $sm.Groups[1].Value }
    $loc = '-'
    $lm = [regex]::Match($text, '(?im)^Location:\s*(\S+)')
    if ($lm.Success -and $lm.Groups[1].Value -like '*portal.do*') { $loc = $lm.Groups[1].Value.Trim() }
    Write-Output ("  {0,-56} {1} {2}" -f $url, $status, $loc)
  }
  Write-Output ''
  Write-Output '门户发现：'
  $portal = Find-PortalUrl
  if (-not $portal) {
    Write-Output '  未拿到 portal.do（未认证时会跳转；已认证时属正常）'
    return
  }
  Write-Output "  $portal"
  if (Invoke-Discover) {
    Write-Output "  认证接口  $DiscAuth"
    Write-Output "  密码校验  $DiscCheck"
    Write-Output "  campus    $DiscCampus"
  }
}

function Get-AutostartState {
  try {
    $value = (Get-ItemProperty -Path $RunKey -Name $RunValueName -ErrorAction Stop).$RunValueName
    if ($value) { return 'enabled' }
    return 'disabled'
  } catch {
    return 'disabled'
  }
}

# 停止由本脚本启动的 watch（含旧的计划任务），避免卸载后继续后台登录。
function Stop-WatchProcess {
  try {
    Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" -ErrorAction Stop |
      Where-Object { $_.CommandLine -and $_.CommandLine -like "*$ScriptPath*watch*" } |
      ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  } catch { }
  try {
    Get-CimInstance Win32_Process -Filter "Name = 'wscript.exe'" -ErrorAction Stop |
      Where-Object { $_.CommandLine -and $_.CommandLine -like "*$LaunchVbs*" } |
      ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
  } catch { }
}

# 当前用户的 Run 启动项：不需要管理员权限，登录后由 wscript 静默拉起 watch。
function Install-Autostart {
  if (-not (Test-Path $ConfDir)) {
    New-Item -ItemType Directory -Force -Path $ConfDir | Out-Null
  }

  # 旧版本用计划任务，升级后清理掉，避免两个 watch 同时运行。
  try { Unregister-ScheduledTask -TaskName $RunValueName -Confirm:$false -ErrorAction Stop } catch { }
  Stop-WatchProcess

  $vbs = @"
Set shell = CreateObject("WScript.Shell")
Do
  shell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""$ScriptPath"" watch", 0, True
  WScript.Sleep 30000
Loop
"@
  [System.IO.File]::WriteAllText($LaunchVbs, $vbs, [System.Text.Encoding]::Unicode)

  $command = '"{0}" "{1}"' -f (Join-Path $env:SystemRoot 'System32\wscript.exe'), $LaunchVbs
  Set-ItemProperty -Path $RunKey -Name $RunValueName -Value $command
  Write-Output '已开启开机自启（当前用户登录启动，无需管理员）'
}

function Uninstall-Autostart {
  try {
    Remove-ItemProperty -Path $RunKey -Name $RunValueName -ErrorAction Stop
    Write-Output '已关闭开机自启'
  } catch {
    Write-Output '未找到启动项，可能已经删除'
  }
  try { Unregister-ScheduledTask -TaskName $RunValueName -Confirm:$false -ErrorAction Stop } catch { }
  Stop-WatchProcess
  Remove-Item -LiteralPath $LaunchVbs -Force -ErrorAction SilentlyContinue
}

# ---------------------------------------------------------------- TUI 底层

function Get-DisplayWidth([string]$Text) {
  $width = 0
  if (-not $Text) { return 0 }
  $esc = [char]27
  $Text = [regex]::Replace($Text, "$esc\][^$esc]*$esc\\", '')
  foreach ($ch in $Text.ToCharArray()) {
    if ([int]$ch -ge 0x1100) { $width += 2 } else { $width += 1 }
  }
  return $width
}

# 逐行定位、不写换行：控制台窗口较矮时也不会滚动，避免结果页停在“正在认证”。
function Write-Screen {
  param(
    [string[]]$Lines,
    [int]$Highlight = -1
  )

  $width = 80
  $height = 30
  try {
    $width = [Console]::WindowWidth
    $height = [Console]::WindowHeight
  } catch { }
  if ($width -lt 2) { $width = 80 }
  if ($height -lt 2) { $height = 30 }

  $count = [Math]::Min($Lines.Count, $height)
  $clearTo = [Math]::Min([Math]::Max($Script:LastFrameLines, $count), $height)

  for ($i = 0; $i -lt $clearTo; $i++) {
    if ($i -lt $count) {
      $line = $Lines[$i]
      $pad = [Math]::Max(0, $width - 1 - (Get-DisplayWidth $line))
      $text = $line + (' ' * $pad)
    } else {
      $text = ' ' * [Math]::Max(0, $width - 1)
    }

    try { [Console]::SetCursorPosition(0, $i) } catch { }
    try {
      if ($i -eq $Highlight) {
        [Console]::ForegroundColor = [ConsoleColor]::Cyan
        [Console]::Write($text)
        [Console]::ResetColor()
      } else {
        [Console]::Write($text)
      }
    } catch { }
  }

  $Script:LastFrameLines = $count
}

function New-HeaderLines([string]$Title) {
  $lines = @()
  $lines += "  HackHTU · HTU 校园网一键登录脚本    $Platform · v$Version"
  $lines += "  HackHTU 官网：$Esc]8;;https://hackhtu.pages.dev$Esc\https://hackhtu.pages.dev$Esc]8;;$Esc\"
  $lines += ''
  $lines += "  $Title"
  $lines += ''
  return $lines
}

function Read-MenuKey {
  return [Console]::ReadKey($true)
}

function Show-PageLines([string[]]$Lines, [int]$Highlight = -1) {
  Write-Screen -Lines $Lines -Highlight $Highlight
  [void][Console]::ReadKey($true)
}

# ---------------------------------------------------------------- TUI 页面

function Read-Input {
  param(
    [string]$Title,
    [string]$Default,
    [bool]$Secret
  )

  $value = ''
  $CursorVisible = $true
  try { $CursorVisible = [Console]::CursorVisible } catch { }

  while ($true) {
    $lines = New-HeaderLines $Title
    if ($Default) { $lines += "  当前：$Default" } else { $lines += '' }
    $lines += ''

    if ($Secret) { $shown = '*' * $value.Length } else { $shown = $value }
    $lines += "  > $shown"
    $lines += ''
    $lines += '  Enter 确认   Esc 取消   Backspace 删除'

    Write-Screen -Lines $lines
    try {
      [Console]::CursorVisible = $true
      [Console]::SetCursorPosition(4 + $shown.Length, 7)
    } catch { }

    $key = [Console]::ReadKey($true)
    switch ($key.Key) {
      'Enter' { [Console]::CursorVisible = $CursorVisible; return $value }
      'Escape' { [Console]::CursorVisible = $CursorVisible; return $null }
      'Backspace' {
        if ($value.Length -gt 0) { $value = $value.Substring(0, $value.Length - 1) }
      }
      default {
        if ([int]$key.KeyChar -ge 32) { $value += $key.KeyChar }
      }
    }
  }
}

function Show-LoginPage {
  $lines = New-HeaderLines '立即登录'
  $lines += '  正在认证…'
  Write-Screen -Lines $lines

  $ok = Invoke-Login
  $lines = New-HeaderLines '立即登录'
  $lines += ''
  if ($ok) { $lines += "  [OK] $($Script:LastMsg)" }
  else { $lines += "  [失败] $($Script:LastMsg)" }
  $lines += ''
  $lines += '  任意键返回'
    Show-PageLines -Lines $lines

  if ($ok) { $Script:OnlineState = 'online' } else { $Script:OnlineState = Get-OnlineText }
}

function Get-OnlineText {
  if (Test-Online) { return 'online' }
  return 'offline'
}

function Show-OperatorPage {
  $codes = @('yd', 'lt', 'dx', 'hsd')
  $labels = @('中国移动  @yd', '中国联通  @lt', '中国电信  @dx', '校园直连  @hsd')
  $current = Get-Conf 'operator'
  $sel = 0
  for ($i = 0; $i -lt $codes.Count; $i++) {
    if ($codes[$i] -eq $current) { $sel = $i }
  }

  while ($true) {
    $lines = New-HeaderLines '切换运营商'
    $highlight = -1
    for ($i = 0; $i -lt $codes.Count; $i++) {
      $mark = ''
      if ($codes[$i] -eq $current) { $mark = '  <- 当前' }
      if ($i -eq $sel) {
        $lines += "  > $($labels[$i])$mark"
        $highlight = $lines.Count - 1
      } else {
        $lines += "    $($labels[$i])$mark"
      }
    }
    $lines += ''
    $lines += '  ↑↓ 选择   Enter 保存   Esc 或 Q 返回'
    Write-Screen -Lines $lines -Highlight $highlight

    $key = [Console]::ReadKey($true)
    switch ($key.Key) {
      'UpArrow' { $sel = ($sel + 3) % 4 }
      'DownArrow' { $sel = ($sel + 1) % 4 }
      'Enter' {
        Set-Conf 'operator' $codes[$sel]
        return
      }
      'Escape' { return }
      'Q' { return }
    }
    if ($key.Key -eq 'K') { $sel = ($sel + 3) % 4 }
    if ($key.Key -eq 'J') { $sel = ($sel + 1) % 4 }
  }
}

function Show-StatusPage {
  $user = Get-Conf 'username'
  $op = Get-Conf 'operator'
  if (-not $user) { $user = '未设置' }

  $netText = '未认证（外网不可达）'
  if (Test-Online) { $netText = '已认证（外网可达）' }

  $lines = New-HeaderLines '连接状态'
  $lines += "  账号      $user"
  $lines += "  运营商    $(Get-OpDisplay $op)"
  $lines += "  网络      $netText"
  $lines += "  WiFi      $(Get-WifiDisplay)"
  $lines += "  配置文件  $ConfFile"
  $lines += ''
  if (Test-Path $LogFile) {
    $lines += '  最近记录'
    $tail = Get-Content -LiteralPath $LogFile -Tail 5 -Encoding UTF8
    foreach ($line in $tail) { $lines += "    $line" }
  }
  $lines += ''
  $lines += '  任意键返回'
  Show-PageLines -Lines $lines
}

function Show-AutostartPage {
  $state = Get-AutostartState
  $lines = New-HeaderLines '开机自启'
  if ($state -eq 'enabled') { $lines += '  当前状态  已开启' }
  else { $lines += '  当前状态  未开启' }
  $lines += "  启动方式  当前用户登录启动 · 无需管理员"
  $lines += ''
  if ($state -eq 'enabled') { $lines += '  Enter 关闭   Esc 返回' }
  else { $lines += '  Enter 开启   Esc 返回' }
  Write-Screen -Lines $lines

  $key = [Console]::ReadKey($true)
  if ($key.Key -ne 'Enter') { return }

  $result = @()
  if ($state -eq 'enabled') {
    Uninstall-Autostart | ForEach-Object { $result += $_ }
  } else {
    try {
      Install-Autostart | ForEach-Object { $result += $_ }
    } catch {
      $result += "失败：$($_.Exception.Message)"
    }
  }

  $lines = New-HeaderLines '开机自启'
  $lines += ''
  foreach ($line in $result) { $lines += "  $line" }
  $lines += ''
  $lines += '  任意键返回'
  Show-PageLines -Lines $lines
}

function Show-ClearStoragePage {
  $lines = New-HeaderLines '清理本地存储'
  $lines += '  将删除账号、密码和登录日志；不会关闭开机自启。'
  $lines += "  配置目录：$ConfDir"
  $lines += ''
  $lines += '  按 Y 确认删除，其他按键取消'
  Write-Screen -Lines $lines

  $key = [Console]::ReadKey($true)
  if ($key.KeyChar -ne 'y' -and $key.KeyChar -ne 'Y') { return }

  Remove-Item -LiteralPath $ConfFile, $LogFile -Force -ErrorAction SilentlyContinue
  $lines = New-HeaderLines '清理本地存储'
  $lines += '  已清理账号配置和登录日志（开机自启未更改）'
  $lines += ''
  $lines += '  任意键返回'
  Show-PageLines -Lines $lines
}

function New-MenuLines([int]$Sel) {
  $items = @('立即登录', '账号配置', '网络诊断', '连接状态', '开机自启', '清理存储', '退出')
  $user = Get-Conf 'username'
  $op = Get-Conf 'operator'
  if (-not $user) { $user = '未设置' }

  if ($Script:OnlineState -eq 'online') { $net = '已认证' }
  elseif ($Script:OnlineState -eq 'offline') { $net = '未认证' }
  else { $net = '检测中' }

  $lines = @()
  $lines += "  HackHTU · HTU 校园网一键登录脚本    $Platform · v$Version"
  $lines += "  HackHTU 官网：$Esc]8;;https://hackhtu.pages.dev$Esc\https://hackhtu.pages.dev$Esc]8;;$Esc\"
  $lines += ''
  for ($i = 0; $i -lt $items.Count; $i++) {
    if ($i -eq $Sel) { $lines += "  > $($items[$i])" } else { $lines += "    $($items[$i])" }
  }
  $lines += ''
  $lines += '  ------------------------------------------------'
  $lines += "  账号      $user"
  $lines += "  运营商    $(Get-OpDisplay $op)"
  $lines += "  网络      $net"
  $lines += "  WiFi      $(Get-WifiDisplay)"
  $lines += "  开机自启  $(Get-AutostartLabel)"
  $lines += '  ------------------------------------------------'
  $lines += '  ↑↓ 移动   Enter 确认   q 退出'
  return $lines
}

function Show-ConfigPage {
  $sel = 0
  while ($true) {
    $items = @('修改账号', '修改密码', '切换运营商', 'WiFi 设置', '返回')
    $lines = New-HeaderLines '账号配置'
    for ($i = 0; $i -lt $items.Count; $i++) {
      if ($i -eq $sel) { $lines += "  > $($items[$i])" } else { $lines += "    $($items[$i])" }
    }
    $lines += ''
    $lines += "  账号 $(Get-Conf 'username') · 运营商 $(Get-OpLabel (Get-Conf 'operator')) · WiFi $(Get-WifiDisplay)"
    $lines += ''
    $lines += '  ↑↓ 选择   Enter 确认   Esc 或 Q 返回'

    Write-Screen -Lines $lines -Highlight (2 + $sel)
    $key = [Console]::ReadKey($true)

    switch ($key.Key) {
      'UpArrow' { $sel = ($sel + 4) % 5 }
      'DownArrow' { $sel = ($sel + 1) % 5 }
      'Escape' { return }
      'Q' { return }
      'Enter' {
        switch ($sel) {
          0 {
            $value = Read-Input -Title '修改账号' -Default (Get-Conf 'username') -Secret $false
            if ($null -ne $value -and $value -ne '') { Set-Conf 'username' $value }
          }
          1 {
            $value = Read-Input -Title '修改密码' -Default '' -Secret $true
            if ($null -ne $value -and $value -ne '') { Set-Conf 'password' $value }
          }
          2 { Show-OperatorPage }
          3 { Show-WifiPage }
          4 { return }
        }
      }
    }
    if ($key.Key -eq 'K') { $sel = ($sel + 4) % 5 }
    if ($key.Key -eq 'J') { $sel = ($sel + 1) % 5 }
  }
}

function Show-DoctorPage {
  $lines = New-HeaderLines '网络诊断'
  $lines += '  正在检测，最多需要半分钟…'
  Write-Screen -Lines $lines
  $out = @()
  Invoke-Doctor | ForEach-Object { $out += $_ }
  $lines = New-HeaderLines '网络诊断'
  foreach ($line in $out) { $lines += "  $line" }
  $lines += ''
  $lines += '  任意键返回'
  Show-PageLines -Lines $lines
}

function Show-WifiPage {
  $sel = 0
  while ($true) {
    $auto = Get-Conf 'wifi_auto'
    if ($auto -eq 'off') { $autoText = '自动连接：已关闭' } else { $autoText = '自动连接：已开启' }
    $names = (Get-WifiNames) -join '  '
    $items = @($autoText, '编辑网络名称', '立即连接一次', '返回')
    $lines = New-HeaderLines 'WiFi 设置'
    for ($i = 0; $i -lt $items.Count; $i++) {
      if ($i -eq $sel) { $lines += "  > $($items[$i])" } else { $lines += "    $($items[$i])" }
    }
    $lines += ''
    $lines += "  当前网络  $(Get-WifiDisplay)"
    $lines += "  名称列表  $names"
    $lines += '  说明      未认证时先连上校园 WiFi 再走门户登录；公开网络不需要密码。'
    $lines += '            名称按去掉符号后比较，Htu_AuteWiFi / htu-autowifi 视为同一个。'
    $lines += ''
    $lines += '  ↑↓ 选择   Enter 确认   Esc 或 Q 返回'

    Write-Screen -Lines $lines -Highlight (2 + $sel)
    $key = [Console]::ReadKey($true)

    switch ($key.Key) {
      'UpArrow' { $sel = ($sel + 3) % 4 }
      'DownArrow' { $sel = ($sel + 1) % 4 }
      'Escape' { return }
      'Q' { return }
      'Enter' {
        switch ($sel) {
          0 {
            if ($auto -eq 'off') { Set-Conf 'wifi_auto' 'on' } else { Set-Conf 'wifi_auto' 'off' }
          }
          1 {
            $value = Read-Input -Title '网络名称（逗号分隔）' -Default (($names -replace '  ', ',')) -Secret $false
            if ($null -ne $value -and $value -ne '') { Set-Conf 'wifi_names' $value }
          }
          2 {
            $ok = Connect-CampusWifi
            $result = "WiFi：没连上 $(Get-WifiDisplay)"
            if ($ok) { $result = "WiFi：已连接 $(Get-WifiDisplay)" }
            $out = New-HeaderLines 'WiFi 设置'
            $out += ''
            $out += "  $result"
            $out += ''
            $out += '  任意键返回'
            Show-PageLines -Lines $out
          }
          3 { return }
        }
      }
    }
    if ($key.Key -eq 'K') { $sel = ($sel + 3) % 4 }
    if ($key.Key -eq 'J') { $sel = ($sel + 1) % 4 }
  }
}

function Start-Tui {
  $previous = $true
  try {
    $previous = [Console]::CursorVisible
    [Console]::CursorVisible = $false
  } catch { }

  try {
    $Script:OnlineState = Get-OnlineText
    $sel = 0
    while ($true) {
      $lines = New-MenuLines $sel
      Write-Screen -Lines $lines -Highlight (2 + $sel)

      $key = [Console]::ReadKey($true)
      switch ($key.Key) {
        'UpArrow' { $sel = ($sel + 6) % 7 }
        'DownArrow' { $sel = ($sel + 1) % 7 }
        'Enter' {
          switch ($sel) {
            0 { Show-LoginPage }
            1 { Show-ConfigPage }
            2 { Show-DoctorPage }
            3 { Show-StatusPage }
            4 { Show-AutostartPage }
            5 { Show-ClearStoragePage }
            6 { return }
          }
          $Script:OnlineState = Get-OnlineText
        }
        'Q' { return }
        'Escape' { return }
      }
      if ($key.Key -eq 'K') { $sel = ($sel + 6) % 7 }
      if ($key.Key -eq 'J') { $sel = ($sel + 1) % 7 }
    }
  } finally {
    try {
      [Console]::CursorVisible = $previous
      [Console]::SetCursorPosition(0, [Console]::CursorTop)
    } catch { }
  }
}

# ---------------------------------------------------------------- 入口

switch ($Command.ToLower()) {
  'tui' {
    try {
      Start-Tui
    } catch {
      Write-Output "界面启动失败：$($_.Exception.Message)"
      exit 1
    }
  }
  'login' {
    if (Invoke-Login) {
      Write-Output $Script:LastMsg
      exit 0
    }
    Write-Output "失败：$($Script:LastMsg)"
    exit 1
  }
  'watch' {
    while ($true) {
      if (-not (Test-Online)) {
        Write-AppLog '检测到未认证，开始登录'
        Invoke-Login | Out-Null
      }
      Start-Sleep -Seconds 60
    }
  }
  'install' {
    try {
      Install-Autostart
      exit 0
    } catch {
      Write-Output "安装失败：$($_.Exception.Message)"
      exit 1
    }
  }
  'uninstall' {
    Uninstall-Autostart
    exit 0
  }
  'doctor' {
    Invoke-Doctor
    exit 0
  }
  'status' {
    $op = Get-Conf 'operator'
    $user = Get-Conf 'username'
    Write-Output "账号　　$user"
    Write-Output "运营商　$(Get-OpDisplay $op)"
    if (Test-Online) { Write-Output '网络　　已认证' } else { Write-Output '网络　　未认证' }
    Write-Output "配置　　$ConfFile"
    Write-Output "自启　　$(Get-AutostartLabel)"
    exit 0
  }
  default {
    Show-Usage
    exit 1
  }
}
