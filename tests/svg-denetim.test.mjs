/**
 * SVG denetimi (26 Eyl 2026, Ezber Kilimi Faz 0) — Codex çizimleri satır içi gömülmeden önceki kapı.
 * Rıdvan: «vektör kullanmanın mümkün olduğu hiçbir yerde pixel kullanma» + çizimde yazı/Arapça yok.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { dosyaKokuOf, svgIyilestir, svgSorunlari } from '../scripts/svg-denetim.mjs';

const TEMIZ = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180"><title>Rahle</title>'
  + '<path d="M10 170 L120 20 L230 170" fill="none" stroke="currentColor" stroke-width="3"/></svg>';
const sar = (govde, kok = 'viewBox="0 0 240 180"') => `<svg xmlns="http://www.w3.org/2000/svg" ${kok}>${govde}</svg>`;
const icerir = (sorunlar, parca) => sorunlar.some((s) => s.includes(parca));

test('temiz çizim: sorun yok', () => {
  assert.deepEqual(svgSorunlari(TEMIZ), []);
});

test('bozuk XML yakalanır', () => {
  assert.ok(icerir(svgSorunlari('<svg viewBox="0 0 1 1"><path></svg>'), 'XML ayrıştırılamadı'));
});

test('kök viewBox zorunlu, width/height yasak', () => {
  assert.ok(icerir(svgSorunlari(sar('<path d="M0 0"/>', '')), 'viewBox taşımıyor'));
  assert.ok(icerir(svgSorunlari(sar('<path d="M0 0"/>', 'viewBox="0 0 1 1" width="45mm"')), 'width/height'));
});

test('yasak öğeler: script, style, image, text, foreignObject, animate', () => {
  for (const [govde, oge] of [
    ['<script>alert(1)</script>', 'script'],
    ['<style>body{display:none}</style>', 'style'],
    ['<image href="#a"/>', 'image'],
    ['<text x="1" y="1">بسم</text>', 'text'],
    ['<foreignObject/>', 'foreignObject'],
    ['<path d="M0 0"><animate attributeName="d"/></path>', 'animate'],
  ]) {
    assert.ok(icerir(svgSorunlari(sar(govde)), `<${oge}>`), oge);
  }
});

test('olay özniteliği, dış href, data:, javascript:, dış url() yasak', () => {
  assert.ok(icerir(svgSorunlari(sar('<path onclick="x()" d="M0 0"/>')), 'on*'));
  assert.ok(icerir(svgSorunlari(sar('<use href="https://ornek.test/a.svg#b"/>')), 'dış bağlantı'));
  assert.ok(icerir(svgSorunlari(sar('<use href="data:image/png;base64,AAAA"/>')), 'data:'));
  assert.ok(icerir(svgSorunlari(sar('<a href="javascript:x()"><path d="M0 0"/></a>')), 'javascript:'));
  assert.ok(icerir(svgSorunlari(sar('<path fill="url(https://ornek.test/x)" d="M0 0"/>')), 'url('));
});

test('iç bağlantı (#) ve önekli kimlik serbest', () => {
  const svg = sar('<defs><linearGradient id="rahle__a"/></defs><path fill="url(#rahle__a)" d="M0 0"/><use href="#rahle__a"/>');
  assert.deepEqual(svgSorunlari(svg, { dosyaKoku: 'rahle' }), []);
});

test('öneksiz kimlik yakalanır', () => {
  assert.ok(icerir(svgSorunlari(sar('<defs><linearGradient id="a"/></defs>'), { dosyaKoku: 'rahle' }), 'öneki olmayan kimlik'));
});

test('boyut sınırı', () => {
  assert.ok(icerir(svgSorunlari(TEMIZ, { sinir: 50 }), 'boyut'));
});

test('dosyaKokuOf: Türkçe ve boşluklu adları güvenli öneke çevirir', () => {
  assert.equal(dosyaKokuOf('C:/cizim/Ş-Fâtiha Motif.svg'), 's-fatiha-motif');
  assert.equal(dosyaKokuOf('ıhlas.SVG'), 'ihlas');
});

test('svgIyilestir: öneki ekler, bağlantıları günceller, viewBox ve title korur, boyutu atar', () => {
  const ham = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" width="240" height="180">'
    + '<title>Seccade</title><defs><linearGradient id="g"><stop offset="0" stop-color="#fff27a"/></linearGradient></defs>'
    + '<rect x="10" y="10" width="100" height="50" fill="url(#g)"/>'
    + '<path d="M 10 10 L 20 20" stroke="currentColor"/></svg>';
  const iyi = svgIyilestir(ham, 'seccade');
  assert.match(iyi, /viewBox="0 0 240 180"/);
  assert.match(iyi, /<title>Seccade<\/title>/);
  assert.doesNotMatch(iyi, /<svg[^>]*\s(width|height)=/);
  assert.match(iyi, /id="seccade__/);
  assert.match(iyi, /url\(#seccade__/);
  assert.deepEqual(svgSorunlari(iyi, { dosyaKoku: 'seccade' }), []);
});
