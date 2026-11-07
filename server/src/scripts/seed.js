import 'dotenv/config'
import mongoose from 'mongoose'
import { fileURLToPath } from 'url'
import { connectDB } from '../config/db.js'
import Word from '../models/Word.js'
import Deck from '../models/Deck.js'
import Progress from '../models/Progress.js'
import Bookmark from '../models/Bookmark.js'
import CustomList from '../models/CustomList.js'

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

  const wordCount = await Word.countDocuments({ source: { $nin: ['gregmat', 'custom'] } })
  const deckCount = await Deck.countDocuments({ source: { $nin: ['gregmat', 'custom'] } })
  await Word.deleteMany({ source: { $nin: ['gregmat', 'custom'] } })
  await Deck.deleteMany({ source: { $nin: ['gregmat', 'custom'] } })
  console.log(
    `Removed ${wordCount} legacy words (not in GregMat) and ${deckCount} legacy decks`
  )

  const validGroups = groups.map((g) => g.group)
  const staleWords = await Word.deleteMany({
    source: 'gregmat',
    group: { $nin: validGroups },
  })
  const staleDecks = await Deck.deleteMany({
    source: 'gregmat',
    group: { $nin: validGroups },
  })
  console.log(
    `Removed ${staleWords.deletedCount} out-of-dataset words and ${staleDecks.deletedCount} stale decks`
  )

  const liveWordIds = await Word.distinct('_id')
  const [orphanProgress, orphanBookmarks, prunedLists] = await Promise.all([
    Progress.deleteMany({ wordId: { $nin: liveWordIds } }),
    Bookmark.deleteMany({ wordId: { $nin: liveWordIds } }),
    CustomList.updateMany(
      { 'wordIds.0': { $exists: true } },
      { $pull: { wordIds: { $nin: liveWordIds } } }
    ),
  ])
  console.log(
    `Pruned ${orphanProgress.deletedCount} orphaned progress rows, ` +
      `${orphanBookmarks.deletedCount} bookmarks and ${prunedLists.modifiedCount} lists`
  )

  let decks = 0
  for (const { group } of groups) {
    const words = await Word.find({ source: 'gregmat', group })
    if (!words.length) continue
    await Deck.updateOne(
      { source: 'gregmat', group },
      {
        $set: {
          title: `Group ${group}`,
          description: `GregMat vocabulary group ${group} — ${words.length} words`,
          source: 'gregmat',
          group,
          difficulty: difficultyFor(group),
          wordIds: words.map((w) => w._id),
        },
      },
      { upsert: true }
    )
    decks++
  }
  console.log(`GregMat decks ready: ${decks}`)

  await mongoose.disconnect()
}

main()
