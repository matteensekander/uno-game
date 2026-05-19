const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'UNO-';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function createRoom(hostId, hostName) {
  let roomCode;
  do {
    roomCode = generateRoomCode();
  } while (rooms.has(roomCode));

  const room = {
    roomCode,
    hostId,
    status: 'waiting',
    players: [
      {
        id: hostId,
        name: hostName,
        isConnected: true,
        score: 0,
        isHost: true,
      },
    ],
    settings: {
      stackingEnabled: false,
      pointsToWin: 500,
    },
    gameState: null,
    disconnectTimers: {},
  };

  rooms.set(roomCode, room);
  return room;
}

function joinRoom(roomCode, playerId, playerName) {
  const room = rooms.get(roomCode);
  if (!room) return { error: 'Room not found' };
  if (room.status !== 'waiting') return { error: 'Game already in progress' };
  if (room.players.length >= 4) return { error: 'Room is full' };

  const existingPlayer = room.players.find(p => p.id === playerId);
  if (existingPlayer) return { room };

  room.players.push({
    id: playerId,
    name: playerName,
    isConnected: true,
    score: 0,
    isHost: false,
  });

  return { room };
}

function getRoom(roomCode) {
  return rooms.get(roomCode);
}

function removeRoom(roomCode) {
  rooms.delete(roomCode);
}

function updateRoomSettings(roomCode, settings) {
  const room = rooms.get(roomCode);
  if (!room) return false;
  room.settings = { ...room.settings, ...settings };
  return true;
}

function handleDisconnect(roomCode, playerId) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const player = room.players.find(p => p.id === playerId);
  if (player) {
    player.isConnected = false;
    if (room.gameState) {
      const gp = room.gameState.players.find(p => p.id === playerId);
      if (gp) gp.isConnected = false;
    }
  }
}

function handleReconnect(roomCode, oldPlayerId, newSocketId, playerName) {
  const room = rooms.get(roomCode);
  if (!room) return null;

  const player = room.players.find(p => p.name === playerName && !p.isConnected);
  if (!player) return null;

  const oldId = player.id;
  player.id = newSocketId;
  player.isConnected = true;

  if (room.gameState) {
    const gp = room.gameState.players.find(p => p.id === oldId);
    if (gp) {
      gp.id = newSocketId;
      gp.isConnected = true;
    }
    if (room.gameState.currentPlayerId === oldId) {
      room.gameState.currentPlayerId = newSocketId;
    }
  }

  return { room, oldId };
}

function getRoomForPlayer(playerId) {
  for (const [, room] of rooms) {
    if (room.players.some(p => p.id === playerId)) {
      return room;
    }
  }
  return null;
}

module.exports = {
  createRoom,
  joinRoom,
  getRoom,
  removeRoom,
  updateRoomSettings,
  handleDisconnect,
  handleReconnect,
  getRoomForPlayer,
};
