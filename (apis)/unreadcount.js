// unreadcount.js
import { db } from "../config/firebaseConfig";
import { doc, onSnapshot, updateDoc, increment,where, query, collection, serverTimestamp,  a} from "firebase/firestore";

export const monitorNewMessages = (userId) => {
  const messagesQuery = query(
    collection(db, "chats"),
    where("participants", "array-contains", userId)
  );

  return onSnapshot(messagesQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "modified") {
        const chatData = change.doc.data();
        const chatId = change.doc.id;
        const lastMessage = chatData.lastMessage;

        if (lastMessage && lastMessage.sender !== userId && !lastMessage.readBy?.[userId]) {
          const unreadCountRef = doc(db, "unreadCounts", userId, "senders", lastMessage.sender);
          updateDoc(unreadCountRef, {
            count: increment(1),
            lastUpdated: serverTimestamp()
          }, { merge: true });
        }
      }
    });
  });
};

export const listenForUnreadCounts = (userId, callback) => {
  const unreadQuery = query(
    collection(db, "unreadCounts", userId, "senders")
  );

  return onSnapshot(unreadQuery, (snapshot) => {
    const counts = {};
    snapshot.docs.forEach((doc) => {
      counts[doc.id] = doc.data().count;
    });
    callback(counts);
  });
};

export const resetUnreadCount = async (userId, senderId) => {
  const unreadCountRef = doc(db, "unreadCounts", userId, "senders", senderId);
  await updateDoc(unreadCountRef, {
    count: 0,
    lastUpdated: serverTimestamp()
  }, { merge: true });
};

export const markMessageAsRead = async (messageId, chatId, userId) => {
  const messageRef = doc(db, "chats", chatId, "messages", messageId);
  await updateDoc(messageRef, {
    readBy: {
      [userId]: true
    },
    unreadBy: arrayRemove(userId)
  });
};