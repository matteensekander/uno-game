import { useState, useEffect, useCallback } from 'react';
import PlayerHand from './PlayerHand';
import OpponentHand from './OpponentHand';
import DiscardPile from './DiscardPile';
import DrawPile from './DrawPile';
import ColorPicker from './ColorPicker';
import UnoButton from './UnoButton';
import Scoreboard from './Scoreboard';
import ChatBox from './ChatBox';
import RoundOver from './RoundOver';
import GameOver from './GameOver';
import { isValidPlay } from '../utils/gameUtils';

export default function GameBoard({
  gameState,
  myHand,
  playerId,
  roomCode,
  emit,
  messages,
  onSendChat,
  colorBlindMode,
  drawnCard,
  canPlayDrawn,
  roundOver,
  gameOver,
  onRoundOverClose,
  isHost,
}) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pendingWildCard, setPendingWildCard] = useState(null);
  const [chatCollapsed, setChatCollapsed] = useState(true);
  const [toast, setToast] = useState(null);
  const [unoFlash, setUnoFlash] = useState(false);
  const [shakingCards, setShakingCards] = useState(false);

  const me = gameState?.players?.find(p => p.id === playerId);
  const isMyTurn = gameState?.currentPlayerId === playerId;
  const opponents = gameState?.players?.filter(p => p.id !== playerId) || [];

  // Compute playable card IDs
  const playableCardIds = myHand
    ?.filter(card => {
      if (gameState?.stackedDrawCount > 0) {
        return card.type === 'action' && card.value === 'draw_two' && gameState.settings?.stackingEnabled;
      }
      return isValidPlay(card, gameState?.topCard, gameState?.activeColor);
    })
    .map(c => c.id) || [];

  function showToast(msg, type = 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handlePlayCard(card) {
    if (!isMyTurn) return;
    if (card.type === 'wild') {
      setPendingWildCard(card);
      setShowColorPicker(true);
      return;
    }
    emit('play_card', { roomCode, cardId: card.id });
  }

  function handleColorChosen(color) {
    if (!pendingWildCard) return;
    emit('play_card', { roomCode, cardId: pendingWildCard.id, chosenColor: color });
    setShowColorPicker(false);
    setPendingWildCard(null);
  }

  function handleDraw() {
    if (!isMyTurn) return;
    emit('draw_card', { roomCode });
  }

  function handlePassAfterDraw() {
    emit('pass_after_draw', { roomCode });
  }

  function handleCallUno() {
    emit('call_uno', { roomCode });
    setUnoFlash(true);
    setTimeout(() => setUnoFlash(false), 2000);
  }

  function handleCatchUno(targetId) {
    emit('catch_uno', { roomCode, targetPlayerId: targetId });
  }

  function handleChallenge() {
    emit('challenge_draw_four', { roomCode });
  }

  function handleNextRound() {
    emit('start_next_round', { roomCode });
  }

  function handleRematch() {
    emit('request_rematch', { roomCode });
  }

  // Keyboard navigation
  useEffect(() => {
    function onKey(e) {
      if (!isMyTurn || !myHand?.length) return;
      if (e.key === 'Enter' || e.key === ' ') {
        const playable = myHand.find(c => playableCardIds.includes(c.id));
        if (playable) handlePlayCard(playable);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMyTurn, myHand, playableCardIds]);

  if (!gameState) return null;

  const currentPlayer = gameState.players?.find(p => p.id === gameState.currentPlayerId);
  const direction = gameState.direction === 1 ? '↻' : '↺';

  // Position opponents based on count
  const [topOpponent, leftOpponent, rightOpponent] = getOpponentPositions(opponents);

  return (
    <div
      className="fixed inset-0 overflow-hidden select-none"
      style={{
        background: 'radial-gradient(ellipse at center, #0a2e1a 0%, #051a0e 60%, #030e08 100%)',
      }}
    >
      {/* UNO Flash */}
      {unoFlash && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="text-8xl font-black text-red-500 animate-bounce-in" style={{ textShadow: '0 0 40px #FF3333' }}>
            UNO!
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl font-bold text-sm shadow-xl animate-slide-in ${
            toast.type === 'error'
              ? 'bg-red-900 border border-red-500 text-red-200'
              : 'bg-green-900 border border-green-500 text-green-200'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Top HUD bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-black/40 backdrop-blur-sm border-b border-white/10 z-20">
        {/* Direction + color */}
        <div className="flex items-center gap-3">
          <div className="text-2xl text-white font-black" title="Play direction">{direction}</div>
          <div
            className="w-5 h-5 rounded-full border-2 border-white shadow-lg"
            style={{ background: gameState.activeColor === 'wild' ? '#9333ea' : colorHex(gameState.activeColor) }}
            title={`Active color: ${gameState.activeColor}`}
          />
          <span className="text-gray-400 text-xs capitalize">{gameState.activeColor}</span>
        </div>

        {/* Room code */}
        <div className="text-gray-500 text-xs font-mono">{roomCode}</div>

        {/* Scoreboard */}
        <Scoreboard players={gameState.players} pointsToWin={gameState.settings?.pointsToWin || 500} />
      </div>

      {/* Top opponent */}
      {topOpponent && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10">
          <OpponentHand
            player={topOpponent}
            isCurrentPlayer={gameState.currentPlayerId === topOpponent.id}
            unoWindow={gameState.unoWindow}
            onCatchUno={handleCatchUno}
            position="top"
            colorBlindMode={colorBlindMode}
          />
        </div>
      )}

      {/* Left opponent */}
      {leftOpponent && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
          <OpponentHand
            player={leftOpponent}
            isCurrentPlayer={gameState.currentPlayerId === leftOpponent.id}
            unoWindow={gameState.unoWindow}
            onCatchUno={handleCatchUno}
            position="left"
            colorBlindMode={colorBlindMode}
          />
        </div>
      )}

      {/* Right opponent */}
      {rightOpponent && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
          <OpponentHand
            player={rightOpponent}
            isCurrentPlayer={gameState.currentPlayerId === rightOpponent.id}
            unoWindow={gameState.unoWindow}
            onCatchUno={handleCatchUno}
            position="right"
            colorBlindMode={colorBlindMode}
          />
        </div>
      )}

      {/* Center table — discard + draw */}
      <div className="absolute inset-0 flex items-center justify-center gap-12 z-10">
        <DrawPile
          count={gameState.drawPileCount}
          onDraw={handleDraw}
          isMyTurn={isMyTurn}
          stackedDrawCount={gameState.stackedDrawCount}
        />

        <DiscardPile
          topCard={gameState.topCard}
          activeColor={gameState.activeColor}
        />

        {/* Challenge button (shown to next player after WD4) */}
        {gameState.pendingWildDrawFour && gameState.currentPlayerId === playerId && (
          <div className="absolute top-full mt-4 flex flex-col items-center gap-2">
            <button
              onClick={handleChallenge}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-sm border border-orange-400 transition-colors"
            >
              Challenge +4
            </button>
            <span className="text-gray-400 text-xs">or just draw 4</span>
          </div>
        )}
      </div>

      {/* Current turn indicator */}
      {!isMyTurn && currentPlayer && (
        <div className="absolute bottom-48 left-1/2 -translate-x-1/2 text-gray-400 text-sm z-20">
          {currentPlayer.name}'s turn...
        </div>
      )}

      {/* Bottom — my hand */}
      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2 z-20">
        <PlayerHand
          cards={myHand || []}
          playableCardIds={isMyTurn ? playableCardIds : []}
          onPlayCard={handlePlayCard}
          isMyTurn={isMyTurn}
          colorBlindMode={colorBlindMode}
          drawnCard={canPlayDrawn ? drawnCard : null}
          onPassAfterDraw={handlePassAfterDraw}
          pendingWildDrawFour={gameState.pendingWildDrawFour && isMyTurn ? gameState.pendingWildDrawFour : null}
        />
      </div>

      {/* UNO Button (bottom-right) */}
      <div className="absolute bottom-6 right-4 z-30">
        <UnoButton
          onCallUno={handleCallUno}
          myCardCount={myHand?.length || 0}
          hasCalledUno={me?.hasCalledUno}
        />
      </div>

      {/* Color picker modal */}
      {showColorPicker && (
        <ColorPicker
          onChoose={handleColorChosen}
          card={pendingWildCard}
        />
      )}

      {/* Chat */}
      <ChatBox
        messages={messages}
        onSend={onSendChat}
        collapsed={chatCollapsed}
        onToggle={() => setChatCollapsed(c => !c)}
      />

      {/* Round over overlay */}
      {roundOver && (
        <RoundOver
          winner={roundOver.winner}
          scores={roundOver.scores}
          roundPoints={roundOver.roundPoints}
          roundScores={roundOver.roundScores}
          onNextRound={handleNextRound}
          isHost={isHost}
        />
      )}

      {/* Game over overlay */}
      {gameOver && (
        <GameOver
          winner={gameOver.winner}
          finalScores={gameOver.finalScores}
          onRematch={handleRematch}
          isHost={isHost}
        />
      )}
    </div>
  );
}

function colorHex(color) {
  const map = { red: '#DC2626', yellow: '#FACC15', green: '#22C55E', blue: '#2563EB' };
  return map[color] || '#9333ea';
}

function getOpponentPositions(opponents) {
  if (opponents.length === 1) return [opponents[0], null, null];
  if (opponents.length === 2) return [opponents[0], null, opponents[1]];
  if (opponents.length === 3) return [opponents[0], opponents[1], opponents[2]];
  return [null, null, null];
}
