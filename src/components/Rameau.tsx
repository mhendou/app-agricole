/** Rameau d'olivier au trait, dans la palette de l'appli. */
export function Rameau({ taille = 96, className = "" }: { taille?: number; className?: string }) {
  const feuille = (x: number, y: number, rot: number, couleur: string) => (
    <ellipse
      cx={x}
      cy={y}
      rx="5"
      ry="13"
      transform={`rotate(${rot} ${x} ${y})`}
      fill={couleur}
      opacity="0.92"
    />
  );
  return (
    <svg
      width={taille}
      height={taille}
      viewBox="0 0 96 96"
      role="img"
      aria-label="Rameau d'olivier"
      className={className}
    >
      <path
        d="M20 82 C 36 62, 54 44, 78 16"
        fill="none"
        stroke="#3b4520"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {feuille(30, 62, -55, "#a3ad86")}
      {feuille(40, 71, 40, "#5e6b2e")}
      {feuille(42, 52, -50, "#5e6b2e")}
      {feuille(53, 60, 45, "#a3ad86")}
      {feuille(55, 40, -45, "#a3ad86")}
      {feuille(66, 47, 50, "#5e6b2e")}
      {feuille(68, 28, -40, "#5e6b2e")}
      {feuille(76, 34, 55, "#a3ad86")}
      <ellipse cx="82" cy="18" rx="4.5" ry="6" fill="#3b4520" transform="rotate(30 82 18)" />
      <circle cx="46" cy="80" r="5" fill="#d9a441" />
    </svg>
  );
}
