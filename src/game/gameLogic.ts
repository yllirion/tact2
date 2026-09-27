import { GameState, Unit, HexCell, HexCoord } from './types';
import { hexKey, generateHexGrid, getReachableHexes, getAttackableHexes, hexDistance } from './hexUtils';

function generateTerrain(): 'plain' | 'forest' | 'mountain' | 'water' {
  const rand = Math.random();
  if (rand < 0.55) return 'plain';
  if (rand < 0.78) return 'forest';
  if (rand < 0.92) return 'mountain';
  return 'water';
}

function createInitialUnits(): Unit[] {
  return [
    // Player units
    { id: 'p1', name: 'Воин', team: 'player', hp: 12, maxHp: 12, attack: 4, moveRange: 3, position: { q: -3, r: 0 }, moved: false, attacked: false, type: 'warrior', emoji: '⚔️' },
    { id: 'p2', name: 'Лучник', team: 'player', hp: 8, maxHp: 8, attack: 3, moveRange: 3, position: { q: -3, r: 1 }, moved: false, attacked: false, type: 'archer', emoji: '🏹' },
    { id: 'p3', name: 'Маг', team: 'player', hp: 7, maxHp: 7, attack: 5, moveRange: 2, position: { q: -2, r: 0 }, moved: false, attacked: false, type: 'mage', emoji: '🔮' },
    { id: 'p4', name: 'Воин 2', team: 'player', hp: 12, maxHp: 12, attack: 4, moveRange: 3, position: { q: -2, r: 1 }, moved: false, attacked: false, type: 'warrior', emoji: '⚔️' },
    // Enemy units
    { id: 'e1', name: 'Орк', team: 'enemy', hp: 10, maxHp: 10, attack: 4, moveRange: 3, position: { q: 3, r: 0 }, moved: false, attacked: false, type: 'warrior', emoji: '👹' },
    { id: 'e2', name: 'Гоблин', team: 'enemy', hp: 7, maxHp: 7, attack: 3, moveRange: 4, position: { q: 3, r: -1 }, moved: false, attacked: false, type: 'archer', emoji: '👺' },
    { id: 'e3', name: 'Шаман', team: 'enemy', hp: 8, maxHp: 8, attack: 5, moveRange: 2, position: { q: 2, r: 0 }, moved: false, attacked: false, type: 'mage', emoji: '🧙' },
    { id: 'e4', name: 'Орк 2', team: 'enemy', hp: 10, maxHp: 10, attack: 4, moveRange: 3, position: { q: 2, r: 1 }, moved: false, attacked: false, type: 'warrior', emoji: '👹' },
  ];
}

export function initializeGame(): GameState {
  const hexCoords = generateHexGrid(4);
  const grid = new Map<string, HexCell>();
  const units = createInitialUnits();

  for (const coord of hexCoords) {
    const key = hexKey(coord);
    const unitOnCell = units.find((u) => u.position.q === coord.q && u.position.r === coord.r);
    
    // Keep cells around units as plain for playability
    let terrain: 'plain' | 'forest' | 'mountain' | 'water';
    const distToAnyUnit = units.some(u => hexDistance(coord, u.position) <= 1);
    if (distToAnyUnit) {
      terrain = 'plain';
    } else {
      terrain = generateTerrain();
    }

    grid.set(key, {
      coord,
      terrain,
      unit: unitOnCell,
    });
  }

  // Ensure unit positions are plain
  for (const unit of units) {
    const key = hexKey(unit.position);
    const cell = grid.get(key);
    if (cell) {
      cell.terrain = 'plain';
      cell.unit = unit;
    }
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
    phase: reachable.length > 0 ? 'move' : attackable.length > 0 ? 'attack' : 'select',
    reachableHexes: reachable,
    attackableHexes: attackable,
    message: `Выбран: ${unit.name}. ${reachable.length > 0 ? 'Кликните на клетку для перемещения.' : ''} ${attackable.length > 0 ? 'Кликните на врага для атаки.' : ''}`,
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

  // Update grid
  const newGrid = new Map(state.grid);
  const oldKey = hexKey(state.selectedUnit.position);
  const newKey = hexKey(target);
  const oldCell = newGrid.get(oldKey);
  const newCell = newGrid.get(newKey);
  if (oldCell) newGrid.set(oldKey, { ...oldCell, unit: undefined });
  if (newCell) newGrid.set(newKey, { ...newCell, unit });

  // Check if can still attack
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

  // Calculate damage with some randomness
  const damage = Math.max(1, attacker.attack + Math.floor(Math.random() * 3) - 1);
  const newHp = Math.max(0, targetUnit.hp - damage);
  const updatedTarget = { ...targetUnit, hp: newHp };

  let units = state.units.map((u) => {
    if (u.id === attacker.id) return attacker;
    if (u.id === targetUnit.id) return updatedTarget;
    return u;
  });

  // Update grid
  const newGrid = new Map(state.grid);
  const targetKey = hexKey(target);
  const targetCell = newGrid.get(targetKey);
  if (targetCell) {
    newGrid.set(targetKey, { ...targetCell, unit: newHp > 0 ? updatedTarget : undefined });
  }

  // Check win condition
  const playerAlive = units.filter((u) => u.team === 'player' && u.hp > 0);
  const enemyAlive = units.filter((u) => u.team === 'enemy' && u.hp > 0);

  let gameOver = false;
  let winner: 'player' | 'enemy' | null = null;
  let message = `${attacker.name} нанёс ${damage} урона!`;

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
    gameOver,
    winner,
    message,
  };
}

export function endTurn(state: GameState): GameState {
  if (state.turn === 'player') {
    // Reset enemy units
    const units = state.units.map((u) =>
      u.team === 'enemy' ? { ...u, moved: false, attacked: false } : u
    );
    return {
      ...state,
      units,
      turn: 'enemy',
      selectedUnit: null,
      phase: 'select',
      reachableHexes: [],
      attackableHexes: [],
      message: 'Ход противника...',
    };
  } else {
    // Reset player units
    const units = state.units.map((u) =>
      u.team === 'player' ? { ...u, moved: false, attacked: false } : u
    );
    return {
      ...state,
      units,
      turn: 'player',
      turnNumber: state.turnNumber + 1,
      selectedUnit: null,
      phase: 'select',
      reachableHexes: [],
      attackableHexes: [],
      message: `Ход ${state.turnNumber + 1}. Выберите юнита.`,
    };
  }
}

export function executeEnemyTurn(state: GameState): GameState {
  let currentState = { ...state };
  const enemies = currentState.units.filter(
    (u) => u.team === 'enemy' && u.hp > 0
  );
  const players = currentState.units.filter(
    (u) => u.team === 'player' && u.hp > 0
  );

  if (players.length === 0) return currentState;

  for (const enemy of enemies) {
    // Find closest player unit
    let closestPlayer = players[0];
    let minDist = Infinity;
    for (const player of players) {
      if (player.hp <= 0) continue;
      const dist = hexDistance(enemy.position, player.position);
      if (dist < minDist) {
        minDist = dist;
        closestPlayer = player;
      }
    }

    if (!closestPlayer || closestPlayer.hp <= 0) continue;

    // Try to attack if in range
    const attackRange = enemy.type === 'archer' ? 3 : enemy.type === 'mage' ? 2 : 1;
    const currentUnit = currentState.units.find((u) => u.id === enemy.id)!;

    if (minDist <= attackRange) {
      // Attack
      const damage = Math.max(1, currentUnit.attack + Math.floor(Math.random() * 3) - 1);
      const target = currentState.units.find(
        (u) => u.id === closestPlayer.id
      )!;
      const newHp = Math.max(0, target.hp - damage);
      
      currentState = {
        ...currentState,
        units: currentState.units.map((u) => {
          if (u.id === target.id) return { ...u, hp: newHp };
          return u;
        }),
      };

      // Update grid
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
        // Find hex closest to target
        let bestHex = reachable[0];
        let bestDist = hexDistance(reachable[0], closestPlayer.position);
        for (const hex of reachable) {
          const dist = hexDistance(hex, closestPlayer.position);
          if (dist < bestDist) {
            bestDist = dist;
            bestHex = hex;
          }
        }

        // Move
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

        // Try to attack after moving
        const newDist = hexDistance(bestHex, closestPlayer.position);
        if (newDist <= attackRange) {
          const damage = Math.max(1, currentUnit.attack + Math.floor(Math.random() * 3) - 1);
          const target = currentState.units.find(
            (u) => u.id === closestPlayer.id
          )!;
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

  // Check win condition
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
