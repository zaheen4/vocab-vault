import { useQuery, useQueryClient } from '@tanstack/react-query'
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

export function useInvalidateAfterReview() {
  const qc = useQueryClient()
  return (deckId) => {
    qc.invalidateQueries({ queryKey: GAMIFICATION_KEY })
    qc.invalidateQueries({ queryKey: SUMMARY_KEY })
    if (deckId) {
      qc.invalidateQueries({ queryKey: ['session', deckId] })
      qc.invalidateQueries({ queryKey: ['quizpool', deckId] })
    }
  }
}
