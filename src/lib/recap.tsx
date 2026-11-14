import { promises as fs } from "node:fs";
import path from "node:path";
import { formatDH, formatKg, formatLitres, formatPct, nomMois } from "./format";
import type { StatsAnnee, StatsRecolte } from "./stats";

export const LARGEUR = 1080;
export const HAUTEUR = 1350;

const C = {
  sable: "#f6f1e7",
  creme: "#fffdf8",
  pierre: "#6f624f",
  encre: "#2a2722",
  olive: "#5e6b2e",
  oliveFonce: "#3b4520",
  sauge: "#a3ad86",
  argile: "#b4532a",
  ocre: "#d9a441",
};

async function police(paquet: string, fichier: string) {
  return fs.readFile(
    path.join(process.cwd(), "node_modules", "@fontsource", paquet, "files", fichier),
  );
}

/** Polices Fraunces (titres) et Inter (texte), lues dans node_modules (woff). */
export async function polices() {
  const [f600, i400, i600] = await Promise.all([
    police("fraunces", "fraunces-latin-600-normal.woff"),
    police("inter", "inter-latin-400-normal.woff"),
    police("inter", "inter-latin-600-normal.woff"),
  ]);
  return [
    { name: "Fraunces", data: f600, weight: 600 as const, style: "normal" as const },
    { name: "Inter", data: i400, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: i600, weight: 600 as const, style: "normal" as const },
  ];
}

function Rameau({ taille }: { taille: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 96 96">
      <path d="M20 82 C 36 62, 54 44, 78 16" fill="none" stroke={C.oliveFonce} strokeWidth="2.5" />
      <ellipse cx="30" cy="62" rx="5" ry="13" transform="rotate(-55 30 62)" fill={C.sauge} />
      <ellipse cx="40" cy="71" rx="5" ry="13" transform="rotate(40 40 71)" fill={C.olive} />
      <ellipse cx="42" cy="52" rx="5" ry="13" transform="rotate(-50 42 52)" fill={C.olive} />
      <ellipse cx="53" cy="60" rx="5" ry="13" transform="rotate(45 53 60)" fill={C.sauge} />
      <ellipse cx="55" cy="40" rx="5" ry="13" transform="rotate(-45 55 40)" fill={C.sauge} />
      <ellipse cx="66" cy="47" rx="5" ry="13" transform="rotate(50 66 47)" fill={C.olive} />
      <ellipse cx="68" cy="28" rx="5" ry="13" transform="rotate(-40 68 28)" fill={C.olive} />
      <ellipse cx="76" cy="34" rx="5" ry="13" transform="rotate(55 76 34)" fill={C.sauge} />
      <circle cx="46" cy="80" r="5" fill={C.ocre} />
    </svg>
  );
}

function Chiffre({
  titre,
  valeur,
  couleur,
  fond,
  texte,
}: {
  titre: string;
  valeur: string;
  couleur: string;
  fond: string;
  texte: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        background: fond,
        borderRadius: 28,
        padding: "26px 28px",
      }}
    >
      <div style={{ display: "flex", fontSize: 26, color: texte, opacity: 0.8 }}>{titre}</div>
      <div
        style={{
          display: "flex",
          fontFamily: "Fraunces",
          fontSize: 46,
          color: couleur,
          marginTop: 8,
        }}
      >
        {valeur}
      </div>
    </div>
  );
}

export function RecapImage({
  annee,
  nom,
  stats,
  recolte,
}: {
  annee: number;
  nom: string;
  stats: StatsAnnee;
  recolte: StatsRecolte | null;
}) {
  const maxMois = Math.max(1, ...stats.parMois.flatMap((m) => [m.ventes, m.depenses]));
  return (
    <div
      style={{
        width: LARGEUR,
        height: HAUTEUR,
        display: "flex",
        flexDirection: "column",
        background: C.sable,
        fontFamily: "Inter",
        color: C.encre,
        padding: 64,
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        <Rameau taille={96} />
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 20 }}>
          <div
            style={{ display: "flex", fontFamily: "Fraunces", fontSize: 44, color: C.oliveFonce }}
          >
            {nom}
          </div>
          <div style={{ display: "flex", fontSize: 28, color: C.pierre }}>
            Récap de l&apos;année {annee}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, marginTop: 44 }}>
        <Chiffre
          titre="Ventes encaissées"
          valeur={formatDH(stats.ventesEncaissees)}
          couleur={C.olive}
          fond={C.creme}
          texte={C.pierre}
        />
        <Chiffre
          titre="Dépenses"
          valeur={formatDH(stats.depenses)}
          couleur={C.argile}
          fond={C.creme}
          texte={C.pierre}
        />
      </div>
      <div style={{ display: "flex", marginTop: 20 }}>
        <Chiffre
          titre="Solde"
          valeur={formatDH(stats.solde)}
          couleur={C.creme}
          fond={C.oliveFonce}
          texte={C.sauge}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          background: C.creme,
          borderRadius: 28,
          padding: "26px 28px",
          marginTop: 20,
        }}
      >
        <div style={{ display: "flex", fontSize: 26, color: C.pierre }}>Mois par mois</div>
        <div
          style={{ display: "flex", alignItems: "flex-end", height: 220, marginTop: 16, gap: 8 }}
        >
          {stats.parMois.map((m) => (
            <div
              key={m.mois}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}
            >
              <div style={{ display: "flex", alignItems: "flex-end", height: 190, gap: 3 }}>
                <div
                  style={{
                    display: "flex",
                    width: 22,
                    height: Math.max(2, (m.ventes / maxMois) * 190),
                    background: C.olive,
                    borderRadius: 5,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    width: 22,
                    height: Math.max(2, (m.depenses / maxMois) * 190),
                    background: C.argile,
                    borderRadius: 5,
                  }}
                />
              </div>
              <div style={{ display: "flex", fontSize: 22, color: C.pierre, marginTop: 6 }}>
                {nomMois(m.mois)[0].toUpperCase()}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 28, marginTop: 14, fontSize: 24, color: C.pierre }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                display: "flex",
                width: 18,
                height: 18,
                borderRadius: 9,
                background: C.olive,
              }}
            />
            Ventes
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                display: "flex",
                width: 18,
                height: 18,
                borderRadius: 9,
                background: C.argile,
              }}
            />
            Dépenses
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
        <Chiffre
          titre="Huile vendue"
          valeur={formatLitres(stats.litresVendus)}
          couleur={C.encre}
          fond={C.creme}
          texte={C.pierre}
        />
        <Chiffre
          titre="Prix moyen au litre"
          valeur={stats.prixMoyenLitre !== null ? formatDH(stats.prixMoyenLitre) : "—"}
          couleur={C.encre}
          fond={C.creme}
          texte={C.pierre}
        />
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          background: C.sauge,
          borderRadius: 28,
          padding: "24px 28px",
          marginTop: 20,
        }}
      >
        <div style={{ display: "flex", fontSize: 26, color: C.oliveFonce }}>
          {recolte ? `Dernière récolte : ${recolte.annee}` : "Dernière récolte"}
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "Fraunces",
            fontSize: 40,
            color: C.oliveFonce,
            marginTop: 6,
          }}
        >
          {recolte && recolte.kg !== null
            ? `${formatKg(recolte.kg)}${recolte.litres !== null ? ` · ${formatLitres(recolte.litres)}` : ""}${recolte.rendementPct !== null ? ` · ${formatPct(recolte.rendementPct)}` : ""}`
            : "Pas encore de récolte enregistrée"}
        </div>
      </div>

      <div style={{ display: "flex", flex: 1 }} />
      <div style={{ display: "flex", justifyContent: "center", fontSize: 24, color: C.pierre }}>
        Afourer · oliviers Picholine marocaine
      </div>
    </div>
  );
}
