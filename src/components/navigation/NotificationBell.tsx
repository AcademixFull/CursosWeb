import { useState } from "react";
import { useNotifications } from "../../hooks/useNotifications";
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const notifications = useNotifications();
  const count = notifications.count.data?.count ?? 0;
  return <div className="relative ml-auto">
    <button type="button" aria-label={`Notificaciones${count ? `, ${count} sin leer` : ""}`} onClick={() => setOpen((value) => !value)} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
      {count > 0 ? <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-brand-500 px-1 text-center text-[10px] font-bold text-white">{count > 9 ? "9+" : count}</span> : null}
    </button>
    {open ? <div className="absolute right-0 top-12 z-50 w-[min(90vw,24rem)] overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><strong>Notificaciones</strong><button type="button" onClick={() => notifications.markAllRead.mutate()} className="text-xs font-semibold text-brand-300">Marcar todas como leídas</button></div>
      <div className="max-h-96 overflow-y-auto p-2">{notifications.list.data?.length ? notifications.list.data.map((item) => <button key={item.id} type="button" onClick={() => !item.read && notifications.markRead.mutate(item.id)} className={`mb-1 block w-full rounded-xl p-3 text-left ${item.read ? "bg-white/3" : "bg-brand-500/10"}`}><span className="block text-sm font-semibold">{item.title}</span><span className="mt-1 block text-xs leading-5 text-slate-400">{item.message}</span></button>) : <p className="p-5 text-center text-sm text-slate-400">No tienes notificaciones.</p>}</div>
    </div> : null}
  </div>;
}
