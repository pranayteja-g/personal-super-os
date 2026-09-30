import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { z } from "zod";
import { format } from "date-fns";
import type { ComponentDefinition, RenderContext, ValidationResult } from "@/types/components";
import { sqliteRecordRepository as repo } from "@/db/repositories/recordRepository";
import { useUiStore } from "@/store/uiStore";
import { useCollection } from "@/runtime/hooks/useCollection";
import { Play, Pause, RotateCcw, Check, Clock, Trash2, Target, X, CheckCircle2 } from "lucide-react";

export interface TimerConfig {
  collection: string;
  durationMinutes?: number;
  label?: string;
  dateField?: string;
  durationField?: string;
  titleField?: string;
}

const TimerConfigSchema = z.object({
  collection: z.string().min(1),
  durationMinutes: z.number().positive().optional(),
  label: z.string().optional(),
  dateField: z.string().optional(),
  durationField: z.string().optional(),
  titleField: z.string().optional(),
});

const PRESETS = [5, 15, 25, 45, 60];

function TimerView({ appId, config }: { appId: string; config: TimerConfig }) {
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const selectedKey = useUiStore((s) => s.selectedDate[appId] ?? today);
  const activeTask = useUiStore((s) => s.activeTask[appId]);
  const setActiveTask = useUiStore((s) => s.setActiveTask);
  const autoStartTrigger = useUiStore((s) => s.timerAutoStartTrigger[appId]);

  const defaultMinutes = config.durationMinutes ?? 25;
  const [targetMinutes, setTargetMinutes] = useState(defaultMinutes);
  const [secondsRemaining, setSecondsRemaining] = useState(defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionLabel, setSessionLabel] = useState("");
  const [completionPrompt, setCompletionPrompt] = useState<{
    taskTitle: string;
    itemId: string;
    collectionId: string;
    statusField: string;
    doneValue: string;
  } | null>(null);

  const targetEndTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastTriggerRef = useRef<number | null>(null);

  const logs = useCollection(config.collection);
  const dateField = config.dateField ?? "date";
  const durationField = config.durationField ?? "minutes";
  const titleField = config.titleField ?? "title";

  // When activeTask changes, prefill session label if empty or matching previous task
  useEffect(() => {
    if (activeTask) {
      setSessionLabel(activeTask.title);
    }
  }, [activeTask]);

  // Handle auto-start trigger when clicking "▶ Focus" from Kanban or List
  useEffect(() => {
    if (autoStartTrigger && autoStartTrigger !== lastTriggerRef.current) {
      lastTriggerRef.current = autoStartTrigger;
      setIsRunning(true);
    }
  }, [autoStartTrigger]);

  // Filter today's sessions with useMemo
  const todaysLogs = useMemo(() => {
    return logs.filter((l) => String(l.data[dateField] ?? "").startsWith(selectedKey));
  }, [logs, dateField, selectedKey]);

  const totalMinutesToday = useMemo(() => {
    return todaysLogs.reduce((acc, curr) => {
      const val = Number(curr.data[durationField] ?? 0);
      return acc + (Number.isFinite(val) ? val : 0);
    }, 0);
  }, [todaysLogs, durationField]);

  const logSession = useCallback(
    async (mins: number) => {
      const label = sessionLabel.trim() || activeTask?.title || config.label || "Focus Session";
      const data: Record<string, unknown> = {
        [dateField]: selectedKey,
        [durationField]: mins,
        [titleField]: label,
      };
      await repo.create({
        collectionId: config.collection,
        data,
      });

      // If active task was bound, prompt to mark as done
      if (activeTask && activeTask.statusField && activeTask.doneValue) {
        setCompletionPrompt({
          taskTitle: activeTask.title,
          itemId: activeTask.itemId,
          collectionId: activeTask.collectionId,
          statusField: activeTask.statusField,
          doneValue: activeTask.doneValue,
        });
      }
    },
    [dateField, selectedKey, durationField, titleField, sessionLabel, activeTask, config.label, config.collection]
  );

  // Drift-proof timer using absolute timestamps
  useEffect(() => {
    if (isRunning) {
      targetEndTimeRef.current = Date.now() + secondsRemaining * 1000;
      intervalRef.current = window.setInterval(() => {
        if (!targetEndTimeRef.current) return;
        const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));
        setSecondsRemaining(remaining);
        if (remaining <= 0) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          logSession(targetMinutes);
        }
      }, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, logSession, targetMinutes]);

  const selectPreset = (mins: number) => {
    setIsRunning(false);
    setTargetMinutes(mins);
    setSecondsRemaining(mins * 60);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsRemaining(targetMinutes * 60);
  };

  const manualLog = async () => {
    await logSession(targetMinutes);
    resetTimer();
  };

  const markActiveTaskDone = async () => {
    if (!completionPrompt) return;
    await repo.update(completionPrompt.itemId, {
      data: { [completionPrompt.statusField]: completionPrompt.doneValue },
    });
    setCompletionPrompt(null);
    setActiveTask(appId, null);
  };

  const deleteSession = async (id: string) => {
    await repo.delete(id);
  };

  const minutesDisplay = Math.floor(secondsRemaining / 60);
  const secondsDisplay = secondsRemaining % 60;
  const progressPercent = Math.max(
    0,
    Math.min(100, ((targetMinutes * 60 - secondsRemaining) / (targetMinutes * 60)) * 100)
  );

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
          <Clock size={14} className="text-[#4caf50]" />
          {config.label ?? "Focus Timer"}
        </span>
        <div className="text-xs font-bold text-gray-700 bg-green-50 text-emerald-700 px-2 py-0.5 rounded-full border border-green-200/60">
          {totalMinutesToday} min logged today
        </div>
      </div>

      {/* Active Focus Target Banner */}
      {activeTask && (
        <div className="mb-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-6 h-6 rounded-lg bg-[#4caf50] text-white flex items-center justify-center flex-shrink-0">
              <Target size={13} />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                Focusing On ({activeTask.source})
              </div>
              <div className="text-xs font-semibold text-gray-900 truncate">
                {activeTask.title}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTask(appId, null)}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-md transition-colors cursor-pointer"
            title="Unlink task"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Cross-Primitive Completion Prompt */}
      {completionPrompt && (
        <div className="mb-3.5 bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col gap-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <CheckCircle2 size={16} className="text-amber-600" />
            <span>Focus session logged for "{completionPrompt.taskTitle}"!</span>
          </div>
          <p className="text-[11px] text-amber-800">
            Would you like to mark this card as Done in your board/list?
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={markActiveTaskDone}
              className="bg-[#4caf50] hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Check size={13} strokeWidth={3} />
              <span>Mark as Done</span>
            </button>
            <button
              type="button"
              onClick={() => setCompletionPrompt(null)}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              Keep In Progress
            </button>
          </div>
        </div>
      )}

      {/* Preset Buttons */}
      <div className="flex justify-center gap-1.5 mb-4">
        {PRESETS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => selectPreset(m)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer ${
              targetMinutes === m
                ? "bg-[#4caf50] text-white shadow-2xs font-semibold"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {m}m
          </button>
        ))}
      </div>

      {/* Main Timer Display */}
      <div className="flex flex-col items-center justify-center py-4 bg-gray-50 rounded-2xl border border-gray-200/60 mb-4 relative overflow-hidden">
        {/* Progress Background bar */}
        <div
          className="absolute bottom-0 left-0 h-1 bg-[#4caf50] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />

        <div className="text-5xl font-black text-gray-900 tracking-tight font-mono mb-2">
          {String(minutesDisplay).padStart(2, "0")}:{String(secondsDisplay).padStart(2, "0")}
        </div>

        <input
          type="text"
          placeholder="Session goal (optional)…"
          value={sessionLabel}
          onChange={(e) => setSessionLabel(e.target.value)}
          className="text-xs text-center border-b border-gray-300 focus:border-[#4caf50] bg-transparent py-1 px-3 outline-none text-gray-700 w-52 mb-3"
        />

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full font-bold text-sm text-white shadow-sm transition-all active:scale-95 cursor-pointer ${
              isRunning ? "bg-amber-500 hover:bg-amber-600" : "bg-[#4caf50] hover:bg-green-600"
            }`}
          >
            {isRunning ? (
              <>
                <Pause size={16} /> Pause
              </>
            ) : (
              <>
                <Play size={16} /> Start
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resetTimer}
            className="w-10 h-10 rounded-full border border-gray-300 hover:bg-white text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            onClick={manualLog}
            className="text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-2 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
            title="Log session immediately"
          >
            <Check size={14} /> Log Done
          </button>
        </div>
      </div>

      {/* Completed Today List */}
      <div className="border-t border-gray-100 pt-3">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Sessions on {selectedKey}
        </div>
        {todaysLogs.length === 0 ? (
          <div className="text-center py-4 text-xs text-gray-400">No focus sessions on this day</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {todaysLogs.map((log) => (
              <div key={log.id} className="group flex items-center justify-between py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4caf50]" />
                  <span className="font-semibold text-gray-800">
                    {String(log.data[titleField] ?? "Session")}
                  </span>
                  <span className="text-gray-400 font-mono">
                    {String(log.data[durationField] ?? targetMinutes)} min
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteSession(log.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-opacity cursor-pointer"
                  title="Delete log"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const TimerComponent: ComponentDefinition<TimerConfig> = {
  type: "timer",
  version: 1,
  defaultConfig: {
    collection: "",
    durationMinutes: 25,
    label: "Focus Session",
    dateField: "date",
    durationField: "minutes",
  },
  validateConfig(config: unknown): ValidationResult {
    const r = TimerConfigSchema.safeParse(config);
    return r.success ? { ok: true } : { ok: false, errors: r.error.issues.map((i) => i.message) };
  },
  render(context: RenderContext) {
    return <TimerView appId={context.appId} config={context.config as unknown as TimerConfig} />;
  },
  getDataDependencies(config) {
    return [{ collectionId: config.collection }];
  },
  getEventSubscriptions() {
    return [];
  },
};
