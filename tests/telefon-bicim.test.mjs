import test from 'node:test';
import assert from 'node:assert/strict';
import { telefonBicimle, telefonRakamlari } from '../src/scripts/telefon-bicim.ts';

test('Belçika cep numarası yazarken «+32 4xx xx xx xx» olur', () => {
  const adimlar = ['0', '04', '047', '0470', '04701', '047012', '0470123', '04701234', '047012345', '0470123456'];
  const beklenen = ['+32', '+32 4', '+32 47', '+32 470', '+32 470 1', '+32 470 12', '+32 470 12 3', '+32 470 12 34', '+32 470 12 34 5', '+32 470 12 34 56'];
  adimlar.forEach((a, i) => assert.equal(telefonBicimle(a), beklenen[i], a));
});

test('Aynı numaranın bütün yazımları tek biçime iner', () => {
  for (const ham of ['+32470123456', '0032470123456', '32470123456', '470123456', '+32 (0)470 12.34.56', '0470/12 34 56', '+32 0470 123456']) {
    assert.equal(telefonBicimle(ham), '+32 470 12 34 56', ham);
  }
});

test('Harf ve işaretler atılır; fazla rakam kırpılır', () => {
  assert.equal(telefonBicimle('04a7b0-12x34y56zz789'), '+32 470 12 34 56');
  assert.equal(telefonRakamlari('+32 470 12 34 56 99'), '32470123456');
});

test('Belçika sabit hatları ve yabancı numaralar', () => {
  assert.equal(telefonBicimle('084311234'), '+32 84 31 12 34');
  assert.equal(telefonBicimle('021234567'), '+32 2 123 45 67');
  assert.equal(telefonBicimle('042123456'), '+32 4 212 34 56');
  assert.equal(telefonBicimle('+33612345678'), '+33 6 12 34 56 78');
  assert.equal(telefonBicimle('+905321234567'), '+90 532 123 45 67');
  assert.equal(telefonBicimle('+352621123456'), '+352 621 123 456');
  assert.equal(telefonBicimle('+12025550123'), '+120 255 501 23');
});

test('Boş ve yalnız artı', () => {
  assert.equal(telefonBicimle(''), '');
  assert.equal(telefonBicimle('  '), '');
  assert.equal(telefonBicimle('+'), '+');
  assert.equal(telefonBicimle('abc'), '');
});

test('Biçimlenen değer form çekirdeğinin kabul ettiği E.164 biçimine iner', () => {
  for (const ham of ['0470123456', '084311234', '+33612345678']) {
    const e164 = '+' + telefonBicimle(ham).replace(/\D/g, '');
    assert.match(e164, /^\+\d{8,15}$/);
  }
});
