import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Feature-Based Architecture Validation', () => {
  const featureRoot = path.join(process.cwd(), 'src/features/ai-tutor');

  describe('Directory Structure', () => {
    it('should have the correct feature directory structure', () => {
      // Check main feature directory exists
      expect(fs.existsSync(featureRoot)).toBe(true);
      
      // Check required subdirectories exist
      const requiredDirs = [
        'components',
        'components/dashboard',
        'components/learning',
        'hooks',
        'stores'
      ];
      
      requiredDirs.forEach(dir => {
        const dirPath = path.join(featureRoot, dir);
        expect(fs.existsSync(dirPath)).toBe(true);
      });
    });

    it('should have all required component files in correct locations', () => {
      const expectedFiles = [
        'components/AITutorChat.tsx',
        'components/HomePageComponent.tsx',
        'components/dashboard/ProgressDashboardComponent.tsx',
        'components/dashboard/LearningPreferencesComponent.tsx',
        'components/learning/TrackExplorationComponent.tsx',
        'components/learning/SkillAssessmentComponent.tsx',
        'components/learning/FlashcardReviewComponent.tsx',
        'components/learning/InteractiveLessonComponent.tsx'
      ];

      expectedFiles.forEach(file => {
        const filePath = path.join(featureRoot, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should have barrel export files in correct locations', () => {
      const barrelFiles = [
        'index.ts',
        'components/index.ts',
        'hooks/index.ts',
        'stores/index.ts'
      ];

      barrelFiles.forEach(file => {
        const filePath = path.join(featureRoot, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it('should have services file in correct location', () => {
      const servicesFile = path.join(featureRoot, 'services.ts');
      expect(fs.existsSync(servicesFile)).toBe(true);
    });
  });

  describe('File Content Validation', () => {
    it('should have proper barrel exports in main index.ts', () => {
      const indexPath = path.join(featureRoot, 'index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');
      
      expect(content).toContain("export * from './components'");
      expect(content).toContain("export * from './hooks'");
      expect(content).toContain("export * from './stores'");
    });

    it('should have proper component exports in components/index.ts', () => {
      const indexPath = path.join(featureRoot, 'components/index.ts');
      const content = fs.readFileSync(indexPath, 'utf-8');
      
      expect(content).toContain('AITutorChat');
      expect(content).toContain('HomePageComponent');
      expect(content).toContain('TrackExplorationComponent');
      expect(content).toContain('SkillAssessmentComponent');
      expect(content).toContain('FlashcardReviewComponent');
      expect(content).toContain('InteractiveLessonComponent');
      expect(content).toContain('ProgressDashboardComponent');
      expect(content).toContain('LearningPreferencesComponent');
    });

    it('should have valid module exports in empty barrel files', () => {
      const hooksIndex = path.join(featureRoot, 'hooks/index.ts');
      const storesIndex = path.join(featureRoot, 'stores/index.ts');
      
      const hooksContent = fs.readFileSync(hooksIndex, 'utf-8');
      const storesContent = fs.readFileSync(storesIndex, 'utf-8');
      
      // Should have export statement to make them valid modules
      expect(hooksContent).toContain('export');
      expect(storesContent).toContain('export');
    });
  });

  describe('Old Structure Cleanup', () => {
    it('should not have old ai-tutor components in src/components', () => {
      const oldComponentsPath = path.join(process.cwd(), 'src/components/ai-tutor');
      expect(fs.existsSync(oldComponentsPath)).toBe(false);
    });

    it('should have shared components in correct location', () => {
      const sharedPath = path.join(process.cwd(), 'src/components/shared');
      expect(fs.existsSync(sharedPath)).toBe(true);
      
      const loadingSpinnerPath = path.join(sharedPath, 'LoadingSpinner.tsx');
      expect(fs.existsSync(loadingSpinnerPath)).toBe(true);
    });
  });

  describe('App Router Integration', () => {
    it('should have correct App Router page structure', () => {
      const appAiTutorPath = path.join(process.cwd(), 'src/app/ai-tutor');
      expect(fs.existsSync(appAiTutorPath)).toBe(true);
      
      const requiredPages = [
        'page.tsx',
        'chat/page.tsx',
        'progress/page.tsx',
        'tracks/page.tsx',
        'assessment/page.tsx'
      ];
      
      requiredPages.forEach(page => {
        const pagePath = path.join(appAiTutorPath, page);
        expect(fs.existsSync(pagePath)).toBe(true);
      });
    });
  });

  describe('TypeScript Configuration', () => {
    it('should have correct path mappings in tsconfig.json', () => {
      const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
      const content = fs.readFileSync(tsconfigPath, 'utf-8');
      const tsconfig = JSON.parse(content);
      
      expect(tsconfig.compilerOptions.paths).toBeDefined();
      expect(tsconfig.compilerOptions.paths['@/*']).toEqual(['./src/*']);
      expect(tsconfig.compilerOptions.paths['@/features/*']).toEqual(['./src/features/*']);
      expect(tsconfig.compilerOptions.paths['@/ai-tutor/*']).toEqual(['./src/features/ai-tutor/*']);
    });
  });
});