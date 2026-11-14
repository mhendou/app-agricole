/** Petites illustrations SVG maison, dans la palette de l'appli. */

export function Goutte({ taille = 40 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 40 40" aria-hidden="true">
      <path
        d="M20 4 C 20 4, 8 18, 8 26 a12 12 0 0 0 24 0 C 32 18, 20 4, 20 4 Z"
        fill="#5a8ba8"
        opacity="0.9"
      />
      <path
        d="M14 27 a6 6 0 0 0 5 5"
        fill="none"
        stroke="#fffdf8"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Soleil({ taille = 40 }: { taille?: number }) {
  const rayons = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg width={taille} height={taille} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="8" fill="#d9a441" />
      {rayons.map((a) => (
        <line
          key={a}
          x1="20"
          y1="4"
          x2="20"
          y2="9"
          stroke="#d9a441"
          strokeWidth="2.5"
          strokeLinecap="round"
          transform={`rotate(${a} 20 20)`}
        />
      ))}
    </svg>
  );
}

/** Paysage d'Afourer : le Moyen Atlas, le soleil de fin de journée, une rangée d'oliviers. */
export function Paysage({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 120"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      className={className}
    >
      <circle cx="318" cy="38" r="20" fill="#d9a441" opacity="0.9" />
      <path
        d="M0 96 L70 40 L112 72 L170 24 L244 86 L300 56 L400 100 L400 120 L0 120 Z"
        fill="#a3ad86"
      />
      <path
        d="M0 108 L90 66 L150 96 L230 58 L320 100 L400 82 L400 120 L0 120 Z"
        fill="#5e6b2e"
        opacity="0.85"
      />
      <rect x="0" y="108" width="400" height="12" fill="#3b4520" />
      {[40, 110, 180, 250, 320].map((x) => (
        <g key={x}>
          <rect x={x - 1.5} y="96" width="3" height="14" fill="#2a2722" />
          <ellipse cx={x} cy="92" rx="13" ry="9" fill="#a3ad86" />
        </g>
      ))}
    </svg>
  );
}
