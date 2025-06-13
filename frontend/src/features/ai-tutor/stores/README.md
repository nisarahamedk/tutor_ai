# AI Tutor Zustand Stores

This directory contains the Zustand state management stores for the AI Tutor feature. The stores are organized by domain and provide type-safe, performant state management with persistence and development tools.

## Store Architecture

### Store Organization
- **`chatStore.ts`** - Manages chat messages, tabs, and conversation state
- **`learningStore.ts`** - Handles learning tracks, progress, assessments, and flashcards
- **`userStore.ts`** - User profile, preferences, achievements, and authentication
- **`index.ts`** - Barrel exports for all stores and types

### Store Features
- **TypeScript Support** - Full type safety with strict typing
- **Persistence** - LocalStorage persistence for relevant state
- **DevTools** - Redux DevTools integration in development
- **Performance** - Selective subscriptions and optimized selectors
- **Testing** - Comprehensive test coverage and utilities

## Usage Patterns

### Basic Store Usage

```typescript
import { useChatStore } from '@/features/ai-tutor/stores';

function ChatComponent() {
  const { activeTab, tabMessages, addMessage, setActiveTab } = useChatStore();
  
  const handleSendMessage = (content: string) => {
    const message = {
      id: `msg-${Date.now()}`,
      content,
      type: 'user' as const,
      timestamp: new Date().toISOString()
    };
    addMessage(activeTab, message);
  };
  
  return (
    <div>
      {tabMessages[activeTab].map(message => (
        <div key={message.id}>{message.content}</div>
      ))}
    </div>
  );
}
```

### Selective Subscriptions (Recommended)

Use selective subscriptions for better performance:

```typescript
import { useChatSelectors } from '@/features/ai-tutor/stores';

function TabMessages({ tab }: { tab: TabType }) {
  // Only re-renders when messages for this tab change
  const messages = useChatSelectors.useTabMessages(tab);
  const isLoading = useChatSelectors.useIsLoading();
  
  return (
    <div>
      {isLoading && <div>Loading...</div>}
      {messages.map(message => (
        <div key={message.id}>{message.content}</div>
      ))}
    </div>
  );
}
```

### Action Hooks

Use action hooks for cleaner component code:

```typescript
import { useChatActions } from '@/features/ai-tutor/stores';

function MessageInput() {
  const { sendUserMessage, setLoading } = useChatActions();
  const [content, setContent] = useState('');
  
  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setLoading(true);
    const userMessage = sendUserMessage('home', content);
    setContent('');
    
    // Simulate AI response
    setTimeout(() => {
      sendAIMessage('home', 'AI response to: ' + userMessage.content);
      setLoading(false);
    }, 1000);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        value={content} 
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type your message..."
      />
      <button type="submit">Send</button>
    </form>
  );
}
```

## Store APIs

### Chat Store (`useChatStore`)

#### State
- `tabMessages: Record<TabType, Message[]>` - Messages organized by tab
- `activeTab: TabType` - Currently active tab
- `isLoading: boolean` - Loading state for async operations
- `error: string | null` - Error state

#### Actions
- `addMessage(tab, message)` - Add message to specific tab
- `removeMessage(tab, messageId)` - Remove message from tab
- `clearMessages(tab)` - Clear messages (resets to welcome message)
- `setActiveTab(tab)` - Change active tab
- `setLoading(loading)` - Set loading state
- `setError(error)` - Set error state

#### Selectors
- `getTabMessages(tab)` - Get messages for tab
- `hasMessages(tab)` - Check if tab has user messages
- `getMessageCount(tab)` - Get message count for tab
- `getLastMessage(tab)` - Get last message in tab

### Learning Store (`useLearningStore`)

#### State
- `tracks: LearningTrack[]` - Available learning tracks
- `currentTrack: LearningTrack | null` - Currently selected track
- `currentSession: LearningSession | null` - Active learning session
- `progress: Record<string, ProgressData>` - Progress by track ID
- `assessments: SkillAssessment[]` - Available assessments
- `flashcards: Flashcard[]` - Flashcard collection

#### Actions
- `addTrack(track)` - Add new learning track
- `updateTrack(trackId, updates)` - Update track properties
- `setCurrentTrack(track)` - Set active track
- `startSession(trackId)` - Start learning session
- `endSession(score?, notes?)` - End session and save progress
- `updateProgress(trackId, progress)` - Update track progress
- `addFlashcard(flashcard)` - Add new flashcard
- `updateFlashcard(flashcardId, updates)` - Update flashcard

#### Selectors
- `getTrackById(trackId)` - Get track by ID
- `getProgressByTrack(trackId)` - Get progress for track
- `getCompletedTracks()` - Get completed tracks
- `getInProgressTracks()` - Get in-progress tracks
- `getFlashcardsByTrack(trackId)` - Get flashcards for track

### User Store (`useUserStore`)

#### State
- `preferences: UserPreferences` - User preferences and settings
- `profile: UserProfile | null` - User profile information
- `achievements: string[]` - Earned achievements
- `isAuthenticated: boolean` - Authentication status

#### Actions
- `setPreferences(preferences)` - Update user preferences
- `updateProfile(profile)` - Update user profile
- `addAchievement(achievement)` - Add new achievement
- `setAuthenticated(authenticated)` - Set auth status
- `reset()` - Reset all user data

#### Selectors
- `getPreference(key)` - Get specific preference
- `hasAchievement(achievement)` - Check if user has achievement
- `getLevel()` - Get user level
- `getExperience()` - Get user experience points

## Performance Tips

### 1. Use Selective Subscriptions
```typescript
// ❌ Subscribes to entire store
const store = useChatStore();

// ✅ Subscribes only to specific slice
const messages = useChatStore(state => state.tabMessages['home']);
```

### 2. Use Selectors for Computed Values
```typescript
// ❌ Computes in component (re-runs on every render)
const completedCount = tracks.filter(t => t.progress === 100).length;

// ✅ Use store selector (memoized)
const completedTracks = useLearningStore(state => state.getCompletedTracks());
```

### 3. Batch Related Updates
```typescript
// ❌ Multiple store updates
store.setLoading(true);
store.setError(null);
store.addMessage(tab, message);

// ✅ Batch updates when possible
store.setState(state => ({
  isLoading: true,
  error: null,
  tabMessages: {
    ...state.tabMessages,
    [tab]: [...state.tabMessages[tab], message]
  }
}));
```

## Testing

### Store Testing
```typescript
import { useChatStore } from '../stores';

describe('Chat Store', () => {
  beforeEach(() => {
    // Reset store state
    useChatStore.getState().clearMessages('home');
    useChatStore.getState().setActiveTab('home');
  });

  it('should add messages', () => {
    const store = useChatStore.getState();
    const message = { 
      id: 'test', 
      content: 'Hello', 
      type: 'user', 
      timestamp: new Date().toISOString() 
    };
    
    store.addMessage('home', message);
    
    expect(store.getTabMessages('home')).toContain(message);
  });
});
```

### Component Testing with Stores
```typescript
import { render, screen } from '@testing-library/react';
import { useChatStore } from '../stores';
import ChatComponent from './ChatComponent';

it('should display messages', () => {
  // Setup store state
  useChatStore.getState().addMessage('home', {
    id: 'test',
    content: 'Test message',
    type: 'user',
    timestamp: new Date().toISOString()
  });

  render(<ChatComponent />);
  
  expect(screen.getByText('Test message')).toBeInTheDocument();
});
```

## Debugging

### DevTools
The stores are configured with Redux DevTools in development:
1. Install Redux DevTools browser extension
2. Open browser DevTools
3. Navigate to Redux tab
4. Inspect store state and actions

### Action Naming
Actions are named with descriptive identifiers for easier debugging:
- `addMessage/home/msg-123`
- `updateTrack/react-basics`
- `setPreferences`

### Persistence
State is persisted to localStorage with versioned migration:
- Chat messages and active tab
- Learning progress and tracks
- User preferences and profile
- Achievements

## Migration

When updating store schemas, increment the version and add migration:

```typescript
persist(
  storeConfig,
  {
    name: 'store-name',
    version: 2, // Increment version
    migrate: (persistedState: any, version: number) => {
      if (version === 1) {
        // Migrate from v1 to v2
        return {
          ...persistedState,
          newField: defaultValue
        };
      }
      return persistedState;
    }
  }
)
```

## Best Practices

1. **Keep stores focused** - Each store handles a specific domain
2. **Use TypeScript** - Leverage full type safety
3. **Prefer selectors** - Use selective subscriptions for performance
4. **Test thoroughly** - Write comprehensive tests for store logic
5. **Document actions** - Use descriptive action names for debugging
6. **Handle errors** - Include error states and proper error handling
7. **Persist wisely** - Only persist necessary state to localStorage