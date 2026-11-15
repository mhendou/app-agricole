import { createPrivateKey, generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { normaliserClePrivee } from "../src/lib/data/sheets-client";

const { privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

function valide(cle: string | undefined) {
  expect(cle).toBeTruthy();
  expect(() => createPrivateKey(cle as string)).not.toThrow();
}

describe("normaliserClePrivee", () => {
  it("accepte la clé telle quelle", () => valide(normaliserClePrivee(privateKey)));
  it("accepte des \n littéraux", () =>
    valide(normaliserClePrivee(privateKey.trim().replace(/\n/g, "\n"))));
  it("accepte des guillemets autour", () =>
    valide(normaliserClePrivee(`"${privateKey.trim().replace(/\n/g, "\n")}"`)));
  it("accepte des espaces à la place des sauts de ligne", () =>
    valide(normaliserClePrivee(privateKey.trim().replace(/\n/g, " "))));
  it("accepte une clé sur une seule ligne sans séparateur", () =>
    valide(normaliserClePrivee(privateKey.trim().replace(/\n/g, ""))));
  it("accepte les retours chariot", () =>
    valide(normaliserClePrivee(privateKey.replace(/\n/g, "\r\n"))));
  it("renvoie undefined si vide", () => expect(normaliserClePrivee(undefined)).toBeUndefined());
});

describe("normaliserClePrivee sans marqueurs", () => {
  const corps = privateKey
    .replace(/-----(BEGIN|END) PRIVATE KEY-----/g, "")
    .trim();
  it("accepte le corps seul avec \n littéraux", () =>
    valide(normaliserClePrivee(corps.replace(/\n/g, "\n"))));
  it("accepte le corps seul avec vrais sauts de ligne", () => valide(normaliserClePrivee(corps)));
});
