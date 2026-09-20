// Seviye testi soru bankasının Türkçe dökümü: docs/seviye-testi/soru-bankasi-tr.md
// Tek kaynak src/lib/seviye-testi/; çıktı elle düzenlenmez — `npm run seviye:dokum` ile yeniden üretilir.
// `--denetle` verilirse dosyaya yazmaz; depodaki döküm bankayla aynı değilse 1 ile çıkar.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { MADDELER, EZBER, BEYAN, SORU_BANKASI_SURUMU, BANKA_DURUMU } = await import('../src/lib/seviye-testi/index.ts');
const hedef = resolve(kok, 'docs/seviye-testi/soru-bankasi-tr.md');

const ALANLAR = [
  ['okuma', 'Kur’an okuma — tanıma merdiveni', ['K1 · Harfleri tanıma', 'K2 · Harflerin kelime içindeki yazılışı', 'K3 · Harekeler', 'K4 · Cezm, şedde, tenvin ve uzatma', 'K5 · Kelime ve âyet okuma']],
  ['kuranBilgi', 'Kur’an bilgisi', ['Temel', 'Orta', 'İleri (tecvid kavramları)']],
  ['itikat', 'İnanç (itikat)', ['Temel', 'Orta', 'İleri']],
  ['namaz', 'Temizlik ve namaz', ['Temel', 'Orta', 'İleri']],
  ['ibadet', 'Oruç, zekât, hac, kurban ve günlük hayat', ['Temel', 'Orta', 'İleri']],
  ['siyer', 'Siyer ve peygamberler', ['Temel', 'Orta', 'İleri']],
  ['ahlak', 'Ahlak ve âdâb', ['Temel', 'Orta', 'İleri']],
];

const sik = s => ('ar' in s ? `<span lang="ar" dir="rtl">${s.ar}</span>` : s.tr);
const satirlar = [];
const yaz = (...s) => satirlar.push(...s);

const puanli = MADDELER.filter(m => !m.emekli && !m.mezhepBagli).length;
yaz('# Seviye tespit testi — soru bankası (Türkçe döküm)', '',
  '> Bu belge `npm run seviye:dokum` ile bankadan üretilir; **elle düzenlenmez**. Kaynak: `src/lib/seviye-testi/sorular/`.',
  `> Banka sürümü **${SORU_BANKASI_SURUMU}** · durum **${BANKA_DURUMU}** · ${MADDELER.filter(m => !m.emekli).length} madde (${puanli} puanlı) + ${EZBER.length} ezber + ${BEYAN.length} öz beyan.`,
  '> ✔ doğru şıkkı gösterir. Katılımcı her soruda ayrıca «Bilmiyorum» seçeneğini görür; yanlış ve «Bilmiyorum» aynı sayılır (eksi puan yok).',
  '> «Hanefî» etiketli maddeler düzeyi etkilemez; yalnız hoca raporunda bilgi olarak görünür. Doğru cevaplar ve kaynaklar sayfanın HTML’ine basılmaz.', '');

for (const [alan, baslik, basamaklar] of ALANLAR) {
  const alanMaddeleri = MADDELER.filter(m => m.alan === alan);
  yaz(`## ${baslik} (${alanMaddeleri.filter(m => !m.emekli).length} madde)`, '');
  basamaklar.forEach((ad, i) => {
    const grup = alanMaddeleri.filter(m => m.basamak === i + 1);
    if (!grup.length) return;
    yaz(`### ${ad}`, '');
    for (const m of grup) {
      const etiket = [m.emekli ? 'emekli' : '', m.mezhepBagli ? 'Hanefî · puana girmez' : '', m.ses ? 'dinlemeli' : ''].filter(Boolean).join(' · ');
      yaz(`**${m.id}** — ${m.soru.tr}${etiket ? ` _(${etiket})_` : ''}`, '');
      if (m.goster) yaz(`Gösterilen: <span lang="ar" dir="rtl">${m.goster}</span>`, '');
      if (m.ses) yaz(`Ses: \`${m.ses}\``, '');
      m.siklar.forEach((s, j) => yaz(`${j + 1}. ${sik(s)}${j === m.dogru ? ' ✔' : ''}`));
      yaz('', `Kaynak: ${m.kaynak}`, '');
    }
  });
}

yaz(`## Ezber listesi (${EZBER.length})`, '', 'Her biri için: bilmiyorum · bakarak okurum · ezbere bilirim.', '');
EZBER.forEach(e => yaz(`- **${e.id}** — ${e.ad.tr}${e.aciklama ? ` — ${e.aciklama.tr}` : ''}`));
yaz('', `## Öz beyan (${BEYAN.length})`, '');
for (const b of BEYAN) {
  yaz(`**${b.id}** _(${b.kume === 'okuma' ? 'Kur’an okuma' : 'uygulama'})_ — ${b.soru.tr}`, '');
  b.secenekler.forEach((s, j) => yaz(`${j + 1}. ${s.tr}`));
  yaz('');
}

const cikti = satirlar.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
if (process.argv.includes('--denetle')) {
  const eski = existsSync(hedef) ? readFileSync(hedef, 'utf8').replace(/\r\n/g, '\n') : '';
  if (eski !== cikti) { console.error('Soru bankası dökümü bankayla aynı değil: npm run seviye:dokum'); process.exit(1); }
  console.log('Soru bankası dökümü güncel.');
} else {
  mkdirSync(dirname(hedef), { recursive: true });
  writeFileSync(hedef, cikti, 'utf8');
  console.log(`Yazıldı: ${hedef} (${MADDELER.length} madde)`);
}
