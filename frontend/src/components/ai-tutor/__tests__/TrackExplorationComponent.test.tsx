import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrackExplorationComponent, LearningTrack } from '../TrackExplorationComponent'; // Named imports

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
  default: (props) => <img {...props} alt={props.alt || ''} />,
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
jest.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...rest }, ref) => <div ref={ref} {...rest}>{children}</div>),
  },
}));

const mockOnTrackSelect = jest.fn();

// Using the structure and some data from the component's internal hardcoded data
const mockTracksData: LearningTrack[] = [
  {
    id: '1',
    title: 'Frontend Development',
    description: 'Master React, TypeScript, and modern web development',
    icon: <svg data-testid="code-icon" />, // Placeholder, actual icon comes from mock
    progress: 0, // Not displayed in this component version but part of interface
    difficulty: 'Beginner',
    duration: '12 weeks',
    skills: ['React', 'TypeScript', 'CSS', 'JavaScript']
  },
  {
    id: '2',
    title: 'UX/UI Design',
    description: 'Learn user experience design and interface creation',
    icon: <svg data-testid="palette-icon" />,
    progress: 0,
    difficulty: 'Beginner',
    duration: '10 weeks',
    skills: ['Figma', 'Design Systems', 'User Research', 'Prototyping']
  }
  // Add more tracks if all are needed for a specific test
];


describe('TrackExplorationComponent', () => {
  beforeEach(() => {
    mockOnTrackSelect.mockClear();
  });

  it('renders the main title and track cards', () => {
    render(<TrackExplorationComponent onTrackSelect={mockOnTrackSelect} />);
    expect(screen.getByText('Choose Your Learning Path')).toBeInTheDocument();

    // Check for the first track from component's internal data
    expect(screen.getByText('Frontend Development')).toBeInTheDocument();
    // Check for the second track from component's internal data
    expect(screen.getByText('UX/UI Design')).toBeInTheDocument();
  });

  it('displays details for each rendered track', () => {
    render(<TrackExplorationComponent onTrackSelect={mockOnTrackSelect} />);

    // Using the component's internal data for assertions
    const componentTracks = [ // Replicating component's internal data for assertion
        { title: 'Frontend Development', description: 'Master React, TypeScript, and modern web development', difficulty: 'Beginner', duration: '12 weeks', skills: ['React', 'TypeScript', 'CSS'] },
        { title: 'UX/UI Design', description: 'Learn user experience design and interface creation', difficulty: 'Beginner', duration: '10 weeks', skills: ['Figma', 'Design Systems', 'User Research'] },
        { title: 'Backend Development', description: 'Build scalable server-side applications', difficulty: 'Intermediate', duration: '14 weeks', skills: ['Node.js', 'APIs', 'Databases'] },
        { title: 'Mobile Development', description: 'Create native and cross-platform mobile apps', difficulty: 'Intermediate', duration: '16 weeks', skills: ['React Native', 'Flutter', 'iOS'] }
    ];

    componentTracks.forEach(track => {
      expect(screen.getByText(track.title)).toBeInTheDocument();
      expect(screen.getByText(track.description)).toBeInTheDocument();
      expect(screen.getAllByText(track.difficulty)[0]).toBeInTheDocument(); // Badge might cause multiple matches if text is reused
      expect(screen.getByText(track.duration)).toBeInTheDocument();
      track.skills.forEach(skill => {
        expect(screen.getByText(skill)).toBeInTheDocument();
      });
    });
    // Check for icons (mocked lucide icons have data-testid)
    expect(screen.getByTestId('code-icon')).toBeInTheDocument();
    expect(screen.getByTestId('palette-icon')).toBeInTheDocument();
    expect(screen.getByTestId('database-icon')).toBeInTheDocument();
    expect(screen.getByTestId('smartphone-icon')).toBeInTheDocument();
  });

  it('calls onTrackSelect with the correct track data when a track card is clicked', () => {
    render(<TrackExplorationComponent onTrackSelect={mockOnTrackSelect} />);

    // Using the component's internal data to find the specific card
    const componentTracks = [ // Replicating component's internal data for assertion
        { id: '1', title: 'Frontend Development', description: 'Master React, TypeScript, and modern web development', icon: expect.anything(), progress: 0, difficulty: 'Beginner', duration: '12 weeks', skills: ['React', 'TypeScript', 'CSS', 'JavaScript'] },
        // ... other tracks if needed for full component data replication
    ];

    const frontendTrackCard = screen.getByText('Frontend Development').closest('div.cursor-pointer');
    expect(frontendTrackCard).toBeInTheDocument();
    if(frontendTrackCard) fireEvent.click(frontendTrackCard);

    expect(mockOnTrackSelect).toHaveBeenCalledTimes(1);
    // The component calls onTrackSelect with its *internal* track object.
    // We check if it's called with an object that has the expected title.
    expect(mockOnTrackSelect).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Frontend Development',
      id: '1'
    }));
  });
});
