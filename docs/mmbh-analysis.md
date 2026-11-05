# MMBH (mmbh.co.jp) — Structure & Design Analysis

Conducted live in a real Chromium browser pane (Claude's built-in browser), not from
fetched/cached HTML. Covers the homepage in full at 1440px, 768px, and 390px, one
course detail page (desktop only — see Coverage note), and the hamburger/side nav
drawer at desktop and mobile widths.

**Access confirmed:** mmbh.co.jp loaded normally, no paywall/geo-block/bot-check
blocking content (a reCAPTCHA badge is present but passive, doesn't gate viewing).

## Coverage note (read this first)

What was actually checked, so nothing below is guessed:

- **Homepage**: full scroll-through at 1440px, 768px, and 390px. All sections below
  were seen directly.
- **Course detail page** (`/courses/mentor/`, "英語・留学メンター"): checked at
  1440px only. Structure is likely representative of the other 3 course pages
  (`/courses/toefl-ielts/`, `/courses/coordination/`, `/courses/essay/`), which share
  the same nav/breadcrumb pattern, but I did not open those three individually, and I
  did not check the detail page template at 768px/390px.
- **Side/hamburger nav drawer**: opened and screenshotted at 1440px and 390px.
- **FAQ accordion**: click-tested; open state confirmed once (content pushed the
  page down, consistent with an inline expand rather than an overlay), but repeated
  clicks afterward didn't reliably reproduce the toggle in this tooling, possibly due
  to a scroll-into-view-on-open behavior interfering with coordinate-based clicks. The
  interaction pattern (icon-based accordion, grouped under two category tabs, "load
  more" beneath the first five) is confirmed; the exact open/close animation timing
  is not independently verified.
- **Not opened**: `/about/`, `/school/`, `/voices/`, `/results/`, `/news/`,
  `/company/`, `/recruit/`, `/contact/` — these are known from the nav/footer link
  list (URLs below) but their internal page content was not reviewed. If their layout
  matters for a later round, say so and I'll go back and check them specifically.
- Performance/Core Web Vitals were not measured (no Lighthouse run) — out of scope
  for this structural/visual pass.

## Sitemap & navigation

Full link list, taken from the DOM of the hamburger/side-drawer menu (identical on
desktop and mobile):

```
TOP                     https://mmbh.co.jp/
MMBHとは (About)         https://mmbh.co.jp/about/
コース一覧 (Courses)      — expandable submenu, no own page (chevron, not a link)
  英語・留学メンター       https://mmbh.co.jp/courses/mentor/
  TOEFL/IELTS点数の壁突破  https://mmbh.co.jp/courses/toefl-ielts/
  出願戦略コーディネート     https://mmbh.co.jp/courses/coordination/
  エッセイコンサルティング   https://mmbh.co.jp/courses/essay/
授業について (About lessons) https://mmbh.co.jp/school/
生徒の声 (Student voices)  https://mmbh.co.jp/voices/
合格実績 (Admission results) https://mmbh.co.jp/results/
お知らせ (News)           https://mmbh.co.jp/news/
会社概要 (Company)        https://mmbh.co.jp/company/
採用情報 (Recruiting)     https://mmbh.co.jp/recruit/
お問い合わせ (Contact)     https://mmbh.co.jp/contact/
```

Footer repeats a subset: MMBHとは, 授業について, 生徒の声, お知らせ, 会社概要,
採用情報, plus 無料カウンセリング予約 (free consultation booking), 個人情報保護方針
(privacy policy), 特定商取引法 (SCT disclosure).

### Menu states

- **Primary nav bar**: there is no visible horizontal nav bar at any width I tested,
  including 1440px. The only persistent header controls are the logo (top-left) and
  a hamburger icon (top-right) — MMBH collapses to a hamburger-only header at *all*
  breakpoints, not just mobile. This is unusual for a desktop site and is a deliberate
  minimalism choice (keeps the header from competing with the hero).
- **Closed state**: logo + hamburger only, transparent/white header, becomes sticky
  on scroll (logo + hamburger stay pinned at top while scrolling the long homepage).
- **Open state**: a drawer slides in from the right, covering roughly 70-75% of the
  viewport width at 1440px (full width minus a visible sliver of the page behind it)
  and nearly the full width at 390px. Dark olive-green background (`Blind
  Forest`-like tone), white text, generous vertical spacing between items, large "×"
  close icon top-right. "コース一覧" has a chevron and expands in place within the
  drawer (not tested whether it accordions or navigates — chevron strongly implies
  in-place expand, consistent with the FAQ's icon language elsewhere on the site).
  The floating consultation tab stays visible/fixed behind the drawer's left edge on
  desktop (visible as a sliver), confirming the drawer is an overlay, not a full page
  replacement.
- No separate "side toggle" distinct from this drawer was found. See `## "Side
  toggle" — what MMBH actually has` below; this is important because the brief
  describes a side toggle specifically for media/talk-show appearances, which does
  not exist as its own component on MMBH.

## Homepage section order

Top to bottom, as actually encountered scrolling the real page:

1. **Hero** — two-column at 1440px (headline + 3 bold value-prop lines on the left,
   a custom isometric illustration of a "journey" — school selection → English
   certification → application essay → scholarship application → achievement-building
   → application documents → overseas high school/university — on the right, with
   speech-bubble labels). On mobile/tablet (≤768px, confirmed, exact breakpoint
   between 768 and 1440 not pinned down) this collapses to a single column:
   illustration on top, headline below.
   - **Mobile-only intro animation**: at 390px and 768px, page load first shows a
     few seconds of a dark full-bleed screen with a single centered bold statement
     ("あらゆる国際教育のあらゆる受験対策を無駄なく徹底的に" — "every kind of
     international education, every kind of exam prep, thoroughly, without waste"),
     before the real hero renders. This did not happen at 1440px. Reads as a
     brand-statement interstitial, not a loading state (no spinner/progress UI).
2. **生徒の声 (Student voices / results)** — a horizontally-scrolling strip of score
   tracking cards (not testimonial quotes — numeric IELTS/TOEFL before→after score
   breakdowns per student, e.g. "IELTS Overall 6.0 → 7.5", with a sub-breakdown of
   Listening/Reading/Writing/Speaking deltas, a grade-level label like "高校2年" and a
   duration like "約6ヶ月"). A second, separate horizontally-scrolling strip directly
   below shows admission results ("Johns Hopkins University 合格" etc.) with age +
   initials only. Both are real anonymized data presentations, not styled quote
   cards — this is MMBH's "social proof," done entirely through numbers, not prose.
   A "一覧を見る" (see all) button sits above-right of this section.
3. **News (お知らせ)** — 3 blog-style cards (thumbnail, title, excerpt), "一覧を見る"
   link. **The brief says to exclude お知らせ from PEC's structure — noted, this
   section is skipped in the PEC homepage plan below.**
4. **コース一覧 (Course list)** — background switches to solid dark olive-green
   (full-bleed section, not a card on white). Two category sub-headings ("テスト対策"
   / "出願対策"), each with a 2-column grid of course cards. Each card: icon
   illustration, title, 3 short bullet pairs (bold label + sub-line) describing what
   the course does, **then a price line directly on the card** ("通常授業 7,700円
   （税込）" or a two-tier price like "スターターパック 59,400円（税込） / 追加授業
   9,900円（税込）"), then a pill-shaped "詳細を見る" button.
   - **Explicit deviation for PEC, per the brief**: the brief asks for *little or no
     pricing on the overview* — this is a deliberate difference from MMBH, not an
     oversight. MMBH shows pricing on the card; PEC's redesign will not.
5. **"for IELTS" product teaser** — a bright yellow-green full-bleed section
   announcing an upcoming MMBH product ("MOCK BANK for IELTS", "year-end release
   planned"). This is MMBH-specific (their own future product) and has no PEC
   equivalent — skipped in the PEC plan.
6. **よくある質問 (FAQ)** — same yellow-green background as the section above (no new
   section break). Two tab-style category filters ("【サービス・システム・料金】
   について" / "【指導内容・進路・対象者】について") as underlined text tabs. Below,
   a list of question rows, each a white rounded rectangle with "Q. ..." and a "+"
   icon on the right; click opens the answer inline (page content below pushes down —
   confirmed once; see Coverage note on repeat-click reliability). First 5 questions
   shown, "もっと見る" (see more) button beneath to reveal more.
7. **取引実績 (Business/media track record)** — a static image (not interactive
   DOM elements) combining education-partner logos and a labeled "●メディア関連"
   (media-related) subsection of TV network, radio, and web-media logos (TBS, 日テレ,
   tv asahi, テレ東, フジテレビ, ABEMA, NewsPicks, TOKYO FM, J-WAVE, Diamond, AERA,
   etc.) as a trust/credibility strip. See note below — this is the closest thing
   MMBH has to "media/talk show appearances," and it is *not* a toggle or drawer.
8. **note.com embedded blog feed** — a second, separate blog grid (6 cards) pulling
   from MMBH's external note.com blog, with its own "もっと見る" button. Distinct
   from the native お知らせ section above.
9. **Footer** — link columns + copyright + legal links (privacy policy, SCT
   disclosure).

### "Side toggle" — what MMBH actually has

I want to flag this clearly rather than guess: **MMBH does not have a dedicated
side-toggle panel for media/talk-show appearances.** What exists is:

- The hamburger-triggered **nav drawer** described above (general site navigation,
  not media-specific).
- The static **"メディア関連" logo grid**, which is one flat image inside the
  "取引実績" section (not a toggle, not interactive, no click-through).

Neither matches "side toggle that presents media appearances" literally. My read is
that the brief is asking me to *invent* that component for PEC — using the general
shape of MMBH's side-drawer interaction (slide-in panel, dark fill, overlay) as the
interaction language, applied to a new purpose MMBH doesn't actually have a dedicated
UI for. I've built it that way (see implementation notes) and I'm flagging the
distinction here so it's clear this piece is a synthesis, not a direct copy of an
MMBH feature.

## Course cards → detail page flow

- Overview cards are click-through, not expandable in place — "詳細を見る" is a
  real link to a dedicated URL per course (`/courses/{slug}/`), not a modal.
- Detail page structure (from `/courses/mentor/`, 1440px):
  1. Breadcrumb ("TOP > 英語・留学メンター")
  2. Hero: illustration + course name (large) + a short reassurance tagline + the
     same 3 bullet value-props from the overview card, restated
  3. **最適なニーズ (Who this is for)** — 5 short "is this you?" scenario bullets
  4. **コースコンセプト・強み (Concept & strengths)** — 4 numbered (1-4) blocks,
     each with a bold mini-headline and a short paragraph
  5. **料金プラン (Pricing plan)** — a dedicated price box, e.g. "通常授業 1コマ
     (90分) 7,700円（税込）" with a footnote for one-time/monthly admin fees where
     applicable (e.g. "※初月のみ、管理費として22,000円（税込）を別途頂戴いたします")
  6. **A numbered process explainer** ("英語基礎力を鍛える3Step") — a horizontal
     Step1/Step2/Step3 tracker with connecting line and dots, left/right arrow
     controls (manual carousel, not autoplay-detected), each step revealing a
     sub-heading + a long descriptive paragraph below
  7. Footer (site-wide)
- Pricing lives **only** on the detail page, never on the overview grid in spirit of
  what the brief wants for PEC (even though MMBH itself puts a price line on the
  overview card too — see deviation note above).

## Free-floating consultation element

- **Desktop (≥ roughly 900-1440px, confirmed at 1440px)**: a vertical tab fixed to
  the right edge of the viewport, roughly vertically centered, orange background
  (`#E8622...`-range orange, MMBH's accent), white vertical text "無料カウンセリング
  を予約する" (book a free consultation) plus a small illustrated person icon at the
  bottom of the tab. Stays pinned at the same screen position through the entire
  scroll of the homepage (tested across all 9 sections) — true `position: fixed`
  behavior, not scroll-triggered appear/disappear. Links to the counseling-booking
  page (`/counseling/`).
- **Mobile (390px, 768px confirmed)**: becomes a full-width horizontal bar fixed to
  the **bottom** of the viewport, same orange, white label text
  ("無料カウンセリングを予約する") with the person illustration to its left. Also
  `position: fixed`, present immediately below the hero and persists through scroll.
  It sits low enough that it doesn't overlap the hamburger drawer's close icon or any
  header controls when the drawer is open (drawer is full-height and renders above
  it).
- No visible close/dismiss control on either variant — it's permanent chrome, not a
  dismissible toast.

## Q&A interaction

Covered above under homepage section 6. Interaction summary: two category tabs
filter the visible question set; each question is a rounded white row with a "+"
icon; clicking expands the answer inline beneath the question (not an overlay/modal);
only 5 questions show initially per category with a "もっと見る" expand-list button.
No question was open by default. Keyboard accessibility of MMBH's own implementation
was not verified (not required by the brief — PEC's version is required to be
keyboard-accessible regardless of whether MMBH's is).

## Typography, spacing, rhythm

- **Japanese headline font**: a bold, rounded, geometric sans (character shapes read
  close to a rounded Gothic — Zen Maru Gothic / M PLUS Rounded territory — bold
  weight only on headlines). Very large size on the hero ("WHAT'S / MMBH 留学？" ran
  across two lines even at 1440px, i.e. MMBH does **not** force its own hero title to
  one line at desktop width).
- **Body/UI font**: a plainer, less rounded sans for body copy, bullets, and buttons
  — noticeably smaller and lighter weight than headlines, creating a strong
  size/weight contrast between headline and body (this contrast, more than the
  specific typeface, is what reads as "confident" / "simple to scan").
  - Clarification for the English choices this analysis feeds into: MMBH's
    actual typefaces aren't web-licensable for PEC's use (brief says don't copy MMBH's
    brand assets/exact look) — what's being carried forward is the *rhythm*
    (oversized rounded headline vs. small airy body), not the specific font files.
    See `docs/` font preview page for the three licensed pairings proposed for PEC.
- **Section rhythm**: homepage alternates full-bleed colored sections (white → dark
  olive-green course list → bright yellow-green FAQ/teaser → white footer-adjacent)
  rather than white-with-cards-throughout. Wave-shaped SVG dividers (organic, not
  straight edges) mark every section-color transition — this is a consistent,
  repeated motif, not a one-off.
- **Cards**: consistently white, soft rounded corners, no visible border — they read
  as "white chips on a colored field" rather than "cards with light shadows on
  white," which is the opposite of PEC's old design (white page, bordered cards).
- **Spacing**: generous vertical padding between sections (visually on the order of
  96-140px+ at 1440px); course cards have comfortable internal padding; bullet pairs
  within cards use a two-line pattern (bold short label, lighter sub-line) rather
  than dense paragraphs — this is a major contributor to the "simple, scannable"
  feel the brief wants.
- **Line lengths**: hero and section copy are kept short — MMBH rarely runs more than
  ~20-28 Japanese characters per line in headline contexts, and body bullets are
  one or two short clauses, not full sentences in the scannable sections (full
  paragraphs do appear, but only in the detail-page process-step section, which is
  intentionally a "read more" context).

## Animation, transitions, hover, scroll

- Confirmed: scroll-reveal/fade-in is used somewhere on the page (sections appeared
  progressively during scroll rather than being static from load) — exact easing/
  duration not measured.
- Confirmed: the nav drawer slides in (not a hard cut) and the FAQ answer expands
  in place rather than jumping.
- Confirmed: horizontal carousels (student-voices strip, admission-results strip,
  the course detail page's 3-step tracker) support manual navigation (the 3-step
  tracker has explicit left/right arrow buttons); whether the top-of-homepage
  carousels auto-advance without interaction was not conclusively tested in the time
  available — treat as unconfirmed, not as "no."
- The mobile/tablet intro animation (dark screen → hero) is the single most
  distinctive motion moment on the site.
- Wave-shaped section dividers are static SVG shapes, not animated.

## Mobile layout specifics

- Hamburger-only header persists at mobile widths too (no change in header pattern
  from desktop — MMBH already designed header-as-hamburger-everywhere, so there's no
  separate "desktop nav collapses to mobile nav" transition to replicate; it's
  hamburger at every width).
- Hero becomes single-column, illustration-first, headline below.
- Course cards: single column, full-width, stacked (confirmed via the 768px pass;
  390px not independently re-confirmed for the course section specifically, but
  given 768px already uses the mobile single-column layout, 390px is expected to
  match).
- Floating CTA relocates from right-edge vertical tab (desktop) to bottom-edge
  horizontal bar (mobile/tablet).
- Nav drawer becomes near-full-width overlay instead of a 70-75%-width panel.
- No horizontal scroll was observed on the homepage at 390px outside of the
  intentionally-horizontally-scrolling strips (student voices, admission results,
  note.com blog grid) — those are deliberate carousels, not overflow bugs.

## What makes the site feel simple and memorable

1. **One accent color used constantly for one single action** (orange = "book free
   consultation," nowhere else) — the eye always knows what the colored thing means.
2. **Numbers over adjectives for proof** — the "generic MMBH" results are literal
   before→after test scores and named-university admits, not prose testimonials.
   Nothing to read, just scan.
3. **Bold short headline + small calm body**, repeated identically in every section
   — one visual grammar used everywhere instead of novel layouts per section.
4. **Full-bleed color sections instead of card-on-white** make the page feel like a
   small number of big "rooms" to walk through while scrolling, not a long list of
   boxes.
5. **Hamburger-only header at every width** removes an entire category of decision
   (which nav item do I click) from the first screen — the page itself argues for
   one action (free consultation) and one scroll direction.
6. **Illustration, not photography**, throughout — consistent, custom, de-risked (no
   stock-photo sameness), and reusable at any size without awkward cropping.

## Implications carried into the PEC implementation

- Keep: hamburger-only header pattern, fixed floating consultation element with a
  desktop/mobile position swap, full-bleed alternating-background section rhythm,
  wave-shaped dividers, bold/short headline vs. small/airy body contrast, course
  overview → detail-page click-through, numbered step-tracker pattern for process
  explanation, FAQ as two-tab-filtered accordion.
- Deliberately changed per the brief: no pricing on the course overview cards (MMBH
  shows it, PEC won't yet); replace MMBH's orange accent with PEC's Relax Yellow;
  replace MMBH's illustration-heavy proof sections with PEC's own forthcoming
  (placeholder, for now) content since PEC has no real score/admission data yet to
  echo MMBH's numbers-as-proof pattern; invent the side-toggle-for-media component
  MMBH doesn't actually have, using its drawer's interaction language.
