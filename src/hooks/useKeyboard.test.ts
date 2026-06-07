import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Phase } from "../engine/types";
import { useKeyboard } from "./useKeyboard";

describe("useKeyboard", () => {
  let onRoll: ReturnType<typeof vi.fn>;
  let onDirection: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onRoll = vi.fn();
    onDirection = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function fire(key: string) {
    window.dispatchEvent(new KeyboardEvent("keydown", { key }));
  }

  describe("direction keys", () => {
    it("calls onDirection with NW when Q is pressed during AwaitingDirection", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("q");
      expect(onDirection).toHaveBeenCalledWith("NW");
    });

    it("calls onDirection with N when W is pressed", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("w");
      expect(onDirection).toHaveBeenCalledWith("N");
    });

    it("calls onDirection with NE when E is pressed", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("e");
      expect(onDirection).toHaveBeenCalledWith("NE");
    });

    it("calls onDirection with W when A is pressed", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("a");
      expect(onDirection).toHaveBeenCalledWith("W");
    });

    it("calls onDirection with E when D is pressed", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("d");
      expect(onDirection).toHaveBeenCalledWith("E");
    });

    it("calls onDirection with SW when Z is pressed", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("z");
      expect(onDirection).toHaveBeenCalledWith("SW");
    });

    it("calls onDirection with S when X is pressed", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("x");
      expect(onDirection).toHaveBeenCalledWith("S");
    });

    it("calls onDirection with SE when C is pressed", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("c");
      expect(onDirection).toHaveBeenCalledWith("SE");
    });

    it("does not call onDirection when disabled", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: true, onRoll, onDirection }),
      );
      fire("q");
      expect(onDirection).not.toHaveBeenCalled();
    });

    it("calls onDirection during AwaitingRoll (putt path)", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingRoll, disabled: false, onRoll, onDirection }),
      );
      fire("q");
      expect(onDirection).toHaveBeenCalledWith("NW");
    });
  });

  describe("S key (roll)", () => {
    it("calls onRoll when S is pressed during AwaitingRoll", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingRoll, disabled: false, onRoll, onDirection }),
      );
      fire("s");
      expect(onRoll).toHaveBeenCalled();
    });

    it("does not call onRoll when disabled", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingRoll, disabled: true, onRoll, onDirection }),
      );
      fire("s");
      expect(onRoll).not.toHaveBeenCalled();
    });

    it("does not call onRoll during AwaitingDirection", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("s");
      expect(onRoll).not.toHaveBeenCalled();
    });

    it("does not call onRoll or onDirection during HoledOut", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.HoledOut, disabled: false, onRoll, onDirection }),
      );
      fire("s");
      fire("q");
      expect(onRoll).not.toHaveBeenCalled();
      expect(onDirection).not.toHaveBeenCalled();
    });

    it("does not call onRoll or onDirection during NotStarted", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.NotStarted, disabled: false, onRoll, onDirection }),
      );
      fire("s");
      fire("q");
      expect(onRoll).not.toHaveBeenCalled();
      expect(onDirection).not.toHaveBeenCalled();
    });
  });

  describe("uppercase keys", () => {
    it("handles uppercase Q (Shift held)", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("Q");
      expect(onDirection).toHaveBeenCalledWith("NW");
    });
  });

  describe("unrelated keys", () => {
    it("ignores unrelated keys", () => {
      renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      fire("f");
      expect(onDirection).not.toHaveBeenCalled();
      expect(onRoll).not.toHaveBeenCalled();
    });
  });

  describe("cleanup", () => {
    it("removes listener on unmount", () => {
      const spy = vi.spyOn(window, "removeEventListener");
      const { unmount } = renderHook(() =>
        useKeyboard({ phase: Phase.AwaitingDirection, disabled: false, onRoll, onDirection }),
      );
      unmount();
      expect(spy).toHaveBeenCalledWith("keydown", expect.any(Function));
    });
  });
});
