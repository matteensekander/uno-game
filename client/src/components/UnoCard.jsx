import { COLOR_STYLES, getCardDisplay, getCardLabel } from '../utils/cardUtils';

const GRADIENT_WILD = 'linear-gradient(135deg, #FF3333 25%, #FFD700 25% 50%, #00CC44 50% 75%, #0088FF 75%)';

export default function UnoCard({
  card,
  onClick,
  playable = false,
  selected = false,
  small = false,
  colorBlindMode = false,
}) {
  const style = COLOR_STYLES[card.color] || COLOR_STYLES.wild;
  const display = getCardDisplay(card);
  const label = getCardLabel(card);
  const isWild = card.type === 'wild';

  const cardStyle = isWild
    ? { background: GRADIENT_WILD }
    : { background: style.hex };

  const sizeClass = small
    ? 'w-10 h-14 text-xs'
    : 'w-20 h-28 sm:w-24 sm:h-32 text-xl sm:text-2xl';

  return (
    <button
      onClick={onClick}
      disabled={!playable && !onClick}
      aria-label={label}
      title={label}
      className={`
        relative rounded-xl border-2 flex flex-col items-center justify-center
        font-black select-none transition-all duration-200 cursor-pointer
        ${sizeClass}
        ${selected ? 'ring-4 ring-white ring-offset-2 -translate-y-3 scale-110' : ''}
        ${playable ? `${style.glow} hover:-translate-y-2 hover:scale-105 hover:${style.glow}` : ''}
        ${!playable && onClick ? 'opacity-60 cursor-not-allowed' : ''}
        ${style.border}
      `}
      style={cardStyle}
    >
      {/* Corner value */}
      <span className="absolute top-1 left-2 text-white text-xs font-bold opacity-90">
        {display}
      </span>
      <span className="absolute bottom-1 right-2 text-white text-xs font-bold opacity-90 rotate-180">
        {display}
      </span>

      {/* Center oval */}
      <div
        className="absolute inset-x-3 inset-y-4 rounded-full opacity-20 bg-white"
        style={{ transform: 'rotate(-30deg)' }}
      />

      {/* Center display */}
      <span
        className={`relative z-10 text-white font-black drop-shadow-lg ${
          small ? 'text-sm' : 'text-3xl sm:text-4xl'
        }`}
        style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
      >
        {display}
      </span>

      {/* Color-blind shape indicator */}
      {colorBlindMode && !isWild && (
        <ColorBlindShape shape={style.shape} />
      )}

      {/* Playable glow effect */}
      {playable && (
        <div className="absolute inset-0 rounded-xl border-2 border-white opacity-40 animate-pulse" />
      )}
    </button>
  );
}

function ColorBlindShape({ shape }) {
  const shapes = {
    circle: <circle cx="8" cy="8" r="6" fill="white" opacity="0.8" />,
    square: <rect x="2" y="2" width="12" height="12" fill="white" opacity="0.8" />,
    triangle: <polygon points="8,2 14,14 2,14" fill="white" opacity="0.8" />,
    diamond: <polygon points="8,2 14,8 8,14 2,8" fill="white" opacity="0.8" />,
  };

  return (
    <div className="absolute top-1 right-1">
      <svg width="16" height="16" viewBox="0 0 16 16">
        {shapes[shape]}
      </svg>
    </div>
  );
}

export function CardBack({ small = false }) {
  const sizeClass = small
    ? 'w-10 h-14'
    : 'w-20 h-28 sm:w-24 sm:h-32';

  return (
    <div
      className={`
        ${sizeClass} rounded-xl border-2 border-indigo-600
        bg-indigo-900 flex items-center justify-center
        shadow-[0_0_10px_rgba(99,102,241,0.5)]
      `}
    >
      <div className="w-3/4 h-3/4 rounded-lg border-2 border-indigo-400 flex items-center justify-center">
        <span className="text-indigo-300 font-black text-lg" style={{ fontFamily: 'serif' }}>
          UNO
        </span>
      </div>
    </div>
  );
}
