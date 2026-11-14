"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatKg, formatMm, nomMois } from "@/lib/format";
import { useLarge, usePrefersReducedMotion } from "@/lib/hooks";

const tick = { fill: "#6f624f", fontSize: 14 };

export function GraphiquePluieMois({
  donnees,
}: {
  donnees: { mois: number; mm: number; joursPluie: number }[];
}) {
  const reduit = usePrefersReducedMotion();
  const large = useLarge();
  const lignes = donnees.map((d) => ({
    ...d,
    etiquette: large ? nomMois(d.mois, true) : nomMois(d.mois)[0].toUpperCase(),
    complet: nomMois(d.mois),
  }));
  return (
    <figure aria-label="Pluie par mois">
      <div className="h-64 w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 320, height: 256 }}
        >
          <BarChart data={lignes} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e8e2d4" />
            <XAxis dataKey="etiquette" interval={0} tickLine={false} axisLine={false} tick={tick} />
            <YAxis width={44} tickLine={false} axisLine={false} tick={tick} />
            <Tooltip
              cursor={{ fill: "rgba(90,139,168,0.12)" }}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as (typeof lignes)[number] | undefined;
                if (!active || !p) return null;
                return (
                  <div className="rounded-xl bg-creme p-3 text-base shadow-carte">
                    <p className="font-titre font-semibold capitalize">{p.complet}</p>
                    <p>{formatMm(p.mm)}</p>
                    <p className="text-pierre">{p.joursPluie} jours de pluie</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="mm" fill="#5a8ba8" radius={[6, 6, 0, 0]} isAnimationActive={!reduit} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Pluie cumulée par mois</caption>
        <tbody>
          {lignes.map((l) => (
            <tr key={l.mois}>
              <td>{l.complet}</td>
              <td>{formatMm(l.mm)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export type PointPluieProduction = { annee: number; mm: number | null; kg: number | null };

/** Bonus indicatif : pluie de l'année civile (ligne) et récolte du même nom (barres). */
export function GraphiquePluieProduction({ donnees }: { donnees: PointPluieProduction[] }) {
  const reduit = usePrefersReducedMotion();
  const large = useLarge();
  const lignes = donnees.map((d) => ({
    ...d,
    etiquette: large ? String(d.annee) : `’${String(d.annee).slice(2)}`,
  }));
  return (
    <figure aria-label="Pluie annuelle et récolte d'olives">
      <div className="h-72 w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 320, height: 288 }}
        >
          <ComposedChart data={lignes} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e8e2d4" />
            <XAxis dataKey="etiquette" interval={0} tickLine={false} axisLine={false} tick={tick} />
            <YAxis
              yAxisId="kg"
              width={44}
              tickLine={false}
              axisLine={false}
              tick={tick}
              tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000} t` : String(v))}
            />
            <YAxis
              yAxisId="mm"
              orientation="right"
              width={44}
              tickLine={false}
              axisLine={false}
              tick={tick}
            />
            <Tooltip
              formatter={(v, nom) =>
                nom === "Récolte (kg)" ? formatKg(Number(v)) : formatMm(Number(v))
              }
              contentStyle={{
                borderRadius: 12,
                border: "none",
                boxShadow: "0 4px 14px rgba(0,0,0,.12)",
              }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 14 }} />
            <Bar
              yAxisId="kg"
              dataKey="kg"
              name="Récolte (kg)"
              fill="#a3ad86"
              radius={[6, 6, 0, 0]}
              isAnimationActive={!reduit}
            />
            <Line
              yAxisId="mm"
              dataKey="mm"
              name="Pluie (mm)"
              stroke="#5a8ba8"
              strokeWidth={3}
              dot={{ r: 3 }}
              connectNulls
              isAnimationActive={!reduit}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Pluie annuelle et récolte par année</caption>
        <tbody>
          {lignes.map((l) => (
            <tr key={l.annee}>
              <td>{l.annee}</td>
              <td>{l.mm === null ? "pluie inconnue" : formatMm(l.mm)}</td>
              <td>{l.kg === null ? "récolte inconnue" : formatKg(l.kg)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
