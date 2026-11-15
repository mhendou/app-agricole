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

/** Soleil jaune (ciel dégagé). */
export function SoleilJaune({ taille = 32 }: { taille?: number }) {
  return <Soleil taille={taille} />;
}

/** Nuage gris-bleu avec gouttes bleues (jour de pluie). */
export function NuagePluie({ taille = 32 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 40 40" aria-hidden="true">
      <path
        d="M11 24 a7 7 0 0 1 1.5-13.8 A9 9 0 0 1 30 12 a6.2 6.2 0 0 1-.5 12 Z"
        fill="#9fb4c2"
      />
      <g stroke="#3f7fa6" strokeWidth="2.6" strokeLinecap="round">
        <line x1="13" y1="28" x2="11" y2="34" />
        <line x1="21" y1="28" x2="19" y2="35" />
        <line x1="29" y1="28" x2="27" y2="34" />
      </g>
    </svg>
  );
}

/** Soleil voilé : quelques gouttes (moins de 1 mm). */
export function SoleilNuage({ taille = 32 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="15" cy="15" r="7" fill="#d9a441" />
      <g stroke="#d9a441" strokeWidth="2.4" strokeLinecap="round">
        <line x1="15" y1="2" x2="15" y2="5" />
        <line x1="3" y1="15" x2="6" y2="15" />
        <line x1="6" y1="6" x2="8" y2="8" />
        <line x1="24" y1="6" x2="22" y2="8" />
      </g>
      <path
        d="M16 32 a5.5 5.5 0 0 1 1-10.9 A7 7 0 0 1 31 22.5 a4.8 4.8 0 0 1-.4 9.5 Z"
        fill="#c9d3db"
      />
    </svg>
  );
}

/** Petite bouteille d'huile d'olive (pictogramme des litres). */
export function BouteilleHuile({
  taille = 28,
  className = "",
}: {
  taille?: number;
  className?: string;
}) {
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M13 3h6v4l-1 2.5v3.2c2.6 1.1 4 3.3 4 6.3V27a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-8c0-3 1.4-5.2 4-6.3V9.5L13 7V3Z" />
      <path d="M10 20h12" />
      <path d="M16 22.4c-1 1.3-1.6 2-1.6 2.9a1.6 1.6 0 0 0 3.2 0c0-.9-.6-1.6-1.6-2.9Z" />
    </svg>
  );
}
