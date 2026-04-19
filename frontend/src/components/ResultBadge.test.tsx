import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ResultBadge } from "./ResultBadge";

describe("ResultBadge", () => {
  it('renders semantic variant label', () => {
    render(<ResultBadge variant="semantic" />);
    expect(screen.getByText(/semantic only/)).toBeInTheDocument();
  });

  it('renders keyword variant label', () => {
    render(<ResultBadge variant="keyword" />);
    expect(screen.getByText(/keyword only/)).toBeInTheDocument();
  });
});
