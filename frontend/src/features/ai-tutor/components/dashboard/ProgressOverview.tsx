// Server Component for displaying user progress (static content)
import React from 'react';
import { TrendingUp, Award, CheckCircle, Star, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUserProgress } from '../../queries';
import { ProgressInteractionClient } from './ProgressInteractionClient';

// Mock user ID - in production this would come from authentication
const MOCK_USER_ID = 'user-123';

// Icon mapping for server-rendered achievement icons
const achievementIconMap = {
  check: CheckCircle,
  star: Star,
  target: Target,
  award: Award,
};

// Server Component - renders static progress content
export async function ProgressOverview() {
  // Server-side data fetching with caching
  const progressData = await getUserProgress(MOCK_USER_ID);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'planned': return 'bg-gray-400';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return 'bg-green-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 overflow-hidden">
      {/* Server-rendered header content for SEO */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 mb-1">Your Learning Progress</h3>
        <p className="text-sm text-gray-600">Track your journey across all learning paths</p>
        <div className="mt-2 text-xs text-gray-500">
          {progressData.overallStats.totalTracksStarted} tracks started • {progressData.overallStats.totalTimeSpent} total time • {progressData.overallStats.completionRate}% average completion
        </div>
      </div>

      {/* Learning Tracks Grid - Server rendered */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {progressData.tracks.map((track, index) => {
          const IconComponent = track.status === 'active' ? TrendingUp : Clock;
          
          return (
            <Card
              key={track.id}
              className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50 h-full"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                    {track.trackName}
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(track.status)}`} />
                    <Badge
                      variant={track.status === 'active' ? 'default' : track.status === 'paused' ? 'secondary' : 'outline'}
                      className="text-xs capitalize"
                    >
                      {track.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0 pb-3">
                <div className="space-y-3">
                  {/* Progress Bar - Server rendered */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{track.progress}% complete</span>
                      {track.status === 'active' && (
                        <div className="flex items-center gap-1 text-green-600">
                          <IconComponent className="w-4 h-4" />
                          <span className="text-xs font-medium">On track</span>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        {/* Client component will animate this */}
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(track.progress)}`}
                          style={{ width: `${track.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Time and Next Lesson - Server rendered */}
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{track.timeSpent} spent</span>
                    </div>
                    <div className="text-xs">
                      <span className="font-medium">Next: </span>
                      <span>{track.nextLesson}</span>
                    </div>
                  </div>

                  {/* Client component for interactions */}
                  <ProgressInteractionClient track={track} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Achievements Section - Server rendered */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="w-5 h-5 text-yellow-500" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {progressData.achievements.map((achievement) => {
              const IconComponent = achievementIconMap[achievement.iconType] || CheckCircle;
              const iconColorClass = achievement.iconType === 'star' ? 'text-yellow-500' :
                                   achievement.iconType === 'check' ? 'text-green-500' :
                                   achievement.iconType === 'target' ? 'text-blue-500' : 'text-purple-500';
              
              return (
                <div
                  key={achievement.id}
                  className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <IconComponent className={`w-4 h-4 ${iconColorClass}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {achievement.text}
                    </p>
                    <p className="text-xs text-gray-500">{achievement.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Continue Learning Section - Client Interactive */}
      <div className="text-center mt-6">
        <ProgressInteractionClient.ContinueLearningButton />
      </div>
    </div>
  );
}