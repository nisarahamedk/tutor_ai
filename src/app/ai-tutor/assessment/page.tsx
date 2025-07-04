// Server Component page for skill assessments
import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { AssessmentContent } from '@/features/ai-tutor/components/learning/AssessmentContent';
import { AssessmentSkeleton } from '@/features/ai-tutor/components/loading/AssessmentSkeleton';

// SEO Metadata for server-rendered content
export const metadata: Metadata = {
  title: 'Skill Assessments | AI Tutor',
  description: 'Evaluate your programming skills with our comprehensive assessments. Get personalized learning recommendations based on your current knowledge level.',
  keywords: [
    'skill assessment',
    'programming quiz',
    'coding assessment',
    'skill evaluation',
    'knowledge test',
    'programming skills',
    'coding skills',
    'learning assessment',
    'technical evaluation',
    'skill level test'
  ],
  openGraph: {
    title: 'Skill Assessments | AI Tutor',
    description: 'Take our skill assessments to discover your current programming knowledge and get personalized learning recommendations.',
    type: 'website',
    images: [
      {
        url: '/api/og/skill-assessments',
        width: 1200,
        height: 630,
        alt: 'AI Tutor Skill Assessments'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skill Assessments | AI Tutor',
    description: 'Evaluate your programming skills and get personalized learning recommendations.',
    images: ['/api/og/skill-assessments']
  },
  alternates: {
    canonical: '/ai-tutor/assessment'
  }
};

// Generate structured data for SEO
function generateStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    "name": "Programming Skill Assessments",
    "description": "Comprehensive skill assessments covering frontend development, backend development, and other programming areas",
    "provider": {
      "@type": "Organization",
      "name": "AI Tutor",
      "url": "https://ai-tutor.example.com"
    },
    "educationalLevel": "beginner to advanced",
    "assesses": [
      "Frontend Development Skills",
      "Backend Development Skills",
      "Programming Fundamentals",
      "Web Development Knowledge"
    ],
    "timeRequired": "PT15M",
    "interactivityType": "mixed",
    "learningResourceType": "assessment"
  };
}

export default async function AssessmentListPage() {
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
            Skill Assessments
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover your current programming skills and get personalized learning 
            recommendations. Our AI-powered assessments adapt to your knowledge level.
          </p>
        </header>

        {/* Assessment features section */}
        <section className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-2">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Adaptive Testing</h3>
            <p className="text-sm text-gray-600">Questions adjust to your skill level</p>
          </div>
          
          <div className="space-y-2">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Instant Results</h3>
            <p className="text-sm text-gray-600">Get detailed feedback immediately</p>
          </div>
          
          <div className="space-y-2">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Personalized Path</h3>
            <p className="text-sm text-gray-600">Custom learning recommendations</p>
          </div>
          
          <div className="space-y-2">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900">Quick & Focused</h3>
            <p className="text-sm text-gray-600">Complete in 15-30 minutes</p>
          </div>
        </section>

        {/* Server Component with loading fallback */}
        <main>
          <Suspense fallback={<AssessmentSkeleton />}>
            <AssessmentContent />
          </Suspense>
        </main>

        {/* Server-rendered FAQ section for SEO */}
        <footer className="mt-12 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">How long do assessments take?</h4>
              <p className="text-gray-600">Most assessments take 15-30 minutes to complete, depending on the number of skills being evaluated.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Can I retake an assessment?</h4>
              <p className="text-gray-600">Yes, you can retake assessments after completing learning modules to track your improvement.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Are the results personalized?</h4>
              <p className="text-gray-600">Absolutely! Results include detailed feedback and personalized learning recommendations based on your performance.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">What happens after I complete an assessment?</h4>
              <p className="text-gray-600">You&apos;ll receive a detailed report with your skill levels and recommended learning paths to improve.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
