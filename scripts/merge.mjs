import fs from 'node:fs'
import JSON5 from 'json5'

const UPSTREAM = 'https://cdn.jsdelivr.net/gh/Lin-arm/GKD_subscription@main/dist/gkd.json5'
const DIST = 'dist/gkd.json5'
const VER = 'dist/gkd.version.json5'

const base = JSON5.parse(await (await fetch(UPSTREAM)).text())
const mine = JSON5.parse(fs.readFileSync('my-rules.json5', 'utf8'))

const apps = base.apps ?? []
for (const myApp of mine.apps ?? []) {
  const hit = apps.find((a) => a.id === myApp.id)
  if (!hit) {
    apps.push(myApp)
    continue
  }
  hit.groups ??= []
  for (const g of myApp.groups ?? []) {
    const i = hit.groups.findIndex((x) => x.key === g.key)
    if (i >= 0) hit.groups[i] = g
    else hit.groups.push(g)
  }
  hit.name ??= myApp.name
}

let prevVersion = 0
try {
  prevVersion = JSON5.parse(fs.readFileSync(VER, 'utf8')).version ?? 0
} catch {}

const build = (version) => {
  const out = {
    ...base,
    id: mine.id,
    name: mine.name,
    author: mine.author,
    version,
    checkUpdateUrl: './gkd.version.json5',
    supportUri: mine.supportUri,
    apps,
  }
  delete out.updateUrl
  return out
}

// 关键：内容有变化时版本号必须递增，否则客户端会判定「版本没推进」而拒绝更新
let version = Math.max(prevVersion, (base.version ?? 0) + 100000)
let text = JSON5.stringify(build(version), null, 2)
const oldText = fs.existsSync(DIST) ? fs.readFileSync(DIST, 'utf8') : ''
if (oldText && oldText !== text && version <= prevVersion) {
  version = prevVersion + 1
  text = JSON5.stringify(build(version), null, 2)
}

fs.mkdirSync('dist', { recursive: true })
fs.writeFileSync(DIST, text)
fs.writeFileSync(VER, JSON5.stringify({ id: mine.id, version }, null, 2))
console.log(`built id=${mine.id} version=${version} apps=${apps.length}`)
