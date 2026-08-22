import { Router } from 'express'
import Deck from '../models/Deck.js'
import { requireAuth } from '../middleware/auth.js'
import { requireDB } from '../middleware/requireDB.js'

const router = Router()

router.get('/', requireDB, requireAuth, async (req, res) => {
  try {
    const decks = await Deck.find().populate('wordIds')
    res.json({ decks })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id', requireDB, requireAuth, async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id).populate('wordIds')
    if (!deck) return res.status(404).json({ message: 'Deck not found' })
    res.json({ deck })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
