import type { ReactNode } from "react";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { SkipLink } from "../components/a11y/SkipLink";
import type { NavigationKey } from "../config/navigation";

interface PublicLayoutProps {
  active?: NavigationKey;
  children: ReactNode;
  showFooter?: boolean;
}

export default function PublicLayout({ active, children, showFooter = true }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-100">
      <SkipLink />
      <Header active={active} />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">{children}</main>
      {showFooter ? <Footer /> : null}
    </div>
  );
}
