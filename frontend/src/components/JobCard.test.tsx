import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { JobCard } from "./JobCard";
import type { Job, SearchResult } from "../types";

function makeResult(jobOverrides: Partial<Job> = {}, restOverrides: Omit<Partial<SearchResult>, "job"> = {}): SearchResult {
  const baseJob: Job = {
    id: "1",
    title: "Frontend Developer",
    company: "Acme Corp",
    location: "Remote",
    salary: "$120k",
    tags: ["React", "TypeScript"],
    description: "Build amazing things.",
  };
  return {
    job: { ...baseJob, ...jobOverrides },
    score: 0.85,
    matchType: "semantic",
    ...restOverrides,
  };
}

describe("JobCard", () => {
  it("renders job title, company, location, and salary", () => {
    const result = makeResult();
    render(<JobCard result={result} rank={1} />);

    expect(screen.getByText("Frontend Developer")).toBeInTheDocument();
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    expect(screen.getByText(/Remote/)).toBeInTheDocument();
    expect(screen.getByText(/\$120k/)).toBeInTheDocument();
  });

  it("renders rank number", () => {
    render(<JobCard result={makeResult()} rank={3} />);
    expect(screen.getByText("#3")).toBeInTheDocument();
  });

  it("renders score as percentage", () => {
    render(<JobCard result={makeResult({}, { score: 0.857 })} rank={1} />);
    expect(screen.getByText("86% match")).toBeInTheDocument();
  });

  it("renders tags", () => {
    render(<JobCard result={makeResult()} rank={1} />);
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
  });

  it("does not show toggle button for short descriptions", () => {
    render(<JobCard result={makeResult()} rank={1} />);
    expect(screen.queryByText("Show more")).not.toBeInTheDocument();
  });

  it("shows toggle button for long descriptions and expands on click", async () => {
    const longDescription = "A".repeat(200);
    const result = makeResult({ description: longDescription });

    render(<JobCard result={result} rank={1} />);

    const toggle = screen.getByText("Show more");
    expect(toggle).toBeInTheDocument();

    await userEvent.click(toggle);

    expect(screen.getByText("Show less")).toBeInTheDocument();
  });
});
