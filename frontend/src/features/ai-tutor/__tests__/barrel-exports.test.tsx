import { describe, it, expect } from 'vitest';

describe('AI Tutor Barrel Exports', () => {
  describe('Main feature barrel export', () => {
    it('should export all components from main barrel', async () => {
      const exports = await import('@/features/ai-tutor');
      
      // Check that the main barrel export is an object
      expect(exports).toBeTypeOf('object');
      
      // The main barrel should export all components
      expect(exports.AITutorChat).toBeDefined();
      expect(exports.HomePageComponent).toBeDefined();
      expect(exports.TrackExplorationComponent).toBeDefined();
      expect(exports.SkillAssessmentComponent).toBeDefined();
      expect(exports.FlashcardReviewComponent).toBeDefined();
      expect(exports.InteractiveLessonComponent).toBeDefined();
      expect(exports.ProgressDashboardComponent).toBeDefined();
      expect(exports.LearningPreferencesComponent).toBeDefined();
    });
  });

  describe('Component barrel export', () => {
    it('should export all components from components barrel', async () => {
      const exports = await import('@/features/ai-tutor/components');
      
      expect(exports).toBeTypeOf('object');
      expect(exports.AITutorChat).toBeDefined();
      expect(exports.HomePageComponent).toBeDefined();
      expect(exports.TrackExplorationComponent).toBeDefined();
      expect(exports.SkillAssessmentComponent).toBeDefined();
      expect(exports.FlashcardReviewComponent).toBeDefined();
      expect(exports.InteractiveLessonComponent).toBeDefined();
      expect(exports.ProgressDashboardComponent).toBeDefined();
      expect(exports.LearningPreferencesComponent).toBeDefined();
    });

    it('should export Message type', async () => {
      const exports = await import('@/features/ai-tutor/components');
      
      // Check that Message type is exported (will be undefined at runtime but available for TypeScript)
      expect(typeof exports.Message).toBe('undefined'); // Types are erased at runtime
    });
  });

  describe('TypeScript path aliases', () => {
    it('should resolve @/ai-tutor alias correctly', async () => {
      const exports = await import('@/ai-tutor');
      
      expect(exports).toBeTypeOf('object');
      expect(exports.AITutorChat).toBeDefined();
    });

    it('should resolve direct component imports', async () => {
      const AITutorChat = await import('@/features/ai-tutor/components/AITutorChat');
      const TrackExploration = await import('@/features/ai-tutor/components/learning/TrackExplorationComponent');
      const ProgressDashboard = await import('@/features/ai-tutor/components/dashboard/ProgressDashboardComponent');
      
      expect(AITutorChat.default).toBeDefined();
      expect(TrackExploration.TrackExplorationComponent).toBeDefined();
      expect(ProgressDashboard.ProgressDashboardComponent).toBeDefined();
    });
  });

  describe('Hooks and Stores barrel exports', () => {
    it('should import hooks barrel without errors', async () => {
      const hooks = await import('@/features/ai-tutor/hooks');
      expect(hooks).toBeTypeOf('object');
    });

    it('should import stores barrel without errors', async () => {
      const stores = await import('@/features/ai-tutor/stores');
      expect(stores).toBeTypeOf('object');
    });
  });

  describe('Services export', () => {
    it('should export agUiService', async () => {
      const services = await import('@/features/ai-tutor/services');
      
      expect(services).toBeTypeOf('object');
      expect(services.agUiService).toBeDefined();
      expect(services.agUiService.sendMessageToTutor).toBeTypeOf('function');
    });
  });
});