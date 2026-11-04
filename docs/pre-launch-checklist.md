# Pre-Launch Checklist — redesign-mmbh branch

Updated after the third redesign pass ("more soul": globe fix, edge-to-edge
header, bold color-block Course Options/PEC Difference with original
illustrations, Fraunces/Zen Maru Gothic fonts, Q&A redesign, bigger floating
sign, full consultation-form rebuild). Nothing below is broken — it's what
still needs real content, a decision, or a follow-up before this branch goes
live. Grouped by type; each item names the file/section.

## 0. This round's changes (new, not yet in the sections below)

- Globe: fixed the blurry-on-first-scroll bug (was swapping to a hi-res
  texture mid-scroll; now loads the hi-res texture once, up front). Logo
  and wordmark on the globe are now white with a drop shadow for
  readability over Earth imagery. The old separate "What PEC Is" section
  was removed; its copy now appears in a solid panel as the camera arrives
  over Japan. Hero headline and buttons were removed entirely.
- Deleted the "For Parents / For Teenagers / For Adults / For
  International Families" pillar-chip section and all `.eyebrow` labels
  site-wide (CSS rules removed too).
- Header (`.nav-wrap`) is now edge-to-edge at every width (~24px side
  margin), not inside the centered `.container`.
- Course Options and The PEC Difference were rebuilt with full-bleed brand-
  color sections, white rounded cards, and 8 original SVG illustrations
  (flat-style characters, brand colors + Pink Blossom/Blue Glow accents,
  varied skin tones). The PEC Difference is now 4 alternating color bands
  (one each: Berry Chocolate, Relax Yellow, Powdered Cocoa, Blind Forest),
  each with its own illustration and layout, not 4 identical cards.
- Typography changed to Fraunces (EN titles) + Zen Maru Gothic (JA titles)
  + Nunito/Zen Kaku Gothic New (body); see `docs/font-preview.html` for the
  3 pairings evaluated. Title weights are now bolder (700).
- Q&A redesigned as a bold Relax Yellow section with white rounded cards,
  big circular "+" icon that rotates open.
- Floating "Free Counseling" sign is significantly bigger (desktop tab and
  mobile bar).
- "Free Consultation" / 無料相談 renamed to "Free Counseling" / 無料カウンセリング
  consistently site-wide (buttons, CTA headings, footer link, floating
  sign) to match the new consultation-form title.
- `contact.html`'s form was fully replaced with the 無料カウンセリングお申し込み /
  Free Counseling Application form (full field list from the brief,
  including real course names from `data/products.js`, DOB dropdowns,
  conditional "other" text fields, a required courses-of-interest group,
  privacy-consent checkbox, honeypot). Verified end-to-end against a live
  Netlify deploy: a test submission was captured with every field intact.
  Netlify Forms was previously disabled site-wide
  (`processing_settings.html.ignore_html_forms: true`) and had no
  submission-notification hook configured at all; both were fixed this
  round (form detection enabled, an email notification to
  info.pec.jp@gmail.com was added) — see the session report for details.
- All em/en-dashes removed from every rendered page (code comments
  excepted). The one legal-page edit: `sct.html`'s
  "[to be confirmed — ...]" → "[to be confirmed: ...]" (punctuation only).
- Title audit: shortened several titles to fit one line at 390px (FAQ,
  Pricing, Services, 404, and the 5 pages that used the generic
  "[Placeholder page title]"). Two documented exceptions still wrap at
  390px because their exact wording was specified by the brief and can't
  be shortened: `sct.html`'s legal-act title and `contact.html`'s "Free
  Counseling Application" title (both got a smaller mobile-only font size
  instead, down to 2–3 clean lines).

## 1. Placeholder content to replace

All of the below uses `[bracketed placeholder text]` in English and
`［プレースホルダー］`-style text in Japanese — a text search for `[` /
`プレースホルダー` across the repo finds every instance.

| Location | What's placeholder |
|---|---|
| `index.html` — Course Options section (`#courses`) | 4 course cards: names, one-line descriptions |
| `index.html` — Q&A section (`#qa`) | 4 question/answer pairs |
| `index.html` — hero lead, meta description, PEC Difference cards (×2) | target-clientele phrase, discretion claim, instructor-vetting claim, school-network claim (see §3) |
| `course-detail-template.html` | Entire page: course name, tagline, 3 value points, 3 "who this is for" scenarios, 4 concept/strength blocks, price box, 3-step process |
| `testimonials.html` | 3 testimonial cards: `[Placeholder testimonial]` / `[Student Name]` / `[Course]` — no "coming soon" wording per this round's instruction |
| `results.html` (new) | 6 results cards: `[School or Exam]` / `[Result]` / `[Year]` |
| `careers.html` (new) | Intro paragraph + 2 job cards: `[Job Title]` / `[Job Description]` / `[Requirements]` |
| `lessons.html` (new, "About Our Lessons") | Entire page: 3 topic cards + 1 section |
| `about.html` ("Company" in nav) | Hero title, founder's note, pull-quote, "Our Philosophy" section + 3 cards — see §3. "How We Work" 4-step process was left as real content (a process description, not a credibility claim) |
| Footer tagline (every page) | "[Placeholder: who PEC serves]" — replaces the "most discerning families" claim |

Real content exists and was **not** touched or deleted:
- `data/products.js` — the actual 7-product catalogue and pricing, still
  the source of truth for `services.html` / `pricing.html`. Nothing from
  here was pulled into the homepage's placeholder Course Options section
  on purpose.

## 2. The media/press side-toggle from the last round was removed

The previous pass misread "side toggle" as a dedicated media/press panel.
This round removed it completely — code, markup, CSS — and replaced it
with the actual MMBH-style site menu (hamburger → slide-in nav). There is
currently **no** media/press showcase anywhere on the site. If PEC wants
one later (e.g. once real press coverage exists), it would need to be
designed fresh — nothing from the removed component was reused.

## 3. Claims replaced this round (confirm or reject each one)

Every row below was a specific, confirmable-sounding claim with no source
behind it. Replaced with a bracketed placeholder in EN and JA, everywhere
it appeared (checked site-wide, not just the obvious spot).

| Claim | Where it appeared | Replaced with |
|---|---|---|
| "...for Tokyo's most discerning families" | Footer tagline (all pages), `index.html` hero lead + meta description + og:description | `[Placeholder: who PEC serves]` / target-clientele placeholder |
| "...confidentiality expected by **high-profile families**" | `index.html` — Complete Discretion card | `[Placeholder — specific discretion commitments not yet confirmed.]` |
| "**Curated Instructors**" / "personally vetted for both academic rigour and rapport" | `index.html` — PEC Difference card | `[Placeholder]` heading + instructor-selection-process placeholder |
| "**A Global Network**" / relationships with schools across Japan, Switzerland, the UK | `index.html` — PEC Difference card | `[Placeholder]` heading + relationships placeholder |
| "...propose a bespoke programme **within 48 hours**" | `index.html` CTA band | response-time placeholder |
| "We reply within **two business days**" / "Response time: within 2 business days" | `contact.html` (lead text + Details card), `js/main.js` (form success message) | response-time placeholder in all 4 spots |
| Founder's note narrative ("years of watching brilliant students struggle...", specific operating claims) | `about.html` | `[Placeholder founder's note]` |
| "Many of our families value privacy... we operate quietly, by referral and appointment" | `about.html` — Our Philosophy | `[Placeholder]` |
| "Years of working directly with international schools and overseas admissions offices" | `about.html` — Our Philosophy | `[Placeholder]` |
| "We look at the whole student..." (holistic-view claim) | `about.html` — Our Philosophy | `[Placeholder]` |

**Not changed, and why:** the founder's first name ("Nanako") was treated
as a real, previously-confirmed detail (it's also used in `sct.html`'s
legal disclosure), not an invented claim — only the narrative claims
*around* it were placeholdered. `about.html`'s "How We Work" 4-step
process was left alone — it describes what PEC *will do* when engaged,
not a claim about scale, credentials, or track record, so it didn't fit
the pattern of the claims above.

### Unverified language found in the legal pages (not changed — for lawyer/owner review)

Per instruction, `privacy.html` / `terms.html` / `sct.html` were **not**
edited for claims (only their contact-info strings — see §4). Flagging
what a lawyer should look at:
- `terms.html` / `privacy.html` / `sct.html` footer taglines **were**
  swept along with every other page's shared footer ("most discerning
  families" → placeholder) since that's shared site chrome, not legal
  text — worth confirming this was acceptable.
- `sct.html`'s Seller/Representative fields still read "Private Education
  Concierge (PEC) [to be confirmed — sole proprietorship or registered
  entity name]" and "Nanako [full legal name to be added]" — these were
  already marked incomplete before this round and remain so; flagging
  again since SCT disclosure requires accurate legal-entity info before
  launch.
- No other promotional claims (discretion, vetting, response times, etc.)
  were found inside the three legal pages' substantive text — they're
  procedural/legal documents, not marketing copy.

## 4. Contact details

- **Email**: `hello@pecjapan.com` replaced with `info.pec.jp@gmail.com`
  everywhere it appeared, including `privacy.html` / `terms.html` /
  `sct.html` (treated as a factual correction, not a "claims" edit — see
  note below).
- **WhatsApp**: removed completely — footer links (all pages) and the two
  large CTA buttons (`index.html`, `contact.html`) deleted, not just
  hidden. No WhatsApp number appears anywhere in the repo anymore.
- **LINE**: removed from rendering the same way (footer links + the two
  CTA buttons) — the LINE handle (`~pecjapan`) was never confirmed real,
  so per "hide until confirmed" it's been taken out of the rendered pages
  rather than just visually hidden. It's fully deleted from the HTML, not
  commented out — restoring it means re-adding the markup once there's a
  real LINE account to link.
- `contact.html`'s "Prefer to message us directly?" card (which had no
  buttons left after LINE/WhatsApp were removed) was rewritten to point
  at the email address instead, so it isn't an empty card.
- **Judgment call on legal pages**: item 3 of the brief says "Do not
  change the legal pages," stated specifically in the context of
  unverified claims. Item 4 (contact details) is a separate instruction
  with no legal-page exception, and leaving a dead/wrong email in SCT or
  privacy-policy contact fields seemed like the worse outcome, so the
  email swap *was* applied inside the 3 legal pages. If this was meant to
  be off-limits too, it's a one-string-per-file revert.

### Contact form delivery — could not verify

`contact.html`'s form uses Netlify Forms (`data-netlify="true"`,
`name="contact"`). **Where form submissions get emailed is a Netlify
dashboard setting (Site settings → Forms → Form notifications), not
something in this repo's code** — there is no address hardcoded in the
form that controls delivery. I cannot see or change that dashboard
setting from here, so I cannot confirm submissions reach
`info.pec.jp@gmail.com`. **Action needed:** check Site settings → Forms →
Form notifications on the Netlify project and add/confirm an email
notification to `info.pec.jp@gmail.com` if one isn't already set up.

## 5. Font pairing decision

`docs/font-preview.html` (noindex, unlinked) has 3 licensed pairings.
**Fashion House** (Bodoni Moda + Manrope / Shippori Mincho + Noto Sans JP)
is live via `--font-display`/`--font-body` variables in `css/style.css`.

## 6. Titles that don't fit on one line (suggested shorter versions — NOT applied without approval)

Checked every `h1`/`h2` on every page, both languages, at 1440px (desktop)
via rendered line-count, not a guess. Placeholder-bracket titles (e.g.
`[Placeholder page title]`) are excluded below since they'll be replaced
anyway — only real copy is listed.

| Page | Language | Current | Suggested shorter version |
|---|---|---|---|
| `index.html` hero | EN | "Every step of your child's education, considered." (3 lines in its 640px column) | "Every step, considered." |
| `index.html` hero | JA | "お子様の学びの一歩一歩に、細やかな配慮を。" (3 lines) | "お子様の学びに、細やかな配慮を。" |
| `index.html` "What PEC Is" | JA | "一人のコンシェルジュが、すべての道のりに。" (2 lines — EN "One concierge, every step." already fits) | "一人のコンシェルジュで、すべてを。" |
| `index.html` Course Options | JA | "ぴったりのコースを見つけて、詳細へ。" (2 lines — EN already fits) | "ぴったりのコースを見つける。" |
| `index.html` PEC Difference | JA | "教室ではなく、コンシェルジュという発想。" (2 lines — EN "A concierge, not a classroom." fits) | "教室ではなく、コンシェルジュ。" |
| `index.html` Q&A | JA | "よくあるご質問にお答えします。" (2 lines — EN "Questions, answered." fits) | "よくあるご質問。" |
| `services.html` hero | EN | "Three disciplines. One coordinated programme." (2 lines — also factually stale, it's 7 services now, not 3) | "Seven services, one programme." |
| `services.html` hero | JA | "3つの専門領域を、一つのプログラムとして。" (2 lines, same staleness) | "7つのサービスを、一つのプログラムとして。" |
| `contact.html` hero | JA | "まずは、お話をお聞かせください。" (2 lines — EN "Let's begin with a conversation." fits) | "まずはご相談から。" |
| `about.html` "How We Work" | JA | "落ち着いた、一貫したプロセス。" (2 lines, kept as real content) | "一貫した、丁寧なプロセス。" |
| `sct.html` hero (legal page) | EN | "Specified Commercial Transactions Act Disclosure" (2 lines) | Not suggesting a rewrite — legal page, needs lawyer sign-off on any wording change, not just a design one |

**Product-name headings that wrap but can't really be "shortened"** — these
are real product names pulled from `data/products.js`, not marketing
copy, so shortening the *wording* would mean renaming the product:
- "International Education Advisory" / "海外進学・教育戦略"-type product
  headings and "Swiss Post-Enrollment Concierge" / "スイス入学後・年間教
  育コンシェルジュ" wrap to 2 lines on `services.html` and `pricing.html`
  (inside the `.product-line-head` flex row, which is narrower than the
  full column because it shares space with the price badge). **This is a
  layout fix, not a wording fix** — widening that row or stacking the
  price badge below the heading on narrower columns would resolve it
  without touching any product name. Flagging as a design to-do rather
  than a title to shorten.

**Not checked**: 390px and 768px title-wrapping specifically (only 1440px
desktop was audited per the brief's "at its target size" — titles are
allowed to wrap on mobile per the original brief's fluid-sizing rule, so
this wasn't re-checked at smaller widths).

## 7. SEO

- **Open Graph image**: all pages reuse `logo-wordmark-hires.png`
  (726×281) as `og:image` — a logo, not a proper 1200×630 social preview
  image. Make a dedicated OG image before launch.
- **hreflang — known limitation, not faked**: the site serves EN/JA from
  the *same URL* via a client-side toggle, not separate `/en/`/`/ja/`
  URLs. Real `hreflang` alternates need distinct URLs per language;
  tagging both languages onto the same URL would be incorrect and is
  commonly ignored by Google. Used `og:locale`/`og:locale:alternate`
  instead. If being found in Japanese search results specifically matters
  for launch, the real fix is URL-based language routing — a bigger
  structural change than either redesign round covered.
- **Structured data**: only `index.html` has JSON-LD (`EducationalOrganization`
  — name, url, logo, areaServed only; no fabricated ratings/reviews).
- **Sitemap**: reduced to just `privacy.html` / `terms.html` / `sct.html`
  — every other page is now noindexed (see §8), so including them in the
  sitemap would contradict their own robots tag.

## 8. Pages marked `noindex` (every page except the 3 legal pages)

Because the "most discerning families" placeholder lives in the shared
footer on literally every page, and several pages have placeholder
sections of their own, **all of these are noindexed**:
`index.html`, `about.html`, `services.html`, `pricing.html`, `faq.html`,
`contact.html`, `404.html`, `testimonials.html`, `course-detail-template.html`,
`lessons.html`, `results.html`, `careers.html`.

**Not noindexed** (unchanged, per "do not change the legal pages"):
`privacy.html`, `terms.html`, `sct.html`.

`docs/font-preview.html`, `docs/mmbh-analysis.md`,
`docs/pre-launch-checklist.md` are internal working docs — not part of
the public site, not in `sitemap.xml`, not linked from site nav.

## 9. Design/content decisions made on PEC's behalf this round (confirm or revise)

- The site menu's "Courses" expandable item reveals 4 placeholder course
  links, all pointing at the same `course-detail-template.html` (same
  reasoning as the homepage's course cards — nothing to link to yet that
  isn't the shared template).
- "About Our Lessons" (`lessons.html`) and "Company" (`about.html`,
  repurposed from the old "About" page) are two separate pages per the
  MMBH-style menu structure, even though the old site only had one
  combined "About" page. `about.html`'s URL/filename was kept as-is to
  avoid breaking any existing links to it.
- "What is PEC" in the menu links to `index.html#what-pec-is` (an anchor
  on the homepage) rather than a standalone page, since the brief's
  "create missing pages" list didn't name it and the homepage section
  already covers that content.
