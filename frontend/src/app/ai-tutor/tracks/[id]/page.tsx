// frontend/src/app/ai-tutor/tracks/[id]/page.tsx
import React from 'react'; // Ensure React is imported

export default function TrackDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Track Detail: {params.id}</h1>
      <p>Details for track <span className="font-semibold">{params.id}</span> will be here.</p>
      {/* Here you might fetch track details using params.id and display them */}
    </div>
  );
}
