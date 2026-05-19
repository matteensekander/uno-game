export const COLOR_STYLES = {
  red: {
    bg: 'bg-red-600',
    border: 'border-red-400',
    glow: 'shadow-[0_0_15px_rgba(220,38,38,0.8)]',
    hex: '#DC2626',
    label: 'Red',
    shape: 'circle',
  },
  yellow: {
    bg: 'bg-yellow-400',
    border: 'border-yellow-300',
    glow: 'shadow-[0_0_15px_rgba(250,204,21,0.8)]',
    hex: '#FACC15',
    label: 'Yellow',
    shape: 'diamond',
  },
  green: {
    bg: 'bg-green-500',
    border: 'border-green-400',
    glow: 'shadow-[0_0_15px_rgba(34,197,94,0.8)]',
    hex: '#22C55E',
    label: 'Green',
    shape: 'triangle',
  },
  blue: {
    bg: 'bg-blue-600',
    border: 'border-blue-400',
    glow: 'shadow-[0_0_15px_rgba(37,99,235,0.8)]',
    hex: '#2563EB',
    label: 'Blue',
    shape: 'square',
  },
  wild: {
    bg: 'bg-gray-900',
    border: 'border-purple-500',
    glow: 'shadow-[0_0_15px_rgba(168,85,247,0.8)]',
    hex: '#1f1f1f',
    label: 'Wild',
    shape: 'star',
  },
};

export const ACTION_SYMBOLS = {
  skip: '⊘',
  reverse: '↺',
  draw_two: '+2',
  wild: '★',
  wild_draw_four: '+4',
};

export function getCardLabel(card) {
  if (card.type === 'number') {
    return `${COLOR_STYLES[card.color]?.label || card.color} ${card.value}`;
  }
  if (card.type === 'action') {
    const actionName = card.value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    return `${COLOR_STYLES[card.color]?.label || card.color} ${actionName}`;
  }
  if (card.value === 'wild_draw_four') return 'Wild Draw Four';
  return 'Wild';
}

export function getCardDisplay(card) {
  if (card.type === 'number') return card.value;
  return ACTION_SYMBOLS[card.value] || card.value;
}

export function isWild(card) {
  return card.type === 'wild';
}

export function getColorBg(color) {
  return COLOR_STYLES[color]?.bg || 'bg-gray-700';
}

export function getColorHex(color) {
  return COLOR_STYLES[color]?.hex || '#374151';
}
