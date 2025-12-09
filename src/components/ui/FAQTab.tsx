// src/components/ui/FAQTab.tsx
import React from "react";

export function FAQTab({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full h-8 bg-gradient-to-b from-green-400 via-green-500 to-green-600
      shadow-lg rounded-md flex items-center justify-center px-3 text-white font-semibold text-base
      select-none overflow-hidden active:scale-95 transition
      border-2 border-green-700"
      style={{ WebkitTapHighlightColor: "transparent", minHeight: 32, maxHeight: 36 }}
    >
      <span className="z-10 relative">Frequently Asked Questions</span>
      {/* Glint animation */}
      <span
        className="absolute left-[-60%] top-0 w-1/2 h-full opacity-60 pointer-events-none rounded-md
        bg-gradient-to-r from-transparent via-white to-transparent animate-glint"
      />

      {/* Optional beveled gloss */}
      <span
        className="absolute inset-0 rounded-md pointer-events-none opacity-25"
        style={{
          background:
            "linear-gradient(120deg, rgba(255,255,255,0.20) 0%,rgba(255,255,255,0.06) 55%,rgba(255,255,255,0) 100%)",
        }}
      />
    </button>
  );
}