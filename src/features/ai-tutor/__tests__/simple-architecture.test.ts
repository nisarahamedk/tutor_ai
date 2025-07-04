import { describe, it, expect } from 'vitest';

describe('Simple Architecture Validation', () => {
  it('should be able to import components directly', async () => {
    // Test direct imports work
    const AITutorChat = await import('../components/AITutorChat');
    expect(AITutorChat.default).toBeDefined();
    
    const TrackExploration = await import('../components/learning/TrackExplorationComponent');
    expect(TrackExploration.TrackExplorationComponent).toBeDefined();
    
    const ProgressDashboard = await import('../components/dashboard/ProgressDashboardComponent');
    expect(ProgressDashboard.ProgressDashboardComponent).toBeDefined();
  });

  it('should be able to import from barrel exports', async () => {
    const components = await import('../components/index');
    expect(components.AITutorChat).toBeDefined();
    expect(components.TrackExplorationComponent).toBeDefined();
    expect(components.ProgressDashboardComponent).toBeDefined();
  });

  it('should be able to import services', async () => {
    const services = await import('../services');
    expect(services.agUiService).toBeDefined();
    expect(typeof services.agUiService.sendMessageToTutor).toBe('function');
  });

  it('should be able to import main feature barrel', async () => {
    const feature = await import('../index');
    expect(feature).toBeDefined();
    // Since it exports everything, it should be an object
    expect(typeof feature).toBe('object');
  });

  it('should validate component exports are functions/classes', async () => {
    const { AITutorChat } = await import('../components/AITutorChat');
    const { TrackExplorationComponent } = await import('../components/learning/TrackExplorationComponent');
    const { ProgressDashboardComponent } = await import('../components/dashboard/ProgressDashboardComponent');
    
    // These should be React components (functions or classes)
    expect(typeof AITutorChat).toBe('function');
    expect(typeof TrackExplorationComponent).toBe('function');
    expect(typeof ProgressDashboardComponent).toBe('function');
  });

  it('should validate services are properly initialized', async () => {
    const { agUiService } = await import('../services');
    
    // Should have the expected methods
    expect(typeof agUiService.sendMessageToTutor).toBe('function');
    
    // Should be able to call the method (it's a stub)
    const result = await agUiService.sendMessageToTutor('test');
    expect(typeof result).toBe('string');
  });
});