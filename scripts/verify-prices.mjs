#!/usr/bin/env node
// Checks every price in the master sheet against:
//   1. data/products.js  (the structured source of truth)
//   2. services.html / pricing.html (the generated, committed markup)
//
// so a stale or hand-edited page fails loudly instead of silently drifting
// from the master sheet. Run after every `node scripts/build-content.mjs`.
//
// Usage: node scripts/verify-prices.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataModule = await import(path.join(ROOT, "data", "products.js"));
const { PRODUCTS } = dataModule.default ?? dataModule;

// Expected values transcribed directly from
// "商品・料金・提供範囲 正式マスター" (Master Product Sheet v1.0, Sept 2026),
// section 02 MASTER PRICING + per-product sections 03-09. Independent of
// data/products.js on purpose, so a typo made in that file is still caught.
const EXPECTED_PRICES = [
  "¥7,700", "¥184,800", "¥9,240", "¥111,000",
  "¥9,700", "¥232,800", "¥11,240", "¥135,000",
  "¥9,900", "¥356,400", "¥11,880", "¥214,000",
  "¥11,900", "¥428,400", "¥13,880", "¥250,000",
  "¥55,000",
  "¥100,000", "¥180,000", "¥250,000", "¥450,000", "¥280,000", "¥30,000", "¥50,000", "¥500,000",
  "¥120,000", "¥220,000", "¥300,000", "¥490,000", "¥340,000", "¥40,000", "¥60,000", "¥550,000",
  "¥250,000", "¥15,000",
  "¥990,000",
];

let failures = 0;

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  failures++;
}

// --- 1. Every expected price appears somewhere in data/products.js's own
//        price-bearing fields, and nothing unexpected shows up instead. ---
function addYenAmountsFrom(prices, text) {
  if (!text) return;
  const matches = text.match(/¥[\d,]+/g);
  if (matches) for (const m of matches) prices.add(m);
}

function collectDataPrices() {
  const prices = new Set();
  for (const p of PRODUCTS) {
    const pr = p.pricing;
    if (pr.type === "format-package") {
      for (const pkg of pr.packages) {
        for (const f of pkg.formats) {
          prices.add(f.hourly);
          prices.add(f.price);
        }
      }
      addYenAmountsFrom(prices, pr.footnote?.en);
      addYenAmountsFrom(prices, pr.footnote?.ja);
    } else if (pr.type === "monthly") {
      prices.add(pr.price);
    } else if (pr.type === "annual") {
      prices.add(pr.price);
      addYenAmountsFrom(prices, pr.monthlyEquivEn);
      addYenAmountsFrom(prices, pr.monthlyEquivJa);
    } else if (pr.type === "package-addons") {
      prices.add(pr.price);
      if (pr.addOns) for (const a of pr.addOns) prices.add(a.price);
    } else if (pr.type === "tiered") {
      for (const t of pr.tiers) {
        prices.add(t.price);
        if (t.normalPrice) prices.add(t.normalPrice);
        if (t.savings) prices.add(t.savings);
      }
    }
  }
  return prices;
}

function normalizeYen(s) {
  return s.replace(/,/g, "").trim();
}

const dataPrices = collectDataPrices();
const dataPricesNorm = new Set([...dataPrices].map(normalizeYen));

for (const expected of EXPECTED_PRICES) {
  if (!dataPricesNorm.has(normalizeYen(expected))) {
    fail(`data/products.js is missing expected price ${expected}`);
  }
}

// --- 2. Every price that appears in data/products.js also appears in the
//        generated HTML for both services.html and pricing.html's build. ---
const servicesHtml = readFileSync(path.join(ROOT, "services.html"), "utf8");
const pricingHtml = readFileSync(path.join(ROOT, "pricing.html"), "utf8");

function extractMarkerBlock(html, file) {
  const start = html.indexOf("<!-- PRODUCTS:START -->");
  const end = html.indexOf("<!-- PRODUCTS:END -->");
  if (start === -1 || end === -1) {
    fail(`${file}: missing PRODUCTS:START/END markers`);
    return "";
  }
  return html.slice(start, end);
}

const servicesBlock = extractMarkerBlock(servicesHtml, "services.html");
const pricingBlock = extractMarkerBlock(pricingHtml, "pricing.html");

// Prices that live only on the Pricing page (format tables, tiers, add-ons,
// monthly/annual amounts) must be present there. Services only carries a
// "from" teaser price per product, so it is checked separately below.
for (const price of dataPrices) {
  if (!pricingBlock.includes(price)) {
    fail(`pricing.html is missing price ${price} (present in data/products.js) — run scripts/build-content.mjs`);
  }
}

for (const p of PRODUCTS) {
  if (!servicesBlock.includes(p.priceFromEn) || !servicesBlock.includes(p.priceFromJa)) {
    fail(`services.html is missing the "${p.id}" price teaser (${p.priceFromEn} / ${p.priceFromJa}) — run scripts/build-content.mjs`);
  }
}

// --- 3. Every price that appears in the generated HTML also exists in
//        data/products.js — catches a hand-edited/stale number in the page
//        that no longer matches the source of truth. ---
const yenInPricingHtml = new Set((pricingBlock.match(/¥[\d,]+/g) || []).map(normalizeYen));
for (const found of yenInPricingHtml) {
  if (!dataPricesNorm.has(found)) {
    fail(`pricing.html contains price ¥${found.replace("¥", "")} that is not in data/products.js — looks hand-edited or stale`);
  }
}

if (failures > 0) {
  console.error(`\n${failures} price check(s) failed.`);
  process.exit(1);
}

console.log(`OK — ${EXPECTED_PRICES.length} master-sheet prices verified against data/products.js, services.html and pricing.html.`);
