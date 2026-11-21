import { Link } from 'react-router-dom'
import { useDueWords } from '../api/queries'
import Button from '../components/ui/Button'
import EmptyArt from '../components/art/EmptyArt'
import ReviewSession from '../components/ReviewSession'

export default function DuePractice() {
  const { data, isLoading, isError, refetch } = useDueWords(20)
  const reloadDueWords = async () => {
    const result = await refetch()
    return result.data?.words
  }
  return (
    <ReviewSession
      words={data?.words}
      isLoading={isLoading}
      isError={isError}
      onRestart={reloadDueWords}
      title="Daily Review"
      subtitle="Cross-deck spaced repetition"
      backTo="/"
      backLabel="Back to decks"
      emptyTitle="All caught up!"
      emptyMessage="No cards are currently due for spaced repetition review across your decks."
      emptyArt={<EmptyArt variant="saved" />}
      emptyAction={
        <Link to="/">
          <Button>Explore decks</Button>
        </Link>
      }
      resultsTitle="Daily queue completed!"
      resultsActions={
        <Link to="/">
          <Button>Back to decks</Button>
        </Link>
      }
    />
  )
}
