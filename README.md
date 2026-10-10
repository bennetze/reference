# Die Oldtimermanufaktur — website showcase

A bilingual Astro website-design reference for prospective clients. It demonstrates
an immersive editorial site with local photography, background video and accessible
navigation. It remains a labelled development preview, not an approved production release.

## Pages and design

The homepage, Handwerk, Über uns and Projekte overview are retained in German and
English. Projekte is a three-photograph composition with inactive panels; there are
no vehicle archives, detail pages, galleries or internal-editor dependencies.
Impressum and Datenschutz contain only their headings and shared header/footer.
Both legal pages and the custom 404 remain noindex.

All typography uses locally hosted variable Jost. Moderate-weight display headings and
larger 18–22px body copy establish the hierarchy. The original
SVG vehicle mark sits above the company name in the blurred header (112px desktop,
88px mobile). Editorial section gaps provide measured breathing room while preserving parallax clearance.
Editorial and legal pages use the restored white/cream/blue gradient;
there is no leather texture or grain. Homepage photographic overlays are preserved.

`src/pages/` owns routes, `src/layouts/` owns shared documents/editorial structure,
and `src/components/` owns site chrome, section navigation and motion media.
Imported media lives in `src/assets/oldtimer/`; static crawler files, favicons,
Apache configuration and licenses live in `public/`.

## Development and checks

Use Node >=22.12.0 and npm >=11.18.0. Install from the reviewed lockfile:

```sh
npm ci
npm run dev
npm test
npm run crawlers:check
npm run build
npm run build:pages
```

`npm run test:site` is an alias for npm test. Builds verify CSP hashes, IDs, local
links, image dimensions, metadata dates, language coverage, motion controls,
accessibility invariants and deployment artifacts. These checks are not a WCAG
certification or live-host verification. For UI changes, check desktop/mobile and
both languages against built output as well as dev. Astro CSP is inactive in dev.

Additional commands:

```sh
npm run preview
npm run security:check
npm run audit:accessibility
npm run preview:accessibility
npm run audit:performance
```

The performance audit is local-only. Browser QA scripts use an optional Playwright
runtime through `PLAYWRIGHT_MODULE`; they are not application dependencies.
`node scripts/test-showcase.mjs` checks retained subpages;
`node scripts/test-homepage-layout.mjs` checks homepage widths and keyboard navigation.
Set `SITE_URL` to the actual local server URL and `BROWSERS` to available engines.
Security checks require npm network access and audit dependencies plus registry
signatures. Preserve version-specific install-script approvals in `.npmrc` and
package.json. Never use forced audit fixes or disable those approvals.

## German and English

`src/i18n/routes.mjs` registers English URLs under `/en/` using the same templates.
Middleware translates site text through `src/i18n/en.json`, localizes navigation and
metadata, and updates inline-script CSP hashes. Both languages are static HTML and
remain readable without JavaScript; assets and interactions are shared.

Browser language detection selects German for a first `de-*` preference and English
otherwise. DE/EN links explicitly choose `?lang=de` or `?lang=en`; that choice follows
internal navigation while preserving other query parameters and fragments. The
script does not use cookies, localStorage, sessionStorage or a translation service.
A bare German URL detects language again. English 404 handling avoids redirect loops.

## Fonts and media

The supplied Jost master is `src/assets/fonts/jost-variable.ttf`; the site serves
its WOFF2 derivative locally. Regenerate it with:

```sh
python -m pip install 'fonttools[woff]==4.66.0'
python scripts/generate-fonts.py
```

Generation preserves all glyphs, metrics and the 100–900 weight axis. The Jost
copyright and SIL Open Font License are in `public/licenses/Jost-OFL-1.1.txt`.
Other retained third-party assets keep their license files. No external font service
is used. `npm run encode-video -- input-video.mov output-base-name` provides the
existing MP4/WebM and animated-fallback workflow for future local media.

## Crawler files and hosting

`npm run build` uses `https://www.oldtimermanufaktur.de/` and a root base.
`npm run build:pages` uses `https://bennetze.github.io/oldtimer/` and keeps preview
noindex behavior. Internal paths must respect `import.meta.env.BASE_URL`.

After route or reviewed-date changes, explicitly run `npm run crawlers:sync` and
review public/sitemap.xml. Only the four retained indexable pages and their English
versions belong in the sitemap. Manually update the German llms.txt summary whenever
the website changes and review robots.txt alongside it. Build validation never
rewrites approved source wording or uses the build clock as a modification date.

Deploy only generated dist. Apache `.htaccess` provides security headers,
compression, asset caching and `ErrorDocument 404 /404.html`; GitHub Pages ignores
Apache directives. Validate actual headers, MIME types and error responses on the
intended host before release. Do not publish repository files or credentials.

```sh
# Only when explicitly requested: builds and publishes to gh-pages.
npm run deploy
```

The showcase's empty legal pages and preview labels do not approve public release.
Keep preview safeguards until factual copy, rights to published media, approved legal
texts and actual business/hosting details are confirmed and release checks pass.
