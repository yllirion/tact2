import { HexCoord, TERRAIN_MOVE_COST } from './types';

// Map dimensions: 17 rows
// Чётные ряды (r=0,2,4...) — полные, 17 гексов
// Нечётные ряды (r=1,3,5...) — укороченные, 16 гексов (смещены вправо)
export const MAP_ROWS = 17;
export const MAP_COLS_EVEN = 17; // чётные ряды (r=0,2,4...)
export const MAP_COLS_ODD = 16; // нечётные ряды (r=1,3,5...)

export function getRowLength(r: number): number {
  return r % 2 === 0 ? MAP_COLS_EVEN : MAP_COLS_ODD;
}

export function isValidHex(q: number, r: number): boolean {
  if (r < 0 || r >= MAP_ROWS) return false;
  const rowLen = getRowLength(r);
  return q >= 0 && q < rowLen;
}

export function hexKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}

export function parseHexKey(key: string): HexCoord {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

// Even-r offset neighbors
// Чётные ряды (r=0,2,4...) — полные, 17 гексов, без смещения
// Нечётные ряды (r=1,3,5...) — укороченные, 16 гексов, смещены вправо
const EVEN_R_DIRECTION_EVEN = [
  { dq: -1, dr: -1 }, { dq: 0, dr: -1 },  // верх
  { dq: -1, dr: 0 },  { dq: 1, dr: 0 },    // лево/право
  { dq: -1, dr: 1 },  { dq: 0, dr: 1 },    // низ
];

const EVEN_R_DIRECTION_ODD = [
  { dq: 0, dr: -1 },  { dq: 1, dr: -1 },   // верх
  { dq: -1, dr: 0 },  { dq: 1, dr: 0 },    // лево/право
  { dq: 0, dr: 1 },   { dq: 1, dr: 1 },    // низ
];

export function hexNeighbors(coord: HexCoord): HexCoord[] {
  const dirs = coord.r % 2 === 0 ? EVEN_R_DIRECTION_EVEN : EVEN_R_DIRECTION_ODD;
  return dirs
    .map(d => ({ q: coord.q + d.dq, r: coord.r + d.dr }))
    .filter(h => isValidHex(h.q, h.r));
}

// Convert even-r offset to cube coordinates for distance calculation
function offsetToCube(coord: HexCoord): { x: number; y: number; z: number } {
  const x = coord.q - Math.floor(coord.r / 2);
  const z = coord.r;
  const y = -x - z;
  return { x, y, z };
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  const ac = offsetToCube(a);
  const bc = offsetToCube(b);
  return Math.max(
    Math.abs(ac.x - bc.x),
    Math.abs(ac.y - bc.y),
    Math.abs(ac.z - bc.z)
  );
}

// Convert even-r offset to pixel (pointy-top hexagons)
export function hexToPixel(coord: HexCoord, size: number): { x: number; y: number } {
  // Нечётные ряды (укороченные) смещены вправо на половину ширины гекса
  const xOffset = coord.r % 2 === 0 ? 0 : 0.5;
  const x = size * Math.sqrt(3) * (coord.q + xOffset);
  const y = size * 1.5 * coord.r;
  return { x, y };
}

// Get all hexes on the map
export function getAllHexes(): HexCoord[] {
  const results: HexCoord[] = [];
  for (let r = 0; r < MAP_ROWS; r++) {
    const rowLen = getRowLength(r);
    for (let q = 0; q < rowLen; q++) {
      results.push({ q, r });
    }
  }
  return results;
}

// Get reachable hexes using BFS (for movement)
export function getReachableHexes(
  start: HexCoord,
  moveRange: number,
  grid: Map<string, { terrain: string; unit?: any }>,
  units: any[]
): HexCoord[] {
  const visited = new Map<string, number>();
  const queue: { coord: HexCoord; cost: number }[] = [{ coord: start, cost: 0 }];
  visited.set(hexKey(start), 0);
  const result: HexCoord[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = hexNeighbors(current.coord);

    for (const neighbor of neighbors) {
      const key = hexKey(neighbor);
      const cell = grid.get(key);
      if (!cell) continue;

      const terrainCost = TERRAIN_MOVE_COST[cell.terrain as keyof typeof TERRAIN_MOVE_COST] ?? 99;
      const newCost = current.cost + terrainCost;

      if (newCost > moveRange) continue;
      if (visited.has(key) && visited.get(key)! <= newCost) continue;

      // Can't move through enemy units
      const unitOnCell = units.find(
        (u) => u.position.q === neighbor.q && u.position.r === neighbor.r && u.hp > 0
      );
      if (unitOnCell && unitOnCell.team !== 'player') continue;

      visited.set(key, newCost);
      queue.push({ coord: neighbor, cost: newCost });

      // Can only stop on empty cells or own position
      if (!unitOnCell || (unitOnCell.position.q === start.q && unitOnCell.position.r === start.r)) {
        if (!result.find((h) => h.q === neighbor.q && h.r === neighbor.r)) {
          result.push(neighbor);
        }
      }
    }
  }

  return result;
}

// Get attackable hexes
export function getAttackableHexes(
  unit: { position: HexCoord; type: string; team: string },
  units: any[]
): HexCoord[] {
  const range = unit.type === 'archer' ? 3 : unit.type === 'mage' ? 2 : 1;
  const result: HexCoord[] = [];

  for (const other of units) {
    if (other.team === unit.team || other.hp <= 0) continue;
    const dist = hexDistance(unit.position, other.position);
    if (dist <= range && dist > 0) {
      result.push(other.position);
    }
  }

  return result;
}

// Get all hexes within a given radius (for AoE)
export function getHexesInRadius(center: HexCoord, radius: number): HexCoord[] {
  const results: HexCoord[] = [];
  const allHexes = getAllHexes();
  for (const hex of allHexes) {
    if (hexDistance(center, hex) <= radius) {
      results.push(hex);
    }
  }
  return results;
}

// Get spell target hexes (within range of caster)
export function getSpellTargets(
  caster: { position: HexCoord; range: number },
  grid: Map<string, any>,
  _units: any[]
): HexCoord[] {
  const results: HexCoord[] = [];
  const allHexes = Array.from(grid.keys());

  for (const key of allHexes) {
    const coord = parseHexKey(key);
    const dist = hexDistance(caster.position, coord);
    if (dist > 0 && dist <= caster.range) {
      results.push(coord);
    }
  }

  return results;
}
