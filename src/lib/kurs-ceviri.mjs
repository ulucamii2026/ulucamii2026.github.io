/**
 * Kurs bölümü (İlim Yolu: /<dil>/kurs/…) için en/nl/de çeviri katmanı — 12 Kasım 2026.
 *
 * Neden ayrı katman: ders-materyalleri.json, ders-defteri-2026-2027.json, ders-ilerleme.json ve yillik-plan-2026-2027.json
 * kurs projesindeki betiklerle ÜRETİLİR (haftalık yenilenir; elle yazılmaz). Çeviri bu dosyalara alan eklenerek değil,
 * dil başına ayrı «bindirme» dosyalarıyla yapılır; böylece yeniden üretim çeviriyi silemez:
 *   - src/data/konular-en.json (var), konular-nl.json, konular-de.json — konu başlığı: Türkçe başlık → çeviri
 *   - src/data/kurs-ceviri/<dil>.json — kalan her şey; anahtar her zaman KAYNAK METNİN kendisi (ya da tarih|alan, slug):
 *       baslik     sunum ve ek belge başlıkları   (Türkçe başlık → çeviri)
 *       sunumKonu  sunumun konu satırı            (Türkçe konu → çeviri)
 *       hedef      ders kazanımı (goal_tr)        (Türkçe cümle → çeviri)
 *       rozet      takvim rozeti / gün notu parçası (Türkçe → çeviri)
 *       hafta      «tarih|odev» ve «tarih|ezber»  → { h: Türkçe metnin özeti, t: çeviri }
 *       kalici     materyal dosya adı (slug)      → { h: Türkçe başlığın özeti, baslik, aciklama }
 *       plan       yıllık plan GÖVDESİ (kazanım/özet/etkinlik/ezber paragrafı) (Türkçe paragraf → çeviri); en/nl/de/fr (fr.json yalnız bu bölümü taşır).
 *                  Bilerek KISMİ: kapsama «eksik» sayılmaz (tests/yillik-plan-ceviri.test.mjs); çevrilmemiş paragraf Türkçe kalır ve lang="tr" ile görünür.
 *       bekleyen   bilerek çevrilmeyenler (bölüm → [anahtar…]); neden docs/KURS-CEVIRISI.md'de
 * Kaynak metin değişirse anahtar tutmaz (ya da özet uyuşmaz): sayfa o öğede Fransızcaya/Türkçeye düşer ve etiketler;
 * tests/kurs-ceviri.test.mjs eksik/eski girdileri listeler.
 *
 * Düşüş zinciri (yanlış `lang` asla yazılmaz): en → en, fr, tr · nl/de → dil, fr, tr · fr → fr, tr · tr → tr.
 * Sonuç her zaman { m: metin, d: metnin GERÇEK dili }; d sayfa dilinden farklıysa sayfa görünür bir dil etiketi koyar.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { parse as yamlParse } from 'yaml';

export const CEVIRI_DILLERI = ['en', 'nl', 'de'];
export const OZET_AYIRAC = '|';

/** Kaynak metnin kısa özeti (sha1 ilk 8 hane): hafta notu ve kalıcı materyal bindirmelerinde «eskidi mi» denetimi. */
export const ozet = (s) => createHash('sha1').update(String(s ?? '').replace(/\r\n/g, '\n').trim()).digest('hex').slice(0, 8);

const dolu = (s) => typeof s === 'string' && s.trim() !== '';

/** Yıllık plandaki rozet ve gün notlarının Türkçe parçaları (« · » ile birleşik notlar parçalanır). */
export const notParcalari = (not) => String(not ?? '').split(' · ').map((s) => s.trim()).filter(Boolean);

/**
 * Bütün çevrilebilir kaynak öğeler. `veri`: { defter, plan, ilerleme, materyal, konularFr, kalici }.
 * `kalici`: [{ slug, baslik:{tr,fr?,en?}, aciklama?:{tr?,fr?,en?} }].
 */
export function kaynakOgeleri(veri) {
  const { defter, plan, ilerleme, materyal, konularFr = {}, kalici = [] } = veri;
  const tekil = (liste) => [...new Map(liste.map((o) => [o.k, o])).values()];

  const konu = tekil([
    ...defter.map((d) => d.konu),
    ...plan.gunler.flatMap((g) => g.dersler.map((x) => x.konu)),
  ].map((k) => ({ k, fr: konularFr[k] ?? '' })));

  const baslik = tekil(materyal.gunler.flatMap((g) => [
    ...(g.sunumlar ?? []).map((s) => ({ k: s.baslik?.tr, fr: s.baslik?.fr ?? '' })),
    ...(g.ekler ?? []).map((e) => ({ k: e.baslik?.tr, fr: e.baslik?.fr ?? '' })),
  ]).filter((o) => dolu(o.k)));

  const sunumKonu = tekil(materyal.gunler.flatMap((g) => (g.sunumlar ?? []).map((s) => ({ k: s.konu, fr: s.konuFr ?? '' })))
    .filter((o) => dolu(o.k)));

  const hedef = tekil(defter.filter((d) => dolu(d.goal_tr)).map((d) => ({ k: d.goal_tr, fr: d.goal_fr ?? '' })));

  const hafta = Object.entries(ilerleme.haftalar ?? {}).flatMap(([tarih, h]) =>
    ['odev', 'ezber'].filter((a) => dolu(h?.[a]?.tr)).map((a) => ({
      k: `${tarih}${OZET_AYIRAC}${a}`, tr: h[a].tr, fr: h[a].fr ?? '', h: ozet(h[a].tr),
    })));

  const rozet = tekil([
    ...plan.gunler.flatMap((g) => (g.rozetler ?? []).map((r) => r.metin)),
    ...plan.gunler.flatMap((g) => notParcalari(g.not)),
  ].filter(dolu).map((k) => ({ k, fr: '' })));

  const kaliciOge = kalici.map((e) => ({
    k: e.slug, tr: e.baslik?.tr ?? '', trAciklama: e.aciklama?.tr ?? '', fr: e.baslik?.fr ?? '', frAciklama: e.aciklama?.fr ?? '',
    h: ozet(`${e.baslik?.tr ?? ''}\n${e.aciklama?.tr ?? ''}`),
  }));

  return { konu, baslik, sunumKonu, hedef, hafta, rozet, kalici: kaliciOge };
}

/** Yıllık plan gövdesindeki tekil Türkçe paragraflar (kazanım, özet, etkinlik, ezber) — plan bindirmesinin anahtar kümesi. */
export const PLAN_BLOKLARI = ['kazanim', 'ozet', 'etkinlik', 'ezber'];
export const planParagraflari = (plan) => [...new Set(plan.gunler.flatMap((g) => g.dersler.flatMap((d) => PLAN_BLOKLARI.flatMap((b) => d[b] ?? []))))];

/** src/content/materyaller/*.md ön yazıları (taslaklar hariç) → [{ slug, baslik, aciklama }]; betik ve test için. */
export function kaliciMateryaller(dizin) {
  return readdirSync(dizin).filter((f) => f.endsWith('.md')).map((f) => {
    const on = yamlParse(readFileSync(`${dizin}/${f}`, 'utf8').split('---')[1]);
    return { slug: f.replace(/\.md$/, ''), baslik: on.baslik, aciklama: on.aciklama, taslak: on.taslak === true };
  }).filter((e) => !e.taslak);
}

/** Depodaki gerçek veriden kaynak öğeler (kök: depo kökü). Betik ve test aynı yolu kullanır. */
export function depoKaynaklari(kok) {
  const oku = (ad) => JSON.parse(readFileSync(`${kok}/src/data/${ad}`, 'utf8'));
  return kaynakOgeleri({
    defter: oku('ders-defteri-2026-2027.json'), plan: oku('yillik-plan-2026-2027.json'), ilerleme: oku('ders-ilerleme.json'),
    materyal: oku('ders-materyalleri.json'), konularFr: oku('konular-fr.json'),
    kalici: kaliciMateryaller(`${kok}/src/content/materyaller`),
  });
}

/** Kalıcı materyal bindirmesi için özet (kaynakOgeleri ile aynı girdiden). */
export const kaliciOzeti = (baslikTr, aciklamaTr) => ozet(`${baslikTr ?? ''}\n${aciklamaTr ?? ''}`);

/**
 * Bir dil için çevirici. `bindirme`: kurs-ceviri/<dil>.json; `konular`: konular-<dil>.json (tr dili için null).
 * Dönen işlevlerin hepsi { m, d } verir (d: 'tr' | 'fr' | 'en' | 'nl' | 'de').
 */
export function cevirici(dil, { bindirme = {}, konular = {}, konularFr = {} } = {}) {
  const zincir = dil === 'tr' ? ['tr'] : dil === 'fr' ? ['fr', 'tr'] : [dil, 'fr', 'tr'];
  /** adaylar: { tr, fr, [dil] } → ilk dolu aday; hiçbiri yoksa boş. */
  const sec = (aday) => {
    for (const d of zincir) if (dolu(aday[d])) return { m: aday[d], d };
    return { m: '', d: dil };
  };
  /** tr/fr sayfalarında bindirme yoktur (kaynak zaten o dillerde); en/nl/de'de bindirme kendi dilinin adayıdır. */
  const aday = (tr, fr, ov) => (CEVIRI_DILLERI.includes(dil) ? { tr, fr, [dil]: ov } : { tr, fr });
  const tara = (bolum, k, tr, fr) => sec(aday(tr, fr, bindirme[bolum]?.[k]));
  return {
    dil,
    konu: (k) => sec(aday(k, konularFr[k], konular[k])),
    baslik: (b) => tara('baslik', b?.tr, b?.tr, b?.fr),
    sunumKonu: (s) => tara('sunumKonu', s.konu, s.konu, s.konuFr),
    hedef: (d) => tara('hedef', d.goal_tr, d.goal_tr, d.goal_fr),
    rozet: (metin) => tara('rozet', metin, metin, ''),
    /** Yıllık plan gövdesi: tr dışındaki dillerde bindirme.plan[Türkçe paragraf] kendi dilinin adayıdır (fr dâhil); yoksa Türkçe. */
    govde: (p) => sec(dil === 'tr' ? { tr: p } : { tr: p, [dil]: bindirme.plan?.[p] }),
    /** Hafta notu: yalnız Türkçe metnin özeti bindirmedeki özetle uyuşuyorsa çeviri kullanılır. */
    hafta: (tarih, alan, not) => {
      const o = bindirme.hafta?.[`${tarih}${OZET_AYIRAC}${alan}`];
      const guncel = o && o.h === ozet(not?.tr) ? o.t : undefined;
      return sec(aday(not?.tr, not?.fr, guncel));
    },
    /** Kalıcı materyal: elle girilmiş (CMS) çeviri bindirmeden önce gelir. */
    kalici: (slug, alan, md) => {
      const o = bindirme.kalici?.[slug];
      const guncel = o && o.h === kaliciOzeti(md.baslik?.tr, md.aciklama?.tr) ? o[alan] : undefined;
      const kaynak = md[alan] ?? {};
      return sec(aday(kaynak.tr, kaynak.fr, dil === 'en' && dolu(kaynak.en) ? kaynak.en : guncel));
    },
  };
}
