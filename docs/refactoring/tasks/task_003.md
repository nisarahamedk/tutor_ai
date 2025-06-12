# TASK-003: Create Feature-Based Directory Structure

## Task Overview
**Epic**: Foundation & Setup  
**Story Points**: 2  
**Priority**: High  
**Type**: Setup  
**Assignee**: TBD  
**Status**: 🔴 Not Started  

## Description
Reorganize codebase to feature-based architecture aligned with Next.js 15 best practices. Move away from traditional layer-based organization to improve maintainability, reduce coupling, and enable better team collaboration.

## Business Value
- Improves code discoverability and navigation
- Reduces coupling between features
- Enables parallel development by feature teams
- Aligns with modern Next.js and React patterns
- Makes onboarding easier for new developers
- Supports better code ownership and maintenance

## Current State Analysis

### Current Directory Structure Issues
```
src/
├── app/                    # Next.js App Router (good)
├── components/
│   ├── ui/                # Design system (good)
│   └── ai-tutor/          # All AI tutor components mixed together
├── features/
│   └── ai-tutor/
│       ├── AITutorChat.tsx  # Monolithic component
│       └── services/
│           └── agUiService.ts  # Stub implementation
└── lib/                   # General utilities (good)
```

### Problems with Current Structure
- **Mixed concerns**: All AI tutor components in single directory
- **No clear boundaries**: Hard to understand feature ownership
- **Technical grouping**: Components grouped by type, not feature
- **Scattered logic**: Business logic spread across multiple directories
- **Dependency confusion**: Unclear what depends on what

## Target Architecture

### Modern Feature-Based Structure
```
src/
├── app/                          # Next.js App Router
│   ├── ai-tutor/
│   │   ├── page.tsx             # Main AI tutor page (Server Component)
│   │   ├── chat/
│   │   │   └── page.tsx         # Chat-specific page
│   │   ├── progress/
│   │   │   └── page.tsx         # Progress dashboard page
│   │   ├── assessment/
│   │   │   ├── page.tsx         # Assessment listing
│   │   │   └── [id]/
│   │   │       └── page.tsx     # Individual assessment
│   │   └── tracks/
│   │       ├── page.tsx         # Track exploration
│   │       └── [id]/
│   │           └── page.tsx     # Individual track
│   └── layout.tsx
├── components/
│   ├── ui/                      # shadcn/ui components (shared)
│   └── shared/                  # Cross-feature shared components
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── MessageBubble.tsx
├── features/
│   └── ai-tutor/
│       ├── components/          # Feature-specific components
│       │   ├── chat/
│       │   │   ├── ChatContainer.tsx
│       │   │   ├── MessageList.tsx
│       │   │   ├── MessageInput.tsx
│       │   │   └── TabManager.tsx
│       │   ├── learning/
│       │   │   ├── TrackCard.tsx
│       │   │   ├── LessonProgress.tsx
│       │   │   └── SkillAssessment.tsx
│       │   └── dashboard/
│       │       ├── ProgressChart.tsx
│       │       ├── AchievementsBadge.tsx
│       │       └── RecommendationsList.tsx
│       ├── hooks/              # Custom hooks for AI tutor
│       │   ├── useChatManager.ts
│       │   ├── useLearningProgress.ts
│       │   └── useFlashcardReview.ts
│       ├── stores/             # Zustand stores
│       │   ├── chatStore.ts
│       │   ├── learningStore.ts
│       │   └── index.ts
│       ├── actions.ts          # Server Actions
│       ├── queries.ts          # Server-side data fetching
│       ├── types.ts            # TypeScript types
│       └── utils.ts            # Feature-specific utilities
├── lib/                        # Shared utilities
│   ├── api.ts                 # API client
│   ├── auth.ts                # Authentication
│   ├── utils.ts               # General utilities
│   └── validations.ts         # Shared validation schemas
└── hooks/                     # Shared custom hooks
    ├── useLocalStorage.ts
    ├── useDebounce.ts
    └── useMediaQuery.ts
```

## Acceptance Criteria

### Must Have
- [ ] Create new feature-based directory structure
- [ ] Move existing files to appropriate locations
- [ ] Update all import paths throughout the codebase
- [ ] Setup TypeScript path mappings for clean imports
- [ ] Ensure all existing functionality works after reorganization
- [ ] Update build configuration if needed
- [ ] All tests pass after reorganization

### Nice to Have
- [ ] Add barrel exports (index.ts) for cleaner imports
- [ ] Create README files for each feature directory
- [ ] Setup ESLint rules to enforce architectural boundaries
- [ ] Add dependency visualization tools

## Technical Implementation

### Step-by-Step Migration Plan

#### Phase 1: Create New Directory Structure
```bash
# Create feature-based directories
mkdir -p src/features/ai-tutor/components/chat
mkdir -p src/features/ai-tutor/components/learning
mkdir -p src/features/ai-tutor/components/dashboard
mkdir -p src/features/ai-tutor/hooks
mkdir -p src/features/ai-tutor/stores
mkdir -p src/components/shared
mkdir -p src/app/ai-tutor/chat
mkdir -p src/app/ai-tutor/progress
mkdir -p src/app/ai-tutor/assessment
mkdir -p src/app/ai-tutor/tracks
```

#### Phase 2: Move Existing Files
```bash
# Move AI tutor components to feature directory
mv src/components/ai-tutor/* src/features/ai-tutor/components/

# Organize by subdomain
mv src/features/ai-tutor/components/TrackExplorationComponent.tsx src/features/ai-tutor/components/learning/
mv src/features/ai-tutor/components/ProgressDashboardComponent.tsx src/features/ai-tutor/components/dashboard/
mv src/features/ai-tutor/components/FlashcardReviewComponent.tsx src/features/ai-tutor/components/learning/
mv src/features/ai-tutor/components/SkillAssessmentComponent.tsx src/features/ai-tutor/components/learning/

# Move services to appropriate location
mv src/features/ai-tutor/services/* src/features/ai-tutor/
```

#### Phase 3: Update TypeScript Configuration
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/features/*": ["./src/features/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/types/*": ["./src/types/*"],
      "@/ai-tutor/*": ["./src/features/ai-tutor/*"]
    }
  }
}
```

#### Phase 4: Create Barrel Exports
```typescript
// src/features/ai-tutor/components/index.ts
export { default as AITutorChat } from './AITutorChat';

// Chat components
export { ChatContainer } from './chat/ChatContainer';
export { MessageList } from './chat/MessageList';
export { MessageInput } from './chat/MessageInput';
export { TabManager } from './chat/TabManager';

// Learning components
export { TrackExplorationComponent } from './learning/TrackExplorationComponent';
export { SkillAssessmentComponent } from './learning/SkillAssessmentComponent';
export { FlashcardReviewComponent } from './learning/FlashcardReviewComponent';

// Dashboard components
export { ProgressDashboardComponent } from './dashboard/ProgressDashboardComponent';
```

```typescript
// src/features/ai-tutor/hooks/index.ts
export { useChatManager } from './useChatManager';
export { useLearningProgress } from './useLearningProgress';
export { useFlashcardReview } from './useFlashcardReview';
export { useSkillAssessment } from './useSkillAssessment';
```

```typescript
// src/features/ai-tutor/stores/index.ts
export { useChatStore } from './chatStore';
export { useLearningStore } from './learningStore';
export { useUserStore } from './userStore';
```

```typescript
// src/features/ai-tutor/index.ts
export * from './components';
export * from './hooks';
export * from './stores';
export * from './types';
export * as aiTutorActions from './actions';
export * as aiTutorQueries from './queries';
```

#### Phase 5: Update Import Statements
```typescript
// Before (old imports)
import { AITutorChat } from '@/features/ai-tutor/AITutorChat';
import { TrackExplorationComponent } from '@/components/ai-tutor/TrackExplorationComponent';

// After (new imports with barrel exports)
import { AITutorChat, TrackExplorationComponent } from '@/ai-tutor';
// or
import { AITutorChat } from '@/ai-tutor/components';
import { useChatManager } from '@/ai-tutor/hooks';
import { useChatStore } from '@/ai-tutor/stores';
```

### App Router Page Structure

#### Main AI Tutor Page
```typescript
// src/app/ai-tutor/page.tsx
import { Suspense } from 'react';
import { AITutorChat } from '@/ai-tutor';
import { LoadingSpinner } from '@/components/shared';

export default function AITutorPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">AI Tutor</h1>
      <Suspense fallback={<LoadingSpinner />}>
        <AITutorChat />
      </Suspense>
    </div>
  );
}
```

#### Feature-Specific Pages
```typescript
// src/app/ai-tutor/progress/page.tsx
import { ProgressDashboard } from '@/ai-tutor/components/dashboard';

export default async function ProgressPage() {
  // Server Component - fetch data directly
  const progressData = await fetchUserProgress();
  
  return (
    <div>
      <h1>Learning Progress</h1>
      <ProgressDashboard data={progressData} />
    </div>
  );
}
```

### ESLint Rules for Architecture Enforcement
```json
// .eslintrc.json
{
  "rules": {
    "import/no-restricted-paths": [
      "error",
      {
        "zones": [
          {
            "target": "./src/features/ai-tutor",
            "from": "./src/features",
            "except": ["./ai-tutor"]
          },
          {
            "target": "./src/components/shared",
            "from": "./src/features"
          }
        ]
      }
    ]
  }
}
```

## Files to Create

### Directory Structure
- Create all new directories as outlined in target architecture

### Barrel Export Files
- `src/features/ai-tutor/components/index.ts`
- `src/features/ai-tutor/hooks/index.ts`
- `src/features/ai-tutor/stores/index.ts`
- `src/features/ai-tutor/index.ts`
- `src/components/shared/index.ts`

### Documentation
- `src/features/ai-tutor/README.md`
- `docs/architecture/directory-structure.md`

### Configuration Updates
- Update `tsconfig.json` with new path mappings
- Update `.eslintrc.json` with architectural rules

## Files to Move

### Component Files
```bash
# From src/components/ai-tutor/ to appropriate feature subdirectories
AITutorChat.tsx → src/features/ai-tutor/components/
TrackExplorationComponent.tsx → src/features/ai-tutor/components/learning/
ProgressDashboardComponent.tsx → src/features/ai-tutor/components/dashboard/
FlashcardReviewComponent.tsx → src/features/ai-tutor/components/learning/
SkillAssessmentComponent.tsx → src/features/ai-tutor/components/learning/
InteractiveLessonComponent.tsx → src/features/ai-tutor/components/learning/
LearningPreferencesComponent.tsx → src/features/ai-tutor/components/dashboard/
HomePageComponent.tsx → src/features/ai-tutor/components/
```

### Test Files
```bash
# Move test files to maintain collocation
src/components/ai-tutor/__tests__/* → src/features/ai-tutor/components/__tests__/
```

### Service Files
```bash
# Move service files
src/features/ai-tutor/services/agUiService.ts → src/features/ai-tutor/services.ts
```

## Files to Modify

### Update All Import Statements
- Every file that imports AI tutor components
- All test files with component imports
- Any configuration files referencing old paths

### Update Build Configuration
- `next.config.ts` (if needed)
- `jest.config.js` or `vitest.config.ts`
- Any build scripts or tools

## TDD Process for This Task

### Red Phase (Identify Broken Imports)
1. Move files to new locations
2. Run build and tests to identify all broken imports
3. Document all import errors

### Green Phase (Fix All Imports)
1. Update imports systematically
2. Add TypeScript path mappings
3. Create barrel exports
4. Ensure build passes

### Refactor Phase (Optimize Structure)
1. Add ESLint rules for architecture
2. Optimize import statements
3. Add documentation

## Dependencies
**Blocks**: TASK-004, TASK-005 (Need clean structure for further refactoring)  
**Blocked By**: TASK-002 (Need baseline tests to ensure no functionality breaks)  
**Related**: All subsequent tasks benefit from better organization

## Definition of Done

### Technical Checklist
- [ ] All files moved to appropriate feature directories
- [ ] TypeScript path mappings configured and working
- [ ] All import statements updated
- [ ] Build succeeds without errors
- [ ] All tests pass after reorganization
- [ ] Barrel exports created for clean imports

### Quality Checklist
- [ ] No functionality regressions
- [ ] Import statements are clean and consistent
- [ ] Directory structure is logical and discoverable
- [ ] ESLint rules enforce architectural boundaries
- [ ] Documentation updated

### Team Readiness Checklist
- [ ] Team trained on new directory structure
- [ ] IDE/editor configurations updated
- [ ] Development workflows updated
- [ ] Code review guidelines updated

## Estimated Timeline
- **Planning and Directory Creation**: 2 hours
- **File Movement**: 3 hours
- **Import Updates**: 4 hours
- **TypeScript Configuration**: 2 hours
- **Testing and Validation**: 3 hours

**Total**: ~14 hours (2 story points)

## Success Metrics
- **Build Time**: Should not increase significantly
- **Import Clarity**: Reduced import path complexity
- **Developer Experience**: Easier to find and organize code
- **Maintainability**: Clear feature boundaries
- **Test Stability**: All tests continue to pass

## Risk Mitigation

### High Risk Areas
1. **Mass Import Updates**: Risk of missing imports or creating circular dependencies
2. **Build Configuration**: Path mappings might not work correctly
3. **Test Files**: Tests might break due to path changes

### Mitigation Strategies
1. **Systematic Approach**: Update imports in batches and test frequently
2. **Automated Tools**: Use IDE refactoring tools where possible
3. **Rollback Plan**: Keep git history clean for easy rollback
4. **Validation**: Run full test suite after each major change

## Notes and Considerations
- This task sets the foundation for all future refactoring work
- Clean structure will make subsequent tasks much easier
- Team should be trained on new patterns before starting
- Consider feature flags for gradual rollout if needed

---

**Created**: $(date)  
**Last Updated**: $(date)  
**Next Review**: Upon completion and before starting component decomposition