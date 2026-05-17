/**
 * Telegram Mini App SDK helper
 * Provides typed access to Telegram.WebApp with fallbacks for dev mode
 */

// Global type declaration for Telegram WebApp
declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramWebAppUser;
    auth_date?: number;
    hash?: string;
    start_param?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  isClosingConfirmationEnabled: boolean;
  isFullscreen: boolean;
  isActive: boolean;
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableClosingConfirmation: () => void;
  setBottomBarColor: (color: string) => void;
  requestFullscreen: () => void;
  disableVerticalSwipes: () => void;
  enableVerticalSwipes: () => void;
}

/**
 * Get the Telegram WebApp instance, or null if not running inside Telegram
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

/**
 * Check if we're running inside Telegram
 */
export function isTelegramEnv(): boolean {
  return getTelegramWebApp() !== null;
}

/**
 * Get the Telegram user from initData, or null if not in Telegram
 */
export function getTelegramUser(): TelegramWebAppUser | null {
  const webapp = getTelegramWebApp();
  return webapp?.initDataUnsafe?.user || null;
}

/**
 * Get the Telegram user's ID, or fallback dev ID
 */
export function getTelegramUserId(): number {
  const user = getTelegramUser();
  return user?.id || parseInt(process.env.NEXT_PUBLIC_DEV_TELEGRAM_ID || '1188955233');
}

/**
 * Initialize Telegram Mini App (call once on app start)
 */
export function initTelegramApp(): void {
  const webapp = getTelegramWebApp();
  if (!webapp) return;

  // Signal ready
  webapp.ready();
  
  // Expand to full height
  webapp.expand();
  
  // Set dark theme
  try {
    webapp.setHeaderColor('#0a0a0f');
    webapp.setBackgroundColor('#0a0a0f');
    webapp.setBottomBarColor('#0a0a0f');
  } catch (e) {
    // Older versions may not support all methods
  }

  // Disable vertical swipes (so scrolling works inside the app)
  try {
    webapp.disableVerticalSwipes();
  } catch (e) {}
  
  // Enable closing confirmation (prevent accidental close)
  try {
    webapp.enableClosingConfirmation();
  } catch (e) {}
}

/**
 * Haptic feedback helpers
 */
export const haptic = {
  light: () => getTelegramWebApp()?.HapticFeedback?.impactOccurred('light'),
  medium: () => getTelegramWebApp()?.HapticFeedback?.impactOccurred('medium'),
  heavy: () => getTelegramWebApp()?.HapticFeedback?.impactOccurred('heavy'),
  success: () => getTelegramWebApp()?.HapticFeedback?.notificationOccurred('success'),
  error: () => getTelegramWebApp()?.HapticFeedback?.notificationOccurred('error'),
  warning: () => getTelegramWebApp()?.HapticFeedback?.notificationOccurred('warning'),
  selection: () => getTelegramWebApp()?.HapticFeedback?.selectionChanged(),
};
