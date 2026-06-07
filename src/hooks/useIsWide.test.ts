// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIsWide } from "./useIsWide";

describe("useIsWide", () => {
  const setWidth = (width: number) => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: width,
    });
  };

  beforeEach(() => {
    setWidth(1024);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when window.innerWidth >= 600", () => {
    setWidth(600);
    const { result } = renderHook(() => useIsWide());
    expect(result.current).toBe(true);
  });

  it("returns false when window.innerWidth < 600", () => {
    setWidth(599);
    const { result } = renderHook(() => useIsWide());
    expect(result.current).toBe(false);
  });

  it("updates when the window is resized to narrow", () => {
    setWidth(800);
    const { result } = renderHook(() => useIsWide());
    expect(result.current).toBe(true);

    act(() => {
      setWidth(375);
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe(false);
  });

  it("updates when the window is resized to wide", () => {
    setWidth(375);
    const { result } = renderHook(() => useIsWide());
    expect(result.current).toBe(false);

    act(() => {
      setWidth(800);
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current).toBe(true);
  });
});
