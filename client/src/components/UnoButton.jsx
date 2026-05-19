import { useState } from 'react';

export default function UnoButton({ onCallUno, myCardCount, hasCalledUno }) {
  const [pressed, setPressed] = useState(false);
  const shouldGlow = myCardCount === 1 && !hasCalledUno;
  const shouldPulse = myCardCount <= 2 && !hasCalledUno;

  function handleClick() {
    if (hasCalledUno || myCardCount !== 1) return;
    setPressed(true);
    onCallUno();
    setTimeout(() => setPressed(false), 3000);
  }

  return (
    <button
      onClick={handleClick}
      disabled={hasCalledUno || myCardCount !== 1}
      className={`
        w-16 h-16 rounded-full font-black text-lg border-4 transition-all duration-200 select-none
        ${pressed
          ? 'bg-green-500 border-green-300 text-white scale-95'
          : shouldGlow
          ? 'bg-red-600 border-red-300 text-white animate-pulse-glow hover:scale-110 active:scale-95'
          : shouldPulse
          ? 'bg-red-700 border-red-500 text-white animate-pulse hover:scale-105'
          : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
        }
      `}
      aria-label="Call UNO"
      title={myCardCount === 1 ? 'Call UNO!' : `UNO (${myCardCount} cards)`}
    >
      {pressed ? '✓' : 'UNO!'}
    </button>
  );
}
