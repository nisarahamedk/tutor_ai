// Server Component page for track exploration
import React, { Suspense } from 'react';
import { Metadata } from 'next';
// import { TrackGrid } from '@/features/ai-tutor/components/learning/TrackGrid';
import { TrackGridSkeleton } from '@/features/ai-tutor/components/loading/TrackGridSkeleton';
import { TrackExplorationClientWrapper } from './TrackExplorationClientWrapper';

// SEO Metadata for server-rendered content
export const metadata: Metadata = {
  title: 'Explore Learning Tracks | AI Tutor',
  description: 'Discover comprehensive learning tracks in Frontend Development, UX/UI Design, Backend Development, Mobile Development, DevOps & Cloud, and Data Science. Start your coding journey today.',
  keywords: [
    'programming courses',
    'web development',
    'frontend development',
    'backend development',
    'mobile development',
    'devops',
    'data science',
    'coding bootcamp',
    'online learning',
    'React',
    'TypeScript',
    'JavaScript',
    'Python',
    'Node.js'
  ],
  openGraph: {
    title: 'Explore Learning Tracks | AI Tutor',
    description: 'Choose from 6 comprehensive learning tracks designed to take you from beginner to professional developer.',
    type: 'website',
    images: [
      {
        url: '/api/og/learning-tracks',
        width: 1200,
        height: 630,
        alt: 'AI Tutor Learning Tracks'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explore Learning Tracks | AI Tutor',
    description: 'Choose from 6 comprehensive learning tracks designed to take you from beginner to professional developer.',
    images: ['/api/og/learning-tracks']
  },
  alternates: {
    canonical: '/ai-tutor/explore'
  }
};

// Generate structured data for SEO
function generateStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "AI Tutor Learning Tracks",
    "description": "Comprehensive programming courses covering Frontend Development, Backend Development, Mobile Development, UX/UI Design, DevOps, and Data Science",
    "provider": {
      "@type": "Organization",
      "name": "AI Tutor",
      "url": "https://ai-tutor.example.com"
    },
    "courseMode": "online",
    "educationalLevel": "beginner to advanced",
    "teaches": [
      "Frontend Development",
      "Backend Development", 
      "Mobile Development",
      "UX/UI Design",
      "DevOps & Cloud",
      "Data Science"
    ],
    "programmingLanguage": [
      "JavaScript",
      "TypeScript", 
      "Python",
      "React",
      "Node.js"
    ]
  };
}

export default async function ExplorePage() {
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
            Explore Learning Tracks
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose from comprehensive learning paths designed by industry experts. 
            Each track includes hands-on projects, assessments, and personalized AI guidance 
            to accelerate your learning journey.
          </p>
        </header>

        {/* Server-rendered benefits section for SEO */}
        <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">AI-Powered Learning</h3>
            <p className="text-sm text-gray-600">Personalized curriculum adapts to your pace and style</p>
          </div>
          
          <div className="space-y-2">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Industry-Relevant</h3>
            <p className="text-sm text-gray-600">Learn skills that employers are actively seeking</p>
          </div>
          
          <div className="space-y-2">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Community Support</h3>
            <p className="text-sm text-gray-600">Connect with fellow learners and mentors</p>
          </div>
        </section>

        {/* Server Component with Client interaction wrapper */}
        <main>
          <Suspense fallback={<TrackGridSkeleton />}>
            <TrackExplorationClientWrapper />
          </Suspense>
        </main>

        {/* Server-rendered footer content for SEO */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>
            Start your journey today with our comprehensive learning tracks. 
            All courses include lifetime access, project-based learning, and career support.
          </p>
        </footer>
      </div>
    </>
  );
}