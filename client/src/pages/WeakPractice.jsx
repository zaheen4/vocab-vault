import { Link } from 'react-router-dom'
import { useWeakWords } from '../api/queries'
import Button from '../components/ui/Button'
import EmptyArt from '../components/art/EmptyArt'
import ReviewSession from '../components/ReviewSession'

export default function WeakPractice() {
  const { data, isLoading, isError, refetch } = useWeakWords(20)
  return (
    <ReviewSession
      words={data?.words}
      isLoading={isLoading}
      isError={isError}
      onRestart={refetch}
      title="Weak Words"
      subtitle="Mistake bank cramming (Box 1 focus)"
      backTo="/progress"
      backLabel="Back to progress"
      emptyTitle="No weak words!"
      emptyMessage="You have no words currently stuck in Box 1. Great mastery!"
      emptyArt={<EmptyArt variant="review" />}
      emptyAction={
        <Link to="/progress">
          <Button>Back to progress</Button>
        </Link>
      }
      resultsTitle="Remediation completed!"
      resultsActions={
        <Link to="/progress">
          <Button>Back to progress</Button>
        </Link>
      }
    />
  )
}
