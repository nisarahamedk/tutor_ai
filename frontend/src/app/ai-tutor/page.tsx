import AITutorChat from '@/features/ai-tutor/AITutorChat';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Brain, ArrowLeft } from 'lucide-react';
import React from 'react';

const AITutorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
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
                <span className="text-xl font-bold text-gray-900">TutorAI</span>
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

      {/* Main Content */}
      <main className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">
          <AITutorChat />
        </div>
      </main>
    </div>
  );
};

export default AITutorPage;