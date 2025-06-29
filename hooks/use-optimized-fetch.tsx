import { useState, useCallback, useRef, useEffect } from 'react';
import { withRetry } from '@/lib/utils/retry';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';

interface FetchOptions {
  retryCount?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  showErrorToast?: boolean;
}

export function useOptimizedFetch<T = any>(
  fetchFn: () => Promise<T>,
  options: FetchOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    retryCount = 3,
    onSuccess,
    onError,
    showErrorToast = true
  } = options;

  const execute = useCallback(async () => {
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const result = await withRetry(
        fetchFn,
        {
          maxAttempts: retryCount,
          onRetry: (attempt, error) => {
            logger.warn(`Fetch retry attempt ${attempt}`, error, 'OptimizedFetch');
          }
        }
      );

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setData(result);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      const error = err as Error;
      setError(error);
      logger.error('Fetch failed', error, 'OptimizedFetch');

      if (showErrorToast) {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al cargar los datos. Por favor intenta de nuevo.',
          variant: 'destructive',
        });
      }

      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFn, retryCount, onSuccess, onError, showErrorToast, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset: () => {
      setData(null);
      setError(null);
      setLoading(false);
    }
  };
}