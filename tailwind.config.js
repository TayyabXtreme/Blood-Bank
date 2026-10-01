module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: '#FBF8F6',
        ink: '#242326',
        muted: '#77717A',
        blood: '#BC2846',
        blush: '#FCECEF',
        line: '#EDE5E3',
      },
      fontFamily: {
        sans: ['DMSans_400Regular'],
        medium: ['DMSans_500Medium'],
        bold: ['Manrope_700Bold'],
        display: ['Manrope_800ExtraBold'],
      },
    },
  },
  plugins: [],
};
