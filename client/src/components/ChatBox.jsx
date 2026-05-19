import { useState, useRef, useEffect } from 'react';

export default function ChatBox({ messages, onSend, collapsed, onToggle }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  }

  if (collapsed) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 w-12 h-12 bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-400 transition-colors z-30"
        aria-label="Open chat"
      >
        💬
        {messages.length > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            {Math.min(messages.length, 9)}
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-72 h-80 flex flex-col bg-gray-900/95 border border-gray-700 rounded-2xl overflow-hidden z-30 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-sm font-bold text-gray-300">Chat</span>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-white text-lg leading-none"
          aria-label="Close chat"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
        {messages.map((msg, i) => (
          <div key={i} className="text-xs">
            {msg.type === 'system' ? (
              <span className="text-gray-500 italic">{msg.message}</span>
            ) : (
              <span>
                <span className="text-neon-cyan font-bold">{msg.playerName}: </span>
                <span className="text-gray-300">{msg.message}</span>
              </span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 p-2 border-t border-gray-700">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          maxLength={200}
          className="flex-1 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg border border-gray-600 focus:outline-none focus:border-gray-400 placeholder-gray-600"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
