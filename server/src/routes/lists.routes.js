import { Router } from 'express'
import mongoose from 'mongoose'
import CustomList from '../models/CustomList.js'
import Word from '../models/Word.js'
import { requireAuth } from '../middleware/auth.js'
import { requireDB } from '../middleware/requireDB.js'
import { validateListTitle } from '../utils/lists.js'
import { toSafeMessage } from '../utils/security.js'

const router = Router()

function validId(id) {
  return mongoose.isValidObjectId(id)
}

// Owner-scoped lookup: another user's list reads as 404 (never leak existence).
async function findOwnList(id, userId, populate = false) {
  if (!validId(id)) return { status: 400 }
  const query = CustomList.findOne({ _id: id, userId })
  const list = populate ? await query.populate('wordIds') : await query
  if (!list) return { status: 404 }
  return { list }
}

function toListJson(list) {
  return { _id: list._id, title: list.title, wordCount: (list.wordIds || []).length }
}

router.get('/', requireDB, requireAuth, async (req, res) => {
  try {
    const lists = await CustomList.find({ userId: req.user._id }).sort({ createdAt: -1 })
    res.json({ lists: lists.map(toListJson) })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.post('/', requireDB, requireAuth, async (req, res) => {
  try {
    const invalid = validateListTitle(req.body?.title)
    if (invalid) return res.status(400).json({ message: invalid })
    const list = await CustomList.create({ userId: req.user._id, title: req.body.title.trim() })
    res.status(201).json({ list: toListJson(list) })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.get('/:id', requireDB, requireAuth, async (req, res) => {
  try {
    const { list, status } = await findOwnList(req.params.id, req.user._id, true)
    if (!list) return res.status(status).json({ message: status === 400 ? 'Invalid id' : 'List not found' })
    res.json({ list: { _id: list._id, title: list.title, words: list.wordIds } })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.patch('/:id', requireDB, requireAuth, async (req, res) => {
  try {
    const invalid = validateListTitle(req.body?.title)
    if (invalid) return res.status(400).json({ message: invalid })
    const { list, status } = await findOwnList(req.params.id, req.user._id)
    if (!list) return res.status(status).json({ message: status === 400 ? 'Invalid id' : 'List not found' })
    list.title = req.body.title.trim()
    await list.save()
    res.json({ list: toListJson(list) })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.delete('/:id', requireDB, requireAuth, async (req, res) => {
  try {
    const { list, status } = await findOwnList(req.params.id, req.user._id)
    if (!list) return res.status(status).json({ message: status === 400 ? 'Invalid id' : 'List not found' })
    await list.deleteOne()
    res.json({ removed: true })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.post('/:id/words', requireDB, requireAuth, async (req, res) => {
  try {
    const { wordId } = req.body || {}
    if (!validId(wordId)) return res.status(400).json({ message: 'Valid wordId is required' })
    const word = await Word.findById(wordId)
    if (!word) return res.status(404).json({ message: 'Word not found' })
    const { list, status } = await findOwnList(req.params.id, req.user._id)
    if (!list) return res.status(status).json({ message: status === 400 ? 'Invalid id' : 'List not found' })
    await CustomList.updateOne({ _id: list._id }, { $addToSet: { wordIds: wordId } })
    const updated = await CustomList.findById(list._id)
    res.json({ list: toListJson(updated) })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

router.delete('/:id/words/:wordId', requireDB, requireAuth, async (req, res) => {
  try {
    if (!validId(req.params.wordId)) {
      return res.status(400).json({ message: 'Valid wordId is required' })
    }
    const { list, status } = await findOwnList(req.params.id, req.user._id)
    if (!list) return res.status(status).json({ message: status === 400 ? 'Invalid id' : 'List not found' })
    await CustomList.updateOne({ _id: list._id }, { $pull: { wordIds: req.params.wordId } })
    const updated = await CustomList.findById(list._id)
    res.json({ list: toListJson(updated) })
  } catch (err) {
    res.status(500).json({ message: toSafeMessage(err) })
  }
})

export default router
