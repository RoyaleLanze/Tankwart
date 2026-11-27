import { randomUUID } from "expo-crypto";

/**
 * A new random UUID (v4). Used for rows the client creates itself (ADR 0017): the id is made
 * once, before the first save attempt, and every retry sends the same one. Hermes has no
 * `crypto.randomUUID`, so this wraps expo-crypto in one place.
 */
export function newId(): string {
  return randomUUID();
}
