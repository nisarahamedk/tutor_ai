// Server Component for displaying learning preferences (static content)
import React from 'react';
import { Lightbulb, Code, BookOpen, Target, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getLearningPreferences } from '../../queries';
import { PreferencesFormClient } from './PreferencesFormClient';

// Mock user ID - in production this would come from authentication
const MOCK_USER_ID = 'user-123';

// Icon mapping for server-rendered learning style icons
const learningStyleIconMap = {
  visual: Lightbulb,
  'hands-on': Code,
  reading: BookOpen,
};

// Server Component - renders static preferences content
export async function PreferencesDisplay() {
  // Server-side data fetching with caching
  const preferences = await getLearningPreferences(MOCK_USER_ID);

  // If no preferences exist, show the onboarding form
  if (!preferences) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Server-rendered onboarding content for SEO */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Personalize Your Learning</h3>
          <p className="text-lg text-gray-600">
            Help us customize your learning experience by sharing your preferences and goals.
          </p>
        </div>

        {/* Client Component for preferences form */}
        <PreferencesFormClient isOnboarding={true} />
      </div>
    );
  }

  // Render existing preferences
  const StyleIcon = learningStyleIconMap[preferences.learningStyle] || Lightbulb;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Server-rendered header content for SEO */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Learning Preferences</h3>
        <p className="text-lg text-gray-600">
          Review and update your learning preferences to optimize your experience.
        </p>
      </div>

      {/* Preferences Overview - Server rendered */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Learning Style Card */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <StyleIcon className="w-5 h-5 text-primary" />
              Learning Style
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Badge variant="default" className="mb-2 capitalize">
              {preferences.learningStyle.replace('-', ' ')}
            </Badge>
            <p className="text-sm text-gray-600">
              {preferences.learningStyle === 'visual' && 'Learn best with diagrams, videos, and visual aids'}
              {preferences.learningStyle === 'hands-on' && 'Prefer coding exercises and practical projects'}
              {preferences.learningStyle === 'reading' && 'Learn through documentation and written materials'}
            </p>
          </CardContent>
        </Card>

        {/* Time Availability Card */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-primary" />
              Time Commitment
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-primary mb-1">
              {preferences.timeAvailability}h
            </div>
            <p className="text-sm text-gray-600">per week</p>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {preferences.timeAvailability < 5 ? 'Light' : 
                 preferences.timeAvailability < 15 ? 'Moderate' : 'Intensive'} schedule
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Goals Card */}
        <Card className="border-border">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-primary" />
              Learning Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-lg font-semibold text-gray-900 mb-2">
              {preferences.goals.length} goals
            </div>
            <div className="space-y-1">
              {preferences.goals.slice(0, 2).map((goal) => (
                <Badge key={goal} variant="outline" className="text-xs mr-1 mb-1">
                  {goal}
                </Badge>
              ))}
              {preferences.goals.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{preferences.goals.length - 2} more
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personalized Recommendations - Server rendered for SEO */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Personalized Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Learning Style Recommendations */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Based on your learning style:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {preferences.learningStyle === 'visual' && (
                  <>
                    <li>• Interactive coding tutorials with visual feedback</li>
                    <li>• Video-based lessons and demonstrations</li>
                    <li>• Flowcharts and diagrams for complex concepts</li>
                  </>
                )}
                {preferences.learningStyle === 'hands-on' && (
                  <>
                    <li>• Project-based learning approach</li>
                    <li>• Interactive coding challenges</li>
                    <li>• Real-world application exercises</li>
                  </>
                )}
                {preferences.learningStyle === 'reading' && (
                  <>
                    <li>• Comprehensive written tutorials</li>
                    <li>• Code documentation deep-dives</li>
                    <li>• Article-based learning resources</li>
                  </>
                )}
              </ul>
            </div>

            {/* Time-based Recommendations */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Based on your schedule:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {preferences.timeAvailability < 5 ? (
                  <>
                    <li>• Short, focused 15-minute sessions</li>
                    <li>• Micro-learning bite-sized lessons</li>
                    <li>• Weekend project-based learning</li>
                  </>
                ) : preferences.timeAvailability < 15 ? (
                  <>
                    <li>• 30-45 minute focused learning blocks</li>
                    <li>• Weekly project milestones</li>
                    <li>• Balanced theory and practice</li>
                  </>
                ) : (
                  <>
                    <li>• Deep-dive coding sessions</li>
                    <li>• Complex project development</li>
                    <li>• Advanced topic exploration</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Preferences Section */}
      <div className="border-t pt-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Update Your Preferences</h4>
        <PreferencesFormClient 
          isOnboarding={false} 
          initialPreferences={preferences} 
        />
      </div>

      {/* Last Updated Info - Server rendered */}
      <div className="text-center text-xs text-gray-500 mt-6">
        Last updated: {new Date(preferences.lastUpdated).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>
    </div>
  );
}