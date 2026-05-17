export interface PlayerData {
  username: string;
  balance: number;
  ownedCardIds: string[];
}

export const playerData: PlayerData = {
  username: 'Игрок_228',
  balance: 1500,
  ownedCardIds: ['card-003', 'card-005', 'card-006', 'card-007', 'card-008', 'card-010'],
};
