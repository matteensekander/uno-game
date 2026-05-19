import { useEffect, useRef } from 'react';

function Confetti() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      r: Math.random() * 8 + 4,
      color: ['#FF3333','#FFD700','#00CC44','#0088FF','#FF00FF','#00FFFF'][Math.floor(Math.random() * 6)],
      speed: Math.random() * 3 + 2,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2,
      drift: (Math.random() - 0.5) * 2,
    }));

    let frame;
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of pieces) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.4);
        ctx.restore();

        p.y += p.speed;
        p.x += p.drift;
        p.angle += p.spin;

        if (p.y > canvas.height) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
        }
      }
      frame = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-40"
    />
  );
}

export default function GameOver({ winner, finalScores, onRematch, isHost }) {
  const sorted = [...finalScores].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <>
      <Confetti />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-gray-900 border-4 border-yellow-500 rounded-3xl p-8 flex flex-col items-center gap-6 shadow-[0_0_80px_rgba(234,179,8,0.5)] max-w-md w-full mx-4 animate-bounce-in">
          <div className="flex flex-col items-center gap-2">
            <div className="text-5xl animate-bounce">👑</div>
            <h2 className="text-3xl font-black text-yellow-400">{winner.name} Wins!</h2>
            <p className="text-gray-400 text-sm">Game over — final scores</p>
          </div>

          <div className="w-full">
            <div className="flex flex-col gap-2">
              {sorted.map((player, i) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                    i === 0
                      ? 'bg-yellow-900/60 border-2 border-yellow-500'
                      : 'bg-gray-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{['🥇','🥈','🥉','4️⃣'][i] || ''}</span>
                    <span className="text-white font-bold text-lg">{player.name}</span>
                  </div>
                  <span className={`font-black text-xl ${i === 0 ? 'text-yellow-400' : 'text-white'}`}>
                    {player.score || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {isHost ? (
            <button
              onClick={onRematch}
              className="px-10 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-2xl text-xl transition-colors shadow-lg hover:shadow-yellow-400/50"
            >
              Play Again! 🔄
            </button>
          ) : (
            <p className="text-gray-400">Waiting for host to start a new game...</p>
          )}
        </div>
      </div>
    </>
  );
}
