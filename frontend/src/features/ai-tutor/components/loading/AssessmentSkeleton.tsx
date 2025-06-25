// Loading skeleton for Assessment Content server component
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function AssessmentSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header skeleton */}
      <div className="text-center mb-8">
        <div className="h-8 bg-muted rounded w-64 mx-auto mb-2 animate-pulse" />
        <div className="h-5 bg-muted rounded w-96 mx-auto mb-1 animate-pulse" />
        <div className="h-5 bg-muted rounded w-80 mx-auto animate-pulse" />
      </div>

      {/* Assessments Grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="border-border">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Title skeleton */}
                  <div className="h-6 bg-muted rounded w-48 mb-2 animate-pulse" />
                  {/* Description skeleton */}
                  <div className="space-y-1">
                    <div className="h-4 bg-muted rounded w-full animate-pulse" />
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                  </div>
                </div>
                <div className="ml-4">
                  {/* Difficulty badge skeleton */}
                  <div className="h-5 bg-muted rounded w-20 animate-pulse" />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {/* Metadata skeleton */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded w-16 animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded w-12 animate-pulse" />
                </div>
              </div>

              {/* Skills section skeleton */}
              <div className="mb-4">
                <div className="h-4 bg-muted rounded w-24 mb-2 animate-pulse" />
                <div className="flex flex-wrap gap-1">
                  <div className="h-5 bg-muted rounded w-16 animate-pulse" />
                  <div className="h-5 bg-muted rounded w-20 animate-pulse" />
                  <div className="h-5 bg-muted rounded w-12 animate-pulse" />
                  <div className="h-5 bg-muted rounded w-14 animate-pulse" />
                </div>
              </div>

              {/* Benefits section skeleton */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded w-32 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <div className="h-3 bg-muted rounded w-full animate-pulse" />
                  <div className="h-3 bg-muted rounded w-5/6 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-4/5 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-full animate-pulse" />
                </div>
              </div>

              {/* Button skeleton */}
              <div className="h-10 bg-muted rounded w-full animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Benefits section skeleton */}
      <div className="mt-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6">
        <div className="h-6 bg-muted rounded w-48 mx-auto mb-4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-2 animate-pulse" />
              <div className="h-4 bg-muted rounded w-24 mx-auto mb-1 animate-pulse" />
              <div className="h-3 bg-muted rounded w-32 mx-auto animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}