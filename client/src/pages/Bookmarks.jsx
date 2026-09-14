import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  useAddListWord,
  useBookmarks,
  useCreateList,
  useCustomList,
  useCustomLists,
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

function WordRow({ entry, lists }) {
  const word = entry.word || {}
  const toggle = useToggleBookmark()
  const addToList = useAddListWord()
  const ttsAvailable = useTtsAvailable()
  const [listId, setListId] = useState('')
  const [toast, setToast] = useState(null)

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
                { onError: () => setToast({ variant: 'error', message: "Couldn't remove that word." }) }
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
                  onError: () => setToast({ variant: 'error', message: "Couldn't play the pronunciation." }),
                })
              }
            >
              <SpeakerIcon />
            </Button>
          )}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">{word.definition}</p>
      {word.example && <p className="mt-1 text-sm text-slate-400 italic">“{word.example}”</p>}
      {lists.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <select
            aria-label={`Add ${word.word} to a list`}
            value={listId}
            onChange={(e) => setListId(e.target.value)}
            className="min-h-9 flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-accent focus:outline-none"
          >
            <option value="">Add to a list…</option>
            {lists.map((l) => (
              <option key={l._id} value={l._id}>
                {l.title}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            disabled={!listId || addToList.isPending}
            onClick={() =>
              addToList.mutate(
                { id: listId, wordId: word._id },
                {
                  onSuccess: () => setListId(''),
                  onError: () => setToast({ variant: 'error', message: "Couldn't add to that list." }),
                }
              )
            }
          >
            Add
          </Button>
        </div>
      )}
      {toast && (
        <div className="mt-3">
          <Toast variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />
        </div>
      )}
    </li>
  )
}

function ListCard({ list, open, onToggle }) {
  const detail = useCustomList(open ? list._id : null)
  const rename = useRenameList()
  const remove = useDeleteList()
  const removeWord = useRemoveListWord()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(list.title)
  const [toast, setToast] = useState(null)

  function saveTitle() {
    rename.mutate(
      { id: list._id, title },
      {
        onSuccess: () => setEditing(false),
        onError: () => setToast({ variant: 'error', message: "Couldn't rename that list." }),
      }
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
          aria-label={`Delete ${list.title}`}
          disabled={remove.isPending}
          onClick={() =>
            remove.mutate(
              { id: list._id },
              { onError: () => setToast({ variant: 'error', message: "Couldn't delete that list." }) }
            )
          }
        >
          Delete
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
                    { onError: () => setToast({ variant: 'error', message: "Couldn't remove that word." }) }
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
      {toast && (
        <div className="mt-3">
          <Toast variant={toast.variant} message={toast.message} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}

export default function Bookmarks() {
  const { data: bookmarks = [], isLoading, isError } = useBookmarks()
  const { data: lists = [] } = useCustomLists()
  const createList = useCreateList()
  const [newTitle, setNewTitle] = useState('')
  const [openId, setOpenId] = useState(null)
  const [toast, setToast] = useState(null)

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
        <ul className="space-y-2">
          {bookmarks.map((b) => (
            <WordRow key={b._id} entry={b} lists={lists} />
          ))}
        </ul>
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
