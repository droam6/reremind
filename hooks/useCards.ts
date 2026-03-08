import { useState, useEffect, useCallback } from 'react';
import { Card } from '../types/payment';
import { getCards, saveCards } from '../utils/storage';

export function useCards() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCards().then((data) => {
      setCards(data);
      setLoading(false);
    });
  }, []);

  const addCard = useCallback(async (card: Card) => {
    const next = [...cards, card];
    await saveCards(next);
    setCards(next);
  }, [cards]);

  const removeCard = useCallback(async (id: string) => {
    const next = cards.filter((c) => c.id !== id);
    await saveCards(next);
    setCards(next);
  }, [cards]);

  const clearCards = useCallback(async () => {
    await saveCards([]);
    setCards([]);
  }, []);

  return { cards, loading, addCard, removeCard, clearCards };
}
