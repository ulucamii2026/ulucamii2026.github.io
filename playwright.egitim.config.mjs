// egitim.ulucamii.be (egitim/) ekran testleri. Önce `npm run egitim:build`; sunucu derlenmiş çıktıyı 4402'de sunar.
// Ana sitenin yapılandırmasıyla aynı düzen (masaüstü + telefon, azaltılmış hareket, açık tema varsayılan).
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/egitim',
  testMatch: '**/*.spec.mjs',
  outputDir: './test-results/egitim',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 2,
  timeout: 30_000,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4402',
    serviceWorkers: 'block',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'masaustu-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } },
    { name: 'mobil-chromium', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'node scripts/egitim-onizle.mjs',
    url: 'http://127.0.0.1:4402/tr/',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
