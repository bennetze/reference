# Demo/reference website — design showcase

A German-language Astro website-design reference for prospective clients. It demonstrates
an immersive editorial site with local photography, background video and accessible
navigation. It remains a labelled development preview, not an approved production release.

This is an independent design demonstration. “Die Oldtimermanufaktur” is used solely
as an example; this project is not the company's website and has no connection to
or affiliation with the company. It does not imply company involvement,
endorsement or approval.

## Pages and design

The homepage, Handwerk, Über uns and Projekte overview are retained in German.
Projekte is a three-photograph composition with inactive panels; there are
no vehicle archives, detail pages, galleries or internal-editor dependencies.
Impressum and Datenschutz contain only their headings and shared header/footer.
Both legal pages and the custom 404 remain noindex.

All typography uses locally hosted variable Jost. Moderate-weight display headings and
larger 18–22px body copy establish the hierarchy. The original
SVG vehicle mark sits above the example name in the blurred header (112px desktop,
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

`npm run dev` first runs the root-base build checks, then builds the GitHub Pages
preview and pushes the generated `dist/` contents to `gh-pages` in
`bennetze/reference`. Astro starts only after a successful deployment. This publishes
once at startup; edits during the dev session stay local until the next deployment.
Use `npm run dev:local` to start Astro without building or publishing.

After `npm run build`, serve the generated root-base output with `npm run preview`.
After `npm run build:pages`, use `npm run preview:pages` and open `/reference/`.
Stop an existing Astro preview (`npx astro preview stop`) before switching build
targets, since Astro reuses its running preview server.

`npm run test:browser` runs the optional Playwright checks against `SITE_URL`
(default `http://localhost:4321`). Include the deployment base for Pages, for
example `SITE_URL=https://bennetze.github.io/reference`. `PLAYWRIGHT_MODULE` can
select an installed Playwright runtime; `BROWSERS` selects engines. The checks
cover every retained route, disclosure entry,
menus and focus, section anchors, short screens, CSP and rendering without JavaScript.
Unavailable engines are reported explicitly. `REPORT_FILE` saves the JSON result;
`SCREENSHOT_DIR` saves Chromium disclosure screenshots.

`npm run test:site` is an alias for npm test. Builds verify CSP hashes, IDs, local
links, image dimensions, metadata dates, German-only output, motion controls,
accessibility invariants and deployment artifacts. These checks are not a WCAG
certification or live-host verification. For UI changes, check desktop/mobile
against built output as well as dev. Astro CSP is inactive in dev.

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

## Website language

All pages, navigation and metadata are German. The site uses the original routes
without language prefixes, switches, browser-language redirects or language query
parameters. German content remains readable without JavaScript.

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

`npm run build` uses the configured metadata origin and a root base. That
configuration is part of the demonstration and does not establish company hosting
or authorization to publish. `npm run build:pages` uses
`https://bennetze.github.io/reference/` and keeps preview noindex behavior.
Internal paths must respect
`import.meta.env.BASE_URL`.

After route or reviewed-date changes, explicitly run `npm run crawlers:sync` and
review public/sitemap.xml. Only the four retained German indexable pages
belong in the sitemap. Manually update the German llms.txt summary whenever
the website changes and review robots.txt alongside it. Build validation never
rewrites approved source wording or uses the build clock as a modification date.

Deploy only generated dist. Apache `.htaccess` provides security headers,
compression, asset caching and `ErrorDocument 404 /404.html`; GitHub Pages ignores
Apache directives. Validate actual headers, MIME types and error responses on the
intended host before release. Do not publish repository files or credentials.

```sh
# Builds and publishes the preview to bennetze/reference's gh-pages branch.
npm run deploy
```

The showcase's empty legal pages and preview labels do not approve public release.
Keep preview safeguards until factual copy, rights to published media, approved legal
texts and actual business/hosting details are confirmed and release checks pass.
