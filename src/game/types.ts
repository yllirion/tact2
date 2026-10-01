export interface HexCoord {
  q: number; // column
  r: number; // row
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

export type TerrainType =
  | 'plain'        // Обычные — хаки
  | 'forest'       // Лес — зелёный
  | 'shallow'      // Мелководье — голубой
  | 'deep'         // Глубоководье — синий
  | 'stones'       // Камни — серый
  | 'cliffs'       // Скалы — чёрный
  | 'fire'         // Огонь — красный
  | 'buildings';   // Здания — тёмно-серый

export interface HexCell {
  coord: HexCoord;
  terrain: TerrainType;
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

export const TERRAIN_COLORS: Record<TerrainType, string> = {
  plain: '#b5a642',      // хаки
  forest: '#2d7a3a',     // зелёный
  shallow: '#7ec8e3',    // голубой
  deep: '#1a4d8f',       // синий
  stones: '#808080',     // серый
  cliffs: '#1a1a1a',     // чёрный
  fire: '#cc2200',       // красный
  buildings: '#3d3d3d',  // тёмно-серый
};

export const TERRAIN_EMOJI: Record<TerrainType, string> = {
  plain: '',
  forest: '🌲',
  shallow: '💧',
  deep: '🌊',
  stones: '🪨',
  cliffs: '⛰️',
  fire: '🔥',
  buildings: '🏠',
};

// Стоимость перемещения (99 = непроходимо)
export const TERRAIN_MOVE_COST: Record<TerrainType, number> = {
  plain: 1,
  forest: 2,
  shallow: 2,
  deep: 99,
  stones: 2,
  cliffs: 99,
  fire: 99,
  buildings: 1,
};

// Бонус защиты (снижение входящего урона)
export const TERRAIN_DEFENSE: Record<TerrainType, number> = {
  plain: 0,
  forest: 1,
  shallow: 0,
  deep: 0,
  stones: 1,
  cliffs: 0,
  fire: 0,
  buildings: 2,
};
