'use client';

import React, { useState } from 'react';
import styles from './page.module.css';
import { useUser } from '@/context/UserContext';
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

// Group cards by card_id, track count and all userCardIds
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
      map.set(c.id, {
        card: c,
        count: 1,
        userCardIds: [c.userCardId],
      });
    }
  }
  return Array.from(map.values());
}

export default function InventoryPage() {
  const { inventory, allCards, user, loading, refreshUser, refreshInventory } = useUser();
  const [filter, setFilter] = useState<CardRank | 'ALL'>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<GroupedCard | null>(null);
  const [disenchanting, setDisenchanting] = useState(false);

  // Group and filter
  const grouped = groupInventory(inventory);
  const filtered = filter === 'ALL'
    ? grouped
    : grouped.filter((g) => g.card.rank === filter);

  // Count by rank
  const rankCounts: Record<string, number> = { ALL: grouped.length };
  grouped.forEach((g) => {
    rankCounts[g.card.rank] = (rankCounts[g.card.rank] || 0) + 1;
  });

  const handleDisenchant = async (group: GroupedCard) => {
    if (!user || disenchanting) return;

    const value = DISENCHANT_VALUES[group.card.rank] || 5;
    const confirmed = confirm(
      `Расщепить "${group.card.name}" за ${value} 🪙?\n${group.count > 1 ? `(У тебя ещё ${group.count - 1} шт.)` : '(Это единственная копия!)'}`
    );
    if (!confirmed) return;

    setDisenchanting(true);
    try {
      // Disenchant one copy (the first userCardId)
      const res = await fetch('/api/cards/disenchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userCardId: group.userCardIds[0],
          userId: user.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Ошибка расщепления');
        return;
      }

      alert(`💥 "${data.disenchantedCard}" расщеплена! +${data.coinsReceived} 🪙`);
      setSelectedGroup(null);
      await Promise.all([refreshUser(), refreshInventory()]);
    } catch (e) {
      console.error('Disenchant error:', e);
      alert('Ошибка соединения');
    } finally {
      setDisenchanting(false);
    }
  };

  return (
    <main className="page">
      {/* Header */}
      <header className={styles.invHeader}>
        <h1 className={styles.invTitle}>
          <span>🎒</span> ИНВЕНТАРЬ
        </h1>
        <div className={styles.invCount}>
          {inventory.length} / {allCards.length}
        </div>
      </header>

      {/* Rank filters */}
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

      {/* Cards grid */}
      {loading ? (
        <LoadingSkeleton type="cards" />
      ) : filtered.length > 0 ? (
        <div className={styles.cardsGrid}>
          {filtered.map((group, i) => (
            <div
              key={group.card.id}
              className={styles.cardItem}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className={styles.cardWithCount}>
                <GameCard
                  card={group.card}
                  size="small"
                  onClick={() => setSelectedGroup(group)}
                />
                {group.count > 1 && (
                  <div className={styles.duplicateBadge}>
                    {group.count}x
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📭</span>
          <p className={styles.emptyText}>
            {filter === 'ALL'
              ? 'У тебя пока нет карт. Загляни в магазин!'
              : `Нет карт ранга ${filter}`}
          </p>
        </div>
      )}

      {/* Card modal with actions */}
      {selectedGroup && (
        <CardModal
          card={selectedGroup.card}
          onClose={() => setSelectedGroup(null)}
          actions={[
            {
              label: disenchanting ? 'Ждите...' : `Расщепить (${DISENCHANT_VALUES[selectedGroup.card.rank] || 5}🪙)`,
              icon: '💥',
              variant: 'danger',
              onClick: () => handleDisenchant(selectedGroup),
            },
            {
              label: 'На маркет',
              icon: '💰',
              variant: 'primary',
              onClick: () => alert('Маркет будет в следующем обновлении!'),
            },
          ]}
        />
      )}
    </main>
  );
}
