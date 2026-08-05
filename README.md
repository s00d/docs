# Nuxt I18n Micro — Mintlify docs

Public documentation for [Nuxt I18n Micro](https://github.com/s00d/nuxt-i18n-micro), built with [Mintlify](https://mintlify.com).

## Source of truth

VitePress docs in the [main module repository](https://github.com/s00d/nuxt-i18n-micro/tree/main/docs) remain the primary source. This Mintlify site is maintained as a separate deployment; update MDX here when publishing doc changes.

## Local preview

```bash
npm i -g mint
mint dev
```

Open `http://localhost:3000`.

## Publishing

Push to `main`. Mintlify deploys via the GitHub app connected in the [Mintlify dashboard](https://dashboard.mintlify.com).

## Structure

- `docs.json` — navigation, theme colors, logos
- `index.mdx`, `quickstart.mdx`, `installation.mdx` — getting started
- `guides/` — user guides
- `api/` — module API, composables, components, package APIs
- `integrations/` — framework packages
- `migration/` — migration guides
- `.mintlify/Assistant.md` — Mintlify AI assistant instructions

Maintainer-only docs (contribution, release smoke, maintenance commands) and full release news stay in the [GitHub repo](https://github.com/s00d/nuxt-i18n-micro/tree/main/docs).
