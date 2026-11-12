/**
 * Kurs çevirisi — kaynak öğe dökümü ve eksik raporu (12 Kasım 2026).
 *
 * KULLANIM
 *   node scripts/kurs-ceviri-kaynak.mjs                    # her dil için eksik/eski/sahipsiz sayıları
 *   node scripts/kurs-ceviri-kaynak.mjs --dok dosya.json   # çevrilecek bütün kaynak öğeleri (Türkçe + Fransızca) JSON olarak yazar
 *   node scripts/kurs-ceviri-kaynak.mjs --eksik nl         # o dilde eksik öğeleri JSON olarak stdout'a yazar
 * Yeni haftalık veri geldiğinde «eksik» çıktısı çevrilecek öğeleri verir; sonucu src/data/kurs-ceviri/<dil>.json'a ekleyin
 * (bölüm yapısı: src/lib/kurs-ceviri.mjs başlığı, süreç: docs/KURS-CEVIRISI.md).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { depoKaynaklari, CEVIRI_DILLERI } from '../src/lib/kurs-ceviri.mjs';

const kok = fileURLToPath(new URL('..', import.meta.url)).split('\\').join('/').replace(/\/$/, '');
const oku = (y) => (existsSync(y) ? JSON.parse(readFileSync(y, 'utf8')) : {});
const kaynak = depoKaynaklari(kok);

/** dil → { bolum → { eksik:[öğe], eski:[anahtar], sahipsiz:[anahtar] } } */
export function rapor(dil) {
  const bind = oku(`${kok}/src/data/kurs-ceviri/${dil}.json`);
  const konular = oku(`${kok}/src/data/konular-${dil}.json`);
  const bekleyen = bind.bekleyen ?? {};
  const sonuc = {};
  const duz = (bolum, ogeler, harita) => {
    const var_ = new Set(ogeler.map((o) => o.k));
    sonuc[bolum] = {
      eksik: ogeler.filter((o) => !(typeof harita[o.k] === 'string' && harita[o.k].trim()) && !(bekleyen[bolum] ?? []).includes(o.k)),
      eski: [],
      sahipsiz: Object.keys(harita).filter((k) => !var_.has(k)),
    };
  };
  duz('konu', kaynak.konu, konular);
  for (const b of ['baslik', 'sunumKonu', 'hedef', 'rozet']) duz(b, kaynak[b], bind[b] ?? {});
  // hafta: anahtar var + özet güncel; kalıcı: slug var + özet güncel (+ başlık dolu)
  const hafta = bind.hafta ?? {};
  sonuc.hafta = { eksik: [], eski: [], sahipsiz: Object.keys(hafta).filter((k) => !kaynak.hafta.some((o) => o.k === k)) };
  for (const o of kaynak.hafta) {
    const g = hafta[o.k];
    if (!g?.t) { if (!(bekleyen.hafta ?? []).includes(o.k)) sonuc.hafta.eksik.push(o); }
    else if (g.h !== o.h) sonuc.hafta.eski.push(o.k);
  }
  const kalici = bind.kalici ?? {};
  sonuc.kalici = { eksik: [], eski: [], sahipsiz: Object.keys(kalici).filter((k) => !kaynak.kalici.some((o) => o.k === k)) };
  for (const o of kaynak.kalici) {
    const g = kalici[o.k];
    if (!g?.baslik) { if (!(bekleyen.kalici ?? []).includes(o.k)) sonuc.kalici.eksik.push(o); }
    else if (g.h !== o.h) sonuc.kalici.eski.push(o.k);
  }
  return sonuc;
}

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const a = process.argv.slice(2);
  if (a[0] === '--dok') { writeFileSync(a[1], JSON.stringify(kaynak, null, 1)); console.log(`yazıldı: ${a[1]}`); }
  else if (a[0] === '--eksik') {
    const r = rapor(a[1]);
    console.log(JSON.stringify(Object.fromEntries(Object.entries(r).map(([b, v]) => [b, v.eksik])), null, 1));
  } else {
    for (const dil of CEVIRI_DILLERI) {
      const r = rapor(dil);
      console.log(`${dil}: ` + Object.entries(r).map(([b, v]) => `${b} eksik ${v.eksik.length}/eski ${v.eski.length}/sahipsiz ${v.sahipsiz.length}`).join(' · '));
    }
  }
}
