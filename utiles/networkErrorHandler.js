import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Network error types
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  TIMEOUT: 'TIMEOUT',
  SERVER: 'SERVER',
  AUTH: 'AUTH',
  VALIDATION: 'VALIDATION',
  UNKNOWN: 'UNKNOWN',
};

// Network status manager
class NetworkErrorHandler {
  constructor() {
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 second
    this.maxDelay = 10000; // 10 seconds
  }

  // Exponential backoff delay calculation
  calculateDelay(attempt) {
    const delay = Math.min(this.baseDelay * Math.pow(2, attempt), this.maxDelay);
    return delay + Math.random() * 1000; // Add jitter
  }

  // Classify error type
  classifyError(error) {
    if (!error) return ERROR_TYPES.UNKNOWN;

    const message = error.message?.toLowerCase() || '';
    const code = error.code || error.status;

    // Network connectivity issues
    if (message.includes('network') || message.includes('connection') || 
        message.includes('fetch') || code === 'NETWORK_ERROR') {
      return ERROR_TYPES.NETWORK;
    }

    // Timeout errors
    if (message.includes('timeout') || code === 'TIMEOUT') {
      return ERROR_TYPES.TIMEOUT;
    }

    // Authentication errors
    if (code === 401 || code === 403 || message.includes('auth')) {
      return ERROR_TYPES.AUTH;
    }

    // Server errors
    if (code >= 500 && code < 600) {
      return ERROR_TYPES.SERVER;
    }

    // Client errors (validation, etc.)
    if (code >= 400 && code < 500) {
      return ERROR_TYPES.VALIDATION;
    }

    return ERROR_TYPES.UNKNOWN;
  }

  // Get user-friendly error message
  getErrorMessage(errorType, originalError) {
    const messages = {
      [ERROR_TYPES.NETWORK]: 'Please check your internet connection and try again.',
      [ERROR_TYPES.TIMEOUT]: 'The request timed out. Please try again.',
      [ERROR_TYPES.SERVER]: 'Server is temporarily unavailable. Please try again later.',
      [ERROR_TYPES.AUTH]: 'Authentication failed. Please log in again.',
      [ERROR_TYPES.VALIDATION]: 'Please check your input and try again.',
      [ERROR_TYPES.UNKNOWN]: 'An unexpected error occurred. Please try again.',
    };

    return messages[errorType] || messages[ERROR_TYPES.UNKNOWN];
  }

  // Log error for analytics
  async logError(error, context = {}) {
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error.toString(),
        stack: error.stack,
        context,
        type: this.classifyError(error),
        retryCount: this.retryAttempts.get(context.operation) || 0,
      };

      await AsyncStorage.setItem(
        `error_log_${Date.now()}`, 
        JSON.stringify(errorLog)
      );

      // TODO: Send to analytics service (Sentry, etc.)
      console.error('Network Error Logged:', errorLog);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  // Handle retry logic
  async handleRetry(operation, operationFn, context = {}) {
    const operationId = operation || 'unknown';
    const currentAttempts = this.retryAttempts.get(operationId) || 0;

    if (currentAttempts >= this.maxRetries) {
      this.retryAttempts.delete(operationId);
      throw new Error(`Max retries (${this.maxRetries}) exceeded for operation: ${operationId}`);
    }

    this.retryAttempts.set(operationId, currentAttempts + 1);

    try {
      const result = await operationFn();
      this.retryAttempts.delete(operationId); // Reset on success
      return result;
    } catch (error) {
      const errorType = this.classifyError(error);
      
      // Log the error
      await this.logError(error, { ...context, operation: operationId });

      // Don't retry authentication errors
      if (errorType === ERROR_TYPES.AUTH) {
        this.retryAttempts.delete(operationId);
        throw error;
      }

      // Calculate delay for next retry
      const delay = this.calculateDelay(currentAttempts);
      
      console.warn(`Operation ${operationId} failed, retrying in ${delay}ms (attempt ${currentAttempts + 1}/${this.maxRetries})`);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Recursive retry
      return this.handleRetry(operation, operationFn, context);
    }
  }

  // Show appropriate error to user
  showErrorToUser(error, context = {}) {
    const errorType = this.classifyError(error);
    const message = this.getErrorMessage(errorType, error);
    
    // Don't show alerts for auth errors (handled by auth system)
    if (errorType === ERROR_TYPES.AUTH) {
      return;
    }

    Alert.alert(
      'Error',
      message,
      [
        { text: 'OK', style: 'default' },
        ...(context.onRetry ? [{ 
          text: 'Retry', 
          onPress: context.onRetry,
          style: 'default' 
        }] : [])
      ]
    );
  }

  // Wrapper for API calls with automatic retry and error handling
  async executeWithRetry(operationName, apiCall, options = {}) {
    const {
      showErrorAlert = true,
      maxRetries = this.maxRetries,
      context = {}
    } = options;

    // Temporarily override max retries if specified
    const originalMaxRetries = this.maxRetries;
    this.maxRetries = maxRetries;

    try {
      return await this.handleRetry(operationName, apiCall, context);
    } catch (error) {
      if (showErrorAlert) {
        this.showErrorToUser(error, {
          ...context,
          onRetry: () => this.executeWithRetry(operationName, apiCall, options)
        });
      }
      throw error;
    } finally {
      // Restore original max retries
      this.maxRetries = originalMaxRetries;
    }
  }

  // Clear all retry counters (useful for app restart)
  clearRetryCounters() {
    this.retryAttempts.clear();
  }
}

// Export singleton instance
export const networkErrorHandler = new NetworkErrorHandler();

// Convenience function for common operations
export const withRetry = (operationName, apiCall, options) => {
  return networkErrorHandler.executeWithRetry(operationName, apiCall, options);
};

// Network request wrapper with timeout
export const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

export default networkErrorHandler; 