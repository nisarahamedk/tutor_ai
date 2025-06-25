// src/features/ai-tutor/hooks/utils/useStoreIntegration.ts
// Store Integration Utility Hook for Cross-Store Operations

import { useCallback, useMemo, useEffect, useRef } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useComprehensiveLearningStore } from '../../stores/comprehensiveLearningStore';
import { useOptimizedSelector } from './useOptimizedSelector';
import type { TabType, Message } from '../../types';
import type { LearningTrack, TrackProgress, Achievement } from '../../types/learning';

/**
 * Combined state interface for cross-store operations
 */
export interface CombinedState {
  // Chat state
  activeTab: TabType;
  hasActiveConversation: boolean;
  messageCount: number;
  
  // Learning state
  currentTrack: string | null;
  learningProgress: number;
  recentAchievements: Achievement[];
  
  // Cross-cutting concerns
  isLearningActive: boolean;
  recommendedActions: string[];
}

/**
 * Sync configuration for store integration
 */
export interface SyncConfig {
  enableChatLearningSync: boolean;
  enableProgressNotifications: boolean;
  enableAchievementMessages: boolean;
  autoSwitchTabs: boolean;
}

/**
 * Store integration return interface
 */
export interface StoreIntegrationReturn {
  // Combined state
  combinedState: CombinedState;
  
  // Cross-store operations
  syncStores: () => void;
  triggerLearningFromChat: (trackId: string) => Promise<void>;
  notifyProgressInChat: (progress: { type: string; data: any }) => void;
  
  // Configuration
  updateSyncConfig: (config: Partial<SyncConfig>) => void;
  getSyncConfig: () => SyncConfig;
  
  // Utilities
  resetAllStores: () => void;
  exportCombinedData: () => any;
}

/**
 * Store Integration Hook - Manages cross-store operations and synchronization
 * 
 * Provides:
 * - Unified state access across multiple stores
 * - Cross-store operations and data flow
 * - Synchronized actions and updates
 * - Configuration management for store interactions
 */
export const useStoreIntegration = (): StoreIntegrationReturn => {
  // Sync configuration state
  const syncConfigRef = useRef<SyncConfig>({
    enableChatLearningSync: true,
    enableProgressNotifications: true,
    enableAchievementMessages: true,
    autoSwitchTabs: true
  });

  // Chat store selectors (optimized)
  const chatState = useOptimizedSelector(
    useChatStore,
    state => ({
      activeTab: state.activeTab,
      tabMessages: state.tabMessages,
      isLoading: state.isLoading,
      getCombinedMessages: state.getCombinedMessages,
      getMessageCount: state.getMessageCount
    })
  );

  // Learning store selectors (optimized)
  const learningState = useOptimizedSelector(
    useComprehensiveLearningStore,
    state => ({
      currentTrack: state.currentTrack,
      enrolledTracks: state.enrolledTracks,
      progress: state.progress,
      achievements: state.achievements,
      learningStreak: state.learningStreak
    })
  );

  // Store actions
  const chatActions = {
    setActiveTab: useChatStore(state => state.setActiveTab),
    sendMessageWithOptimistic: useChatStore(state => state.sendMessageWithOptimistic),
    addMessage: useChatStore(state => state.addMessage)
  };

  const learningActions = {
    enrollInTrack: useComprehensiveLearningStore(state => state.enrollInTrack),
    updateLessonProgress: useComprehensiveLearningStore(state => state.updateLessonProgress),
    completeLesson: useComprehensiveLearningStore(state => state.completeLesson)
  };

  // Combined state computation (memoized)
  const combinedState = useMemo((): CombinedState => {
    const hasActiveConversation = Object.values(chatState.tabMessages)
      .some(messages => messages.length > 1); // More than just welcome message
    
    const messageCount = Object.values(chatState.tabMessages)
      .reduce((total, messages) => total + messages.length, 0);
    
    const learningProgress = learningState.enrolledTracks.length > 0
      ? Object.values(learningState.progress)
          .reduce((sum, track) => sum + track.overallProgress, 0) / learningState.enrolledTracks.length
      : 0;
    
    const recentAchievements = learningState.achievements
      .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())
      .slice(0, 3);
    
    const isLearningActive = learningState.currentTrack !== null ||
      learningState.enrolledTracks.length > 0;
    
    const recommendedActions = generateRecommendedActions(
      chatState,
      learningState,
      syncConfigRef.current
    );

    return {
      activeTab: chatState.activeTab,
      hasActiveConversation,
      messageCount,
      currentTrack: learningState.currentTrack,
      learningProgress,
      recentAchievements,
      isLearningActive,
      recommendedActions
    };
  }, [chatState, learningState]);

  // Cross-store operations

  /**
   * Synchronize data between stores
   */
  const syncStores = useCallback((): void => {
    const config = syncConfigRef.current;
    
    if (!config.enableChatLearningSync) return;

    // Sync learning progress to chat context
    if (learningState.currentTrack && config.enableProgressNotifications) {
      const trackProgress = learningState.progress[learningState.currentTrack];
      if (trackProgress) {
        // This would update chat context with learning progress
        console.log('Syncing learning progress to chat:', trackProgress);
      }
    }

    // Sync achievements to chat notifications
    if (config.enableAchievementMessages && learningState.achievements.length > 0) {
      const latestAchievement = learningState.achievements
        .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime())[0];
      
      // Check if this achievement is new (within last 5 minutes)
      const achievementAge = Date.now() - new Date(latestAchievement.earnedAt).getTime();
      if (achievementAge < 5 * 60 * 1000) {
        console.log('New achievement detected for chat notification:', latestAchievement);
      }
    }
  }, [learningState]);

  /**
   * Trigger learning flow from chat interaction
   */
  const triggerLearningFromChat = useCallback(async (trackId: string): Promise<void> => {
    try {
      // Enroll in track if not already enrolled
      if (!learningState.enrolledTracks.includes(trackId)) {
        await learningActions.enrollInTrack(trackId);
      }

      // Switch to appropriate chat tab
      if (syncConfigRef.current.autoSwitchTabs) {
        chatActions.setActiveTab('progress');
      }

      // Send confirmation message to chat
      const confirmationMessage: Message = {
        id: `learning-start-${Date.now()}`,
        type: 'ai',
        content: `Great! I've started your learning journey with this track. Let's dive in!`,
        timestamp: new Date().toISOString(),
        metadata: {
          type: 'learning-trigger',
          trackId
        }
      };

      chatActions.addMessage(chatState.activeTab, confirmationMessage);

    } catch (error) {
      console.error('Failed to trigger learning from chat:', error);
      throw error;
    }
  }, [learningState.enrolledTracks, learningActions, chatActions, chatState.activeTab]);

  /**
   * Notify chat about learning progress
   */
  const notifyProgressInChat = useCallback((progress: { type: string; data: any }): void => {
    const config = syncConfigRef.current;
    
    if (!config.enableProgressNotifications) return;

    let message = '';
    let shouldNotify = false;

    switch (progress.type) {
      case 'lesson-complete':
        message = `🎉 Congratulations! You've completed the lesson "${progress.data.lessonTitle}".`;
        shouldNotify = true;
        break;
      
      case 'track-milestone':
        message = `🏆 Amazing! You've reached ${progress.data.percentage}% progress in "${progress.data.trackTitle}".`;
        shouldNotify = progress.data.percentage % 25 === 0; // Notify on quarter milestones
        break;
      
      case 'streak-achievement':
        message = `🔥 You're on fire! ${progress.data.days} days learning streak!`;
        shouldNotify = progress.data.days % 7 === 0; // Notify on weekly streaks
        break;
      
      case 'skill-mastery':
        message = `🌟 You've mastered ${progress.data.skill}! Ready for more advanced topics?`;
        shouldNotify = true;
        break;
    }

    if (shouldNotify && message) {
      const progressMessage: Message = {
        id: `progress-${Date.now()}`,
        type: 'ai',
        content: message,
        timestamp: new Date().toISOString(),
        metadata: {
          type: 'progress-notification',
          progressType: progress.type,
          data: progress.data
        }
      };

      chatActions.addMessage('progress', progressMessage);
    }
  }, [chatActions]);

  // Configuration management

  /**
   * Update sync configuration
   */
  const updateSyncConfig = useCallback((config: Partial<SyncConfig>): void => {
    syncConfigRef.current = {
      ...syncConfigRef.current,
      ...config
    };
  }, []);

  /**
   * Get current sync configuration
   */
  const getSyncConfig = useCallback((): SyncConfig => {
    return { ...syncConfigRef.current };
  }, []);

  // Utilities

  /**
   * Reset all stores to initial state
   */
  const resetAllStores = useCallback((): void => {
    // This would reset both stores - implementation depends on store structure
    console.log('Resetting all stores...');
    
    // Clear chat messages
    Object.keys(chatState.tabMessages).forEach(tab => {
      // Implementation would call store reset methods
    });
    
    // Clear learning progress
    // Implementation would call learning store reset methods
  }, [chatState.tabMessages]);

  /**
   * Export combined data for backup/transfer
   */
  const exportCombinedData = useCallback(() => {
    return {
      timestamp: new Date().toISOString(),
      version: '1.0',
      chat: {
        activeTab: chatState.activeTab,
        messages: chatState.tabMessages
      },
      learning: {
        enrolledTracks: learningState.enrolledTracks,
        progress: learningState.progress,
        achievements: learningState.achievements,
        learningStreak: learningState.learningStreak
      },
      sync: syncConfigRef.current
    };
  }, [chatState, learningState]);

  // Auto-sync effect
  useEffect(() => {
    if (syncConfigRef.current.enableChatLearningSync) {
      syncStores();
    }
  }, [syncStores, learningState.achievements, learningState.progress]);

  return {
    // Combined state
    combinedState,
    
    // Cross-store operations
    syncStores,
    triggerLearningFromChat,
    notifyProgressInChat,
    
    // Configuration
    updateSyncConfig,
    getSyncConfig,
    
    // Utilities
    resetAllStores,
    exportCombinedData
  };
};

// Helper Functions

/**
 * Generate recommended actions based on current state
 */
function generateRecommendedActions(
  chatState: any,
  learningState: any,
  config: SyncConfig
): string[] {
  const actions: string[] = [];

  // No active learning
  if (learningState.enrolledTracks.length === 0) {
    actions.push('Explore learning tracks to get started');
  }

  // Incomplete tracks
  const incompleteTrack = Object.values(learningState.progress)
    .find((track: any) => track.status === 'in-progress' && track.overallProgress < 100);
  
  if (incompleteTrack) {
    actions.push('Continue your learning progress');
  }

  // Low engagement
  if (chatState.messageCount < 5 && learningState.enrolledTracks.length > 0) {
    actions.push('Ask me questions about your learning topics');
  }

  // Streak at risk
  if (learningState.learningStreak > 0 && learningState.learningStreak < 7) {
    actions.push('Keep your learning streak alive');
  }

  // New achievements
  const recentAchievements = learningState.achievements.filter((achievement: any) => {
    const achievementAge = Date.now() - new Date(achievement.earnedAt).getTime();
    return achievementAge < 24 * 60 * 60 * 1000; // Within last 24 hours
  });

  if (recentAchievements.length > 0) {
    actions.push('Check out your recent achievements');
  }

  return actions.slice(0, 3); // Limit to top 3 recommendations
}

/**
 * Specialized hook for chat-learning integration
 */
export const useChatLearningIntegration = () => {
  const { triggerLearningFromChat, notifyProgressInChat, combinedState } = useStoreIntegration();
  
  return {
    startLearningFromChat: triggerLearningFromChat,
    notifyProgress: notifyProgressInChat,
    isLearningActive: combinedState.isLearningActive,
    learningProgress: combinedState.learningProgress,
    recommendedActions: combinedState.recommendedActions
  };
};

/**
 * Specialized hook for progress synchronization
 */
export const useProgressSync = () => {
  const { notifyProgressInChat, syncStores } = useStoreIntegration();
  
  // Auto-notify on lesson completion
  const notifyLessonComplete = useCallback((lessonTitle: string, trackTitle: string) => {
    notifyProgressInChat({
      type: 'lesson-complete',
      data: { lessonTitle, trackTitle }
    });
  }, [notifyProgressInChat]);

  // Auto-notify on track milestone
  const notifyTrackMilestone = useCallback((percentage: number, trackTitle: string) => {
    notifyProgressInChat({
      type: 'track-milestone',
      data: { percentage, trackTitle }
    });
  }, [notifyProgressInChat]);

  // Auto-notify on streak achievement
  const notifyStreakAchievement = useCallback((days: number) => {
    notifyProgressInChat({
      type: 'streak-achievement',
      data: { days }
    });
  }, [notifyProgressInChat]);

  return {
    notifyLessonComplete,
    notifyTrackMilestone,
    notifyStreakAchievement,
    syncStores
  };
};