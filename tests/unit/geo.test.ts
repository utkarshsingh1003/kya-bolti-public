import { describe, expect, it } from "vitest";
import { getDistrict, getState, states } from "@/data/geo";

describe("geography dataset", () => {
  it("contains active Uttar Pradesh and Bihar districts", () => {
    const up = getState("up");
    const bihar = getState("bihar");
    expect(up?.active).toBe(true);
    expect(bihar?.active).toBe(true);
    expect(up?.districts.length).toBeGreaterThan(70);
    expect(bihar?.districts.length).toBeGreaterThan(35);
    expect((up?.districts.length ?? 0) + (bihar?.districts.length ?? 0)).toBe(113);
  });

  it("has unique, state-prefixed district ids", () => {
    const ids = states.flatMap((state) => state.districts.map((district) => district.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const state of states) {
      for (const district of state.districts) {
        expect(district.id.startsWith(`${state.id}-`)).toBe(true);
      }
    }
  });

  it("leaves inactive states without district rows", () => {
    const inactive = states.filter((state) => !state.active);
    expect(inactive.length).toBeGreaterThan(0);
    expect(inactive.every((state) => state.districts.length === 0)).toBe(true);
  });

  it("resolves districts including the default location", () => {
    const found = getDistrict("up-lucknow");
    expect(found?.state.id).toBe("up");
    expect(found?.district.nameEn).toBe("Lucknow");
    expect(getDistrict("bihar-patna")?.district.nameHi).toBe("पटना");
    expect(getDistrict("not-a-district")).toBeNull();
    expect(getState("not-a-state")).toBeUndefined();
  });
});
