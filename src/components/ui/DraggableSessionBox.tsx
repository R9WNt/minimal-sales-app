import { useRef } from "react";
import Draggable from "react-draggable";

interface DraggableSessionBoxProps {
  sessionTime: number;
  userPhone: string;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

export function DraggableSessionBox({
  sessionTime,
  userPhone,
}: DraggableSessionBoxProps) {
  const nodeRef = useRef(null);

  return (
    <Draggable nodeRef={nodeRef}>
      <div
        ref={nodeRef}
        className="fixed z-pin flex flex-col items-center justify-center 
          bg-white/80 border border-slate-200 rounded-2xl shadow-xl 
          px-5 py-3 select-none cursor-move draggable-raise"
        style={{
          minWidth: 140,
          maxWidth: 200,
          boxShadow: "0px 2px 16px 2px #0001",
        }}
      >
        {/* Session timer */}
        <span
          className="text-3xl font-bold font-mono text-slate-700/90"
          tabIndex={0}
        >
          {formatTime(sessionTime)}
        </span>
        {/* Phone number */}
        <span className="text-base font-mono text-slate-700/70 tracking-widest">
          +234 {userPhone || "—"}
        </span>
      </div>
    </Draggable>
  );
}