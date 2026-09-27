export interface HexCoord {
  q: number;
  r: number;
}

export interface Unit {
  id: string;
  name: string;
  team: 'player' | 'enemy';
  hp: number;
  maxHp: number;
  attack: number;
  moveRange: number;
  position: HexCoord;
  moved: boolean;
  attacked: boolean;
  type: 'warrior' | 'archer' | 'mage';
  emoji: string;
}

export interface HexCell {
  coord: HexCoord;
  terrain: 'plain' | 'forest' | 'mountain' | 'water';
  unit?: Unit;
}

export interface GameState {
  grid: Map<string, HexCell>;
  units: Unit[];
  selectedUnit: Unit | null;
  turn: 'player' | 'enemy';
  phase: 'select' | 'move' | 'attack';
  turnNumber: number;
  gameOver: boolean;
  winner: 'player' | 'enemy' | null;
  message: string;
  reachableHexes: HexCoord[];
  attackableHexes: HexCoord[];
}

export const TERRAIN_COLORS: Record<string, string> = {
  plain: '#8fbc5a',
  forest: '#2d7a3a',
  mountain: '#8b7355',
  water: '#4a90d9',
};

export const TERRAIN_MOVE_COST: Record<string, number> = {
  plain: 1,
  forest: 2,
  mountain: 3,
  water: 99,
};
