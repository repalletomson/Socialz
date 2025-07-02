import * as Sentry from '@sentry/react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import * as Device from 'expo-device';
import * as Application from 'expo-application';

// Error monitoring configuration
const ERROR_MONITORING_CONFIG = {
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://your-sentry-dsn@sentry.io/project-id',
  environment: __DEV__ ? 'development' : 'production',
  enableInExpoDevelopment: false,
  attachScreenshot: true,
  attachViewHierarchy: true,
  maxBreadcrumbs: 50,
  enableAutoSessionTracking: true,
  enableWatchdogTerminationTracking: true,
  enableUserInteractionTracing: true,
};

// Error types for categorization
export const ERROR_CATEGORIES = {
  NETWORK: 'network',
  AUTH: 'authentication', 
  VALIDATION: 'validation',
  PERFORMANCE: 'performance',
  UI: 'user_interface',
  DATABASE: 'database',
  CHAT: 'chat',
  MEDIA: 'media',
  UNKNOWN: 'unknown',
};

// Severity levels
export const SEVERITY_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info', 
  WARNING: 'warning',
  ERROR: 'error',
  FATAL: 'fatal',
};

// Initialize Sentry
export const initializeErrorMonitoring = () => {
  try {
    Sentry.init({
      ...ERROR_MONITORING_CONFIG,
      beforeSend(event, hint) {
        if (event.exception) {
          const exception = event.exception.values?.[0];
          if (exception?.stacktrace?.frames) {
            exception.stacktrace.frames = exception.stacktrace.frames.map(frame => ({
              ...frame,
              filename: frame.filename?.replace(/.*\/node_modules\//, 'node_modules/'),
            }));
          }
        }

        if (__DEV__ && !ERROR_MONITORING_CONFIG.enableInExpoDevelopment) {
          console.warn('Sentry error would be sent in production:', event);
          return null;
        }

        return event;
      },
      integrations: [
        new Sentry.ReactNativeTracing({
          routingInstrumentation: new Sentry.ReactNavigationInstrumentation(),
          enableUserInteractionTracing: true,
          enableStallTracking: true,
        }),
      ],
      tracesSampleRate: __DEV__ ? 0.1 : 0.02,
    });

    console.log('✅ Error monitoring initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize error monitoring:', error);
  }
};

class ErrorMonitoringService {
  constructor() {
    this.isInitialized = false;
    this.userId = null;
    this.userEmail = null;
    this.sessionData = {};
  }

  setUser(userId, email, additionalData = {}) {
    this.userId = userId;
    this.userEmail = email;
    
    Sentry.setUser({
      id: userId,
      email: email,
      ...additionalData,
    });

    console.log('🔍 Error monitoring user context set:', { userId, email });
  }

  clearUser() {
    this.userId = null;
    this.userEmail = null;
    Sentry.setUser(null);
    console.log('🔍 Error monitoring user context cleared');
  }

  setTags(tags) {
    Sentry.setTags(tags);
  }

  setContext(key, data) {
    Sentry.setContext(key, data);
  }

  addBreadcrumb(message, category = 'user', level = 'info', data = {}) {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data: {
        timestamp: new Date().toISOString(),
        ...data,
      },
    });
  }

  logEvent(message, level = SEVERITY_LEVELS.INFO, extra = {}) {
    Sentry.addBreadcrumb({
      message,
      level,
      data: extra,
      timestamp: new Date().getTime() / 1000,
    });

    if (__DEV__) {
      console.log(`📊 Event logged: ${message}`, extra);
    }
  }

  captureError(error, context = {}) {
    const errorId = Sentry.captureException(error, {
      tags: {
        category: context.category || ERROR_CATEGORIES.UNKNOWN,
        severity: context.severity || SEVERITY_LEVELS.ERROR,
      },
      extra: {
        timestamp: new Date().toISOString(),
        ...context,
      },
    });

    if (__DEV__) {
      console.error(`❌ Error captured [${errorId}]:`, error, context);
    }

    return errorId;
  }

  captureCriticalError(error, context = {}) {
    this.addBreadcrumb(
      'Critical error occurred',
      'error',
      SEVERITY_LEVELS.FATAL,
      context
    );

    const errorId = this.captureError(error, {
      ...context,
      severity: SEVERITY_LEVELS.FATAL,
      critical: true,
    });

    if (!__DEV__) {
      Alert.alert(
        'Critical Error',
        'A critical error occurred. Our team has been notified.',
        [{ text: 'OK' }]
      );
    }

    return errorId;
  }

  captureNetworkError(error, requestData = {}) {
    return this.captureError(error, {
      category: ERROR_CATEGORIES.NETWORK,
      severity: SEVERITY_LEVELS.ERROR,
      requestUrl: requestData.url,
      requestMethod: requestData.method,
      statusCode: requestData.statusCode,
      responseTime: requestData.responseTime,
      retryCount: requestData.retryCount,
    });
  }

  captureAuthError(error, authContext = {}) {
    return this.captureError(error, {
      category: ERROR_CATEGORIES.AUTH,
      severity: SEVERITY_LEVELS.ERROR,
      authMethod: authContext.method,
      authStep: authContext.step,
      userExists: authContext.userExists,
    });
  }

  captureValidationError(field, value, error) {
    return this.captureError(new Error(`Validation failed for ${field}: ${error}`), {
      category: ERROR_CATEGORIES.VALIDATION,
      severity: SEVERITY_LEVELS.WARNING,
      field,
      valueLength: value?.length || 0,
      validationRule: error,
    });
  }

  captureComponentError(error, errorInfo, componentName) {
    return this.captureError(error, {
      category: ERROR_CATEGORIES.UI,
      severity: SEVERITY_LEVELS.ERROR,
      componentName,
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  async measurePerformance(name, operation, context = {}) {
    const transaction = Sentry.startTransaction({
      name,
      op: 'function',
      trimEnd: true,
    });
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      transaction.setStatus('ok');
      transaction.setData('duration', duration);
      transaction.setData('context', context);
      
      if (duration > 2000) {
        this.captureError(new Error(`Slow operation: ${name}`), {
          category: ERROR_CATEGORIES.PERFORMANCE,
          duration,
          context,
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      transaction.setStatus('internal_error');
      transaction.setData('error', error.message);
      transaction.setData('duration', duration);
      
      this.captureError(error, {
        category: ERROR_CATEGORIES.PERFORMANCE,
        operationName: name,
        duration,
        ...context,
      });
      
      throw error;
    } finally {
      transaction.finish();
    }
  }
}

// Create singleton instance
export const errorMonitoring = new ErrorMonitoringService();

// Error monitoring hooks for React components
export const useErrorMonitoring = (componentName) => {
  React.useEffect(() => {
    errorMonitoring.addBreadcrumb(
      `Component mounted: ${componentName}`,
      'ui',
      SEVERITY_LEVELS.DEBUG
    );
  }, [componentName]);

  const logError = React.useCallback((error, context = {}) => {
    return errorMonitoring.captureError(error, {
      ...context,
      component: componentName,
    });
  }, [componentName]);

  const logEvent = React.useCallback((message, level = SEVERITY_LEVELS.INFO, data = {}) => {
    return errorMonitoring.logEvent(message, level, {
      ...data,
      component: componentName,
    });
  }, [componentName]);

  return { logError, logEvent };
};

export default errorMonitoring; 