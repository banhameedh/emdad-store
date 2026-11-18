/** Brand tokens — مطابقة لتصميم النموذج التفاعلي */
module.exports = {
  content: ['./index.html', './admin.html', './src/**/*.js'],
  theme: {
    extend: {
      fontFamily: { sans: ['SaudiRiyal', 'Shamel', 'system-ui', 'sans-serif'] },
      colors: {
        deep: '#075A9F', brand: '#1174BA', primary: '#2196D2', sky: '#69C9F0',
        orange: '#F7941E', 'orange-2': '#FFAD3F', ink: '#0B2A45', muted: '#6B8299',
        tint: '#F2FAFE', surface: '#F7FAFD'
      },
      boxShadow: {
        soft: '0 8px 22px -16px rgba(7,90,159,.38)',
        lift: '0 18px 34px -16px rgba(7,90,159,.45)'
      }
    }
  }
};
