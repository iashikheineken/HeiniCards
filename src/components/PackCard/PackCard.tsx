'use client';

import React from 'react';
import { Pack } from '@/data/packs';
import styles from './PackCard.module.css';

interface PackCardProps {
  pack: Pack;
  onClick?: () => void;
}

export default function PackCard({ pack, onClick }: PackCardProps) {
  return (
    <div className={styles.packWrapper} onClick={onClick}>
      <div className={styles.packCover} style={{ background: pack.gradient }}>
        {pack.cover_url ? (
          <img
            src={pack.cover_url}
            alt={pack.name}
            className={styles.packCoverImg}
          />
        ) : (
          <span className={styles.packEmoji}>{pack.emoji}</span>
        )}
      </div>
      <div className={styles.packInfo}>
        <h3 className={styles.packName}>{pack.name}</h3>
        <div className={styles.packMeta}>
          <span className={styles.packCards}>{pack.cardCount} карт</span>
          <span className={styles.packPrice}>
            <span className={styles.coinIcon}>🪙</span>
            {pack.price}
          </span>
        </div>
      </div>
    </div>
  );
}
