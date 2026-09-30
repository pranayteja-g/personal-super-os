import React from "react";
import {
  CalendarCheck,
  Repeat,
  BookOpen,
  Dumbbell,
  Layers,
  Kanban,
  Clock,
  Flame,
  LineChart,
  ListTodo,
  CheckCircle2,
} from "lucide-react";

interface AppIconProps {
  name?: string;
  className?: string;
  size?: number;
}

export const AppIcon = React.memo(function AppIcon({
  name,
  className = "w-5 h-5",
  size = 20,
}: AppIconProps) {
  switch (name) {
    case "calendar-check":
      return <CalendarCheck size={size} className={className || "text-blue-500"} />;
    case "repeat":
      return <Repeat size={size} className={className || "text-green-500"} />;
    case "book":
      return <BookOpen size={size} className={className || "text-purple-500"} />;
    case "dumbbell":
      return <Dumbbell size={size} className={className || "text-orange-500"} />;
    case "kanban":
      return <Kanban size={size} className={className || "text-indigo-500"} />;
    case "clock":
      return <Clock size={size} className={className || "text-amber-500"} />;
    case "streak":
    case "flame":
      return <Flame size={size} className={className || "text-orange-500"} />;
    case "line-chart":
      return <LineChart size={size} className={className || "text-red-500"} />;
    case "list":
    case "list-todo":
      return <ListTodo size={size} className={className || "text-blue-500"} />;
    case "check":
      return <CheckCircle2 size={size} className={className || "text-emerald-500"} />;
    default:
      return <Layers size={size} className={className || "text-emerald-500"} />;
  }
});
