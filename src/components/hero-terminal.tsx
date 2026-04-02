"use client";

import { useEffect, useState } from "react";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function HeroTerminal({ siteName }: { siteName: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const hour = now.getHours();
  const greeting =
    hour < 9 ? "早安，美好的一天开始了" : hour < 12 ? "上午好，保持专注" : hour < 18 ? "下午好，继续推进" : "晚上好，放松一下";

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <span className="terminal-btn close" />
        <span className="terminal-btn minimize" />
        <span className="terminal-btn maximize" />
        <span className="terminal-title">{siteName}.portfolio</span>
      </div>
      <div className="terminal-body">
        <div className="terminal-line">
          <span className="terminal-prompt">$</span>
          <span className="terminal-command">whoami</span>
        </div>
        <div className="terminal-output terminal-result">LiuEggy / Embedded + Vision Builder</div>
        <div className="terminal-line">
          <span className="terminal-prompt">$</span>
          <span className="terminal-command">date</span>
        </div>
        <div className="terminal-output">
          {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
        </div>
        <div className="terminal-line">
          <span className="terminal-prompt">$</span>
          <span className="terminal-command">status</span>
        </div>
        <div className="terminal-output info-line">{greeting}</div>
        <div className="terminal-output skill-line">
          <span className="skill-label">Focus</span>
          <span className="skill-value">STM32 / OpenCV / Web Systems</span>
        </div>
        <div className="terminal-output skill-line">
          <span className="skill-label">Stack</span>
          <span className="skill-value">Next.js + Supabase + Vercel</span>
        </div>
        <div className="terminal-output skill-line">
          <span className="skill-label">Mode</span>
          <span className="skill-value">Shipping production-ready work</span>
        </div>
      </div>
    </div>
  );
}
