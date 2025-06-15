// frontend/src/app/ai-tutor/tracks/page.tsx
import { TrackExplorationComponent } from '@/features/ai-tutor';
import type { LearningTrack } from '@/features/ai-tutor/components/learning/TrackExplorationComponent';
import React from 'react'; // Ensure React is imported

export default function TracksPage() {
  // Placeholder handler for onTrackSelect if needed by TrackExplorationComponent
  const handleTrackSelect = (track: LearningTrack) => {
    // Argument `track` would be of type LearningTrack from the component
    console.log('Track selected:', track.title);
    // Potentially navigate to the track detail page:
    // router.push(`/ai-tutor/tracks/${track.id}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Learning Tracks</h1>
      {/*
        TrackExplorationComponent might require props like `onTrackSelect`.
        Providing a placeholder handler. The actual props will depend on its definition.
      */}
      <TrackExplorationComponent onTrackSelect={handleTrackSelect} />
    </div>
  );
}
