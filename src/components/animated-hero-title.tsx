"use client";

import { useEffect, useMemo, useState } from "react";

type AnimatedHeroTitleProps = {
  phrases: string[];
};

const TYPING_INTERVAL_MS = 95;
const HOLD_MS = 1200;
const ERASING_INTERVAL_MS = 55;

export function AnimatedHeroTitle({ phrases }: AnimatedHeroTitleProps) {
  const items = useMemo(() => phrases.map((item) => item.replace(/\s+/g, " ").trim()).filter(Boolean), [phrases]);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [isErasing, setIsErasing] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }

    const currentPhrase = items[phraseIndex] || "";

    if (!isErasing && visibleCount < currentPhrase.length) {
      const timer = window.setTimeout(() => {
        setVisibleCount((current) => current + 1);
      }, TYPING_INTERVAL_MS);
      return () => window.clearTimeout(timer);
    }

    if (!isErasing && visibleCount === currentPhrase.length) {
      const timer = window.setTimeout(() => {
        setIsErasing(true);
      }, HOLD_MS);
      return () => window.clearTimeout(timer);
    }

    if (isErasing && visibleCount > 0) {
      const timer = window.setTimeout(() => {
        setVisibleCount((current) => current - 1);
      }, ERASING_INTERVAL_MS);
      return () => window.clearTimeout(timer);
    }

    if (isErasing && visibleCount === 0) {
      setIsErasing(false);
      setPhraseIndex((current) => (current + 1) % items.length);
    }
  }, [items, phraseIndex, visibleCount, isErasing]);

  if (items.length === 0) {
    return null;
  }

  const currentPhrase = items[phraseIndex] || "";
  const visibleText = currentPhrase.slice(0, visibleCount);

  return (
    <h1 className="hero-title hero-title-poster" aria-label={currentPhrase}>
      <span className="gradient-text">{visibleText || "\u00A0"}</span>
      <span className="hero-cursor" aria-hidden="true">
        |
      </span>
    </h1>
  );
}
