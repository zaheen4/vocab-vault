import { Link } from 'react-router-dom'
import { useSavedPracticeSession } from '../api/queries'
import Button from '../components/ui/Button'
import EmptyArt from '../components/art/EmptyArt'
import ReviewSession from '../components/ReviewSession'

export default function SavedPractice() {
  const { data: words, isLoading, isError, refetch } = useSavedPracticeSession(10)
  return (
    <ReviewSession
      words={words}
      isLoading={isLoading}
      isError={isError}
      onRestart={refetch}
      title="Review saved"
      subtitle="Starred words, unseen first"
      backTo="/bookmarks"
      backLabel="Saved words"
      emptyTitle="Nothing due right now"
      emptyMessage="Star some words, or come back when your saved reviews are due."
      emptyArt={<EmptyArt variant="saved" />}
      emptyAction={
        <Link to="/bookmarks">
          <Button>Back to saved</Button>
        </Link>
      }
      resultsTitle="Session complete!"
      resultsActions={
        <Link to="/bookmarks">
          <Button>Back to saved</Button>
        </Link>
      }
    />
  )
}
