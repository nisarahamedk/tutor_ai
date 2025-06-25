// Server Component for displaying skill assessments (static content)
import React from 'react';
import { Clock, BookOpen, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSkillAssessments } from '../../queries';
import { AssessmentClient } from './AssessmentClient';

// Server Component - renders static assessment content
export async function AssessmentContent() {
  // Server-side data fetching with caching
  const assessments = await getSkillAssessments();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Server-rendered header content for SEO */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Skill Assessments</h3>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Evaluate your current knowledge and get personalized learning recommendations. 
          Our assessments adapt to your skill level and provide detailed feedback.
        </p>
      </div>

      {/* Assessments Grid - Server rendered */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {assessments.map((assessment) => (
          <Card
            key={assessment.id}
            className="border-border hover:border-primary/50 transition-colors group"
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                    {assessment.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {assessment.description}
                  </p>
                </div>
                <div className="ml-4">
                  <Badge 
                    className={`${getDifficultyColor(assessment.difficulty)} border-0`}
                  >
                    {assessment.difficulty}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Assessment metadata - Server rendered */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{assessment.estimatedTime}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>{assessment.skills.length} skills</span>
                </div>
              </div>

              {/* Skills preview - Server rendered */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Skills Covered:</h4>
                <div className="flex flex-wrap gap-1">
                  {assessment.skills.slice(0, 4).map((skill) => (
                    <Badge 
                      key={skill.skill} 
                      variant="outline" 
                      className="text-xs"
                    >
                      {skill.skill}
                    </Badge>
                  ))}
                  {assessment.skills.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{assessment.skills.length - 4} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* What you'll learn section - Server rendered */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">What you'll discover:</span>
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Your current skill level in each area</li>
                  <li>• Personalized learning recommendations</li>
                  <li>• Areas where you excel and need improvement</li>
                  <li>• Suggested learning path based on your goals</li>
                </ul>
              </div>

              {/* Client Component for interaction */}
              <AssessmentClient assessment={assessment} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assessment benefits - Server rendered for SEO */}
      <div className="mt-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Why Take Our Assessments?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Personalized Learning</h4>
            <p className="text-gray-600">Get recommendations tailored to your current skill level</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Knowledge Gaps</h4>
            <p className="text-gray-600">Identify areas that need more focus in your learning journey</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Quick & Efficient</h4>
            <p className="text-gray-600">Get meaningful insights in just 15-30 minutes</p>
          </div>
        </div>
      </div>
    </div>
  );
}