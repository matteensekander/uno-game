import { useState } from 'react';

export default function Lobby({ onCreateRoom, onJoinRoom, error }) {
  const [activeTab, setActiveTab] = useState('create');
  const [createName, setCreateName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  function handleCreate(e) {
    e.preventDefault();
    if (!createName.trim()) return;
    onCreateRoom(createName.trim());
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!joinName.trim() || !joinCode.trim()) return;
    onJoinRoom(joinName.trim(), joinCode.trim().toUpperCase());
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: 'radial-gradient(ellipse at center, #0a1628 0%, #050d1a 100%)' }}
    >
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center animate-float">
        <div
          className="text-7xl font-black tracking-tighter"
          style={{
            background: 'linear-gradient(135deg, #FF3333, #FFD700, #00CC44, #0088FF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: 'none',
            filter: 'drop-shadow(0 0 20px rgba(255,100,100,0.5))',
          }}
        >
          Ed's UNO
        </div>
        <p className="text-gray-500 text-sm tracking-widest mt-1">MULTIPLAYER ONLINE</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-gray-900/90 border border-gray-700 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden mb-6 border border-gray-700">
          {['create', 'join'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
                activeTab === tab
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab === 'create' ? 'Create Room' : 'Join Room'}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-2 bg-red-900/60 border border-red-500 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {activeTab === 'create' ? (
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 font-bold tracking-widest">YOUR NAME</span>
              <input
                type="text"
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                required
                className="bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </label>
            <button
              type="submit"
              className="py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-black rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-indigo-500/30"
            >
              Create Room
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 font-bold tracking-widest">YOUR NAME</span>
              <input
                type="text"
                value={joinName}
                onChange={e => setJoinName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                required
                className="bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-gray-400 font-bold tracking-widest">ROOM CODE</span>
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="UNO-XXXX"
                maxLength={8}
                required
                className="bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-600 font-mono uppercase focus:outline-none focus:border-indigo-500 transition-colors tracking-widest"
              />
            </label>
            <button
              type="submit"
              className="py-3 bg-green-600 hover:bg-green-500 active:scale-95 text-white font-black rounded-xl text-lg transition-all duration-200 shadow-lg hover:shadow-green-500/30"
            >
              Join Room
            </button>
          </form>
        )}
      </div>

      <p className="text-gray-600 text-xs mt-6">2–4 players · Real-time · No account needed</p>
    </div>
  );
}
