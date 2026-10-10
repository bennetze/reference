# Repository Guidelines

## Purpose and scope

This is an Astro website-design showcase for prospective clients, using the existing
Die Oldtimermanufaktur presentation. It is a labelled development demonstration,
not an approved production website. Keep work scoped to the user's request.

Retained German routes are `/`, `/handwerk/`, `/ueber-uns/`, `/projekte/`,
`/impressum/`, `/datenschutz/` and `/404.html`, with corresponding English pages.
The Projekte overview is a photographic triptych with noninteractive panels.
Vehicle archives, records, galleries, search, redirects and editor integration have
been removed. Do not reintroduce them or touch the sibling internal editor without
an explicit request. Legal pages intentionally contain only their headings and
shared chrome; do not invent legal copy.

## Language and structure

Collaborate in English unless the user asks otherwise. Author website copy in
German and maintain its English dictionary entries in `src/i18n/en.json`.
`src/i18n/routes.mjs` registers English versions of the shared Astro templates;
middleware localizes text, internal links, metadata and JSON-LD and updates CSP hashes.
Both languages must remain readable without JavaScript.

Use existing `.astro` pages, components and layouts before adding new structure.
Use PascalCase component filenames and lowercase route filenames. Keep imports at
the top of frontmatter, tabs in Astro markup/CSS and scoped styles where practical.
Reuse `SiteChrome.astro` for the fixed blurred header, menu and footer. Ordered
section pages must reuse `SectionNavigation.astro` and its stable targets alongside
the shared Up/Down key behavior. Preserve existing URLs and deployment-base support.
Use `import.meta.env.BASE_URL` or `sitePath` for internal links.

## Design and assets

Use locally hosted Jost everywhere. The supplied variable TTF and generated WOFF2
are in `src/assets/fonts/`; `scripts/generate-fonts.py` regenerates WOFF2 using
`fonttools[woff]==4.66.0` and verifies glyph coverage, metrics and weight axes.
Keep the Jost copyright and OFL license in `public/licenses/`; preserve licenses for
other retained assets. Do not introduce external fonts or hosted resources.

Use weight 425 for body text, 450 for navigation/labels and display headings, and
500 only for selective emphasis. Body copy should be about 18–22px,
with hierarchy expressed through size, spacing and weight. Preserve the immersive
photography, restrained editorial layouts, thin borders and generous spacing.
The restored page gradient is white → cream → blue → cream → white, defined in
`src/styles/gradientPalette.css` from the version preceding commit `43c382a5`.
Keep backgrounds free of leather texture, grain and decorative noise. Editorial
section gaps use 288–384px on desktop and 104–160px on mobile, with clearance for
parallax image travel. Homepage media panels and their dark legibility overlays
are intentional exceptions.

The shared header uses `oldtimermanufaktur-mark.svg` above “Die Oldtimermanufaktur”,
with a 112px desktop and 88px mobile height plus safe-area insets. Keep the blurred
header and meaningful focus states. Do not copy protected reference-site assets or
trade dress. Keep imported project-local media in `src/assets/oldtimer/` and use
informative image alternatives; empty alternatives are only for decorative media.

## Accessibility and motion

Preserve the skip link and exactly one `<main id="main-content" tabindex="-1">`.
Keep semantic headings, keyboard access, visible focus, accurate expanded/hidden
states, and menu/footer focus containment, Escape-to-close and focus restoration.
Hidden modal content must remain inert and outside the accessibility tree.
Enable the custom cursor only for fine pointers; keep the system-pointer choice.
Normal text selection and context menus remain available. Restrict drag/selection
and context-menu deterrence to media; these measures are not DRM.

Preserve the existing motion controller, accessible play/pause controls and manual
playback for reduced-motion visitors. Motion preferences must update during the
visit. Autoplay starts only after visibility and preference checks. Load animated
fallbacks only after failed/stalled playback, and pause video and heading motion
when requested. Do not eagerly download both video and animated fallback.

Use `npm run encode-video -- input output-base-name` for future video assets.
Autoplay MP4 must contain exactly one H.264 video stream, 8-bit yuv420p, fast-start
metadata and no audio, subtitle or data/timecode streams; validate with ffprobe.
Keep MP4 before optional WebM, muted/loop/playsinline, a lightweight initial still,
and hide video until playback succeeds. Preserve the existing deferred-media pattern.

## Metadata and crawler files

Update relevant Open Graph and truthful JSON-LD in the same change as page content,
identity, services, contact information or imagery. Use shared Layout props and
absolute URLs respecting both deployment bases. Every page needs complete baseline
Open Graph tags and meaningful image alternatives. Noindex pages have no canonical
link or JSON-LD graph. Never invent business facts, prices, reviews or services.

`public/sitemap.xml` lists only the four retained indexable routes and their English
versions. Use reviewed dates in `src/config/modificationDates.js`, never the build
clock; advance the shared date for site-wide changes. After relevant changes run
`npm run crawlers:sync` explicitly and review its diff. Ordinary builds validate
crawler files without rewriting source. Maintain the concise German `public/llms.txt`
manually whenever the site changes; never list missing, duplicate, redirected or
noindex pages. Review `public/robots.txt` in the same change, retaining its production
sitemap hostname and matching its policy to current routes and media.

## Commands and verification

Run commands from the repository root with Node >=22.12.0 and npm >=11.18.0:

- `npm ci`: install the reviewed lockfile.
- `npm run dev`: start Astro, normally at localhost:4321.
- `npm test`: shared Node regression tests (`npm run test:site` is an alias).
- `npm run crawlers:sync`: explicitly update the sitemap and validate manual crawler files.
- `npm run crawlers:check`: validate without rewriting source.
- `npm run build`: root-base production-format build with output checks.
- `npm run build:pages`: `/oldtimer/` GitHub Pages preview build with noindex.
- `npm run preview`: serve generated output.
- `npm run security:check`: dependency audit and registry signature verification.

For shared changes run npm test and both builds; confirm builds leave tracked
source unchanged. Keep focused Node tests in `tests/` and verification scripts in
`scripts/`. Preserve CSP, deployment-artifact, metadata, language, accessibility and
motion checks when simplifying tooling. Never edit node_modules or dist manually.

For visual changes check retained pages and homepage around 1440px and 390px, both
languages, short-screen menus, text wrapping, image crops, header clearance and
focus. Check normal and reduced-motion playback, fallback races and absence of
fallback requests during successful playback. Test CSP against built output, since
dev mode does not enable Astro CSP. For interactions include Chromium, Safari and
Firefox when available; report unavailable browser/hosting checks honestly.
Verify the 404 home link, noindex metadata and `ErrorDocument 404 /404.html` in the
Apache artifact. Keep commits brief and focused. PRs should explain the final
behavior and verification, with screenshots for visual changes.

## Preview and release safeguards

Keep preview labels and GitHub Pages noindex active. Builds do not authorize a
release. Never deploy without an explicit request; `npm run deploy` publishes the
GitHub Pages build. Serve only generated dist, never the repository root.

Before a public production release, obtain approved factual/company copy, media
rights and legal texts; confirm actual hosting, contact and business facts; replace
any placeholders; review legal/privacy, accessibility, cookies, metadata, crawler,
security and browser behavior; only then change preview flags. Empty legal pages
and noindex are not legal approval for public hosting.

Handle legal/privacy review proportionately and silently for routine styling or
copy maintenance. Raise only concrete questions for actual changes such as personal
data collection, third-party resources, commerce, new substantive business claims
or unconfirmed media rights. Do not replace production legal text unless asked.
