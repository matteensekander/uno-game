import { COLOR_STYLES } from '../utils/cardUtils';

const COLORS = ['red', 'yellow', 'green', 'blue'];

export default function ColorPicker({ onChoose, card }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div className="relative z-10 flex flex-col items-center gap-6 p-8 bg-gray-900 rounded-3xl border-2 border-purple-500 shadow-[0_0_40px_rgba(168,85,247,0.5)]">
        <h2 className="text-2xl font-black text-white">
          {card?.value === 'wild_draw_four' ? '🃏 Wild Draw Four' : '🌈 Wild Card'}
        </h2>
        <p className="text-gray-400 text-sm">Choose a color to continue</p>

        <div className="grid grid-cols-2 gap-4">
          {COLORS.map(color => {
            const style = COLOR_STYLES[color];
            return (
              <button
                key={color}
                onClick={() => onChoose(color)}
                aria-label={`Choose ${style.label}`}
                className={`
                  w-24 h-24 rounded-2xl border-4 border-white/20 font-black text-white text-lg
                  hover:scale-110 hover:border-white/80 transition-all duration-200 active:scale-95
                  ${style.glow}
                `}
                style={{ background: style.hex }}
              >
                {style.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
