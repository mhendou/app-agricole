import { describe, expect, it } from "vitest";
import { formatEcart, formatMm, jourSemaine } from "@/lib/format";

describe("formats météo", () => {
  it("jour de la semaine", () => {
    expect(jourSemaine("2026-11-16")).toBe("lundi 16\u00a0nov.");
    expect(jourSemaine("2026-11-15")).toBe("dimanche 15\u00a0nov.");
  });
  it("mm et écarts", () => {
    expect(formatMm(12)).toBe("12\u00a0mm");
    expect(formatMm(12.4)).toBe("12,4\u00a0mm");
    expect(formatEcart(-8, "pct")).toBe("−8\u00a0%");
    expect(formatEcart(3714, "kg")).toBe("+3\u00a0714\u00a0kg");
  });
});
