import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import NavBar from '@/components/NavBar/NavBar';
import { UserProvider } from '@/context/UserContext';
import TelegramInit from '@/components/TelegramInit/TelegramInit';

export const metadata: Metadata = {
  title: 'HEINI CARDS — Коллекционная карточная игра',
  description: 'Собирай карты, открывай паки, торгуй на маркете. Telegram Mini App.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        {/* Telegram Mini App SDK */}
        <Script
          src="https://telegram.org/js/telegram-web-app.js?62"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <div className="page-bg" />
        <UserProvider>
          <TelegramInit />
          {children}
          <NavBar />
        </UserProvider>
      </body>
    </html>
  );
}
