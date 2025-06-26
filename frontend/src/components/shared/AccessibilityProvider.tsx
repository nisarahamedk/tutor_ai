'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

/**
 * Accessibility context and provider for WCAG 2.1 AA compliance
 */

export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  focusVisible: boolean;
  keyboardNavigation: boolean;
}

export interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  setFocusToElement: (elementId: string) => void;
  skipToMain: () => void;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 'medium',
  highContrast: false,
  reducedMotion: false,
  screenReader: false,
  focusVisible: true,
  keyboardNavigation: true,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [announcer, setAnnouncer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (error) {
        console.warn('Failed to parse accessibility settings:', error);
      }
    }

    // Detect system preferences
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)'),
    };

    const updateFromSystemPreferences = () => {
      setSettings(prev => ({
        ...prev,
        reducedMotion: mediaQueries.reducedMotion.matches,
        highContrast: prev.highContrast || mediaQueries.highContrast.matches,
      }));
    };

    updateFromSystemPreferences();

    // Listen for changes
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updateFromSystemPreferences);
    });

    // Create screen reader announcer
    const announcerElement = document.createElement('div');
    announcerElement.setAttribute('aria-live', 'polite');
    announcerElement.setAttribute('aria-atomic', 'true');
    announcerElement.setAttribute('aria-hidden', 'false');
    announcerElement.className = 'sr-only';
    announcerElement.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    document.body.appendChild(announcerElement);
    setAnnouncer(announcerElement);

    // Detect screen reader usage
    const isScreenReaderActive = () => {
      // Check for common screen reader indicators
      return (
        window.navigator.userAgent.includes('NVDA') ||
        window.navigator.userAgent.includes('JAWS') ||
        window.speechSynthesis?.getVoices().length > 0 ||
        'speechSynthesis' in window
      );
    };

    if (isScreenReaderActive()) {
      setSettings(prev => ({ ...prev, screenReader: true }));
    }

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updateFromSystemPreferences);
      });
      if (announcerElement.parentNode) {
        announcerElement.parentNode.removeChild(announcerElement);
      }
    };
  }, []);

  useEffect(() => {
    // Apply settings to DOM
    const root = document.documentElement;
    
    // Font size
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${settings.fontSize}`);
    
    // High contrast
    root.classList.toggle('high-contrast', settings.highContrast);
    
    // Reduced motion
    root.classList.toggle('reduce-motion', settings.reducedMotion);
    
    // Focus visible
    root.classList.toggle('focus-visible', settings.focusVisible);
    
    // Keyboard navigation
    root.classList.toggle('keyboard-navigation', settings.keyboardNavigation);

    // Save to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announcer) return;

    announcer.setAttribute('aria-live', priority);
    announcer.textContent = '';
    
    // Small delay to ensure the screen reader picks up the change
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
  };

  const setFocusToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.focus();
      announceToScreenReader(`Focused on ${element.getAttribute('aria-label') || element.textContent || elementId}`);
    }
  };

  const skipToMain = () => {
    const mainContent = document.getElementById('main-content') || document.querySelector('main');
    if (mainContent) {
      mainContent.focus();
      announceToScreenReader('Skipped to main content');
    }
  };

  const contextValue: AccessibilityContextType = {
    settings,
    updateSettings,
    announceToScreenReader,
    setFocusToElement,
    skipToMain,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

/**
 * Skip to main content link component
 */
export function SkipToMainContent() {
  const { skipToMain } = useAccessibility();

  return (
    <button
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 
                 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium
                 transition-all duration-200"
      onClick={skipToMain}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          skipToMain();
        }
      }}
    >
      Skip to main content
    </button>
  );
}

/**
 * Screen reader only text component
 */
export function ScreenReaderOnly({ children }: { children: ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

/**
 * Live region component for announcements
 */
export function LiveRegion({ 
  children, 
  priority = 'polite',
  atomic = true 
}: { 
  children: ReactNode;
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
}) {
  return (
    <div
      aria-live={priority}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  );
}

/**
 * Focus trap component for modals and dialogs
 */
export function FocusTrap({ children, isActive }: { children: ReactNode; isActive: boolean }) {
  useEffect(() => {
    if (!isActive) return;

    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // This would typically close the modal
        // Implementation depends on the specific use case
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isActive]);

  return <>{children}</>;
}

/**
 * Accessible button component with proper ARIA attributes
 */
export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  variant = 'primary',
  size = 'medium',
  className = '',
  ...props
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  [key: string]: unknown;
}) {
  const { announceToScreenReader } = useAccessibility();

  const handleClick = () => {
    if (disabled) return;
    onClick();
    
    if (ariaLabel) {
      announceToScreenReader(`${ariaLabel} activated`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-disabled={disabled}
      className={`
        inline-flex items-center justify-center rounded-md font-medium
        transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50
        disabled:pointer-events-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Accessible form field component
 */
export function AccessibleFormField({
  label,
  children,
  error,
  description,
  required = false,
  className = '',
}: {
  label: string;
  children: ReactNode;
  error?: string;
  description?: string;
  required?: boolean;
  className?: string;
}) {
  const fieldId = `field-${Math.random().toString(36).substr(2, 9)}`;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={fieldId} className="block text-sm font-medium text-foreground">
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {description && (
        <div id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </div>
      )}
      
      <div>
        {React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
          id: fieldId,
          'aria-describedby': [descriptionId, errorId].filter(Boolean).join(' ') || undefined,
          'aria-invalid': error ? 'true' : undefined,
          'aria-required': required,
        } as Record<string, unknown>)}
      </div>
      
      {error && (
        <div
          id={errorId}
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Accessible progress indicator
 */
export function AccessibleProgress({
  value,
  max = 100,
  label,
  className = '',
}: {
  value: number;
  max?: number;
  label: string;
  className?: string;
}) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{percentage}%</span>
      </div>
      
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${percentage}% complete`}
        className="w-full bg-secondary rounded-full h-2 overflow-hidden"
      >
        <div
          className="h-full bg-primary transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Add React import for cloneElement
import React from 'react';