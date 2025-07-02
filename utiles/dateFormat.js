// utils/dateUtils.js

// export const formatMessageTime = (timestamp) => {
//     if (!timestamp?.seconds) return '';
    
//     const date = new Date(timestamp.seconds * 1000);
//     const now = new Date();
    
//     // If message is from today, show time
//     if (date.toDateString() === now.toDateString()) {
//       return date.toLocaleTimeString([], {
//         hour: '2-digit',
//         minute: '2-digit'
//       });
//     }
    
//     // If message is from this week, show day
//     const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
//     if (diffDays < 7) {
//       return date.toLocaleDateString([], {
//         weekday: 'short',
//         hour: '2-digit',
//         minute: '2-digit'
//       });
//     }
    
//     // Otherwise show full date
//     return date.toLocaleDateString([], {
//       month: 'short',
//       day: 'numeric',
//       year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
//     });
//   };

  // ReactionPicker.js

// chatUtils.js
export const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';
  
  const messageDate = new Date(timestamp);
  const now = new Date();
  
  // Same day
  if (messageDate.toDateString() === now.toDateString()) {
    return messageDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  // Within last week
  const daysDiff = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
  if (daysDiff < 7) {
    return messageDate.toLocaleDateString([], {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  
  // Older messages
  return messageDate.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

export const groupMessagesByDate = (messages) => {
  return messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});
};

export const handleError = (error, fallback = null) => {
  console.warn('Chat error:', error);
  return fallback;
};