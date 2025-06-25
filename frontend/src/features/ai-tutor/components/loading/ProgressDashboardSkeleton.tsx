// Loading skeleton for Progress Dashboard server component
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function ProgressDashboardSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 overflow-hidden">
      {/* Header skeleton */}
      <div className="text-center mb-4">
        <div className="h-7 bg-muted rounded w-64 mx-auto mb-2 animate-pulse" />
        <div className="h-4 bg-muted rounded w-80 mx-auto animate-pulse" />
      </div>

      {/* Learning Tracks Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card
            key={index}
            className="border-0 shadow-md bg-gradient-to-br from-white to-gray-50 h-full"
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                {/* Track name skeleton */}
                <div className="h-6 bg-muted rounded w-32 animate-pulse" />
                <div className="flex items-center space-x-2">
                  {/* Status indicator skeleton */}
                  <div className="w-3 h-3 rounded-full bg-muted animate-pulse" />
                  {/* Status badge skeleton */}
                  <div className="h-5 bg-muted rounded w-16 animate-pulse" />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0 pb-3">
              <div className="space-y-3">
                {/* Progress section skeleton */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    {/* Progress percentage skeleton */}
                    <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                    {/* Status indicator skeleton */}
                    <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                  </div>
                  {/* Progress bar skeleton */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="h-2 bg-muted rounded-full w-2/3 animate-pulse" />
                  </div>
                </div>

                {/* Time and lesson info skeleton */}
                <div className="space-y-1">
                  <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-36 animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Achievements Section skeleton */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader className="pb-3">
          {/* Achievements title skeleton */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-muted rounded animate-pulse" />
            <div className="h-6 bg-muted rounded w-40 animate-pulse" />
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm"
              >
                {/* Achievement icon skeleton */}
                <div className="w-4 h-4 bg-muted rounded animate-pulse" />
                <div className="flex-1 min-w-0">
                  {/* Achievement text skeleton */}
                  <div className="h-3 bg-muted rounded w-full mb-1 animate-pulse" />
                  {/* Achievement date skeleton */}
                  <div className="h-3 bg-muted rounded w-16 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Button skeleton */}
      <div className="flex justify-center mt-4">
        <div className="h-10 bg-muted rounded w-40 animate-pulse" />
      </div>
    </div>
  );
}