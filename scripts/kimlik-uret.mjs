/** Tek kurumsal kaynaktan yerel kopya, GAS sabitleri ve yapıştırılabilir imzalar. Ağ kullanmaz. */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const ilkKaynak = 'D:/vektorel-calismalar/ulu-camii-kurumsal-kimlik/05-yazisma/kimlik.json';
export const kopyaYolu = join(root, 'src/data/kurumsal-kimlik.json');
export const sabitYolu = join(root, 'scripts/apps-script/kimlik-sabitler.gs');
export const sha256 = veri => createHash('sha256').update(veri).digest('hex');
const json = veri => JSON.stringify(veri, null, 2) + '\n';
const e = veri => String(veri).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export async function kimlikKaynakOku() {
  // İlk üretimin tek başlangıç yolu; sonraki üretimler anaKaynak alanını izler.
  let yol = ilkKaynak;
  try { yol = JSON.parse(await readFile(kopyaYolu, 'utf8')).anaKaynak; }
  catch (hata) { if (hata.code !== 'ENOENT') throw hata; }
  const ham = await readFile(yol);
  const kimlik = JSON.parse(ham.toString('utf8'));
  if (resolve(kimlik.anaKaynak) !== resolve(yol)) throw new Error('kimlik-ana-kaynak-uyusmazligi');
  return { kimlik, kaynakSha256: sha256(ham) };
}

export function kimlikDosyalari(kimlik, kaynakSha256) {
  const veri = json(kimlik);
  return new Map([
    [kopyaYolu, veri],
    [sabitYolu, '/* ÜRETİLDİ — elle düzenleme; kaynak: ' + kimlik.anaKaynak + '; sürüm: ' + kimlik.surum + '; sha256: ' + kaynakSha256 + ' */\nvar KIMLIK = ' + veri.trimEnd() + ';\n'],
  ]);
}

export function imzaHtml(kimlik, kurum, dil) {
  const k = kimlik.kurumlar[kurum], renk = kimlik.gorunum.ortakRenk;
  const satirlar = kimlik.yazisma.imza[kurum][dil];
  const yazi = 'font-family:' + e(kimlik.gorunum.yaziTipi.epostaYigin) + ';font-size:13px;line-height:1.5;color:' + renk.metin + ';';
  return '<!doctype html>\n<html lang="' + dil + '"><head><meta charset="UTF-8"><title>' + e(k.ad[dil]) + '</title></head>' +
    '<body style="margin:0;background:' + renk.kagit + '"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:' + renk.kagit + '"><tr>' +
    '<td valign="top" style="padding:6px 12px 6px 6px"><img src="' + e(k.logo.web) + '" width="48" height="48" alt="' + e(k.ad[dil]) + '" style="display:block;border:0;width:48px;height:48px;object-fit:contain"></td>' +
    '<td style="' + yazi + 'padding:6px 0">' + satirlar.map((satir, i) => '<div style="' + yazi + (i === 0 ? 'font-weight:bold;color:' + k.renk.ana + ';' : '') + '">' + e(satir) + '</div>').join('') +
    '</td></tr></table></body></html>\n';
}

export async function kimlikDenetle(oku = readFile) {
  const kaynak = await kimlikKaynakOku();
  const hatalar = [];
  for (const [yol, beklenen] of kimlikDosyalari(kaynak.kimlik, kaynak.kaynakSha256)) {
    try { if (sha256(await oku(yol)) !== sha256(beklenen)) hatalar.push(yol); }
    catch (hata) { if (hata.code !== 'ENOENT') throw hata; hatalar.push(yol); }
  }
  return { ...kaynak, hatalar };
}

export async function kimlikUret() {
  const { kimlik, kaynakSha256 } = await kimlikKaynakOku();
  const dosyalar = kimlikDosyalari(kimlik, kaynakSha256);
  const imzaKlasoru = join(dirname(kimlik.anaKaynak), 'imza');
  const adlar = [];
  for (const kurum of ['kurs', 'cami']) for (const dil of kimlik.diller) {
    const ad = 'imza-' + kurum + '-' + dil;
    adlar.push(ad);
    dosyalar.set(join(imzaKlasoru, ad + '.html'), imzaHtml(kimlik, kurum, dil));
    dosyalar.set(join(imzaKlasoru, ad + '.txt'), kimlik.yazisma.imza[kurum][dil].join('\n') + '\n');
  }
  dosyalar.set(join(imzaKlasoru, 'OKUBENI.md'), `# Kurumsal e-posta imzaları

Üretildi: ${kimlik.surum}. Tek kaynak: [kimlik.json](../kimlik.json); kurallar: [YAZISMA-KILAVUZU.md](../YAZISMA-KILAVUZU.md).
İmzaları elle değiştirmeyin; ana kaynak güncellendikten sonra site deposunda \`npm run kimlik:uret\` çalıştırın.

${adlar.length} imza takımı (her biri HTML + düz metin):

${adlar.map(ad => '- [' + ad + '.html](' + ad + '.html) · [' + ad + '.txt](' + ad + '.txt)').join('\n')}

HTML dosyasını tarayıcıda açıp görünen imza tablosunu seçin ve kopyalayın. Kaynak kodunu düz metin alanına yapıştırmayın.
Alıcı veli/öğrenci ise kurs, diğer yazışmalarda cami kimliğini ve iletinin dilini seçin. İmza kurum adıyla başlar.

1. **Purelymail web postası:** Ayarlar → Kimlikler → ilgili gönderen kimliği → İmza. HTML imza düzenleyicisini açın; görünen tabloyu yapıştırıp kaydedin. Düzenleyici kaynak kodu istiyorsa HTML içindeki tabloyu kaynak görünümüne koyun.
2. **Gmail:** Ayarlar → Tüm ayarları görüntüle → Genel → İmza → Yeni oluştur. Tabloyu yapıştırın, yeni iletiler/yanıtlar için uygun imzayı seçin ve değişiklikleri kaydedin.
3. **Outlook:** Ayarlar içindeki İmzalar bölümünü açın (yeni Outlook/web: Hesaplar → İmzalar; klasik Outlook: Dosya → Seçenekler → Posta → İmzalar). Yeni bir imza oluşturup tabloyu yapıştırın; hesap ve yeni ileti/yanıt varsayılanlarını seçip kaydedin.

Düz metin düzenleyicide aynı adlı TXT dosyasını kullanın. HTML imzasını yeni bir ileti taslağında kontrol edin; logo, iki telefon etiketi ve satır sırası görünmelidir. Logo uzak HTTPS kaynağıdır; istemci görselleri engellerse kurum adı metin olarak kalır. Bu üretici hesap ayarı değiştirmez ve e-posta göndermez.

Kimliğin gönderen adı ilgili kurumun \`gonderenAdi\` alanı, adresi ${kimlik.iletisim.eposta.genel}, varsayılan yanıt adresi ${kimlik.iletisim.eposta.yanit} olmalıdır. SMTP yazışmalarında gizli kopya (Bcc) ${kimlik.iletisim.eposta.kayitKopyasi} olarak ayarlanır; cuma bülteni yanıtı ${kimlik.iletisim.eposta.dinGorevlisi} olabilir. İmzayı yapıştırmak bu hesap alanlarını kendiliğinden ayarlamaz.

Başvuru (13 Eylül 2026): [Purelymail/Roundcube](https://mailserver.purelymail.com/docs/features), [Roundcube kimlik/imza](https://docs.roundcube.net/doc/help/1.1/en_US/settings/identities.html), [Gmail imza](https://support.google.com/mail/answer/8395), [Outlook imza](https://support.microsoft.com/en-us/outlook/mail/how-to-add-and-change-an-email-signature-in-outlook).
`);
  for (const [yol, veri] of dosyalar) {
    await mkdir(dirname(yol), { recursive: true });
    await writeFile(yol, veri, 'utf8');
  }
  return { dosyalar: [...dosyalar.keys()], kaynakSha256 };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.slice(2).some(x => x !== '--denetle')) throw new Error('Yalnız --denetle seçeneği desteklenir.');
    if (process.argv.includes('--denetle')) {
      const { hatalar } = await kimlikDenetle();
      if (hatalar.length) { console.error('Ana kaynakla eşleşmeyen dosyalar:\n' + hatalar.join('\n')); process.exitCode = 1; }
      else console.log('Kimlik kopyası ve GAS sabitleri ana kaynakla eş (SHA-256).');
    } else { const r = await kimlikUret(); console.log(r.dosyalar.length + ' dosya üretildi; kaynak SHA-256: ' + r.kaynakSha256); }
  } catch (hata) { console.error('Kimlik üretimi/denetimi başarısız: ' + hata.message); process.exitCode = 1; }
}
