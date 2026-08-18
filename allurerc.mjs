import { defineConfig } from 'allure';

export default defineConfig({
  name: 'Bunkai TMS',
  output: './allure-report',
  plugins: {
    awesome: {
      options: {
        reportLanguage: 'en',
      },
    },
  },
});
