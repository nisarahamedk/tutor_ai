// Loading skeleton for Preferences Display server component
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function PreferencesSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header skeleton */}
      <div className="text-center mb-8">
        <div className="h-8 bg-muted rounded w-80 mx-auto mb-2 animate-pulse" />
        <div className="h-5 bg-muted rounded w-96 mx-auto animate-pulse" />
      </div>

      {/* Preferences Overview skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-muted rounded animate-pulse" />
                <div className="h-6 bg-muted rounded w-32 animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-6 bg-muted rounded w-20 mb-2 animate-pulse" />
              <div className="h-4 bg-muted rounded w-full animate-pulse" />
              <div className="h-4 bg-muted rounded w-3/4 mt-1 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommendations skeleton */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted rounded animate-pulse" />
            <div className="h-6 bg-muted rounded w-48 animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index}>
                <div className="h-4 bg-muted rounded w-40 mb-2 animate-pulse" />
                <div className="space-y-1">
                  <div className="h-3 bg-muted rounded w-full animate-pulse" />
                  <div className="h-3 bg-muted rounded w-5/6 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-4/5 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit preferences section skeleton */}
      <div className="border-t pt-6">
        <div className="h-6 bg-muted rounded w-48 mb-4 animate-pulse" />
        <div className="text-center">
          <div className="h-10 bg-muted rounded w-40 mx-auto animate-pulse" />
        </div>
      </div>

      {/* Last updated skeleton */}
      <div className="text-center mt-6">
        <div className="h-3 bg-muted rounded w-48 mx-auto animate-pulse" />
      </div>
    </div>
  );
}