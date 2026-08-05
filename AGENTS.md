# Documentation project instructions

## About this project

- Mintlify docs for **Nuxt I18n Micro** (`nuxt-i18n-micro` on npm)
- Pages are MDX with YAML frontmatter (`title`, `description`)
- Configuration: `docs.json`
- Content is synced from `s00d/nuxt-i18n-micro` via `pnpm run docs:mintlify-sync`

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
- Do not duplicate full changelog — link to `CHANGELOG.md`
- `index.mdx` uses CardGroup landing layout; do not replace with VitePress marketing charts

## Sync workflow

After editing VitePress docs in the main repo:

```bash
pnpm run docs:mintlify-sync -- --out /path/to/s00d/docs
```

Then commit and push this repository.
