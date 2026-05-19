import { CardBack } from './UnoCard';

export default function DrawPile({ count, onDraw, isMyTurn, stackedDrawCount }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-gray-400 text-xs font-bold tracking-widest">DRAW</div>
      <button
        onClick={onDraw}
        disabled={!isMyTurn}
        className={`
          relative group transition-all duration-200
          ${isMyTurn ? 'hover:-translate-y-1 cursor-pointer' : 'cursor-not-allowed opacity-60'}
        `}
        aria-label={stackedDrawCount > 0 ? `Draw ${stackedDrawCount} cards` : 'Draw a card'}
        title={stackedDrawCount > 0 ? `Draw ${stackedDrawCount} cards` : 'Draw a card'}
      >
        {/* Stack effect */}
        <div className="absolute top-1 left-1 opacity-60">
          <CardBack />
        </div>
        <div className="absolute top-0.5 left-0.5 opacity-80">
          <CardBack />
        </div>
        <div className="relative">
          <CardBack />
        </div>

        {/* Glow on hover when active */}
        {isMyTurn && (
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-[0_0_20px_rgba(99,102,241,0.8)]" />
        )}
      </button>

      {/* Count badge */}
      <div className="bg-gray-800 border border-gray-600 rounded-full px-2 py-0.5 text-xs text-gray-300 font-bold">
        {count} left
      </div>

      {/* Stacked draw indicator */}
      {stackedDrawCount > 0 && (
        <div className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded-full animate-bounce border border-red-400">
          Stack: +{stackedDrawCount}
        </div>
      )}
    </div>
  );
}
