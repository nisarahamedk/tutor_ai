import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatPage from '../page'; // Adjust import path as necessary

describe('ChatPage', () => {
  it('renders the chat page without errors', () => {
    render(<ChatPage />);
    // Check for a unique element, like the header title
    expect(screen.getByText('AI Tutor Chat')).toBeInTheDocument();
  });

  it('renders the message display area placeholder', () => {
    render(<ChatPage />);
    expect(screen.getByText(/No messages yet. Start typing!/i)).toBeInTheDocument();
  });

  it('renders static example messages', () => {
    render(<ChatPage />);
    expect(screen.getByText('Hello! How can I help you today?')).toBeInTheDocument();
    expect(screen.getByText('I have a question about Next.js.')).toBeInTheDocument();
  });

  it('renders the message input field', () => {
    render(<ChatPage />);
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByLabelText('Chat message input')).toBeInTheDocument();
  });

  it('renders the send button', () => {
    render(<ChatPage />);
    expect(screen.getByRole('button', { name: /Send/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });
});
