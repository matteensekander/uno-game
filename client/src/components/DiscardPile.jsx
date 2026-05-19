import { COLOR_STYLES, getCardDisplay } from '../utils/cardUtils';

export default function DiscardPile({ topCard, activeColor, lastPlayedCard }) {
  if (!topCard) return null;

  const style = COLOR_STYLES[activeColor] || COLOR_STYLES[topCard.color] || COLOR_STYLES.wild;
  const display = getCardDisplay(topCard);
  const isWild = topCard.type === 'wild';

  const GRADIENT_WILD = 'linear-gradient(135deg, #FF3333 25%, #FFD700 25% 50%, #00CC44 50% 75%, #0088FF 75%)';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-gray-400 text-xs font-bold tracking-widest">DISCARD</div>
      <div
        className={`
          relative w-24 h-32 rounded-2xl border-4 flex flex-col items-center justify-center
          font-black shadow-2xl transition-all duration-300
          ${style.border} ${style.glow}
        `}
        style={isWild ? { background: GRADIENT_WILD } : { background: style.hex }}
      >
        {/* Corner values */}
        <span className="absolute top-1 left-2 text-white text-xs font-bold opacity-90">{display}</span>
        <span className="absolute bottom-1 right-2 text-white text-xs font-bold opacity-90 rotate-180">{display}</span>

        {/* Center oval */}
        <div
          className="absolute inset-x-4 inset-y-5 rounded-full opacity-20 bg-white"
          style={{ transform: 'rotate(-30deg)' }}
        />

        <span className="relative z-10 text-white text-4xl font-black drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
          {display}
        </span>
      </div>

      {/* Active color indicator (for wilds) */}
      {isWild && (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <span>Active:</span>
          <div
            className={`w-4 h-4 rounded-full border-2 border-white`}
            style={{ background: COLOR_STYLES[activeColor]?.hex || '#fff' }}
          />
          <span className="text-white font-bold">{COLOR_STYLES[activeColor]?.label}</span>
        </div>
      )}
    </div>
  );
}
