"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SmoothLoaderProps {
  loading: boolean;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  delay?: number; // Delay before showing loading
  minLoadTime?: number; // Minimum time to show loading
  className?: string;
}

export function SmoothLoader({
  loading,
  children,
  skeleton,
  delay = 150,
  minLoadTime = 300,
  className
}: SmoothLoaderProps) {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  useEffect(() => {
    let delayTimer: NodeJS.Timeout;
    let minTimeTimer: NodeJS.Timeout;

    if (loading) {
      // Start timing
      setLoadingStartTime(Date.now());
      
      // Show skeleton after delay
      delayTimer = setTimeout(() => {
        setShowSkeleton(true);
        setIsTransitioning(true);
      }, delay);
    } else {
      // Loading finished
      const currentTime = Date.now();
      const loadDuration = loadingStartTime ? currentTime - loadingStartTime : 0;
      
      if (showSkeleton && loadDuration < minLoadTime) {
        // Wait for minimum load time
        const remainingTime = minLoadTime - loadDuration;
        minTimeTimer = setTimeout(() => {
          setShowSkeleton(false);
          setIsTransitioning(false);
          setLoadingStartTime(null);
        }, remainingTime);
      } else {
        // Hide immediately
        setShowSkeleton(false);
        setIsTransitioning(false);
        setLoadingStartTime(null);
      }
    }

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
      if (minTimeTimer) clearTimeout(minTimeTimer);
    };
  }, [loading, delay, minLoadTime, showSkeleton, loadingStartTime]);

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "transition-opacity duration-200",
          showSkeleton || isTransitioning ? "opacity-0" : "opacity-100"
        )}
      >
        {children}
      </div>
      
      {(showSkeleton || isTransitioning) && (
        <div
          className={cn(
            "absolute inset-0 transition-opacity duration-200",
            showSkeleton ? "opacity-100" : "opacity-0"
          )}
        >
          {skeleton}
        </div>
      )}
    </div>
  );
}