import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { db } from '../config/firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDoc,
  doc
} from 'firebase/firestore';
import { useAuth } from './authContext';

const ChatContext = createContext({});

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);
  const unsubscribeRef = useRef(null);

  const fetchChats = useCallback(async () => {
    if (!user || !user.uid || !isMountedRef.current) {
      setLoading(false);
      return;
    }

    try {
      if (!isMountedRef.current) return;
      
      setLoading(true);
      setError(null);

      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', user.uid),
        orderBy('lastMessageTime', 'desc')
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        if (!isMountedRef.current || !user?.uid) return;

        try {
          const chatData = await Promise.all(
            snapshot.docs.map(async (doc) => {
              if (!isMountedRef.current || !user?.uid) return null;

              const data = doc.data();
              const otherUserId = data.participants.find(
                id => id !== user.uid
              );

              const userDoc = await getDoc(doc(db, 'users', otherUserId));
              const userData = userDoc.data();

              return {
                id: doc.id,
                ...data,
                recipient: userData,
                recipientId: otherUserId
              };
            })
          );

          if (isMountedRef.current) {
            setChats(chatData.filter(Boolean));
            setLoading(false);
          }
        } catch (innerError) {
          console.error('Error processing chat data:', innerError);
          if (isMountedRef.current) {
            setError('Failed to process chat data');
            setLoading(false);
          }
        }
      }, (error) => {
        console.error('Chat listener error:', error);
        if (isMountedRef.current) {
          setError('Failed to load chats');
          setLoading(false);
        }
      });

      unsubscribeRef.current = unsubscribe;
      return unsubscribe;
    } catch (err) {
      console.error('Chat fetch error:', err);
      if (isMountedRef.current) {
        setError('Failed to load chats');
        setLoading(false);
      }
    }
  }, [user?.uid]);

  useEffect(() => {
    isMountedRef.current = true;
    
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (!user?.uid) {
      setChats([]);
      setLoading(false);
      setError(null);
      return;
    }

    fetchChats();

    return () => {
      isMountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user?.uid]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  return (
    <ChatContext.Provider value={{
      chats,
      loading,
      error,
      fetchChats
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => useContext(ChatContext);