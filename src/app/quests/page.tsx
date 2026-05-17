'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/components/Toast/Toast';
import { haptic } from '@/lib/telegram';

interface Quest {
  id: string;
  title: string;
  description: string;
  quest_type: string;
  target_value: number;
  quest_param: string | null;
  reward_type: string;
  reward_value: number;
  is_daily: boolean;
  progress: number;
  completed: boolean;
  claimed: boolean;
  user_quest_id: string;
}

export default function QuestsPage() {
  const { user, refreshUser } = useUser();
  const { showToast } = useToast();
  const [daily, setDaily] = useState<Quest[]>([]);
  const [global, setGlobal] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    loadQuests();
  }, [user?.id]);

  async function loadQuests() {
    setLoading(true);
    const res = await fetch(`/api/quests?user_id=${user!.id}`);
    const data = await res.json();
    setDaily(data.daily || []);
    setGlobal(data.global || []);
    setLoading(false);
  }

  const handleClaim = async (quest: Quest) => {
    if (!user || claiming) return;
    setClaiming(quest.id);
    try {
      const res = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, questId: quest.id }),
      });
      const data = await res.json();
      if (data.success) {
        haptic.success();
        const label = data.reward_type === 'coins' ? `${data.reward_value} 🪙` : `${data.reward_value} XP`;
        showToast(`Награда: +${label}`, 'success', '🎯');
        await Promise.all([loadQuests(), refreshUser()]);
      } else {
        showToast(data.error || 'Ошибка', 'error');
      }
    } catch (e) {
      showToast('Ошибка', 'error');
    } finally {
      setClaiming(null);
    }
  };

  // Daily reset timer
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const hoursLeft = Math.floor((tomorrow.getTime() - now.getTime()) / 3600000);
  const minsLeft = Math.floor(((tomorrow.getTime() - now.getTime()) % 3600000) / 60000);

  const rewardBadge = (quest: Quest) => {
    if (quest.reward_type === 'coins') return `🪙 ${quest.reward_value}`;
    return `⚡ ${quest.reward_value} XP`;
  };

  const renderQuest = (quest: Quest) => {
    const pct = Math.min(100, (quest.progress / quest.target_value) * 100);
    return (
      <div key={quest.id} className={`${styles.questCard} ${quest.claimed ? styles.questClaimed : ''}`}>
        <div className={styles.questTop}>
          <div className={styles.questInfo}>
            <h3 className={styles.questTitle}>{quest.title}</h3>
            <p className={styles.questDesc}>{quest.description}</p>
          </div>
          <div className={styles.questReward}>{rewardBadge(quest)}</div>
        </div>
        <div className={styles.questBottom}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
          <span className={styles.progressText}>{quest.progress}/{quest.target_value}</span>
          {quest.claimed ? (
            <span className={styles.doneCheck}>✓</span>
          ) : quest.completed ? (
            <button
              className={styles.claimBtn}
              onClick={() => handleClaim(quest)}
              disabled={claiming === quest.id}
            >
              {claiming === quest.id ? '...' : 'Забрать'}
            </button>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <main className="page">
      <header className={styles.header}>
        <h1 className={styles.title}><span>📋</span> КВЕСТЫ</h1>
      </header>

      {/* Daily quests */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>⏰ Ежедневные</h2>
          <span className={styles.timer}>{hoursLeft}ч {minsLeft}м</span>
        </div>
        {loading ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : daily.length > 0 ? (
          <div className={styles.questList}>{daily.map(renderQuest)}</div>
        ) : (
          <div className={styles.empty}>Нет ежедневных квестов</div>
        )}
      </section>

      {/* Global quests */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>🌍 Глобальные</h2>
        {loading ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : global.length > 0 ? (
          <div className={styles.questList}>{global.map(renderQuest)}</div>
        ) : (
          <div className={styles.empty}>Нет глобальных квестов</div>
        )}
      </section>
    </main>
  );
}
