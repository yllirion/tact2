export interface HexCoord {
  q: number;
  r: number;
}

export interface Spell {
  id: string;
  name: string;
  emoji: string;
  manaCost: number;
  damage: number;
  range: number;
  cooldown: number;
  currentCooldown: number;
  aoe: number; // 0 = single target, 1+ = radius
  description: string;
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
  mana?: number;
  maxMana?: number;
  spells?: Spell[];
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
  phase: 'select' | 'move' | 'attack' | 'spell';
  turnNumber: number;
  gameOver: boolean;
  winner: 'player' | 'enemy' | null;
  message: string;
  reachableHexes: HexCoord[];
  attackableHexes: HexCoord[];
  selectedSpell: Spell | null;
  spellTargets: HexCoord[];
  lastSpellEffect: { hexes: HexCoord[]; type: 'lightning' | 'fireball'; timestamp: number } | null;
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
