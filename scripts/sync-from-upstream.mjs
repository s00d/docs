#!/usr/bin/env node
// Sync the Mintlify site from the Nuxt Content docs of s00d/nuxt-i18n-micro.
//
//   node scripts/sync-from-upstream.mjs <path to nuxt-i18n-micro/docs/content>
//
// Owns (deleted and regenerated on every run): guide/, integrations/, api/,
// composables/, components/, changelog/, images/, v3.mdx and `navigation.tabs`
// in docs.json. Everything else (index.mdx, navbar, footer, redirects, ...) is
// hand-maintained and left alone.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE = 'https://s00d.github.io/nuxt-i18n-micro'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
if (!process.argv[2]) {
  console.error('usage: node scripts/sync-from-upstream.mjs <nuxt-i18n-micro/docs/content>')
  process.exit(1)
}
const SRC = path.resolve(process.argv[2])
const PUBLIC = path.join(SRC, '..', 'public')

// Tabs in docs.json and the source folders each one holds (order inside a tab
// follows `.navigation.yml` order of the folders).
const TABS = [
  { tab: 'Guide', dirs: ['guide'] },
  { tab: 'Frameworks', dirs: ['integrations'] },
  { tab: 'API reference', dirs: ['api', 'api/packages', 'composables', 'components'] },
]
const OWNED = ['guide', 'integrations', 'api', 'composables', 'components', 'changelog', 'images', 'v3.mdx']

const CALLOUTS = { tip: 'Tip', note: 'Note', info: 'Info', important: 'Info', warning: 'Warning', caution: 'Warning', danger: 'Danger', success: 'Check' }
const SIMPLE = { 'code-group': 'CodeGroup', tabs: 'Tabs', steps: 'Steps', 'card-group': 'CardGroup cols={2}' }
// Nuxt UI uses Lucide (`i-lucide-*`); the Mintlify site uses Font Awesome.
const ICONS = { 'book-open': 'book-open', boxes: 'boxes-stacked', braces: 'brackets-curly', component: 'puzzle-piece', 'external-link': 'arrow-up-right-from-square', 'git-pull-request': 'code-pull-request' }

const warnings = []
const read = (f) => fs.readFileSync(f, 'utf8')

// --- tiny YAML subset: `key: value` with one level of nesting --------------
function parseYaml(text) {
  const out = {}
  let parent = null
  for (const line of text.split('\n')) {
    const m = line.match(/^(\s*)([\w-]+):\s*(.*)$/)
    if (!m) continue
    const [, indent, key, raw] = m
    const value = unquote(raw.trim())
    if (indent && parent) parent[key] = value
    else if (raw.trim() === '') out[key] = parent = {}
    else ((out[key] = value), (parent = null))
  }
  return out
}
function unquote(v) {
  if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/''/g, "'")
  if (v.startsWith('"') && v.endsWith('"')) return JSON.parse(v)
  if (v === 'false') return false
  if (v === 'true') return true
  if (/^-?\d+$/.test(v)) return Number(v)
  return v
}
function splitFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/)
  return m ? [parseYaml(m[1]), text.slice(m[0].length)] : [{}, text]
}
const dirMeta = (dir) => {
  const f = path.join(SRC, dir, '.navigation.yml')
  const y = fs.existsSync(f) ? parseYaml(read(f)) : {}
  return { title: y.title ?? dir, order: y.navigation?.order ?? 0 }
}

// --- collect pages ----------------------------------------------------------
const pages = [] // { src, dest, dir, fm, body }
const routes = new Map() // source route -> Mintlify route
for (const dir of TABS.flatMap((t) => t.dirs)) {
  for (const name of fs.readdirSync(path.join(SRC, dir)).sort()) {
    if (!name.endsWith('.md')) continue
    const base = name.slice(0, -3)
    const src = `${dir}/${base}`
    // `x/index.md` and `x.md` next to a folder `x/` become `x/overview`
    const dest = base === 'index' ? `${dir}/overview` : fs.existsSync(path.join(SRC, dir, base)) ? `${dir}/${base}/overview` : src
    const [fm, body] = splitFrontmatter(read(path.join(SRC, dir, name)))
    pages.push({ src, dest, dir: path.posix.dirname(dest), fm, body })
    routes.set('/' + (base === 'index' ? dir : src), '/' + dest)
  }
}
const news = []
for (const name of fs.readdirSync(path.join(SRC, 'news')).sort()) {
  if (!/^v[\d.]+\.md$/.test(name)) continue
  const [fm, body] = splitFrontmatter(read(path.join(SRC, 'news', name)))
  const date = body.match(/^\*\*Date\*\*:\s*(\d{4}-\d{2}-\d{2})/m)?.[1]
  if (!date) throw new Error(`news/${name}: no **Date** line`)
  news.push({ version: name.slice(0, -3), date, fm, body, src: `news/${name.slice(0, -3)}` })
}
const verKey = (v) => v.slice(1).split('.').map((n) => n.padStart(5, '0')).join('.')
news.sort((a, b) => b.date.localeCompare(a.date) || verKey(b.version).localeCompare(verKey(a.version)))
for (const n of news) {
  const clash = news.filter((o) => o.date === n.date).length > 1
  n.dest = `changelog/${n.date}${clash ? '-' + n.version.replace(/\./g, '-') : ''}`
  routes.set('/' + n.src, '/' + n.dest)
}
routes.set('/news', '/' + news[0].dest)

// --- links and assets -------------------------------------------------------
const assets = new Set()
function asset(p) {
  const file = path.join(PUBLIC, p)
  if (!fs.existsSync(file)) warnings.push(`missing asset ${p}`)
  else assets.add(p)
  return '/images' + p
}
// Heading ids differ: Nuxt Content drops punctuation (`### `<i18n-t>`` is `#i18n-t`),
// Mintlify keeps it and turns spaces and dots into `-` (`#<i18n-t>`, `#$t`, `#in-nuxt-config`)
const nuxtId = (h) => h.replace(/`/g, '').trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
const mintId = (h) => h.replace(/`/g, '').trim().toLowerCase().replace(/[\s.]+/g, '-')
const anchors = new Map() // Mintlify route -> Map(source id -> Mintlify id)
for (const p of [...pages, ...news]) {
  const ids = new Map()
  for (const [, h] of p.body.matchAll(/^#{2,6}\s+(.*)$/gm)) if (nuxtId(h) !== mintId(h)) ids.set(nuxtId(h), mintId(h))
  anchors.set('/' + p.dest, ids)
}
function mapUrl(url, src) {
  if (/^[a-z]+:/i.test(url)) return url
  const [, p0, hash = ''] = url.match(/^([^#?]*)(.*)$/)
  let p = p0 === '' ? '/' + src : p0.startsWith('/') ? p0 : path.posix.join('/', path.posix.dirname(src), p0)
  if (p.length > 1) p = p.replace(/\/+$/, '')
  if (p === '/') return '/' + hash
  if (routes.has(p)) {
    const to = routes.get(p)
    const id = anchors.get(to)?.get(hash.replace(/^#/, ''))
    return (p0 === '' ? '' : to) + (id ? '#' + id : hash)
  }
  if (path.posix.extname(p)) return asset(p) + hash
  // not ported: the real site, under /v3 when only v3 has the page
  const v3 = !p.startsWith('/v3') && (fs.existsSync(path.join(SRC, 'v3', p + '.md')) || fs.existsSync(path.join(SRC, 'v3', p, 'index.md')))
  if (!p.startsWith('/v3') && !p.startsWith('/contributing') && !v3) warnings.push(`link to unported ${p} -> real site`)
  return SITE + (v3 ? '/v3' : '') + p + hash
}

// --- MDC -> MDX ---------------------------------------------------------------
const attrs = (s = '') => Object.fromEntries([...s.matchAll(/([\w-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]))
// Mintlify renders `$a … $b` in a description as KaTeX math: quote such names as code
const noMath = (v) => ((v?.match(/\$/g)?.length ?? 0) > 1 ? v.replace(/\$[\w$]*/g, '`$&`') : v)
const jsx = (v) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
const CHART = '\u0000chart\u0000'

function prose(line, page) {
  // keep inline code untouched; rewrite links/images and escape MDX specials elsewhere
  return line
    .replace(/<code(?: v-pre)?>([^<`]*)<\/code>/g, '`$1`')
    // code spans: a run of N backticks closed by a run of exactly N
    .split(/((?<!`)(`+)(?!`).*?[^`]\2(?!`))/)
    .filter((_, i) => i % 3 !== 2) // drop the inner backtick-run group
    .map((seg, i) => {
      if (i % 2) return seg
      return seg
        .replace(/(!\[[^\]]*\])\(([^)\s]+)\)(\{[^}]*\})?|\]\(([^)\s]+)\)/g, (_, img, src, _a, url) => (img ? `${img}(${mapUrl(src, page)})` : `](${mapUrl(url, page)})`))
        .replace(/[{}]/g, (c) => '\\' + c)
        .replace(/</g, '&lt;')
    })
    .join('')
}

function convert(body, src) {
  const out = []
  const stack = [] // { tag, indent, steps?: { level, open } }
  let fence = null // closing fence marker
  let comment = false
  let h1Removed = false
  const emit = (...l) => out.push('', ...l, '')
  const indentOf = () => (stack.length ? stack[stack.length - 1].indent : 0)

  for (const raw of body.split('\n')) {
    const line = raw.slice(Math.min(indentOf(), raw.length - raw.trimStart().length))
    if (fence) {
      out.push(line)
      if (line.trim().startsWith(fence) && line.trim().replace(/[`~]/g, '') === '') fence = null
      continue
    }
    if (comment) {
      if (line.includes('-->')) comment = false
      continue
    }
    const f = line.match(/^(\s*)(`{3,}|~{3,})([^\s[]*)\s*(?:\[([^\]]+)\])?\s*(.*)$/)
    if (f) {
      fence = f[2]
      const [, ind, ticks, lang, title, rest] = f
      out.push(`${ind}${ticks}${lang || (title ? 'text' : '')}${title ? ' ' + title : ''}${rest ? ' ' + rest : ''}`)
      continue
    }
    if (/^\s*<!--/.test(line)) {
      if (!line.includes('-->')) comment = true
      continue
    }
    const open = raw.match(/^(\s*):{2,}([a-z][\w-]*)(?:\{(.*)\})?\s*$/)
    if (open) {
      const [, ind, name, a] = open
      const at = attrs(a)
      const entry = { indent: ind.length }
      if (name === 'docs-chart') ((entry.tag = null), out.push(CHART))
      else if (CALLOUTS[name]) emit(`<${(entry.tag = CALLOUTS[name])}>`)
      else if (SIMPLE[name]) {
        entry.tag = SIMPLE[name].split(' ')[0]
        emit(`<${SIMPLE[name]}>`)
        if (name === 'steps') entry.steps = { level: Number(at.level || 3), open: false }
      } else if (name === 'card') {
        const icon = at.icon ? ICONS[at.icon.replace(/^i-lucide-/, '')] ?? at.icon.replace(/^i-lucide-/, '') : null
        emit(`<Card title="${jsx(at.title ?? '')}"${icon ? ` icon="${icon}"` : ''}${at.to ? ` href="${jsx(mapUrl(at.to, src))}"` : ''}>`)
        entry.tag = 'Card'
      } else if (name === 'tabs-item') {
        entry.tag = 'Tab'
        emit(`<Tab title="${jsx(at.label ?? '')}">`)
      } else if (name === 'collapsible') {
        entry.tag = 'Accordion'
        emit(`<Accordion title="${jsx(at.title ?? 'Details')}">`)
      } else throw new Error(`${src}: unsupported MDC component ::${name}`)
      stack.push(entry)
      continue
    }
    if (/^\s*:{2,}\s*$/.test(raw)) {
      const e = stack.pop()
      if (!e) throw new Error(`${src}: unmatched ::`)
      if (e.steps?.open) emit('</Step>')
      if (e.tag) emit(`</${e.tag}>`)
      continue
    }
    // generated API pages: <details><summary>title</summary> ... </details>
    if (/^\s*<details>\s*$/.test(line)) continue
    const summary = line.match(/^\s*<summary>(.*)<\/summary>\s*$/)
    if (summary) {
      emit(`<Accordion title="${jsx(summary[1].replace(/<\/?code>/g, '`'))}">`)
      continue
    }
    if (/^\s*<\/details>\s*$/.test(line)) {
      emit('</Accordion>')
      continue
    }
    const steps = stack[stack.length - 1]?.steps
    const h = line.match(/^(#{1,6})\s+(.*)$/)
    if (steps && h && h[1].length === steps.level) {
      if (steps.open) emit('</Step>')
      emit(`<Step title="${jsx(h[2])}">`)
      steps.open = true
      continue
    }
    if (h && h[1].length === 1 && !h1Removed) {
      h1Removed = true
      continue
    }
    if (stack[stack.length - 1]?.tag === null) continue // inside a dropped component
    out.push(prose(line, src))
  }
  if (fence || stack.length) throw new Error(`${src}: unclosed ${fence ? 'code fence' : 'component'}`)

  // charts are interactive on the real site only: one link per page instead
  const chartNote = `The interactive charts for these results are on the [benchmarks page](${SITE}/guide/performance-results) of the main site.`
  let charts = 0
  return out
    .join('\n')
    .replace(new RegExp(`${CHART}(\\s*${CHART})*`, 'g'), () => (charts++ ? '' : chartNote))
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const frontmatter = (fm) =>
  '---\n' +
  Object.entries(fm)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}: ${JSON.stringify(String(v))}`)
    .join('\n') +
  '\n---\n\n'

function write(dest, fm, body) {
  const file = path.join(ROOT, dest + '.mdx')
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, frontmatter(fm) + body + '\n')
}

// --- write ------------------------------------------------------------------
for (const o of OWNED) fs.rmSync(path.join(ROOT, o), { recursive: true, force: true })

for (const p of pages) {
  const sidebarTitle = p.fm.navigation?.title
  write(p.dest, { title: p.fm.title, description: noMath(p.fm.description), sidebarTitle }, convert(p.body, p.src))
}
for (const n of news) {
  const h1 = n.body.match(/^# (.*)$/m)?.[1] ?? ''
  const subtitle = h1.replace(/^Nuxt I18n Micro\s+/, '').replace(new RegExp(`^${n.version.replace(/\./g, '\\.')}\\s*`), '').replace(/^[—–-]\s*/, '')
  write(n.dest, { title: subtitle ? `${n.version} — ${subtitle}` : n.version, description: noMath(n.fm.description) }, convert(n.body, n.src))
}
write(
  'v3',
  { title: 'v3 documentation', description: 'Where to find the documentation of nuxt-i18n-micro v3.' },
  `This site documents nuxt-i18n-micro v4. The v3 documentation is kept on the main site: [${SITE}/v3](${SITE}/v3).\n\nTo move an app from v3 to v4, read [Upgrading](${routes.get('/guide/upgrade') ?? SITE + '/guide/upgrade'}).`,
)
for (const a of assets) {
  const to = path.join(ROOT, 'images', a)
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(path.join(PUBLIC, a), to)
}

// --- navigation ---------------------------------------------------------------
const order = (p) => p.fm.navigation?.order ?? Number.MAX_SAFE_INTEGER
const label = (p) => p.fm.navigation?.title ?? p.fm.title ?? p.dest
const tabs = TABS.map(({ tab, dirs }) => {
  const groups = []
  for (const dir of [...dirs].sort((a, b) => dirMeta(a).order - dirMeta(b).order)) {
    const byGroup = new Map()
    const inDir = pages.filter((p) => p.dir === dir).sort((a, b) => (a.dest.endsWith('/overview') ? -1 : b.dest.endsWith('/overview') ? 1 : 0) || order(a) - order(b) || label(a).localeCompare(label(b)))
    for (const p of inDir) {
      const g = p.fm.navigation?.group ?? dirMeta(dir).title
      if (!byGroup.has(g)) byGroup.set(g, [])
      byGroup.get(g).push(p.dest)
    }
    for (const [group, list] of byGroup) groups.push({ group, pages: list })
  }
  return { tab, groups }
})
tabs[0].groups[0].pages.unshift('index')
tabs.push({ tab: 'Changelog', groups: [{ group: 'Releases', pages: news.map((n) => n.dest) }, { group: 'Older versions', pages: ['v3'] }] })

const docsFile = path.join(ROOT, 'docs.json')
const docs = JSON.parse(read(docsFile))
docs.navigation = { tabs, global: docs.navigation?.global }
for (const a of docs.navigation.global?.anchors ?? []) if (a.anchor === 'Changelog') a.href = '/' + news[0].dest
fs.writeFileSync(docsFile, JSON.stringify(docs, null, 2) + '\n')

console.log(`pages: ${pages.length}, changelog: ${news.length}, images: ${assets.size}`)
for (const w of [...new Set(warnings)]) console.warn('warn: ' + w)
