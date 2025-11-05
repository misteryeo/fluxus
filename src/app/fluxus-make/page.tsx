"use client";

import { useState, Suspense } from "react";

import { LeftRail } from "@/components/fluxus-make/LeftRail";
import { PRSidebar } from "@/components/fluxus-make/PRSidebar";
import { AssembleMode } from "@/components/fluxus-make/AssembleMode";

type View = "home" | "releases" | "templates" | "assets" | "settings";

export default function FluxusMakePage() {
  const [activeView, setActiveView] = useState<View>("releases");

  return (
    <div className="min-h-screen w-full flex bg-background">
      <LeftRail activeView={activeView} onViewChange={setActiveView} />

      <div className="flex-1 flex">
        <aside className="w-[300px] border-r">
          <PRSidebar />
        </aside>

        <main className="flex-1">
          <Suspense fallback={<div className="p-6">Loading…</div>}>
            <AssembleMode />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
