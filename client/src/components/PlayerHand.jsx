import { useState } from 'react';
import UnoCard from './UnoCard';

export default function PlayerHand({
  cards,
  playableCardIds,
  onPlayCard,
  isMyTurn,
  colorBlindMode,
  drawnCard,
  onPassAfterDraw,
  pendingWildDrawFour,
}) {
  const [selectedId, setSelectedId] = useState(null);

  function handleCardClick(card) {
    if (!isMyTurn) return;
    const canPlay = playableCardIds.includes(card.id);
    if (!canPlay) return;
    onPlayCard(card);
  }

  // Spread cards in an arc
  const count = cards.length;
  const maxSpread = Math.min(8, count);
  const angleStep = count > 1 ? Math.min(5, 40 / count) : 0;
  const startAngle = -((count - 1) / 2) * angleStep;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Challenge WD4 banner */}
      {pendingWildDrawFour && (
        <div className="text-yellow-300 text-sm font-bold animate-pulse">
          Wild Draw Four played — you can challenge it!
        </div>
      )}

      {/* Turn indicator */}
      {isMyTurn && (
        <div className="text-neon-cyan text-sm font-bold tracking-widest animate-pulse">
          ▶ YOUR TURN ◀
        </div>
      )}

      {/* Card fan */}
      <div className="relative flex items-end justify-center" style={{ height: '150px', minWidth: '200px' }}>
        {cards.map((card, i) => {
          const angle = startAngle + i * angleStep;
          const playable = isMyTurn && playableCardIds.includes(card.id);
          const isSelected = selectedId === card.id;
          const isDrawnCard = drawnCard?.id === card.id;

          return (
            <div
              key={card.id}
              className="absolute bottom-0 transition-transform duration-200"
              style={{
                transform: `rotate(${angle}deg) translateX(${(i - (count - 1) / 2) * (count > 12 ? 18 : 28)}px)`,
                transformOrigin: 'bottom center',
                zIndex: isSelected ? 50 : i,
              }}
              onMouseEnter={() => setSelectedId(card.id)}
              onMouseLeave={() => setSelectedId(null)}
            >
              <UnoCard
                card={card}
                playable={playable}
                selected={isSelected && playable}
                onClick={playable ? () => handleCardClick(card) : undefined}
                colorBlindMode={colorBlindMode}
              />
              {isDrawnCard && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-yellow-300 font-bold whitespace-nowrap">
                  Just drawn
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pass button after drawing */}
      {drawnCard && !playableCardIds.includes(drawnCard.id) && isMyTurn && (
        <button
          onClick={onPassAfterDraw}
          className="mt-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-bold border border-gray-500 transition-colors"
        >
          Pass Turn
        </button>
      )}

      {/* Card count */}
      <div className="text-gray-400 text-xs">
        {count} card{count !== 1 ? 's' : ''} in hand
      </div>
    </div>
  );
}
