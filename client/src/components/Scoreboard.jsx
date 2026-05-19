export default function Scoreboard({ players, pointsToWin }) {
  const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-gray-400 font-bold tracking-widest text-center">SCORES</div>
      <div className="flex flex-col gap-1 min-w-[120px]">
        {sorted.map(player => {
          const pct = Math.min(100, ((player.score || 0) / pointsToWin) * 100);
          return (
            <div key={player.id} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-300 truncate">{player.name}</span>
                  <span className="text-white font-bold ml-1">{player.score || 0}</span>
                </div>
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-xs text-gray-500 text-center">Goal: {pointsToWin} pts</div>
    </div>
  );
}
