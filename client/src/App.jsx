import { useState, useCallback, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import Lobby from './components/Lobby';
import WaitingRoom from './components/WaitingRoom';
import GameBoard from './components/GameBoard';

const MAX_CHAT = 50;

export default function App() {
  const [screen, setScreen] = useState('lobby'); // lobby | waiting | game
  const [playerId, setPlayerId] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [settings, setSettings] = useState({ stackingEnabled: false, pointsToWin: 500 });
  const [gameState, setGameState] = useState(null);
  const [myHand, setMyHand] = useState([]);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [drawnCard, setDrawnCard] = useState(null);
  const [canPlayDrawn, setCanPlayDrawn] = useState(false);
  const [roundOver, setRoundOver] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [colorBlindMode, setColorBlindMode] = useState(false);

  function addSystemMessage(message) {
    setMessages(prev => [...prev.slice(-MAX_CHAT + 1), {
      type: 'system',
      message,
      timestamp: Date.now(),
    }]);
  }

  const handlers = {
    room_created: ({ roomCode, playerId, players, settings }) => {
      setRoomCode(roomCode);
      setPlayerId(playerId);
      setPlayers(players);
      setSettings(settings);
      setIsHost(true);
      setError(null);
      setScreen('waiting');
    },

    room_joined: ({ roomCode, playerId, players, settings, reconnected }) => {
      setRoomCode(roomCode);
      setPlayerId(playerId);
      setPlayers(players);
      setSettings(settings || { stackingEnabled: false, pointsToWin: 500 });
      setIsHost(players.find(p => p.id === playerId)?.isHost || false);
      setError(null);
      setScreen(reconnected ? 'game' : 'waiting');
      if (reconnected) addSystemMessage('You reconnected to the game.');
    },

    player_joined: ({ player }) => {
      setPlayers(prev => {
        if (prev.find(p => p.id === player.id)) return prev;
        return [...prev, player];
      });
      addSystemMessage(`${player.name} joined the room.`);
    },

    player_reconnected: ({ playerId: pid, name }) => {
      setPlayers(prev => prev.map(p => p.id === pid ? { ...p, isConnected: true } : p));
      addSystemMessage(`${name} reconnected.`);
    },

    player_disconnected: ({ playerId: pid }) => {
      setPlayers(prev => prev.map(p => p.id === pid ? { ...p, isConnected: false } : p));
      const name = players.find(p => p.id === pid)?.name || 'A player';
      addSystemMessage(`${name} disconnected.`);
    },

    settings_updated: (newSettings) => {
      setSettings(newSettings);
    },

    game_started: (state) => {
      setGameState(state);
      setDrawnCard(null);
      setCanPlayDrawn(false);
      setRoundOver(null);
      setGameOver(null);
      setScreen('game');
      addSystemMessage('Game started! Good luck!');
    },

    your_hand: ({ cards }) => {
      setMyHand(cards);
    },

    game_state_update: (state) => {
      setGameState(state);
    },

    card_played: ({ playerId: pid, card, newActiveColor }) => {
      const playerName = gameState?.players?.find(p => p.id === pid)?.name || 'Someone';
      const cardName = formatCardName(card);
      addSystemMessage(`${playerName} played ${cardName}${newActiveColor ? ` → ${newActiveColor}` : ''}`);
      setDrawnCard(null);
      setCanPlayDrawn(false);
    },

    cards_drawn: ({ playerId: pid, count }) => {
      if (pid !== playerId) {
        const playerName = gameState?.players?.find(p => p.id === pid)?.name || 'Someone';
        addSystemMessage(`${playerName} drew ${count} card${count !== 1 ? 's' : ''}.`);
      }
    },

    drawn_card_playable: ({ card }) => {
      setDrawnCard(card);
      setCanPlayDrawn(true);
    },

    uno_called: ({ playerId: pid }) => {
      const name = gameState?.players?.find(p => p.id === pid)?.name || 'Someone';
      addSystemMessage(`🔴 ${name} called UNO!`);
    },

    caught_without_uno: ({ playerId: pid }) => {
      const name = gameState?.players?.find(p => p.id === pid)?.name || 'Someone';
      addSystemMessage(`⚡ ${name} was caught without calling UNO! +2 cards.`);
    },

    challenge_result: ({ valid, penalizedPlayerId }) => {
      const name = gameState?.players?.find(p => p.id === penalizedPlayerId)?.name || 'Someone';
      if (valid) {
        addSystemMessage(`✅ Challenge valid! ${name} draws 4 instead.`);
      } else {
        addSystemMessage(`❌ Challenge failed! ${name} draws 6 cards.`);
      }
    },

    round_over: (data) => {
      setRoundOver(data);
      setGameState(prev => prev ? { ...prev, players: data.scores.map(s => ({ ...prev.players.find(p => p.id === s.id), ...s })) } : prev);
    },

    game_over: (data) => {
      setGameOver(data);
      setRoundOver(null);
    },

    chat_message: (msg) => {
      setMessages(prev => [...prev.slice(-MAX_CHAT + 1), msg]);
    },

    room_closed: ({ message }) => {
      setError(message);
      setScreen('lobby');
    },

    error: ({ code, message }) => {
      setError(message);
      setTimeout(() => setError(null), 5000);
    },
  };

  const { emit } = useSocket(handlers);

  function handleCreateRoom(name) {
    setError(null);
    emit('create_room', { playerName: name });
  }

  function handleJoinRoom(name, code) {
    setError(null);
    emit('join_room', { playerName: name, roomCode: code });
  }

  function handleStartGame() {
    emit('start_game', { roomCode });
  }

  function handleUpdateSettings(newSettings) {
    emit('update_settings', { roomCode, settings: newSettings });
    setSettings(prev => ({ ...prev, ...newSettings }));
  }

  function handleSendChat(message) {
    emit('send_chat', { roomCode, message });
  }

  if (screen === 'lobby') {
    return (
      <>
        <Lobby onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} error={error} />
        {/* Color blind toggle */}
        <button
          onClick={() => setColorBlindMode(c => !c)}
          className="fixed bottom-4 left-4 text-xs text-gray-600 hover:text-gray-400 transition-colors"
          title="Toggle color-blind mode"
        >
          {colorBlindMode ? '♿ Color-blind: ON' : '♿ Color-blind: OFF'}
        </button>
      </>
    );
  }

  if (screen === 'waiting') {
    return (
      <>
        <WaitingRoom
          roomCode={roomCode}
          players={players}
          isHost={isHost}
          playerId={playerId}
          settings={settings}
          onStartGame={handleStartGame}
          onUpdateSettings={handleUpdateSettings}
        />
        {error && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-900 border border-red-500 rounded-xl text-red-200 text-sm z-50">
            {error}
          </div>
        )}
      </>
    );
  }

  if (screen === 'game') {
    return (
      <>
        <GameBoard
          gameState={gameState}
          myHand={myHand}
          playerId={playerId}
          roomCode={roomCode}
          emit={emit}
          messages={messages}
          onSendChat={handleSendChat}
          colorBlindMode={colorBlindMode}
          drawnCard={drawnCard}
          canPlayDrawn={canPlayDrawn}
          roundOver={roundOver}
          gameOver={gameOver}
          onRoundOverClose={() => setRoundOver(null)}
          isHost={isHost}
        />
        {error && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-red-900 border border-red-500 rounded-xl text-red-200 text-sm z-50 animate-slide-in">
            {error}
          </div>
        )}
      </>
    );
  }

  return null;
}

function formatCardName(card) {
  if (!card) return 'a card';
  const colorMap = { red: 'Red', yellow: 'Yellow', green: 'Green', blue: 'Blue', wild: '' };
  const valueMap = {
    skip: 'Skip',
    reverse: 'Reverse',
    draw_two: 'Draw Two',
    wild: 'Wild',
    wild_draw_four: 'Wild Draw Four',
  };
  const color = colorMap[card.color] || '';
  const value = valueMap[card.value] || card.value;
  return color ? `${color} ${value}` : value;
}
