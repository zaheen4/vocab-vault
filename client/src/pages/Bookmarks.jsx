import { useState } from 'react'
import { Link } from 'react-router-dom'
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
import SpeakerIcon from '../components/ui/SpeakerIcon'
import Toast from '../components/ui/Toast'
import { speakWord, useTtsAvailable } from '../utils/speak'

const inputClass =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none'

function WordRow({ entry, lists, quickList, onQuickListUsed, notify }) {
  const word = entry.word || {}
  const toggle = useToggleBookmark()
  const addToList = useAddListWord()
  const ttsAvailable = useTtsAvailable()
  const [listId, setListId] = useState('')

  function addTo(wordListId, wordId) {
    addToList.mutate(
      { id: wordListId, wordId },
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
    <li className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display font-semibold text-primary">{word.word}</h3>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 self-center">
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
          {ttsAvailable && (
            <Button
              variant="secondary"
              className="shrink-0 self-center"
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
        </span>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
        {word.partOfSpeech && <span className="text-slate-400 italic">{word.partOfSpeech}</span>}
        {word.group != null && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
            Group {word.group}
          </span>
        )}
        {word.source === 'custom' && (
          <span className="rounded-full bg-gold/50 px-2 py-0.5 font-medium text-primary">Yours</span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-600">{word.definition}</p>
      {word.example && <p className="mt-1 text-sm text-slate-400 italic">“{word.example}”</p>}
      {quickList && (
        <div className="mt-3">
          <button
            type="button"
            disabled={addToList.isPending}
            onClick={() => addTo(quickList._id, word._id)}
            className="min-h-9 rounded-md border border-accent bg-gold/40 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-gold disabled:opacity-50"
          >
            + {quickList.title}
          </button>
        </div>
      )}
      {lists.length > 1 && (
        <div className="mt-2 flex items-center gap-2">
          <select
            aria-label={`Add ${word.word} to a different list`}
            value={listId}
            onChange={(e) => setListId(e.target.value)}
            className="min-h-9 flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
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
          <Button
            variant="secondary"
            disabled={!listId || addToList.isPending}
            onClick={() => addTo(listId, word._id)}
          >
            Add
          </Button>
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
    remove.mutate(
      { id: list._id },
      { onError: () => notify("Couldn't delete that list.") }
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        {editing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="List title"
            maxLength={60}
            className="min-h-9 flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            className="flex-1 text-left font-display font-semibold text-primary"
          >
            {list.title}
            <span className="ml-2 text-xs font-medium text-slate-400">
              {list.wordCount} word{list.wordCount === 1 ? '' : 's'} {open ? '▾' : '▸'}
            </span>
          </button>
        )}
        {editing ? (
          <Button variant="secondary" disabled={rename.isPending} onClick={saveTitle}>
            Save
          </Button>
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
      {open && (
        <ul className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
          {(detail.data?.words || []).map((w) => (
            <li key={w._id} className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-primary">{w.word}</span>
              <span className="truncate text-slate-500">{w.definition}</span>
              <button
                type="button"
                aria-label={`Remove ${w.word} from ${list.title}`}
                className="ml-auto min-h-9 min-w-9 shrink-0 rounded-md px-2 py-1 text-xs font-medium text-slate-400 hover:text-red-600"
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
          {detail.isLoading && <li className="text-sm text-slate-400">Loading words…</li>}
          {detail.data && detail.data.words.length === 0 && (
            <li className="text-sm text-slate-400">No words yet — add some from your saved words above.</li>
          )}
        </ul>
      )}
    </div>
  )
}

export default function Bookmarks() {
  const { data: bookmarks = [], isLoading, isError } = useBookmarks()
  const { data: lists = [] } = useCustomLists()
  const { data: decks = [] } = useDecks()
  const createList = useCreateList()
  const [newTitle, setNewTitle] = useState('')
  const [openId, setOpenId] = useState(null)
  const [filter, setFilter] = useState('')
  const [lastListId, setLastListId] = useState(null)
  const [toast, setToast] = useState(null)
  const notify = (message) => setToast({ variant: 'error', message })

  const myDeck = decks.find((d) => d.source === 'custom')
  const quickList = lists.find((l) => l._id === lastListId) ?? lists[0] ?? null
  const q = filter.trim().toLowerCase()
  const visible = q
    ? bookmarks.filter(
        (b) =>
          (b.word?.word || '').toLowerCase().includes(q) ||
          (b.word?.definition || '').toLowerCase().includes(q)
      )
    : bookmarks

  function create() {
    createList.mutate(
      { title: newTitle },
      {
        onSuccess: () => setNewTitle(''),
        onError: (err) => setToast({ variant: 'error', message: err.message || "Couldn't create that list." }),
      }
    )
  }

  if (isLoading) {
    return (
      <div className="animate-page space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-slate-200" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
        Failed to load saved words.{' '}
        <button className="underline" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="animate-page space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary">Saved words</h1>
        <p className="mt-1 text-sm text-slate-500">
          {bookmarks.length === 0
            ? 'Star words from search to build your review shelf.'
            : `${bookmarks.length} starred word${bookmarks.length === 1 ? '' : 's'}.`}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            to="/words/new"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:border-accent"
          >
            + Add word
          </Link>
          {myDeck && (
            <Link
              to={`/decks/${myDeck._id}`}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:border-accent"
            >
              My Words deck →
            </Link>
          )}
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <EmptyState
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
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter saved words…"
            aria-label="Filter saved words"
            className={inputClass}
          />
          {q && (
            <p className="-mt-4 text-xs text-slate-400">
              {visible.length} of {bookmarks.length} shown
            </p>
          )}
          {visible.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">
              Nothing saved matches “{filter.trim()}”.
            </p>
          ) : (
            <ul className="space-y-2">
              {visible.map((b) => (
                <WordRow
                  key={b._id}
                  entry={b}
                  lists={lists}
                  quickList={quickList}
                  onQuickListUsed={setLastListId}
                  notify={notify}
                />
              ))}
            </ul>
          )}
        </>
      )}

      <div>
        <h2 className="font-display text-lg font-bold text-primary">My lists</h2>
        <div className="mt-2 flex items-center gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New list title…"
            aria-label="New list title"
            maxLength={60}
            className={inputClass}
          />
          <Button disabled={!newTitle.trim() || createList.isPending} onClick={create}>
            Create
          </Button>
        </div>
        <div className="mt-3 space-y-2">
          {lists.map((l) => (
            <ListCard
              key={l._id}
              list={l}
              open={openId === l._id}
              onToggle={() => setOpenId((o) => (o === l._id ? null : l._id))}
              notify={notify}
            />
          ))}
          {lists.length === 0 && (
            <p className="text-sm text-slate-400">No lists yet — group words for a test, a class, a trip.</p>
          )}
        </div>
      </div>

      {toast && (
        <Toast variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />
      )}
    </div>
  )
}
