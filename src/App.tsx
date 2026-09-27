import React, { useState, useCallback, useEffect } from 'react';
import HexGrid from './components/HexGrid';
import UnitPanel from './components/UnitPanel';
import { GameState, HexCoord } from './game/types';
import {
  initializeGame,
  selectUnit,
  moveUnit,
  attackUnit,
  endTurn,
  executeEnemyTurn,
} from './game/gameLogic';

const HEX_SIZE = 32;

function App() {
  const [gameState, setGameState] = useState<GameState>(initializeGame);
  const [isEnemyTurn, setIsEnemyTurn] = useState(false);

  const handleHexClick = useCallback(
    (coord: HexCoord) => {
      if (gameState.gameOver || gameState.turn !== 'player' || isEnemyTurn) return;

      const unitOnCell = gameState.units.find(
        (u) => u.position.q === coord.q && u.position.r === coord.r && u.hp > 0
      );

      // If clicking on own unit, select it
      if (unitOnCell && unitOnCell.team === 'player') {
        setGameState((prev) => selectUnit(prev, unitOnCell));
        return;
      }

      // If a unit is selected, try to move or attack
      if (gameState.selectedUnit) {
        // Check if it's an attack target
        if (unitOnCell && unitOnCell.team === 'enemy') {
          setGameState((prev) => attackUnit(prev, coord));
          return;
        }

        // Check if it's a reachable hex
        if (gameState.reachableHexes.some((h) => h.q === coord.q && h.r === coord.r)) {
          setGameState((prev) => moveUnit(prev, coord));
          return;
        }
      }
    },
    [gameState, isEnemyTurn]
  );

  const handleEndTurn = useCallback(() => {
    if (gameState.turn !== 'player' || gameState.gameOver) return;
    setIsEnemyTurn(true);
    setGameState((prev) => endTurn(prev));
  }, [gameState]);

  const handleRestart = useCallback(() => {
    setGameState(initializeGame());
    setIsEnemyTurn(false);
  }, []);

  const handleDeselect = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      selectedUnit: null,
      phase: 'select',
      reachableHexes: [],
      attackableHexes: [],
      message: 'Выберите юнита для действия.',
    }));
  }, []);

  // Execute enemy turn with delay
  useEffect(() => {
    if (gameState.turn === 'enemy' && !gameState.gameOver && isEnemyTurn) {
      const timer = setTimeout(() => {
        setGameState((prev) => {
          const afterEnemy = executeEnemyTurn(prev);
          return endTurn(afterEnemy);
        });
        setIsEnemyTurn(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [gameState.turn, gameState.gameOver, isEnemyTurn]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center p-4">
      {/* Header */}
      <header className="text-center mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-red-500">
          ⚔️ Hex Tactics ⚔️
        </h1>
        <p className="text-gray-400 text-sm mt-1">Пошаговая тактика на гексагональной карте</p>
      </header>

      {/* Main content */}
      <div className="flex flex-col lg:flex-row gap-4 w-full max-w-7xl items-center lg:items-start">
        {/* Game board */}
        <div className="flex-1 bg-gray-700/30 rounded-xl p-4 border border-gray-600/50 backdrop-blur-sm w-full">
          <HexGrid
            cells={gameState.grid}
            units={gameState.units}
            selectedUnit={gameState.selectedUnit}
            reachableHexes={gameState.reachableHexes}
            attackableHexes={gameState.attackableHexes}
            onHexClick={handleHexClick}
            hexSize={HEX_SIZE}
          />
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-auto">
          <UnitPanel
            units={gameState.units}
            selectedUnit={gameState.selectedUnit}
            turn={gameState.turn}
            turnNumber={gameState.turnNumber}
            message={gameState.message}
            gameOver={gameState.gameOver}
            winner={gameState.winner}
            onEndTurn={handleEndTurn}
            onRestart={handleRestart}
            onDeselect={handleDeselect}
          />
        </div>
      </div>

      {/* Enemy turn overlay */}
      {isEnemyTurn && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-red-900/90 text-white px-8 py-4 rounded-xl text-xl font-bold animate-pulse border-2 border-red-500">
            🎯 Ход противника...
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
