// frontend/src/app/ai-tutor/tracks/[id]/page.tsx
import React from 'react'; // Ensure React is imported

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TrackDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Track Detail: {id}</h1>
      <p>Details for track <span className="font-semibold">{id}</span> will be here.</p>
      {/* Here you might fetch track details using id and display them */}
    </div>
  );
}
