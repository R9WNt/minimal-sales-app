// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      zIndex: {
        base: "var(--z-base)",
        header: "var(--z-header)",
        sticky: "var(--z-sticky)",
        pin: "var(--z-pin)",
        fab: "var(--z-fab)",
        drawer: "var(--z-drawer)",
        dropdown: "var(--z-dropdown)",
        backdrop: "var(--z-backdrop)",
        modal: "var(--z-modal)",
        toast: "var(--z-toast)",
        tooltip: "var(--z-tooltip)",
        top: "var(--z-top)",
      },
    },
  },
  plugins: [],
};