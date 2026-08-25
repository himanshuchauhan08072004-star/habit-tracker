import { describe, it, expect } from "vitest";
import { computeStreaks, isCompletedToday } from "../services/streak.service";

describe("streak.service", () => {
  describe("assignment worked example", () => {
    it("A,B,C,D (with D deduped) -> currentStreak 3, longestStreak 3", () => {
      // A -> 2026-03-10, B -> 2026-03-11, C & D (dup) -> 2026-03-12
      const localDates = ["2026-03-10", "2026-03-11", "2026-03-12"];
      const result = computeStreaks(localDates, "2026-03-12");
      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(3);
    });
  });

  describe("currentStreak", () => {
    it("counts a streak ending today", () => {
      const dates = ["2026-08-21", "2026-08-22", "2026-08-23", "2026-08-24"];
      expect(computeStreaks(dates, "2026-08-24").currentStreak).toBe(4);
    });

    it("counts a streak ending yesterday when today is not yet logged", () => {
      const dates = ["2026-08-21", "2026-08-22", "2026-08-23"];
      expect(computeStreaks(dates, "2026-08-24").currentStreak).toBe(3);
    });

    it("is 0 when neither today nor yesterday is logged", () => {
      const dates = ["2026-08-20", "2026-08-21"];
      expect(computeStreaks(dates, "2026-08-24").currentStreak).toBe(0);
    });

    it("is 0 for an empty check-in list", () => {
      expect(computeStreaks([], "2026-08-24").currentStreak).toBe(0);
    });

    it("is 1 for a single check-in today", () => {
      expect(computeStreaks(["2026-08-24"], "2026-08-24").currentStreak).toBe(1);
    });
  });

  describe("longestStreak", () => {
    it("finds the longest run among multiple groups", () => {
      const dates = [
        "2026-08-01", "2026-08-02", "2026-08-03",
        "2026-08-05", "2026-08-06",
        "2026-08-10", "2026-08-11", "2026-08-12", "2026-08-13",
      ];
      expect(computeStreaks(dates, "2026-08-13").longestStreak).toBe(4);
    });

    it("is 0 for an empty list", () => {
      expect(computeStreaks([], "2026-08-24").longestStreak).toBe(0);
    });

    it("handles unsorted/duplicate input defensively", () => {
      const dates = ["2026-08-24", "2026-08-22", "2026-08-23", "2026-08-23"];
      const result = computeStreaks(dates, "2026-08-24");
      expect(result.longestStreak).toBe(3);
      expect(result.currentStreak).toBe(3);
    });
  });

  describe("backfill joining two streak groups", () => {
    it("connects two separate runs into one when the gap day is backfilled", () => {
      const before = computeStreaks(["2026-08-20", "2026-08-21", "2026-08-23"], "2026-08-23");
      expect(before.currentStreak).toBe(1); // only Aug 23 connects to "today"

      const after = computeStreaks(
        ["2026-08-20", "2026-08-21", "2026-08-22", "2026-08-23"],
        "2026-08-23"
      );
      expect(after.currentStreak).toBe(4);
      expect(after.longestStreak).toBe(4);
    });
  });

  describe("isCompletedToday", () => {
    it("reflects whether today's local date has a check-in", () => {
      expect(isCompletedToday(["2026-08-24"], "2026-08-24")).toBe(true);
      expect(isCompletedToday(["2026-08-23"], "2026-08-24")).toBe(false);
    });
  });
});
