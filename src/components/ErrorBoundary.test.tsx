import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorBoundary } from "./ErrorBoundary";

vi.mock("@/lib/errorLogger", () => ({ logAppError: vi.fn() }));

function Boom(): JSX.Element {
  throw new Error("kapow");
}

describe("ErrorBoundary", () => {
  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <span>ok</span>
      </ErrorBoundary>,
    );
    expect(screen.getByText("ok")).toBeInTheDocument();
  });

  it("renders fallback UI when a child throws", () => {
    // Silence expected error log from React
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    // Fallback should mention something (component-defined text). We assert it's
    // not the original child and that some textual content is rendered.
    expect(screen.queryByText("ok")).toBeNull();
    expect(document.body.textContent?.length ?? 0).toBeGreaterThan(0);
    errSpy.mockRestore();
  });
});
