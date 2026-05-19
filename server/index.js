const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const {
  initGameState,
  playCard,
  drawCard,
  callUno,
  catchUno,
  challengeDrawFour,
  endRound,
  startNewRound,
  getPublicState,
} = require('./gameEngine');

const {
  createRoom,
  joinRoom,
  getRoom,
  updateRoomSettings,
  handleDisconnect,
  handleReconnect,
  getRoomForPlayer,
} = require('./roomManager');

const DEBUG = process.env.DEBUG === 'true';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

const isProd = process.env.NODE_ENV === 'production';
if (isProd) {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

function debugLog(label, data) {
  if (DEBUG) {
    console.log(`[DEBUG] ${label}:`, JSON.stringify(data, null, 2));
  }
}

function emitGameState(io, room) {
  const publicState = getPublicState(room.gameState);
  io.to(room.roomCode).emit('game_state_update', publicState);

  // Send private hands
  for (const player of room.gameState.players) {
    io.to(player.id).emit('your_hand', { cards: player.hand });
  }

  debugLog('game_state', publicState);
}

// Auto-advance turn for disconnected players
const turnTimers = new Map();

function startTurnTimer(roomCode, playerId) {
  clearTurnTimer(roomCode);
  const timer = setTimeout(() => {
    const room = getRoom(roomCode);
    if (!room || !room.gameState) return;
    if (room.gameState.currentPlayerId !== playerId) return;
    const player = room.gameState.players.find(p => p.id === playerId);
    if (!player || player.isConnected) return;

    // Auto-draw and skip
    const result = drawCard(room.gameState, playerId);
    if (!result.error) {
      room.gameState = result.state;
      emitGameState(io, room);
      io.to(roomCode).emit('cards_drawn', { playerId, count: result.drewCount || 1 });
    }
  }, 15000);
  turnTimers.set(roomCode, timer);
}

function clearTurnTimer(roomCode) {
  if (turnTimers.has(roomCode)) {
    clearTimeout(turnTimers.get(roomCode));
    turnTimers.delete(roomCode);
  }
}

io.on('connection', (socket) => {
  console.log(`[+] Client connected: ${socket.id}`);

  socket.on('create_room', ({ playerName }) => {
    if (!playerName?.trim()) {
      socket.emit('error', { code: 'INVALID_NAME', message: 'Player name is required' });
      return;
    }

    const room = createRoom(socket.id, playerName.trim());
    socket.join(room.roomCode);
    socket.emit('room_created', {
      roomCode: room.roomCode,
      playerId: socket.id,
      players: room.players,
      settings: room.settings,
    });
    console.log(`[Room] Created: ${room.roomCode} by ${playerName}`);
  });

  socket.on('join_room', ({ playerName, roomCode }) => {
    if (!playerName?.trim() || !roomCode?.trim()) {
      socket.emit('error', { code: 'INVALID_INPUT', message: 'Name and room code are required' });
      return;
    }

    const code = roomCode.trim().toUpperCase();

    // Check for reconnection
    const existingRoom = getRoom(code);
    if (existingRoom) {
      const disconnectedPlayer = existingRoom.players.find(
        p => p.name === playerName.trim() && !p.isConnected
      );
      if (disconnectedPlayer) {
        const result = handleReconnect(code, disconnectedPlayer.id, socket.id, playerName.trim());
        if (result) {
          socket.join(code);
          clearTurnTimer(code);
          socket.emit('room_joined', {
            roomCode: code,
            playerId: socket.id,
            players: existingRoom.players,
            settings: existingRoom.settings,
            reconnected: true,
          });
          if (existingRoom.gameState) {
            socket.emit('game_started', getPublicState(existingRoom.gameState));
            socket.emit('your_hand', {
              cards: existingRoom.gameState.players.find(p => p.id === socket.id)?.hand || [],
            });
          }
          socket.to(code).emit('player_reconnected', { playerId: socket.id, name: playerName.trim() });
          io.to(code).emit('game_state_update', getPublicState(existingRoom.gameState));
          return;
        }
      }
    }

    const result = joinRoom(code, socket.id, playerName.trim());
    if (result.error) {
      socket.emit('error', { code: 'JOIN_ERROR', message: result.error });
      return;
    }

    socket.join(code);
    socket.emit('room_joined', {
      roomCode: code,
      playerId: socket.id,
      players: result.room.players,
      settings: result.room.settings,
    });

    socket.to(code).emit('player_joined', {
      player: { id: socket.id, name: playerName.trim(), isConnected: true, score: 0 },
    });

    console.log(`[Room] ${playerName} joined ${code}`);
  });

  socket.on('update_settings', ({ roomCode, settings }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    if (room.hostId !== socket.id) {
      socket.emit('error', { code: 'NOT_HOST', message: 'Only the host can change settings' });
      return;
    }
    updateRoomSettings(roomCode, settings);
    io.to(roomCode).emit('settings_updated', room.settings);
  });

  socket.on('start_game', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room) {
      socket.emit('error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
      return;
    }
    if (room.hostId !== socket.id) {
      socket.emit('error', { code: 'NOT_HOST', message: 'Only the host can start the game' });
      return;
    }
    if (room.players.length < 2) {
      socket.emit('error', { code: 'NOT_ENOUGH_PLAYERS', message: 'Need at least 2 players' });
      return;
    }

    room.gameState = initGameState(room);
    room.status = 'playing';

    const publicState = getPublicState(room.gameState);
    io.to(roomCode).emit('game_started', publicState);

    for (const player of room.gameState.players) {
      io.to(player.id).emit('your_hand', { cards: player.hand });
    }

    console.log(`[Game] Started in room ${roomCode}`);
  });

  socket.on('play_card', ({ roomCode, cardId, chosenColor }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return;

    const result = playCard(room.gameState, socket.id, cardId, chosenColor);
    if (result.error) {
      socket.emit('error', { code: 'INVALID_PLAY', message: result.error });
      return;
    }

    room.gameState = result.state;
    clearTurnTimer(roomCode);

    const playedCard = room.gameState.topCard;
    io.to(roomCode).emit('card_played', {
      playerId: socket.id,
      card: playedCard,
      newTopCard: playedCard,
      newActiveColor: room.gameState.activeColor,
    });

    if (result.roundOver) {
      const roundResult = endRound(room.gameState, result.winnerId);
      room.gameState = roundResult.state;

      const winner = room.gameState.players.find(p => p.id === result.winnerId);
      io.to(roomCode).emit('round_over', {
        winner: { id: winner.id, name: winner.name },
        scores: room.gameState.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
        roundPoints: roundResult.roundPoints,
        roundScores: roundResult.roundScores,
      });

      if (roundResult.gameOver) {
        io.to(roomCode).emit('game_over', {
          winner: { id: winner.id, name: winner.name },
          finalScores: room.gameState.players.map(p => ({ id: p.id, name: p.name, score: p.score })),
        });
        room.status = 'waiting';
      }
      return;
    }

    emitGameState(io, room);

    // Start turn timer if current player is disconnected
    const currentPlayer = room.gameState.players.find(p => p.id === room.gameState.currentPlayerId);
    if (currentPlayer && !currentPlayer.isConnected) {
      startTurnTimer(roomCode, currentPlayer.id);
    }
  });

  socket.on('draw_card', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return;

    const result = drawCard(room.gameState, socket.id);
    if (result.error) {
      socket.emit('error', { code: 'DRAW_ERROR', message: result.error });
      return;
    }

    room.gameState = result.state;
    clearTurnTimer(roomCode);

    io.to(roomCode).emit('cards_drawn', { playerId: socket.id, count: result.drewCount || 1 });

    if (result.canPlay && result.drawnCard) {
      socket.emit('drawn_card_playable', { card: result.drawnCard });
    }

    emitGameState(io, room);
  });

  socket.on('pass_after_draw', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return;
    if (room.gameState.currentPlayerId !== socket.id) return;

    const gs = room.gameState;
    const playerCount = gs.players.length;
    const currentIndex = gs.players.findIndex(p => p.id === socket.id);
    const nextIndex = ((currentIndex + gs.direction) % playerCount + playerCount) % playerCount;

    room.gameState = {
      ...gs,
      currentPlayerId: gs.players[nextIndex].id,
      lastAction: 'pass',
    };

    emitGameState(io, room);
  });

  socket.on('call_uno', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return;

    const result = callUno(room.gameState, socket.id);
    if (result.error) {
      socket.emit('error', { code: 'UNO_ERROR', message: result.error });
      return;
    }

    room.gameState = result.state;
    io.to(roomCode).emit('uno_called', { playerId: socket.id });
    emitGameState(io, room);
  });

  socket.on('catch_uno', ({ roomCode, targetPlayerId }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return;

    const result = catchUno(room.gameState, socket.id, targetPlayerId);
    if (result.error) {
      socket.emit('error', { code: 'CATCH_ERROR', message: result.error });
      return;
    }

    room.gameState = result.state;
    io.to(roomCode).emit('caught_without_uno', { playerId: result.penalizedId });
    emitGameState(io, room);
  });

  socket.on('challenge_draw_four', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return;

    const result = challengeDrawFour(room.gameState, socket.id);
    if (result.error) {
      socket.emit('error', { code: 'CHALLENGE_ERROR', message: result.error });
      return;
    }

    room.gameState = result.state;
    io.to(roomCode).emit('challenge_result', {
      valid: result.valid,
      penalizedPlayerId: result.penalizedPlayerId,
    });
    emitGameState(io, room);
  });

  socket.on('send_chat', ({ roomCode, message }) => {
    if (!message?.trim()) return;
    const room = getRoom(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    io.to(roomCode).emit('chat_message', {
      playerName: player.name,
      message: message.trim().slice(0, 200),
      timestamp: Date.now(),
      type: 'player',
    });
  });

  socket.on('request_rematch', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room) return;

    // Reset scores and start a new game
    room.gameState.players = room.gameState.players.map(p => ({ ...p, score: 0 }));
    room.gameState = startNewRound(room.gameState);
    room.status = 'playing';

    const publicState = getPublicState(room.gameState);
    io.to(roomCode).emit('game_started', publicState);
    for (const player of room.gameState.players) {
      io.to(player.id).emit('your_hand', { cards: player.hand });
    }
  });

  socket.on('start_next_round', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room?.gameState) return;
    if (room.hostId !== socket.id) return;

    room.gameState = startNewRound(room.gameState);
    room.status = 'playing';

    const publicState = getPublicState(room.gameState);
    io.to(roomCode).emit('game_started', publicState);
    for (const player of room.gameState.players) {
      io.to(player.id).emit('your_hand', { cards: player.hand });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[-] Client disconnected: ${socket.id}`);
    const room = getRoomForPlayer(socket.id);
    if (!room) return;

    handleDisconnect(room.roomCode, socket.id);
    io.to(room.roomCode).emit('player_disconnected', {
      playerId: socket.id,
      secondsToRejoin: 60,
    });

    if (room.gameState && room.gameState.currentPlayerId === socket.id) {
      startTurnTimer(room.roomCode, socket.id);
    }

    // Remove room if host left and game hasn't started
    if (room.status === 'waiting' && room.hostId === socket.id) {
      io.to(room.roomCode).emit('room_closed', { message: 'Host left the room' });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[Server] UNO server running on port ${PORT}`);
  console.log(`[Server] Debug mode: ${DEBUG}`);
});
