import { describe, expect, it } from "vitest";
import { publicUser } from "@/lib/accounts";
import type { User } from "@/lib/types";

const user: User = {
  id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  email: "citizen@example.com",
  displayName: "नागरिक",
  passwordHash: "scrypt:deadbeef:ab".padEnd(7 + 16 + 1 + 128, "0"),
  stateId: "up",
  districtId: "up-lucknow",
  pin: "226001",
  area: "बाज़ार रोड",
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
};

describe("publicUser", () => {
  it("omits passwordHash from the object that APIs serialize", () => {
    const safe = publicUser(user);
    expect(safe).toEqual({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      stateId: user.stateId,
      districtId: user.districtId,
      pin: user.pin,
      area: user.area,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
    expect(safe).not.toHaveProperty("passwordHash");
    expect(JSON.stringify(safe)).not.toContain("passwordHash");
    expect(JSON.stringify({ ok: true, user: safe })).not.toContain(user.passwordHash);
  });
});
