#!/usr/bin/env node
// Generates the Services and Pricing page markup from data/products.js and
// injects it into services.html / pricing.html between the
// <!-- PRODUCTS:START --> / <!-- PRODUCTS:END --> marker comments.
//
// Usage: node scripts/build-content.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataModule = await import(path.join(ROOT, "data", "products.js"));
const { PRODUCTS, POLICY } = dataModule.default ?? dataModule;

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// A single element carrying both languages via the site's existing
// data-lang-inline toggle pattern — works identically with JS disabled
// (css/style.css defaults to showing the "en" span when html[lang] isn't
// set yet), so generated prices are always visible with no JS.
function L(en, ja) {
  return `<span data-lang-inline="en">${esc(en)}</span><span data-lang-inline="ja">${esc(ja)}</span>`;
}
function Lp(pair) {
  return L(pair.en, pair.ja);
}

function scopeList(items, variant) {
  if (!items || !items.length) return "";
  const cls = variant === "cross" ? "scope-list cross" : "scope-list check";
  return `<ul class="${cls}">\n${items.map((it) => `          <li>${Lp(it)}</li>`).join("\n")}\n        </ul>`;
}

function scopeGrid(cols) {
  const rendered = cols.filter(Boolean);
  if (!rendered.length) return "";
  return `<div class="scope-grid reveal">\n${rendered.join("\n")}\n      </div>`;
}

function scopeCol(titleEn, titleJa, items, variant) {
  if (!items || !items.length) return "";
  return `<div class="scope-col">
        <h4>${L(titleEn, titleJa)}</h4>
        ${scopeList(items, variant)}
      </div>`;
}

function eyebrowNum(p) {
  const n = String(p.num).padStart(2, "0");
  return L(`${n} — ${p.category}`, `${n} — ${p.categoryJa}`);
}

function priceTeaser(p) {
  if (p.priceIsFrom) {
    return L(`From ${p.priceFromEn}`, `${p.priceFromJa}〜`);
  }
  return L(p.priceFromEn, p.priceFromJa);
}

// ---------------------------------------------------------------------------
// SERVICES PAGE
// ---------------------------------------------------------------------------

function servicesCtaBlock(p) {
  return `<div class="product-cta">
        <a href="contact.html" class="btn btn-accent">${L("Free Consultation", "無料相談はこちら")}</a>
        <a href="pricing.html#${p.id}" class="btn btn-outline">${L("View Pricing", "料金を見る")}</a>
      </div>`;
}

function servicesTierSubcard(tier) {
  if (!tier.included) return "";
  return `<div class="tier-subcard">
        <h4>${L(tier.nameEn, tier.nameJa)} — <span class="product-line-price">${esc(tier.price)}${L(" (tax incl.)", "（税込）")}</span></h4>
        <span class="tier-consult">${Lp({ en: tier.consultationsEn, ja: tier.consultationsJa })}</span>
        ${scopeGrid([
          scopeCol("What's Included", "サービス内容", tier.included, "check"),
          scopeCol("Deliverables", "成果物", tier.deliverables, "check"),
        ])}
      </div>`;
}

function servicesAreaBlock(area) {
  return `<div class="tier-subcard">
        <h4>${L(area.nameEn, area.nameJa)}</h4>
        ${scopeList(area.items, "check")}
      </div>`;
}

function buildServicesSection(p, idx) {
  const altClass = idx % 2 === 1 ? " alt" : "";
  const head = `<div class="section-head left reveal">
      <span class="eyebrow">${eyebrowNum(p)}</span>
      <div class="product-line-head">
        <h2>${L(p.nameEn, p.nameJa)}</h2>
        <span class="product-line-price">${priceTeaser(p)}</span>
      </div>
      <p>${L(p.summaryEn, p.summaryJa)}</p>
    </div>`;

  let body = "";
  if (p.pricing.type === "tiered") {
    const basic = p.pricing.tiers.find((t) => t.id === "basic");
    const advanced = p.pricing.tiers.find((t) => t.id === "advanced");
    const premium = p.pricing.tiers.find((t) => t.id === "premium");
    const diamond = p.pricing.tiers.find((t) => t.id === "diamond");
    body = `${servicesTierSubcard(basic)}
    ${servicesTierSubcard(advanced)}
    <p class="bundle-note">${L(
      `Bundle both into ${premium.nameEn} (${premium.price}) or add Application Execution for the full ${diamond.nameEn} bundle (${diamond.price}) — see the Pricing page for bundle savings.`,
      `${premium.nameJa}（${premium.price}）としてまとめてご契約いただくか、Application Executionを加えた${diamond.nameJa}（${diamond.price}）のフルバンドルも可能です。バンドル割引の詳細は料金ページをご覧ください。`
    )}</p>`;
  } else if (p.pricing.type === "annual") {
    body = `<div class="area-grid reveal">
      ${p.pricing.areas.map((area) => `<div class="area-card">
        <h4>${L(area.nameEn, area.nameJa)}</h4>
        <p>${L(area.summaryEn, area.summaryJa)}</p>
      </div>`).join("\n      ")}
    </div>
    ${scopeGrid([
      scopeCol("Deliverables", "成果物", p.deliverables, "check"),
      scopeCol("Not Included", "含まれないもの", p.notIncluded, "cross"),
    ])}`;
  } else {
    body = scopeGrid([
      scopeCol("What's Included", "サービス内容", p.servicesIncluded, "check"),
      scopeCol("Deliverables", "成果物", p.deliverables, "check"),
      scopeCol("Not Included", "含まれないもの", p.notIncluded, "cross"),
    ]);
  }

  const boundary = p.boundary
    ? `<p class="product-note">${Lp(p.boundary)}</p>`
    : "";

  return `  <section id="${p.id}" class="tight${altClass}">
    <div class="container">
      ${head}
      ${body}
      ${boundary}
      ${servicesCtaBlock(p)}
    </div>
  </section>`;
}

// ---------------------------------------------------------------------------
// PRICING PAGE
// ---------------------------------------------------------------------------

function pricingCtaBlock() {
  return `<div class="product-cta">
        <a href="contact.html" class="btn btn-accent">${L("Free Consultation", "無料相談はこちら")}</a>
      </div>`;
}

function formatTable(pkg) {
  const [online, inPerson] = pkg.formats;
  const travelNote = L(" + travel expenses", " + 交通費");
  return `<table class="format-table">
          <tr><th></th><th>${L("Online", "オンライン")}</th><th>${L("In-person", "対面")}</th></tr>
          <tr>
            <td>${L("Hourly Rate", "時間単価")}</td>
            <td class="format-price">${esc(online.hourly)}${L(online.hourlyUnitEn, online.hourlyUnitJa)}</td>
            <td class="format-price">${esc(inPerson.hourly)}${L(inPerson.hourlyUnitEn, inPerson.hourlyUnitJa)}</td>
          </tr>
          <tr>
            <td>${L("Package Price", "パッケージ価格")}</td>
            <td class="format-price">${esc(online.price)}${L(" (tax incl.)", "（税込）")}</td>
            <td class="format-price">${esc(inPerson.price)}${L(" (tax incl.)", "（税込）")}<small>${travelNote}</small></td>
          </tr>
        </table>`;
}

function buildPricingFormatPackage(p, idx) {
  const altClass = idx % 2 === 1 ? " alt" : "";
  const cards = p.pricing.packages
    .map(
      (pkg) => `<div class="format-card${pkg.highlight ? " featured" : ""}">
        ${pkg.highlight ? `<span class="badge">${L("Recommended", "おすすめ")}</span>` : ""}
        <h4>${L(pkg.labelEn, pkg.labelJa)}</h4>
        <p class="format-sessions">${L(pkg.sessionsEn, pkg.sessionsJa)}</p>
        ${formatTable(pkg)}
      </div>`
    )
    .join("\n      ");

  return `  <section id="${p.id}" class="tight${altClass}">
    <div class="container">
      <div class="section-head left reveal">
        <span class="eyebrow">${eyebrowNum(p)}</span>
        <h2>${L(p.nameEn, p.nameJa)}</h2>
        <p>${L(p.summaryEn, p.summaryJa)}</p>
      </div>
      <div class="format-group reveal">
      ${cards}
      </div>
      <p class="format-footnote">${Lp(p.pricing.footnote)}</p>
      ${pricingCtaBlock()}
    </div>
  </section>`;
}

function buildPricingMonthly(p, idx) {
  const altClass = idx % 2 === 1 ? " alt" : "";
  const pr = p.pricing;
  return `  <section id="${p.id}" class="tight${altClass}">
    <div class="container">
      <div class="section-head left reveal">
        <span class="eyebrow">${eyebrowNum(p)}</span>
        <h2>${L(p.nameEn, p.nameJa)}</h2>
        <p>${L(p.summaryEn, p.summaryJa)}</p>
      </div>
      <div class="pricing-card featured reveal" style="max-width:440px;">
        <div class="amount">${esc(pr.price)}<small>${L(pr.unitEn, pr.unitJa)}</small></div>
        <p>${L(pr.contractEn, pr.contractJa)}</p>
        <p class="format-footnote">${L(pr.noteEn, pr.noteJa)}</p>
        <a href="contact.html" class="btn btn-accent btn-block">${L("Free Consultation", "無料相談はこちら")}</a>
      </div>
    </div>
  </section>`;
}

function tierTableRow(labelEn, labelJa, cells) {
  return `<tr><th>${L(labelEn, labelJa)}</th>${cells.join("")}</tr>`;
}

function buildPricingTiered(p, idx) {
  const altClass = idx % 2 === 1 ? " alt" : "";
  const [basic, advanced, premium, diamond] = p.pricing.tiers;
  const tiers = [basic, advanced, premium, diamond];

  const headerCells = tiers
    .map((t) => `<th${t.id === "premium" ? ' class="tier-premium"' : ""}>${L(t.nameEn, t.nameJa)}</th>`)
    .join("");

  const priceCells = tiers
    .map(
      (t) => `<td${t.id === "premium" ? ' class="tier-premium"' : ""}><span class="tier-price">${esc(t.price)}</span><br>${L("tax incl.", "税込")}</td>`
    )
    .join("");

  const detailCells = tiers
    .map((t) => {
      const cls = t.id === "premium" ? ' class="tier-premium"' : "";
      if (t.id === "basic" || t.id === "advanced") {
        return `<td${cls}>${Lp({ en: t.consultationsEn, ja: t.consultationsJa })}</td>`;
      }
      return `<td${cls}>${Lp({ en: t.composedOfEn, ja: t.composedOfJa })}</td>`;
    })
    .join("");

  const savingsCells = tiers
    .map((t) => {
      const cls = t.id === "premium" ? ' class="tier-premium tier-savings"' : t.savings ? ' class="tier-savings"' : "";
      if (!t.savings) return `<td${cls}>${L("—", "—")}</td>`;
      return `<td${cls}>${L(
        `Normally ${t.normalPrice} — save ${t.savings}`,
        `通常${t.normalPrice}から${t.savings} Bundle Discount`
      )}</td>`;
    })
    .join("");

  return `  <section id="${p.id}" class="tight${altClass}">
    <div class="container">
      <div class="section-head left reveal">
        <span class="eyebrow">${eyebrowNum(p)}</span>
        <h2>${L(p.nameEn, p.nameJa)}</h2>
        <p>${L(p.summaryEn, p.summaryJa)}</p>
      </div>
      <div class="table-scroll reveal">
        <table class="tier-table">
          <thead><tr><th></th>${headerCells}</tr></thead>
          <tbody>
            ${tierTableRow("Price", "料金", [priceCells])}
            ${tierTableRow("Includes", "内容", [detailCells])}
            ${tierTableRow("Bundle Saving", "バンドル割引", [savingsCells])}
          </tbody>
        </table>
      </div>
      <p class="format-footnote">${L(
        `Full scope of each tier is listed on the `,
        `各ティアの詳細な内容は`
      )}<a href="services.html#${p.id}">${L("Services page", "サービスページ")}</a>${L(".", "をご覧ください。")}</p>
      ${pricingCtaBlock()}
    </div>
  </section>`;
}

function buildPricingPackageAddons(p, idx) {
  const altClass = idx % 2 === 1 ? " alt" : "";
  const addonRows = p.pricing.addOns
    .map(
      (a) => `<tr>
              <td>${L(a.nameEn, a.nameJa)}</td>
              <td>${L(a.unitEn, a.unitJa)}</td>
              <td>${esc(a.price)}${L(" (tax incl.)", "（税込）")}</td>
            </tr>`
    )
    .join("\n            ");

  return `  <section id="${p.id}" class="tight${altClass}">
    <div class="container">
      <div class="section-head left reveal">
        <span class="eyebrow">${eyebrowNum(p)}</span>
        <h2>${L(p.nameEn, p.nameJa)}</h2>
        <p>${L(p.summaryEn, p.summaryJa)}</p>
      </div>
      <div class="pricing-card featured reveal" style="max-width:360px; margin-bottom:36px;">
        <div class="amount">${esc(p.pricing.price)}<small>${L(" (tax incl.)", "（税込）")}</small></div>
      </div>
      ${scopeGrid([scopeCol("What's Included", "サービス内容（上限）", p.servicesIncluded, "check")])}
      <div class="table-scroll reveal" style="margin-top:28px;">
        <table class="addon-table">
          <thead><tr><th>${L("Add-on", "追加オプション")}</th><th>${L("Unit", "単位")}</th><th>${L("Price", "価格")}</th></tr></thead>
          <tbody>
            ${addonRows}
          </tbody>
        </table>
      </div>
      <p class="format-footnote">${Lp(p.pricing.footnote)}</p>
      ${pricingCtaBlock()}
    </div>
  </section>`;
}

function buildPricingAnnual(p, idx) {
  const altClass = idx % 2 === 1 ? " alt" : "";
  const pr = p.pricing;
  const areaCards = pr.areas
    .map(
      (area) => `<div class="area-card">
        <h4>${L(area.nameEn, area.nameJa)}</h4>
        <p>${L(area.summaryEn, area.summaryJa)}</p>
      </div>`
    )
    .join("\n      ");

  return `  <section id="${p.id}" class="tight${altClass}">
    <div class="container">
      <div class="section-head left reveal">
        <span class="eyebrow">${eyebrowNum(p)}</span>
        <h2>${L(p.nameEn, p.nameJa)}</h2>
        <p>${L(p.summaryEn, p.summaryJa)}</p>
      </div>
      <div class="pricing-card featured reveal" style="max-width:460px;">
        <div class="amount">${esc(pr.price)}<small>${L(pr.unitEn, pr.unitJa)}</small></div>
        <p>${L(pr.monthlyEquivEn, pr.monthlyEquivJa)}</p>
        <p>${L(pr.introEn, pr.introJa)}</p>
      </div>
      <div class="area-grid reveal">
      ${areaCards}
      </div>
      <p class="format-footnote">${L(
        "Full scope and annual deliverables are listed on the ",
        "詳細な年間サポート範囲・成果物は"
      )}<a href="services.html#${p.id}">${L("Services page", "サービスページ")}</a>${L(".", "をご覧ください。")}</p>
      ${pricingCtaBlock()}
    </div>
  </section>`;
}

function buildPricingSection(p, idx) {
  switch (p.pricing.type) {
    case "format-package":
      return buildPricingFormatPackage(p, idx);
    case "monthly":
      return buildPricingMonthly(p, idx);
    case "tiered":
      return buildPricingTiered(p, idx);
    case "package-addons":
      return buildPricingPackageAddons(p, idx);
    case "annual":
      return buildPricingAnnual(p, idx);
    default:
      throw new Error(`Unknown pricing type for product ${p.id}`);
  }
}

function buildPolicySection(idx) {
  const altClass = idx % 2 === 1 ? " alt" : "";
  const col = (group) => `<div class="policy-col">
        <h3>${L(group.titleEn, group.titleJa)}</h3>
        <ul>
          ${group.items.map((it) => `<li>${Lp(it)}</li>`).join("\n          ")}
        </ul>
      </div>`;

  return `  <section class="tight${altClass}">
    <div class="container">
      <div class="section-head reveal">
        <span class="eyebrow">${L("Policies", "ご利用にあたって")}</span>
        <h2>${L("Fine print, made clear.", "わかりやすい注意事項。")}</h2>
        <p class="lead center">${Lp(POLICY.priceDisplay)}</p>
      </div>
      <div class="policy-grid reveal">
        ${col(POLICY.cancellation)}
        ${col(POLICY.validity)}
        ${col(POLICY.refund)}
      </div>
    </div>
  </section>`;
}

// ---------------------------------------------------------------------------

function buildServicesHtml() {
  return PRODUCTS.map((p, idx) => buildServicesSection(p, idx)).join("\n\n");
}

function buildPricingHtml() {
  const sections = PRODUCTS.map((p, idx) => buildPricingSection(p, idx)).join("\n\n");
  const policy = buildPolicySection(PRODUCTS.length);
  return `${sections}\n\n${policy}`;
}

function injectMarkers(filePath, generated) {
  const original = readFileSync(filePath, "utf8");
  const start = "<!-- PRODUCTS:START -->";
  const end = "<!-- PRODUCTS:END -->";
  const startIdx = original.indexOf(start);
  const endIdx = original.indexOf(end);
  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error(`${filePath}: could not find PRODUCTS:START/END markers`);
  }
  const before = original.slice(0, startIdx + start.length);
  const after = original.slice(endIdx);
  const next = `${before}\n${generated}\n  ${after}`;
  writeFileSync(filePath, next, "utf8");
  console.log(`Updated ${path.relative(ROOT, filePath)}`);
}

injectMarkers(path.join(ROOT, "services.html"), buildServicesHtml());
injectMarkers(path.join(ROOT, "pricing.html"), buildPricingHtml());

console.log("Done. Run `node scripts/verify-prices.mjs` to confirm prices match the master sheet.");
