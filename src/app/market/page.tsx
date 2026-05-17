'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { useUser } from '@/context/UserContext';
import { dbCardToCard } from '@/lib/api';
import { RANK_COLORS } from '@/data/cards';
import type { InventoryCard } from '@/lib/api';
import type { Card } from '@/data/cards';
import GameCard from '@/components/GameCard/GameCard';
import CardModal from '@/components/CardModal/CardModal';
import LoadingSkeleton from '@/components/LoadingSkeleton/LoadingSkeleton';

interface MarketListing {
  id: string;
  seller_id: string;
  user_card_id: string;
  card_id: string;
  price: number;
  created_at: string;
  cards: Record<string, unknown>;
  users: { id: string; username: string; display_name: string };
}

export default function MarketPage() {
  const { user, inventory, refreshUser, refreshInventory } = useUser();
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedListing, setSelectedListing] = useState<MarketListing | null>(null);
  const [buying, setBuying] = useState(false);

  // For selling
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellCard, setSellCard] = useState<InventoryCard | null>(null);
  const [sellPrice, setSellPrice] = useState(50);
  const [listing, setListing] = useState(false);

  const balance = user?.balance ?? 0;

  // Load market listings
  async function loadListings() {
    setLoading(true);
    try {
      const res = await fetch('/api/market');
      const data = await res.json();
      setListings(data.listings || []);
    } catch (e) {
      console.error('Market load error:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadListings();
  }, []);

  // Buy a card
  const handleBuy = async (listingItem: MarketListing) => {
    if (!user || buying) return;
    if (balance < listingItem.price) {
      alert('Недостаточно монет!');
      return;
    }
    if (listingItem.seller_id === user.id) {
      alert('Нельзя купить свою карту!');
      return;
    }

    const card = dbCardToCard(listingItem.cards as any);
    const confirmed = confirm(`Купить "${card.name}" за ${listingItem.price} 🪙?`);
    if (!confirmed) return;

    setBuying(true);
    try {
      const res = await fetch('/api/market/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId: user.id, listingId: listingItem.id }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`✅ Купил "${card.name}" за ${data.price} 🪙!`);
        setSelectedListing(null);
        setSelectedCard(null);
        await Promise.all([refreshUser(), refreshInventory(), loadListings()]);
      } else {
        alert(data.error || 'Ошибка покупки');
      }
    } catch (e) {
      alert('Ошибка соединения');
    } finally {
      setBuying(false);
    }
  };

  // Cancel listing
  const handleCancel = async (listingItem: MarketListing) => {
    if (!user) return;
    const confirmed = confirm('Снять карту с продажи?');
    if (!confirmed) return;

    try {
      const res = await fetch('/api/market/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, listingId: listingItem.id }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Карта снята с продажи');
        await Promise.all([refreshInventory(), loadListings()]);
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Ошибка');
    }
  };

  // List card for sale
  const handleSell = async () => {
    if (!user || !sellCard || listing) return;
    if (sellPrice < 1) { alert('Цена должна быть больше 0'); return; }

    setListing(true);
    try {
      const res = await fetch('/api/market/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userCardId: sellCard.userCardId,
          price: sellPrice,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`"${sellCard.name}" выставлена за ${sellPrice} 🪙!`);
        setShowSellModal(false);
        setSellCard(null);
        await Promise.all([refreshInventory(), loadListings()]);
      } else {
        alert(data.error || 'Ошибка');
      }
    } catch (e) {
      alert('Ошибка');
    } finally {
      setListing(false);
    }
  };

  // Cards available to sell (not already on market)
  const sellableCards = inventory.filter(c => !c.isOnMarket);

  return (
    <main className="page">
      <header className={styles.marketHeader}>
        <h1 className={styles.marketTitle}>
          <span>💰</span> МАРКЕТ
        </h1>
        <button className={styles.sellBtn} onClick={() => setShowSellModal(true)}>
          + ПРОДАТЬ
        </button>
      </header>

      <div className={styles.marketBalance}>
        <span>🪙</span>
        <span className={styles.balanceNum}>{balance.toLocaleString()}</span>
      </div>

      {/* Listings */}
      {loading ? (
        <LoadingSkeleton type="cards" />
      ) : listings.length > 0 ? (
        <div className={styles.listingsGrid}>
          {listings.map((item) => {
            const card = dbCardToCard(item.cards as any);
            const isMine = item.seller_id === user?.id;
            const rankColor = RANK_COLORS[card.rank];

            return (
              <div key={item.id} className={styles.listingItem}>
                <GameCard card={card} size="small" onClick={() => {
                  setSelectedCard(card);
                  setSelectedListing(item);
                }} />
                <div className={styles.listingPrice}>
                  <span>🪙</span> {item.price}
                </div>
                <div className={styles.listingSeller}>
                  {isMine ? '(Ваша)' : item.users?.display_name || 'Игрок'}
                </div>
                {isMine ? (
                  <button className={styles.cancelListBtn} onClick={() => handleCancel(item)}>
                    Снять
                  </button>
                ) : (
                  <button
                    className={styles.buyListBtn}
                    disabled={balance < item.price}
                    onClick={() => handleBuy(item)}
                  >
                    {balance >= item.price ? 'Купить' : 'Мало 🪙'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>🏪</span>
          <p className={styles.emptyText}>Маркет пуст. Будь первым!</p>
        </div>
      )}

      {/* Sell modal */}
      {showSellModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSellModal(false)}>
          <div className={styles.sellModal} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setShowSellModal(false)}>✕</button>
            <h2 className={styles.sellTitle}>Выставить на продажу</h2>

            {!sellCard ? (
              <>
                <p className={styles.sellSubtitle}>Выбери карту:</p>
                <div className={styles.sellGrid}>
                  {sellableCards.length > 0 ? sellableCards.map(card => (
                    <div key={card.userCardId} className={styles.sellItem} onClick={() => setSellCard(card)}>
                      <GameCard card={card} size="small" />
                    </div>
                  )) : (
                    <p className={styles.noCards}>Нет карт для продажи</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className={styles.sellPreview}>
                  <GameCard card={sellCard} size="medium" />
                </div>
                <div className={styles.priceInput}>
                  <span className={styles.priceLabel}>Цена: 🪙</span>
                  <input
                    type="number"
                    value={sellPrice}
                    onChange={e => setSellPrice(parseInt(e.target.value) || 0)}
                    min={1}
                    className={styles.priceField}
                  />
                </div>
                <div className={styles.sellActions}>
                  <button className={styles.sellBack} onClick={() => setSellCard(null)}>← Назад</button>
                  <button className={styles.sellConfirm} onClick={handleSell} disabled={listing || sellPrice < 1}>
                    {listing ? '⏳' : `Продать за ${sellPrice} 🪙`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Card detail */}
      {selectedCard && selectedListing && (
        <CardModal
          card={selectedCard}
          onClose={() => { setSelectedCard(null); setSelectedListing(null); }}
          actions={
            selectedListing.seller_id === user?.id
              ? [{ label: 'Снять с продажи', icon: '↩', variant: 'danger' as const, onClick: () => { handleCancel(selectedListing); setSelectedCard(null); setSelectedListing(null); } }]
              : [{ label: `Купить за ${selectedListing.price}🪙`, icon: '💰', variant: 'primary' as const, onClick: () => handleBuy(selectedListing) }]
          }
        />
      )}
    </main>
  );
}
