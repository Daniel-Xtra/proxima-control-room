import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("../src", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const allowed = join(root, "app", "styles", "tokens.css");
const pattern = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
const offenders = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(tsx?|css)$/.test(name) && full !== allowed) {
      readFileSync(full, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (pattern.test(line))
            offenders.push(`${relative(root, full)}:${i + 1}  ${line.trim()}`);
        });
    }
  }
}

walk(root);
if (offenders.length) {
  console.error("Colour literals are only allowed in tokens.css:\n" + offenders.join("\n"));
  process.exit(1);
}
console.log("check:colors ok");
