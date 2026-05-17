'use client';

import React, { useState, useCallback } from 'react';
import styles from './RouletteScreen.module.css';
import RouletteStrip from './RouletteStrip';
import GameCard from '@/components/GameCard/GameCard';
import { RANK_COLORS, RANK_LABELS } from '@/data/cards';
import type { Card } from '@/data/cards';

interface RouletteScreenProps {
  /** Cards won from the server */
  wonCards: Card[];
  /** All cards in the pack pool (for filling strips) */
  poolCards: Card[];
  /** Pack name */
  packName: string;
  /** Callback when user closes the screen */
  onClose: () => void;
}

export default function RouletteScreen({ wonCards, poolCards, packName, onClose }: RouletteScreenProps) {
  const [finishedCount, setFinishedCount] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const allFinished = finishedCount >= wonCards.length;

  const handleStripFinish = useCallback(() => {
    setFinishedCount(prev => {
      const next = prev + 1;
      if (next >= wonCards.length) {
        // Show results after a short delay
        setTimeout(() => setShowResults(true), 800);
      }
      return next;
    });
  }, [wonCards.length]);

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            {showResults ? '🎉 ВЫПАЛИ КАРТЫ!' : `📦 ${packName}`}
          </h2>
          {!showResults && (
            <p className={styles.subtitle}>
              {allFinished ? 'Готово!' : 'Крутим...'}
            </p>
          )}
        </div>

        {/* Roulette strips */}
        {!showResults && (
          <div className={styles.roulettes}>
            {wonCards.map((card, i) => (
              <RouletteStrip
                key={i}
                poolCards={poolCards}
                winCard={card}
                delay={i * 400} // stagger each strip by 400ms
                onFinish={handleStripFinish}
              />
            ))}
          </div>
        )}

        {/* Results grid */}
        {showResults && (
          <div className={styles.results}>
            <div className={styles.resultsGrid}>
              {wonCards.map((card, i) => (
                <div key={i} className={styles.resultItem} style={{ animationDelay: `${i * 0.1}s` }}>
                  <GameCard card={card} size="small" />
                  <div
                    className={styles.resultRank}
                    style={{ color: RANK_COLORS[card.rank].primary }}
                  >
                    {RANK_LABELS[card.rank]}
                  </div>
                </div>
              ))}
            </div>
            <button className={styles.collectBtn} onClick={onClose}>
              ✅ ЗАБРАТЬ ВСЕ
            </button>
          </div>
        )}

        {/* Skip button (during animation) */}
        {!showResults && allFinished && (
          <button className={styles.skipBtn} onClick={() => setShowResults(true)}>
            ПОКАЗАТЬ РЕЗУЛЬТАТ →
          </button>
        )}
      </div>
    </div>
  );
}
