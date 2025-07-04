// src/app/ai-tutor/assessment/[id]/page.tsx
import React from 'react'; // Ensure React is imported

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AssessmentDetailPage({ params }: PageProps) {
  const { id } = await params;
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Assessment Detail: {id}</h1>
      <p>Details for assessment <span className="font-semibold">{id}</span> will be here.</p>
    </div>
  );
}
