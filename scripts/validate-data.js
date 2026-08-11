// Validates src/data/interactions.json and src/data/champion_tags.json
// against the schemas in CLAUDE.md. Plain Node, no dependencies.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_PATH = path.join(__dirname, '..', 'src', 'data', 'interactions.json')
const CHAMPION_TAGS_PATH = path.join(__dirname, '..', 'src', 'data', 'champion_tags.json')

const INTERACTION_TYPES = new Set([
  'counters',
  'synergy',
  'amplifies',
  'enables',
  'warning',
  'no_effect',
])
const SEVERITIES = new Set(['critical', 'high', 'medium', 'low'])
const REQUIRED_FIELDS = [
  'id',
  'champions',
  'abilities',
  'interaction_type',
  'description',
  'severity',
  'tags',
]

const KEBAB_CASE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const DDRAGON_ID = /^[A-Za-z0-9]+$/

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function label(entry, index) {
  return isNonEmptyString(entry?.id) ? entry.id : `<entry at index ${index}>`
}

function validateEntry(entry, index, errors, warnings, seenIds) {
  const id = label(entry, index)

  for (const field of REQUIRED_FIELDS) {
    const value = entry[field]
    const isEmpty =
      value == null ||
      (typeof value === 'string' && value.trim().length === 0) ||
      (Array.isArray(value) && value.length === 0)
    if (isEmpty) {
      errors.push(`entry ${id}: missing or empty required field "${field}"`)
    }
  }

  if (isNonEmptyString(entry.id)) {
    if (!KEBAB_CASE.test(entry.id)) {
      errors.push(`entry ${id}: id "${entry.id}" is not lowercase kebab-case`)
    }
    if (seenIds.has(entry.id)) {
      errors.push(`entry ${id}: duplicate id`)
    } else {
      seenIds.add(entry.id)
    }
  }

  if (entry.champions !== undefined) {
    if (
      !Array.isArray(entry.champions) ||
      entry.champions.length !== 2 ||
      !entry.champions.every(isNonEmptyString)
    ) {
      errors.push(
        `entry ${id}: champions must be an array of exactly 2 non-empty strings`
      )
    } else {
      for (const champion of entry.champions) {
        if (!DDRAGON_ID.test(champion)) {
          warnings.push(
            `entry ${id}: champion "${champion}" does not look like a Data Dragon id (alphanumeric, no spaces)`
          )
        }
      }
    }
  }

  if (
    entry.interaction_type !== undefined &&
    isNonEmptyString(entry.interaction_type) &&
    !INTERACTION_TYPES.has(entry.interaction_type)
  ) {
    errors.push(
      `entry ${id}: interaction_type "${entry.interaction_type}" is not one of ${[...INTERACTION_TYPES].join(' | ')}`
    )
  }

  if (
    entry.severity !== undefined &&
    isNonEmptyString(entry.severity) &&
    !SEVERITIES.has(entry.severity)
  ) {
    errors.push(
      `entry ${id}: severity "${entry.severity}" is not one of ${[...SEVERITIES].join(' | ')}`
    )
  }

  if (!isNonEmptyString(entry.patch_verified)) {
    errors.push(`entry ${id} is unverified and cannot ship`)
  }

  if (entry.tags !== undefined) {
    if (!Array.isArray(entry.tags) || entry.tags.length < 1) {
      errors.push(`entry ${id}: tags must be an array of at least 1 string`)
    } else {
      for (const tag of entry.tags) {
        if (!isNonEmptyString(tag) || !KEBAB_CASE.test(tag)) {
          errors.push(`entry ${id}: tag "${tag}" is not lowercase kebab-case`)
        }
      }
    }
  }
}

// --- champion_tags.json ---

const PASCAL_CASE = /^[A-Z][A-Za-z0-9]*$/
const CHAMPION_TAG_FIELDS = ['damageType', 'durability', 'engage', 'cc', 'range', 'scaling']
const CHAMPION_TAG_ALLOWED = {
  damageType: new Set(['physical', 'magic', 'mixed']),
  durability: new Set(['squishy', 'durable', 'tank']),
  engage: new Set(['none', 'weak', 'strong']),
  cc: new Set(['none', 'soft', 'hard']),
  range: new Set(['melee', 'short', 'long']),
  scaling: new Set(['early', 'mid', 'late']),
}
const CHAMPION_COUNT_MIN = 170
const CHAMPION_COUNT_MAX = 180

// JSON.parse silently collapses duplicate keys, so a duplicate top-level
// champion key must be caught by scanning the raw text instead. This
// schema is flat (every value is a string), so any line matching
// `"key": {` is a top-level champion entry, never a nested field.
const TOP_LEVEL_KEY_PATTERN = /^\s*"([^"\\]+)"\s*:\s*\{/gm

function findDuplicateChampionKeys(raw) {
  const seen = new Set()
  const duplicates = new Set()
  let match
  while ((match = TOP_LEVEL_KEY_PATTERN.exec(raw)) !== null) {
    const key = match[1]
    if (seen.has(key)) {
      duplicates.add(key)
    } else {
      seen.add(key)
    }
  }
  return duplicates
}

function validateChampionTags(champion, tags, errors) {
  if (!PASCAL_CASE.test(champion)) {
    errors.push(`champion_tags "${champion}": key is not PascalCase`)
  }

  if (typeof tags !== 'object' || tags === null || Array.isArray(tags)) {
    errors.push(`champion_tags "${champion}": value must be an object`)
    return
  }

  const keys = Object.keys(tags)

  for (const field of CHAMPION_TAG_FIELDS) {
    if (!(field in tags)) {
      errors.push(`champion_tags "${champion}": missing field "${field}"`)
    }
  }

  for (const key of keys) {
    if (!CHAMPION_TAG_FIELDS.includes(key)) {
      errors.push(`champion_tags "${champion}": unexpected extra field "${key}"`)
    }
  }

  for (const field of CHAMPION_TAG_FIELDS) {
    if (!(field in tags)) continue
    const value = tags[field]
    const allowed = CHAMPION_TAG_ALLOWED[field]
    if (typeof value !== 'string' || !allowed.has(value)) {
      errors.push(
        `champion_tags "${champion}": ${field} "${value}" is not one of ${[...allowed].join(' | ')}`
      )
    }
  }
}

// Returns the champion count found, or null if the file couldn't be
// read/parsed far enough to count entries.
function runChampionTagsValidation(errors, warnings) {
  let raw
  try {
    raw = readFileSync(CHAMPION_TAGS_PATH, 'utf-8')
  } catch (error) {
    errors.push(`Failed to read ${CHAMPION_TAGS_PATH}: ${error.message}`)
    return null
  }

  let data
  try {
    data = JSON.parse(raw)
  } catch (error) {
    errors.push(`Failed to parse ${CHAMPION_TAGS_PATH} as JSON: ${error.message}`)
    return null
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    errors.push(`${CHAMPION_TAGS_PATH} must contain a JSON object keyed by champion name`)
    return null
  }

  for (const duplicate of findDuplicateChampionKeys(raw)) {
    errors.push(`champion_tags "${duplicate}": duplicate key`)
  }

  const champions = Object.keys(data)
  champions.forEach((champion) => validateChampionTags(champion, data[champion], errors))

  if (champions.length < CHAMPION_COUNT_MIN || champions.length > CHAMPION_COUNT_MAX) {
    warnings.push(
      `champion_tags.json has ${champions.length} champions, expected roughly ${CHAMPION_COUNT_MIN}-${CHAMPION_COUNT_MAX}`
    )
  }

  return champions.length
}

function main() {
  let raw
  try {
    raw = readFileSync(DATA_PATH, 'utf-8')
  } catch (error) {
    console.error(`Failed to read ${DATA_PATH}: ${error.message}`)
    process.exit(1)
  }

  let entries
  try {
    entries = JSON.parse(raw)
  } catch (error) {
    console.error(`Failed to parse ${DATA_PATH} as JSON: ${error.message}`)
    process.exit(1)
  }

  if (!Array.isArray(entries)) {
    console.error(`${DATA_PATH} must contain a JSON array of entries`)
    process.exit(1)
  }

  const errors = []
  const warnings = []
  const seenIds = new Set()

  entries.forEach((entry, index) => validateEntry(entry, index, errors, warnings, seenIds))

  const championCount = runChampionTagsValidation(errors, warnings)

  for (const warning of warnings) {
    console.warn(`⚠ ${warning}`)
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`✗ ${error}`)
    }
    console.error(`${errors.length} problem(s) found`)
    process.exit(1)
  }

  console.log(`✓ ${entries.length} interaction entries valid`)
  if (championCount !== null) {
    console.log(`✓ ${championCount} champion_tags entries valid`)
  }
  process.exit(0)
}

main()
