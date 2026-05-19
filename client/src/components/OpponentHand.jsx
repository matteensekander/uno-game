import { CardBack } from './UnoCard';

export default function OpponentHand({
  player,
  isCurrentPlayer,
  unoWindow,
  onCatchUno,
  position = 'top',
  colorBlindMode,
}) {
  const cardCount = player.cardCount || 0;
  const showCards = Math.min(cardCount, 10);
  const hasUnoWindow = unoWindow === player.id && !player.hasCalledUno;

  const containerClass = {
    top: 'flex-col items-center',
    left: 'flex-col items-center',
    right: 'flex-col items-center',
  }[position] || 'flex-col items-center';

  return (
    <div className={`flex ${containerClass} gap-1`}>
      {/* Player name + status */}
      <div className="flex items-center gap-2">
        <div
          className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-black
            ${isCurrentPlayer ? 'bg-neon-cyan text-black animate-pulse' : 'bg-gray-700 text-white'}
          `}
        >
          {player.name[0].toUpperCase()}
        </div>
        <div className="flex flex-col">
          <span className={`text-xs font-bold ${isCurrentPlayer ? 'text-neon-cyan' : 'text-gray-300'}`}>
            {player.name}
            {!player.isConnected && <span className="text-red-400 ml-1">(away)</span>}
          </span>
          <span className="text-xs text-gray-500">{player.score || 0} pts</span>
        </div>
        {isCurrentPlayer && (
          <div className="w-2 h-2 rounded-full bg-neon-cyan animate-ping" />
        )}
      </div>

      {/* Card backs fanned */}
      <div className="relative flex items-center justify-center" style={{ height: 70, minWidth: 60 }}>
        {Array.from({ length: Math.max(showCards, 1) }).map((_, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${i * (showCards > 5 ? 6 : 10)}px`,
              zIndex: i,
              transform: `rotate(${(i - showCards / 2) * 3}deg)`,
            }}
          >
            <CardBack small />
          </div>
        ))}
      </div>

      {/* Card count badge */}
      <div className="bg-gray-800 border border-gray-600 rounded-full px-2 py-0.5 text-xs text-gray-300 font-bold">
        {cardCount} card{cardCount !== 1 ? 's' : ''}
      </div>

      {/* UNO indicators */}
      {player.hasCalledUno && (
        <div className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-full animate-bounce">
          UNO!
        </div>
      )}

      {hasUnoWindow && onCatchUno && (
        <button
          onClick={() => onCatchUno(player.id)}
          className="bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-black px-3 py-1 rounded-full animate-pulse border-2 border-yellow-300 transition-colors"
        >
          Catch UNO!
        </button>
      )}
    </div>
  );
}
