// frontend/src/app/ai-tutor/tracks/page.tsx
import { TrackExplorationWrapper } from '@/features/ai-tutor/components/learning/TrackExplorationWrapper';
import React from 'react'; // Ensure React is imported

export default function TracksPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Learning Tracks</h1>
      <TrackExplorationWrapper />
    </div>
  );
}
