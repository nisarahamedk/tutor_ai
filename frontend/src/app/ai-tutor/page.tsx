import React, { Suspense } from 'react'; // Added Suspense and ensured React is imported
import { AITutorChat } from '@/ai-tutor';
import { LoadingSpinner } from '@/components/shared'; // Added LoadingSpinner import
import Link from 'next/link'; // Keep existing imports if needed for layout
import { Button } from '@/components/ui/button'; // Keep existing imports
import { Brain, ArrowLeft } from 'lucide-react'; // Keep existing imports

// Retain the existing page layout structure if desired, or simplify.
// The task description implies a simpler structure for the content area.
// I will use the simpler structure for the main content area as per task,
// but keep the existing header for a more complete page.

const AITutorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header from existing page structure */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Home</span>
                </Link>
              </Button>
              <div className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-blue-600" />
                {/* Title from task description, was TutorAI before */}
                <span className="text-xl font-bold text-gray-900">AI Tutor</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                Settings
              </Button>
              <Button variant="outline" size="sm">
                Help
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - applying structure from task description */}
      <main className="flex-1 p-4">
        {/* Using container and p-4 from task description for the content area */}
        <div className="container mx-auto p-4">
          {/* h1 and mb-6 from task description */}
          <h1 className="text-3xl font-bold mb-6">AI Tutor</h1>
          <Suspense fallback={<LoadingSpinner />}>
            <AITutorChat />
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default AITutorPage;