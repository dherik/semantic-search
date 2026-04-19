import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import { App } from "./App";
import type { SearchResponse } from "./types";

const mockResponse: SearchResponse = {
  query: "machine learning",
  semanticResults: [
    {
      job: {
        id: "1",
        title: "ML Engineer",
        company: "AI Corp",
        location: "Remote",
        salary: "$150k",
        tags: ["Python", "ML"],
        description: "Build ML models.",
      },
      score: 0.9,
      matchType: "semantic",
    },
  ],
  keywordResults: [],
  durationMs: 42,
};

describe("App", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows idle state initially", () => {
    render(<App />);
    expect(screen.getByText("Search by meaning, not keywords")).toBeInTheDocument();
  });

  it("shows loading state then results on successful search", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    render(<App />);

    const input = screen.getByPlaceholderText(/make websites load faster/);
    await userEvent.type(input, "machine learning");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("ML Engineer")).toBeInTheDocument();
  });

  it("shows error state on API failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Network error"));

    render(<App />);

    const input = screen.getByPlaceholderText(/make websites load faster/);
    await userEvent.type(input, "machine learning");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText(/Network error/)).toBeInTheDocument();
  });
});
