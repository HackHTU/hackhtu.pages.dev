import { Link } from "@tanstack/react-router";

export const SiteFooter = () => (
  <footer className="border-border border-t px-6 py-16">
    <div className="mx-auto flex max-w-6xl flex-col flex-wrap gap-8 sm:flex-row">
      <div className="min-w-[12rem] flex-1">
        <p className="text-sm font-semibold">更多</p>
        <ul className="text-muted-foreground mt-3 flex flex-col flex-wrap gap-2 text-sm">
          <li>
            <Link to="/tools/news">学校新闻</Link>
          </li>
          <li>
            <Link to="/pages/wall">校园树洞墙</Link>
          </li>
          <li>
            <Link to="/pages/privacy">隐私政策</Link>
          </li>
          <li>
            <Link to="/pages/terms">用户协议</Link>
          </li>
          <li>
            <Link to="/pages/update">更新记录</Link>
          </li>
        </ul>
      </div>
      <div className="min-w-[12rem] flex-1">
        <p className="text-sm font-semibold">联系</p>
        <ul className="text-muted-foreground mt-3 flex flex-col flex-wrap gap-2 text-sm">
          <li>
            <Link to="/pages/comment">意见反馈</Link>
          </li>
          <li>
            <a
              href="https://t.me/+UkcPLjqd8y9mYmU1"
              target="_blank"
              rel="noreferrer"
            >
              Telegram 群组
            </a>
          </li>
        </ul>
      </div>
      <div className="min-w-[12rem] flex-1">
        <p className="text-sm font-semibold">关于</p>
        <ul className="text-muted-foreground mt-3 flex flex-col flex-wrap gap-2 text-sm">
          <li>
            <Link to="/pages/joinus">加入我们</Link>
          </li>
          <li>
            <a
              href="https://github.com/HackHTU/hackhtu.pages.dev"
              target="_blank"
              rel="noreferrer"
            >
              GitHub 仓库
            </a>
          </li>
          <li>由 Cloudflare Pages 提供</li>
        </ul>
      </div>
    </div>
  </footer>
);
