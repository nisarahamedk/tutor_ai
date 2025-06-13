import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore, useLearningStore, useUserStore } from '../stores';
import type { Message, LearningTrack, UserPreferences } from '../types';

// Store testing utilities
const createMockMessage = (content: string, type: 'user' | 'ai' = 'user'): Message => ({
  id: `test-${Date.now()}-${Math.random()}`,
  content,
  type,
  timestamp: new Date().toISOString()
});

const createMockTrack = (id: string, title: string): LearningTrack => ({
  id,
  title,
  description: `Test description for ${title}`,
  progress: 0,
  difficulty: 'Beginner',
  estimatedHours: 5,
  skills: ['test-skill']
});

describe('Zustand Stores', () => {
  beforeEach(() => {
    // Reset all stores before each test
    useChatStore.getState().clearMessages('home');
    useChatStore.getState().clearMessages('progress');
    useChatStore.getState().clearMessages('review');
    useChatStore.getState().clearMessages('explore');
    useChatStore.getState().setActiveTab('home');
    useChatStore.getState().setLoading(false);
    useChatStore.getState().setError(null);

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

    useUserStore.getState().reset();
  });

  describe('Chat Store', () => {
    it('should initialize with default state', () => {
      const state = useChatStore.getState();
      
      expect(state.activeTab).toBe('home');
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
      
      // Should have initial welcome messages for each tab
      expect(state.tabMessages.home).toHaveLength(1);
      expect(state.tabMessages.progress).toHaveLength(1);
      expect(state.tabMessages.review).toHaveLength(1);
      expect(state.tabMessages.explore).toHaveLength(1);
    });

    it('should add messages to specific tabs', () => {
      const store = useChatStore.getState();
      const message = createMockMessage('Test message');
      
      store.addMessage('home', message);
      
      const homeMessages = store.getTabMessages('home');
      expect(homeMessages).toContain(message);
      expect(homeMessages).toHaveLength(2); // Welcome + new message
    });

    it('should remove messages from specific tabs', () => {
      const store = useChatStore.getState();
      const message = createMockMessage('Test message');
      
      store.addMessage('home', message);
      store.removeMessage('home', message.id);
      
      const homeMessages = store.getTabMessages('home');
      expect(homeMessages).not.toContain(message);
    });

    it('should clear messages and reset to welcome message', () => {
      const store = useChatStore.getState();
      const message = createMockMessage('Test message');
      
      store.addMessage('home', message);
      expect(store.getTabMessages('home')).toHaveLength(2);
      
      store.clearMessages('home');
      const messages = store.getTabMessages('home');
      expect(messages).toHaveLength(1);
      expect(messages[0].metadata?.isWelcome).toBe(true);
    });

    it('should set active tab', () => {
      const store = useChatStore.getState();
      
      store.setActiveTab('progress');
      
      // Get fresh state after update
      const updatedState = useChatStore.getState();
      expect(updatedState.activeTab).toBe('progress');
    });

    it('should handle loading state', () => {
      const store = useChatStore.getState();
      
      store.setLoading(true);
      expect(store.isLoading).toBe(true);
      
      store.setLoading(false);
      expect(store.isLoading).toBe(false);
    });

    it('should handle error state', () => {
      const store = useChatStore.getState();
      
      store.setError('Test error');
      expect(store.error).toBe('Test error');
      
      store.setError(null);
      expect(store.error).toBe(null);
    });

    it('should correctly identify tabs with user messages', () => {
      const store = useChatStore.getState();
      
      // Initially should not have user messages (only welcome)
      expect(store.hasMessages('home')).toBe(false);
      
      // Add user message
      store.addMessage('home', createMockMessage('User message', 'user'));
      expect(store.hasMessages('home')).toBe(true);
    });

    it('should get correct message count', () => {
      const store = useChatStore.getState();
      
      expect(store.getMessageCount('home')).toBe(1); // Welcome message
      
      store.addMessage('home', createMockMessage('Test'));
      expect(store.getMessageCount('home')).toBe(2);
    });

    it('should get last message', () => {
      const store = useChatStore.getState();
      const message = createMockMessage('Latest message');
      
      store.addMessage('home', message);
      
      const lastMessage = store.getLastMessage('home');
      expect(lastMessage).toEqual(message);
    });
  });

  describe('Learning Store', () => {
    it('should initialize with empty state', () => {
      const state = useLearningStore.getState();
      
      expect(state.tracks).toEqual([]);
      expect(state.currentTrack).toBe(null);
      expect(state.currentSession).toBe(null);
      expect(state.progress).toEqual({});
      expect(state.assessments).toEqual([]);
      expect(state.flashcards).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(null);
    });

    it('should add and manage tracks', () => {
      const store = useLearningStore.getState();
      const track = createMockTrack('test-track', 'Test Track');
      
      store.addTrack(track);
      
      expect(store.tracks).toContain(track);
      expect(store.getTrackById('test-track')).toEqual(track);
    });

    it('should update track progress', () => {
      const store = useLearningStore.getState();
      const track = createMockTrack('test-track', 'Test Track');
      
      store.addTrack(track);
      store.updateTrack('test-track', { progress: 50 });
      
      const updatedTrack = store.getTrackById('test-track');
      expect(updatedTrack?.progress).toBe(50);
    });

    it('should set current track', () => {
      const store = useLearningStore.getState();
      const track = createMockTrack('test-track', 'Test Track');
      
      store.setCurrentTrack(track);
      expect(store.currentTrack).toEqual(track);
    });

    it('should start and end learning sessions', () => {
      const store = useLearningStore.getState();
      const track = createMockTrack('test-track', 'Test Track');
      
      store.addTrack(track);
      store.startSession('test-track');
      
      expect(store.currentSession).toBeDefined();
      expect(store.currentSession?.trackId).toBe('test-track');
      
      store.endSession(85, 'Great session!');
      
      expect(store.currentSession).toBe(null);
      expect(store.progress['test-track']).toBeDefined();
    });

    it('should update progress data', () => {
      const store = useLearningStore.getState();
      
      store.updateProgress('test-track', {
        trackId: 'test-track',
        lessonId: 'lesson-1',
        completion: 75,
        timeSpent: 3600,
        lastAccessed: new Date().toISOString()
      });
      
      const progress = store.getProgressByTrack('test-track');
      expect(progress?.completion).toBe(75);
      expect(progress?.timeSpent).toBe(3600);
    });

    it('should filter tracks by completion status', () => {
      const store = useLearningStore.getState();
      
      const completedTrack = createMockTrack('completed', 'Completed Track');
      completedTrack.progress = 100;
      
      const inProgressTrack = createMockTrack('in-progress', 'In Progress Track');
      inProgressTrack.progress = 50;
      
      const notStartedTrack = createMockTrack('not-started', 'Not Started Track');
      notStartedTrack.progress = 0;
      
      store.setTracks([completedTrack, inProgressTrack, notStartedTrack]);
      
      expect(store.getCompletedTracks()).toHaveLength(1);
      expect(store.getInProgressTracks()).toHaveLength(1);
    });

    it('should manage flashcards', () => {
      const store = useLearningStore.getState();
      
      const flashcard = {
        id: 'test-flashcard',
        question: 'Test question?',
        answer: 'Test answer',
        track: 'test-track',
        difficulty: 'Easy' as const,
        reviewCount: 0,
        successRate: 0
      };
      
      store.addFlashcard(flashcard);
      
      expect(store.flashcards).toContain(flashcard);
      expect(store.getFlashcardsByTrack('test-track')).toContain(flashcard);
    });
  });

  describe('User Store', () => {
    it('should initialize with default preferences', () => {
      const state = useUserStore.getState();
      
      expect(state.preferences.theme).toBe('system');
      expect(state.preferences.language).toBe('en');
      expect(state.preferences.notifications).toBe(true);
      expect(state.preferences.learningStyle).toBe('visual');
      expect(state.preferences.autoSave).toBe(true);
      expect(state.preferences.soundEnabled).toBe(true);
      expect(state.profile).toBe(null);
      expect(state.achievements).toEqual([]);
      expect(state.isAuthenticated).toBe(false);
    });

    it('should update preferences', () => {
      const store = useUserStore.getState();
      
      store.setPreferences({ theme: 'dark', notifications: false });
      
      expect(store.preferences.theme).toBe('dark');
      expect(store.preferences.notifications).toBe(false);
      // Other preferences should remain unchanged
      expect(store.preferences.language).toBe('en');
    });

    it('should manage user profile', () => {
      const store = useUserStore.getState();
      
      store.updateProfile({
        name: 'John Doe',
        email: 'john@example.com'
      });
      
      expect(store.profile?.name).toBe('John Doe');
      expect(store.profile?.email).toBe('john@example.com');
      expect(store.profile?.level).toBe(1);
      expect(store.profile?.experience).toBe(0);
    });

    it('should manage achievements', () => {
      const store = useUserStore.getState();
      
      store.addAchievement('first-lesson');
      store.addAchievement('level-5');
      
      expect(store.achievements).toContain('first-lesson');
      expect(store.achievements).toContain('level-5');
      expect(store.hasAchievement('first-lesson')).toBe(true);
      expect(store.hasAchievement('non-existent')).toBe(false);
    });

    it('should not duplicate achievements', () => {
      const store = useUserStore.getState();
      
      store.addAchievement('test-achievement');
      store.addAchievement('test-achievement'); // Add same achievement again
      
      expect(store.achievements.filter(a => a === 'test-achievement')).toHaveLength(1);
    });

    it('should handle authentication state', () => {
      const store = useUserStore.getState();
      
      store.setAuthenticated(true);
      expect(store.isAuthenticated).toBe(true);
      
      store.setAuthenticated(false);
      expect(store.isAuthenticated).toBe(false);
    });

    it('should reset user state', () => {
      const store = useUserStore.getState();
      
      // Set some state
      store.setPreferences({ theme: 'dark' });
      store.updateProfile({ name: 'Test User' });
      store.addAchievement('test');
      store.setAuthenticated(true);
      
      // Reset
      store.reset();
      
      expect(store.preferences.theme).toBe('system');
      expect(store.profile).toBe(null);
      expect(store.achievements).toEqual([]);
      expect(store.isAuthenticated).toBe(false);
    });

    it('should get specific preferences', () => {
      const store = useUserStore.getState();
      
      expect(store.getPreference('theme')).toBe('system');
      expect(store.getPreference('notifications')).toBe(true);
    });

    it('should get user level and experience', () => {
      const store = useUserStore.getState();
      
      expect(store.getLevel()).toBe(1);
      expect(store.getExperience()).toBe(0);
      
      store.updateProfile({ level: 5, experience: 450 });
      
      expect(store.getLevel()).toBe(5);
      expect(store.getExperience()).toBe(450);
    });
  });

  describe('Store Integration', () => {
    it('should work together for complete user workflow', () => {
      const chatStore = useChatStore.getState();
      const learningStore = useLearningStore.getState();
      const userStore = useUserStore.getState();
      
      // User starts learning
      userStore.updateProfile({ name: 'Test User', email: 'test@example.com' });
      userStore.setAuthenticated(true);
      
      // Add a track and start session
      const track = createMockTrack('integration-track', 'Integration Track');
      learningStore.addTrack(track);
      learningStore.setCurrentTrack(track);
      learningStore.startSession('integration-track');
      
      // User chats about the track
      chatStore.setActiveTab('explore');
      chatStore.addMessage('explore', createMockMessage('Tell me about this track', 'user'));
      chatStore.addMessage('explore', createMockMessage('This track covers...', 'ai'));
      
      // Complete session and add achievement
      learningStore.endSession(95, 'Excellent work!');
      userStore.addAchievement('first-lesson');
      
      // Verify integrated state
      expect(userStore.isAuthenticated).toBe(true);
      expect(userStore.hasAchievement('first-lesson')).toBe(true);
      expect(learningStore.getProgressByTrack('integration-track')).toBeDefined();
      expect(chatStore.getMessageCount('explore')).toBeGreaterThan(1);
      expect(learningStore.currentSession).toBe(null);
    });
  });
});