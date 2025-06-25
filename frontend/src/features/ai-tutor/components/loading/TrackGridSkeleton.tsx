// Loading skeleton for TrackGrid server component
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function TrackGridSkeleton() {
  return (
    <div className="space-y-4 max-w-full">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-6 bg-muted rounded w-48 mb-2 animate-pulse" />
        <div className="h-4 bg-muted rounded w-96 animate-pulse" />
      </div>
      
      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                {/* Icon skeleton */}
                <div className="p-2 bg-muted rounded-lg animate-pulse">
                  <div className="w-6 h-6 bg-muted-foreground/20 rounded" />
                </div>
                <div className="flex-1 min-w-0">
                  {/* Title skeleton */}
                  <div className="h-5 bg-muted rounded w-32 mb-2 animate-pulse" />
                  <div className="flex items-center gap-2">
                    {/* Badge skeleton */}
                    <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                    {/* Duration skeleton */}
                    <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Description skeleton */}
              <div className="space-y-2 mb-3">
                <div className="h-4 bg-muted rounded w-full animate-pulse" />
                <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
              </div>
              
              {/* Skills skeleton */}
              <div className="flex gap-2 mb-4">
                <div className="h-5 bg-muted rounded w-12 animate-pulse" />
                <div className="h-5 bg-muted rounded w-16 animate-pulse" />
                <div className="h-5 bg-muted rounded w-14 animate-pulse" />
                <div className="h-5 bg-muted rounded w-10 animate-pulse" />
              </div>

              {/* Button skeleton */}
              <div className="h-8 bg-muted rounded w-full animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}