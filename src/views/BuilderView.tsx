import React, { useState } from "react";
import {
  buildSimpleListManifest,
  buildHabitManifest,
  buildLoggerManifest,
} from "@/runtime/manifest/templates";
import { useBuilderStore } from "@/store/builderStore";
import { validateManifest } from "@/lib/validation/manifest";
import { sqliteMiniAppRepository } from "@/db/repositories/miniAppRepository";
import { useAppStore } from "@/store/appStore";
import { ArrowLeft, CheckCircle2, ListTodo, Repeat, LineChart, AlertCircle } from "lucide-react";

type Pattern = "list" | "habit" | "logger";

const PATTERNS: { id: Pattern; label: string; hint: string; icon: React.ReactNode }[] = [
  {
    id: "list",
    label: "Task List",
    hint: "Add items, mark done, track day streaks (like Day Planner)",
    icon: <ListTodo className="w-5 h-5 text-blue-500" />,
  },
  {
    id: "habit",
    label: "Habit Tracker",
    hint: "Several habits, checked per day with heatmap (like Habit Hub)",
    icon: <Repeat className="w-5 h-5 text-green-500" />,
  },
  {
    id: "logger",
    label: "Numeric Log",
    hint: "Log numbers per item per day with personal bests (like Workout Tracker)",
    icon: <LineChart className="w-5 h-5 text-orange-500" />,
  },
];

interface Props {
  onBack: () => void;
  onPreview: () => void;
  onSaved: (appId: string) => void;
}

export function BuilderView({ onBack, onPreview, onSaved }: Props) {
  const setDraft = useBuilderStore((s) => s.setDraft);
  const refreshApps = useAppStore((s) => s.refresh);

  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [itemLabel, setItemLabel] = useState("");
  const [valueLabel, setValueLabel] = useState("Value");
  const [unit, setUnit] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canContinue = name.trim().length > 0 && pattern !== null;
  const canBuild = itemLabel.trim().length > 0;

  const buildManifest = () => {
    const meta = { name: name.trim() };
    if (pattern === "list") return buildSimpleListManifest(meta, itemLabel.trim());
    if (pattern === "habit") return buildHabitManifest(meta, itemLabel.trim());
    return buildLoggerManifest(meta, itemLabel.trim(), valueLabel.trim() || "Value", unit.trim() || undefined);
  };

  const preview = () => {
    if (!canBuild) return;
    const manifest = buildManifest();
    const check = validateManifest(manifest);
    if (!check.ok) {
      setError(check.errors?.join(", ") ?? "Invalid manifest");
      return;
    }
    setError(null);
    setDraft(manifest);
    onPreview();
  };

  const saveDirect = async () => {
    if (!canBuild) return;
    const manifest = buildManifest();
    const check = validateManifest(manifest);
    if (!check.ok) {
      setError(check.errors?.join(", ") ?? "Invalid manifest");
      return;
    }
    const now = new Date().toISOString();
    await sqliteMiniAppRepository.save({
      id: manifest.appId,
      ownerId: null,
      name: manifest.name,
      icon: manifest.icon,
      version: manifest.schemaVersion,
      manifest,
      createdAt: now,
      updatedAt: now,
    });
    await refreshApps();
    onSaved(manifest.appId);
  };

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={step === 2 ? () => setStep(1) : onBack}
          className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
          title="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create Mini-App</h1>
          <p className="text-xs text-gray-500">Step {step} of 2</p>
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
              App Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Meal Planner, Hydration, Book Tracker"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              What kind of app?
            </label>
            <div className="grid gap-2.5">
              {PATTERNS.map((p) => {
                const active = pattern === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setPattern(p.id)}
                    className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      active
                        ? "border-[#4caf50] bg-green-50/50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="mt-0.5">{p.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900">{p.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{p.hint}</div>
                    </div>
                    {active && <CheckCircle2 size={18} className="text-[#4caf50] flex-shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setStep(2)}
            className="w-full bg-[#4caf50] hover:bg-green-600 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && pattern && (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
              {pattern === "list" ? "What are you tracking?" : "What are you tracking? (e.g. Habit, Exercise)"}
            </label>
            <input
              type="text"
              value={itemLabel}
              onChange={(e) => setItemLabel(e.target.value)}
              placeholder="e.g. Habit, Task, Exercise, Routine"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
            />
          </div>

          {pattern === "logger" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  What number are you logging?
                </label>
                <input
                  type="text"
                  value={valueLabel}
                  onChange={(e) => setValueLabel(e.target.value)}
                  placeholder="e.g. Weight, Pages, Duration, Glasses"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                  Unit (optional)
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. kg, lbs, pages, min, ml"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
                />
              </div>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!canBuild}
              onClick={preview}
              className="flex-1 bg-[#4caf50] hover:bg-green-600 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm"
            >
              Preview
            </button>
          </div>

          <button
            type="button"
            disabled={!canBuild}
            onClick={saveDirect}
            className="w-full border-2 border-[#4caf50] text-[#4caf50] hover:bg-green-50 disabled:opacity-40 font-semibold py-2.5 rounded-xl transition-colors text-sm"
          >
            Save without preview
          </button>
        </div>
      )}
    </div>
  );
}
