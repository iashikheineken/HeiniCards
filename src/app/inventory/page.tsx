'use client';

import React, { useState } from 'react';
import styles from './page.module.css';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/components/Toast/Toast';
import { haptic } from '@/lib/telegram';
import { DISENCHANT_VALUES } from '@/lib/api';
import type { InventoryCard } from '@/lib/api';
import GameCard from '@/components/GameCard/GameCard';
import CardModal from '@/components/CardModal/CardModal';
import LoadingSkeleton from '@/components/LoadingSkeleton/LoadingSkeleton';
import type { CardRank } from '@/data/cards';

const FILTERS: { label: string; value: CardRank | 'ALL' }[] = [
  { label: 'Все', value: 'ALL' },
  { label: 'S', value: 'S' },
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
];

interface GroupedCard {
  card: InventoryCard;
  count: number;
  userCardIds: string[];
}

function groupInventory(cards: InventoryCard[]): GroupedCard[] {
  const map = new Map<string, GroupedCard>();
  for (const c of cards) {
    const existing = map.get(c.id);
    if (existing) {
      existing.count++;
      existing.userCardIds.push(c.userCardId);
    } else {
      map.set(c.id, { card: c, count: 1, userCardIds: [c.userCardId] });
    }
  }
  return Array.from(map.values());
}

export default function InventoryPage() {
  const { inventory, allCards, user, loading, refreshUser, refreshInventory } = useUser();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<CardRank | 'ALL'>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<GroupedCard | null>(null);
  const [disenchanting, setDisenchanting] = useState(false);

  // Sell modal state
  const [showSellInput, setShowSellInput] = useState(false);
  const [sellPrice, setSellPrice] = useState(50);
  const [listing, setListing] = useState(false);

  const grouped = groupInventory(inventory);
  const filtered = filter === 'ALL' ? grouped : grouped.filter((g) => g.card.rank === filter);

  const rankCounts: Record<string, number> = { ALL: grouped.length };
  grouped.forEach((g) => { rankCounts[g.card.rank] = (rankCounts[g.card.rank] || 0) + 1; });

  const handleDisenchant = async (group: GroupedCard) => {
    if (!user || disenchanting) return;
    const value = DISENCHANT_VALUES[group.card.rank] || 5;

    setDisenchanting(true);
    try {
      const res = await fetch('/api/cards/disenchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userCardId: group.userCardIds[0], userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Ошибка расщепления', 'error');
        return;
      }
      haptic.success();
      showToast(`"${data.disenchantedCard}" расщеплена! +${data.coinsReceived} 🪙`, 'success', '💥');
      setSelectedGroup(null);
      await Promise.all([refreshUser(), refreshInventory()]);
    } catch (e) {
      showToast('Ошибка соединения', 'error');
    } finally {
      setDisenchanting(false);
    }
  };

  const handleSellFromInventory = async (group: GroupedCard) => {
    if (!user || listing) return;
    if (sellPrice < 1) { showToast('Цена должна быть больше 0', 'warning'); return; }

    setListing(true);
    try {
      const res = await fetch('/api/market/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userCardId: group.userCardIds[0],
          price: sellPrice,
        }),
      });
      const data = await res.json();
      if (data.success) {
        haptic.success();
        showToast(`"${group.card.name}" выставлена за ${sellPrice} 🪙!`, 'success', '💰');
        setSelectedGroup(null);
        setShowSellInput(false);
        await Promise.all([refreshUser(), refreshInventory()]);
      } else {
        showToast(data.error || 'Ошибка', 'error');
      }
    } catch (e) {
      showToast('Ошибка соединения', 'error');
    } finally {
      setListing(false);
    }
  };

  return (
    <main className="page">
      <header className={styles.invHeader}>
        <h1 className={styles.invTitle}><span>🎒</span> ИНВЕНТАРЬ</h1>
        <div className={styles.invCount}>{inventory.length} / {allCards.length}</div>
      </header>

      <div className={styles.filters}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`${styles.filterBtn} ${filter === f.value ? styles.filterActive : ''}`}
            onClick={() => setFilter(f.value)}
            data-rank={f.value}
          >
            {f.label}
            {rankCounts[f.value] !== undefined && (
              <span className={styles.filterCount}>{rankCounts[f.value] || 0}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton type="cards" />
      ) : filtered.length > 0 ? (
        <div className={styles.cardsGrid}>
          {filtered.map((group, i) => (
            <div key={group.card.id} className={styles.cardItem} style={{ animationDelay: `${i * 0.05}s` }}>
              <div className={styles.cardWithCount}>
                <GameCard card={group.card} size="small" onClick={() => { setSelectedGroup(group); setShowSellInput(false); }} />
                {group.count > 1 && <div className={styles.duplicateBadge}>{group.count}x</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📭</span>
          <p className={styles.emptyText}>
            {filter === 'ALL' ? 'У тебя пока нет карт. Загляни в магазин!' : `Нет карт ранга ${filter}`}
          </p>
        </div>
      )}

      {selectedGroup && (
        <CardModal
          card={selectedGroup.card}
          onClose={() => { setSelectedGroup(null); setShowSellInput(false); }}
          actions={
            showSellInput
              ? [] // hide default actions when sell input is shown
              : [
                  {
                    label: disenchanting ? 'Ждите...' : `Расщепить (${DISENCHANT_VALUES[selectedGroup.card.rank] || 5}🪙)`,
                    icon: '💥', variant: 'danger',
                    onClick: () => handleDisenchant(selectedGroup),
                  },
                  {
                    label: selectedGroup.card.isOnMarket ? 'Уже на маркете' : 'На маркет',
                    icon: '💰', variant: 'primary',
                    onClick: () => {
                      if (selectedGroup.card.isOnMarket) {
                        showToast('Эта карта уже выставлена на маркете', 'warning');
                      } else {
                        setShowSellInput(true);
                      }
                    },
                  },
                ]
          }
          extraContent={
            showSellInput ? (
              <div className={styles.sellInputBlock}>
                <div className={styles.sellInputRow}>
                  <span className={styles.sellInputLabel}>Цена: 🪙</span>
                  <input
                    type="number"
                    value={sellPrice}
                    onChange={e => setSellPrice(parseInt(e.target.value) || 0)}
                    min={1}
                    className={styles.sellInputField}
                    autoFocus
                  />
                </div>
                <div className={styles.sellInputActions}>
                  <button className={styles.sellInputBack} onClick={() => setShowSellInput(false)}>← Назад</button>
                  <button
                    className={styles.sellInputConfirm}
                    onClick={() => handleSellFromInventory(selectedGroup)}
                    disabled={listing || sellPrice < 1}
                  >
                    {listing ? '⏳' : `Продать за ${sellPrice} 🪙`}
                  </button>
                </div>
              </div>
            ) : undefined
          }
        />
      )}
    </main>
  );
}
