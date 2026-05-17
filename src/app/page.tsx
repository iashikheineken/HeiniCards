'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/components/Toast/Toast';
import { haptic } from '@/lib/telegram';
import LoadingSkeleton from '@/components/LoadingSkeleton/LoadingSkeleton';

export default function HomePage() {
  const { user, allCards, inventory, loading, refreshUser } = useUser();
  const { showToast } = useToast();
  const router = useRouter();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  // Check if already claimed today
  const lastReward = user?.last_daily_reward ? new Date(user.last_daily_reward) : null;
  const now = new Date();
  const alreadyClaimed = claimed || (lastReward
    ? lastReward.getUTCFullYear() === now.getUTCFullYear() &&
      lastReward.getUTCMonth() === now.getUTCMonth() &&
      lastReward.getUTCDate() === now.getUTCDate()
    : false);

  const handleClaimDaily = async () => {
    if (!user || claiming || alreadyClaimed) return;
    setClaiming(true);
    try {
      const res = await fetch('/api/daily-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setClaimed(true);
        haptic.success();
        await refreshUser();
        showToast(`Получено ${data.reward} монет!`, 'success', '🎁');
      } else {
        if (data.alreadyClaimed) {
          setClaimed(true);
        }
        showToast(data.error || 'Ошибка', 'error');
      }
    } catch (e) {
      showToast('Ошибка соединения', 'error');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <main className="page">
        <LoadingSkeleton type="page" />
      </main>
    );
  }

  const onMarket = inventory.filter(c => c.isOnMarket).length;

  return (
    <main className="page">
      <header className={styles.header}>
        <div className={styles.logoBlock}>
          <h1 className={styles.logo}>
            <span className={styles.logoGlitch} data-text="HEINI">HEINI</span>
            <span className={styles.logoCards}>CARDS</span>
          </h1>
          <p className={styles.tagline}>СОБИРАЙ • ТОРГУЙ • ДОМИНИРУЙ</p>
        </div>

        <div className={styles.balanceBar}>
          <span className={styles.balanceIcon}>🪙</span>
          <span className={styles.balanceAmount}>
            {(user?.balance ?? 0).toLocaleString()}
          </span>
          <span className={styles.balanceLabel}>HEINI-COINS</span>
        </div>
      </header>

      {/* Daily reward */}
      <section className={styles.dailyBanner}>
        <div className={styles.dailyInner}>
          <span className={styles.dailyIcon}>{alreadyClaimed ? '✅' : '🎁'}</span>
          <div className={styles.dailyText}>
            <span className={styles.dailyTitle}>Ежедневная награда</span>
            <span className={styles.dailySub}>
              {alreadyClaimed ? 'Приходи завтра!' : '200 монет ждут тебя!'}
            </span>
          </div>
          <button
            className={`${styles.dailyBtn} ${alreadyClaimed ? styles.dailyBtnClaimed : ''}`}
            onClick={handleClaimDaily}
            disabled={claiming || alreadyClaimed}
          >
            {claiming ? '⏳' : alreadyClaimed ? 'ПОЛУЧЕНО' : 'ЗАБРАТЬ'}
          </button>
        </div>
      </section>

      {/* Quick stats */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>📊</span>
          Статистика
        </h2>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{inventory.length}</span>
            <span className={styles.statLabel}>Карт собрано</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{allCards.length}</span>
            <span className={styles.statLabel}>Всего карт</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{onMarket}</span>
            <span className={styles.statLabel}>На маркете</span>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className={styles.section}>
        <div className={styles.quickActions}>
          <button className={styles.actionBtnPrimary} onClick={() => window.location.href = '/shop'}>
            🛒 МАГАЗИН ПАКОВ
          </button>
          <button className={styles.actionBtnSecondary} onClick={() => window.location.href = '/inventory'}>
            🎒 МОЙ ИНВЕНТАРЬ
          </button>
        </div>
      </section>

      {/* SvinoPass banner */}
      <section className={styles.svinopassBanner} onClick={() => router.push('/pass')} style={{ cursor: 'pointer' }}>
        <div className={styles.svinopassInner}>
          <div className={styles.svinopassBadge}>🐷</div>
          <div className={styles.svinopassText}>
            <span className={styles.svinopassTitle}>SVINO PASS</span>
            <span className={styles.svinopassSub}>Сезон 1 • Качай XP!</span>
          </div>
          <div className={styles.svinopassTag}>→</div>
        </div>
      </section>
    </main>
  );
}
