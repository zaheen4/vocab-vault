import mongoose from 'mongoose'

export const MAX_QUIZ_SESSIONS = 100

export function calculatePercentage(score, total) {
  if (!total || total <= 0) return 0
  return Math.round((Math.max(0, score) / total) * 100)
}

export function validateQuizSessionPayload(body = {}) {
  const { deckId, deckTitle, part, scope, score, total, timeSpentSeconds, answers } = body

  if (!deckTitle || typeof deckTitle !== 'string' || !deckTitle.trim()) {
    return { valid: false, error: 'deckTitle is required' }
  }

  if (deckId !== undefined && deckId !== null && deckId !== 'all') {
    if (!mongoose.isValidObjectId(deckId)) {
      return { valid: false, error: 'Valid deckId is required' }
    }
  }

  let parsedPart = null
  if (part !== undefined && part !== null) {
    const p = Number(part)
    if (!Number.isInteger(p) || p < 1) {
      return { valid: false, error: 'part must be a positive integer' }
    }
    parsedPart = p
  }

  const validScope = scope === 'all' ? 'all' : 'viewed'

  if (typeof score !== 'number' || !Number.isInteger(score) || score < 0) {
    return { valid: false, error: 'score must be a non-negative integer' }
  }

  if (typeof total !== 'number' || !Number.isInteger(total) || total <= 0) {
    return { valid: false, error: 'total must be an integer greater than 0' }
  }

  if (score > total) {
    return { valid: false, error: 'score cannot exceed total' }
  }

  let duration = 0
  if (timeSpentSeconds !== undefined && timeSpentSeconds !== null) {
    const s = Number(timeSpentSeconds)
    if (Number.isInteger(s) && s >= 0) {
      duration = s
    }
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    return { valid: false, error: 'answers must be a non-empty array' }
  }

  const sanitizedAnswers = []
  for (let i = 0; i < answers.length; i++) {
    const a = answers[i]
    if (!a || !a.wordId || !mongoose.isValidObjectId(a.wordId)) {
      return { valid: false, error: `Invalid wordId in answer at index ${i}` }
    }
    if (!a.word || typeof a.word !== 'string') {
      return { valid: false, error: `Invalid word in answer at index ${i}` }
    }
    if (typeof a.correct !== 'boolean') {
      return { valid: false, error: `correct must be a boolean in answer at index ${i}` }
    }

    sanitizedAnswers.push({
      wordId: new mongoose.Types.ObjectId(a.wordId),
      word: String(a.word).trim(),
      definition: String(a.definition || '').trim(),
      partOfSpeech: a.partOfSpeech ? String(a.partOfSpeech).trim() : null,
      userAnswer: String(a.userAnswer || '').trim(),
      correctAnswer: String(a.correctAnswer || '').trim(),
      correct: a.correct,
    })
  }

  return {
    valid: true,
    data: {
      deckId: deckId && mongoose.isValidObjectId(deckId) ? new mongoose.Types.ObjectId(deckId) : null,
      deckTitle: deckTitle.trim(),
      part: parsedPart,
      scope: validScope,
      score,
      total,
      percentage: calculatePercentage(score, total),
      timeSpentSeconds: duration,
      answers: sanitizedAnswers,
    },
  }
}

export function validateQuizHistoryQuery(query = {}) {
  let page = 1
  if (query.page !== undefined && query.page !== null && query.page !== '') {
    const parsed = parseInt(String(query.page).trim(), 10)
    if (!Number.isInteger(parsed) || !/^-?\d+$/.test(String(query.page).trim())) {
      return { error: 'page must be an integer' }
    }
    page = Math.min(1000, Math.max(1, parsed))
  }

  let limit = 10
  if (query.limit !== undefined && query.limit !== null && query.limit !== '') {
    const parsed = parseInt(String(query.limit).trim(), 10)
    if (!Number.isInteger(parsed) || !/^-?\d+$/.test(String(query.limit).trim())) {
      return { error: 'limit must be an integer' }
    }
    limit = Math.min(50, Math.max(1, parsed))
  }

  return { page, limit }
}

export function buildQuizHistoryPipeline(userId, { page = 1, limit = 10 } = {}) {
  const userObjectId = userId instanceof mongoose.Types.ObjectId
    ? userId
    : new mongoose.Types.ObjectId(userId)

  return [
    { $match: { userId: userObjectId } },
    {
      $facet: {
        sessions: [
          { $sort: { createdAt: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: { $toString: '$_id' },
              deckId: { $ifNull: [{ $toString: '$deckId' }, null] },
              deckTitle: 1,
              part: 1,
              scope: 1,
              score: 1,
              total: 1,
              percentage: 1,
              timeSpentSeconds: 1,
              answers: 1,
              createdAt: 1,
            },
          },
        ],
        totalCount: [{ $count: 'count' }],
        stats: [
          {
            $group: {
              _id: null,
              totalQuizzes: { $sum: 1 },
              avgScore: { $avg: '$percentage' },
              bestScore: { $max: '$percentage' },
              totalQuestions: { $sum: '$total' },
            },
          },
        ],
      },
    },
  ]
}

export async function pruneOldSessions(QuizSessionModel, userId, max = MAX_QUIZ_SESSIONS) {
  try {
    const count = await QuizSessionModel.countDocuments({ userId })
    if (count > max) {
      const oldestToKeep = await QuizSessionModel.find({ userId })
        .sort({ createdAt: -1 })
        .skip(max - 1)
        .limit(1)
        .select('createdAt')
        .lean()

      if (oldestToKeep.length > 0) {
        await QuizSessionModel.deleteMany({
          userId,
          createdAt: { $lt: oldestToKeep[0].createdAt },
        })
      }
    }
  } catch (err) {
    // Non-blocking maintenance failure: never fail user request
    console.warn('[quizHistory] prune error:', err.message)
  }
}
