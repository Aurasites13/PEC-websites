# Pre-Launch Checklist — redesign-mmbh branch

This round was structure and design, not final content. Nothing below is
broken — it's a list of what still needs real content, a decision, or a
follow-up pass before this branch (or its successor) goes live. Grouped by
type; each item names the file/section so it's easy to find and edit.

## 1. Placeholder content to replace

All of the below uses `[bracketed placeholder text]` in English and
`［プレースホルダー］`-style text in Japanese, so a text search for `[` /
`プレースホルダー` across the repo finds every instance.

| Location | What's placeholder |
|---|---|
| `index.html` — Course Options section (`#courses`) | 4 course cards: names, one-line descriptions |
| `index.html` — Q&A section (`#qa`) | 4 question/answer pairs |
| `course-detail-template.html` | Entire page: course name, tagline, 3 value points, 3 "who this is for" scenarios, 4 concept/strength blocks, price box, 3-step process |
| `js/main.js` → media drawer (`initFloatingChrome`) | 6 "Logo placeholder" tiles, the whole Media & Appearances panel — no real press/TV/talk-show coverage has been added, intentionally |
| `testimonials.html` | Already noindexed with a "coming soon" placeholder from a prior round — still applies, untouched by this redesign |

Real content exists and was **not** touched or deleted:
- `data/products.js` — the actual 7-product catalogue and pricing. Still
  the source of truth for `services.html` / `pricing.html`, which this
  redesign did not restructure (only re-themed colors/fonts/header).
  Nothing from here was pulled into the new homepage Course Options
  section on purpose — that section is intentionally generic/placeholder
  per the brief ("not final content" this round).

## 2. Font pairing decision

`docs/font-preview.html` (noindex, unlinked) has 3 licensed pairings.
**Fashion House** (Bodoni Moda + Manrope / Shippori Mincho + Noto Sans JP)
is already live on the site via `--font-display`/`--font-body` variables
in `css/style.css`. If a different pairing is preferred, see that file's
own "how to switch" note — four variables plus the Google Fonts `<link>`
in each page's `<head>`.

## 3. Headlines that needed shortening to fit one line

The brief asked titles to stay on one line at desktop/tablet. Two
homepage headlines wrapped with the new (wider) display font and were
shortened:
- "One concierge, every step of the way." → **"One concierge, every step."**
- "Find the right fit, then see the details." → **"Find the right fit."**

**Not checked exhaustively**: the font change (Cormorant → Bodoni Moda)
affects line-wrapping site-wide, and a full per-page, per-breakpoint
headline audit of all 11 existing pages wasn't completed in this pass —
only the homepage's new/edited sections were verified. One known example
still wrapping and worth a look: `services.html`'s "Three disciplines.
One coordinated programme." Recommend a quick visual pass over
`about.html`, `services.html`, `pricing.html`, `faq.html`, `contact.html`
headlines at 1440/768px before calling typography "done."

## 4. SEO — must change before launch

- **Open Graph image**: all pages currently reuse `logo-wordmark-hires.png`
  (726×281) as `og:image`. That's a logo, not a proper 1200×630 social
  preview image — works but looks thin on Facebook/LINE/X link previews.
  Make a dedicated OG image before launch.
- **hreflang — known limitation, not faked**: the site serves EN/JA from
  the *same URL* via a client-side JS toggle (`data-lang-inline`), not
  separate `/en/` and `/ja/` URLs. True `hreflang` alternates require
  distinct URLs per language; adding `hreflang` tags that point both
  languages at the same URL would be incorrect and is commonly ignored or
  flagged by Google. I did **not** add hreflang tags for this reason —
  added `og:locale` / `og:locale:alternate` instead, which is honest about
  what actually exists. If bilingual SEO (being found in Japanese search
  results specifically) matters for launch, the real fix is URL-based
  language routing (e.g. `/ja/services.html` or `?lang=ja` with
  server/redirect support), which is a bigger structural change than this
  round covers — flagging it rather than guessing at a fix.
- **Structured data**: only `index.html` got JSON-LD (`EducationalOrganization`
  — name, url, logo, areaServed only; no fabricated ratings/reviews/prices,
  per the brief). Add more (e.g. `Course` schema) once real course content
  exists — don't add it against placeholder content.
- **Canonical + Open Graph tags**: added to all 11 existing pages plus
  `course-detail-template.html`, using each page's existing bilingual
  `<title>`/`<meta description>` as the source (English variant used for
  `og:title`/`og:description`, since OG doesn't support per-language
  variants without separate URLs — see hreflang note above).

## 5. Pages marked `noindex` (intentionally, until real content lands)

- `testimonials.html` — placeholder "coming soon," from a prior round.
- `course-detail-template.html` — this round's new template page; every
  course card on the homepage currently points here. Once real per-course
  detail pages exist, either noindex gets removed per real page, or this
  file stays as a permanent internal template (recommend keeping it
  noindexed permanently either way, and not linking real course cards to
  it once real pages exist).
- `docs/font-preview.html`, `docs/mmbh-analysis.md`,
  `docs/pre-launch-checklist.md` — internal working docs, not part of the
  public site; not in `sitemap.xml`, not linked from site nav.

## 6. Design/content decisions this round made on PEC's behalf (confirm or revise)

- Homepage's "remaining MMBH-flow section" (position 4) uses the existing
  "The PEC Difference" cards rather than inventing a numbers-based proof
  strip like MMBH's — because PEC has no real score/admission data to
  show yet and the brief forbids inventing claims or statistics. Worth
  revisiting once real outcomes exist.
- The media/press side-toggle is a genuinely new component — MMBH itself
  doesn't have a dedicated side-toggle for media appearances (see
  `docs/mmbh-analysis.md`'s "Side toggle — what MMBH actually has"
  section); this redesign built one using MMBH's drawer interaction
  language, applied to a new purpose.
- Course overview cards link to **one shared** `course-detail-template.html`
  for now (all 4 cards point to the same file) rather than 4+ separate
  pages, since none of the content is final yet — avoids building and then
  immediately discarding several near-duplicate placeholder pages.
