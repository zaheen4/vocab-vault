import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './client'

// Central read layer. Quiz and Typing share one pool key; Practice
// sessions revalidate on every mount because SRS due states move fast.

const GAMIFICATION_KEY = ['gamification', 'me']
const SUMMARY_KEY = ['progress', 'summary']

export const fetchDecks = () => api.get('/decks').then((d) => d.decks)
export const fetchDeck = (id) => api.get(`/decks/${id}`).then((d) => d.deck)
export const fetchGamification = () => api.get('/gamification/me').then((d) => d.gamification)
export const fetchSummary = () => api.get('/progress/summary').then((d) => d.summary)
export const fetchPracticeSession = (id, limit = 10) =>
  api.get(`/decks/${id}/practice?limit=${limit}`).then((d) => d.words)
export const fetchQuizPool = (id, limit = 50) =>
  api.get(`/decks/${id}/quiz?limit=${limit}`).then((d) => ({ title: d.deck.title, words: d.words }))

export function useDecks() {
  return useQuery({
    queryKey: ['decks'],
    queryFn: fetchDecks,
    staleTime: 5 * 60 * 1000, // deck list changes only via admin import
  })
}

export function useDeck(id) {
  return useQuery({
    queryKey: ['deck', id],
    queryFn: () => fetchDeck(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  })
}

export function useGamification() {
  return useQuery({
    queryKey: GAMIFICATION_KEY,
    queryFn: fetchGamification,
    staleTime: 30 * 1000,
  })
}

export function useProgressSummary() {
  return useQuery({
    queryKey: SUMMARY_KEY,
    queryFn: fetchSummary,
    staleTime: 30 * 1000,
  })
}

export function usePracticeSession(id, limit = 10) {
  return useQuery({
    queryKey: ['session', id, limit],
    queryFn: () => fetchPracticeSession(id, limit),
    staleTime: 0,
    enabled: !!id,
  })
}

// Quiz and Typing share one viewed-words pool: switching between them is a
// cache hit. The viewed set grows only via practice sessions, so a minute
// of staleness is invisible.
export function useQuizPool(id, limit = 50) {
  return useQuery({
    queryKey: ['quizpool', id, limit],
    queryFn: () => fetchQuizPool(id, limit),
    staleTime: 60 * 1000,
    enabled: !!id,
  })
}

// Warm the practice session + deck title on card hover/focus so the
// Practice page usually opens from cache.
export function usePrefetchDeck() {
  const qc = useQueryClient()
  return (id) => {
    qc.prefetchQuery({ queryKey: ['deck', id], queryFn: () => fetchDeck(id), staleTime: 5 * 60 * 1000 })
    qc.prefetchQuery({
      queryKey: ['session', id, 10],
      queryFn: () => fetchPracticeSession(id, 10),
      staleTime: 0,
    })
  }
}

// Warm sibling modes on tab hover/focus so mode switches paint from cache.
export function usePrefetchQuizPool() {
  const qc = useQueryClient()
  return (id) => {
    qc.prefetchQuery({
      queryKey: ['quizpool', id, 50],
      queryFn: () => fetchQuizPool(id, 50),
      staleTime: 60 * 1000,
    })
  }
}

// Invalidation to run after a review is recorded. The practice session is
// marked stale with `refetchType: 'none'` on purpose: it is a fixed batch for
// the current run, and refetching it mid-session swaps the card under the user
// (answer -> pool shifts -> card jumps). staleTime is 0, so the next mount
// still refetches.
export function invalidateAfterReview(qc, deckId) {
  qc.invalidateQueries({ queryKey: GAMIFICATION_KEY })
  qc.invalidateQueries({ queryKey: SUMMARY_KEY })
  if (deckId) {
    qc.invalidateQueries({ queryKey: ['session', deckId], refetchType: 'none' })
    qc.invalidateQueries({ queryKey: ['quizpool', deckId] })
  }
}

export function useInvalidateAfterReview() {
  const qc = useQueryClient()
  return (deckId) => invalidateAfterReview(qc, deckId)
}

export function useSetGoalTarget() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (target) => api.patch('/gamification/goal', { target }),
    onSuccess: () => qc.invalidateQueries({ queryKey: GAMIFICATION_KEY }),
  })
}

// ---- Personal library: bookmarks + custom lists ----

const BOOKMARKS_KEY = ['bookmarks']
const LISTS_KEY = ['lists']
const listKey = (id) => ['list', id]

// Bookmark entries carry the word inline ({ _id, word, addedAt }),
// so a Set of starred ids derives straight from the cache.
export function isStarred(bookmarks = [], wordId) {
  return bookmarks.some((b) => (b.word?._id || b.wordId) === wordId)
}

export const fetchBookmarks = () => api.get('/bookmarks').then((d) => d.bookmarks)
export const fetchSavedPracticeSession = (limit = 10) =>
  api.get(`/bookmarks/practice?limit=${limit}`).then((d) => d.words)

export function useSavedPracticeSession(limit = 10) {
  return useQuery({
    queryKey: ['saved-practice', limit],
    queryFn: () => fetchSavedPracticeSession(limit),
    staleTime: 0,
  })
}

export function useBookmarks() {
  return useQuery({
    queryKey: BOOKMARKS_KEY,
    queryFn: fetchBookmarks,
    staleTime: 30 * 1000,
  })
}

export function useToggleBookmark() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ wordId, starred }) =>
      starred ? api.delete(`/bookmarks/${wordId}`) : api.post('/bookmarks', { wordId }),
    onMutate: async ({ wordId, starred }) => {
      await qc.cancelQueries({ queryKey: BOOKMARKS_KEY })
      const prev = qc.getQueryData(BOOKMARKS_KEY)
      qc.setQueryData(BOOKMARKS_KEY, (old = []) =>
        starred
          ? old.filter((b) => (b.word?._id || b.wordId) !== wordId)
          : [...old, { _id: `temp-${wordId}`, word: { _id: wordId }, addedAt: new Date().toISOString() }]
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(BOOKMARKS_KEY, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: BOOKMARKS_KEY }),
  })
}

export const fetchCustomLists = () => api.get('/lists').then((d) => d.lists)
export const fetchCustomList = (id) => api.get(`/lists/${id}`).then((d) => d.list)

export function useCustomLists() {
  return useQuery({
    queryKey: LISTS_KEY,
    queryFn: fetchCustomLists,
    staleTime: 30 * 1000,
  })
}

export function useCustomList(id) {
  return useQuery({
    queryKey: listKey(id),
    queryFn: () => fetchCustomList(id),
    staleTime: 30 * 1000,
    enabled: !!id,
  })
}

function useListMutation(mutationFn) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: LISTS_KEY })
      if (vars?.id) qc.invalidateQueries({ queryKey: listKey(vars.id) })
    },
  })
}

export function useCreateList() {
  return useListMutation(({ title }) => api.post('/lists', { title }))
}

export function useRenameList() {
  return useListMutation(({ id, title }) => api.patch(`/lists/${id}`, { title }))
}

export function useDeleteList() {
  return useListMutation(({ id }) => api.delete(`/lists/${id}`))
}

export function useAddListWord() {
  return useListMutation(({ id, wordId }) => api.post(`/lists/${id}/words`, { wordId }))
}

export function useRemoveListWord() {
  return useListMutation(({ id, wordId }) => api.delete(`/lists/${id}/words/${wordId}`))
}
