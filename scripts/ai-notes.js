#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');

function slugify(str) {
  return str
    .toString()
    .toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function findObsidianVault() {
  const home = os.homedir();
  const candidates = [
    'Documents',
    'OneDrive/Documents',
    'OneDrive/Документы',
    'Desktop',
    'OneDrive/Desktop',
  ];
  for (const dir of candidates) {
    const full = path.join(home, dir);
    if (!fs.existsSync(full)) continue;
    const entries = fs.readdirSync(full, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const vault = path.join(full, entry.name);
        if (fs.existsSync(path.join(vault, '.obsidian'))) {
          return vault;
        }
      }
    }
  }
  return null;
}

function getVaultPath() {
  if (process.env.AI_NOTES_VAULT) {
    return process.env.AI_NOTES_VAULT;
  }
  const obsidian = findObsidianVault();
  if (obsidian) {
    console.log(`[ai-notes] Obsidian vault topildi: ${obsidian}`);
    return obsidian;
  }
  const fallback = path.join(process.cwd(), 'AI-Notes');
  console.log(`[ai-notes] Obsidian vault topilmadi. Fallback: ${fallback}`);
  return fallback;
}

function getProjectName() {
  return process.env.AI_NOTES_PROJECT || path.basename(process.cwd());
}

function getArg(name, altIndex) {
  const idx = process.argv.findIndex((a) => a === name);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return process.argv[altIndex] || undefined;
}

function getTags() {
  const idx = process.argv.findIndex((a) => a === '--tags');
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1]
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return process.env.AI_NOTES_DEFAULT_TAGS
    ? process.env.AI_NOTES_DEFAULT_TAGS.split(',').map((t) => t.trim())
    : [];
}

function main() {
  const title = getArg('--title', 2) || getArg('-t', 2);
  const content = getArg('--content', 3) || getArg('-c', 3) || '';

  if (!title) {
    console.log(`
Usage:
  node scripts/ai-notes.js "Sarlavha" "Kontent" [--tags tag1,tag2]
  node scripts/ai-notes.js --title "Sarlavha" --content "Kontent"

Muhit o'zgaruvchilari:
  AI_NOTES_VAULT        - Obsidian vault yo'li (ixtiyoriy)
  AI_NOTES_PROJECT      - Loyiha nomi (standart: joriy papka nomi)
  AI_NOTES_DEFAULT_TAGS - Doimiy teglar, vergul bilan ajratilgan
`);
    process.exit(0);
  }

  const vault = getVaultPath();
  const project = getProjectName();
  const notesDir = path.join(vault, 'AI-Notes', project);
  if (!fs.existsSync(notesDir)) {
    fs.mkdirSync(notesDir, { recursive: true });
  }

  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5).replace(':', '-');
  const slug = slugify(title) || 'note';
  const filename = `${date}-${time}-${slug}.md`;
  const filepath = path.join(notesDir, filename);

  const summary = content
    .split('\n')
    .filter((l) => l.trim())
    .slice(0, 3)
    .join(' ')
    .slice(0, 120);

  const tags = ['ai-note', project.toLowerCase(), ...getTags()];
  const frontmatter = `---
project: ${project}
created: ${now.toISOString()}
tags: [${tags.map((t) => `"${t}"`).join(', ')}]
summary: "${summary.replace(/"/g, '\\"')}"
---

# ${title}

${content || '(kontent kiritilmadi)'}
`;

  fs.writeFileSync(filepath, frontmatter, 'utf8');
  console.log(`[ai-notes] Eslatma yaratildi: ${filepath}`);
}

main();
