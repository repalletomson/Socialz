// A simple, generic event emitter
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return () => this.off(event, listener); // Return an unsubscribe function
  }

  off(event, listener) {
    if (!this.events[event]) {
      return;
    }
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event, payload) {
    if (!this.events[event]) {
      return;
    }
    this.events[event].forEach(listener => listener(payload));
  }
}

export default new EventEmitter(); 