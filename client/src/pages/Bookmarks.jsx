import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import {
  useAddListWord,
  useBookmarks,
  useCreateList,
  useCustomList,
  useCustomLists,
  useDecks,
  useDeleteList,
  useRemoveListWord,
  useRenameList,
  useToggleBookmark,
} from '../api/queries'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import EmptyArt from '../components/art/EmptyArt'
import Input from '../components/ui/Input'
import PageHeader from '../components/PageHeader'
import SpeakerIcon from '../components/ui/SpeakerIcon'
import Toast from '../components/ui/Toast'
import WordHistory from '../components/WordHistory'
import { speakWord, useTtsAvailable } from '../utils/speak'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'learning', label: 'Still learning' },
  { id: 'mastered', label: 'Mastered' },
]

const SORTS = [
  { id: 'newest', label: 'Newest' },
  { id: 'az', label: 'A–Z' },
  { id: 'hardest', label: 'Hardest' },
]

function MasteryDot({ status }) {
  const cls =
    status === 'mastered' ? 'bg-emerald-500' : status === 'learning' ? 'bg-amber-400' : 'bg-slate-300'
  return <span title={status} aria-label={status} className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${cls}`} />
}

function masteryLabel(entry) {
  if (entry.status === 'mastered') return 'Mastered'
  if (entry.status === 'learning') return `Learning · Box ${entry.box || 1}`
  return 'Not started'
}

function WordRow({ entry, index = 0, lists, quickList, onQuickListUsed, notify, selectMode, selected, onSelect }) {
  const word = entry.word || {}
  const toggle = useToggleBookmark()
  const addToList = useAddListWord()
  const ttsAvailable = useTtsAvailable()
  const [expanded, setExpanded] = useState(false)
  const [listId, setListId] = useState('')

  function addTo(wordListId) {
    addToList.mutate(
      { id: wordListId, wordId: word._id },
      {
        onSuccess: () => {
          setListId('')
          onQuickListUsed(wordListId)
        },
        onError: () => notify("Couldn't add to that list."),
      }
    )
  }

  return (
    <li
      className="animate-fade-up rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-night-900 dark:shadow-none"
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      <div className="flex items-center gap-2 p-3">
        {selectMode && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelect(entry._id)}
            aria-label={`Select ${word.word}`}
            className="h-6 w-6 shrink-0 accent-accent"
          />
        )}
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="flex min-h-9 flex-1 items-center gap-2 text-left"
        >
          <MasteryDot status={entry.status} />
          <span className="font-display font-semibold text-primary dark:text-cream-100">{word.word}</span>
          <span className="ml-auto shrink-0 text-xs font-bold text-slate-400 dark:text-cream-300/60">{expanded ? '▾' : '▸'}</span>
        </button>
        <Button
          variant="secondary"
          aria-label={`Remove ${word.word} from saved`}
          aria-pressed
          onClick={() =>
            toggle.mutate(
              { wordId: word._id, starred: true },
              { onError: () => notify("Couldn't remove that word.") }
            )
          }
        >
          ★
        </Button>
      </div>

      {expanded && (
        <div className="space-y-2 border-t border-slate-100 px-3 py-3 dark:border-white/10">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-medium text-slate-500 dark:text-cream-300/80">{masteryLabel(entry)}</span>
            {word.partOfSpeech && <span className="text-slate-400 italic dark:text-cream-300/70">{word.partOfSpeech}</span>}
            {word.group != null && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-night-800 dark:text-cream-300">
                Group {word.group}
              </span>
            )}
            {word.source === 'custom' && (
              <span className="rounded-full bg-gold/50 px-2 py-0.5 font-medium text-primary dark:bg-accent/15 dark:text-accent">Yours</span>
            )}
            {ttsAvailable && (
              <Button
                variant="secondary"
                aria-label={`Pronounce ${word.word}`}
                onClick={() =>
                  speakWord(word.word, {
                    onError: () => notify("Couldn't play the pronunciation."),
                  })
                }
              >
                <SpeakerIcon />
              </Button>
            )}
          </div>
          <p className="text-sm text-slate-600 dark:text-cream-300">{word.definition}</p>
          {word.example && <p className="text-sm text-slate-400 italic dark:text-cream-300/70">“{word.example}”</p>}
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-cream-300/80">History</p>
            <div className="mt-1">
              <WordHistory wordId={word._id} active={expanded} />
            </div>
          </div>
          {quickList && (
            <Button
              variant="secondary"
              disabled={addToList.isPending}
              onClick={() => addTo(quickList._id)}
              className="min-h-9 border-accent bg-gold/40 text-xs text-primary hover:bg-gold dark:bg-accent/15 dark:text-accent dark:hover:bg-accent/25"
            >
              + {quickList.title}
            </Button>
          )}
          {lists.length > 1 && (
            <div className="flex items-center gap-2">
              <select
                aria-label={`Add ${word.word} to a different list`}
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                className="min-h-9 flex-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-accent focus:ring-2 focus:ring-accent/40 focus:outline-none dark:border-white/15 dark:bg-night-800 dark:text-cream-100"
              >
                <option value="">Another list…</option>
                {lists
                  .filter((l) => !quickList || l._id !== quickList._id)
                  .map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.title}
                    </option>
                  ))}
              </select>
              <Button variant="secondary" disabled={!listId || addToList.isPending} onClick={() => addTo(listId)}>
                Add
              </Button>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

function ListCard({ list, open, onToggle, notify }) {
  const detail = useCustomList(open ? list._id : null)
  const rename = useRenameList()
  const remove = useDeleteList()
  const removeWord = useRemoveListWord()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(list.title)
  const [confirming, setConfirming] = useState(false)

  function saveTitle() {
    rename.mutate(
      { id: list._id, title },
      {
        onSuccess: () => setEditing(false),
        onError: () => notify("Couldn't rename that list."),
      }
    )
  }

  function handleDelete() {
    if (!confirming) {
      setConfirming(true)
      setTimeout(() => setConfirming(false), 3000)
      return
    }
    setConfirming(false)
    remove.mutate({ id: list._id }, { onError: () => notify("Couldn't delete that list.") })
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-night-900 dark:shadow-none">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-h-14 w-full items-center gap-3 p-3 text-left">
        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold font-display text-lg font-bold text-primary dark:bg-accent/20 dark:text-accent">
          {(list.title || '?').trim().charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display font-semibold text-primary dark:text-cream-100">{list.title}</span>
          <span className="block text-xs font-medium text-slate-400 dark:text-cream-300/70">
            {list.wordCount} word{list.wordCount === 1 ? '' : 's'}
          </span>
        </span>
        <span className="shrink-0 text-xs font-bold text-slate-400 dark:text-cream-300/60">{open ? '▾' : '▸'}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-100 px-3 py-3 dark:border-white/10">
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  aria-label="List title"
                  maxLength={60}
                  className="min-w-0 flex-1"
                  inputClassName="min-h-9 px-2 py-1.5"
                />
                <Button variant="secondary" disabled={rename.isPending} onClick={saveTitle}>
                  Save
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                aria-label={`Rename ${list.title}`}
                onClick={() => {
                  setTitle(list.title)
                  setEditing(true)
                }}
              >
                Rename
              </Button>
            )}
            <Button
              variant="secondary"
              aria-label={confirming ? `Confirm delete ${list.title}` : `Delete ${list.title}`}
              disabled={remove.isPending}
              onClick={handleDelete}
              className={confirming ? 'border-red-300 bg-red-50 text-red-700' : ''}
            >
              {confirming ? 'Sure?' : 'Delete'}
            </Button>
          </div>
          <ul className="space-y-1.5">
            {(detail.data?.words || []).map((w) => (
              <li key={w._id} className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-primary dark:text-cream-100">{w.word}</span>
                <span className="truncate text-slate-500 dark:text-cream-300/80">{w.definition}</span>
                <button
                  type="button"
                  aria-label={`Remove ${w.word} from ${list.title}`}
                  className="ml-auto min-h-9 min-w-9 shrink-0 rounded-md px-2 py-1 text-xs font-medium text-slate-400 hover:text-red-600 dark:text-cream-300/60 dark:hover:text-red-300"
                  onClick={() =>
                    removeWord.mutate(
                      { id: list._id, wordId: w._id },
                      { onError: () => notify("Couldn't remove that word.") }
                    )
                  }
                >
                  Remove
                </button>
              </li>
            ))}
            {detail.isLoading && <li className="text-sm text-slate-400 dark:text-cream-300/70">Loading words…</li>}
            {detail.data && detail.data.words.length === 0 && (
              <li className="text-sm text-slate-400 dark:text-cream-300/70">No words yet — add some from your saved words above.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

function BatchBar({ count, lists, onAdd, onUnstar, onCancel, busy }) {
  const [listId, setListId] = useState('')
  return (
    <div className="sticky bottom-4 rounded-xl border-2 border-accent bg-white p-3 shadow-lg dark:bg-night-900 dark:shadow-none">
      <p className="text-xs font-bold text-primary dark:text-cream-100">
        {count} selected
      </p>
      <div className="mt-2 flex items-center gap-2">
        <select
          aria-label="Choose a list for selected words"
          value={listId}
          onChange={(e) => setListId(e.target.value)}
          className="min-h-9 flex-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-accent focus:ring-2 focus:ring-accent/40 focus:outline-none dark:border-white/15 dark:bg-night-800 dark:text-cream-100"
        >
          <option value="">Add to list…</option>
          {lists.map((l) => (
            <option key={l._id} value={l._id}>
              {l.title}
            </option>
          ))}
        </select>
        <Button variant="secondary" disabled={!listId || busy} onClick={() => onAdd(listId)}>
          Apply
        </Button>
        <Button variant="secondary" disabled={busy} onClick={onUnstar}>
          Unstar
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Done
        </Button>
      </div>
    </div>
  )
}

export default function Bookmarks() {
  const { data: bookmarks = [], isLoading, isError } = useBookmarks()
  const { data: lists = [] } = useCustomLists()
  const { data: decks = [] } = useDecks()
  const qc = useQueryClient()
  const createList = useCreateList()
  const [newTitle, setNewTitle] = useState('')
  const [openId, setOpenId] = useState(null)
  const [filter, setFilter] = useState('')
  const [tab, setTab] = useState('all')
  const [sort, setSort] = useState('newest')
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState([])
  const [busy, setBusy] = useState(false)
  const [lastListId, setLastListId] = useState(null)
  const [toast, setToast] = useState(null)
  const notify = (message) => setToast({ variant: 'error', message })

  const myDeck = decks.find((d) => d.source === 'custom')
  const quickList = lists.find((l) => l._id === lastListId) ?? lists[0] ?? null

  const counts = {
    all: bookmarks.length,
    learning: bookmarks.filter((b) => b.status !== 'mastered').length,
    mastered: bookmarks.filter((b) => b.status === 'mastered').length,
  }

  const q = filter.trim().toLowerCase()
  const visible = bookmarks
    .filter((b) => (tab === 'all' ? true : tab === 'mastered' ? b.status === 'mastered' : b.status !== 'mastered'))
    .filter(
      (b) =>
        !q ||
        (b.word?.word || '').toLowerCase().includes(q) ||
        (b.word?.definition || '').toLowerCase().includes(q)
    )
    .sort((a, b) => {
      if (sort === 'az') return (a.word?.word || '').localeCompare(b.word?.word || '')
      if (sort === 'hardest') return (a.box || 0) - (b.box || 0)
      return 0 // newest: server order
    })

  function toggleSelect(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  async function batchAdd(listId) {
    setBusy(true)
    try {
      const ids = selected
        .map((bid) => bookmarks.find((b) => b._id === bid)?.word?._id)
        .filter(Boolean)
      await Promise.all(ids.map((wordId) => api.post(`/lists/${listId}/words`, { wordId })))
      setLastListId(listId)
      setSelected([])
      qc.invalidateQueries({ queryKey: ['lists'] })
      qc.invalidateQueries({ queryKey: ['list', listId] })
    } catch {
      notify("Couldn't add to that list.")
    } finally {
      setBusy(false)
    }
  }

  async function batchUnstar() {
    setBusy(true)
    try {
      const ids = selected
        .map((bid) => bookmarks.find((b) => b._id === bid)?.word?._id)
        .filter(Boolean)
      await Promise.all(ids.map((wordId) => api.delete(`/bookmarks/${wordId}`)))
      setSelected([])
      qc.invalidateQueries({ queryKey: ['bookmarks'] })
    } catch {
      notify("Couldn't remove those words.")
    } finally {
      setBusy(false)
    }
  }

  function create() {
    createList.mutate(
      { title: newTitle },
      {
        onSuccess: () => setNewTitle(''),
        onError: (err) => notify(err.message || "Couldn't create that list."),
      }
    )
  }

  if (isLoading) {
    return (
      <div className="animate-page space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200 dark:bg-night-800" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-200 dark:bg-night-800" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600 dark:bg-red-950/50 dark:text-red-300">
        Failed to load saved words.{' '}
        <button className="underline" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="animate-page space-y-6">
      <div>
        <PageHeader
          eyebrow="Library"
          title="Saved words"
          sub={
            bookmarks.length === 0
              ? 'Star words from search to build your review shelf.'
              : `${counts.learning} still learning · ${counts.mastered} mastered.`
          }
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {bookmarks.length > 0 && (
            <Link to="/bookmarks/practice">
              <Button className="border-accent px-3 py-1.5 text-xs">
                Review saved →
              </Button>
            </Link>
          )}
          <Link to="/words/new">
            <Button variant="secondary" className="px-3 py-1.5 text-xs">
              + Add word
            </Button>
          </Link>
          {myDeck && (
            <Link to={`/decks/${myDeck._id}`}>
              <Button variant="secondary" className="px-3 py-1.5 text-xs">
                My Words deck →
              </Button>
            </Link>
          )}
          {bookmarks.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => {
                setSelectMode((m) => !m)
                setSelected([])
              }}
              aria-pressed={selectMode}
              className={`px-3 py-1.5 text-xs ${selectMode ? 'border-accent bg-accent text-primary' : ''}`}
            >
              {selectMode ? 'Cancel select' : 'Select'}
            </Button>
          )}
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <EmptyState
        art={<EmptyArt variant="saved" />}
          title="No saved words yet"
          message="Tap the ☆ on any word in search and it will wait for you here."
          action={
            <Link to="/search">
              <Button>Search words</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div role="tablist" aria-label="Filter by mastery" className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-night-800">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`min-h-9 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                    tab === t.id
                      ? 'bg-white text-primary shadow-sm dark:bg-night-900 dark:text-cream-100 dark:shadow-none'
                      : 'text-slate-500 hover:text-primary dark:text-cream-300/70 dark:hover:text-cream-100'
                  }`}
                >
                  {t.label} · {counts[t.id]}
                </button>
              ))}
            </div>
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-night-800">
              {SORTS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSort(s.id)}
                  aria-pressed={sort === s.id}
                  className={`min-h-9 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                    sort === s.id
                      ? 'bg-white text-primary shadow-sm dark:bg-night-900 dark:text-cream-100 dark:shadow-none'
                      : 'text-slate-500 hover:text-primary dark:text-cream-300/70 dark:hover:text-cream-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter saved words…"
            aria-label="Filter saved words"
          />
          {q && (
            <p className="-mt-4 text-xs text-slate-400 dark:text-cream-300/60">
              {visible.length} of {bookmarks.length} shown
            </p>
          )}
          {visible.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400 dark:text-cream-300/70">
              {q ? `Nothing saved matches “${filter.trim()}”.` : 'Nothing in this tab yet.'}
            </p>
          ) : (
            <ul className="space-y-2">
              {visible.map((b, i) => (
                <WordRow
                  key={b._id}
                  entry={b}
                  index={i}
                  lists={lists}
                  quickList={quickList}
                  onQuickListUsed={setLastListId}
                  notify={notify}
                  selectMode={selectMode}
                  selected={selected.includes(b._id)}
                  onSelect={toggleSelect}
                />
              ))}
            </ul>
          )}

          {selectMode && selected.length > 0 && (
            <BatchBar
              count={selected.length}
              lists={lists}
              busy={busy}
              onAdd={batchAdd}
              onUnstar={batchUnstar}
              onCancel={() => {
                setSelectMode(false)
                setSelected([])
              }}
            />
          )}
        </>
      )}

      <div>
        <h2 className="font-display text-lg font-bold text-primary dark:text-cream-100">My lists</h2>
        <div className="mt-2 flex items-center gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New list title…"
            aria-label="New list title"
            maxLength={60}
            className="min-w-0 flex-1"
          />
          <Button disabled={!newTitle.trim() || createList.isPending} onClick={create}>
            Create
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {lists.map((l, i) => (
            <div
              key={l._id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
            >
            <ListCard
              list={l}
              open={openId === l._id}
              onToggle={() => setOpenId((o) => (o === l._id ? null : l._id))}
              notify={notify}
            />
            </div>
          ))}
          {lists.length === 0 && (
            <p className="text-sm text-slate-400 dark:text-cream-300/70">No lists yet — group words for a test, a class, a trip.</p>
          )}
        </div>
      </div>

      {toast && (
        <Toast variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />
      )}
    </div>
  )
}
