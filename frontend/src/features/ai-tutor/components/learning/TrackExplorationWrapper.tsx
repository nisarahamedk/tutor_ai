'use client'

import { useRouter } from 'next/navigation'
import { TrackExplorationComponent, type LearningTrack } from './TrackExplorationComponent'

export const TrackExplorationWrapper: React.FC = () => {
  const router = useRouter()

  const handleTrackSelect = (track: LearningTrack) => {
    console.log('Track selected:', track.title)
    // Navigate to the track detail page
    router.push(`/ai-tutor/tracks/${track.id}`)
  }

  return <TrackExplorationComponent onTrackSelect={handleTrackSelect} />
}