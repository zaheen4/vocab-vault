import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import Word from '../models/Word.js'
import Deck from '../models/Deck.js'
import Progress from '../models/Progress.js'
import Bookmark from '../models/Bookmark.js'
import CustomList from '../models/CustomList.js'

const defaultFile = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../data/gregmat-words.json'
)

const USAGE = `Usage: node src/scripts/seed.js [file] [options]

  [file]            JSON with a non-empty "groups" array (default: bundled GregMat dataset)
  --prune           Review and enable deletion of stale words, decks and study history
  --yes             Apply the prune plan (--prune alone is a dry run)
  --force-partial   Allow --prune with a custom file covering only some stored groups
  --help            Show this message

Pruning is opt-in: without --prune only words and decks are upserted.`

const KNOWN_FLAGS = ['--prune', '--yes', '--force-partial', '--help']

export function parseArgs(argv) {
  const args = {
    file: defaultFile,
    prune: false,
    yes: false,
    forcePartial: false,
    help: false,
    error: null,
  }
  let fileSeen = false
  for (const arg of argv) {
    if (KNOWN_FLAGS.includes(arg)) {
      if (arg === '--prune') args.prune = true
      else if (arg === '--yes') args.yes = true
      else if (arg === '--force-partial') args.forcePartial = true
      else args.help = true
    } else if (arg.startsWith('-')) {
      args.error = `Unknown flag: ${arg}`
      break
    } else if (!fileSeen) {
      args.file = arg
      fileSeen = true
    } else {
      args.error = `Unexpected argument: ${arg}`
      break
    }
  }
  return args
}

export function partFor(index) {
  return index < 10 ? 1 : index < 20 ? 2 : 3
}

function difficultyFor(group) {
  if (group <= 11) return 'basic'
  if (group <= 22) return 'intermediate'
  return 'advanced'
}

async function assertSafePartial(file, groups, forcePartial) {
  if (path.resolve(file) === defaultFile) return
  const dbGroups = (await Word.distinct('group', { source: 'gregmat' }))
    .map(Number)
    .filter(Number.isFinite)
  const fileGroups = new Set(groups.map((g) => Number(g.group)).filter(Number.isFinite))
  const uncovered = dbGroups.filter((g) => !fileGroups.has(g))
  if (uncovered.length && !forcePartial) {
    console.error(
      `Refusing to prune: ${path.basename(file)} does not cover stored GregMat ` +
        `group(s) ${uncovered.join(', ')}. Pass --force-partial to override.`
    )
    process.exit(1)
  }
}

async function buildPrunePlan(validGroups) {
  const legacy = { source: { $nin: ['gregmat', 'custom'] } }
  const stale = { source: 'gregmat', group: { $nin: validGroups } }

  const [legacyWords, legacyDecks, staleWords, staleDecks] = await Promise.all([
    Word.countDocuments(legacy),
    Deck.countDocuments(legacy),
    Word.countDocuments(stale),
    Deck.countDocuments(stale),
  ])

  const [legacyIds, staleIds, allWordIds] = await Promise.all([
    Word.distinct('_id', legacy),
    Word.distinct('_id', stale),
    Word.distinct('_id'),
  ])
  const doomed = new Set([...legacyIds, ...staleIds].map(String))
  const liveWordIds = allWordIds.filter((id) => !doomed.has(String(id)))

  const orphanProgress = { wordId: { $nin: liveWordIds } }
  const orphanBookmarks = { wordId: { $nin: liveWordIds } }
  const prunedLists = { wordIds: { $elemMatch: { $nin: liveWordIds } } }

  const [progressCount, bookmarkCount, listCount] = await Promise.all([
    Progress.countDocuments(orphanProgress),
    Bookmark.countDocuments(orphanBookmarks),
    CustomList.countDocuments(prunedLists),
  ])

  return {
    queries: { legacy, stale, orphanProgress, orphanBookmarks, prunedLists },
    liveWordIds,
    counts: {
      legacyWords,
      legacyDecks,
      staleWords,
      staleDecks,
      orphanProgress: progressCount,
      orphanBookmarks: bookmarkCount,
      lists: listCount,
    },
  }
}

function printPlan(counts) {
  console.log('Prune plan (dry run):')
  console.log(`  legacy words (source not gregmat/custom): ${counts.legacyWords}`)
  console.log(`  legacy decks (source not gregmat/custom): ${counts.legacyDecks}`)
  console.log(`  out-of-dataset GregMat words: ${counts.staleWords}`)
  console.log(`  out-of-dataset GregMat decks: ${counts.staleDecks}`)
  console.log(`  orphaned progress rows: ${counts.orphanProgress}`)
  console.log(`  orphaned bookmarks: ${counts.orphanBookmarks}`)
  console.log(`  lists losing entries: ${counts.lists}`)
}

async function applyPrune(plan) {
  const { queries, liveWordIds } = plan
  const [legacyWords, legacyDecks, staleWords, staleDecks] = await Promise.all([
    Word.deleteMany(queries.legacy),
    Deck.deleteMany(queries.legacy),
    Word.deleteMany(queries.stale),
    Deck.deleteMany(queries.stale),
  ])
  const [orphanProgress, orphanBookmarks, prunedLists] = await Promise.all([
    Progress.deleteMany(queries.orphanProgress),
    Bookmark.deleteMany(queries.orphanBookmarks),
    CustomList.updateMany(queries.prunedLists, {
      $pull: { wordIds: { $nin: liveWordIds } },
    }),
  ])
  console.log(
    `Pruned ${legacyWords.deletedCount + staleWords.deletedCount} words, ` +
      `${legacyDecks.deletedCount + staleDecks.deletedCount} decks, ` +
      `${orphanProgress.deletedCount} orphaned progress rows, ` +
      `${orphanBookmarks.deletedCount} bookmarks and ${prunedLists.modifiedCount} lists`
  )
}

async function main() {
  const { file, prune, yes, forcePartial, help, error } = parseArgs(process.argv.slice(2))
  if (error) {
    console.error(error)
    console.error(USAGE)
    process.exit(1)
  }
  if (help) {
    console.log(USAGE)
    process.exit(0)
  }

  const connected = await connectDB()
  if (!connected) {
    console.error('Cannot seed without MONGODB_URI — see server/.env')
    process.exit(1)
  }

  const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
  const groups = raw.groups
  if (!Array.isArray(groups) || groups.length === 0) {
    console.error('Data file must be an object with a non-empty "groups" array')
    process.exit(1)
  }
  const validGroups = groups.map((g) => g.group)

  try {
    if (prune) {
      await assertSafePartial(file, groups, forcePartial)
      const plan = await buildPrunePlan(validGroups)
      printPlan(plan.counts)
      if (!yes) {
        console.log('Dry run — no data deleted. Re-run with --yes to apply the plan.')
        return
      }
      await applyPrune(plan)
    } else {
      console.log('Pruning skipped — pass --prune to review, --prune --yes to delete')
    }

    let inserted = 0
    let modified = 0
    for (const { group, words } of groups) {
      for (let i = 0; i < words.length; i++) {
        const w = words[i]
        if (!w?.word || !w?.definition) continue
        const part = partFor(i)
        try {
          const result = await Word.updateOne(
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
          inserted += result.upsertedCount ?? 0
          modified += result.modifiedCount ?? 0
        } catch (err) {
          console.warn('skip:', w.word, '-', err.message)
        }
      }
    }
    console.log(`Seed words: ${inserted} inserted, ${modified} updated`)

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
  } finally {
    await mongoose.disconnect()
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
