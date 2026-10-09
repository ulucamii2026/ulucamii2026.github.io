import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// 9 Ekim 2026: Word, vaaz PDF'lerine bölüm etiketlerindeki emojiler için Segoe UI Emoji'yi alt kümesiz (~8 MB)
// gömüyordu; yenilenen her PDF ~4,7 MB oldu (emojisiz en büyüğü 1,25 MB). GitHub Pages yayını 1 GB ile sınırlı.
// Düzeltme (sayfa çizimi piksel piksel aynı kalır):
//   python ~/.claude/skills/vaaz-mukemmel/scripts/pdf_emoji_kucult.py public/vaazlar
const KOK = fileURLToPath(new URL('../public/vaazlar/', import.meta.url));
const SINIR = 2_000_000;

function pdfler(klasor) {
  return readdirSync(klasor, { withFileTypes: true }).flatMap((g) => {
    const yol = join(klasor, g.name);
    if (g.isDirectory()) return pdfler(yol);
    return g.name.endsWith('.pdf') ? [yol] : [];
  });
}

test('vaaz PDF\'leri 2 MB sınırının altında (tam gömülü emoji yazı tipi yok)', () => {
  const hepsi = pdfler(KOK);
  assert.ok(hepsi.length > 100, `vaaz PDF'i bulunamadı: ${KOK}`);
  const buyuk = hepsi
    .map((yol) => [relative(KOK, yol).replaceAll('\\', '/'), statSync(yol).size])
    .filter(([, bayt]) => bayt > SINIR)
    .map(([ad, bayt]) => `${ad} (${(bayt / 1e6).toFixed(2)} MB)`);
  assert.deepEqual(buyuk, [], 'Büyük vaaz PDF\'leri — küçült: python ~/.claude/skills/vaaz-mukemmel/scripts/pdf_emoji_kucult.py public/vaazlar');
});
