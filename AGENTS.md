# Documentation project instructions

## About this project

- Mintlify docs for **Nuxt I18n Micro** (`nuxt-i18n-micro` on npm)
- Pages are MDX with YAML frontmatter (`title`, `description`)
- Configuration: `docs.json`
- VitePress docs in `s00d/nuxt-i18n-micro` are the upstream reference; edit MDX in this repo when publishing

## Terminology

- **Module** — the Nuxt module `nuxt-i18n-micro` (configured under `i18n` in `nuxt.config`)
- **Locale** — language code (`en`, `fr`, …), not “language” in prose unless discussing human languages
- **Strategy** — routing strategy: `prefix`, `no_prefix`, `prefix_except_default`, `prefix_and_default`
- **Package APIs** — workspace packages `@i18n-micro/*` documented under `api/packages/`

## Style preferences

- Active voice, second person (“you”)
- Sentence case for headings
- Use Mintlify components: `<Tip>`, `<Warning>`, `<Info>`, `<Accordion>`, `<CodeGroup>`, `<CardGroup>`
- Bold UI elements; backticks for code, paths, options, and package names

## Content boundaries

- Document public user-facing APIs and guides only
- Do not duplicate maintainer docs (contribution, testing-strategies, release-smoke) — link to GitHub
- User-facing release notes live under `changelog/` (ported from VitePress `docs/news`); keep dated MDX files in sync when publishing news
- Full git-style changelog remains on GitHub: `CHANGELOG.md`
- `index.mdx` uses CardGroup landing layout; do not replace with VitePress marketing charts

## Publishing

After editing pages, run `mint dev` locally, then commit and push to `main`.
