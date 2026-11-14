import { beforeAll, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { MockDataSource } from "@/lib/data/mock";
import type { Donnees } from "@/lib/types";
import {
  anneesDisponibles,
  pluieAnnee,
  pluieParMois,
  rangRecolte,
  statsAnnee,
  statsRecoltes,
} from "@/lib/stats";
import { aujourdhui, ajouterJours } from "@/lib/date";
import { formatDH, formatDate, formatKg, formatLitres, formatPct } from "@/lib/format";

let d: Donnees;
beforeAll(async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "stats-"));
  d = await new MockDataSource(dir, path.join(process.cwd(), "data")).lireTout();
});

describe("statsAnnee 2026 (repères CLAUDE.md §5)", () => {
  it("ventes encaissées = 10 680 DH et dépenses = 8 631 DH", () => {
    const s = statsAnnee(d, 2026);
    expect(s.ventesEncaissees).toBe(10680);
    expect(s.depenses).toBe(8631);
    expect(s.solde).toBe(2049);
  });
  it("à encaisser, litres, prix moyen, catégories, mois", () => {
    const s = statsAnnee(d, 2026);
    expect(s.aEncaisser).toBe(600);
    expect(s.litresOfferts).toBe(2);
    expect(s.litresVendus).toBeGreaterThan(0);
    expect(s.prixMoyenLitre).toBeCloseTo((10680 + 600) / s.litresVendus, 5);
    expect(s.depensesParCategorie.reduce((a, c) => a + c.total, 0)).toBe(8631);
    expect(s.parMois).toHaveLength(12);
    expect(s.parMois[2].ventes).toBe(10680); // toutes les ventes sont datées de mars
    expect(s.repartition.maroc.litres + s.repartition.horsMaroc.litres).toBe(s.litresVendus);
    expect(s.depensesPctVentes).toBeCloseTo((8631 / 10680) * 100, 5);
  });
  it("une année sans donnée donne des zéros sans planter", () => {
    const s = statsAnnee(d, 2019);
    expect(s.ventesEncaissees).toBe(0);
    expect(s.prixMoyenLitre).toBeNull();
    expect(s.depensesPctVentes).toBeNull();
  });
});

describe("statsRecoltes", () => {
  it("moyenne 2013–2025 hors 2015 = 1 844 kg ; record 2017", () => {
    const r = statsRecoltes(d.recoltes, 38);
    expect(Math.round(r.moyenneKg ?? 0)).toBe(1844);
    expect(r.record).toEqual({ annee: 2017, kg: 3948 });
  });
  it("2025 : 3 929 kg, 711 L, rendement 18,1 %, 2e meilleure année", () => {
    const r = statsRecoltes(d.recoltes, 38);
    const a = r.annees.find((x) => x.annee === 2025)!;
    expect(a.kg).toBe(3929);
    expect(a.litres).toBe(711);
    expect(a.rendementPct?.toFixed(1)).toBe("18.1");
    expect(a.kgParArbre).toBeCloseTo(103.4, 1);
    expect(a.ecartKg).toBe(3929 - 215);
    expect(rangRecolte(d.recoltes, 2025)).toBe(2);
    expect(rangRecolte(d.recoltes, 2017)).toBe(1);
    expect(r.derniere?.annee).toBe(2025);
  });
  it("2015 = donnée perdue, distincte de 2023 = 0 kg", () => {
    const r = statsRecoltes(d.recoltes, 38);
    const a2015 = r.annees.find((x) => x.annee === 2015)!;
    const a2023 = r.annees.find((x) => x.annee === 2023)!;
    expect(a2015.perdue).toBe(true);
    expect(a2015.kg).toBeNull();
    expect(a2023.perdue).toBe(false);
    expect(a2023.kg).toBe(0);
    expect(r.annees.find((x) => x.annee === 2016)!.ecartKg).toBeNull();
    expect(rangRecolte(d.recoltes, 2015)).toBeNull();
  });
});

describe("pluie et utilitaires", () => {
  const p = (date: string, mm: number | null, mes: number | null = null) => ({
    date,
    pluie_mm: mm,
    temp_max: null,
    temp_min: null,
    source: "",
    pluie_mm_mesuree: mes,
  });
  it("cumule par mois et laisse le relevé manuel primer", () => {
    const pluie = [
      p("2026-01-01", 2),
      p("2026-01-02", 3, 10),
      p("2026-02-01", 0.4),
      p("2025-12-31", 99),
    ];
    expect(pluieParMois(pluie, 2026)[0]).toEqual({ mois: 1, mm: 12, joursPluie: 2 });
    expect(pluieAnnee(pluie, 2026)).toBe(12.4);
  });
  it("années disponibles", () => {
    expect(anneesDisponibles(d, 2026)).toEqual({ min: 2026, max: 2026 });
  });
  it("dates", () => {
    expect(aujourdhui(new Date("2026-11-14T23:30:00Z"))).toBe("2026-11-15"); // Casablanca = UTC+1
    expect(ajouterJours("2026-02-28", 1)).toBe("2026-03-01");
  });
  it("formats (espaces insécables)", () => {
    expect(formatDH(10680)).toBe("10 680 DH");
    expect(formatKg(3929)).toBe("3 929 kg");
    expect(formatLitres(711)).toBe("711 L");
    expect(formatPct(18.1)).toBe("18,1 %");
    expect(formatDate("2026-04-13")).toBe("13 avr. 2026");
    expect(formatDH(-250)).toBe("-250 DH");
  });
});
