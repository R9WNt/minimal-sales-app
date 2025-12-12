module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      zIndex: {
        'base': '0',
        'header': '50',
        'sticky': '100',
        'pin': '200',
        'fab': '300',
        'drawer': '400',
        'dropdown': '500',
        'backdrop': '550',
        'modal': '600',
        'toast': '700',
        'tooltip': '800',
        'top': '1000',
      }
    }
  },
  plugins: [],
};