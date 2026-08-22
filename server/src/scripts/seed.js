import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import Word from '../models/Word.js'
import Deck from '../models/Deck.js'

// Usage: node src/scripts/seed.js [dataFile.json]
// Accepts an array of objects with at least { word, definition }.
// Optional fields: example, partOfSpeech, synonyms[], banglaMeaning, difficulty.
const file = process.argv[2] ?? new URL('../../data/gre-words.json', import.meta.url).pathname

async function main() {
  const connected = await connectDB()
  if (!connected) {
    console.error('Cannot seed without MONGODB_URI — see server/.env')
    process.exit(1)
  }

  const raw = JSON.parse((await import('fs')).readFileSync(file, 'utf8'))
  if (!Array.isArray(raw)) {
    console.error('Data file must be a JSON array of word objects')
    process.exit(1)
  }

  let inserted = 0
  let skipped = 0
  for (const entry of raw) {
    if (!entry?.word || !entry?.definition) {
      skipped++
      continue
    }
    try {
      await Word.create({
        word: entry.word,
        definition: entry.definition,
        example: entry.example,
        partOfSpeech: entry.partOfSpeech ?? entry.pos,
        synonyms: Array.isArray(entry.synonyms) ? entry.synonyms : [],
        banglaMeaning: entry.banglaMeaning,
        difficulty: ['basic', 'intermediate', 'advanced'].includes(entry.difficulty)
          ? entry.difficulty
          : 'basic',
      })
      inserted++
    } catch (err) {
      if (err.code === 11000) {
        // duplicate word — update instead
        await Word.updateOne(
          { word: entry.word.toLowerCase() },
          { $set: { definition: entry.definition } }
        )
        skipped++
      } else {
        console.warn('skip:', entry.word, '-', err.message)
        skipped++
      }
    }
  }

  console.log(`Seed done: ${inserted} inserted, ${skipped} skipped/updated`)

  // create one deck per difficulty if none exist yet
  for (const level of ['basic', 'intermediate', 'advanced']) {
    const exists = await Deck.findOne({ difficulty: level })
    if (exists) continue
    const words = await Word.find({ difficulty: level }).limit(50)
    if (words.length) {
      await Deck.create({
        title: `${level[0].toUpperCase() + level.slice(1)} Words`,
        description: `Auto-generated ${level} deck`,
        difficulty: level,
        wordIds: words.map((w) => w._id),
      })
      console.log(`Deck created: ${level} (${words.length} words)`)
    }
  }

  await mongoose.disconnect()
}

main()
