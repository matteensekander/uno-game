import { useState } from 'react';

export default function WaitingRoom({
  roomCode,
  players,
  isHost,
  playerId,
  settings,
  onStartGame,
  onUpdateSettings,
}) {
  const [copied, setCopied] = useState(false);

  function copyCode() {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function toggleStacking() {
    if (!isHost) return;
    onUpdateSettings({ stackingEnabled: !settings.stackingEnabled });
  }

  function changePoints(pts) {
    if (!isHost) return;
    onUpdateSettings({ pointsToWin: Number(pts) });
  }

  const canStart = isHost && players.length >= 2;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at center, #0a1628 0%, #050d1a 100%)' }}
    >
      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Room code display */}
        <div className="bg-gray-900/90 border border-indigo-700 rounded-3xl p-6 text-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
          <p className="text-gray-400 text-xs font-bold tracking-widest mb-2">ROOM CODE</p>
          <div className="text-4xl font-black text-white tracking-widest font-mono mb-3">
            {roomCode}
          </div>
          <button
            onClick={copyCode}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl text-sm text-gray-300 transition-colors font-bold"
          >
            {copied ? '✓ Copied!' : '📋 Copy invite link'}
          </button>
          <p className="text-gray-600 text-xs mt-2">Share this code with friends to join</p>
        </div>

        {/* Players list */}
        <div className="bg-gray-900/90 border border-gray-700 rounded-3xl p-5">
          <p className="text-gray-400 text-xs font-bold tracking-widest mb-4">
            PLAYERS ({players.length}/4)
          </p>
          <div className="flex flex-col gap-2">
            {players.map(player => (
              <div
                key={player.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                  player.id === playerId
                    ? 'bg-indigo-900/40 border border-indigo-600'
                    : 'bg-gray-800/60'
                }`}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm"
                  style={{ background: avatarColor(player.name), color: '#fff' }}
                >
                  {player.name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <span className="text-white font-bold">{player.name}</span>
                  {player.id === playerId && (
                    <span className="text-indigo-400 text-xs ml-1">(you)</span>
                  )}
                </div>
                {player.isHost && (
                  <span className="text-yellow-400 text-xs font-bold px-2 py-0.5 bg-yellow-900/40 border border-yellow-700 rounded-full">
                    HOST
                  </span>
                )}
                <div className="w-2 h-2 rounded-full bg-green-400" title="Connected" />
              </div>
            ))}

            {/* Empty slots */}
            {Array.from({ length: 4 - players.length }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/20 border border-dashed border-gray-700">
                <div className="w-9 h-9 rounded-full bg-gray-700/40 border-2 border-dashed border-gray-600" />
                <span className="text-gray-600 text-sm">Waiting for player...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Settings (host only) */}
        <div className="bg-gray-900/90 border border-gray-700 rounded-3xl p-5">
          <p className="text-gray-400 text-xs font-bold tracking-widest mb-4">GAME SETTINGS</p>
          <div className="flex flex-col gap-3">
            {/* Stacking */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white text-sm font-bold">Draw Two Stacking</span>
                <p className="text-gray-500 text-xs">Stack Draw Twos to pass penalty along</p>
              </div>
              <button
                onClick={toggleStacking}
                disabled={!isHost}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.stackingEnabled ? 'bg-indigo-600' : 'bg-gray-700'
                } ${!isHost ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    settings.stackingEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Points to win */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-white text-sm font-bold">Points to Win</span>
                <p className="text-gray-500 text-xs">First to reach this score wins</p>
              </div>
              <select
                value={settings.pointsToWin}
                onChange={e => changePoints(e.target.value)}
                disabled={!isHost}
                className={`bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none ${
                  !isHost ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                {[200, 300, 500, 1000].map(pts => (
                  <option key={pts} value={pts}>{pts}</option>
                ))}
              </select>
            </div>
          </div>
          {!isHost && <p className="text-gray-600 text-xs mt-2 text-center">Only the host can change settings</p>}
        </div>

        {/* Start button */}
        {isHost ? (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className={`py-4 font-black text-xl rounded-2xl transition-all duration-200 ${
              canStart
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg hover:shadow-indigo-500/40 active:scale-95'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            {canStart ? 'Start Game!' : `Need ${2 - players.length} more player${2 - players.length !== 1 ? 's' : ''}`}
          </button>
        ) : (
          <div className="py-4 text-center text-gray-400 text-sm animate-pulse">
            Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  );
}

function avatarColor(name) {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316','#10b981','#3b82f6','#06b6d4'];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
}
