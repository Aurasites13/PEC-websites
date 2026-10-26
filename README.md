# PEC — Private Education Concierge

Static marketing site for PEC (pecjapan.com). Plain HTML/CSS/JS, no framework
and no build step for the site itself — pages are served as-is (Netlify,
`publish = "."`). Bilingual EN/JP via `data-lang-inline` / `data-lang-block`
attributes toggled by `js/main.js` (see `css/style.css`'s
`[data-lang-inline]` rules).

## Updating prices

Services and Pricing page content (`services.html`, `pricing.html`) is
generated from a single data file — never edit the pricing/service markup
inside those two files directly; it will be overwritten.

1. Edit [`data/products.js`](data/products.js) (the source of truth — see
   the comment at the top of that file for its structure).
2. Regenerate the pages:
   ```bash
   npm run build
   ```
   This runs `scripts/build-content.mjs` (injects the new markup between the
   `<!-- PRODUCTS:START -->` / `<!-- PRODUCTS:END -->` markers in both pages)
   and then `scripts/verify-prices.mjs` (fails if any master-sheet price is
   missing from the data file or the generated HTML, or if either page has a
   price that no longer traces back to the data file).
3. Review the diff and commit `data/products.js` together with the
   regenerated `services.html` / `pricing.html`.

To check prices without regenerating anything (e.g. in CI, or after a manual
edit you want to sanity-check):

```bash
npm run verify
```

All prices are tax-included (税込), per the source master sheet
("商品・料金・提供範囲 正式マスター", v1.0, Sept 2026).
