// frontend/src/app/ai-tutor/page.tsx
import AITutorChat from '@/features/ai-tutor/AITutorChat'; // Ensure this path is correct
import React from 'react';

const AITutorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 flex flex-col items-center">
      <div className="w-full max-w-4xl mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
          AI Tutor
        </h1>
        <p className="mt-3 text-lg text-muted-foreground sm:mt-4">
          Your personalized AI learning assistant. Start your journey below!
        </p>
      </div>
      <AITutorChat />
    </div>
  );
};

export default AITutorPage;
