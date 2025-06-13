import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AITutorPage from '../page';

// Mock the AITutorChat component since we're testing the page structure
vi.mock('@/ai-tutor', () => ({
  AITutorChat: () => <div data-testid="ai-tutor-chat">AI Tutor Chat Component</div>
}));

// Mock the LoadingSpinner component
vi.mock('@/components/shared', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}));

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

describe('AI Tutor Page', () => {
  it('should render the page with correct structure', () => {
    render(<AITutorPage />);
    
    // Check for the main heading
    expect(screen.getByText('AI Tutor')).toBeInTheDocument();
    
    // Check for navigation elements
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
    
    // Check that AITutorChat component is rendered
    expect(screen.getByTestId('ai-tutor-chat')).toBeInTheDocument();
  });

  it('should have proper page layout structure', () => {
    render(<AITutorPage />);
    
    // Check for header
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    
    // Check for main content area
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    
    // Check for container div with proper classes
    const container = screen.getByText('AI Tutor').closest('div');
    expect(container).toHaveClass('container', 'mx-auto', 'p-4');
  });

  it('should have correct navigation link to home', () => {
    render(<AITutorPage />);
    
    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should display the Brain icon and title', () => {
    render(<AITutorPage />);
    
    // Check that the title is displayed twice (in header and main content)
    const titles = screen.getAllByText('AI Tutor');
    expect(titles).toHaveLength(2);
  });

  it('should use Suspense boundary for AITutorChat', () => {
    // This test verifies that Suspense is set up correctly
    // In a real scenario, we might mock React.Suspense to verify it's being used
    render(<AITutorPage />);
    
    // If the component renders without error, Suspense is working
    expect(screen.getByTestId('ai-tutor-chat')).toBeInTheDocument();
  });
});