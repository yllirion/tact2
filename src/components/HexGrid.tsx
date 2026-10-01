import React from 'react';
import { HexCell, Unit, HexCoord, TERRAIN_COLORS, TERRAIN_EMOJI, Spell, TerrainType } from '../game/types';
import { hexToPixel, hexKey } from '../game/hexUtils';

interface HexGridProps {
  cells: Map<string, HexCell>;
  units: Unit[];
  selectedUnit: Unit | null;
  reachableHexes: HexCoord[];
  attackableHexes: HexCoord[];
  spellTargets: HexCoord[];
  selectedSpell: Spell | null;
  lastSpellEffect: { hexes: HexCoord[]; type: 'lightning' | 'fireball'; timestamp: number } | null;
  onHexClick: (coord: HexCoord) => void;
  hexSize: number;
}

function getHexPoints(size: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const x = size * Math.cos(angle);
    const y = size * Math.sin(angle);
    points.push(`${x},${y}`);
  }
  return points.join(' ');
}

// Проверяем, является ли местность "тёмной" (для контраста эмодзи)
function isDarkTerrain(terrain: TerrainType): boolean {
  return terrain === 'deep' || terrain === 'cliffs' || terrain === 'buildings';
}

const HexGrid: React.FC<HexGridProps> = ({
  cells,
  units,
  selectedUnit,
  reachableHexes,
  attackableHexes,
  spellTargets,
  selectedSpell,
  lastSpellEffect,
  onHexClick,
  hexSize,
}) => {
  const hexPoints = getHexPoints(hexSize);

  // Calculate bounds for SVG viewBox
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const [, cell] of cells) {
    const { x, y } = hexToPixel(cell.coord, hexSize);
    minX = Math.min(minX, x - hexSize);
    maxX = Math.max(maxX, x + hexSize);
    minY = Math.min(minY, y - hexSize);
    maxY = Math.max(maxY, y + hexSize);
  }

  const padding = hexSize;
  const viewBox = `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`;

  const showEffect = lastSpellEffect && (Date.now() - lastSpellEffect.timestamp < 800);

  return (
    <svg
      viewBox={viewBox}
      className="w-full h-full max-h-[75vh]"
      style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
    >
      {Array.from(cells.values()).map((cell) => {
        const { x, y } = hexToPixel(cell.coord, hexSize);
        const key = hexKey(cell.coord);
        const isSelected = selectedUnit && selectedUnit.position.q === cell.coord.q && selectedUnit.position.r === cell.coord.r;
        const isReachable = reachableHexes.some((h) => h.q === cell.coord.q && h.r === cell.coord.r);
        const isAttackable = attackableHexes.some((h) => h.q === cell.coord.q && h.r === cell.coord.r);
        const isSpellTarget = spellTargets.some((h) => h.q === cell.coord.q && h.r === cell.coord.r);
        const isInEffect = showEffect && lastSpellEffect!.hexes.some(h => h.q === cell.coord.q && h.r === cell.coord.r);
        const unitOnCell = units.find(
          (u) => u.position.q === cell.coord.q && u.position.r === cell.coord.r && u.hp > 0
        );

        let fillColor = TERRAIN_COLORS[cell.terrain];
        let strokeColor = '#333';
        let strokeWidth = 1;

        if (isInEffect) {
          if (lastSpellEffect!.type === 'lightning') {
            fillColor = '#fef08a';
            strokeColor = '#facc15';
            strokeWidth = 3;
          } else {
            fillColor = '#f97316';
            strokeColor = '#dc2626';
            strokeWidth = 3;
          }
        } else if (isSelected) {
          strokeColor = '#ffd700';
          strokeWidth = 3;
        } else if (isSpellTarget) {
          if (selectedSpell?.id === 'lightning') {
            strokeColor = '#a855f7';
            strokeWidth = 2.5;
            // Слегка осветлим базовый цвет
            fillColor = cell.terrain === 'deep' ? '#4a60d9' : '#c084fc';
          } else {
            strokeColor = '#f97316';
            strokeWidth = 2.5;
            fillColor = '#fb923c';
          }
        } else if (isAttackable) {
          strokeColor = '#ff4444';
          strokeWidth = 3;
          fillColor = '#ff6b6b';
        } else if (isReachable) {
          strokeColor = '#44ff44';
          strokeWidth = 2;
          // Слегка осветлим базовый цвет
          fillColor = cell.terrain === 'deep' ? '#4ab0d9' : '#c8d870';
        }

        const terrainEmoji = TERRAIN_EMOJI[cell.terrain];

        return (
          <g
            key={key}
            transform={`translate(${x}, ${y})`}
            onClick={() => onHexClick(cell.coord)}
            className="cursor-pointer"
          >
            <polygon
              points={hexPoints}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              className="transition-all duration-150 hover:opacity-80"
            />
            {/* Spell effect overlay */}
            {isInEffect && (
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={hexSize * 0.8}
                className="pointer-events-none select-none animate-pulse"
              >
                {lastSpellEffect!.type === 'lightning' ? '⚡' : '💥'}
              </text>
            )}
            {/* Terrain decoration */}
            {!isInEffect && terrainEmoji && !unitOnCell && (
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={hexSize * 0.5}
                className="pointer-events-none select-none"
              >
                {terrainEmoji}
              </text>
            )}
            {/* Unit */}
            {unitOnCell && !isInEffect && (
              <>
                <circle
                  r={hexSize * 0.55}
                  fill={unitOnCell.team === 'player' ? 'rgba(59, 130, 246, 0.8)' : 'rgba(239, 68, 68, 0.8)'}
                  stroke={unitOnCell.team === 'player' ? '#1d4ed8' : '#991b1b'}
                  strokeWidth={2}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={hexSize * 0.5}
                  className="pointer-events-none select-none"
                >
                  {unitOnCell.emoji}
                </text>
                {/* HP bar */}
                <rect
                  x={-hexSize * 0.45}
                  y={hexSize * 0.35}
                  width={hexSize * 0.9}
                  height={hexSize * 0.12}
                  fill="#333"
                  rx={2}
                />
                <rect
                  x={-hexSize * 0.45}
                  y={hexSize * 0.35}
                  width={hexSize * 0.9 * (unitOnCell.hp / unitOnCell.maxHp)}
                  height={hexSize * 0.12}
                  fill={unitOnCell.hp / unitOnCell.maxHp > 0.5 ? '#22c55e' : unitOnCell.hp / unitOnCell.maxHp > 0.25 ? '#eab308' : '#ef4444'}
                  rx={2}
                />
                {/* Mana bar for mages */}
                {unitOnCell.mana !== undefined && unitOnCell.maxMana !== undefined && (
                  <>
                    <rect
                      x={-hexSize * 0.45}
                      y={hexSize * 0.5}
                      width={hexSize * 0.9}
                      height={hexSize * 0.08}
                      fill="#333"
                      rx={2}
                    />
                    <rect
                      x={-hexSize * 0.45}
                      y={hexSize * 0.5}
                      width={hexSize * 0.9 * (unitOnCell.mana / unitOnCell.maxMana)}
                      height={hexSize * 0.08}
                      fill="#3b82f6"
                      rx={2}
                    />
                  </>
                )}
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default HexGrid;
