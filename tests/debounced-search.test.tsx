import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "../src/hooks/useDebouncedValue";

describe("catalog search debounce", () => {
  afterEach(() => vi.useRealTimers());
  it("uses only the latest search after a short typing pause", () => {
    vi.useFakeTimers();
    const hook = renderHook(({ search }) => useDebouncedValue(search, 250), { initialProps: { search: "" } });
    hook.rerender({ search: "r" }); act(() => { vi.advanceTimersByTime(100); });
    hook.rerender({ search: "react" }); act(() => { vi.advanceTimersByTime(249); });
    expect(hook.result.current).toBe("");
    act(() => { vi.advanceTimersByTime(1); });
    expect(hook.result.current).toBe("react");
    hook.unmount();
  });
});
