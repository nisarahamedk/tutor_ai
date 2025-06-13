// frontend/src/app/ai-tutor/assessment/[id]/page.tsx
import React from 'react'; // Ensure React is imported

export default function AssessmentDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Assessment Detail: {params.id}</h1>
      <p>Details for assessment <span className="font-semibold">{params.id}</span> will be here.</p>
    </div>
  );
}
