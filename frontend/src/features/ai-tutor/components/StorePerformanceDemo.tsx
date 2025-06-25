"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChatStore } from '../stores/chatStore';
import type { TabType } from '../types';

/**
 * TASK-009 Performance Demonstration Component
 * 
 * This component demonstrates the key achievements of TASK-009:
 * 1. Elimination of prop drilling - components access store directly
 * 2. Performance optimization through selective subscriptions
 * 3. Optimistic updates integration
 * 4. Centralized state management
 */
export const StorePerformanceDemo: React.FC = () => {
  const [renderCount, setRenderCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  
  // Increment render count on each render to demonstrate performance
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  // Demo Component 1: Direct store access (no prop drilling)
  const MessageCounter: React.FC<{ tab: TabType }> = ({ tab }) => {
    const messageCount = useChatStore(state => state.getMessageCount(tab));
    const pendingCount = useChatStore(state => state.getPendingCount(tab));
    const failedCount = useChatStore(state => state.getFailedCount(tab));
    
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm capitalize">{tab} Tab</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Total Messages:</span>
            <Badge>{messageCount}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Pending:</span>
            <Badge variant={pendingCount > 0 ? 'destructive' : 'secondary'}>
              {pendingCount}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Failed:</span>
            <Badge variant={failedCount > 0 ? 'destructive' : 'secondary'}>
              {failedCount}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Demo Component 2: Optimistic updates showcase
  const OptimisticDemo: React.FC = () => {
    const sendMessage = useChatStore(state => state.sendMessageWithOptimistic);
    const isTyping = useChatStore(state => state.isTyping);
    const error = useChatStore(state => state.error);
    const activeTab = useChatStore(state => state.activeTab);
    
    const handleSendOptimistic = async () => {
      await sendMessage(activeTab, `Demo message ${Date.now()}`);
    };
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Optimistic Updates Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={handleSendOptimistic}
            disabled={isTyping}
            className="w-full"
          >
            {isTyping ? 'Sending...' : 'Send Optimistic Message'}
          </Button>
          {error && (
            <Badge variant="destructive" className="w-full justify-center">
              Error: {error}
            </Badge>
          )}
        </CardContent>
      </Card>
    );
  };

  // Demo Component 3: Performance metrics
  const PerformanceMetrics: React.FC = () => {
    const allMessages = useChatStore(state => {
      const tabs: TabType[] = ['home', 'progress', 'review', 'explore'];
      return tabs.reduce((total, tab) => total + state.getMessageCount(tab), 0);
    });
    
    const allOptimistic = useChatStore(state => {
      const tabs: TabType[] = ['home', 'progress', 'review', 'explore'];
      return tabs.reduce((total, tab) => total + state.optimisticMessages[tab].length, 0);
    });
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Component Renders:</span>
            <Badge>{renderCount}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Total Messages:</span>
            <Badge>{allMessages}</Badge>
          </div>
          <div className="flex justify-between">
            <span>Optimistic Messages:</span>
            <Badge variant="outline">{allOptimistic}</Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Performance test functions
  const runPerformanceTest = () => {
    setStartTime(performance.now());
    const store = useChatStore.getState();
    
    // Add 100 messages rapidly to test performance
    for (let i = 0; i < 100; i++) {
      store.addMessage('home', {
        id: `perf-test-${i}`,
        content: `Performance test message ${i}`,
        type: 'user',
        timestamp: new Date().toISOString(),
      });
    }
    
    const endTime = performance.now();
    alert(`Added 100 messages in ${(endTime - startTime).toFixed(2)}ms`);
  };

  const testOptimisticPerformance = async () => {
    setStartTime(performance.now());
    const store = useChatStore.getState();
    
    // Test optimistic message performance
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(store.sendMessageWithOptimistic('home', `Optimistic test ${i}`));
    }
    
    await Promise.all(promises);
    const endTime = performance.now();
    alert(`Sent 10 optimistic messages in ${(endTime - startTime).toFixed(2)}ms`);
  };

  const clearAllMessages = () => {
    const store = useChatStore.getState();
    (['home', 'progress', 'review', 'explore'] as TabType[]).forEach(tab => {
      store.clearMessages(tab);
      store.clearOptimisticMessages(tab);
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">TASK-009: Zustand Store Performance Demo</h1>
        <p className="text-gray-600">
          Demonstrates elimination of prop drilling, optimistic updates, and performance optimization
        </p>
      </div>

      {/* Performance Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Tests</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button onClick={runPerformanceTest} variant="outline">
            Test Message Performance
          </Button>
          <Button onClick={testOptimisticPerformance} variant="outline">
            Test Optimistic Performance
          </Button>
          <Button onClick={clearAllMessages} variant="destructive">
            Clear All Messages
          </Button>
        </CardContent>
      </Card>

      {/* Tab Statistics (No Prop Drilling) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['home', 'progress', 'review', 'explore'] as TabType[]).map(tab => (
          <MessageCounter key={tab} tab={tab} />
        ))}
      </div>

      {/* Live Demos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OptimisticDemo />
        <PerformanceMetrics />
      </div>

      {/* Store State Inspector */}
      <Card>
        <CardHeader>
          <CardTitle>Store State Inspector</CardTitle>
        </CardHeader>
        <CardContent>
          <StoreStateInspector />
        </CardContent>
      </Card>
    </div>
  );
};

// Helper component to show store state
const StoreStateInspector: React.FC = () => {
  const activeTab = useChatStore(state => state.activeTab);
  const isLoading = useChatStore(state => state.isLoading);
  const isTyping = useChatStore(state => state.isTyping);
  const error = useChatStore(state => state.error);
  const retryCount = useChatStore(state => state.retryCount);
  
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span>Active Tab:</span>
        <Badge>{activeTab}</Badge>
      </div>
      <div className="flex justify-between">
        <span>Loading:</span>
        <Badge variant={isLoading ? 'destructive' : 'secondary'}>
          {isLoading ? 'Yes' : 'No'}
        </Badge>
      </div>
      <div className="flex justify-between">
        <span>Typing:</span>
        <Badge variant={isTyping ? 'destructive' : 'secondary'}>
          {isTyping ? 'Yes' : 'No'}
        </Badge>
      </div>
      <div className="flex justify-between">
        <span>Error:</span>
        <Badge variant={error ? 'destructive' : 'secondary'}>
          {error || 'None'}
        </Badge>
      </div>
      <div className="flex justify-between">
        <span>Retry Count:</span>
        <Badge>{retryCount}</Badge>
      </div>
    </div>
  );
};

export default StorePerformanceDemo;