import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import PageHeader from '../components/PageHeader'

const DIFFICULTIES = ['basic', 'intermediate', 'advanced']

const labelClass = 'mb-1 block text-xs font-semibold text-slate-500 dark:text-cream-300/80'

export default function AddWord() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [word, setWord] = useState(searchParams.get('q') || '')
  const [definition, setDefinition] = useState('')
  const [example, setExample] = useState('')
  const [partOfSpeech, setPartOfSpeech] = useState('')
  const [difficulty, setDifficulty] = useState('basic')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [conflict, setConflict] = useState(null)

  async function submit(e) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    setError(null)
    setConflict(null)
    try {
      const data = await api.post('/words', {
        word: word.trim(),
        definition: definition.trim(),
        example: example.trim() || undefined,
        partOfSpeech: partOfSpeech.trim() || undefined,
        difficulty,
      })
      navigate(`/decks/${data.deckId}`)
    } catch (err) {
      if (err.status === 409) {
        setConflict({ word: word.trim(), existingWordId: err.data?.existingWordId })
      } else {
        setError(err.message || 'Could not save that word.')
      }
      setSaving(false)
    }
  }

  return (
    <div className="animate-page mx-auto max-w-xl space-y-4">
      <PageHeader
        eyebrow="Personal deck"
        title="Add your own word"
        sub="It lands in your personal My Words deck and joins the regular review rotation."
      />

      <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-night-900 dark:shadow-none">
        <Input
          id="word"
          label="Word"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="e.g. petrichor"
          autoFocus
        />
        <Input
          id="definition"
          as="textarea"
          label="Definition"
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          placeholder="What does it mean?"
          rows={2}
        />
        <Input
          id="example"
          as="textarea"
          label={<>Example <span className="font-normal">(optional)</span></>}
          value={example}
          onChange={(e) => setExample(e.target.value)}
          placeholder="Use it in a sentence"
          rows={2}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="pos"
            label={<>Part of speech <span className="font-normal">(optional)</span></>}
            value={partOfSpeech}
            onChange={(e) => setPartOfSpeech(e.target.value)}
            placeholder="noun"
          />
          <div>
            <label htmlFor="difficulty" className={labelClass}>
              Difficulty
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-accent focus:ring-2 focus:ring-accent/40 focus:outline-none dark:border-white/15 dark:bg-night-800 dark:text-cream-100 dark:focus:border-accent"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {conflict && (
          <p className="rounded-md bg-gold/40 px-3 py-2 text-sm text-primary dark:bg-accent/15 dark:text-accent">
            “{conflict.word}” already exists.{' '}
            <Link to={`/search?q=${encodeURIComponent(conflict.word)}`} className="font-semibold underline">
              Find it in search
            </Link>{' '}
            and star it instead.
          </p>
        )}
        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-300">{error}</p>
        )}

        <Button type="submit" fullWidth disabled={!word.trim() || !definition.trim() || saving}>
          {saving ? 'Saving…' : 'Add word'}
        </Button>
      </form>
    </div>
  )
}
