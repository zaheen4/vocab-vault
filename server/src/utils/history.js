import mongoose from 'mongoose'

const VALID_FILTERS = new Set(['all', 'correct', 'incorrect'])

export function validateHistoryQuery(query = {}) {
  let page = 1
  if (query.page !== undefined && query.page !== null && query.page !== '') {
    if (typeof query.page !== 'string' && typeof query.page !== 'number') {
      return { error: 'page must be an integer' }
    }
    const raw = String(query.page).trim()
    if (!/^-?\d+$/.test(raw)) {
      return { error: 'page must be an integer' }
    }
    const parsed = parseInt(raw, 10)
    page = Math.min(1000, Math.max(1, parsed))
  }

  let limit = 20
  if (query.limit !== undefined && query.limit !== null && query.limit !== '') {
    if (typeof query.limit !== 'string' && typeof query.limit !== 'number') {
      return { error: 'limit must be an integer' }
    }
    const raw = String(query.limit).trim()
    if (!/^-?\d+$/.test(raw)) {
      return { error: 'limit must be an integer' }
    }
    const parsed = parseInt(raw, 10)
    limit = Math.min(100, Math.max(1, parsed))
  }

  let filter = 'all'
  if (query.filter !== undefined && query.filter !== null && query.filter !== '') {
    const raw = String(query.filter).trim().toLowerCase()
    if (!VALID_FILTERS.has(raw)) {
      return { error: "filter must be one of: 'all', 'correct', 'incorrect'" }
    }
    filter = raw
  }

  return { page, limit, filter }
}

export function buildHistoryPipeline(userId, { page = 1, limit = 20, filter = 'all' } = {}) {
  const userObjectId = userId instanceof mongoose.Types.ObjectId
    ? userId
    : new mongoose.Types.ObjectId(userId)

  const pipeline = [
    {
      $match: {
        userId: userObjectId,
        'history.0': { $exists: true },
      },
    },
    {
      $unwind: '$history',
    },
  ]

  if (filter === 'correct') {
    pipeline.push({ $match: { 'history.correct': true } })
  } else if (filter === 'incorrect') {
    pipeline.push({ $match: { 'history.correct': false } })
  }

  pipeline.push(
    {
      $lookup: {
        from: 'words',
        localField: 'wordId',
        foreignField: '_id',
        as: 'wordDoc',
      },
    },
    {
      $unwind: '$wordDoc',
    },
    {
      $sort: { 'history.at': -1 },
    },
    {
      $facet: {
        data: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              reviewId: {
                $concat: [
                  { $toString: '$_id' },
                  '_',
                  {
                    $toString: {
                      $ifNull: [{ $toLong: '$history.at' }, 0],
                    },
                  },
                ],
              },
              wordId: { $toString: '$wordId' },
              word: '$wordDoc.word',
              definition: '$wordDoc.definition',
              partOfSpeech: { $ifNull: ['$wordDoc.partOfSpeech', null] },
              difficulty: { $ifNull: ['$wordDoc.difficulty', 'basic'] },
              correct: '$history.correct',
              box: '$history.box',
              mode: { $ifNull: ['$history.mode', 'practice'] },
              reviewedAt: '$history.at',
            },
          },
        ],
        totalCount: [{ $count: 'count' }],
      },
    }
  )

  return pipeline
}
