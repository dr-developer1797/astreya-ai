import type { ReactNode } from "react";
import AstreyaApp from "@/app-shell/AstreyaApp";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AstreyaApp>{children}</AstreyaApp>;
}