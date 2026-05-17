export type CardRank = 'S' | 'A' | 'B' | 'C';

export interface Card {
  id: string;
  name: string;
  rank: CardRank;
  description: string;
  attack: number;
  defense: number;
  emoji: string; // placeholder for art
  gradient: string; // CSS gradient for card art background
  art_url?: string; // URL to card art image
  art_position?: string; // CSS object-position for art cropping (e.g. "top", "center", "bottom")
}

export const RANK_COLORS: Record<CardRank, { primary: string; glow: string; bg: string }> = {
  S: { primary: '#ff00ff', glow: '#ff00ff80', bg: 'linear-gradient(135deg, #ff00ff, #00ffff, #ff00ff, #ffff00)' },
  A: { primary: '#ffd700', glow: '#ffd70080', bg: 'linear-gradient(135deg, #ffd700, #ff8c00)' },
  B: { primary: '#c0c0c0', glow: '#c0c0c080', bg: 'linear-gradient(135deg, #c0c0c0, #8a8a8a)' },
  C: { primary: '#cd7f32', glow: '#cd7f3280', bg: 'linear-gradient(135deg, #cd7f32, #8b4513)' },
};

export const RANK_LABELS: Record<CardRank, string> = {
  S: 'Легендарная',
  A: 'Эпическая',
  B: 'Редкая',
  C: 'Обычная',
};

export const cards: Card[] = [
  {
    id: 'card-001',
    name: 'Хейни-Берсерк',
    rank: 'S',
    description: 'Древний воин, пробуждённый гневом тысячи свиней. Его топор рассекает саму реальность.',
    attack: 99,
    defense: 45,
    emoji: '⚔️',
    gradient: 'linear-gradient(135deg, #1a0030, #4a0080, #ff00ff22)',
  },
  {
    id: 'card-002',
    name: 'Свинамант',
    rank: 'S',
    description: 'Повелитель тёмных искусств. Его заклинания обращают врагов в бекон.',
    attack: 85,
    defense: 70,
    emoji: '🔮',
    gradient: 'linear-gradient(135deg, #0a0030, #2a0060, #8000ff22)',
  },
  {
    id: 'card-003',
    name: 'Пятачок-Ронин',
    rank: 'A',
    description: 'Мастер клинка без хозяина. Бродит по землям в поисках достойного противника.',
    attack: 72,
    defense: 55,
    emoji: '🗡️',
    gradient: 'linear-gradient(135deg, #1a1a00, #3a3a00, #ffd70022)',
  },
  {
    id: 'card-004',
    name: 'Хрюно-Механик',
    rank: 'A',
    description: 'Гений инженерии. Собирает боевых мехов из мусора и желудей.',
    attack: 60,
    defense: 80,
    emoji: '⚙️',
    gradient: 'linear-gradient(135deg, #1a1000, #3a2000, #ff880022)',
  },
  {
    id: 'card-005',
    name: 'Свино-Лучник',
    rank: 'B',
    description: 'Меткий стрелок из Дубового леса. Никогда не промахивается... почти.',
    attack: 55,
    defense: 35,
    emoji: '🏹',
    gradient: 'linear-gradient(135deg, #001a0a, #003a1a, #00ff8822)',
  },
  {
    id: 'card-006',
    name: 'Хряк-Щитоносец',
    rank: 'B',
    description: 'Непробиваемая стена из сала и стали. Защитит любого союзника.',
    attack: 30,
    defense: 75,
    emoji: '🛡️',
    gradient: 'linear-gradient(135deg, #0a0a1a, #1a1a3a, #4488ff22)',
  },
  {
    id: 'card-007',
    name: 'Поросёнок-Скаут',
    rank: 'C',
    description: 'Шустрый разведчик. Маленький, но очень наглый.',
    attack: 25,
    defense: 20,
    emoji: '🐽',
    gradient: 'linear-gradient(135deg, #1a0a0a, #3a1a1a, #ff444422)',
  },
  {
    id: 'card-008',
    name: 'Свинка-Травница',
    rank: 'C',
    description: 'Лечит раны отваром из трюфелей. Мирная, но полезная.',
    attack: 15,
    defense: 40,
    emoji: '🌿',
    gradient: 'linear-gradient(135deg, #0a1a0a, #1a3a1a, #44ff4422)',
  },
  {
    id: 'card-009',
    name: 'Кабан-Алхимик',
    rank: 'A',
    description: 'Превращает грязь в золото, а золото — в ещё больше грязи. Странный тип.',
    attack: 65,
    defense: 50,
    emoji: '⚗️',
    gradient: 'linear-gradient(135deg, #1a1a00, #2a2a10, #aaff0022)',
  },
  {
    id: 'card-010',
    name: 'Пятак-Призрак',
    rank: 'B',
    description: 'Бывший фермер, ставший неупокоенным духом. Пугает, но не кусает.',
    attack: 45,
    defense: 45,
    emoji: '👻',
    gradient: 'linear-gradient(135deg, #0a0a1a, #1a1a2a, #aaaaff22)',
  },
];
