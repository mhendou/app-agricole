"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDH, nomMois } from "@/lib/format";
import { useLarge, usePrefersReducedMotion } from "@/lib/hooks";

export type PointMensuel = { mois: number; ventes: number; depenses: number };

export function HistogrammeMensuel({ donnees }: { donnees: PointMensuel[] }) {
  const reduit = usePrefersReducedMotion();
  const large = useLarge();
  const lignes = donnees.map((d) => ({
    ...d,
    etiquette: large ? nomMois(d.mois, true) : nomMois(d.mois)[0].toUpperCase(),
    complet: nomMois(d.mois),
  }));
  return (
    <figure aria-label="Ventes et dépenses par mois">
      <div className="h-64 w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          initialDimension={{ width: 320, height: 256 }}
        >
          <BarChart data={lignes} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e8e2d4" />
            <XAxis
              dataKey="etiquette"
              interval={0}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#6f624f", fontSize: 14 }}
            />
            <YAxis
              width={44}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#6f624f", fontSize: 14 }}
              tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)} k` : String(v))}
            />
            <Tooltip
              cursor={{ fill: "rgba(163,173,134,0.2)" }}
              labelFormatter={(_, p) => String(p?.[0]?.payload?.complet ?? "")}
              formatter={(v) => formatDH(Number(v))}
              contentStyle={{
                borderRadius: 12,
                border: "none",
                boxShadow: "0 4px 14px rgba(0,0,0,.12)",
              }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 14 }} />
            <Bar
              dataKey="ventes"
              name="Ventes"
              fill="#5e6b2e"
              radius={[6, 6, 0, 0]}
              isAnimationActive={!reduit}
            />
            <Bar
              dataKey="depenses"
              name="Dépenses"
              fill="#b4532a"
              radius={[6, 6, 0, 0]}
              isAnimationActive={!reduit}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Ventes encaissées et dépenses par mois</caption>
        <thead>
          <tr>
            <th>Mois</th>
            <th>Ventes</th>
            <th>Dépenses</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((l) => (
            <tr key={l.mois}>
              <td>{l.complet}</td>
              <td>{formatDH(l.ventes)}</td>
              <td>{formatDH(l.depenses)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
