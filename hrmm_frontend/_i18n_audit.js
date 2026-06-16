// Temporary audit script: finds translation keys missing across languages.
const fs = require("fs");
const src = fs.readFileSync(require("path").join(__dirname, "app.js"), "utf8");

function extractObject(varName) {
  const marker = `const ${varName} = {`;
  const start = src.indexOf(marker);
  if (start === -1) throw new Error(`Not found: ${varName}`);
  let i = start + marker.length - 1; // at the '{'
  let depth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) break;
    }
  }
  const objText = src.slice(start + `const ${varName} = `.length, i + 1);
  // eslint-disable-next-line no-eval
  return eval("(" + objText + ")");
}

const base = extractObject("translations");
const login = extractObject("loginTranslations");
const extra = extractObject("newTranslations");

const merged = {};
for (const dict of [base, login, extra]) {
  for (const lang of Object.keys(dict)) {
    merged[lang] = { ...(merged[lang] || {}), ...dict[lang] };
  }
}

const langs = ["uz", "ru", "en", "tr"];
const allKeys = new Set();
for (const lang of langs) Object.keys(merged[lang] || {}).forEach((k) => allKeys.add(k));

console.log("Total keys:", allKeys.size);
for (const lang of langs) {
  const missing = [...allKeys].filter((k) => !(k in (merged[lang] || {})));
  console.log(`\n=== ${lang}: missing ${missing.length} ===`);
  console.log(missing.join("\n"));
}

// Also dump uz values for any key missing in others, to help translate
const needTranslate = {};
for (const k of allKeys) {
  const missingIn = langs.filter((l) => !(k in (merged[l] || {})));
  if (missingIn.length) needTranslate[k] = { uz: merged.uz[k], missingIn };
}
fs.writeFileSync(require("path").join(__dirname, "_i18n_missing.json"), JSON.stringify(needTranslate, null, 2));
console.log("\nWrote _i18n_missing.json with", Object.keys(needTranslate).length, "keys");
