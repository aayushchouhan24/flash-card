import { useState } from 'react';
import { flashcards } from '../data/database';

// Create a global event system for communication between components
export const flashcardEvents = {
  // Event listeners
  listeners: new Map<string, Function[]>(),
  
  // Add event listener
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  },
  
  // Remove event listener
  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  },
  
  // Emit event
  emit(event: string, ...args: any[]) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }
};

const FlashcardControls = () => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  
  const handleKnow = () => {
    // Move to the next card
    const nextIndex = (currentCardIndex + 1) % flashcards.length;
    setCurrentCardIndex(nextIndex);
    
    // Emit event to update the card in the 3D scene
    flashcardEvents.emit('cardChange', nextIndex);
  };
  
  const handleDontKnow = () => {
    // Move to the next card
    const nextIndex = (currentCardIndex + 1) % flashcards.length;
    setCurrentCardIndex(nextIndex);
    
    // Emit event to update the card in the 3D scene
    flashcardEvents.emit('cardChange', nextIndex);
  };
  
  return (
    <div className="flashcard-controls">
      <div className="card-counter">
        Card {currentCardIndex + 1} of {flashcards.length}
      </div>
      <div className="button-container">
        <button 
          type="button"
          onClick={handleDontKnow}
          className="dont-know-btn"
        >
          Don't Know
        </button>
        <button 
          type="button"
          onClick={handleKnow}
          className="know-btn"
        >
          Know
        </button>
      </div>
    </div>
  );
};

export default FlashcardControls;
