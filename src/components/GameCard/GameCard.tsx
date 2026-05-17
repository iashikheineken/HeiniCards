'use client';

import React from 'react';
import { RANK_COLORS } from '@/data/cards';
import type { Card } from '@/data/cards';
import styles from './GameCard.module.css';

interface GameCardProps {
  card: Card;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  showDescription?: boolean;
  /** Optional frame image URL (from season) */
  frameUrl?: string;
}

export default function GameCard({ card, size = 'medium', onClick, showDescription = false, frameUrl }: GameCardProps) {
  const rankColor = RANK_COLORS[card.rank];
  const isS = card.rank === 'S';
  const hasArt = !!card.art_url;

  return (
    <div
      className={`${styles.cardWrapper} ${styles[size]} ${isS ? styles.sRank : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Border glow layer */}
      <div
        className={`${styles.cardBorder} ${isS ? styles.holoBorder : ''}`}
        style={{
          borderColor: rankColor.primary,
          boxShadow: `0 0 12px ${rankColor.glow}, inset 0 0 12px ${rankColor.glow}`,
        }}
      >
        {/* Art area */}
        <div
          className={styles.cardArt}
          style={{ background: hasArt ? 'transparent' : card.gradient }}
        >
          {/* Layer 1: Art image (if available) */}
          {hasArt && (
            <img
              src={card.art_url!}
              alt={card.name}
              className={styles.artImage}
              style={{ objectPosition: card.art_position || 'center' }}
              loading="lazy"
            />
          )}

          {/* Layer 2: Emoji fallback (if no art) */}
          {!hasArt && (
            <span className={styles.cardEmoji}>{card.emoji}</span>
          )}

          {/* Layer 3: Frame overlay (from season, transparent PNG) */}
          {frameUrl && (
            <img
              src={frameUrl}
              alt=""
              className={styles.frameOverlay}
              loading="lazy"
            />
          )}

          {/* Layer 4: S-rank holographic effect */}
          {isS && <div className={styles.holoOverlay} />}
        </div>

        {/* Info area */}
        <div className={styles.cardInfo}>
          <h3 className={styles.cardName}>{card.name}</h3>

          <div
            className={`${styles.rankBadge} ${isS ? styles.rankBadgeS : ''}`}
            style={{
              background: rankColor.bg,
              color: card.rank === 'C' ? '#fff' : '#000',
            }}
          >
            {card.rank}
          </div>

          {showDescription && (
            <p className={styles.cardDescription}>{card.description}</p>
          )}

          <div className={styles.cardStats}>
            <span className={styles.statAttack}>⚔ {card.attack}</span>
            <span className={styles.statDefense}>🛡 {card.defense}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
