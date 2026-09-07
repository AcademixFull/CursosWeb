import { afterEach, describe, expect, it, vi } from "vitest";
import { notificationService } from "../src/services/notification.service";

afterEach(() => vi.unstubAllGlobals());

describe("notification service", () => {
  it("loads notifications and unread count through academix-backend", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: [{ id: "11111111-1111-4111-8111-111111111111", title: "Aprobado", message: "Tu curso fue aprobado", read: false, createdAt: "2026-09-06T00:00:00Z", readAt: null }] }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true, data: { count: 1 } }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(notificationService.list()).resolves.toHaveLength(1);
    await expect(notificationService.unreadCount()).resolves.toEqual({ count: 1 });
  });
});
