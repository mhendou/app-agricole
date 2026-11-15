"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

/** Petite flèche discrète en bas à droite : indique qu'il reste du contenu plus bas. */
export function IndiceDefilement() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const maj = () => {
      const el = document.documentElement;
      const reste = el.scrollHeight - (window.scrollY + window.innerHeight);
      setVisible(reste > 80);
    };
    maj();
    window.addEventListener("scroll", maj, { passive: true });
    window.addEventListener("resize", maj);
    const obs = new ResizeObserver(maj);
    obs.observe(document.body);
    return () => {
      window.removeEventListener("scroll", maj);
      window.removeEventListener("resize", maj);
      obs.disconnect();
    };
  }, []);

  if (!visible) return null;
  return (
    <button
      type="button"
      aria-label="Faire défiler vers le bas"
      onClick={() => window.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" })}
      className="fixed bottom-24 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-creme/90 text-olive-fonce shadow-carte backdrop-blur lg:bottom-6"
    >
      <ChevronDown size={22} strokeWidth={1.75} className="anim-rebond" aria-hidden="true" />
    </button>
  );
}
