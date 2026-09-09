import type { SVGProps } from "react";

export type SidebarIconName = "home" | "courses" | "certificate" | "profile" | "teach" | "organization" | "catalog" | "pricing" | "admin" | "moderation" | "cart" | "info" | "help" | "contact" | "logout" | "moon" | "sun";

export function SidebarIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: SidebarIconName }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const path = {
    home: <><path d="M3.5 10.5 12 3l8.5 7.5" /><path d="M5.5 9.5V21h13V9.5M9 21v-6h6v6" /></>,
    courses: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 5.5v15A2.5 2.5 0 0 1 6.5 18H20M8 7h8M8 11h6" /></>,
    certificate: <><circle cx="12" cy="9" r="5" /><path d="m8.5 13-1 8 4.5-2 4.5 2-1-8" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4.5 21c.7-4.1 3.2-6 7.5-6s6.8 1.9 7.5 6" /></>,
    teach: <><path d="m3 7 9-4 9 4-9 4z" /><path d="M7 9v5c2.8 2.1 7.2 2.1 10 0V9M21 7v6" /></>,
    organization: <><path d="M4 21V8l8-4 8 4v13" /><path d="M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3" /></>,
    catalog: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 8h10M7 12h10M7 16h6" /></>,
    pricing: <><path d="M12 2v20M17 6.5c0-1.7-2.2-3-5-3s-5 1.3-5 3 2.2 3 5 3 5 1.3 5 3-2.2 3-5 3-5-1.3-5-3" /></>,
    admin: <><path d="M12 3 4 7v5c0 5.2 3.4 8 8 9 4.6-1 8-3.8 8-9V7z" /><path d="m9 12 2 2 4-4" /></>,
    moderation: <><path d="M12 3 5 6v5c0 4.6 2.8 8.2 7 10 4.2-1.8 7-5.4 7-10V6z" /><path d="M8.5 12h7M12 8.5v7" /></>,
    cart: <><path d="M3 4h2l2.2 10h9.8l2-7H6"/><circle cx="9" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.7 9a2.5 2.5 0 1 1 3.8 2.1c-.9.5-1.5 1.1-1.5 2.4M12 17h.01"/></>,
    contact: <><path d="M4 5h16v12H8l-4 3z"/><path d="m5 6 7 6 7-6"/></>,
    logout: <><path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" /></>,
    moon: <path d="M20.5 15.5A8 8 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  }[name];
  return <svg viewBox="0 0 24 24" aria-hidden="true" {...common} {...props}>{path}</svg>;
}
