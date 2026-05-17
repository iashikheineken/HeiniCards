'use client';

import React from 'react';
import styles from './LoadingSkeleton.module.css';

interface LoadingSkeletonProps {
  type?: 'page' | 'cards' | 'packs';
}

export default function LoadingSkeleton({ type = 'page' }: LoadingSkeletonProps) {
  if (type === 'cards') {
    return (
      <div className={styles.cardsGrid}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className={styles.cardSkeleton}>
            <div className={styles.cardArtSkel} />
            <div className={styles.cardInfoSkel}>
              <div className={styles.lineSkel} style={{ width: '80%' }} />
              <div className={styles.lineSkel} style={{ width: '40%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'packs') {
    return (
      <div className={styles.packsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.packSkeleton}>
            <div className={styles.packCoverSkel} />
            <div className={styles.packInfoSkel}>
              <div className={styles.lineSkel} style={{ width: '70%' }} />
              <div className={styles.lineSkel} style={{ width: '50%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.pageSkeleton}>
      <div className={styles.headerSkel} />
      <div className={styles.bannerSkel} />
      <div className={styles.sectionSkel}>
        <div className={styles.lineSkel} style={{ width: '40%' }} />
        <div className={styles.cardsGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.cardSkeleton}>
              <div className={styles.cardArtSkel} />
              <div className={styles.cardInfoSkel}>
                <div className={styles.lineSkel} style={{ width: '80%' }} />
                <div className={styles.lineSkel} style={{ width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
