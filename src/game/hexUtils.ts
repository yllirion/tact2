import { HexCoord } from './types';

// Axial coordinates hex utilities
export const HEX_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function hexKey(coord: HexCoord): string {
  return `${coord.q},${coord.r}`;
}

export function parseHexKey(key: string): HexCoord {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (
    (Math.abs(a.q - b.q) +
      Math.abs(a.q + a.r - b.q - b.r) +
      Math.abs(a.r - b.r)) /
    2
  );
}

export function hexNeighbors(coord: HexCoord): HexCoord[] {
  return HEX_DIRECTIONS.map((d) => ({
    q: coord.q + d.q,
    r: coord.r + d.r,
  }));
}

// Convert axial to pixel (pointy-top hexagons)
export function hexToPixel(coord: HexCoord, size: number): { x: number; y: number } {
  const x = size * (Math.sqrt(3) * coord.q + (Math.sqrt(3) / 2) * coord.r);
  const y = size * ((3 / 2) * coord.r);
  return { x, y };
}

// Get reachable hexes using BFS
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

      const terrainCost = cell.terrain === 'water' ? 99 : cell.terrain === 'mountain' ? 3 : cell.terrain === 'forest' ? 2 : 1;
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

export function generateHexGrid(radius: number): HexCoord[] {
  const results: HexCoord[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      results.push({ q, r });
    }
  }
  return results;
}
