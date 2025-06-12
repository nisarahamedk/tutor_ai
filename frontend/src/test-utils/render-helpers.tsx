import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from 'next-themes'; // Assuming next-themes is used as per common Next.js setups

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  // TASK-001 specifies ThemeProvider. If other global providers are needed, they'd go here.
  // e.g. <SessionProvider session={mockSession}> for NextAuth.js
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      {children}
    </ThemeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
