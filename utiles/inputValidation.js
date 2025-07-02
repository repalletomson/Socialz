// Input validation utility with security features
export const ValidationRules = {
  // Email validation
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
    maxLength: 254
  },

  // Password validation
  password: {
    minLength: 8,
    maxLength: 128,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must be 8+ characters with uppercase, lowercase, number, and special character'
  },

  // Name validation
  name: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/,
    message: 'Name can only contain letters, spaces, hyphens, and apostrophes'
  },

  // Username validation
  username: {
    minLength: 3,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9_]+$/,
    message: 'Username can only contain letters, numbers, and underscores'
  },

  // Post content validation
  postContent: {
    minLength: 1,
    maxLength: 2000,
    message: 'Post content must be between 1 and 2000 characters'
  },

  // Comment validation
  comment: {
    minLength: 1,
    maxLength: 500,
    message: 'Comment must be between 1 and 500 characters'
  },

  // Bio validation
  bio: {
    maxLength: 200,
    message: 'Bio must be less than 200 characters'
  }
};

// Sanitization functions
export const sanitizeInput = {
  // Remove HTML tags and potentially dangerous characters
  html: (input) => {
    if (typeof input !== 'string') return '';
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>&"']/g, '') // Remove dangerous characters
      .trim();
  },

  // Sanitize for database queries
  sql: (input) => {
    if (typeof input !== 'string') return '';
    return input
      .replace(/['";\\]/g, '') // Remove SQL injection characters
      .trim();
  },

  // Basic text sanitization
  text: (input) => {
    if (typeof input !== 'string') return '';
    return input
      .replace(/[^\w\s\-_.@]/g, '') // Keep only alphanumeric, spaces, and safe punctuation
      .trim();
  },

  // Email sanitization
  email: (input) => {
    if (typeof input !== 'string') return '';
    return input.toLowerCase().trim();
  },

  // Username sanitization
  username: (input) => {
    if (typeof input !== 'string') return '';
    return input.toLowerCase().replace(/[^\w]/g, '').trim();
  }
};

// Validation functions
export const validate = {
  // Generic field validation
  field: (value, rules) => {
    const errors = [];
    
    if (!value && rules.required) {
      errors.push('This field is required');
      return { isValid: false, errors };
    }

    if (!value) {
      return { isValid: true, errors: [] }; // Optional field
    }

    // Length validation
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(`Must be at least ${rules.minLength} characters long`);
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(`Must be no more than ${rules.maxLength} characters long`);
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(rules.message || 'Invalid format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Email validation
  email: (email) => {
    const sanitized = sanitizeInput.email(email);
    return validate.field(sanitized, ValidationRules.email);
  },

  // Password validation
  password: (password) => {
    return validate.field(password, ValidationRules.password);
  },

  // Name validation
  name: (name) => {
    const sanitized = sanitizeInput.text(name);
    return validate.field(sanitized, ValidationRules.name);
  },

  // Username validation
  username: (username) => {
    const sanitized = sanitizeInput.username(username);
    return validate.field(sanitized, ValidationRules.username);
  },

  // Post content validation
  postContent: (content) => {
    const sanitized = sanitizeInput.html(content);
    const validation = validate.field(sanitized, ValidationRules.postContent);
    
    // Additional checks for post content
    if (validation.isValid) {
      // Check for spam patterns
      const spamPatterns = [
        /(.)\1{10,}/, // Repeated characters
        /https?:\/\/[^\s]+/gi, // Multiple URLs
      ];

      for (const pattern of spamPatterns) {
        if (pattern.test(sanitized)) {
          validation.errors.push('Content appears to be spam');
          validation.isValid = false;
          break;
        }
      }
    }

    return validation;
  },

  // Comment validation
  comment: (comment) => {
    const sanitized = sanitizeInput.html(comment);
    return validate.field(sanitized, ValidationRules.comment);
  },

  // Bio validation
  bio: (bio) => {
    const sanitized = sanitizeInput.html(bio);
    return validate.field(sanitized, ValidationRules.bio);
  },

  // Form validation helper
  form: (formData, rules) => {
    const results = {};
    let isFormValid = true;

    for (const [fieldName, fieldValue] of Object.entries(formData)) {
      if (rules[fieldName]) {
        const validation = validate.field(fieldValue, rules[fieldName]);
        results[fieldName] = validation;
        if (!validation.isValid) {
          isFormValid = false;
        }
      }
    }

    return {
      isValid: isFormValid,
      fields: results,
      errors: Object.keys(results)
        .filter(key => !results[key].isValid)
        .reduce((acc, key) => {
          acc[key] = results[key].errors;
          return acc;
        }, {})
    };
  }
};

// Security checks
export const securityChecks = {
  // Check for potential XSS
  hasXSS: (input) => {
    if (typeof input !== 'string') return false;
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];
    return xssPatterns.some(pattern => pattern.test(input));
  },

  // Check for SQL injection patterns
  hasSQLInjection: (input) => {
    if (typeof input !== 'string') return false;
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b)/i,
      /(\b(UNION|OR|AND)\b.*\b(SELECT|INSERT|UPDATE|DELETE)\b)/i,
      /(;|\-\-|\/\*|\*\/)/
    ];
    return sqlPatterns.some(pattern => pattern.test(input));
  },

  // Check for excessive length (potential DoS)
  isExcessiveLength: (input, maxLength = 10000) => {
    return typeof input === 'string' && input.length > maxLength;
  }
};

// Validation middleware for forms
export const createFormValidator = (rules) => {
  return (formData) => {
    // First, sanitize all inputs
    const sanitizedData = {};
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string') {
        sanitizedData[key] = sanitizeInput.html(value);
      } else {
        sanitizedData[key] = value;
      }
    }

    // Validate the sanitized data
    return validate.form(sanitizedData, rules);
  };
};

// Real-time validation hook for React components
export const useValidation = (initialRules = {}) => {
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});

  const validateField = (fieldName, value) => {
    if (!initialRules[fieldName]) return true;

    const validation = validate.field(value, initialRules[fieldName]);
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: validation.isValid ? null : validation.errors[0]
    }));

    return validation.isValid;
  };

  const markTouched = (fieldName) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));
  };

  const clearErrors = () => {
    setErrors({});
    setTouched({});
  };

  const hasErrors = Object.values(errors).some(error => error !== null);

  return {
    errors,
    touched,
    validateField,
    markTouched,
    clearErrors,
    hasErrors
  };
};

export default {
  validate,
  sanitizeInput,
  securityChecks,
  ValidationRules,
  createFormValidator,
  useValidation
}; 