import React from 'react';
import { Unit, Spell } from '../game/types';

interface UnitPanelProps {
  units: Unit[];
  selectedUnit: Unit | null;
  selectedSpell: Spell | null;
  turn: 'player' | 'enemy';
  turnNumber: number;
  message: string;
  gameOver: boolean;
  winner: 'player' | 'enemy' | null;
  onEndTurn: () => void;
  onRestart: () => void;
  onDeselect: () => void;
  onCastSpell: (spellId: string) => void;
  onCancelSpell: () => void;
}

const UnitPanel: React.FC<UnitPanelProps> = ({
  units,
  selectedUnit,
  selectedSpell,
  turn,
  turnNumber,
  message,
  gameOver,
  winner,
  onEndTurn,
  onRestart,
  onDeselect,
  onCastSpell,
  onCancelSpell,
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
              <div className="text-xs text-gray-400 capitalize">
                {selectedUnit.type === 'warrior' ? 'Воин' : selectedUnit.type === 'archer' ? 'Лучник' : 'Маг'}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs text-gray-300">
            <div>❤️ HP: {selectedUnit.hp}/{selectedUnit.maxHp}</div>
            <div>⚔️ ATK: {selectedUnit.attack}</div>
            <div>👟 Move: {selectedUnit.moveRange}</div>
            <div>
              {selectedUnit.moved ? '✅ Ходил' : '❌ Не ходил'}
            </div>
            {selectedUnit.mana !== undefined && selectedUnit.maxMana !== undefined && (
              <>
                <div className="col-span-2">💧 Мана: {selectedUnit.mana}/{selectedUnit.maxMana}</div>
              </>
            )}
          </div>

          {/* Spells section for mage */}
          {selectedUnit.type === 'mage' && selectedUnit.spells && (
            <div className="mt-3 border-t border-gray-600 pt-2">
              <div className="text-xs font-bold text-purple-300 mb-1">✨ Заклинания:</div>
              <div className="flex flex-col gap-1">
                {selectedUnit.spells.map(spell => {
                  const canCast = spell.currentCooldown === 0 &&
                    (selectedUnit.mana ?? 0) >= spell.manaCost &&
                    !selectedUnit.attacked;
                  const isSelected = selectedSpell?.id === spell.id;

                  return (
                    <button
                      key={spell.id}
                      onClick={() => canCast && !isSelected ? onCastSpell(spell.id) : undefined}
                      disabled={!canCast || isSelected}
                      className={`text-left p-2 rounded text-xs transition-all ${
                        isSelected
                          ? 'bg-purple-600 text-white ring-2 ring-purple-300'
                          : canCast
                          ? 'bg-gray-600 hover:bg-gray-500 text-white cursor-pointer'
                          : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold">
                          {spell.emoji} {spell.name}
                        </span>
                        <span className="text-[10px]">
                          💧{spell.manaCost}
                          {spell.currentCooldown > 0 && (
                            <span className="ml-1 text-yellow-400">⏳{spell.currentCooldown}</span>
                          )}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {spell.description}
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedSpell && (
                <button
                  onClick={onCancelSpell}
                  className="mt-2 w-full bg-gray-600 hover:bg-gray-500 text-white py-1 px-3 rounded text-xs"
                >
                  ❌ Отменить заклинание
                </button>
              )}
            </div>
          )}

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
            <span>
              ❤️ {u.hp}/{u.maxHp}
              {u.mana !== undefined && <span className="ml-1 text-blue-400">💧{u.mana}</span>}
            </span>
          </div>
        ))}
        <div className="text-sm font-bold text-red-400 mt-2 mb-1">⚔️ Враги:</div>
        {enemyUnits.map((u) => (
          <div key={u.id} className={`flex justify-between text-xs py-0.5 ${u.hp <= 0 ? 'text-gray-600 line-through' : 'text-gray-300'}`}>
            <span>{u.emoji} {u.name}</span>
            <span>
              ❤️ {u.hp}/{u.maxHp}
              {u.mana !== undefined && <span className="ml-1 text-blue-400">💧{u.mana}</span>}
            </span>
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
        <div>🟣 Фиолетовая — цель Молнии</div>
        <div>🟠 Оранжевая — цель Огн. шара</div>
        <div className="mt-1">⚔️ Воин: ближний бой, 12 HP</div>
        <div>🏹 Лучник: дальность 3, 8 HP</div>
        <div>🔮 Маг: заклинания, 7 HP, 10 маны</div>
        <div className="mt-1">⚡ Молния: 7 урона, 5 дальн., 3 маны</div>
        <div>🔥 Огн. шар: 5 урона AoE, 4 дальн., 5 маны</div>
      </div>
    </div>
  );
};

export default UnitPanel;
