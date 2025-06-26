'use client';

import { useState, useEffect, useRef, ReactNode, TouchEvent } from 'react';
import { createPortal } from 'react-dom';

/**
 * Mobile optimization components and hooks
 */

// Hook for detecting mobile devices
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 768;
      
      setIsMobile(isMobileUA || (isTouchDevice && isSmallScreen));
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isMobile;
}

// Hook for handling viewport changes (keyboard)
export function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };

    window.addEventListener('resize', handleResize);
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      }
    };
  }, []);

  return viewportHeight;
}

// Hook for swipe gestures
export function useSwipeGesture(
  elementRef: React.RefObject<HTMLElement | null>,
  onSwipe: (direction: 'left' | 'right' | 'up' | 'down') => void,
  threshold: number = 50
) {
  const startPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startPos.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startPos.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startPos.current.x;
      const deltaY = touch.clientY - startPos.current.y;

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (Math.max(absDeltaX, absDeltaY) < threshold) return;

      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        onSwipe(deltaX > 0 ? 'right' : 'left');
      } else {
        // Vertical swipe
        onSwipe(deltaY > 0 ? 'down' : 'up');
      }

      startPos.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart as unknown as EventListener);
    element.addEventListener('touchend', handleTouchEnd as unknown as EventListener);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart as unknown as EventListener);
      element.removeEventListener('touchend', handleTouchEnd as unknown as EventListener);
    };
  }, [elementRef, onSwipe, threshold]);
}

// Hook for pull-to-refresh
export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  threshold: number = 80
) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef<number>(0);
  const isPulling = useRef<boolean>(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY.current);
      
      if (distance > 0 && window.scrollY === 0) {
        e.preventDefault();
        setPullDistance(Math.min(distance, threshold * 1.5));
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current || isRefreshing) return;

      isPulling.current = false;

      if (pullDistance >= threshold) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }

      setPullDistance(0);
    };

    document.addEventListener('touchstart', handleTouchStart as unknown as EventListener);
    document.addEventListener('touchmove', handleTouchMove as unknown as EventListener, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart as unknown as EventListener);
      document.removeEventListener('touchmove', handleTouchMove as unknown as EventListener);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, threshold, pullDistance, isRefreshing]);

  return { isRefreshing, pullDistance };
}

// Mobile-optimized button with larger touch targets
export function MobileButton({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'large',
  ...props
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'medium' | 'large' | 'xl';
  [key: string]: unknown;
}) {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors touch-manipulation';
  
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground active:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground active:bg-secondary/90',
    ghost: 'text-foreground active:bg-accent',
  };

  const sizeClasses = {
    medium: 'px-4 py-3 text-base min-h-[44px]',
    large: 'px-6 py-4 text-lg min-h-[48px]',
    xl: 'px-8 py-5 text-xl min-h-[56px]',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Bottom sheet component for mobile
export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  useSwipeGesture(sheetRef, (direction) => {
    if (direction === 'down') {
      onClose();
    }
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setDragOffset(0);
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTouchStart = () => {
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const rect = sheetRef.current?.getBoundingClientRect();
    if (rect) {
      const offset = Math.max(0, touch.clientY - rect.top);
      setDragOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (dragOffset > 100) {
      onClose();
    } else {
      setDragOffset(0);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full max-w-md bg-background rounded-t-xl shadow-lg transform transition-transform duration-300 ease-out"
        style={{
          transform: `translateY(${dragOffset}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove as React.TouchEventHandler}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
        
        {/* Header */}
        {title && (
          <div className="px-6 pb-4">
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
        )}
        
        {/* Content */}
        <div className="px-6 pb-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

// Mobile navigation component
export function MobileNavigation({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Navigation */}
      <div className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-background shadow-xl transform transition-transform duration-300 ease-out">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

// Floating Action Button for mobile
export function FloatingActionButton({
  onClick,
  icon,
  className = '',
  position = 'bottom-right',
}: {
  onClick: () => void;
  icon: ReactNode;
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 transform -translate-x-1/2',
  };

  return (
    <button
      onClick={onClick}
      className={`
        fixed ${positionClasses[position]} z-40
        w-14 h-14 bg-primary text-primary-foreground
        rounded-full shadow-lg active:scale-95
        transition-all duration-200 touch-manipulation
        flex items-center justify-center
        ${className}
      `}
    >
      {icon}
    </button>
  );
}

// Touch-friendly input component
export function MobileInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
  ...props
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  [key: string]: unknown;
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full px-4 py-4 text-base bg-background border border-border
          rounded-lg focus:outline-none focus:ring-2 focus:ring-ring
          touch-manipulation min-h-[48px]
          ${className}
        `}
        {...props}
      />
    </div>
  );
}

// Mobile-optimized list component with virtual scrolling
export function MobileList({
  items,
  renderItem,
  keyExtractor,
  className = '',
  itemHeight = 60,
}: {
  items: unknown[];
  renderItem: (item: unknown, index: number) => ReactNode;
  keyExtractor: (item: unknown, index: number) => string;
  className?: string;
  itemHeight?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 5);
      const end = Math.min(
        items.length,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + 5
      );
      
      setVisibleRange({ start, end });
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation

    return () => container.removeEventListener('scroll', handleScroll);
  }, [items.length, itemHeight]);

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-auto touch-manipulation ${className}`}
      style={{ height: '100%' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={keyExtractor(item, visibleRange.start + index)}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mobile-safe modal component
export function MobileModal({
  isOpen,
  onClose,
  children,
  title,
  fullScreen = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  fullScreen?: boolean;
}) {
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalClasses = fullScreen || isMobile
    ? 'fixed inset-0 bg-background'
    : 'fixed inset-4 bg-background rounded-lg shadow-xl max-w-md mx-auto my-auto';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {!fullScreen && !isMobile && (
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
      )}
      
      <div className={modalClasses}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {title && (
            <h2 className="text-lg font-semibold">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg"
          >
            ✕
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}