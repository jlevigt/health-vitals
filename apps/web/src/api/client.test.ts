import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

describe("web api client 401 handling", () => {
  const originalFetch = globalThis.fetch;
  const originalLocalStorage = globalThis.localStorage;
  const originalWindow = globalThis.window;

  beforeEach(() => {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    } as Storage;

    globalThis.window = {
      location: {
        pathname: "/login",
        href: "http://localhost:5173/login",
      },
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.localStorage = originalLocalStorage;
    globalThis.window = originalWindow;
  });

  it("does not trigger /auth/refresh or reload /login when POST /auth/login returns 401", async () => {
    const calledUrls: string[] = [];
    globalThis.fetch = mock(async (input: string | URL | Request) => {
      calledUrls.push(String(input));
      return new Response(JSON.stringify({ message: "Invalid credentials" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;

    // Import dynamically after env is set
    process.env.VITE_API_URL = "http://localhost:3000";
    const { api } = await import("./client.ts");

    await expect(
      api.post("/auth/login", { email: "bad@example.com", password: "wrong" }),
    ).rejects.toThrow("Invalid credentials");

    expect(calledUrls).toEqual(["http://localhost:3000/auth/login"]);
    expect(globalThis.window.location.href).toBe("http://localhost:5173/login");
  });
});
