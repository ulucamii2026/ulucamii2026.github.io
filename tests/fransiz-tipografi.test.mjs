/**
 * Fransız yazım kuralı (27 Eylül 2026, src/lib/fransiz-tipografi.ts + src/middleware.ts). Neden: Fransızca sayfalarda
 * «:», «?», «!», «;» düz boşlukla yazıldığında satır başına tek başına düşüyordu. Dönüşüm yalnız metin düğümlerine
 * uygulanmalı: satır içi betik (üçlü `? :`), CSS (`!important` önündeki boşluk; bölünmez boşluk CSS'te boşluk
 * sayılmaz) ve Preact adacığının metni bozulmamalı. Derlenmiş çıktı varsa Fransızca sayfaların dönüşmüş olduğu,
 * Türkçe sayfaya dokunulmadığı da denetlenir.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';

mkdirSync('node_modules/.cache', { recursive: true });
const outfile = resolve('node_modules/.cache/fransiz-tipografi-test.mjs');
await build({
  entryPoints: ['src/lib/fransiz-tipografi.ts'],
  outfile, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent',
});
const { fransizMetin, fransizTipografiHtml, fransizcaSayfaMi } = await import(pathToFileURL(outfile).href);

const INCE = ' ';
const BOL = ' ';

test('düz metin: ; ! ? önüne ince, : önüne ve « » içine bölünmez boşluk; boşluk yoksa eklenmez', () => {
  assert.equal(fransizMetin('Horaires : Asr ; oui ! non ? « Salam »'),
    `Horaires${BOL}: Asr${INCE}; oui${INCE}! non${INCE}? «${BOL}Salam${BOL}»`);
  for (const s of ['https://ulucamii.be', '10:30', 'Bonjour!', 'Quoi?', 'a;b']) assert.equal(fransizMetin(s), s);
  const bir = fransizMetin('Contact : info ? « oui »');
  assert.equal(fransizMetin(bir), bir);
});

test('HTML: metin düğümleri döner; etiket ve öznitelikler aynen kalır', () => {
  const girdi = '<p class="a b" title="Contact : ici ?"><a href="/fr/?q=x : y">Horaires : Asr ?</a> « Salam »</p>';
  assert.equal(fransizTipografiHtml(girdi),
    `<p class="a b" title="Contact : ici ?"><a href="/fr/?q=x : y">Horaires${BOL}: Asr${INCE}?</a> «${BOL}Salam${BOL}»</p>`);
});

test('HTML: betik, stil, textarea, yorum ve pre/code içi dokunulmaz; ardından gelen metin yine döner', () => {
  const girdi = [
    '<!-- not : yorum ? -->',
    '<script>if (a < b) x = a ? " ?" : "</div> : ";</script>',
    '<script type="application/ld+json">{"description":"Horaires : Asr ?"}</script>',
    '<style>.a{color:red !important} .b :hover{}</style>',
    '<textarea>Votre message : ici ?</textarea>',
    '<pre><code>x : y ? z</code> encore : là</pre>',
    '<p>Fin : oui !</p>',
  ].join('');
  const beklenen = girdi.replace('<p>Fin : oui !</p>', `<p>Fin${BOL}: oui${INCE}!</p>`);
  assert.equal(fransizTipografiHtml(girdi), beklenen);
});

test('HTML: Preact adacığı (iç içe template dahil) aynen kalır; büyük harfli etiket ve «İ» konumu kaydırmaz', () => {
  const ada = '<astro-island uid="1" props="{&quot;t&quot;:[0,&quot;Prochaine prière : Asr&quot;]}">'
    + '<div>Prochaine prière : Asr</div><template data-astro-template>Slot : x ?</template><span>encore ?</span></astro-island>';
  const girdi = `<p>İhtida : oui</p>${ada}<SCRIPT>var s = 1 ? 2 : 3;</SCRIPT><p>İslâm ! Fin ?</p>`;
  assert.equal(fransizTipografiHtml(girdi),
    `<p>İhtida${BOL}: oui</p>${ada}<SCRIPT>var s = 1 ? 2 : 3;</SCRIPT><p>İslâm${INCE}! Fin${INCE}?</p>`);
});

test('HTML: boş öğeler yığına girmez, dönüşüm tekrar uygulanınca değişmez', () => {
  const girdi = '<p>Adresse :<br>Rue ; ville<img alt="Logo : x" src="a.svg"></p><code>a : b</code><p>Suite : c</p>';
  const bir = fransizTipografiHtml(girdi);
  assert.equal(bir, `<p>Adresse${BOL}:<br>Rue${INCE}; ville<img alt="Logo : x" src="a.svg"></p><code>a : b</code><p>Suite${BOL}: c</p>`);
  assert.equal(fransizTipografiHtml(bir), bir);
});

test('sayfa dili: yalnız <html lang="fr…"> Fransızca sayılır', () => {
  assert.equal(fransizcaSayfaMi('<!DOCTYPE html><html lang="fr-BE" data-theme="light">'), true);
  assert.equal(fransizcaSayfaMi('<html class="x" lang=fr>'), true);
  for (const dil of ['tr', 'en', 'nl-BE', 'de-BE']) assert.equal(fransizcaSayfaMi(`<html lang="${dil}">`), false);
  assert.equal(fransizcaSayfaMi('<html lang="tr"><body><p lang="fr">Contact : x</p>'), false);
});

const dist = resolve('dist');
test('derlenmiş çıktı: Fransızca sayfalar dönüşmüş, Türkçe sayfaya dokunulmamış', { skip: !existsSync(resolve(dist, 'fr/index.html')) && 'dist yok (önce npm run build)' }, () => {
  for (const yol of ['fr/index.html', 'fr/ecole-coranique/index.html', 'fr/contact/index.html', 'fr/horaires-de-priere/index.html']) {
    const html = readFileSync(resolve(dist, yol), 'utf8');
    assert.equal(fransizcaSayfaMi(html), true, yol);
    assert.equal(fransizTipografiHtml(html), html, `${yol}: dönüşmemiş metin kaldı`);
  }
  const tr = readFileSync(resolve(dist, 'tr/index.html'), 'utf8');
  assert.equal(fransizcaSayfaMi(tr), false);
  assert.equal(tr.includes(INCE), false, 'Türkçe ana sayfada ince bölünmez boşluk çıktı');
});
