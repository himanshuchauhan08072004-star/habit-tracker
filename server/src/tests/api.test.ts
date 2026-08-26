import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { createApp } from "../app";

import { formatInTimeZone } from "date-fns-tz";

let mongod: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

async function registerAndLogin(email = "user@example.com", timezone = "Asia/Kolkata") {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email, password: "password123", timezone });
  return { token: res.body.data.token as string, userId: res.body.data.user.id as string };
}

describe("auth", () => {
  it("registers a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "a@example.com", password: "password123", timezone: "Asia/Kolkata" });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe("a@example.com");
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it("rejects an invalid IANA timezone", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "b@example.com", password: "password123", timezone: "Not/AZone" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects duplicate email", async () => {
    await registerAndLogin("dup@example.com");
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "dup@example.com", password: "password123", timezone: "Asia/Kolkata" });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_IN_USE");
  });

  it("logs in with correct credentials", async () => {
    await registerAndLogin("login@example.com");
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "login@example.com", password: "password123" });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
  });

  it("rejects bad credentials", async () => {
    await registerAndLogin("bad@example.com");
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "bad@example.com", password: "wrongpassword" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });
});

describe("habits + check-ins", () => {
  it("creates a habit and checks in for today", async () => {
    const { token } = await registerAndLogin();

    const habitRes = await request(app)
      .post("/api/habits")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Drink water", description: "8 glasses" });
    expect(habitRes.status).toBe(201);
    const habitId = habitRes.body.data.id;

    const todayLocal = formatInTimeZone(new Date(), "Asia/Kolkata", "yyyy-MM-dd");

    const checkInRes = await request(app)
      .post(`/api/habits/${habitId}/check-ins`)
      .set("Authorization", `Bearer ${token}`)
      .send({ localDate: todayLocal });

    expect([200, 201]).toContain(checkInRes.status);
    expect(checkInRes.body.data.currentStreak).toBeGreaterThanOrEqual(1);
  });

  it("rejects a duplicate check-in for the same local day", async () => {
    const { token } = await registerAndLogin();
    const habitRes = await request(app)
      .post("/api/habits")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Read" });
    const habitId = habitRes.body.data.id;

    await request(app)
      .post(`/api/habits/${habitId}/check-ins`)
      .set("Authorization", `Bearer ${token}`)
      .send({ localDate: "2026-08-20" });

    const dup = await request(app)
      .post(`/api/habits/${habitId}/check-ins`)
      .set("Authorization", `Bearer ${token}`)
      .send({ localDate: "2026-08-20" });

    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe("DUPLICATE_CHECK_IN");
  });

  it("rejects a future-dated check-in", async () => {
    const { token } = await registerAndLogin();
    const habitRes = await request(app)
      .post("/api/habits")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Run" });
    const habitId = habitRes.body.data.id;

    const farFuture = "2099-01-01";
    const res = await request(app)
      .post(`/api/habits/${habitId}/check-ins`)
      .set("Authorization", `Bearer ${token}`)
      .send({ localDate: farFuture });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("FUTURE_DATE");
  });

  it("rejects a check-in dated before the habit's creation", async () => {
    const { token } = await registerAndLogin();
    const habitRes = await request(app)
      .post("/api/habits")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Meditate" });
    const habitId = habitRes.body.data.id;

    const res = await request(app)
      .post(`/api/habits/${habitId}/check-ins`)
      .set("Authorization", `Bearer ${token}`)
      .send({ localDate: "2000-01-01" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("DATE_BEFORE_HABIT");
  });

  it("rejects checking in to another user's habit", async () => {
    const owner = await registerAndLogin("owner@example.com");
    const intruder = await registerAndLogin("intruder@example.com");

    const habitRes = await request(app)
      .post("/api/habits")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ name: "Journal" });
    const habitId = habitRes.body.data.id;

    const res = await request(app)
      .post(`/api/habits/${habitId}/check-ins`)
      .set("Authorization", `Bearer ${intruder.token}`)
      .send({ localDate: "2026-08-20" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("HABIT_NOT_FOUND");
  });

  it("recomputes streaks correctly after a backfill joins two runs", async () => {
    const { token } = await registerAndLogin();
    const habitRes = await request(app)
      .post("/api/habits")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Stretch" });
    const habitId = habitRes.body.data.id;

    for (const d of ["2026-08-20", "2026-08-21", "2026-08-23"]) {
      await request(app)
        .post(`/api/habits/${habitId}/check-ins`)
        .set("Authorization", `Bearer ${token}`)
        .send({ localDate: d });
    }

    const backfill = await request(app)
      .post(`/api/habits/${habitId}/check-ins`)
      .set("Authorization", `Bearer ${token}`)
      .send({ localDate: "2026-08-22" });

    expect(backfill.status).toBe(201);
    expect(backfill.body.data.longestStreak).toBe(4);
  });

  it("requires authentication for habit routes", async () => {
    const res = await request(app).get("/api/habits");
    expect(res.status).toBe(401);
  });
});
