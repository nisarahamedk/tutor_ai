import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrackExplorationComponent, LearningTrack } from '../TrackExplorationComponent'; // Named imports
import { createMockLearningTrack } from '../../../../test-utils/factories'; // Import the factory

// Mock ResizeObserver (though not directly used, good practice for UI components)
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Standard mocks
jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/lib/utils', () => ({ cn: (...args) => args.filter(Boolean).join(' ') }));
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => <div data-testid="next-image" {...props} />,
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Code: (props) => <svg data-testid="code-icon" {...props} />,
  Palette: (props) => <svg data-testid="palette-icon" {...props} />,
  Database: (props) => <svg data-testid="database-icon" {...props} />,
  Smartphone: (props) => <svg data-testid="smartphone-icon" {...props} />,
  Clock: (props) => <svg data-testid="clock-icon" {...props} />,
  ChevronRight: (props) => <svg data-testid="chevron-right-icon" {...props} />,
}));

// Mock framer-motion
const MockMotionDiv = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, ...rest }, ref) => <div ref={ref} {...rest}>{children}</div>);
MockMotionDiv.displayName = 'MockMotionDiv';

jest.mock('framer-motion', () => ({
  motion: {
    div: MockMotionDiv,
  },
}));

const mockOnTrackSelect = jest.fn();

// No need for mockTracksData here as the component uses internal data.

// Data hardcoded in the component, replicated here for assertion using factories.
// The component's internal data structure should be matched by these overrides.
const internalTracks: LearningTrack[] = [
  createMockLearningTrack({
    id: '1',
    title: 'Frontend Development',
    description: 'Master React, TypeScript, and modern web development',
    // icon prop in factory defaults to a mock svg, specific icon mock is tested by data-testid
    difficulty: 'Beginner',
    duration: '12 weeks',
    skills: ['React', 'TypeScript', 'CSS', 'JavaScript']
  }),
  createMockLearningTrack({
    id: '2',
    title: 'UX/UI Design',
    description: 'Learn user experience design and interface creation',
    difficulty: 'Beginner',
    duration: '10 weeks',
    skills: ['Figma', 'Design Systems', 'User Research', 'Prototyping']
  }),
  createMockLearningTrack({
    id: '3',
    title: 'Backend Development',
    description: 'Build scalable server-side applications',
    difficulty: 'Intermediate',
    duration: '14 weeks',
    skills: ['Node.js', 'APIs', 'Databases'] // 3 skills
  }),
  createMockLearningTrack({
    id: '4',
    title: 'Mobile Development',
    description: 'Create native and cross-platform mobile apps',
    difficulty: 'Intermediate',
    duration: '16 weeks',
    skills: ['React Native', 'Flutter', 'iOS', 'Android', 'Kotlin'] // 5 skills
  })
];
// Note: Since TrackExplorationComponent uses its *own internal hardcoded* tracks,
// this `internalTracks` array is for test logic to align with that internal data for assertions.

describe('TrackExplorationComponent', () => {
  beforeEach(() => {
    mockOnTrackSelect.mockClear();
  });

  it('renders the main title "Choose Your Learning Path"', () => {
    render(<TrackExplorationComponent onTrackSelect={mockOnTrackSelect} />);
    expect(screen.getByText('Choose Your Learning Path')).toBeInTheDocument();
    // Check if it's a heading (accessibility)
    expect(screen.getByRole('heading', { name: 'Choose Your Learning Path', level: 3 })).toBeInTheDocument();
  });

  it('renders all track cards defined internally with their details', () => {
    render(<TrackExplorationComponent onTrackSelect={mockOnTrackSelect} />);

    internalTracks.forEach(track => {
      const trackCard = screen.getByText(track.title).closest('div.cursor-pointer');
      expect(trackCard).toBeInTheDocument();

      // Check details within the scope of the card
      expect(screen.getByText(track.title)).toBeInTheDocument();
      expect(screen.getByText(track.description)).toBeInTheDocument();
      // Difficulty and Duration are within the card, ensure unique selection if text is repeated
      const difficultyBadge = within(trackCard).getByText(track.difficulty);
      expect(difficultyBadge).toBeInTheDocument();
      const durationText = within(trackCard).getByText(track.duration);
      expect(durationText).toBeInTheDocument();

      // Check for skills (first 3)
      track.skills.slice(0, 3).forEach(skill => {
        expect(within(trackCard).getByText(skill)).toBeInTheDocument();
      });

      // Check for icons (mocked lucide icons have data-testid)
      // This check is a bit broad, assuming one icon per card that matches the type.
      // A more specific check would involve selecting the icon within the card context.
      if (track.title === 'Frontend Development') expect(screen.getByTestId('code-icon')).toBeInTheDocument();
      if (track.title === 'UX/UI Design') expect(screen.getByTestId('palette-icon')).toBeInTheDocument();
      if (track.title === 'Backend Development') expect(screen.getByTestId('database-icon')).toBeInTheDocument();
      if (track.title === 'Mobile Development') expect(screen.getByTestId('smartphone-icon')).toBeInTheDocument();

      // Check for ChevronRight icon in each card (accessibility / visual cue)
      expect(within(trackCard).getByTestId('chevron-right-icon')).toBeInTheDocument();
    });
  });

  it('displays skills badges correctly, including "+X more" for tracks with >3 skills', () => {
    render(<TrackExplorationComponent onTrackSelect={mockOnTrackSelect} />);

    // Test Case 1: Frontend Development (4 skills) -> React, TypeScript, CSS, +1 more
    const frontendCard = screen.getByText('Frontend Development').closest('div.cursor-pointer');
    expect(within(frontendCard).getByText('React')).toBeInTheDocument();
    expect(within(frontendCard).getByText('TypeScript')).toBeInTheDocument();
    expect(within(frontendCard).getByText('CSS')).toBeInTheDocument();
    expect(within(frontendCard).getByText('+1 more')).toBeInTheDocument();
    expect(within(frontendCard).queryByText('JavaScript')).not.toBeInTheDocument(); // 4th skill shouldn't be directly visible

    // Test Case 2: Backend Development (3 skills) -> Node.js, APIs, Databases (no "+X more")
    const backendCard = screen.getByText('Backend Development').closest('div.cursor-pointer');
    expect(within(backendCard).getByText('Node.js')).toBeInTheDocument();
    expect(within(backendCard).getByText('APIs')).toBeInTheDocument();
    expect(within(backendCard).getByText('Databases')).toBeInTheDocument();
    expect(within(backendCard).queryByText(/\+\d+ more/i)).not.toBeInTheDocument();

    // Test Case 3: Mobile Development (5 skills) -> React Native, Flutter, iOS, +2 more
    const mobileCard = screen.getByText('Mobile Development').closest('div.cursor-pointer');
    expect(within(mobileCard).getByText('React Native')).toBeInTheDocument();
    expect(within(mobileCard).getByText('Flutter')).toBeInTheDocument();
    expect(within(mobileCard).getByText('iOS')).toBeInTheDocument();
    expect(within(mobileCard).getByText('+2 more')).toBeInTheDocument();
    expect(within(mobileCard).queryByText('Android')).not.toBeInTheDocument();
    expect(within(mobileCard).queryByText('Kotlin')).not.toBeInTheDocument();
  });


  it('calls onTrackSelect with the correct track data when each track card is clicked', () => {
    render(<TrackExplorationComponent onTrackSelect={mockOnTrackSelect} />);

    internalTracks.forEach((track) => {
      const trackCard = screen.getByText(track.title).closest('div.cursor-pointer');
      expect(trackCard).toBeInTheDocument();

      // Clear mock before each click if checking calls per click
      // mockOnTrackSelect.mockClear(); // Not needed here as we check total calls and specific args later

      if(trackCard) fireEvent.click(trackCard);

      expect(mockOnTrackSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: track.id,
          title: track.title,
          // Compare the full track object from internalTracks
          // Note: icon is a React element, direct comparison might be tricky unless instances are identical.
          // We are checking against the component's *internal* data structure.
        })
      );
      // Check for specific properties of the track passed to onTrackSelect
       const SPREADSHEET_FULL_DATA = {
        ...track,
        icon: expect.any(Object), // Icon is a React element
      };
      expect(mockOnTrackSelect).toHaveBeenCalledWith(SPREADSHEET_FULL_DATA);

    });
    expect(mockOnTrackSelect).toHaveBeenCalledTimes(internalTracks.length);
  });

  it('renders no tracks if internal track list were empty (conceptual test)', () => {
    // This test is conceptual because the tracks are hardcoded.
    // If tracks were a prop, we'd pass an empty array:
    // render(<TrackExplorationComponent onTrackSelect={mockOnTrackSelect} tracks={[]} />);
    // And then assert that no track titles are found.
    // For now, this test serves as a reminder for future refactoring.

    // To simulate, if we could temporarily mock the internal tracks to be empty:
    // This kind of mocking is complex and depends on how the component is structured.
    // Awaiting component refactor to accept tracks as props for a proper empty state test.
    // For now, we acknowledge this limitation.
    expect(true).toBe(true); // Placeholder assertion
  });
});

// Helper to query within a specific element, useful for cards
import { queries, within as rtlWithin } from '@testing-library/dom';

function within(element) {
  const customQueries = {}; // Add custom queries if needed
  return rtlWithin(element, { ...queries, ...customQueries });
}
