export class Message {
    constructor(text, sender, type = 'text') {
      this.text = text;
      this.sender = sender;
      this.type = type;
      this.timestamp = Date.now();
      this.status = 'sending';
      this.id = Math.random().toString(36).substr(2, 9);
      this.reactions = {};
      this.edited = false;
      this.editHistory = [];
    }

    addReaction(userId, reaction) {
      this.reactions[userId] = reaction;
    }
  
    removeReaction(userId) {
      delete this.reactions[userId];
    }
  
    edit(newText) {
      this.editHistory.push({
        text: this.text,
        timestamp: Date.now()
      });
      this.text = newText;
      this.edited = true;
    }
  }
  