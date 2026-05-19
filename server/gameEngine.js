const { v4: uuidv4 } = require('uuid');

const COLORS = ['red', 'yellow', 'green', 'blue'];
const NUMBER_CARDS = ['0','1','2','3','4','5','6','7','8','9'];
const ACTION_CARDS = ['skip','reverse','draw_two'];
const WILD_CARDS = ['wild','wild_draw_four'];

function createDeck() {
  const deck = [];

  for (const color of COLORS) {
    // One 0 per color
    deck.push({ id: uuidv4(), color, type: 'number', value: '0' });

    // Two of each 1-9 per color
    for (const num of NUMBER_CARDS.slice(1)) {
      deck.push({ id: uuidv4(), color, type: 'number', value: num });
      deck.push({ id: uuidv4(), color, type: 'number', value: num });
    }

    // Two of each action card per color
    for (const action of ACTION_CARDS) {
      deck.push({ id: uuidv4(), color, type: 'action', value: action });
      deck.push({ id: uuidv4(), color, type: 'action', value: action });
    }
  }

  // 4 of each wild type
  for (let i = 0; i < 4; i++) {
    deck.push({ id: uuidv4(), color: 'wild', type: 'wild', value: 'wild' });
    deck.push({ id: uuidv4(), color: 'wild', type: 'wild', value: 'wild_draw_four' });
  }

  return deck;
}

function shuffle(deck) {
  const arr = [...deck];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function dealCards(deck, playerCount) {
  const hands = Array.from({ length: playerCount }, () => []);
  const remaining = [...deck];

  for (let card = 0; card < 7; card++) {
    for (let p = 0; p < playerCount; p++) {
      hands[p].push(remaining.shift());
    }
  }

  return { hands, remaining };
}

function isValidPlay(card, topCard, activeColor) {
  // Wilds are always playable
  if (card.type === 'wild') return true;

  // Match active color
  if (card.color === activeColor) return true;

  // Match value/type of top card
  if (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) return true;
  if (card.type === 'action' && topCard.type === 'action' && card.value === topCard.value) return true;

  return false;
}

function canPlayOnStack(card, stackedDrawCount, settings) {
  if (!settings.stackingEnabled || stackedDrawCount === 0) return true;
  // Can only play draw_two on a stack of draw_twos
  return card.type === 'action' && card.value === 'draw_two';
}

function getCardPoints(card) {
  if (card.type === 'number') return parseInt(card.value, 10);
  if (card.type === 'action') return 20;
  if (card.type === 'wild') return 50;
  return 0;
}

function getNextPlayerIndex(currentIndex, direction, playerCount) {
  return ((currentIndex + direction) % playerCount + playerCount) % playerCount;
}

function applyCardEffect(gameState, card, chosenColor) {
  const { players, direction } = gameState;
  const playerCount = players.length;
  const currentIndex = players.findIndex(p => p.id === gameState.currentPlayerId);

  let newDirection = direction;
  let nextPlayerIndex = getNextPlayerIndex(currentIndex, direction, playerCount);
  let extraDrawCount = 0;
  let skipNext = false;
  let newActiveColor = card.color === 'wild' ? chosenColor : card.color;
  let lastAction = 'play_card';

  if (card.type === 'action') {
    if (card.value === 'skip') {
      skipNext = true;
      lastAction = 'skip';
    } else if (card.value === 'reverse') {
      if (playerCount === 2) {
        // Acts like skip
        skipNext = true;
      } else {
        newDirection = direction * -1;
        nextPlayerIndex = getNextPlayerIndex(currentIndex, newDirection, playerCount);
      }
      lastAction = 'reverse';
    } else if (card.value === 'draw_two') {
      if (gameState.settings.stackingEnabled && gameState.stackedDrawCount > 0) {
        gameState.stackedDrawCount += 2;
        lastAction = 'draw_two';
        // Next player must deal with the stack
        return {
          ...gameState,
          direction: newDirection,
          currentPlayerId: players[nextPlayerIndex].id,
          activeColor: newActiveColor,
          lastAction,
          stackedDrawCount: gameState.stackedDrawCount,
          unoWindow: null,
        };
      }
      extraDrawCount = 2;
      skipNext = true;
      lastAction = 'draw_two';
    }
  } else if (card.type === 'wild') {
    if (card.value === 'wild_draw_four') {
      // Challenge handling done separately; assume not challenged
      extraDrawCount = 4;
      skipNext = true;
      lastAction = 'wild_draw_four';
    } else {
      lastAction = 'wild';
    }
  }

  // Apply draw to next player if needed
  let newState = { ...gameState, direction: newDirection, activeColor: newActiveColor, lastAction, stackedDrawCount: 0 };

  if (extraDrawCount > 0) {
    newState = drawCardsForPlayer(newState, players[nextPlayerIndex].id, extraDrawCount);
  }

  if (skipNext) {
    // Skip the nextPlayerIndex, advance one more
    nextPlayerIndex = getNextPlayerIndex(nextPlayerIndex, newDirection, playerCount);
  }

  newState.currentPlayerId = newState.players[nextPlayerIndex].id;
  newState.unoWindow = null;

  return newState;
}

function drawCardsForPlayer(gameState, playerId, count) {
  let state = { ...gameState };
  let drawPile = [...state.drawPile];
  let discardPile = [...state.discardPile];

  const players = state.players.map(p => {
    if (p.id !== playerId) return p;
    const hand = [...p.hand];
    for (let i = 0; i < count; i++) {
      if (drawPile.length === 0) {
        // Reshuffle discard pile
        const topCard = discardPile[discardPile.length - 1];
        const reshuffled = shuffle(discardPile.slice(0, -1));
        drawPile = reshuffled;
        discardPile = [topCard];
      }
      if (drawPile.length > 0) {
        hand.push(drawPile.shift());
      }
    }
    return { ...p, hand, cardCount: hand.length };
  });

  return { ...state, players, drawPile, discardPile, drawPileCount: drawPile.length };
}

function initGameState(room) {
  const { players, settings } = room;
  let deck = shuffle(createDeck());

  // Find a valid starting card (non-wild action or number)
  let topCard;
  let deckCopy = [...deck];
  let topIndex = deckCopy.findIndex(c => c.type === 'number');
  if (topIndex === -1) topIndex = 0;
  topCard = deckCopy.splice(topIndex, 1)[0];
  deck = deckCopy;

  const { hands, remaining } = dealCards(deck, players.length);

  const gamePlayers = players.map((p, i) => ({
    ...p,
    hand: hands[i],
    cardCount: hands[i].length,
    hasCalledUno: false,
    score: p.score || 0,
  }));

  return {
    roomCode: room.roomCode,
    status: 'playing',
    players: gamePlayers,
    currentPlayerId: gamePlayers[0].id,
    direction: 1,
    topCard,
    activeColor: topCard.color,
    drawPile: remaining,
    drawPileCount: remaining.length,
    discardPile: [topCard],
    lastAction: 'game_start',
    unoWindow: null,
    stackedDrawCount: 0,
    settings,
    roundScores: {},
    pendingWildDrawFour: null,
  };
}

function playCard(gameState, playerId, cardId, chosenColor) {
  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return { error: 'Player not found' };
  if (gameState.currentPlayerId !== playerId) return { error: 'Not your turn' };

  const player = gameState.players[playerIndex];
  const cardIndex = player.hand.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return { error: 'Card not in hand' };

  const card = player.hand[cardIndex];

  // Check stacking
  if (gameState.stackedDrawCount > 0) {
    if (!canPlayOnStack(card, gameState.stackedDrawCount, gameState.settings)) {
      return { error: 'Must play a Draw Two or draw the stack' };
    }
  } else {
    if (!isValidPlay(card, gameState.topCard, gameState.activeColor)) {
      return { error: 'Invalid play' };
    }
  }

  if (card.type === 'wild' && !chosenColor && card.value !== 'wild_draw_four') {
    return { error: 'Must choose a color for Wild card' };
  }

  if (card.value === 'wild_draw_four') {
    // Check legality: player must have no card matching active color
    const hasMatchingColor = player.hand.some(
      c => c.color === gameState.activeColor && c.id !== cardId
    );
    if (hasMatchingColor && !chosenColor) {
      return { error: 'Must choose a color for Wild Draw Four' };
    }
    if (!chosenColor) return { error: 'Must choose a color for Wild Draw Four' };
  }

  // Remove card from hand
  const newHand = player.hand.filter(c => c.id !== cardId);
  const updatedPlayers = gameState.players.map((p, i) =>
    i === playerIndex ? { ...p, hand: newHand, cardCount: newHand.length, hasCalledUno: false } : p
  );

  let state = {
    ...gameState,
    players: updatedPlayers,
    topCard: card,
    discardPile: [...gameState.discardPile, card],
  };

  // Wild Draw Four: store pending for challenge window
  if (card.value === 'wild_draw_four') {
    const hasMatchingColor = player.hand.some(c => c.color === gameState.activeColor && c.id !== cardId);
    state.pendingWildDrawFour = {
      playerId,
      chosenColor,
      wasIllegal: hasMatchingColor,
    };
  } else {
    state.pendingWildDrawFour = null;
  }

  // UNO window: if player now has 1 card
  if (newHand.length === 1) {
    state.unoWindow = playerId;
  } else if (newHand.length === 0) {
    state.unoWindow = null;
    state = applyCardEffect(state, card, chosenColor);
    return { state, roundOver: true, winnerId: playerId };
  }

  state = applyCardEffect(state, card, chosenColor);
  return { state };
}

function drawCard(gameState, playerId) {
  if (gameState.currentPlayerId !== playerId) return { error: 'Not your turn' };

  // If there's a draw stack, player must take it all
  if (gameState.stackedDrawCount > 0) {
    const count = gameState.stackedDrawCount;
    let state = drawCardsForPlayer(gameState, playerId, count);
    const playerCount = state.players.length;
    const currentIndex = state.players.findIndex(p => p.id === playerId);
    const nextIndex = getNextPlayerIndex(currentIndex, state.direction, playerCount);
    state = {
      ...state,
      stackedDrawCount: 0,
      currentPlayerId: state.players[nextIndex].id,
      lastAction: 'draw_card',
      unoWindow: null,
    };
    return { state, drewCount: count };
  }

  let state = drawCardsForPlayer(gameState, playerId, 1);
  const player = state.players.find(p => p.id === playerId);
  const drawnCard = player.hand[player.hand.length - 1];

  // Player may play the drawn card if valid
  if (isValidPlay(drawnCard, state.topCard, state.activeColor)) {
    state = { ...state, lastAction: 'draw_card', drawnCard };
    return { state, drawnCard, canPlay: true };
  }

  // Can't play: advance turn
  const playerCount = state.players.length;
  const currentIndex = state.players.findIndex(p => p.id === playerId);
  const nextIndex = getNextPlayerIndex(currentIndex, state.direction, playerCount);
  state = {
    ...state,
    currentPlayerId: state.players[nextIndex].id,
    lastAction: 'draw_card',
    unoWindow: null,
  };
  return { state, drewCount: 1 };
}

function callUno(gameState, playerId) {
  const player = gameState.players.find(p => p.id === playerId);
  if (!player) return { error: 'Player not found' };
  if (player.hand.length !== 1) return { error: 'Cannot call UNO unless you have 1 card' };

  const players = gameState.players.map(p =>
    p.id === playerId ? { ...p, hasCalledUno: true } : p
  );
  return { state: { ...gameState, players, unoWindow: null } };
}

function catchUno(gameState, catcherId, targetId) {
  const target = gameState.players.find(p => p.id === targetId);
  if (!target) return { error: 'Target player not found' };
  if (target.hand.length !== 1) return { error: 'Target does not have 1 card' };
  if (target.hasCalledUno) return { error: 'Target already called UNO' };
  if (gameState.unoWindow !== targetId) return { error: 'UNO window has closed' };

  // Penalize target: draw 2
  let state = drawCardsForPlayer(gameState, targetId, 2);
  state = { ...state, unoWindow: null };
  return { state, penalizedId: targetId };
}

function challengeDrawFour(gameState, challengerId) {
  const pending = gameState.pendingWildDrawFour;
  if (!pending) return { error: 'No pending Wild Draw Four challenge' };

  const playerCount = gameState.players.length;

  if (pending.wasIllegal) {
    // Challenge valid: the WD4 player draws 4
    let state = drawCardsForPlayer(gameState, pending.playerId, 4);
    state = { ...state, pendingWildDrawFour: null, lastAction: 'challenge_valid' };
    // Challenger's turn continues (they don't lose their turn)
    return { state, valid: true, penalizedPlayerId: pending.playerId };
  } else {
    // Challenge invalid: challenger draws 6 (4 + 2 penalty) and loses turn
    let state = drawCardsForPlayer(gameState, challengerId, 6);
    // Apply WD4 effect now (color was already chosen, skip challenger's turn)
    const currentIndex = state.players.findIndex(p => p.id === gameState.currentPlayerId);
    const nextIndex = getNextPlayerIndex(currentIndex, state.direction, playerCount);
    state = {
      ...state,
      activeColor: pending.chosenColor,
      currentPlayerId: state.players[nextIndex].id,
      pendingWildDrawFour: null,
      lastAction: 'challenge_invalid',
    };
    return { state, valid: false, penalizedPlayerId: challengerId };
  }
}

function calculateRoundScore(players) {
  const scores = {};
  for (const player of players) {
    let total = 0;
    for (const card of player.hand) {
      total += getCardPoints(card);
    }
    scores[player.id] = total;
  }
  return scores;
}

function endRound(gameState, winnerId) {
  const roundScores = calculateRoundScore(gameState.players);
  const roundPoints = Object.values(roundScores).reduce((a, b) => a + b, 0);

  const updatedPlayers = gameState.players.map(p => {
    if (p.id === winnerId) {
      return { ...p, score: (p.score || 0) + roundPoints };
    }
    return p;
  });

  const winner = updatedPlayers.find(p => p.id === winnerId);
  const gameOver = winner.score >= gameState.settings.pointsToWin;

  return {
    state: {
      ...gameState,
      players: updatedPlayers,
      status: gameOver ? 'game_over' : 'round_over',
    },
    roundScores,
    roundPoints,
    gameOver,
  };
}

function startNewRound(gameState) {
  const scores = gameState.players.map(p => ({ id: p.id, name: p.name, score: p.score || 0 }));

  let deck = shuffle(createDeck());
  let topCard;
  let deckCopy = [...deck];
  let topIndex = deckCopy.findIndex(c => c.type === 'number');
  if (topIndex === -1) topIndex = 0;
  topCard = deckCopy.splice(topIndex, 1)[0];
  deck = deckCopy;

  const { hands, remaining } = dealCards(deck, gameState.players.length);

  const gamePlayers = gameState.players.map((p, i) => ({
    ...p,
    hand: hands[i],
    cardCount: hands[i].length,
    hasCalledUno: false,
  }));

  // Find the player after the previous round's winner (first in list)
  return {
    ...gameState,
    status: 'playing',
    players: gamePlayers,
    currentPlayerId: gamePlayers[0].id,
    direction: 1,
    topCard,
    activeColor: topCard.color,
    drawPile: remaining,
    drawPileCount: remaining.length,
    discardPile: [topCard],
    lastAction: 'game_start',
    unoWindow: null,
    stackedDrawCount: 0,
    roundScores: {},
    pendingWildDrawFour: null,
  };
}

function getPublicState(gameState) {
  return {
    ...gameState,
    players: gameState.players.map(p => ({
      id: p.id,
      name: p.name,
      cardCount: p.cardCount,
      isConnected: p.isConnected,
      hasCalledUno: p.hasCalledUno,
      score: p.score,
    })),
    drawPile: undefined,
    discardPile: undefined,
  };
}

module.exports = {
  createDeck,
  shuffle,
  dealCards,
  isValidPlay,
  initGameState,
  playCard,
  drawCard,
  callUno,
  catchUno,
  challengeDrawFour,
  endRound,
  startNewRound,
  getPublicState,
  drawCardsForPlayer,
};
