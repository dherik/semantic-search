import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  it("renders input and search button", () => {
    render(<SearchBar onSearch={vi.fn()} isLoading={false} />);

    expect(screen.getByPlaceholderText(/make websites load faster/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  });

  it("calls onSearch with query on form submit", async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} isLoading={false} />);

    const input = screen.getByPlaceholderText(/make websites load faster/);
    await userEvent.type(input, "machine learning");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(onSearch).toHaveBeenCalledWith("machine learning");
  });

  it("does not call onSearch when query is too short", async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} isLoading={false} />);

    const input = screen.getByPlaceholderText(/make websites load faster/);
    await userEvent.type(input, "a");
    await userEvent.click(screen.getByRole("button", { name: "Search" }));

    expect(onSearch).not.toHaveBeenCalled();
  });

  it("disables button and shows loading text when isLoading", () => {
    render(<SearchBar onSearch={vi.fn()} isLoading={true} />);

    const button = screen.getByRole("button", { name: "Searching…" });
    expect(button).toBeDisabled();
  });

  it("disables input when loading", () => {
    render(<SearchBar onSearch={vi.fn()} isLoading={true} />);

    expect(screen.getByPlaceholderText(/make websites load faster/)).toBeDisabled();
  });

  it("calls onSearch when a suggestion is clicked", async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} isLoading={false} />);

    await userEvent.click(screen.getByText("build AI agents in Python"));

    expect(onSearch).toHaveBeenCalledWith("build AI agents in Python");
  });
});
