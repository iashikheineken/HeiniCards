'use client';

import React from 'react';
import { Card, RANK_LABELS } from '@/data/cards';
import GameCard from '@/components/GameCard/GameCard';
import styles from './CardModal.module.css';

interface CardModalProps {
  card: Card;
  onClose: () => void;
  actions?: { label: string; icon: string; onClick: () => void; variant?: 'primary' | 'danger' | 'secondary' }[];
}

export default function CardModal({ card, onClose, actions }: CardModalProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>

        <div className={styles.cardContainer}>
          <GameCard card={card} size="large" showDescription />
        </div>

        <div className={styles.details}>
          <div className={styles.rankLabel}>
            {RANK_LABELS[card.rank]} — Ранг {card.rank}
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statBox}>
              <span className={styles.statValue} style={{ color: 'var(--neon-red)' }}>
                {card.attack}
              </span>
              <span className={styles.statName}>Атака</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue} style={{ color: 'var(--neon-cyan)' }}>
                {card.defense}
              </span>
              <span className={styles.statName}>Защита</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue} style={{ color: 'var(--neon-green)' }}>
                {card.attack + card.defense}
              </span>
              <span className={styles.statName}>Мощь</span>
            </div>
          </div>
        </div>

        {actions && actions.length > 0 && (
          <div className={styles.actions}>
            {actions.map((action, i) => (
              <button
                key={i}
                className={`${styles.actionBtn} ${styles[action.variant || 'secondary']}`}
                onClick={action.onClick}
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
