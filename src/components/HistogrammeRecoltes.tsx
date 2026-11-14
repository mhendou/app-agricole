"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatKg, formatLitres } from "@/lib/format";
import { useLarge, usePrefersReducedMotion } from "@/lib/hooks";

export type PointRecolte = {
  annee: number;
  kg: number | null;
  litres: number | null;
  perdue: boolean;
};

export function HistogrammeRecoltes({
  donnees,
  anneeSelectionnee,
}: {
  donnees: PointRecolte[];
  anneeSelectionnee: number;
}) {
  const reduit = usePrefersReducedMotion();
  const large = useLarge();
  const max = Math.max(1000, ...donnees.map((d) => d.kg ?? 0));
  // Une année perdue n'a pas de valeur : on lui dessine une barre grise hachurée de hauteur fixe.
  const lignes = donnees.map((d) => ({
    ...d,
    valeur: d.perdue ? Math.round(max * 0.3) : (d.kg ?? 0),
    etiquette: large ? String(d.annee) : `’${String(d.annee).slice(2)}`,
  }));
  return (
    <figure aria-label="Récoltes d'olives par année">
      <div className="h-72 w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 320, height: 288 }}
        >
          <BarChart data={lignes} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <pattern
                id="hachure-perdue"
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="8" height="8" fill="#e8e2d4" />
                <rect width="4" height="8" fill="#b9b1a1" />
              </pattern>
            </defs>
            <CartesianGrid vertical={false} stroke="#e8e2d4" />
            <XAxis
              dataKey="etiquette"
              interval={large ? 0 : 1}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#6f624f", fontSize: 14 }}
            />
            <YAxis
              width={44}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#6f624f", fontSize: 14 }}
              tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000} t` : String(v))}
            />
            <Tooltip
              cursor={{ fill: "rgba(163,173,134,0.2)" }}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as (typeof lignes)[number] | undefined;
                if (!active || !p) return null;
                return (
                  <div className="rounded-xl bg-creme p-3 text-base shadow-carte">
                    <p className="font-titre font-semibold">Récolte {p.annee}</p>
                    {p.perdue ? (
                      <p>Donnée perdue</p>
                    ) : p.kg === 0 ? (
                      <p>Pas de récolte (0 kg)</p>
                    ) : (
                      <>
                        <p>{formatKg(p.kg ?? 0)}</p>
                        {p.litres !== null ? <p>{formatLitres(p.litres)} d&apos;huile</p> : null}
                      </>
                    )}
                  </div>
                );
              }}
            />
            <Bar dataKey="valeur" radius={[6, 6, 0, 0]} isAnimationActive={!reduit}>
              {lignes.map((l) => (
                <Cell
                  key={l.annee}
                  fill={
                    l.perdue
                      ? "url(#hachure-perdue)"
                      : l.annee === anneeSelectionnee
                        ? "#3b4520"
                        : "#5e6b2e"
                  }
                  stroke={l.perdue ? "#b9b1a1" : undefined}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-base text-pierre">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-olive" aria-hidden="true" /> Récolte connue
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="hachure h-3 w-3 rounded-sm" aria-hidden="true" /> Donnée perdue
        </span>
      </figcaption>
      <table className="sr-only">
        <caption>Kilos d&apos;olives récoltés par année</caption>
        <tbody>
          {donnees.map((d) => (
            <tr key={d.annee}>
              <td>{d.annee}</td>
              <td>{d.perdue ? "donnée perdue" : formatKg(d.kg ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
