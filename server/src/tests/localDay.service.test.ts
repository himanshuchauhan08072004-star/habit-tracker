import { describe, it, expect } from "vitest";
import {
  utcToLocalDate,
  isValidTimezone,
  isValidLocalDateString,
  isNextConsecutiveDay,
  previousLocalDate,
} from "../services/localDay.service";

describe("localDay.service", () => {
  describe("isValidTimezone", () => {
    it("accepts real IANA zones", () => {
      expect(isValidTimezone("Asia/Kolkata")).toBe(true);
      expect(isValidTimezone("America/New_York")).toBe(true);
      expect(isValidTimezone("Europe/London")).toBe(true);
    });

    it("rejects garbage input", () => {
      expect(isValidTimezone("Not/AZone")).toBe(false);
      expect(isValidTimezone("")).toBe(false);
      expect(isValidTimezone("UTC+5:30")).toBe(false);
    });
  });

  describe("utcToLocalDate — assignment worked example (Asia/Kolkata, UTC+05:30)", () => {
    const tz = "Asia/Kolkata";

    it("A: 2026-03-10T14:30Z -> local 2026-03-10", () => {
      expect(utcToLocalDate(new Date("2026-03-10T14:30:00Z"), tz)).toBe("2026-03-10");
    });

    it("B: 2026-03-11T10:30Z -> local 2026-03-11", () => {
      expect(utcToLocalDate(new Date("2026-03-11T10:30:00Z"), tz)).toBe("2026-03-11");
    });

    it("C: 2026-03-11T21:30Z -> local 2026-03-12 (crosses midnight in IST)", () => {
      expect(utcToLocalDate(new Date("2026-03-11T21:30:00Z"), tz)).toBe("2026-03-12");
    });

    it("D: 2026-03-12T17:30Z -> local 2026-03-12 (same local day as C -> duplicate)", () => {
      expect(utcToLocalDate(new Date("2026-03-12T17:30:00Z"), tz)).toBe("2026-03-12");
    });

    it("A, B, C, D collapse to exactly 3 distinct local days", () => {
      const dates = [
        utcToLocalDate(new Date("2026-03-10T14:30:00Z"), tz),
        utcToLocalDate(new Date("2026-03-11T10:30:00Z"), tz),
        utcToLocalDate(new Date("2026-03-11T21:30:00Z"), tz),
        utcToLocalDate(new Date("2026-03-12T17:30:00Z"), tz),
      ];
      expect(new Set(dates).size).toBe(3);
    });
  });

  describe("utcToLocalDate — different timezones, same instant", () => {
    it("same UTC instant can fall on different local dates depending on timezone", () => {
      const instant = new Date("2026-01-01T02:00:00Z");
      expect(utcToLocalDate(instant, "Asia/Kolkata")).toBe("2026-01-01"); // +05:30 -> 07:30
      expect(utcToLocalDate(instant, "America/Los_Angeles")).toBe("2025-12-31"); // -08:00 -> prev day
    });
  });

  describe("isValidLocalDateString", () => {
    it("accepts real calendar dates", () => {
      expect(isValidLocalDateString("2026-08-24")).toBe(true);
      expect(isValidLocalDateString("2024-02-29")).toBe(true); // leap year
    });

    it("rejects malformed or impossible dates", () => {
      expect(isValidLocalDateString("2026-13-01")).toBe(false);
      expect(isValidLocalDateString("2023-02-29")).toBe(false); // not a leap year
      expect(isValidLocalDateString("2026-08-24T00:00:00Z")).toBe(false);
      expect(isValidLocalDateString("not-a-date")).toBe(false);
    });
  });

  describe("previousLocalDate / isNextConsecutiveDay", () => {
    it("computes the previous calendar day, including month/year boundaries", () => {
      expect(previousLocalDate("2026-08-24")).toBe("2026-08-23");
      expect(previousLocalDate("2026-03-01")).toBe("2026-02-28");
      expect(previousLocalDate("2026-01-01")).toBe("2025-12-31");
      expect(previousLocalDate("2024-03-01")).toBe("2024-02-29"); // leap year
    });

    it("detects consecutive-day pairs", () => {
      expect(isNextConsecutiveDay("2026-08-23", "2026-08-24")).toBe(true);
      expect(isNextConsecutiveDay("2026-08-22", "2026-08-24")).toBe(false);
    });
  });
});
