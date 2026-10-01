import { GameState, Unit, HexCell, HexCoord, TerrainType, TERRAIN_MOVE_COST } from './types';
import {
  hexKey, getAllHexes, getReachableHexes, getAttackableHexes,
  hexDistance, getHexesInRadius, getSpellTargets, isValidHex, getRowLength
} from './hexUtils';

function generateTerrain(q: number, r: number, units: Unit[]): TerrainType {
  // Клетки рядом с юнитами — всегда обычные
  const nearUnit = units.some(u => hexDistance({ q, r }, u.position) <= 1);
  if (nearUnit) return 'plain';

  const rand = Math.random();

  // Центральная зона — больше разнообразия
  const isCenter = r >= 6 && r <= 10;

  if (isCenter) {
    if (rand < 0.40) return 'plain';
    if (rand < 0.55) return 'forest';
    if (rand < 0.65) return 'shallow';
    if (rand < 0.72) return 'stones';
    if (rand < 0.80) return 'buildings';
    if (rand < 0.87) return 'fire';
    if (rand < 0.94) return 'deep';
    return 'cliffs';
  }

  // Крайние зоны — больше леса и камней
  if (rand < 0.50) return 'plain';
  if (rand < 0.68) return 'forest';
  if (rand < 0.78) return 'stones';
  if (rand < 0.85) return 'shallow';
  if (rand < 0.90) return 'buildings';
  if (rand < 0.94) return 'fire';
  if (rand < 0.97) return 'deep';
  return 'cliffs';
}

function createInitialUnits(): Unit[] {
  // Игрок слева (нечётные ряды имеют 17 гексов, чётные — 15)
  // Разместим в левой части карты
  return [
    // Player units (слева)
    { id: 'p1', name: 'Воин', team: 'player', hp: 12, maxHp: 12, attack: 4, moveRange: 3, position: { q: 1, r: 7 }, moved: false, attacked: false, type: 'warrior', emoji: '⚔️' },
    { id: 'p2', name: 'Лучник', team: 'player', hp: 8, maxHp: 8, attack: 3, moveRange: 3, position: { q: 0, r: 8 }, moved: false, attacked: false, type: 'archer', emoji: '🏹' },
    {
      id: 'p3', name: 'Маг', team: 'player', hp: 7, maxHp: 7, attack: 5, moveRange: 2,
      position: { q: 1, r: 9 }, moved: false, attacked: false, type: 'mage', emoji: '🔮',
      mana: 10, maxMana: 10,
      spells: [createLightningSpell(), createFireballSpell()],
    },
    { id: 'p4', name: 'Воин 2', team: 'player', hp: 12, maxHp: 12, attack: 4, moveRange: 3, position: { q: 0, r: 6 }, moved: false, attacked: false, type: 'warrior', emoji: '⚔️' },
    // Enemy units (справа)
    { id: 'e1', name: 'Орк', team: 'enemy', hp: 10, maxHp: 10, attack: 4, moveRange: 3, position: { q: 15, r: 7 }, moved: false, attacked: false, type: 'warrior', emoji: '👹' },
    { id: 'e2', name: 'Гоблин', team: 'enemy', hp: 7, maxHp: 7, attack: 3, moveRange: 4, position: { q: 16, r: 8 }, moved: false, attacked: false, type: 'archer', emoji: '👺' },
    {
      id: 'e3', name: 'Шаман', team: 'enemy', hp: 8, maxHp: 8, attack: 5, moveRange: 2,
      position: { q: 15, r: 9 }, moved: false, attacked: false, type: 'mage', emoji: '🧙',
      mana: 10, maxMana: 10,
      spells: [createLightningSpell(), createFireballSpell()],
    },
    { id: 'e4', name: 'Орк 2', team: 'enemy', hp: 10, maxHp: 10, attack: 4, moveRange: 3, position: { q: 16, r: 6 }, moved: false, attacked: false, type: 'warrior', emoji: '👹' },
  ];
}

function createLightningSpell() {
  return {
    id: 'lightning',
    name: 'Молния',
    emoji: '⚡',
    manaCost: 3,
    damage: 7,
    range: 5,
    cooldown: 2,
    currentCooldown: 0,
    aoe: 0,
    description: 'Поражает одну цель. Урон: 7, Дальность: 5',
  };
}

function createFireballSpell() {
  return {
    id: 'fireball',
    name: 'Огненный шар',
    emoji: '🔥',
    manaCost: 5,
    damage: 5,
    range: 4,
    cooldown: 3,
    currentCooldown: 0,
    aoe: 1,
    description: 'Взрыв по области (радиус 1). Урон: 5, Дальность: 4',
  };
}

export function initializeGame(): GameState {
  const units = createInitialUnits();
  const grid = new Map<string, HexCell>();
  const allHexes = getAllHexes();

  for (const coord of allHexes) {
    const key = hexKey(coord);
    const unitOnCell = units.find((u) => u.position.q === coord.q && u.position.r === coord.r);

    const terrain = unitOnCell ? 'plain' : generateTerrain(coord.q, coord.r, units);

    grid.set(key, {
      coord,
      terrain,
      unit: unitOnCell,
    });
  }

  return {
    grid,
    units,
    selectedUnit: null,
    turn: 'player',
    phase: 'select',
    turnNumber: 1,
    gameOver: false,
    winner: null,
    message: 'Ваш ход! Выберите юнита.',
    reachableHexes: [],
    attackableHexes: [],
    selectedSpell: null,
    spellTargets: [],
    lastSpellEffect: null,
  };
}

export function selectUnit(state: GameState, unit: Unit): GameState {
  if (unit.team !== state.turn) return state;
  if (unit.moved && unit.attacked) return { ...state, message: 'Этот юнит уже действовал.' };

  const reachable = !unit.moved
    ? getReachableHexes(unit.position, unit.moveRange, state.grid, state.units)
    : [];
  const attackable = !unit.attacked
    ? getAttackableHexes(unit, state.units)
    : [];

  return {
    ...state,
    selectedUnit: unit,
    selectedSpell: null,
    spellTargets: [],
    phase: reachable.length > 0 ? 'move' : attackable.length > 0 ? 'attack' : 'select',
    reachableHexes: reachable,
    attackableHexes: attackable,
    message: `Выбран: ${unit.name}. ${unit.mana !== undefined ? `Мана: ${unit.mana}/${unit.maxMana}. ` : ''}${reachable.length > 0 ? 'Кликните на клетку для перемещения.' : ''} ${attackable.length > 0 ? 'Кликните на врага для атаки.' : ''}`,
  };
}

export function moveUnit(state: GameState, target: HexCoord): GameState {
  if (!state.selectedUnit || state.selectedUnit.moved) return state;

  const isReachable = state.reachableHexes.some(
    (h) => h.q === target.q && h.r === target.r
  );
  if (!isReachable) return state;

  const unit = { ...state.selectedUnit, position: target, moved: true };
  const units = state.units.map((u) => (u.id === unit.id ? unit : u));

  const newGrid = new Map(state.grid);
  const oldKey = hexKey(state.selectedUnit.position);
  const newKey = hexKey(target);
  const oldCell = newGrid.get(oldKey);
  const newCell = newGrid.get(newKey);
  if (oldCell) newGrid.set(oldKey, { ...oldCell, unit: undefined });
  if (newCell) newGrid.set(newKey, { ...newCell, unit });

  const attackable = !unit.attacked ? getAttackableHexes(unit, units) : [];

  return {
    ...state,
    units,
    selectedUnit: unit,
    grid: newGrid,
    phase: attackable.length > 0 ? 'attack' : 'select',
    reachableHexes: [],
    attackableHexes: attackable,
    message: attackable.length > 0
      ? `${unit.name} переместился. Можете атаковать!`
      : `${unit.name} переместился.`,
  };
}

export function attackUnit(state: GameState, target: HexCoord): GameState {
  if (!state.selectedUnit || state.selectedUnit.attacked) return state;

  const isAttackable = state.attackableHexes.some(
    (h) => h.q === target.q && h.r === target.r
  );
  if (!isAttackable) return state;

  const attacker = { ...state.selectedUnit, attacked: true, moved: true };
  const targetUnit = state.units.find(
    (u) => u.position.q === target.q && u.position.r === target.r && u.hp > 0
  );
  if (!targetUnit) return state;

  // Бонус защиты от местности
  const targetCell = state.grid.get(hexKey(target));
  const defenseBonus = targetCell ? (targetCell.terrain === 'buildings' ? 2 : targetCell.terrain === 'forest' || targetCell.terrain === 'stones' ? 1 : 0) : 0;

  const rawDamage = Math.max(1, attacker.attack + Math.floor(Math.random() * 3) - 1);
  const damage = Math.max(1, rawDamage - defenseBonus);
  const newHp = Math.max(0, targetUnit.hp - damage);
  const updatedTarget = { ...targetUnit, hp: newHp };

  let units = state.units.map((u) => {
    if (u.id === attacker.id) return attacker;
    if (u.id === targetUnit.id) return updatedTarget;
    return u;
  });

  const newGrid = new Map(state.grid);
  const targetKey = hexKey(target);
  const targetCellRef = newGrid.get(targetKey);
  if (targetCellRef) {
    newGrid.set(targetKey, { ...targetCellRef, unit: newHp > 0 ? updatedTarget : undefined });
  }

  const playerAlive = units.filter((u) => u.team === 'player' && u.hp > 0);
  const enemyAlive = units.filter((u) => u.team === 'enemy' && u.hp > 0);

  let gameOver = false;
  let winner: 'player' | 'enemy' | null = null;
  let message = `${attacker.name} нанёс ${damage} урона!`;
  if (defenseBonus > 0) message += ` (−${defenseBonus} защита местности)`;

  if (enemyAlive.length === 0) {
    gameOver = true;
    winner = 'player';
    message = '🎉 Победа! Все враги повержены!';
  } else if (playerAlive.length === 0) {
    gameOver = true;
    winner = 'enemy';
    message = '💀 Поражение! Все ваши юниты погибли.';
  } else if (newHp <= 0) {
    message += ` ${targetUnit.name} уничтожен!`;
  }

  return {
    ...state,
    units,
    grid: newGrid,
    selectedUnit: attacker,
    phase: 'select',
    reachableHexes: [],
    attackableHexes: [],
    selectedSpell: null,
    spellTargets: [],
    gameOver,
    winner,
    message,
  };
}

export function selectSpell(state: GameState, spellId: string): GameState {
  if (!state.selectedUnit || state.selectedUnit.type !== 'mage') return state;
  if (state.selectedUnit.attacked) return { ...state, message: 'Этот юнит уже действовал.' };

  const unit = state.selectedUnit;
  const spell = unit.spells?.find(s => s.id === spellId);
  if (!spell) return state;

  if (spell.currentCooldown > 0) {
    return { ...state, message: `${spell.name} на перезарядке (${spell.currentCooldown} ходов).` };
  }
  if ((unit.mana ?? 0) < spell.manaCost) {
    return { ...state, message: `Недостаточно маны для ${spell.name}! Нужно: ${spell.manaCost}.` };
  }

  const spellTargets = getSpellTargets(
    { position: unit.position, range: spell.range },
    state.grid,
    state.units
  );

  return {
    ...state,
    phase: 'spell',
    selectedSpell: spell,
    spellTargets,
    reachableHexes: [],
    attackableHexes: [],
    message: `${spell.emoji} ${spell.name} выбрана. Выберите цель (дальность: ${spell.range}).`,
  };
}

export function castSpell(state: GameState, target: HexCoord): GameState {
  if (!state.selectedUnit || !state.selectedSpell) return state;

  const isTarget = state.spellTargets.some(
    (h) => h.q === target.q && h.r === target.r
  );
  if (!isTarget) return state;

  const caster = { ...state.selectedUnit };
  const spell = state.selectedSpell;

  caster.mana = (caster.mana ?? 0) - spell.manaCost;
  caster.attacked = true;
  caster.moved = true;

  const updatedSpells = caster.spells?.map(s =>
    s.id === spell.id ? { ...s, currentCooldown: s.cooldown } : s
  );
  caster.spells = updatedSpells;

  const affectedHexes = spell.aoe > 0
    ? getHexesInRadius(target, spell.aoe)
    : [target];

  let units = [...state.units];
  const newGrid = new Map(state.grid);
  let totalDamage = 0;
  let killedNames: string[] = [];

  for (const hex of affectedHexes) {
    if (!isValidHex(hex.q, hex.r)) continue;
    const unitOnHex = units.find(
      u => u.position.q === hex.q && u.position.r === hex.r && u.hp > 0
    );

    if (unitOnHex) {
      if (unitOnHex.id === caster.id) continue;

      const damage = Math.max(1, spell.damage + Math.floor(Math.random() * 3) - 1);
      const newHp = Math.max(0, unitOnHex.hp - damage);
      totalDamage += damage;

      units = units.map(u =>
        u.id === unitOnHex.id ? { ...u, hp: newHp } : u
      );

      const hexKeyStr = hexKey(hex);
      const cell = newGrid.get(hexKeyStr);
      if (cell) {
        newGrid.set(hexKeyStr, { ...cell, unit: newHp > 0 ? { ...unitOnHex, hp: newHp } : undefined });
      }

      if (newHp <= 0) {
        killedNames.push(unitOnHex.name);
      }
    }
  }

  units = units.map(u => u.id === caster.id ? caster : u);

  let message = `${spell.emoji} ${caster.name} кастует ${spell.name}!`;
  if (spell.aoe > 0) {
    message += ` Урон по области: ${totalDamage}.`;
  } else {
    message += ` Урон: ${totalDamage}.`;
  }
  if (killedNames.length > 0) {
    message += ` Уничтожены: ${killedNames.join(', ')}!`;
  }

  const playerAlive = units.filter((u) => u.team === 'player' && u.hp > 0);
  const enemyAlive = units.filter((u) => u.team === 'enemy' && u.hp > 0);

  let gameOver = false;
  let winner: 'player' | 'enemy' | null = null;

  if (enemyAlive.length === 0) {
    gameOver = true;
    winner = 'player';
    message = '🎉 Победа! Все враги повержены!';
  } else if (playerAlive.length === 0) {
    gameOver = true;
    winner = 'enemy';
    message = '💀 Поражение! Все ваши юниты погибли.';
  }

  return {
    ...state,
    units,
    grid: newGrid,
    selectedUnit: caster,
    selectedSpell: null,
    spellTargets: [],
    phase: 'select',
    reachableHexes: [],
    attackableHexes: [],
    gameOver,
    winner,
    message,
    lastSpellEffect: {
      hexes: affectedHexes,
      type: spell.id === 'lightning' ? 'lightning' : 'fireball',
      timestamp: Date.now(),
    },
  };
}

export function cancelSpellSelection(state: GameState): GameState {
  const attackable = state.selectedUnit && !state.selectedUnit.attacked
    ? getAttackableHexes(state.selectedUnit, state.units)
    : [];

  return {
    ...state,
    phase: attackable.length > 0 ? 'attack' : 'select',
    selectedSpell: null,
    spellTargets: [],
    attackableHexes: attackable,
    message: state.selectedUnit ? `${state.selectedUnit.name} выбран. Выберите действие.` : 'Выберите юнита.',
  };
}

export function endTurn(state: GameState): GameState {
  if (state.turn === 'player') {
    const units = state.units.map((u) => {
      if (u.team === 'enemy') {
        const newSpells = u.spells?.map(s => ({
          ...s,
          currentCooldown: Math.max(0, s.currentCooldown - 1),
        }));
        return {
          ...u,
          moved: false,
          attacked: false,
          mana: Math.min(u.maxMana ?? 10, (u.mana ?? 0) + 2),
          spells: newSpells,
        };
      }
      return u;
    });
    return {
      ...state,
      units,
      turn: 'enemy',
      selectedUnit: null,
      selectedSpell: null,
      spellTargets: [],
      phase: 'select',
      reachableHexes: [],
      attackableHexes: [],
      message: 'Ход противника...',
    };
  } else {
    const units = state.units.map((u) => {
      if (u.team === 'player') {
        const newSpells = u.spells?.map(s => ({
          ...s,
          currentCooldown: Math.max(0, s.currentCooldown - 1),
        }));
        return {
          ...u,
          moved: false,
          attacked: false,
          mana: Math.min(u.maxMana ?? 10, (u.mana ?? 0) + 2),
          spells: newSpells,
        };
      }
      return u;
    });
    return {
      ...state,
      units,
      turn: 'player',
      turnNumber: state.turnNumber + 1,
      selectedUnit: null,
      selectedSpell: null,
      spellTargets: [],
      phase: 'select',
      reachableHexes: [],
      attackableHexes: [],
      message: `Ход ${state.turnNumber + 1}. Выберите юнита.`,
    };
  }
}

function enemyTryCastSpell(
  enemy: Unit,
  units: Unit[],
  _grid: Map<string, HexCell>
): { target: HexCoord; spell: any } | null {
  if (!enemy.spells || enemy.type !== 'mage') return null;

  const players = units.filter(u => u.team === 'player' && u.hp > 0);
  if (players.length === 0) return null;

  for (const spell of enemy.spells) {
    if (spell.currentCooldown > 0) continue;
    if ((enemy.mana ?? 0) < spell.manaCost) continue;

    let bestTarget: HexCoord | null = null;
    let bestScore = -1;

    for (const player of players) {
      const dist = hexDistance(enemy.position, player.position);
      if (dist > spell.range) continue;

      if (spell.aoe > 0) {
        const aoeHexes = getHexesInRadius(player.position, spell.aoe);
        let hits = 0;
        for (const hex of aoeHexes) {
          if (players.some(p => p.position.q === hex.q && p.position.r === hex.r)) {
            hits++;
          }
        }
        const score = hits * 10 - dist;
        if (score > bestScore) {
          bestScore = score;
          bestTarget = player.position;
        }
      } else {
        const score = (player.maxHp - player.hp + 5) * 5 - dist;
        if (score > bestScore) {
          bestScore = score;
          bestTarget = player.position;
        }
      }
    }

    if (bestTarget && bestScore > 0) {
      return { target: bestTarget, spell };
    }
  }

  return null;
}

function applySpellDamage(
  state: GameState,
  caster: Unit,
  spell: any,
  target: HexCoord
): GameState {
  const affectedHexes = spell.aoe > 0
    ? getHexesInRadius(target, spell.aoe)
    : [target];

  let units = [...state.units];
  const newGrid = new Map(state.grid);

  for (const hex of affectedHexes) {
    if (!isValidHex(hex.q, hex.r)) continue;
    const unitOnHex = units.find(
      u => u.position.q === hex.q && u.position.r === hex.r && u.hp > 0
    );

    if (unitOnHex && unitOnHex.id !== caster.id) {
      const damage = Math.max(1, spell.damage + Math.floor(Math.random() * 3) - 1);
      const newHp = Math.max(0, unitOnHex.hp - damage);

      units = units.map(u =>
        u.id === unitOnHex.id ? { ...u, hp: newHp } : u
      );

      const hexKeyStr = hexKey(hex);
      const cell = newGrid.get(hexKeyStr);
      if (cell) {
        newGrid.set(hexKeyStr, { ...cell, unit: newHp > 0 ? { ...unitOnHex, hp: newHp } : undefined });
      }
    }
  }

  return { ...state, units, grid: newGrid };
}

export function executeEnemyTurn(state: GameState): GameState {
  let currentState = { ...state };
  const enemies = currentState.units.filter(
    (u) => u.team === 'enemy' && u.hp > 0
  );

  for (const enemy of enemies) {
    const currentUnit = currentState.units.find((u) => u.id === enemy.id)!;
    if (currentUnit.hp <= 0) continue;

    const players = currentState.units.filter(u => u.team === 'player' && u.hp > 0);
    if (players.length === 0) break;

    let closestPlayer = players
      .sort((a, b) => hexDistance(currentUnit.position, a.position) - hexDistance(currentUnit.position, b.position))[0];

    if (!closestPlayer) continue;

    // Try to cast spell first
    if (currentUnit.type === 'mage') {
      const spellResult = enemyTryCastSpell(currentUnit, currentState.units, currentState.grid);
      if (spellResult) {
        const updatedCaster = {
          ...currentUnit,
          mana: (currentUnit.mana ?? 0) - spellResult.spell.manaCost,
          attacked: true,
          moved: true,
          spells: currentUnit.spells?.map((s: any) =>
            s.id === spellResult.spell.id ? { ...s, currentCooldown: s.cooldown } : s
          ),
        };

        currentState = {
          ...currentState,
          units: currentState.units.map(u => u.id === updatedCaster.id ? updatedCaster : u),
        };

        currentState = applySpellDamage(currentState, updatedCaster, spellResult.spell, spellResult.target);
        currentState = {
          ...currentState,
          lastSpellEffect: {
            hexes: spellResult.spell.aoe > 0 ? getHexesInRadius(spellResult.target, spellResult.spell.aoe) : [spellResult.target],
            type: spellResult.spell.id === 'lightning' ? 'lightning' : 'fireball',
            timestamp: Date.now(),
          },
        };
        continue;
      }
    }

    // Regular attack
    const attackRange = currentUnit.type === 'archer' ? 3 : currentUnit.type === 'mage' ? 2 : 1;
    const minDist = hexDistance(currentUnit.position, closestPlayer.position);

    if (minDist <= attackRange) {
      const damage = Math.max(1, currentUnit.attack + Math.floor(Math.random() * 3) - 1);
      const target = currentState.units.find((u) => u.id === closestPlayer.id)!;
      const newHp = Math.max(0, target.hp - damage);

      currentState = {
        ...currentState,
        units: currentState.units.map((u) => {
          if (u.id === target.id) return { ...u, hp: newHp };
          return u;
        }),
      };

      const targetKey = hexKey(target.position);
      const targetCell = currentState.grid.get(targetKey);
      if (targetCell) {
        const newGrid = new Map(currentState.grid);
        newGrid.set(targetKey, { ...targetCell, unit: newHp > 0 ? { ...target, hp: newHp } : undefined });
        currentState = { ...currentState, grid: newGrid };
      }
    } else {
      // Move towards closest player
      const reachable = getReachableHexes(
        currentUnit.position,
        currentUnit.moveRange,
        currentState.grid,
        currentState.units
      );

      if (reachable.length > 0) {
        let bestHex = reachable[0];
        let bestDist = hexDistance(reachable[0], closestPlayer.position);
        for (const hex of reachable) {
          const dist = hexDistance(hex, closestPlayer.position);
          if (dist < bestDist) {
            bestDist = dist;
            bestHex = hex;
          }
        }

        const newGrid = new Map(currentState.grid);
        const oldKey = hexKey(currentUnit.position);
        const newKey = hexKey(bestHex);
        const oldCell = newGrid.get(oldKey);
        const newCell = newGrid.get(newKey);
        if (oldCell) newGrid.set(oldKey, { ...oldCell, unit: undefined });
        if (newCell) newGrid.set(newKey, { ...newCell, unit: { ...currentUnit, position: bestHex } });

        currentState = {
          ...currentState,
          units: currentState.units.map((u) =>
            u.id === currentUnit.id ? { ...u, position: bestHex } : u
          ),
          grid: newGrid,
        };

        const newDist = hexDistance(bestHex, closestPlayer.position);
        if (newDist <= attackRange) {
          const damage = Math.max(1, currentUnit.attack + Math.floor(Math.random() * 3) - 1);
          const target = currentState.units.find((u) => u.id === closestPlayer.id)!;
          const targetNewHp = Math.max(0, target.hp - damage);

          const newGrid2 = new Map(currentState.grid);
          const targetKey2 = hexKey(target.position);
          const targetCell2 = newGrid2.get(targetKey2);
          if (targetCell2) {
            newGrid2.set(targetKey2, { ...targetCell2, unit: targetNewHp > 0 ? { ...target, hp: targetNewHp } : undefined });
          }

          currentState = {
            ...currentState,
            units: currentState.units.map((u) => {
              if (u.id === target.id) return { ...u, hp: targetNewHp };
              return u;
            }),
            grid: newGrid2,
          };
        }
      }
    }
  }

  const playerAlive = currentState.units.filter((u) => u.team === 'player' && u.hp > 0);
  if (playerAlive.length === 0) {
    return {
      ...currentState,
      gameOver: true,
      winner: 'enemy',
      message: '💀 Поражение! Все ваши юниты погибли.',
    };
  }

  return {
    ...currentState,
    message: `Ход ${currentState.turnNumber + 1}. Выберите юнита.`,
  };
}
