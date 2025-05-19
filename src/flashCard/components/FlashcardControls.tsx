/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { useState, useEffect } from 'react';
import { flashcards } from '../data/database';

// eslint-disable-next-line react-refresh/only-export-components
export const flashcardEvents = {
  listeners: new Map<string, Function[]>(),

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  },

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  },

  emit(event: string, ...args: unknown[]) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }
};

const FlashcardControls = () => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showingAnswer, setShowingAnswer] = useState(false);

  useEffect(() => {
    const handleFlipComplete = () => {
      console.log('Card flip animation completed');
    };

    const handlePageChange = (isQuestionPage: boolean) => {
      setShowingAnswer(!isQuestionPage);
    };

    flashcardEvents.on('flipComplete', handleFlipComplete);
    flashcardEvents.on('pageChange', handlePageChange);

    return () => {
      flashcardEvents.off('flipComplete', handleFlipComplete);
      flashcardEvents.off('pageChange', handlePageChange);
    };
  }, []);

  const handleKnow = () => {
    flashcardEvents.emit('flipCard');
  };

  const handleDontKnow = () => {
    flashcardEvents.emit('flipCard');
  };

  const handleNext = () => {
    const nextIndex = (currentCardIndex + 1) % flashcards.length;
    setCurrentCardIndex(nextIndex);

    // Flip the card back to the question side
    flashcardEvents.emit('flipCard');

    // Change to the next card
    flashcardEvents.emit('cardChange', nextIndex);
  };

  return (
    <div className="flashcard-controls">
      <div className="card-counter">
        Card {currentCardIndex + 1} of {flashcards.length}
      </div>
      <div className="button-container">
        {!showingAnswer ? (
          <>
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
          </>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="next-btn"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

export default FlashcardControls;
