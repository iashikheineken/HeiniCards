export interface Pack {
  id: string;
  name: string;
  description: string;
  price: number;
  cardCount: number;
  cardIds: string[];
  gradient: string;
  emoji: string;
  cover_url?: string;
}

export const packs: Pack[] = [
  {
    id: 'pack-001',
    name: 'Стартовый Набор',
    description: 'Базовый набор для новичков. Содержит карты C и B ранга.',
    price: 100,
    cardCount: 3,
    cardIds: ['card-005', 'card-006', 'card-007', 'card-008', 'card-010'],
    gradient: 'linear-gradient(135deg, #1a3a2a, #0a2a1a, #00ff8844)',
    emoji: '📦',
  },
  {
    id: 'pack-002',
    name: 'Воинский Сундук',
    description: 'Набор для опытных бойцов. Шанс получить A-ранг карту!',
    price: 350,
    cardCount: 5,
    cardIds: ['card-003', 'card-004', 'card-005', 'card-006', 'card-009'],
    gradient: 'linear-gradient(135deg, #3a2a00, #2a1a00, #ffd70044)',
    emoji: '⚔️',
  },
  {
    id: 'pack-003',
    name: 'Тёмный Ритуал',
    description: 'Редчайший набор. Гарантированная S-ранг карта!',
    price: 1000,
    cardCount: 5,
    cardIds: ['card-001', 'card-002', 'card-003', 'card-004', 'card-009'],
    gradient: 'linear-gradient(135deg, #2a003a, #1a0020, #ff00ff44)',
    emoji: '🔮',
  },
  {
    id: 'pack-004',
    name: 'Свиной Джекпот',
    description: 'Крути рулетку удачи! Может выпасть ЧТО УГОДНО.',
    price: 500,
    cardCount: 7,
    cardIds: ['card-001', 'card-002', 'card-003', 'card-004', 'card-005', 'card-006', 'card-007', 'card-008', 'card-009', 'card-010'],
    gradient: 'linear-gradient(135deg, #3a0a0a, #200a0a, #ff444444)',
    emoji: '🎰',
  },
];
