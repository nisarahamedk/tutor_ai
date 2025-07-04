// Server Component page for progress dashboard
import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { ProgressOverview } from '@/features/ai-tutor/components/dashboard/ProgressOverview';
import { ProgressDashboardSkeleton } from '@/features/ai-tutor/components/loading/ProgressDashboardSkeleton';

// SEO Metadata for server-rendered content
export const metadata: Metadata = {
  title: 'Learning Progress | AI Tutor',
  description: 'Track your learning journey across all courses. Monitor your progress, achievements, and continue where you left off.',
  keywords: [
    'learning progress',
    'course progress',
    'achievements',
    'learning dashboard',
    'skill tracking',
    'programming progress',
    'coding journey',
    'learning analytics'
  ],
  openGraph: {
    title: 'Learning Progress | AI Tutor',
    description: 'Track your learning journey across all courses. Monitor your progress, achievements, and continue where you left off.',
    type: 'website',
    images: [
      {
        url: '/api/og/progress-dashboard',
        width: 1200,
        height: 630,
        alt: 'AI Tutor Progress Dashboard'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Learning Progress | AI Tutor',
    description: 'Track your learning journey across all courses.',
    images: ['/api/og/progress-dashboard']
  },
  alternates: {
    canonical: '/ai-tutor/progress'
  }
};

// Generate structured data for SEO
function generateStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Learning Progress Dashboard",
    "description": "Personal learning dashboard showing course progress, achievements, and learning analytics",
    "mainEntity": {
      "@type": "LearningResource",
      "name": "Progress Tracking",
      "description": "Comprehensive tracking of learning progress across multiple programming courses",
      "teaches": [
        "Progress monitoring",
        "Achievement tracking", 
        "Learning analytics"
      ]
    }
  };
}

export default async function ProgressPage() {
  const structuredData = generateStructuredData();

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Server-rendered header content for SEO */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Learning Progress
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Track your journey across all learning paths. See your achievements, 
            monitor progress, and pick up exactly where you left off.
          </p>
        </header>

        {/* Progress insights section */}
        <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Real-time Tracking</h3>
            <p className="text-sm text-gray-600">Monitor your progress as you learn</p>
          </div>
          
          <div className="space-y-2">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Achievement System</h3>
            <p className="text-sm text-gray-600">Earn badges and celebrate milestones</p>
          </div>
          
          <div className="space-y-2">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Learning Analytics</h3>
            <p className="text-sm text-gray-600">Insights to optimize your learning</p>
          </div>
        </section>

        {/* Server Component with loading fallback */}
        <main>
          <Suspense fallback={<ProgressDashboardSkeleton />}>
            <ProgressOverview />
          </Suspense>
        </main>

        {/* Server-rendered tips section for SEO */}
        <footer className="mt-12 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Stay Consistent</h4>
              <p>Even 15 minutes of daily practice compounds into significant progress over time.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Review Regularly</h4>
              <p>Revisit completed modules to reinforce your understanding and retain knowledge.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Build Projects</h4>
              <p>Apply what you learn by building real projects that showcase your new skills.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Join Community</h4>
              <p>Connect with other learners to share experiences and get support when needed.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
