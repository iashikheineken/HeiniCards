'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import { useUser } from '@/context/UserContext';
import GameCard from '@/components/GameCard/GameCard';
import type { Card, CardRank } from '@/data/cards';

type Tab = 'cards' | 'packs';

interface AdminCard {
  id?: string;
  name: string;
  rank: CardRank;
  description: string;
  attack: number;
  defense: number;
  emoji: string;
  gradient: string;
  art_url: string;
  art_position: string;
}

interface AdminPack {
  id?: string;
  name: string;
  description: string;
  price: number;
  card_count: number;
  emoji: string;
  gradient: string;
  cover_url: string;
  is_active: boolean;
  cardIds: string[];
}

const EMPTY_CARD: AdminCard = {
  name: '', rank: 'C', description: '', attack: 0, defense: 0,
  emoji: '🃏', gradient: 'linear-gradient(135deg, #1a1a28, #0a0a0f)', art_url: '', art_position: 'center',
};

const EMPTY_PACK: AdminPack = {
  name: '', description: '', price: 100, card_count: 3,
  emoji: '📦', gradient: 'linear-gradient(135deg, #1a3a2a, #0a2a1a)', cover_url: '',
  is_active: true, cardIds: [],
};

// Helper: parse two colors from a gradient string
function parseGradientColors(gradient: string): [string, string] {
  const matches = gradient.match(/#[0-9a-fA-F]{6}/g);
  if (matches && matches.length >= 2) return [matches[0], matches[1]];
  if (matches && matches.length === 1) return [matches[0], matches[0]];
  return ['#1a1a28', '#0a0a0f'];
}

function buildGradient(c1: string, c2: string): string {
  return `linear-gradient(135deg, ${c1}, ${c2})`;
}

export default function AdminPage() {
  const { user } = useUser();
  const [tab, setTab] = useState<Tab>('cards');
  const [cards, setCards] = useState<AdminCard[]>([]);
  const [packs, setPacks] = useState<AdminPack[]>([]);
  const [editCard, setEditCard] = useState<AdminCard | null>(null);
  const [editPack, setEditPack] = useState<AdminPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Check admin access
  const isAdmin = user?.is_admin === true;

  // Load data
  useEffect(() => {
    if (!user?.id || !isAdmin) return;
    loadData();
  }, [user?.id, isAdmin]);

  async function loadData() {
    setLoading(true);
    try {
      const [cardsRes, packsRes] = await Promise.all([
        fetch(`/api/admin/cards?user_id=${user!.id}`),
        fetch(`/api/admin/packs?user_id=${user!.id}`),
      ]);
      const cardsData = await cardsRes.json();
      const packsData = await packsRes.json();

      setCards((cardsData.cards || []).map((c: Record<string, unknown>) => ({
        id: c.id, name: c.name, rank: c.rank, description: c.description || '',
        attack: c.attack, defense: c.defense, emoji: c.emoji || '🃏',
        gradient: c.gradient || '', art_url: c.art_url || '', art_position: (c.art_position as string) || 'center',
      })));

      const packCardsMap = new Map<string, string[]>();
      for (const pc of (packsData.packCards || [])) {
        const existing = packCardsMap.get(pc.pack_id) || [];
        existing.push(pc.card_id);
        packCardsMap.set(pc.pack_id, existing);
      }

      setPacks((packsData.packs || []).map((p: Record<string, unknown>) => ({
        id: p.id, name: p.name, description: p.description || '',
        price: p.price, card_count: p.card_count, emoji: p.emoji || '📦',
        gradient: p.gradient || '', cover_url: p.cover_url || '',
        is_active: p.is_active, cardIds: packCardsMap.get(p.id as string) || [],
      })));
    } catch (e) {
      console.error('Admin load error:', e);
    } finally {
      setLoading(false);
    }
  }

  // Upload file
  async function handleUpload(field: 'art_url' | 'cover_url', folder: string) {
    fileRef.current?.click();
    const handler = async (e: Event) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;

      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', user!.id);
      formData.append('folder', folder);

      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.success) {
          if (editCard && field === 'art_url') {
            setEditCard({ ...editCard, art_url: data.url });
          } else if (editPack && field === 'cover_url') {
            setEditPack({ ...editPack, cover_url: data.url });
          }
        } else {
          alert(data.error || 'Ошибка загрузки');
        }
      } catch (err) {
        alert('Ошибка соединения');
      } finally {
        setUploading(false);
        input.value = '';
      }
      input.removeEventListener('change', handler);
    };
    fileRef.current?.addEventListener('change', handler);
  }

  // Save card
  async function saveCard() {
    if (!editCard || !user?.id) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, card: editCard }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      alert(`Карта ${data.action === 'created' ? 'создана' : 'обновлена'}!`);
      setEditCard(null);
      loadData();
    } catch (e) { alert('Ошибка'); } finally { setSaving(false); }
  }

  // Delete card
  async function deleteCard(cardId: string) {
    if (!confirm('Удалить карту? Это действие нельзя отменить.')) return;
    try {
      const res = await fetch('/api/admin/cards', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.id, cardId }),
      });
      const data = await res.json();
      if (data.success) loadData();
      else alert(data.error);
    } catch (e) { alert('Ошибка'); }
  }

  // Save pack
  async function savePack() {
    if (!editPack || !user?.id) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/packs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, pack: editPack, cardIds: editPack.cardIds }),
      });
      const data = await res.json();
      if (data.error) { alert(data.error); return; }
      alert('Пак сохранён!');
      setEditPack(null);
      loadData();
    } catch (e) { alert('Ошибка'); } finally { setSaving(false); }
  }

  // Delete pack
  async function deletePack(packId: string) {
    if (!confirm('Удалить пак? Это действие нельзя отменить.')) return;
    try {
      const res = await fetch('/api/admin/packs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user!.id, packId }),
      });
      const data = await res.json();
      if (data.success) loadData();
      else alert(data.error);
    } catch (e) { alert('Ошибка'); }
  }

  // Not admin
  if (!loading && !isAdmin) {
    return (
      <main className="page">
        <div className={styles.denied}>
          <span className={styles.deniedIcon}>🔒</span>
          <h1 className={styles.deniedTitle}>ДОСТУП ЗАПРЕЩЁН</h1>
          <p className={styles.deniedText}>Эта страница только для администратора.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} />

      <header className={styles.header}>
        <h1 className={styles.title}>⚙️ АДМИНКА</h1>
      </header>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'cards' ? styles.tabActive : ''}`}
          onClick={() => { setTab('cards'); setEditCard(null); setEditPack(null); }}
        >
          🃏 Карты ({cards.length})
        </button>
        <button
          className={`${styles.tab} ${tab === 'packs' ? styles.tabActive : ''}`}
          onClick={() => { setTab('packs'); setEditCard(null); setEditPack(null); }}
        >
          📦 Паки ({packs.length})
        </button>
      </div>

      {/* CARDS TAB */}
      {tab === 'cards' && !editCard && (
        <section className={styles.section}>
          <button className={styles.addBtn} onClick={() => setEditCard({ ...EMPTY_CARD })}>
            + НОВАЯ КАРТА
          </button>
          <div className={styles.itemList}>
            {cards.map(card => (
              <div key={card.id} className={styles.listItem} onClick={() => setEditCard({ ...card })}>
                <span className={styles.listEmoji}>{card.emoji}</span>
                <div className={styles.listInfo}>
                  <span className={styles.listName}>{card.name}</span>
                  <span className={styles.listMeta}>Ранг {card.rank} • ⚔{card.attack} 🛡{card.defense}</span>
                </div>
                <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); deleteCard(card.id!); }}>
                  🗑
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CARD EDITOR */}
      {tab === 'cards' && editCard && (
        <section className={styles.editor}>
          <h2 className={styles.editorTitle}>{editCard.id ? 'Редактировать карту' : 'Новая карта'}</h2>

          <div className={styles.editorPreview}>
            <GameCard card={{
              id: editCard.id || 'preview',
              name: editCard.name || 'Название',
              rank: editCard.rank,
              description: editCard.description,
              attack: editCard.attack,
              defense: editCard.defense,
              emoji: editCard.emoji,
              gradient: editCard.gradient,
              art_url: editCard.art_url || undefined,
              art_position: editCard.art_position || 'center',
            }} size="medium" showDescription />
          </div>

          {/* Art position selector - under preview for instant feedback */}
          {editCard.art_url && (
            <div className={styles.positionControl}>
              <span className={styles.positionLabel}>Позиция арта:</span>
              <select className={styles.positionSelect} value={editCard.art_position} onChange={e => setEditCard({ ...editCard, art_position: e.target.value })}>
                <option value="top">⬆ Верх</option>
                <option value="center">⬛ Центр</option>
                <option value="bottom">⬇ Низ</option>
                <option value="left">⬅ Лево</option>
                <option value="right">➡ Право</option>
                <option value="top left">↖ Верх-лево</option>
                <option value="top right">↗ Верх-право</option>
              </select>
            </div>
          )}

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Название</span>
              <input value={editCard.name} onChange={e => setEditCard({ ...editCard, name: e.target.value })} />
            </label>

            <label className={styles.field}>
              <span>Ранг</span>
              <select value={editCard.rank} onChange={e => setEditCard({ ...editCard, rank: e.target.value as CardRank })}>
                <option value="S">S — Легендарная</option>
                <option value="A">A — Эпическая</option>
                <option value="B">B — Редкая</option>
                <option value="C">C — Обычная</option>
              </select>
            </label>

            <label className={styles.field}>
              <span>Эмодзи</span>
              <input value={editCard.emoji} onChange={e => setEditCard({ ...editCard, emoji: e.target.value })} />
            </label>

            <label className={styles.field}>
              <span>Атака</span>
              <input type="number" value={editCard.attack} onChange={e => setEditCard({ ...editCard, attack: parseInt(e.target.value) || 0 })} />
            </label>

            <label className={styles.field}>
              <span>Защита</span>
              <input type="number" value={editCard.defense} onChange={e => setEditCard({ ...editCard, defense: parseInt(e.target.value) || 0 })} />
            </label>

            <label className={styles.fieldFull}>
              <span>Описание</span>
              <textarea value={editCard.description} onChange={e => setEditCard({ ...editCard, description: e.target.value })} rows={3} />
            </label>

            <div className={styles.fieldFull}>
              <span>Градиент фона</span>
              <div className={styles.gradientPicker}>
                <input
                  type="color"
                  value={parseGradientColors(editCard.gradient)[0]}
                  onChange={e => {
                    const [, c2] = parseGradientColors(editCard.gradient);
                    setEditCard({ ...editCard, gradient: buildGradient(e.target.value, c2) });
                  }}
                  className={styles.colorInput}
                />
                <div className={styles.gradientPreview} style={{ background: editCard.gradient }} />
                <input
                  type="color"
                  value={parseGradientColors(editCard.gradient)[1]}
                  onChange={e => {
                    const [c1] = parseGradientColors(editCard.gradient);
                    setEditCard({ ...editCard, gradient: buildGradient(c1, e.target.value) });
                  }}
                  className={styles.colorInput}
                />
              </div>
            </div>

            <label className={styles.fieldFull}>
              <span>Арт (URL)</span>
              <div className={styles.uploadRow}>
                <input value={editCard.art_url} onChange={e => setEditCard({ ...editCard, art_url: e.target.value })} placeholder="https://..." />
                <button className={styles.uploadBtn} onClick={() => handleUpload('art_url', 'cards')} disabled={uploading}>
                  {uploading ? '⏳' : '📤'}
                </button>
              </div>
            </label>
          </div>

          <div className={styles.editorActions}>
            {editCard.id && (
              <button className={styles.deleteBtnEditor} onClick={() => { deleteCard(editCard.id!); setEditCard(null); }}>🗑 Удалить</button>
            )}
            <button className={styles.cancelBtn} onClick={() => setEditCard(null)}>Отмена</button>
            <button className={styles.saveBtn} onClick={saveCard} disabled={saving || !editCard.name}>
              {saving ? '⏳ Сохранение...' : '✅ Сохранить'}
            </button>
          </div>
        </section>
      )}

      {/* PACKS TAB */}
      {tab === 'packs' && !editPack && (
        <section className={styles.section}>
          <button className={styles.addBtn} onClick={() => setEditPack({ ...EMPTY_PACK })}>
            + НОВЫЙ ПАК
          </button>
          <div className={styles.itemList}>
            {packs.map(pack => (
              <div key={pack.id} className={styles.listItem} onClick={() => setEditPack({ ...pack })}>
                <span className={styles.listEmoji}>{pack.emoji}</span>
                <div className={styles.listInfo}>
                  <span className={styles.listName}>{pack.name}</span>
                  <span className={styles.listMeta}>🪙{pack.price} • {pack.card_count} карт • {pack.is_active ? '✅' : '❌'}</span>
                </div>
                <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); deletePack(pack.id!); }}>
                  🗑
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PACK EDITOR */}
      {tab === 'packs' && editPack && (
        <section className={styles.editor}>
          <h2 className={styles.editorTitle}>{editPack.id ? 'Редактировать пак' : 'Новый пак'}</h2>

          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Название</span>
              <input value={editPack.name} onChange={e => setEditPack({ ...editPack, name: e.target.value })} />
            </label>

            <label className={styles.field}>
              <span>Цена 🪙</span>
              <input type="number" value={editPack.price} onChange={e => setEditPack({ ...editPack, price: parseInt(e.target.value) || 0 })} />
            </label>

            <label className={styles.field}>
              <span>Кол-во карт</span>
              <input type="number" value={editPack.card_count} onChange={e => setEditPack({ ...editPack, card_count: parseInt(e.target.value) || 1 })} />
            </label>

            <label className={styles.field}>
              <span>Эмодзи</span>
              <input value={editPack.emoji} onChange={e => setEditPack({ ...editPack, emoji: e.target.value })} />
            </label>

            <label className={styles.fieldFull}>
              <span>Описание</span>
              <textarea value={editPack.description} onChange={e => setEditPack({ ...editPack, description: e.target.value })} rows={2} />
            </label>

            <div className={styles.fieldFull}>
              <span>Градиент</span>
              <div className={styles.gradientPicker}>
                <input
                  type="color"
                  value={parseGradientColors(editPack.gradient)[0]}
                  onChange={e => {
                    const [, c2] = parseGradientColors(editPack.gradient);
                    setEditPack({ ...editPack, gradient: buildGradient(e.target.value, c2) });
                  }}
                  className={styles.colorInput}
                />
                <div className={styles.gradientPreview} style={{ background: editPack.gradient }} />
                <input
                  type="color"
                  value={parseGradientColors(editPack.gradient)[1]}
                  onChange={e => {
                    const [c1] = parseGradientColors(editPack.gradient);
                    setEditPack({ ...editPack, gradient: buildGradient(c1, e.target.value) });
                  }}
                  className={styles.colorInput}
                />
              </div>
            </div>

            <label className={styles.fieldFull}>
              <span>Обложка пака (URL)</span>
              <div className={styles.uploadRow}>
                <input value={editPack.cover_url} onChange={e => setEditPack({ ...editPack, cover_url: e.target.value })} placeholder="https://..." />
                <button className={styles.uploadBtn} onClick={() => handleUpload('cover_url', 'packs')} disabled={uploading}>
                  {uploading ? '⏳' : '📤'}
                </button>
              </div>
            </label>

            {editPack.cover_url && (
              <div className={styles.fieldFull}>
                <img src={editPack.cover_url} alt="Cover" className={styles.coverPreviewImg} />
              </div>
            )}

            <div className={styles.fieldFull}>
              <div className={styles.checkRow}>
                <input type="checkbox" checked={editPack.is_active} onChange={e => setEditPack({ ...editPack, is_active: e.target.checked })} />
                <span>Активен в магазине</span>
              </div>
            </div>

            {/* Card picker */}
            <div className={styles.fieldFull}>
              <span className={styles.fieldLabel}>Карты в паке:</span>
              <div className={styles.cardPicker}>
                {cards.map(card => {
                  const isSelected = editPack.cardIds.includes(card.id!);
                  return (
                    <button
                      key={card.id}
                      className={`${styles.pickerCard} ${isSelected ? styles.pickerSelected : ''}`}
                      onClick={() => {
                        const newIds = isSelected
                          ? editPack.cardIds.filter(id => id !== card.id)
                          : [...editPack.cardIds, card.id!];
                        setEditPack({ ...editPack, cardIds: newIds });
                      }}
                    >
                      <span>{card.emoji}</span>
                      <span className={styles.pickerName}>{card.name}</span>
                      <span className={styles.pickerRank}>{card.rank}</span>
                      {isSelected && <span className={styles.pickerCheck}>✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className={styles.editorActions}>
            {editPack.id && (
              <button className={styles.deleteBtnEditor} onClick={() => { deletePack(editPack.id!); setEditPack(null); }}>🗑 Удалить</button>
            )}
            <button className={styles.cancelBtn} onClick={() => setEditPack(null)}>Отмена</button>
            <button className={styles.saveBtn} onClick={savePack} disabled={saving || !editPack.name}>
              {saving ? '⏳ Сохранение...' : '✅ Сохранить'}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
