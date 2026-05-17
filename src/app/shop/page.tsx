'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { useUser } from '@/context/UserContext';
import { fetchPacks } from '@/lib/api';
import { dbCardToCard } from '@/lib/api';
import { haptic } from '@/lib/telegram';
import { useToast } from '@/components/Toast/Toast';
import PackCard from '@/components/PackCard/PackCard';
import GameCard from '@/components/GameCard/GameCard';
import CardModal from '@/components/CardModal/CardModal';
import LoadingSkeleton from '@/components/LoadingSkeleton/LoadingSkeleton';
import RouletteScreen from '@/components/Roulette/RouletteScreen';
import type { Card } from '@/data/cards';

interface PackWithCards {
  id: string;
  name: string;
  description: string;
  price: number;
  cardCount: number;
  gradient: string;
  emoji: string;
  cover_url?: string;
  cards: Card[];
  cardIds: string[];
}

export default function ShopPage() {
  const { user, refreshUser, refreshInventory } = useUser();
  const { showToast } = useToast();
  const [packs, setPacks] = useState<PackWithCards[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [selectedPack, setSelectedPack] = useState<PackWithCards | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Roulette state
  const [rouletteData, setRouletteData] = useState<{
    wonCards: Card[];
    poolCards: Card[];
    packName: string;
    xpGained: number;
  } | null>(null);

  useEffect(() => {
    async function loadPacks() {
      setLoading(true);
      const data = await fetchPacks();
      setPacks(data);
      setLoading(false);
    }
    loadPacks();
  }, []);

  const balance = user?.balance ?? 0;

  const handleBuy = async (pack: PackWithCards) => {
    if (!user || buying) return;
    if (balance < pack.price) return;

    setBuying(true);
    try {
      const res = await fetch('/api/packs/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packId: pack.id,
          userId: user.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showToast(data.error || 'Ошибка покупки', 'error');
        return;
      }

      // Convert won cards to frontend format
      const wonCards: Card[] = data.wonCards.map(dbCardToCard);

      // Close pack modal, open roulette
      haptic.medium();
      setSelectedPack(null);
      setRouletteData({
        wonCards,
        poolCards: pack.cards,
        packName: pack.name,
        xpGained: data.xpGained || 0,
      });

    } catch (e) {
      console.error('Buy error:', e);
      showToast('Ошибка соединения', 'error');
    } finally {
      setBuying(false);
    }
  };

  const handleRouletteClose = async () => {
    setRouletteData(null);
    haptic.success();
    // Refresh user data and inventory
    await Promise.all([refreshUser(), refreshInventory()]);
  };

  return (
    <main className="page">
      {/* Header */}
      <header className={styles.shopHeader}>
        <h1 className={styles.shopTitle}>
          <span>🛒</span> МАГАЗИН
        </h1>
        <div className={styles.shopBalance}>
          <span>🪙</span>
          <span className={styles.balanceNum}>{balance.toLocaleString()}</span>
        </div>
      </header>

      {/* Pack grid */}
      <section className={styles.packSection}>
        <h2 className={styles.sectionTitle}>Доступные паки</h2>
        {loading ? (
          <LoadingSkeleton type="packs" />
        ) : (
          <div className="grid-packs">
            {packs.map((pack, i) => (
              <div key={pack.id} style={{ animationDelay: `${i * 0.1}s` }}>
                <PackCard
                  pack={pack}
                  onClick={() => setSelectedPack(pack)}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pack preview modal */}
      {selectedPack && (
        <div className={styles.packModalOverlay} onClick={() => setSelectedPack(null)}>
          <div className={styles.packModal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setSelectedPack(null)}>✕</button>

            <div className={styles.packModalHeader}>
              <div className={styles.packModalCover} style={{ background: selectedPack.gradient }}>
                {selectedPack.cover_url ? (
                  <img src={selectedPack.cover_url} alt={selectedPack.name} className={styles.packModalCoverImg} />
                ) : (
                  <span className={styles.packModalEmoji}>{selectedPack.emoji}</span>
                )}
              </div>
              <div className={styles.packModalInfo}>
                <h3 className={styles.packModalName}>{selectedPack.name}</h3>
                <p className={styles.packModalDesc}>{selectedPack.description}</p>
                <div className={styles.packModalPrice}>
                  <span>🪙</span> {selectedPack.price}
                </div>
              </div>
            </div>

            <div className={styles.packCardsSection}>
              <h4 className={styles.packCardsTitle}>Карты в паке:</h4>
              <div className={styles.packCardsGrid}>
                {selectedPack.cards.map((card) => (
                  <GameCard
                    key={card.id}
                    card={card}
                    size="small"
                    onClick={() => setSelectedCard(card)}
                  />
                ))}
              </div>
            </div>

            <button
              className={styles.buyBtn}
              disabled={balance < selectedPack.price || buying}
              onClick={() => handleBuy(selectedPack)}
            >
              {buying
                ? '⏳ ПОКУПАЕМ...'
                : balance >= selectedPack.price
                  ? `КУПИТЬ ЗА 🪙 ${selectedPack.price}`
                  : 'НЕДОСТАТОЧНО МОНЕТ'}
            </button>
          </div>
        </div>
      )}

      {/* Roulette screen */}
      {rouletteData && (
        <RouletteScreen
          wonCards={rouletteData.wonCards}
          poolCards={rouletteData.poolCards}
          packName={rouletteData.packName}
          xpGained={rouletteData.xpGained}
          onClose={handleRouletteClose}
        />
      )}

      {/* Card detail modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </main>
  );
}
