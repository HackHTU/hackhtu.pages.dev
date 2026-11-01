import { cpSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
const source = path.join(root, "tools", "htu-tui");
const target = path.join(root, "apps", "web", "public", "downloads", "htu-tui");

rmSync(target, { force: true, recursive: true });

mkdirSync(target, { recursive: true });

cpSync(source, target, { recursive: true });

console.log(`已同步 HTU 脚本到 ${path.relative(root, target)}`);
