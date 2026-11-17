import fs from 'node:fs'
import JSON5 from 'json5'

const UPSTREAM = 'https://cdn.jsdelivr.net/gh/Lin-arm/GKD_subscription@main/dist/gkd.json5'

const base = JSON5.parse(await (await fetch(UPSTREAM)).text())
const mine = JSON5.parse(fs.readFileSync('my-rules.json5', 'utf8'))

const apps = base.apps ?? []
for (const myApp of mine.apps ?? []) {
  const hit = apps.find((a) => a.id === myApp.id)
  if (!hit) { apps.push(myApp); continue }
  hit.groups ??= []
  for (const g of myApp.groups ?? []) {
    const i = hit.groups.findIndex((x) => x.key === g.key)
    if (i >= 0) hit.groups[i] = g
    else hit.groups.push(g)
  }
  hit.name ??= myApp.name
}

const out = {
  ...base,
  id: mine.id,
  name: mine.name,
  author: mine.author,
  version: (base.version ?? 0) + 100000,
  checkUpdateUrl: './gkd.version.json5',
  supportUri: mine.supportUri,
  apps,
}
delete out.updateUrl

fs.mkdirSync('dist', { recursive: true })
fs.writeFileSync('dist/gkd.json5', JSON5.stringify(out, null, 2))
fs.writeFileSync(
  'dist/gkd.version.json5',
  JSON5.stringify({ id: out.id, version: out.version }, null, 2),
)
console.log(`built id=${out.id} version=${out.version} apps=${apps.length}`)
