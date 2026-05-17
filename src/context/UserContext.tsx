'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchOrCreateUser, fetchUserInventory, fetchCards } from '@/lib/api';
import { getTelegramUserId } from '@/lib/telegram';
import type { InventoryCard } from '@/lib/api';
import type { Card } from '@/data/cards';
import type { DbUser } from '@/lib/supabase';

interface UserContextType {
  user: DbUser | null;
  inventory: InventoryCard[];
  allCards: Card[];
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  refreshInventory: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  inventory: [],
  allCards: [],
  loading: true,
  error: null,
  refreshUser: async () => {},
  refreshInventory: async () => {},
});

export function useUser() {
  return useContext(UserContext);
}

const DEV_TELEGRAM_ID = parseInt(process.env.NEXT_PUBLIC_DEV_TELEGRAM_ID || '1188955233');

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DbUser | null>(null);
  const [inventory, setInventory] = useState<InventoryCard[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Store the resolved telegram_id so refreshUser always uses the correct one
  const telegramIdRef = useRef<number>(DEV_TELEGRAM_ID);

  const refreshUser = useCallback(async () => {
    try {
      // Always use the stored telegram_id (resolved once on init)
      const userData = await fetchOrCreateUser(telegramIdRef.current);
      if (userData) {
        setUser(userData as DbUser);
      }
    } catch (e) {
      console.error('refreshUser error:', e);
    }
  }, []);

  const refreshInventory = useCallback(async () => {
    if (!user?.id || user.id === 'dev-user') return;
    try {
      const inv = await fetchUserInventory(user.id);
      setInventory(inv);
    } catch (e) {
      console.error('refreshInventory error:', e);
    }
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const cards = await fetchCards();
        setAllCards(cards);

        // Resolve telegram_id ONCE and store it
        const telegramId = getTelegramUserId();
        telegramIdRef.current = telegramId;

        const userData = await fetchOrCreateUser(telegramId);
        if (userData) {
          setUser(userData as DbUser);
          const inv = await fetchUserInventory(userData.id);
          setInventory(inv);
        } else {
          // Fallback dev user
          setUser({
            id: 'dev-user',
            telegram_id: DEV_TELEGRAM_ID,
            username: 'admin',
            display_name: 'Админ',
            balance: 1500,
            xp: 0,
            svino_pass_level: 0,
            is_admin: true,
            created_at: new Date().toISOString(),
            last_daily_reward: null,
          });
          const { playerData } = await import('@/data/player');
          setInventory(
            cards
              .filter(c => playerData.ownedCardIds.includes(c.id))
              .map(c => ({ ...c, userCardId: 'fake', isOnMarket: false }))
          );
        }
      } catch (e) {
        console.error('Init error:', e);
        setError('Ошибка подключения к базе данных');
        const { cards: fakeCards } = await import('@/data/cards');
        const { playerData } = await import('@/data/player');
        setAllCards(fakeCards);
        setInventory(
          fakeCards
            .filter(c => playerData.ownedCardIds.includes(c.id))
            .map(c => ({ ...c, userCardId: 'fake', isOnMarket: false }))
        );
        setUser({
          id: 'dev-user',
          telegram_id: DEV_TELEGRAM_ID,
          username: 'admin',
          display_name: 'Админ',
          balance: 1500,
          xp: 0,
          svino_pass_level: 0,
          is_admin: true,
          created_at: new Date().toISOString(),
          last_daily_reward: null,
        });
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (user?.id && user.id !== 'dev-user') {
      refreshInventory();
    }
  }, [user?.id, refreshInventory]);

  return (
    <UserContext.Provider value={{ user, inventory, allCards, loading, error, refreshUser, refreshInventory }}>
      {children}
    </UserContext.Provider>
  );
}
