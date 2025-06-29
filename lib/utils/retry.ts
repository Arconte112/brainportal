import { API } from '@/lib/constants';
import { logger } from '@/lib/logger';

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = API.RETRY_COUNT,
    delay = API.RETRY_DELAY_MS,
    backoff = true,
    onRetry
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        logger.error(`Failed after ${maxAttempts} attempts`, error, 'Retry');
        throw error;
      }

      const retryDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay;
      
      if (onRetry) {
        onRetry(attempt, error);
      }
      
      logger.debug(`Retrying attempt ${attempt + 1} after ${retryDelay}ms`, error, 'Retry');
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  throw lastError;
}