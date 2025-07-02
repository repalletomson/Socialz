// /**
//  * Generate initials from a full name
//  * @param {string} name - Full name of the user
//  * @returns {string} Initials (max 2 characters)
//  */
export const generateInitials = (name) => {
    if (!name) return '?';
    const initials = name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
    return initials.slice(0, 2);
  };
  
//   /**
//    * Truncate long text with ellipsis
//    * @param {string} text - Original text
//    * @param {number} maxLength - Maximum length before truncation
//    * @returns {string} Truncated text
//    */
  export const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength 
      ? `${text.substring(0, maxLength)}...` 
      : text;
  };
  
//   /**
//    * Format timestamp to human-readable relative time
//    * @param {Date} timestamp - Timestamp to format
//    * @returns {string} Formatted time string
//    */
  export const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} min ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hr ago`;
    }
    
    return timestamp.toLocaleString();
  };