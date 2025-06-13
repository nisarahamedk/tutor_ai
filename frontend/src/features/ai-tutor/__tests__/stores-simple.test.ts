import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore, useLearningStore, useUserStore } from '../stores';

describe('Zustand Stores - Simple Tests', () => {
  beforeEach(() => {
    // Reset stores to clean state before each test
    useChatStore.setState({
      tabMessages: {
        home: [],
        progress: [],
        review: [],
        explore: []
      },
      activeTab: 'home',
      isLoading: false,
      error: null
    });

    useLearningStore.setState({
      tracks: [],
      currentTrack: null,
      currentSession: null,
      progress: {},
      assessments: [],
      flashcards: [],
      isLoading: false,
      error: null
    });

    useUserStore.setState({
      preferences: {
        theme: 'system',
        language: 'en',
        notifications: true,
        learningStyle: 'visual',
        autoSave: true,
        soundEnabled: true
      },
      profile: null,
      achievements: [],
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  });

  describe('Chat Store', () => {
    it('should have working actions', () => {
      // Test setActiveTab
      useChatStore.getState().setActiveTab('progress');
      expect(useChatStore.getState().activeTab).toBe('progress');

      // Test setLoading
      useChatStore.getState().setLoading(true);
      expect(useChatStore.getState().isLoading).toBe(true);

      // Test setError
      useChatStore.getState().setError('Test error');
      expect(useChatStore.getState().error).toBe('Test error');
    });

    it('should manage messages', () => {
      const message = {
        id: 'test-msg',
        content: 'Hello',
        type: 'user' as const,
        timestamp: new Date().toISOString()
      };

      // Add message
      useChatStore.getState().addMessage('home', message);
      const messages = useChatStore.getState().getTabMessages('home');
      expect(messages).toContain(message);

      // Remove message
      useChatStore.getState().removeMessage('home', 'test-msg');
      const updatedMessages = useChatStore.getState().getTabMessages('home');
      expect(updatedMessages).not.toContain(message);
    });
  });

  describe('Learning Store', () => {
    it('should manage tracks', () => {
      const track = {
        id: 'test-track',
        title: 'Test Track',
        description: 'Test description',
        progress: 0,
        difficulty: 'Beginner' as const,
        estimatedHours: 5,
        skills: ['skill1']
      };

      // Add track
      useLearningStore.getState().addTrack(track);
      expect(useLearningStore.getState().tracks).toContain(track);

      // Set current track
      useLearningStore.getState().setCurrentTrack(track);
      expect(useLearningStore.getState().currentTrack).toEqual(track);

      // Update track
      useLearningStore.getState().updateTrack('test-track', { progress: 50 });
      const updatedTrack = useLearningStore.getState().getTrackById('test-track');
      expect(updatedTrack?.progress).toBe(50);
    });

    it('should manage sessions', () => {
      const track = {
        id: 'session-track',
        title: 'Session Track',
        description: 'Test',
        progress: 25,
        difficulty: 'Beginner' as const,
        estimatedHours: 5,
        skills: ['skill1']
      };

      useLearningStore.getState().addTrack(track);
      useLearningStore.getState().startSession('session-track');

      const session = useLearningStore.getState().currentSession;
      expect(session).toBeDefined();
      expect(session?.trackId).toBe('session-track');

      useLearningStore.getState().endSession(95, 'Great session!');
      expect(useLearningStore.getState().currentSession).toBe(null);
      expect(useLearningStore.getState().progress['session-track']).toBeDefined();
    });
  });

  describe('User Store', () => {
    it('should manage preferences', () => {
      // Update preferences
      useUserStore.getState().setPreferences({ theme: 'dark', notifications: false });
      
      const prefs = useUserStore.getState().preferences;
      expect(prefs.theme).toBe('dark');
      expect(prefs.notifications).toBe(false);
      expect(prefs.language).toBe('en'); // Should preserve other preferences
    });

    it('should manage profile', () => {
      useUserStore.getState().updateProfile({
        name: 'John Doe',
        email: 'john@test.com'
      });

      const profile = useUserStore.getState().profile;
      expect(profile?.name).toBe('John Doe');
      expect(profile?.email).toBe('john@test.com');
      expect(profile?.level).toBe(1);
    });

    it('should manage achievements', () => {
      useUserStore.getState().addAchievement('first-lesson');
      useUserStore.getState().addAchievement('level-5');

      const achievements = useUserStore.getState().achievements;
      expect(achievements).toContain('first-lesson');
      expect(achievements).toContain('level-5');
      expect(useUserStore.getState().hasAchievement('first-lesson')).toBe(true);
    });

    it('should handle authentication', () => {
      useUserStore.getState().setAuthenticated(true);
      expect(useUserStore.getState().isAuthenticated).toBe(true);

      useUserStore.getState().setAuthenticated(false);
      expect(useUserStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('Store Integration', () => {
    it('should work together', () => {
      // Setup user
      useUserStore.getState().updateProfile({ name: 'Test User' });
      useUserStore.getState().setAuthenticated(true);

      // Add and select track
      const track = {
        id: 'integration-track',
        title: 'Integration Track',
        description: 'Test integration',
        progress: 0,
        difficulty: 'Beginner' as const,
        estimatedHours: 5,
        skills: ['integration']
      };
      
      useLearningStore.getState().addTrack(track);
      useLearningStore.getState().setCurrentTrack(track);

      // Add chat message
      const message = {
        id: 'integration-msg',
        content: 'Learning about integration',
        type: 'user' as const,
        timestamp: new Date().toISOString()
      };
      
      useChatStore.getState().addMessage('explore', message);

      // Verify all stores are connected and working
      expect(useUserStore.getState().isAuthenticated).toBe(true);
      expect(useLearningStore.getState().currentTrack?.id).toBe('integration-track');
      expect(useChatStore.getState().getTabMessages('explore')).toContain(message);
    });
  });

  describe('Store Selectors', () => {
    it('should provide correct selectors', () => {
      // Chat selectors
      expect(typeof useChatStore.getState().getTabMessages).toBe('function');
      expect(typeof useChatStore.getState().hasMessages).toBe('function');
      expect(typeof useChatStore.getState().getMessageCount).toBe('function');
      expect(typeof useChatStore.getState().getLastMessage).toBe('function');

      // Learning selectors
      expect(typeof useLearningStore.getState().getTrackById).toBe('function');
      expect(typeof useLearningStore.getState().getProgressByTrack).toBe('function');
      expect(typeof useLearningStore.getState().getCompletedTracks).toBe('function');
      expect(typeof useLearningStore.getState().getInProgressTracks).toBe('function');

      // User selectors
      expect(typeof useUserStore.getState().getPreference).toBe('function');
      expect(typeof useUserStore.getState().hasAchievement).toBe('function');
      expect(typeof useUserStore.getState().getLevel).toBe('function');
      expect(typeof useUserStore.getState().getExperience).toBe('function');
    });
  });
});