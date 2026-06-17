import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const page = await browser.newPage();

await page.goto("http://127.0.0.1:3000", { waitUntil: "domcontentloaded" });
await page.evaluate(() => {
  document.getElementById("loginView")?.classList.add("hidden");
  document.getElementById("appView")?.classList.remove("hidden");
});

await page.click("#themeToggleButton");
await page.waitForSelector("#appearanceSection.modal-section-active");

const count = await page.locator(".theme-card").count();
await page.click("[data-theme-card='soft-light']");
await page.check("#increaseContrastToggle");

const result = await page.evaluate(() => ({
  theme: document.documentElement.getAttribute("data-theme"),
  mode: document.documentElement.getAttribute("data-theme-mode"),
  contrast: document.documentElement.classList.contains("theme-contrast"),
  storageTheme: localStorage.getItem("hrmm_theme_id"),
  storageContrast: localStorage.getItem("hrmm_increase_contrast"),
  previews: document.querySelectorAll(".theme-preview-svg").length,
  cards: document.querySelectorAll(".theme-card").length,
  selected: document.querySelector(".theme-card.selected")?.dataset.themeCard,
  bg: getComputedStyle(document.documentElement).getPropertyValue("--bg").trim(),
  text: getComputedStyle(document.documentElement).getPropertyValue("--text-primary").trim(),
}));

console.log(JSON.stringify({ count, result }, null, 2));
await browser.close();
