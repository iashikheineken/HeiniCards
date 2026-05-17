'use client';

import { useEffect } from 'react';
import { initTelegramApp, isTelegramEnv } from '@/lib/telegram';

/**
 * Invisible component that initializes Telegram Mini App SDK on mount
 */
export default function TelegramInit() {
  useEffect(() => {
    initTelegramApp();

    if (isTelegramEnv()) {
      console.log('[HeiniCards] Running inside Telegram Mini App');
    } else {
      console.log('[HeiniCards] Running in browser dev mode');
    }
  }, []);

  return null;
}
