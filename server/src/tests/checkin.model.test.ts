import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { CheckIn } from "../models/CheckIn";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await CheckIn.deleteMany({});
});

describe("CheckIn unique index (habitId + localDate)", () => {
  it("rejects a second insert for the same habit + local date at the DB level", async () => {
    const userId = new mongoose.Types.ObjectId();
    const habitId = new mongoose.Types.ObjectId();

    await CheckIn.create({
      userId,
      habitId,
      localDate: "2026-08-24",
      checkedInAt: new Date(),
    });

    await expect(
      CheckIn.create({
        userId,
        habitId,
        localDate: "2026-08-24",
        checkedInAt: new Date(),
      })
    ).rejects.toMatchObject({ code: 11000 });
  });

  it("allows the same local date across two different habits", async () => {
    const userId = new mongoose.Types.ObjectId();

    await CheckIn.create({
      userId,
      habitId: new mongoose.Types.ObjectId(),
      localDate: "2026-08-24",
      checkedInAt: new Date(),
    });

    await expect(
      CheckIn.create({
        userId,
        habitId: new mongoose.Types.ObjectId(),
        localDate: "2026-08-24",
        checkedInAt: new Date(),
      })
    ).resolves.toBeTruthy();
  });

  it("allows two different local dates for the same habit", async () => {
    const userId = new mongoose.Types.ObjectId();
    const habitId = new mongoose.Types.ObjectId();

    await CheckIn.create({ userId, habitId, localDate: "2026-08-24", checkedInAt: new Date() });

    await expect(
      CheckIn.create({ userId, habitId, localDate: "2026-08-25", checkedInAt: new Date() })
    ).resolves.toBeTruthy();
  });
});
