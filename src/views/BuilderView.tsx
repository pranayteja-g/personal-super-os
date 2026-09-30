import React, { useState } from "react";
import {
  buildSimpleListManifest,
  buildHabitManifest,
  buildLoggerManifest,
  buildKanbanManifest,
  buildTimerManifest,
  buildFreeformManifest,
  type FreeformBlock,
} from "@/runtime/manifest/templates";
import { useBuilderStore } from "@/store/builderStore";
import { validateManifest } from "@/lib/validation/manifest";
import { sqliteMiniAppRepository } from "@/db/repositories/miniAppRepository";
import { useAppStore } from "@/store/appStore";
import {
  ArrowLeft,
  CheckCircle2,
  ListTodo,
  Repeat,
  LineChart,
  Kanban,
  Clock,
  CalendarCheck,
  BookOpen,
  Dumbbell,
  Layers,
  Flame,
  Calendar,
  Grid3X3,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  AlertCircle,
  Wand2,
  Component,
} from "lucide-react";

type PresetPattern = "list" | "habit" | "logger" | "kanban" | "timer";

const PRESET_PATTERNS: { id: PresetPattern; label: string; hint: string; icon: React.ReactNode }[] = [
  {
    id: "kanban",
    label: "Kanban Board",
    hint: "Workflow columns (To Do, In Progress, Done) with cards",
    icon: <Kanban className="w-5 h-5 text-indigo-500" />,
  },
  {
    id: "timer",
    label: "Focus Timer",
    hint: "Countdown timer, presets, and daily logged sessions",
    icon: <Clock className="w-5 h-5 text-amber-500" />,
  },
  {
    id: "list",
    label: "Task List",
    hint: "Add items, mark done, track day streaks (like Day Planner)",
    icon: <ListTodo className="w-5 h-5 text-blue-500" />,
  },
  {
    id: "habit",
    label: "Habit Tracker",
    hint: "Habits checked per day with heatmap and streaks (like Habit Hub)",
    icon: <Repeat className="w-5 h-5 text-green-500" />,
  },
  {
    id: "logger",
    label: "Numeric Log",
    hint: "Log numbers per item with personal bests (like Workout Tracker)",
    icon: <LineChart className="w-5 h-5 text-orange-500" />,
  },
];

const AVAILABLE_BLOCKS = [
  {
    type: "kanban",
    title: "Kanban Board",
    desc: "Columns for workflow management (To Do, In Progress, Done)",
    icon: <Kanban className="w-5 h-5 text-indigo-500" />,
  },
  {
    type: "timer",
    title: "Focus Timer",
    desc: "Countdown timer & Pomodoro session logger with presets",
    icon: <Clock className="w-5 h-5 text-amber-500" />,
  },
  {
    type: "list",
    title: "Task List",
    desc: "Checkable list items with status and date filtering",
    icon: <ListTodo className="w-5 h-5 text-blue-500" />,
  },
  {
    type: "checklist",
    title: "Habit Checklist",
    desc: "Daily habit tracker with per-habit streaks",
    icon: <Repeat className="w-5 h-5 text-green-500" />,
  },
  {
    type: "streak",
    title: "Streak Counter",
    desc: "Highlight consecutive active days with badge",
    icon: <Flame className="w-5 h-5 text-orange-500" />,
  },
  {
    type: "calendar",
    title: "Week Calendar",
    desc: "7-day date scrubber to filter and view items by date",
    icon: <Calendar className="w-5 h-5 text-purple-500" />,
  },
  {
    type: "heatmap",
    title: "Activity Heatmap",
    desc: "12-week GitHub style activity intensity matrix",
    icon: <Grid3X3 className="w-5 h-5 text-emerald-500" />,
  },
  {
    type: "numeric_logger",
    title: "Numeric Logger",
    desc: "Log quantitative metrics (weight, pages, reps) with personal bests",
    icon: <LineChart className="w-5 h-5 text-red-500" />,
  },
];

const ICONS = [
  { id: "kanban", label: "Kanban", icon: <Kanban size={16} /> },
  { id: "clock", label: "Clock", icon: <Clock size={16} /> },
  { id: "calendar-check", label: "Planner", icon: <CalendarCheck size={16} /> },
  { id: "repeat", label: "Habits", icon: <Repeat size={16} /> },
  { id: "dumbbell", label: "Fitness", icon: <Dumbbell size={16} /> },
  { id: "book", label: "Reading", icon: <BookOpen size={16} /> },
  { id: "layers", label: "General", icon: <Layers size={16} /> },
];

interface Props {
  onBack: () => void;
  onPreview: () => void;
  onSaved: (appId: string) => void;
}

export function BuilderView({ onBack, onPreview, onSaved }: Props) {
  const setDraft = useBuilderStore((s) => s.setDraft);
  const refreshApps = useAppStore((s) => s.refresh);

  const [mode, setMode] = useState<"freeform" | "preset">("freeform");
  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("kanban");
  const [error, setError] = useState<string | null>(null);

  // Freeform mode state
  const [blocks, setBlocks] = useState<FreeformBlock[]>([
    { id: "b1", type: "timer", title: "Focus Timer", config: { durationMinutes: 25 } },
    { id: "b2", type: "kanban", title: "Kanban Board", config: {} },
    { id: "b3", type: "streak", title: "Daily Streak", config: {} },
  ]);
  const [showBlockPicker, setShowBlockPicker] = useState(false);

  // Preset mode state
  const [presetStep, setPresetStep] = useState<1 | 2>(1);
  const [pattern, setPattern] = useState<PresetPattern | null>("kanban");
  const [itemLabel, setItemLabel] = useState("");
  const [valueLabel, setValueLabel] = useState("Value");
  const [unit, setUnit] = useState("");

  const buildManifest = () => {
    const meta = { name: name.trim() || "My Mini-App", icon: selectedIcon };

    if (mode === "freeform") {
      return buildFreeformManifest(meta, blocks);
    }

    // Preset mode
    if (pattern === "kanban") return buildKanbanManifest(meta, itemLabel.trim() || "Task");
    if (pattern === "timer") return buildTimerManifest(meta, itemLabel.trim() || "Focus Session");
    if (pattern === "list") return buildSimpleListManifest(meta, itemLabel.trim() || "Task");
    if (pattern === "habit") return buildHabitManifest(meta, itemLabel.trim() || "Habit");
    return buildLoggerManifest(
      meta,
      itemLabel.trim() || "Item",
      valueLabel.trim() || "Value",
      unit.trim() || undefined
    );
  };

  const validateAndPreview = () => {
    if (!name.trim()) {
      setError("Please provide an app name");
      return;
    }
    if (mode === "freeform" && blocks.length === 0) {
      setError("Please add at least one component block");
      return;
    }
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

  const validateAndSave = async () => {
    if (!name.trim()) {
      setError("Please provide an app name");
      return;
    }
    if (mode === "freeform" && blocks.length === 0) {
      setError("Please add at least one component block");
      return;
    }
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

  const addBlock = (type: string, title: string) => {
    const newBlock: FreeformBlock = {
      id: `blk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      title,
      config: {},
    };
    setBlocks((prev) => [...prev, newBlock]);
    setShowBlockPicker(false);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    const copy = [...blocks];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;
    setBlocks(copy);
  };

  const removeBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-600 transition-colors"
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Create Mini-App</h1>
            <p className="text-xs text-gray-500">Design your own modular application</p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode("freeform")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              mode === "freeform" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Component size={13} />
            <span>Freeform</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("preset")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              mode === "preset" ? "bg-white text-gray-900 shadow-2xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Wand2 size={13} />
            <span>Preset</span>
          </button>
        </div>
      </div>

      {/* App Basic Info */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
            App Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Focus Sprint, Project Flow, Morning Routine"
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
            App Icon
          </label>
          <div className="flex flex-wrap gap-1.5">
            {ICONS.map((ic) => (
              <button
                key={ic.id}
                type="button"
                onClick={() => setSelectedIcon(ic.id)}
                className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-medium transition-all ${
                  selectedIcon === ic.id
                    ? "border-[#4caf50] bg-green-50 text-[#4caf50] shadow-2xs font-semibold"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {ic.icon}
                <span>{ic.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FREEFORM BUILDER MODE */}
      {mode === "freeform" && (
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Page Blocks</h2>
              <p className="text-xs text-gray-500">Components rendered in this mini-app</p>
            </div>
            <button
              type="button"
              onClick={() => setShowBlockPicker(true)}
              className="bg-[#4caf50] hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
            >
              <Plus size={14} /> Add Block
            </button>
          </div>

          {/* Block Stack List */}
          <div className="space-y-2">
            {blocks.map((block, idx) => (
              <div
                key={block.id}
                className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs hover:bg-gray-100/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-white border border-gray-200 text-[10px] font-bold text-gray-500 flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">{block.title}</h3>
                    <span className="text-[10px] font-mono text-gray-400 uppercase">{block.type}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveBlock(idx, "up")}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-20 hover:bg-white"
                    title="Move up"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={idx === blocks.length - 1}
                    onClick={() => moveBlock(idx, "down")}
                    className="p-1 rounded text-gray-400 hover:text-gray-700 disabled:opacity-20 hover:bg-white"
                    title="Move down"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBlock(block.id)}
                    className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 ml-1"
                    title="Remove block"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            {blocks.length === 0 && (
              <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl p-4">
                <Component className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No component blocks added yet.</p>
                <button
                  type="button"
                  onClick={() => setShowBlockPicker(true)}
                  className="mt-2 text-xs font-bold text-[#4caf50] hover:underline"
                >
                  + Add your first component block
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRESET MODE */}
      {mode === "preset" && (
        <div className="space-y-4 pt-2 border-t border-gray-100">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Select App Type
          </label>
          <div className="grid gap-2">
            {PRESET_PATTERNS.map((p) => {
              const active = pattern === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setPattern(p.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    active
                      ? "border-[#4caf50] bg-green-50/50 shadow-2xs"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="mt-0.5">{p.icon}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-xs text-gray-900">{p.label}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{p.hint}</div>
                  </div>
                  {active && <CheckCircle2 size={16} className="text-[#4caf50] flex-shrink-0" />}
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
              Tracking Label
            </label>
            <input
              type="text"
              value={itemLabel}
              onChange={(e) => setItemLabel(e.target.value)}
              placeholder="e.g. Task, Habit, Project, Workout"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
            />
          </div>

          {pattern === "logger" && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                  Metric Label
                </label>
                <input
                  type="text"
                  value={valueLabel}
                  onChange={(e) => setValueLabel(e.target.value)}
                  placeholder="e.g. Weight, Pages"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                  Unit (Optional)
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. kg, reps, min"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4caf50]"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={validateAndPreview}
            className="flex-1 py-2.5 bg-[#4caf50] hover:bg-green-600 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center justify-center gap-1.5"
          >
            <Sparkles size={14} /> Preview Live
          </button>
        </div>
        <button
          type="button"
          onClick={validateAndSave}
          className="w-full py-2 border border-[#4caf50] text-[#4caf50] hover:bg-green-50 rounded-xl text-xs font-bold transition-colors"
        >
          Save & Launch App
        </button>
      </div>

      {/* Add Block Modal Picker */}
      {showBlockPicker && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowBlockPicker(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-gray-200 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Add Component Block</h3>
                <p className="text-[11px] text-gray-500">Choose a modular primitive</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBlockPicker(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              {AVAILABLE_BLOCKS.map((blk) => (
                <div
                  key={blk.type}
                  onClick={() => addBlock(blk.type, blk.title)}
                  className="flex items-start gap-3 p-2.5 rounded-xl border border-gray-200/80 hover:border-[#4caf50] hover:bg-green-50/40 cursor-pointer transition-all group"
                >
                  <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-white transition-colors">
                    {blk.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-gray-900">{blk.title}</h4>
                    <p className="text-[11px] text-gray-500 leading-tight mt-0.5">{blk.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
