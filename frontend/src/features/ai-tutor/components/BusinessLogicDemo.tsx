// src/features/ai-tutor/components/BusinessLogicDemo.tsx
// Demo component showcasing the new business logic hooks from TASK-011

"use client"

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  BookOpen, 
  TrendingUp, 
  CheckCircle,
  AlertCircle,
  Clock,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

// Import our new business logic hooks
import { 
  useChatManager,
  useLearningTrackManager,
  useProgressTracker,
  useStoreIntegration
} from '../hooks/business';
import { useErrorBoundary } from '../hooks/utils';

/**
 * Business Logic Demo Component
 * 
 * Demonstrates the separation of concerns achieved by TASK-011:
 * - Business logic is extracted into custom hooks
 * - Components focus purely on UI rendering
 * - Improved testability and reusability
 * - Clean architecture with memoized performance
 */
export const BusinessLogicDemo: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [selectedDemo, setSelectedDemo] = useState<'chat' | 'learning' | 'progress' | 'integration'>('chat');

  // Business Logic Hooks (all the complex logic is abstracted away)
  const chatManager = useChatManager();
  const trackManager = useLearningTrackManager();
  const progressTracker = useProgressTracker();
  const storeIntegration = useStoreIntegration();
  const errorBoundary = useErrorBoundary();

  // Event Handlers (simple, focused on UI interactions)
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    try {
      await chatManager.sendMessage(inputValue);
      setInputValue('');
    } catch (error) {
      errorBoundary.reportError(error as Error);
    }
  };

  const handleTrackSelection = async (trackId: string) => {
    try {
      const success = await trackManager.enrollInTrack(trackId);
      if (success) {
        await storeIntegration.triggerLearningFromChat(trackId);
      }
    } catch (error) {
      errorBoundary.reportError(error as Error);
    }
  };

  // Demo sections (each showcasing different business logic hooks)
  const renderChatDemo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Chat Manager Hook Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={chatManager.activeTab === 'home' ? 'default' : 'secondary'}>
            Active Tab: {chatManager.activeTab}
          </Badge>
          <Badge variant={chatManager.isLoading ? 'destructive' : 'default'}>
            {chatManager.isLoading ? 'Loading...' : 'Ready'}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm">Messages: {chatManager.messages.length}</p>
          <p className="text-sm">Home Messages: {chatManager.getMessageCount('home')}</p>
          <p className="text-sm">Has unread: {chatManager.hasUnreadMessages('progress') ? 'Yes' : 'No'}</p>
        </div>

        <div className="flex gap-2">
          {(['home', 'progress', 'review', 'explore'] as const).map(tab => (
            <Button
              key={tab}
              variant={chatManager.activeTab === tab ? 'default' : 'outline'}
              size="sm"
              onClick={() => chatManager.switchTab(tab)}
            >
              {tab}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button onClick={handleSendMessage} disabled={chatManager.isLoading}>
            Send
          </Button>
        </div>

        {chatManager.error && (
          <div className="flex items-center gap-2 p-2 bg-red-50 rounded text-red-700 text-sm">
            <AlertCircle className="h-4 w-4" />
            {chatManager.error}
            <Button size="sm" variant="ghost" onClick={chatManager.clearError}>
              Clear
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderLearningDemo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Learning Track Manager Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Available Tracks</h4>
            <div className="space-y-2">
              {trackManager.tracks.slice(0, 3).map(track => (
                <div key={track.id} className="p-2 border rounded text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{track.title}</span>
                    <Badge variant="outline">{track.difficulty}</Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{track.description}</p>
                  <div className="flex gap-1 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => trackManager.selectTrack(track.id)}
                    >
                      Select
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleTrackSelection(track.id)}
                      disabled={!trackManager.canEnrollInTrack(track)}
                    >
                      {trackManager.canEnrollInTrack(track) ? 'Enroll' : 'Prerequisites Required'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Enrolled Tracks</h4>
            <div className="space-y-2">
              {trackManager.enrolledTracks.map(track => (
                <div key={track.id} className="p-2 bg-green-50 border border-green-200 rounded text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{track.title}</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex gap-1 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => trackManager.unenrollFromTrack(track.id)}
                    >
                      Unenroll
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {trackManager.selectedTrack && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-medium">Selected Track</h4>
            <p className="text-sm">{trackManager.selectedTrack.title}</p>
            <div className="mt-2">
              <p className="text-xs">Difficulty Score: {trackManager.calculateDifficulty(trackManager.selectedTrack).score}/10</p>
              <p className="text-xs">Prerequisites: {trackManager.getPrerequisites(trackManager.selectedTrack).length}</p>
            </div>
          </div>
        )}

        <div>
          <h4 className="font-medium mb-2">Recommended Tracks</h4>
          <div className="flex gap-2">
            {trackManager.getRecommendedTracks().slice(0, 2).map(track => (
              <Badge key={track.id} variant="secondary">
                {track.title}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderProgressDemo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Progress Tracker Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {progressTracker.overallProgress}%
            </div>
            <p className="text-xs text-gray-600">Overall Progress</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {progressTracker.learningStreak}
            </div>
            <p className="text-xs text-gray-600">Learning Streak</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(progressTracker.totalLearningTime / (1000 * 60 * 60))}h
            </div>
            <p className="text-xs text-gray-600">Total Time</p>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Track Progress</h4>
          <div className="space-y-2">
            {Object.entries(progressTracker.trackProgress).map(([trackId, progress]) => (
              <div key={trackId} className="flex items-center justify-between">
                <span className="text-sm">{trackId}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs">{progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Recent Activity</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {progressTracker.recentActivity.slice(0, 5).map(activity => (
              <div key={activity.id} className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded">
                <Clock className="h-3 w-3" />
                <span>{activity.title}</span>
                {activity.points && (
                  <Badge variant="outline" className="ml-auto">
                    +{activity.points}pts
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Next Milestone</h4>
          {(() => {
            const milestone = progressTracker.getNextMilestone();
            return milestone ? (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-sm">{milestone.title}</span>
                </div>
                <p className="text-xs text-gray-600">{milestone.description}</p>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full"
                      style={{ width: `${(milestone.current / milestone.target) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs mt-1">{milestone.current}/{milestone.target}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No milestones available</p>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );

  const renderIntegrationDemo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Store Integration Demo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Combined State</h4>
            <div className="space-y-1 text-sm">
              <p>Active Tab: {storeIntegration.combinedState.activeTab}</p>
              <p>Learning Active: {storeIntegration.combinedState.isLearningActive ? 'Yes' : 'No'}</p>
              <p>Learning Progress: {storeIntegration.combinedState.learningProgress.toFixed(1)}%</p>
              <p>Message Count: {storeIntegration.combinedState.messageCount}</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Recent Achievements</h4>
            <div className="space-y-1">
              {storeIntegration.combinedState.recentAchievements.slice(0, 3).map(achievement => (
                <div key={achievement.id} className="text-xs p-1 bg-green-50 rounded">
                  {achievement.title}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2">Recommended Actions</h4>
          <div className="space-y-1">
            {storeIntegration.combinedState.recommendedActions.map((action, index) => (
              <Badge key={index} variant="outline" className="mr-1 mb-1">
                {action}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={storeIntegration.syncStores}
          >
            Sync Stores
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => {
              const data = storeIntegration.exportCombinedData();
              console.log('Exported data:', data);
            }}
          >
            Export Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">TASK-011: Business Logic Hooks Demo</h1>
        <p className="text-gray-600">
          Demonstrating clean separation of business logic from UI components
        </p>
      </div>

      {/* Demo Navigation */}
      <div className="flex justify-center gap-2">
        {([
          { id: 'chat', label: 'Chat Manager', icon: MessageCircle },
          { id: 'learning', label: 'Track Manager', icon: BookOpen },
          { id: 'progress', label: 'Progress Tracker', icon: TrendingUp },
          { id: 'integration', label: 'Store Integration', icon: Award }
        ] as const).map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={selectedDemo === id ? 'default' : 'outline'}
            onClick={() => setSelectedDemo(id)}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* Demo Content */}
      <motion.div
        key={selectedDemo}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {selectedDemo === 'chat' && renderChatDemo()}
        {selectedDemo === 'learning' && renderLearningDemo()}
        {selectedDemo === 'progress' && renderProgressDemo()}
        {selectedDemo === 'integration' && renderIntegrationDemo()}
      </motion.div>

      {/* Benefits Summary */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle>Benefits of Business Logic Hooks</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">✅ Improved Testability</h4>
            <p className="text-sm text-gray-600">
              Business logic can be tested in isolation without rendering UI components.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">🔄 Enhanced Reusability</h4>
            <p className="text-sm text-gray-600">
              Hooks can be used across multiple components, reducing code duplication.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">🎯 Clean Separation</h4>
            <p className="text-sm text-gray-600">
              Components focus purely on UI rendering while hooks handle business logic.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">⚡ Optimized Performance</h4>
            <p className="text-sm text-gray-600">
              Memoized hooks prevent unnecessary recalculations and re-renders.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};