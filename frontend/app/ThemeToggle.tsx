'use client'
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
  return (
    <button
      className="fixed left-5 top-5 z-40 bg-white/10 rounded-full px-3 py-2 text-cyan-500 font-bold text-xl shadow hover:bg-white/40"
      aria-label="Toggle theme"
      onClick={() => setDark(d => !d)}
    >
      {dark ? "🌙" : "🌞"}
    </button>
  );
}
