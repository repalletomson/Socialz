import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';

export const useGroupMessages = (chatId) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const messagesRef = collection(db, 'chats', chatId, 'messages');
  
    useEffect(() => {
      const unsubscribe = onSnapshot(
        query(messagesRef, orderBy('timestamp', 'desc')),
        async (snapshot) => {
          try {
            const messagesWithSenderNames = await Promise.all(
              snapshot.docs.map(async (doc) => {
                const messageData = doc.data();
                // Fetch sender details for each message
                const senderDoc = await getDoc(doc(db, 'users', messageData.senderId));
                return {
                  id: doc.id,
                  ...messageData,
                  senderName: senderDoc.data()?.fullName || 'Unknown User'
                };
              })
            );
            setMessages(messagesWithSenderNames);
            setError(null);
          } catch (err) {
            console.error('Error loading messages:', err);
            setError('Failed to load messages');
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          console.error('Messages listener error:', err);
          setError('Error listening to messages');
          setLoading(false);
        }
      );
  
      return () => unsubscribe();
    }, [chatId]);
  
    return { messages, loading, error };
  };