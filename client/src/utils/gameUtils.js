export function isValidPlay(card, topCard, activeColor) {
  if (!card || !topCard) return false;
  if (card.type === 'wild') return true;
  if (card.color === activeColor) return true;
  if (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) return true;
  if (card.type === 'action' && topCard.type === 'action' && card.value === topCard.value) return true;
  return false;
}
