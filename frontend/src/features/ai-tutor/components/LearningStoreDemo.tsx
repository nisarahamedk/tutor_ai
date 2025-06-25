// src/features/ai-tutor/components/LearningStoreDemo.tsx
// Demo component showcasing the Comprehensive Learning Store (TASK-010)

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  useComprehensiveLearningStore,
  useComprehensiveLearningSelectors,
  useComprehensiveLearningActions,
  useComputedLearningData,
  useLearningPerformanceMetrics
} from '../stores';

export const LearningStoreDemo: React.FC = () => {
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  
  // Use comprehensive learning store selectors
  const tracks = useComprehensiveLearningSelectors.useTracks();
  const enrolledTracks = useComprehensiveLearningSelectors.useEnrolledTracks();
  const learningStats = useComprehensiveLearningSelectors.useLearningStats();
  const streakInfo = useComprehensiveLearningSelectors.useStreakInfo();
  const achievements = useComprehensiveLearningSelectors.useAchievements();
  const isLoading = useComprehensiveLearningSelectors.useIsLoading();
  const error = useComprehensiveLearningSelectors.useError();
  const syncStatus = useComprehensiveLearningSelectors.useSyncStatus();
  
  // Computed data
  const computedData = useComputedLearningData();
  const performanceMetrics = useLearningPerformanceMetrics();
  
  // Actions
  const actions = useComprehensiveLearningActions();
  
  const handleEnrollInTrack = async (trackId: string) => {
    try {
      await actions.enrollInTrack(trackId);
    } catch (error) {
      console.error('Failed to enroll in track:', error);
    }
  };
  
  const handleCompleteLesson = async (trackId: string, lessonId: string) => {
    try {
      await actions.completeLesson(trackId, lessonId);
    } catch (error) {
      console.error('Failed to complete lesson:', error);
    }
  };
  
  const handleUpdatePreferences = () => {
    actions.updatePreferences({
      learningStyle: 'kinesthetic',
      difficultyPreference: 'intermediate',
      sessionDuration: 45
    });
  };
  
  const handleAddGoal = () => {
    actions.addLearningGoal({
      type: 'lessons',
      target: 5,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Complete 5 lessons this week'
    });
  };
  
  const handleGenerateAnalytics = async () => {
    try {
      await actions.generateAnalytics();
    } catch (error) {
      console.error('Failed to generate analytics:', error);
    }
  };
  
  const availableTracks = tracks.filter(track => !enrolledTracks.includes(track.id));
  
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Learning Store Demo</h1>
        <p className="text-gray-600">Comprehensive Learning Progress Store (TASK-010)</p>
      </div>
      
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="text-red-800">Error: {error}</div>
        </Card>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span>Loading...</span>
          </div>
        </Card>
      )}
      
      {/* Sync Status */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-2">Sync Status</h3>
        <div className="flex items-center space-x-4">
          <Badge variant={syncStatus.isOnline ? 'default' : 'destructive'}>
            {syncStatus.isOnline ? 'Online' : 'Offline'}
          </Badge>
          {syncStatus.isSyncing && <Badge variant="secondary">Syncing...</Badge>}
          <span className="text-sm text-gray-600">
            Pending: {syncStatus.pendingActions} actions
          </span>
          {syncStatus.lastSyncTime && (
            <span className="text-sm text-gray-600">
              Last sync: {new Date(syncStatus.lastSyncTime).toLocaleTimeString()}
            </span>
          )}
        </div>
      </Card>
      
      {/* Learning Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold">Enrolled Tracks</h3>
          <p className="text-2xl font-bold text-blue-600">{learningStats.totalTracksEnrolled}</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="font-semibold">Completed Lessons</h3>
          <p className="text-2xl font-bold text-green-600">{learningStats.totalLessonsCompleted}</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="font-semibold">Learning Streak</h3>
          <p className="text-2xl font-bold text-orange-600">{streakInfo.current} days</p>
          <p className="text-sm text-gray-600">Longest: {streakInfo.longest}</p>
        </Card>
        
        <Card className="p-4">
          <h3 className="font-semibold">Average Score</h3>
          <p className="text-2xl font-bold text-purple-600">{learningStats.averageScore.toFixed(1)}%</p>
        </Card>
      </div>
      
      {/* Performance Metrics */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="font-medium">Weekly Velocity</p>
            <p className="text-xl">{performanceMetrics.avgWeeklyLessons.toFixed(1)} lessons/week</p>
          </div>
          <div>
            <p className="font-medium">Consistency Score</p>
            <p className="text-xl">{(performanceMetrics.consistency * 100).toFixed(0)}%</p>
          </div>
          <div>
            <p className="font-medium">Learning Efficiency</p>
            <p className="text-xl">{performanceMetrics.learningEfficiency.toFixed(1)}</p>
          </div>
        </div>
      </Card>
      
      {/* Skill Coverage */}
      {computedData && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Skill Development</h3>
          <div className="flex items-center space-x-4">
            <div>
              <p className="font-medium">Skills Covered</p>
              <p className="text-xl">{computedData.skillCoverage.learning}/{computedData.skillCoverage.total}</p>
            </div>
            <div className="flex-1">
              <Progress value={computedData.skillCoverage.percentage} className="w-full" />
              <p className="text-sm text-gray-600 mt-1">
                {computedData.skillCoverage.percentage.toFixed(1)}% coverage
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="font-medium mb-2">Achievement Breakdown</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(computedData.achievementsByRarity).map(([rarity, count]) => (
                <Badge key={rarity} variant="outline">
                  {rarity}: {count}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      )}
      
      {/* Available Tracks */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Available Tracks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableTracks.map(track => (
            <Card key={track.id} className="p-4 border border-gray-200">
              <h4 className="font-semibold">{track.title}</h4>
              <p className="text-sm text-gray-600 mb-2">{track.description}</p>
              <div className="flex items-center justify-between mb-3">
                <Badge 
                  variant={
                    track.difficulty === 'beginner' ? 'default' :
                    track.difficulty === 'intermediate' ? 'secondary' : 'destructive'
                  }
                >
                  {track.difficulty}
                </Badge>
                <span className="text-sm text-gray-600">{track.estimatedHours}h</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {track.skills.slice(0, 3).map(skill => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {track.skills.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{track.skills.length - 3}
                  </Badge>
                )}
              </div>
              <Button 
                size="sm" 
                onClick={() => handleEnrollInTrack(track.id)}
                disabled={isLoading}
                className="w-full"
              >
                Enroll
              </Button>
            </Card>
          ))}
        </div>
      </Card>
      
      {/* Enrolled Tracks */}
      {enrolledTracks.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">My Learning Progress</h3>
          <div className="space-y-4">
            {enrolledTracks.map(trackId => {
              const track = tracks.find(t => t.id === trackId);
              const progress = useComprehensiveLearningSelectors.useTrackProgress(trackId);
              
              if (!track) return null;
              
              return (
                <div key={trackId} className="border rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{track.title}</h4>
                    <span className="text-sm text-gray-600">{progress}% complete</span>
                  </div>
                  <Progress value={progress} className="mb-3" />
                  
                  {track.lessons.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-medium text-sm">Lessons:</p>
                      {track.lessons.map(lesson => (
                        <div key={lesson.id} className="flex items-center justify-between">
                          <span className="text-sm">{lesson.title}</span>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCompleteLesson(trackId, lesson.id)}
                            disabled={isLoading}
                          >
                            Complete
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
      
      {/* Achievements */}
      {achievements.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Achievements ({achievements.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.slice(0, 6).map(achievement => (
              <div key={achievement.id} className="flex items-center space-x-3 p-3 border rounded">
                <div className="text-2xl">{achievement.icon}</div>
                <div>
                  <p className="font-semibold text-sm">{achievement.title}</p>
                  <p className="text-xs text-gray-600">{achievement.description}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {achievement.points} pts
                    </Badge>
                    <Badge 
                      variant={achievement.rarity === 'legendary' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {achievement.rarity}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {/* Action Buttons */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleUpdatePreferences} disabled={isLoading}>
            Update Preferences
          </Button>
          <Button onClick={handleAddGoal} disabled={isLoading}>
            Add Learning Goal
          </Button>
          <Button onClick={handleGenerateAnalytics} disabled={isLoading}>
            Generate Analytics
          </Button>
          <Button onClick={actions.syncProgress} disabled={isLoading || !syncStatus.isOnline}>
            Sync Progress
          </Button>
          <Button onClick={actions.clearCache} variant="outline" disabled={isLoading}>
            Clear Cache
          </Button>
          <Button onClick={actions.optimizeStorage} variant="outline" disabled={isLoading}>
            Optimize Storage
          </Button>
        </div>
      </Card>
      
      {/* Debug Information */}
      <details className="bg-gray-50 p-4 rounded">
        <summary className="font-semibold cursor-pointer">Debug Information</summary>
        <div className="mt-4 space-y-2 text-sm">
          <div>
            <strong>Total Tracks:</strong> {tracks.length}
          </div>
          <div>
            <strong>Enrolled Tracks:</strong> {enrolledTracks.length}
          </div>
          <div>
            <strong>Total Points:</strong> {computedData?.totalPoints || 0}
          </div>
          <div>
            <strong>Preferred Difficulty:</strong> {computedData?.preferredDifficulty}
          </div>
          <div>
            <strong>Pending Offline Actions:</strong> {syncStatus.pendingActions}
          </div>
          <div>
            <strong>Learning Velocity:</strong> {learningStats.learningVelocity.toFixed(2)} lessons/week
          </div>
        </div>
      </details>
    </div>
  );
};

export default LearningStoreDemo;