"use client";

import { Suspense, useMemo, useState } from "react";

import { LeftRail } from "@/components/fluxus-make/LeftRail";
import { PRSidebar } from "@/components/fluxus-make/PRSidebar";
import { AssembleMode } from "@/components/fluxus-make/AssembleMode";
import { Asset, PR } from "@/types";

type View = "home" | "releases" | "templates" | "assets" | "settings";

export default function FluxusMakePage() {
  const [activeView, setActiveView] = useState<View>("releases");
  const [selectedPRs, setSelectedPRs] = useState<PR[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  const selectedIds = useMemo(
    () => new Set(selectedPRs.map((pr) => pr.id)),
    [selectedPRs]
  );

  const handleTogglePR = (pr: PR) => {
    setSelectedPRs((prev) => {
      if (prev.some((item) => item.id === pr.id)) {
        return prev.filter((item) => item.id !== pr.id);
      }

      return [...prev, pr];
    });
  };

  const handleViewChange = (view: string) => {
    if (
      view === "home" ||
      view === "releases" ||
      view === "templates" ||
      view === "assets" ||
      view === "settings"
    ) {
      setActiveView(view);
    }
  };

  const handleRemoveAsset = (assetId: string) => {
    setAssets((prev) => prev.filter((asset) => asset.id !== assetId));
  };

  const handleUploadAsset = () => {
    // TODO: Implement asset upload flow
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      <LeftRail activeView={activeView} onViewChange={handleViewChange} />

      <div className="flex-1 flex">
        <aside className="w-[300px] border-r">
          <PRSidebar
            selectedIds={selectedIds}
            onTogglePR={handleTogglePR}
          />
        </aside>

        <main className="flex-1">
          <Suspense fallback={<div className="p-6">Loading…</div>}>
            <AssembleMode
              selectedPRs={selectedPRs}
              assets={assets}
              onRemoveAsset={handleRemoveAsset}
              onUploadAsset={handleUploadAsset}
            />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
