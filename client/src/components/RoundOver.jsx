import { useState, useEffect } from 'react';

export default function RoundOver({ winner, scores, roundPoints, roundScores, onNextRound, isHost }) {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(t);
          if (isHost) onNextRound();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const sorted = [...scores].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="bg-gray-900 border-2 border-indigo-500 rounded-3xl p-8 flex flex-col items-center gap-6 shadow-[0_0_60px_rgba(99,102,241,0.4)] max-w-md w-full mx-4 animate-bounce-in">
        {/* Winner banner */}
        <div className="flex flex-col items-center gap-1">
          <div className="text-4xl">🏆</div>
          <h2 className="text-2xl font-black text-white">{winner.name} wins the round!</h2>
          <p className="text-indigo-300 font-bold text-lg">+{roundPoints} points</p>
        </div>

        {/* Score table */}
        <div className="w-full">
          <div className="text-xs text-gray-400 font-bold tracking-widest text-center mb-3">STANDINGS</div>
          <div className="flex flex-col gap-2">
            {sorted.map((player, i) => (
              <div
                key={player.id}
                className={`flex items-center justify-between px-4 py-2 rounded-xl ${
                  i === 0 ? 'bg-indigo-900/60 border border-indigo-500' : 'bg-gray-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm font-bold w-4">{i + 1}</span>
                  <span className="text-white font-bold">{player.name}</span>
                  {player.id === winner.id && (
                    <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">Round Winner</span>
                  )}
                </div>
                <span className="text-white font-black text-lg">{player.score || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Next round controls */}
        <div className="flex flex-col items-center gap-2">
          {isHost ? (
            <button
              onClick={onNextRound}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-colors text-lg"
            >
              Next Round ({countdown}s)
            </button>
          ) : (
            <p className="text-gray-400 text-sm">
              Next round starting in {countdown}s...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
