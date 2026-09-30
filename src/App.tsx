import React, { useEffect, useState } from "react";
import { registerPrimitives } from "@/components/primitives/register";
import { useAppStore } from "@/store/appStore";
import { HomeView } from "@/views/HomeView";
import { AppView } from "@/views/AppView";
import { BuilderView } from "@/views/BuilderView";
import { PreviewView } from "@/views/PreviewView";
import { LayoutGrid, Sparkles, Smartphone, CheckCircle } from "lucide-react";

type Route =
  | { name: "home" }
  | { name: "app"; appId: string }
  | { name: "builder" }
  | { name: "preview" };

export function App() {
  const [route, setRoute] = useState<Route>({ name: "home" });
  const initApps = useAppStore((s) => s.init);
  const ready = useAppStore((s) => s.ready);

  useEffect(() => {
    registerPrimitives();
    initApps();
  }, [initApps]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-between antialiased">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setRoute({ name: "home" })}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#4caf50] text-white flex items-center justify-center font-black text-sm shadow-xs group-hover:scale-105 transition-transform">
              OS
            </div>
            <div>
              <span className="font-bold text-gray-900 text-sm tracking-tight block leading-tight">
                Personal Super OS
              </span>
              <span className="text-[10px] text-gray-400 font-medium block">
                Manifest-Driven Engine
              </span>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <CheckCircle size={11} /> Offline Ready
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area — Designed as a focused mobile OS viewport */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 sm:py-6">
        {!ready ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-8 h-8 border-2 border-[#4caf50] border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs font-medium">Booting Personal OS engine...</span>
          </div>
        ) : route.name === "home" ? (
          <HomeView
            onOpenApp={(appId) => setRoute({ name: "app", appId })}
            onOpenBuilder={() => setRoute({ name: "builder" })}
          />
        ) : route.name === "app" ? (
          <AppView
            appId={route.appId}
            onBack={() => setRoute({ name: "home" })}
          />
        ) : route.name === "builder" ? (
          <BuilderView
            onBack={() => setRoute({ name: "home" })}
            onPreview={() => setRoute({ name: "preview" })}
            onSaved={(appId) => setRoute({ name: "app", appId })}
          />
        ) : route.name === "preview" ? (
          <PreviewView
            onBackToEdit={() => setRoute({ name: "builder" })}
            onSaved={(appId) => setRoute({ name: "app", appId })}
          />
        ) : null}
      </main>

      {/* Persistent Bottom Bar (when in home or sub-screen) */}
      <footer className="bg-white border-t border-gray-200/80 py-2.5 px-4 text-center">
        <div className="max-w-md mx-auto flex items-center justify-between text-[11px] text-gray-400 font-medium">
          <span>Engine v1.0 · React Web</span>
          <span>Zero external server required</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
