import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Notice from '../components/ui/Notice'
import PageHeader from '../components/PageHeader'

const DIFFICULTIES = ['basic', 'intermediate', 'advanced']

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

      <form onSubmit={submit} className="space-y-3 rounded-xl border border-line bg-card p-5 shadow-paper">
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
          <Input
            id="difficulty"
            as="select"
            label="Difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Input>
        </div>

        {conflict && (
          <Notice tone="info">
            “{conflict.word}” already exists.{' '}
            <Link to={`/search?q=${encodeURIComponent(conflict.word)}`} className="font-semibold text-accent-ink underline">
              Find it in search
            </Link>{' '}
            and star it instead.
          </Notice>
        )}
        {error && (
          <Notice tone="error">{error}</Notice>
        )}

        <Button type="submit" fullWidth disabled={!word.trim() || !definition.trim() || saving}>
          {saving ? 'Saving…' : 'Add word'}
        </Button>
      </form>
    </div>
  )
}
