import { describe, it, expect } from "bun:test";
import { env } from "../src/config/env.ts";

describe("Platform Env", () => {
  it("should load environment variables", () => {
    expect(env).toBeDefined();
  });
});
