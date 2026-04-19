import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { useSearch } from "./useSearch";

describe("useSearch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts in idle state", () => {
    const { result } = renderHook(() => useSearch());
    expect(result.current.status).toBe("idle");
    expect(result.current.data).toBeNull();
    expect(result.current.errorMsg).toBe("");
  });

  it("transitions through loading to success", async () => {
    const mockData = {
      query: "test",
      semanticResults: [],
      keywordResults: [],
      durationMs: 42,
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    const { result } = renderHook(() => useSearch());

    await act(() => result.current.search("test query"));

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.data).toEqual(mockData);
    expect(result.current.errorMsg).toBe("");
  });

  it("sets error state on API failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: () => Promise.reject(new Error("not json")),
    } as unknown as Response);

    const { result } = renderHook(() => useSearch());

    await act(() => result.current.search("test query"));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorMsg).toBe("Internal Server Error");
    expect(result.current.data).toBeNull();
  });

  it("sets error state on network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useSearch());

    await act(() => result.current.search("test query"));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorMsg).toBe("Network error");
  });

  it("uses error message from API response body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: () => Promise.resolve({ error: "Custom API error" }),
    } as unknown as Response);

    const { result } = renderHook(() => useSearch());

    await act(() => result.current.search("test query"));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.errorMsg).toBe("Custom API error");
  });

  it("encodes the query parameter", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          query: "test & search",
          semanticResults: [],
          keywordResults: [],
          durationMs: 10,
        }),
    } as Response);

    const { result } = renderHook(() => useSearch());

    await act(() => result.current.search("test & search"));

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/search?q=test%20%26%20search&limit=5"
    );
  });
});
