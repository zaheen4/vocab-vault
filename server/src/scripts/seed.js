import 'dotenv/config'
import mongoose from 'mongoose'
import { fileURLToPath } from 'url'
import { connectDB } from '../config/db.js'
import Word from '../models/Word.js'
import Deck from '../models/Deck.js'

// Usage: node src/scripts/seed.js [dataFile.json]
// Default: server/data/gregmat-words.json — the canonical GregMat dataset,
// a JSON object { groups: [{ group, words: [{ word, definition, example }] }] }.
// Mapping GregMat progression (frequency/ascending difficulty) to the
// word-level difficulty tiers used by Search.
const defaultFile = fileURLToPath(
  new URL('../../data/gregmat-words.json', import.meta.url)
)
const file = process.argv[2] ?? defaultFile

function difficultyFor(group) {
  if (group <= 11) return 'basic'
  if (group <= 22) return 'intermediate'
  return 'advanced'
}

async function main() {
  const connected = await connectDB()
  if (!connected) {
    console.error('Cannot seed without MONGODB_URI — see server/.env')
    process.exit(1)
  }

  const raw = JSON.parse((await import('fs')).readFileSync(file, 'utf8'))
  const groups = raw.groups
  if (!Array.isArray(groups) || groups.length === 0) {
    console.error('Data file must be an object with a non-empty "groups" array')
    process.exit(1)
  }

  // upsert every word; pairwise group -> difficulty band; index -> part 1..3
  let inserted = 0
  let updated = 0
  for (const { group, words } of groups) {
    for (let i = 0; i < words.length; i++) {
      const w = words[i]
      if (!w?.word || !w?.definition) continue
      const part = i < 10 ? 1 : i < 20 ? 2 : 3
      try {
        await Word.updateOne(
          { word: w.word.toLowerCase() },
          {
            $set: {
              word: w.word.toLowerCase(),
              definition: w.definition,
              example: w.example,
              group,
              part,
              source: 'gregmat',
              difficulty: difficultyFor(group),
            },
          },
          { upsert: true }
        )
        inserted++
      } catch (err) {
        console.warn('skip:', w.word, '-', err.message)
      }
    }
  }
  console.log(`Seed upserted ${inserted} words`)

  // retire the previous auto-built difficulty decks and their words —
  // never touch user-created content (source 'custom')
  const wordCount = await Word.countDocuments({ source: { $nin: ['gregmat', 'custom'] } })
  const deckCount = await Deck.countDocuments({ source: { $nin: ['gregmat', 'custom'] } })
  await Word.deleteMany({ source: { $nin: ['gregmat', 'custom'] } })
  await Deck.deleteMany({ source: { $nin: ['gregmat', 'custom'] } })
  console.log(
    `Removed ${wordCount} legacy words (not in GregMat) and ${deckCount} legacy decks`
  )

  // drop GregMat words/decks whose group is no longer in the dataset,
  // plus legacy decks lacking a part field
  const validGroups = groups.map((g) => g.group)
  const staleWords = await Word.deleteMany({
    source: 'gregmat',
    group: { $nin: validGroups },
  })
  const staleDecks = await Deck.deleteMany({
    source: 'gregmat',
    $or: [{ group: { $nin: validGroups } }, { part: null }, { part: { $exists: false } }],
  })
  console.log(
    `Removed ${staleWords.deletedCount} out-of-dataset words and ${staleDecks.deletedCount} stale decks`
  )

  // create 3 decks per group (one per part), discarding stale ones
  let decks = 0
  for (const { group } of groups) {
    for (let part = 1; part <= 3; part++) {
      const words = await Word.find({ source: 'gregmat', group, part })
      if (!words.length) continue
      await Deck.updateOne(
        { source: 'gregmat', group, part },
        {
          $set: {
            title: `Group ${group} — Part ${part}`,
            description: `GregMat vocabulary group ${group}, part ${part} — ${words.length} words`,
            source: 'gregmat',
            group,
            part,
            difficulty: difficultyFor(group),
            wordIds: words.map((w) => w._id),
          },
        },
        { upsert: true }
      )
      decks++
    }
  }
  console.log(`GregMat decks ready: ${decks}`)

  await mongoose.disconnect()
}

main()