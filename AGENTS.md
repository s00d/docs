# Documentation project instructions

## About this project

- Mintlify docs for **Nuxt I18n Micro** v4 (`nuxt-i18n-micro` on npm)
- English only: no translations, no `navigation.languages` in `docs.json`
- Pages are MDX with YAML frontmatter (`title`, `description`, optional `sidebarTitle`)
- Configuration: `docs.json`

## Upstream and sync

The source of truth is the Nuxt Content site of the main repository:
[`s00d/nuxt-i18n-micro` `docs/content/`](https://github.com/s00d/nuxt-i18n-micro/tree/main/docs/content)
(MDC syntax, assets in `docs/public/`). Do not edit synced pages by hand: change them upstream and sync.

```bash
node scripts/sync-from-upstream.mjs <path to nuxt-i18n-micro>/docs/content
mint validate && mint broken-links
```

The script (plain Node, no dependencies):

- regenerates `guide/`, `integrations/`, `api/` (with `api/packages/`), `composables/`, `components/`,
  `changelog/` (from `news/`, one dated file per release), `images/` (assets the pages reference) and `v3.mdx`;
  these paths are deleted on every run, so do not keep hand-written files there;
- converts MDC to Mintlify components (`::tip`/`::note`/`::warning` callouts, `::code-group`, `::card-group`/`:::card`,
  `::tabs`, `::steps`, `::collapsible`), drops `::docs-chart` for a link to the real site, escapes `{ } <` in prose
  and removes HTML comments; an unknown MDC component stops the run;
- rewrites internal links (`x/index` and `x.md` next to a folder `x/` become `x/overview`); links to pages that are not
  ported go to `https://s00d.github.io/nuxt-i18n-micro`, under `/v3` when only v3 has the page;
- rewrites `navigation.tabs` in `docs.json` from `navigation.order`, `navigation.group` and `.navigation.yml` titles,
  and the `Changelog` global anchor. Other `docs.json` keys (navbar, footer, redirects, theme) are left alone.

Not ported: `contributing/` (maintainer docs, link to the real site or GitHub) and `v3/` (only `v3.mdx`, a link to
`https://s00d.github.io/nuxt-i18n-micro/v3`). `news/index.md` is replaced by the Changelog tab.

Hand-maintained: `index.mdx` (CardGroup landing layout, do not replace with marketing charts), `docs.json` outside
`navigation.tabs`, `.mintlify/Assistant.md`, this file.

## Terminology

- **Module** — the Nuxt module `nuxt-i18n-micro` (configured under `i18n` in `nuxt.config`)
- **Locale** — language code (`en`, `fr`, …), not “language” in prose unless discussing human languages
- **Strategy** — routing strategy: `prefix`, `no_prefix`, `prefix_except_default`, `prefix_and_default`
- **Package APIs** — workspace packages `@i18n-micro/*` documented under `api/packages/`

## Content boundaries

- Document public user-facing APIs and guides only
- Full git-style changelog remains on GitHub: `CHANGELOG.md`

## Publishing

After a sync, run `mint validate`, `mint broken-links` and `mint dev`, then commit and push to `main`.
