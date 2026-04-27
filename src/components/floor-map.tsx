"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Crisis, CrisisSeverity } from "@/types/database";

const severityColors: Record<CrisisSeverity, string> = {
  critical: "bg-[#FF5A4F] shadow-[0_0_16px_rgba(255,90,79,0.8)]",
  high: "bg-[#FF9D42] shadow-[0_0_14px_rgba(255,157,66,0.8)]",
  medium: "bg-[#68B0FF] shadow-[0_0_14px_rgba(104,176,255,0.8)]",
  low: "bg-[#3DDC97] shadow-[0_0_14px_rgba(61,220,151,0.7)]",
};

function roomToGrid(room: string): { row: number; col: number } {
  const num = parseInt(room, 10) || 100;
  const floor = Math.floor(num / 100);
  const roomNum = num % 100;

  return {
    row: Math.min(Math.max(floor, 0), 11),
    col: Math.min(Math.max(roomNum % 10, 0), 7),
  };
}

function getEffectiveSeverity(crisis: Crisis): CrisisSeverity {
  return crisis.severity_assessment ?? crisis.severity ?? crisis.ai_severity ?? "medium";
}

export function FloorMap({
  crises,
  onCrisisClick,
  activeCrisisId,
  showcaseMode = false,
}: {
  crises: Crisis[];
  onCrisisClick?: (crisis: Crisis) => void;
  activeCrisisId?: string | null;
  showcaseMode?: boolean;
}) {
  const floors = 12;
  const roomsPerFloor = 8;

  const crisisPositions = crises.map((crisis) => ({
    crisis,
    pos: roomToGrid(crisis.room_number || "100"),
  }));

  return (
    <div className={`panel-surface h-full overflow-hidden p-4 ${showcaseMode ? "ring-1 ring-primary/18" : ""}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="eyebrow mb-2">Spatial awareness</div>
          <h3 className="flex items-center gap-2 text-base font-semibold text-white">
            <MapPin className="h-4 w-4 text-[#68B0FF]" />
            Venue floor map
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#9CB0CB]">
          {[
            ["Critical", "bg-[#FF5A4F]"],
            ["High", "bg-[#FF9D42]"],
            ["Medium", "bg-[#68B0FF]"],
            ["Low", "bg-[#3DDC97]"],
          ].map(([label, color]) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="data-grid rounded-[1.25rem] border border-white/6 bg-[#09111D]/70 p-3">
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateRows: `repeat(${floors}, 1fr)`,
            gridTemplateColumns: `auto repeat(${roomsPerFloor}, 1fr)`,
          }}
        >
          {Array.from({ length: floors }).map((_, floorIndex) => (
            <div key={`floor-row-${floorIndex}`} className="contents">
              <div className="flex items-center justify-end pr-2 text-[10px] font-mono text-[#7F96B7]">
                F{floors - floorIndex}
              </div>
              {Array.from({ length: roomsPerFloor }).map((_, roomIndex) => {
                const row = floors - 1 - floorIndex;
                const crisisHere = crisisPositions.find(
                  (entry) => entry.pos.row === row && entry.pos.col === roomIndex
                );
                const isActive = crisisHere?.crisis.id === activeCrisisId;

                const sev = crisisHere ? getEffectiveSeverity(crisisHere.crisis) : undefined;

                return (
                  <button
                    key={`${floorIndex}-${roomIndex}`}
                    type="button"
                    onClick={() => crisisHere && onCrisisClick?.(crisisHere.crisis)}
                    className={cn(
                      "relative aspect-square rounded-xl border border-white/5 bg-white/[0.03] transition-all",
                      crisisHere
                        ? "cursor-pointer hover:border-white/20 hover:bg-white/[0.05]"
                        : "cursor-default",
                      isActive && "border-primary/40 bg-primary/10 shadow-[0_0_0_1px_rgba(106,169,255,0.3),0_0_28px_rgba(106,169,255,0.2)]"
                    )}
                  >
                    {crisisHere && sev && (
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute inset-1.5 flex items-center justify-center rounded-[10px] border border-white/10 bg-black/20"
                      >
                        {isActive ? (
                          <span className="status-wave absolute inset-0 rounded-[10px] bg-primary/20" />
                        ) : null}
                        <div
                          className={cn(
                            "h-3.5 w-3.5 rounded-full",
                            severityColors[sev]
                          )}
                        />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
