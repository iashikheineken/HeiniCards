'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/components/Toast/Toast';
import { haptic } from '@/lib/telegram';

interface PassLevel {
  level: number;
  xp_required: number;
  reward_type: string;
  reward_value: string;
  reward_label: string;
}

export default function PassPage() {
  const { user, refreshUser } = useUser();
  const { showToast } = useToast();
  const [levels, setLevels] = useState<PassLevel[]>([]);
  const [claimedLevels, setClaimedLevels] = useState<number[]>([]);
  const [userXp, setUserXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    async function load() {
      setLoading(true);
      const res = await fetch(`/api/pass?user_id=${user!.id}`);
      const data = await res.json();
      setLevels(data.levels || []);
      setUserXp(data.userXp || 0);
      setClaimedLevels(data.claimedLevels || []);
      setLoading(false);
    }
    load();
  }, [user?.id]);

  const handleClaim = async (level: number) => {
    if (!user || claiming !== null) return;
    setClaiming(level);
    try {
      const res = await fetch('/api/pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, level }),
      });
      const data = await res.json();
      if (data.success) {
        haptic.success();
        showToast(`Награда получена: ${data.reward_label}`, 'success', '🎁');
        setClaimedLevels(prev => [...prev, level]);
        await refreshUser();
      } else {
        showToast(data.error || 'Ошибка', 'error');
      }
    } catch (e) {
      showToast('Ошибка соединения', 'error');
    } finally {
      setClaiming(null);
    }
  };

  // Find current level
  const currentLevel = levels.filter(l => userXp >= l.xp_required).length;
  const nextLevel = levels.find(l => userXp < l.xp_required);
  const prevLevelXp = currentLevel > 0 ? (levels[currentLevel - 1]?.xp_required || 0) : 0;
  const progressToNext = nextLevel
    ? ((userXp - prevLevelXp) / (nextLevel.xp_required - prevLevelXp)) * 100
    : 100;

  const rewardIcon = (type: string) => {
    if (type === 'coins') return '🪙';
    if (type === 'xp_boost') return '⚡';
    if (type === 'pack') return '📦';
    return '🎁';
  };

  return (
    <main className="page">
      <header className={styles.header}>
        <h1 className={styles.title}><span>🐷</span> СВИНОПАСС</h1>
      </header>

      {/* XP Overview */}
      <div className={styles.xpOverview}>
        <div className={styles.xpLevel}>
          <span className={styles.xpLevelNum}>{currentLevel}</span>
          <span className={styles.xpLevelLabel}>УРОВЕНЬ</span>
        </div>
        <div className={styles.xpBarContainer}>
          <div className={styles.xpBarBg}>
            <div className={styles.xpBarFill} style={{ width: `${Math.min(100, progressToNext)}%` }} />
          </div>
          <div className={styles.xpBarText}>
            {userXp} XP {nextLevel ? `/ ${nextLevel.xp_required}` : '(MAX)'}
          </div>
        </div>
      </div>

      {/* Levels */}
      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : (
        <div className={styles.levelList}>
          {levels.map((lvl) => {
            const isReached = userXp >= lvl.xp_required;
            const isClaimed = claimedLevels.includes(lvl.level);
            const canClaim = isReached && !isClaimed;

            return (
              <div
                key={lvl.level}
                className={`${styles.levelRow} ${isReached ? styles.reached : styles.locked} ${isClaimed ? styles.claimed : ''}`}
              >
                <div className={styles.levelNum}>{lvl.level}</div>
                <div className={styles.levelXpBar}>
                  <div
                    className={styles.levelXpFill}
                    style={{ width: `${Math.min(100, (userXp / lvl.xp_required) * 100)}%` }}
                  />
                </div>
                <div className={styles.levelReward}>
                  <span>{rewardIcon(lvl.reward_type)}</span>
                  <span>{lvl.reward_label}</span>
                </div>
                <div className={styles.levelAction}>
                  {isClaimed ? (
                    <span className={styles.claimedBadge}>✓</span>
                  ) : canClaim ? (
                    <button
                      className={styles.claimBtn}
                      onClick={() => handleClaim(lvl.level)}
                      disabled={claiming === lvl.level}
                    >
                      {claiming === lvl.level ? '...' : 'Забрать'}
                    </button>
                  ) : (
                    <span className={styles.lockedBadge}>🔒</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
