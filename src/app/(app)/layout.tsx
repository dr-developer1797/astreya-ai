import type { ReactNode } from "react";
import AstreyaApp from "@/app-shell/AstreyaApp";
import ConvexClientProvider from "@/shared/convex/ConvexClientProvider";
import { WorkspaceProvider } from "@/shared/convex/WorkspaceProvider";
import { MatterProvider } from "@/shared/context/MatterContext";
import ResearchRuntimeProvider from "@/features/research/ResearchRuntimeProvider";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ConvexClientProvider>
      <WorkspaceProvider>
        <MatterProvider>
          <ResearchRuntimeProvider>
            <AstreyaApp>{children}</AstreyaApp>
          </ResearchRuntimeProvider>
        </MatterProvider>
      </WorkspaceProvider>
    </ConvexClientProvider>
  );
}