'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './RouletteStrip.module.css';
import { RANK_COLORS } from '@/data/cards';
import type { Card } from '@/data/cards';

interface RouletteStripProps {
  /** All possible cards in the pack (for filling the strip) */
  poolCards: Card[];
  /** The card that was determined by the server */
  winCard: Card;
  /** Delay before this strip starts spinning (stagger effect) */
  delay?: number;
  /** Callback when this strip finishes */
  onFinish?: () => void;
}

const STRIP_LENGTH = 40; // number of cards in the visual strip
const WIN_INDEX = 33;    // position where the winning card will land
const SPIN_DURATION = 3000; // ms

export default function RouletteStrip({ poolCards, winCard, delay = 0, onFinish }: RouletteStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);

  // Build the strip: random cards with the winner placed at WIN_INDEX
  const stripCards = useRef<Card[]>([]);
  if (stripCards.current.length === 0) {
    const cards: Card[] = [];
    for (let i = 0; i < STRIP_LENGTH; i++) {
      if (i === WIN_INDEX) {
        cards.push(winCard);
      } else {
        cards.push(poolCards[Math.floor(Math.random() * poolCards.length)]);
      }
    }
    stripCards.current = cards;
  }

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setStarted(true);

      // Calculate scroll position to land on WIN_INDEX
      const cardWidth = 80; // matches CSS
      const gap = 6;
      const containerWidth = stripRef.current?.parentElement?.clientWidth || 300;
      const targetScroll = (WIN_INDEX * (cardWidth + gap)) - (containerWidth / 2) + (cardWidth / 2);

      if (stripRef.current) {
        stripRef.current.style.transition = `transform ${SPIN_DURATION}ms cubic-bezier(0.15, 0.85, 0.25, 1)`;
        stripRef.current.style.transform = `translateX(-${targetScroll}px)`;
      }

      const finishTimer = setTimeout(() => {
        setFinished(true);
        onFinish?.();
      }, SPIN_DURATION + 200);

      return () => clearTimeout(finishTimer);
    }, delay);

    return () => clearTimeout(delayTimer);
  }, [delay, onFinish]);

  return (
    <div className={styles.stripContainer}>
      {/* Center indicator */}
      <div className={styles.indicator} />

      <div className={styles.stripViewport}>
        <div
          ref={stripRef}
          className={`${styles.strip} ${!started ? styles.stripInitial : ''}`}
        >
          {stripCards.current.map((card, i) => {
            const isWinner = i === WIN_INDEX;
            const rankColor = RANK_COLORS[card.rank];

            return (
              <div
                key={i}
                className={`${styles.stripCard} ${isWinner && finished ? styles.winner : ''}`}
                style={{
                  borderColor: rankColor.primary,
                  boxShadow: isWinner && finished
                    ? `0 0 16px ${rankColor.glow}, 0 0 32px ${rankColor.glow}`
                    : `0 0 4px ${rankColor.glow}`,
                }}
              >
                <div
                  className={styles.stripCardArt}
                  style={{ background: card.art_url ? 'transparent' : (card.gradient || 'var(--bg-card)') }}
                >
                  {card.art_url ? (
                    <img
                      src={card.art_url}
                      alt={card.name}
                      className={styles.stripArtImg}
                      style={{ objectPosition: card.art_position || 'center' }}
                    />
                  ) : (
                    <span className={styles.stripEmoji}>{card.emoji}</span>
                  )}
                </div>
                <div className={styles.stripCardRank} style={{ background: rankColor.bg }}>
                  {card.rank}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
