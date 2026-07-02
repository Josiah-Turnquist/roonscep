export interface ShopEntry {
  itemId: string;
  price: number;
}

export const SHOP: ShopEntry[] = [
  { itemId: 'shrimp', price: 10 },
  { itemId: 'trout', price: 45 },
  { itemId: 'lobster', price: 130 },
  { itemId: 'healing_elixir', price: 300 },
  { itemId: 'attack_potion', price: 150 },
  { itemId: 'strength_potion', price: 180 },
  { itemId: 'defence_potion', price: 160 },
  { itemId: 'bronze_sword', price: 60 },
  { itemId: 'bronze_helmet', price: 60 },
  { itemId: 'bronze_platebody', price: 180 },
  { itemId: 'bronze_platelegs', price: 120 },
  { itemId: 'wooden_shield', price: 50 },
  { itemId: 'leather_coif', price: 60 },
  { itemId: 'leather_body', price: 100 },
  { itemId: 'leather_chaps', price: 80 },
  { itemId: 'shortbow', price: 80 },
  { itemId: 'apprentice_staff', price: 100 },
  { itemId: 'adept_staff', price: 1600 },
  { itemId: 'master_staff', price: 8000 },
];
