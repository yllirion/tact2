import React from 'react';
import { Unit } from '../game/types';

interface UnitPanelProps {
  units: Unit[];
  selectedUnit: Unit | null;
  turn: 'player' | 'enemy';
  turnNumber: number;
  message: string;
  gameOver: boolean;
  winner: 'player' | 'enemy' | null;
  onEndTurn: () => void;
  onRestart: () => void;
  onDeselect: () => void;
}

const UnitPanel: React.FC<UnitPanelProps> = ({
  units,
  selectedUnit,
  turn,
  turnNumber,
  message,
  gameOver,
  winner,
  onEndTurn,
  onRestart,
  onDeselect,
}) => {
  const playerUnits = units.filter((u) => u.team === 'player');
  const enemyUnits = units.filter((u) => u.team === 'enemy');

  return (
    <div className="flex flex-col gap-3 w-full max-w-sm">
      {/* Turn info */}
      <div className={`p-3 rounded-lg text-center font-bold text-lg ${
        turn === 'player' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
      }`}>
        {gameOver
          ? winner === 'player'
            ? '🎉 ПОБЕДА!'
            : '💀 ПОРАЖЕНИЕ'
          : `Ход ${turnNumber} — ${turn === 'player' ? 'Ваш ход' : 'Ход противника'}`}
      </div>

      {/* Message */}
      <div className="bg-gray-800 text-gray-200 p-3 rounded-lg text-sm min-h-[3rem]">
        {message}
      </div>

      {/* Selected unit info */}
      {selectedUnit && !gameOver && (
        <div className="bg-gray-700 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{selectedUnit.emoji}</span>
            <div>
              <div className="font-bold text-white">{selectedUnit.name}</div>
              <div className="text-xs text-gray-400 capitalize">{selectedUnit.type}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs text-gray-300">
            <div>❤️ HP: {selectedUnit.hp}/{selectedUnit.maxHp}</div>
            <div>⚔️ ATK: {selectedUnit.attack}</div>
            <div>👟 Move: {selectedUnit.moveRange}</div>
            <div>
              {selectedUnit.moved ? '✅ Ходил' : '❌ Не ходил'}
            </div>
          </div>
          <button
            onClick={onDeselect}
            className="mt-2 w-full bg-gray-600 hover:bg-gray-500 text-white py-1 px-3 rounded text-sm"
          >
            Отменить выбор
          </button>
        </div>
      )}

      {/* Army status */}
      <div className="bg-gray-800 p-3 rounded-lg">
        <div className="text-sm font-bold text-blue-400 mb-1">🛡️ Ваша армия:</div>
        {playerUnits.map((u) => (
          <div key={u.id} className={`flex justify-between text-xs py-0.5 ${u.hp <= 0 ? 'text-gray-600 line-through' : 'text-gray-300'}`}>
            <span>{u.emoji} {u.name}</span>
            <span>❤️ {u.hp}/{u.maxHp}</span>
          </div>
        ))}
        <div className="text-sm font-bold text-red-400 mt-2 mb-1">⚔️ Враги:</div>
        {enemyUnits.map((u) => (
          <div key={u.id} className={`flex justify-between text-xs py-0.5 ${u.hp <= 0 ? 'text-gray-600 line-through' : 'text-gray-300'}`}>
            <span>{u.emoji} {u.name}</span>
            <span>❤️ {u.hp}/{u.maxHp}</span>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!gameOver && turn === 'player' && (
          <button
            onClick={onEndTurn}
            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Завершить ход ⏭️
          </button>
        )}
        {gameOver && (
          <button
            onClick={onRestart}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Новая игра 🔄
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="bg-gray-800 p-3 rounded-lg text-xs text-gray-400">
        <div className="font-bold text-gray-300 mb-1">Легенда:</div>
        <div>🟢 Зелёная рамка — доступные клетки</div>
        <div>🔴 Красная рамка — цели для атаки</div>
        <div>🟡 Жёлтая рамка — выбранный юнит</div>
        <div className="mt-1">⚔️ Воин: ближний бой</div>
        <div>🏹 Лучник: дальность 3</div>
        <div>🔮 Маг: дальность 2, сильный урон</div>
      </div>
    </div>
  );
};

export default UnitPanel;
