import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePageComponent from '../HomePageComponent';

// Mock next/navigation - not strictly needed for this version, but good for future
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock the utils dependency - not strictly needed for this version, but good for future
jest.mock('@/lib/utils', () => ({
  cn: (...args) => args.filter(Boolean).join(' '),
}));

// Mock Next.js Image component - not strictly needed for this version
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}));

describe('HomePageComponent', () => {
  // Test 1: Component renders without crashing and shows main div
  it('renders without crashing and contains a div element', () => {
    const { container } = render(<HomePageComponent />);
    // Check if the main div rendered by the component is present
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild.nodeName).toBe('DIV');
  });

  // Test 2: Renders the heading "Home Page"
  it('renders the "Home Page" heading', () => {
    render(<HomePageComponent />);
    // Check for the H1 element with the text "Home Page"
    const headingElement = screen.getByRole('heading', { name: /Home Page/i, level: 1 });
    expect(headingElement).toBeInTheDocument();
  });

  // Test 3: (Placeholder for navigation - currently not applicable)
  // it('handles navigation correctly', () => {
  //   const { push } = require('next/navigation').useRouter();
  //   render(<HomePageComponent />);
  //   // No navigation elements in the current version of the component
  //   expect(true).toBe(true); // Placeholder assertion
  // });
});
