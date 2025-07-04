/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getLearningTracks,
  getUserProgress,
  getSkillAssessments,
  getLearningPreferences,
  CACHE_TAGS,
  revalidateLearningTracks,
  revalidateUserProgress,
  revalidateLearningPreferences,
} from '../queries';

// Mock Next.js cache functions
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

describe('Server Component Data Fetching - Core Functionality', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  
  beforeEach(() => {
    vi.resetAllMocks();
    // Set development environment for mock data
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('Cache Configuration', () => {
    it('should have proper cache tags defined', () => {
      expect(CACHE_TAGS.LEARNING_TRACKS).toBe('learning-tracks');
      expect(CACHE_TAGS.USER_PROGRESS).toBe('user-progress');
      expect(CACHE_TAGS.SKILL_ASSESSMENTS).toBe('skill-assessments');
      expect(CACHE_TAGS.LEARNING_PREFERENCES).toBe('learning-preferences');
    });
  });

  describe('getLearningTracks - Development Mode', () => {
    it('should return mock learning tracks in development', async () => {
      const tracks = await getLearningTracks();
      
      expect(tracks).toBeDefined();
      expect(Array.isArray(tracks)).toBe(true);
      expect(tracks.length).toBeGreaterThan(0);
      
      // Verify track structure
      const firstTrack = tracks[0];
      expect(firstTrack).toHaveProperty('id');
      expect(firstTrack).toHaveProperty('title');
      expect(firstTrack).toHaveProperty('description');
      expect(firstTrack).toHaveProperty('difficulty');
      expect(firstTrack).toHaveProperty('duration');
      expect(firstTrack).toHaveProperty('skills');
      expect(Array.isArray(firstTrack.skills)).toBe(true);
    });

    it('should include expected learning tracks', async () => {
      const tracks = await getLearningTracks();
      const trackTitles = tracks.map(track => track.title);
      
      expect(trackTitles).toContain('Frontend Development');
      expect(trackTitles).toContain('UX/UI Design');
      expect(trackTitles).toContain('Backend Development');
      expect(trackTitles).toContain('Mobile Development');
      expect(trackTitles).toContain('DevOps & Cloud');
      expect(trackTitles).toContain('Data Science');
    });

    it('should have proper difficulty levels', async () => {
      const tracks = await getLearningTracks();
      const difficulties = tracks.map(track => track.difficulty);
      
      expect(difficulties).toContain('Beginner');
      expect(difficulties).toContain('Intermediate');
      expect(difficulties).toContain('Advanced');
    });
  });

  describe('getUserProgress - Development Mode', () => {
    const testUserId = 'user123';

    it('should return mock user progress in development', async () => {
      const progressData = await getUserProgress(testUserId);
      
      expect(progressData).toBeDefined();
      expect(progressData).toHaveProperty('tracks');
      expect(progressData).toHaveProperty('achievements');
      expect(progressData).toHaveProperty('overallStats');
      
      expect(Array.isArray(progressData.tracks)).toBe(true);
      expect(Array.isArray(progressData.achievements)).toBe(true);
    });

    it('should return properly structured track progress', async () => {
      const progressData = await getUserProgress(testUserId);
      
      if (progressData.tracks.length > 0) {
        const firstTrack = progressData.tracks[0];
        expect(firstTrack).toHaveProperty('id');
        expect(firstTrack).toHaveProperty('userId', testUserId);
        expect(firstTrack).toHaveProperty('trackId');
        expect(firstTrack).toHaveProperty('progress');
        expect(firstTrack).toHaveProperty('status');
        expect(['active', 'paused', 'planned', 'completed']).toContain(firstTrack.status);
        expect(firstTrack).toHaveProperty('timeSpent');
        expect(firstTrack).toHaveProperty('nextLesson');
        expect(firstTrack).toHaveProperty('lastUpdated');
      }
    });

    it('should return properly structured achievements', async () => {
      const progressData = await getUserProgress(testUserId);
      
      if (progressData.achievements.length > 0) {
        const firstAchievement = progressData.achievements[0];
        expect(firstAchievement).toHaveProperty('id');
        expect(firstAchievement).toHaveProperty('userId', testUserId);
        expect(firstAchievement).toHaveProperty('text');
        expect(firstAchievement).toHaveProperty('iconType');
        expect(['check', 'star', 'target', 'award']).toContain(firstAchievement.iconType);
        expect(firstAchievement).toHaveProperty('date');
        expect(firstAchievement).toHaveProperty('category');
      }
    });

    it('should return properly structured overall stats', async () => {
      const progressData = await getUserProgress(testUserId);
      
      expect(progressData.overallStats).toHaveProperty('totalTracksStarted');
      expect(progressData.overallStats).toHaveProperty('totalTimeSpent');
      expect(progressData.overallStats).toHaveProperty('completionRate');
      expect(typeof progressData.overallStats.totalTracksStarted).toBe('number');
      expect(typeof progressData.overallStats.totalTimeSpent).toBe('string');
      expect(typeof progressData.overallStats.completionRate).toBe('number');
    });
  });

  describe('getSkillAssessments - Development Mode', () => {
    it('should return mock skill assessments in development', async () => {
      const assessments = await getSkillAssessments();
      
      expect(assessments).toBeDefined();
      expect(Array.isArray(assessments)).toBe(true);
      expect(assessments.length).toBeGreaterThan(0);
    });

    it('should return properly structured assessments', async () => {
      const assessments = await getSkillAssessments();
      
      const firstAssessment = assessments[0];
      expect(firstAssessment).toHaveProperty('id');
      expect(firstAssessment).toHaveProperty('title');
      expect(firstAssessment).toHaveProperty('description');
      expect(firstAssessment).toHaveProperty('estimatedTime');
      expect(firstAssessment).toHaveProperty('difficulty');
      expect(firstAssessment).toHaveProperty('skills');
      expect(Array.isArray(firstAssessment.skills)).toBe(true);
      expect(['Beginner', 'Intermediate', 'Advanced']).toContain(firstAssessment.difficulty);
    });

    it('should return properly structured skills in assessments', async () => {
      const assessments = await getSkillAssessments();
      
      if (assessments.length > 0 && assessments[0].skills.length > 0) {
        const firstSkill = assessments[0].skills[0];
        expect(firstSkill).toHaveProperty('skill');
        expect(firstSkill).toHaveProperty('level');
        expect(typeof firstSkill.skill).toBe('string');
        expect(typeof firstSkill.level).toBe('number');
        expect(firstSkill.level).toBeGreaterThanOrEqual(1);
        expect(firstSkill.level).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('getLearningPreferences - Development Mode', () => {
    const testUserId = 'user123';

    it('should return mock learning preferences in development', async () => {
      const preferences = await getLearningPreferences(testUserId);
      
      expect(preferences).toBeDefined();
      expect(preferences).toHaveProperty('id');
      expect(preferences).toHaveProperty('userId', testUserId);
      expect(preferences).toHaveProperty('timeAvailability');
      expect(preferences).toHaveProperty('learningStyle');
      expect(preferences).toHaveProperty('goals');
      expect(preferences).toHaveProperty('lastUpdated');
    });

    it('should return properly structured preferences', async () => {
      const preferences = await getLearningPreferences(testUserId);
      
      expect(typeof preferences!.timeAvailability).toBe('number');
      expect(preferences!.timeAvailability).toBeGreaterThan(0);
      expect(['visual', 'hands-on', 'reading']).toContain(preferences!.learningStyle);
      expect(Array.isArray(preferences!.goals)).toBe(true);
      expect(preferences!.goals.length).toBeGreaterThan(0);
    });
  });

  describe('Cache Revalidation Functions', () => {
    it('should call revalidateTag for learning tracks', async () => {
      const { revalidateTag } = await import('next/cache');
      
      await revalidateLearningTracks();
      
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.LEARNING_TRACKS);
    });

    it('should call revalidateTag for user progress', async () => {
      const { revalidateTag } = await import('next/cache');
      const testUserId = 'user123';
      
      await revalidateUserProgress(testUserId);
      
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.USER_PROGRESS);
      expect(revalidateTag).toHaveBeenCalledWith(`user-${testUserId}`);
      expect(revalidateTag).toHaveBeenCalledTimes(2);
    });

    it('should call revalidateTag for learning preferences', async () => {
      const { revalidateTag } = await import('next/cache');
      const testUserId = 'user123';
      
      await revalidateLearningPreferences(testUserId);
      
      expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.LEARNING_PREFERENCES);
      expect(revalidateTag).toHaveBeenCalledWith(`user-${testUserId}`);
      expect(revalidateTag).toHaveBeenCalledTimes(2);
    });
  });

  describe('Data Structure Validation', () => {
    it('should maintain consistent data types across all functions', async () => {
      const tracks = await getLearningTracks();
      const progress = await getUserProgress('test-user');
      const assessments = await getSkillAssessments();
      const preferences = await getLearningPreferences('test-user');
      
      // All should return defined values
      expect(tracks).toBeDefined();
      expect(progress).toBeDefined();
      expect(assessments).toBeDefined();
      expect(preferences).toBeDefined();
      
      // Arrays should be arrays
      expect(Array.isArray(tracks)).toBe(true);
      expect(Array.isArray(progress.tracks)).toBe(true);
      expect(Array.isArray(progress.achievements)).toBe(true);
      expect(Array.isArray(assessments)).toBe(true);
      expect(Array.isArray(preferences!.goals)).toBe(true);
      
      // IDs should be strings
      tracks.forEach(track => {
        expect(typeof track.id).toBe('string');
      });
      
      progress.tracks.forEach(track => {
        expect(typeof track.id).toBe('string');
        expect(typeof track.userId).toBe('string');
        expect(typeof track.trackId).toBe('string');
      });
      
      assessments.forEach(assessment => {
        expect(typeof assessment.id).toBe('string');
      });
      
      expect(typeof preferences!.id).toBe('string');
      expect(typeof preferences!.userId).toBe('string');
    });
  });
});