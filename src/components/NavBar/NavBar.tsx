'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import styles from './NavBar.module.css';

const tabs = [
  { path: '/', label: 'Меню', icon: '🏠' },
  { path: '/shop', label: 'Магазин', icon: '🛒' },
  { path: '/inventory', label: 'Карты', icon: '🎒' },
  { path: '/market', label: 'Маркет', icon: '💰' },
  { path: '/quests', label: 'Квесты', icon: '📋' },
  { path: '/pass', label: 'Пасс', icon: '🐷' },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();

  const isAdmin = user?.is_admin === true;

  // Build visible tabs (add admin tab if user is admin)
  const visibleTabs = isAdmin
    ? [...tabs, { path: '/admin', label: 'Админ', icon: '⚙️' }]
    : tabs;

  return (
    <nav className={styles.navbar}>
      <div className={styles.navInner}>
        {visibleTabs.map((tab) => {
          const isActive = pathname === tab.path;
          return (
            <button
              key={tab.path}
              className={`${styles.navItem} ${isActive ? styles.active : ''} ${tab.path === '/admin' ? styles.adminTab : ''}`}
              onClick={() => router.push(tab.path)}
            >
              <span className={styles.navIcon}>{tab.icon}</span>
              <span className={styles.navLabel}>{tab.label}</span>
              {isActive && <div className={styles.activeIndicator} />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
