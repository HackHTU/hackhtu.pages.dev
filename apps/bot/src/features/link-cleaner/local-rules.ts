import type { RuleSet } from "./types";

/**
 * 上游 ClearURLs 规则集未收录的站点扩展。
 *
 * 顺序排在上游之后（由 rules.ts 决定）：上游已有的同名 provider 会先应用，
 * 这里补的是外链平台与国内站点缺失的追踪参数。参数名会以 `^(?:...)$` 锚定，
 * 所以这里只写纯参数名，不写正则。
 *
 * 小红书刻意保留 `xsec_token` 与 `xsec_source`：没有 token 的笔记链接
 * 在网页端打不开，它们属于功能性参数而非追踪参数。
 */
export const localRules: RuleSet = {
  providers: {
    bilibili: {
      urlPattern: "^https?:\\/\\/(?:[a-z0-9-]+\\.)*?bilibili\\.com",
      rules: [
        "share_source",
        "share_medium",
        "share_plat",
        "share_tag",
        "share_times",
        "share_session_id",
        "vd_source",
        "spm_id_from",
        "from_spmid",
        "from_source",
        "bbid",
        "unique_k",
        "timestamp",
        "up_id",
        "seid",
        "buvid",
        "browser",
        "plat_id",
        "broadcast_type",
        "is_room",
        "live_from",
        "eab_x",
        "hotRank",
      ],
    },
    xiaohongshu: {
      urlPattern: "^https?:\\/\\/(?:[a-z0-9-]+\\.)*?xiaohongshu\\.com",
      rules: [
        "xhsshare",
        "share_from_user_hidden",
        "appuid",
        "apptime",
        "ex_source",
        "share_id",
        "author_share",
        "host_id",
        "xsec_share_source",
      ],
    },
    douyin: {
      urlPattern: "^https?:\\/\\/(?:[a-z0-9-]+\\.)*?douyin\\.com",
      rules: [
        "previous_page",
        "modeFrom",
        "share_token",
        "share_source",
        "share_link",
        "timestamp",
        "region",
        "tt_from",
        "from_ssr",
        "enter_from_merge",
        "enter_method",
        "action_type",
      ],
    },
    taobao: {
      urlPattern: "^https?:\\/\\/(?:[a-z0-9-]+\\.)*?(?:taobao|tmall|tb)\\.com",
      rules: [
        "scm",
        "ali_trackid",
        "share_crt_vendorid",
        "shareUniqueId",
        "shareurl",
        "short_name",
        "sourceType",
        "ttid",
        "bxsign",
        "utparam",
        "pvid",
        "ak",
        "ns",
        "abbucket",
      ],
    },
    jd: {
      urlPattern: "^https?:\\/\\/(?:[a-z0-9-]+\\.)*?jd\\.com",
      rules: [
        "ad_od",
        "gx",
        "gxd",
        "gxg",
        "gxn",
        "gxdapp",
        "cu",
        "shareOrigin",
        "shareType",
        "share_id",
        "sdx",
        "entry",
        "ds",
        "dsc",
        "partner",
      ],
    },
    yangkeduo: {
      urlPattern:
        "^https?:\\/\\/(?:[a-z0-9-]+\\.)*?(?:yangkeduo|pinduoduo)\\.com",
      rules: [
        "_x_org",
        "refer_share_uin",
        "_x_query",
        "share_uin",
        "page_from",
        "_wv",
        "refer_share_channel",
        "refer_share_id",
      ],
    },
    zhihu: {
      urlPattern: "^https?:\\/\\/(?:[a-z0-9-]+\\.)*?zhihu\\.com",
      rules: [
        "utm_psn",
        "utm_oi",
        "utm_division",
        "share_code",
        "s_r",
        "s_ch",
        "s_rr",
      ],
    },
    weixin: {
      urlPattern: "^https?:\\/\\/mp\\.weixin\\.qq\\.com",
      rules: ["scene", "isappinstalled", "exportkey", "pass_ticket"],
      rawRules: ["&chksm.*"],
    },
    threads: {
      urlPattern: "^https?:\\/\\/(?:[a-z0-9-]+\\.)*?threads\\.(?:com|net)",
      rules: [
        "xmt",
        "igshid",
        "igsh",
        "slof",
        "hwta",
        "appclip",
        "handoff",
        "login_success",
        "onboarding_complete",
        "show_app_header",
        "tifu_login",
      ],
    },
    facebook: {
      urlPattern: "^https?:\\/\\/(?:[a-z0-9-]+\\.)*?facebook\\.com",
      rules: ["rdid", "share_url"],
    },
    instagram: {
      urlPattern: "^https?:\\/\\/(?:[a-z0-9-]+\\.)*?instagram\\.com",
      rules: ["igsi"],
    },
  },
};
