import type { UsdaZone } from "@/types";
import prefixMap from "@/data/pnw-zip-prefix-to-usda-zone.json";

const map = prefixMap as Record<string, string> & { _comment?: string };

/**
 * Normalizes ZIP input to 5-digit string (strips +4 and non-digits).
 */
export function normalizeZipInput(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits.length >= 5 ? digits.slice(0, 5) : digits;
}

/**
 * Looks up an approximate USDA zone for PNW ZIPs using the first 3 digits.
 * Returns null if unknown or invalid — caller should fall back to manual zone pick.
 */
export function lookupZoneFromZip(zipInput: string): UsdaZone | null {
  const zip = normalizeZipInput(zipInput);
  if (zip.length !== 5) return null;
  const prefix = zip.slice(0, 3);
  const raw = map[prefix];
  if (!raw || raw === "_comment") return null;
  if (raw === "5" || raw === "6" || raw === "7" || raw === "8" || raw === "9") {
    return raw;
  }
  return null;
}
