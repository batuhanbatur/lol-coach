// Dumps every champion ability's wiki notes into a local research corpus.
// Research tooling only: nothing here is read by the app, and nothing here
// writes to src/data. Output is raw wiki text for candidate-finding; every
// candidate still goes through the normal verdict pipeline.
//
// Usage: node scripts/fetch-wiki-corpus.js
// Output (gitignored): research/wiki-corpus/{abilities,mentions,meta}.json
//
// Plain Node 18+ (built-in fetch), no dependencies.

import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '..', 'research', 'wiki-corpus')

const API = 'https://wiki.leagueoflegends.com/en-us/api.php'
const ROSTER_PAGE = 'Module:ChampionData/data'
const USER_AGENT = 'lol-coach-research/0.1 (personal project; one-off corpus dump)'
const BATCH_SIZE = 50 // MediaWiki's max titles per request
const PAUSE_MS = 300 // be polite between requests

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function apiGet(params) {
  const query = new URLSearchParams({ format: 'json', formatversion: '2', ...params })
  const res = await fetch(`${API}?${query}`, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`Wiki API returned HTTP ${res.status}`)
  return res.json()
}

// Returns { [title]: { content, revised } } for the titles that exist.
async function fetchPages(titles) {
  const json = await apiGet({
    action: 'query',
    prop: 'revisions',
    rvprop: 'content|timestamp',
    rvslots: 'main',
    titles: titles.join('|'),
  })
  // The API may normalize a requested title (e.g. underscores); map back.
  const normalized = {}
  for (const n of json.query.normalized ?? []) normalized[n.from] = n.to

  const byTitle = {}
  for (const page of json.query.pages) {
    if (page.missing || !page.revisions) continue
    byTitle[page.title] = {
      content: page.revisions[0].slots.main.content,
      revised: page.revisions[0].timestamp.slice(0, 10),
    }
  }
  const result = {}
  for (const title of titles) {
    const page = byTitle[normalized[title] ?? title]
    if (page) result[title] = page
  }
  return result
}

// The roster page is a Lua table: one block per champion, with the CURRENT
// ability names in skill_i / skill_q / skill_w / skill_e / skill_r. Using it
// (instead of listing all "Data <Champion>/..." templates) skips the
// pre-rework ability templates that still exist on the wiki.
function parseRoster(lua) {
  const starts = [...lua.matchAll(/^ {2}\["([^"]+)"\] = \{$/gm)]
  return starts.map((match, i) => {
    const end = i + 1 < starts.length ? starts[i + 1].index : lua.length
    const block = lua.slice(match.index, end)
    const skills = []
    for (const key of ['i', 'q', 'w', 'e', 'r']) {
      const skillMatch = block.match(new RegExp(`\\["skill_${key}"\\]\\s*=\\s*\\{([^}]*)\\}`))
      if (!skillMatch) continue
      for (const name of skillMatch[1].matchAll(/"([^"]+)"/g)) {
        skills.push({ key: key === 'i' ? 'P' : key.toUpperCase(), ability: name[1] })
      }
    }
    const lastChanged = block.match(/\["changes"\]\s*=\s*"([^"]+)"/)?.[1] ?? null
    return { champion: match[1], lastChanged, skills }
  })
}

// Reads a single-line "|field = value" from an ability template.
function readField(wikitext, field) {
  const match = wikitext.match(new RegExp(`^\\|\\s*${field}[ \\t]*=[ \\t]*([^\\n]*)`, 'm'))
  return match ? match[1].trim() : ''
}

// Reads the multi-line "|notes = ..." block (ends at the next field or "}}").
function readNotes(wikitext) {
  const match = wikitext.match(/^\|\s*notes[ \t]*=([\s\S]*?)(?=^\|\s*[a-z][a-z0-9 _]*=|^\}\}\s*$)/m)
  return match ? match[1].trim() : ''
}

// A cross-champion mention = a note line on champion A's ability that names
// champion B (or one of B's abilities) through the wiki's link templates:
//   {{ai|Ability|Champion}}  {{cai|...}}  {{ais|...}}  {{cais|...}}  {{ci|Champion}}
function findMentions(abilities, championNames) {
  const mentions = []
  for (const a of abilities) {
    for (const rawLine of a.notes.split('\n')) {
      const line = rawLine.trim()
      const seen = new Set()
      const add = (otherChampion, otherAbility) => {
        if (!championNames.has(otherChampion) || otherChampion === a.champion) return
        const id = `${otherChampion}|${otherAbility}`
        if (seen.has(id)) return
        seen.add(id)
        mentions.push({
          champion: a.champion,
          key: a.key,
          ability: a.ability,
          otherChampion,
          otherAbility, // may be a name ("Wind Wall") or a key ("W"); '' if only the champion is named
          wikiFlaggedBug: line.includes('{{bug'),
          revised: a.revised,
          line,
        })
      }
      for (const m of line.matchAll(/\{\{c?ais?\|([^|}]+)\|([^|}]+)/g)) add(m[2].trim(), m[1].trim())
      for (const m of line.matchAll(/\{\{ci\|([^|}]+)/g)) {
        const name = m[1].trim()
        const alreadyViaAbility = [...seen].some((id) => id.startsWith(`${name}|`))
        if (!alreadyViaAbility) add(name, '')
      }
    }
  }
  return mentions
}

async function main() {
  console.log('Fetching champion roster...')
  const rosterPage = (await fetchPages([ROSTER_PAGE]))[ROSTER_PAGE]
  if (!rosterPage) throw new Error(`Could not read ${ROSTER_PAGE}`)
  const roster = parseRoster(rosterPage.content)

  const wanted = roster.flatMap((c) =>
    c.skills.map((s) => ({
      champion: c.champion,
      key: s.key,
      ability: s.ability,
      title: `Template:Data ${c.champion}/${s.ability}`,
    })),
  )
  console.log(`${roster.length} champions, ${wanted.length} ability templates to fetch.`)

  const abilities = []
  const missing = []
  for (let i = 0; i < wanted.length; i += BATCH_SIZE) {
    const batch = wanted.slice(i, i + BATCH_SIZE)
    const pages = await fetchPages(batch.map((w) => w.title))
    for (const w of batch) {
      const page = pages[w.title]
      if (!page) {
        missing.push(w.title)
        continue
      }
      abilities.push({
        champion: w.champion,
        key: w.key,
        ability: w.ability,
        revised: page.revised,
        projectile: readField(page.content, 'projectile'),
        spellshield: readField(page.content, 'spellshield'),
        targeting: readField(page.content, 'targeting'),
        notes: readNotes(page.content),
      })
    }
    process.stdout.write(`\r  ${Math.min(i + BATCH_SIZE, wanted.length)}/${wanted.length}`)
    await sleep(PAUSE_MS)
  }
  process.stdout.write('\n')

  const championNames = new Set(roster.map((c) => c.champion))
  const mentions = findMentions(abilities, championNames)

  const meta = {
    fetchedAt: new Date().toISOString(),
    source: API,
    champions: roster.length,
    abilities: abilities.length,
    abilitiesWithoutNotes: abilities.filter((a) => !a.notes).length,
    mentions: mentions.length,
    uniqueMentionLines: new Set(mentions.map((m) => m.line)).size,
    missingTemplates: missing,
    championLastChanged: Object.fromEntries(roster.map((c) => [c.champion, c.lastChanged])),
  }

  mkdirSync(OUT_DIR, { recursive: true })
  const write = (name, data) =>
    writeFileSync(path.join(OUT_DIR, name), JSON.stringify(data, null, 2) + '\n')
  write('abilities.json', abilities)
  write('mentions.json', mentions)
  write('meta.json', meta)

  console.log(`Wrote ${abilities.length} abilities and ${mentions.length} cross-champion mentions`)
  console.log(`(${meta.uniqueMentionLines} unique note lines) to ${path.relative(process.cwd(), OUT_DIR)}/`)
  if (missing.length) console.log(`${missing.length} templates not found - listed in meta.json.`)
}

main().catch((error) => {
  console.error(`\nFailed: ${error.message}`)
  process.exit(1)
})
