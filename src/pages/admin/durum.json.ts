/**
 * /admin/durum.json — yönetim panelinin «site durumu» verisi (derleme anında üretilir).
 *
 * Neden var: panel (public/admin/, derlenmeyen tek HTML) sitenin içerik katmanına ulaşamaz;
 * oysa yöneticinin bir bakışta görmek istediği şeyler tam da oradadır: namaz vakitleri verisi
 * taze mi ve daha kaç gün yetiyor (Diyanet çekimi sessizce durursa bunu ancak buradan görür),
 * şu an hangi bantlar yayında ve ne zaman kendiliğinden kalkacak, hero şeridinde hangi süreli
 * mesajlar dönüyor. Site her gün 03:30 UTC'de yeniden derlendiği için bu dosya günlük tazelenir;
 * panel yalnız okur. Kişisel veri içermez (vefat bandındaki ad zaten sitede yayındadır).
 *
 * Bant koşulları ilgili bileşenlerle birebir aynı tutulur (HacBandi, KayitBandi, VefatBandi,
 * DuyuruSeridi); bir bileşenin koşulu değişirse burası da değişmelidir.
 */
import type { APIRoute } from 'astro';
import { HAC_SON_GUN, HAC_KESIN_SON_GUN, UMRE_SON_GUN } from '../../lib/etkinlik-tarihleri';
import { siteAyarlari, vefatlar } from '../../lib/icerik';
import namaz from '../../data/namaz-vakitleri.json';

const GUN = 86_400_000;
const gunStr = (d: Date) => d.toISOString().slice(0, 10);
/* «Bugün» caminin günüdür: derleme 03:30 UTC'de koşar, UTC tarihi ile Brüksel tarihi gece yarısı-02:00 arası ayrışır. */
const bugunBrussels = (ms: number) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Brussels', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));

export const GET: APIRoute = async () => {
  const simdi = Date.now();
  const bugun = bugunBrussels(simdi);
  const ayar = await siteAyarlari();

  /* Namaz vakitleri: kaynak türü (yalnız «diyanet» kabul edilir), son çekim, kapsamın sonu. */
  const gunler = namaz.gunler as Array<{ tarih: string }>;
  const sonGun = gunler.length ? gunler[gunler.length - 1].tarih : null;
  const kalanGun = sonGun ? Math.floor((new Date(sonGun + 'T00:00:00Z').getTime() - simdi) / GUN) : 0;
  const bugunVar = gunler.some((g) => g.tarih === bugun);

  /* Yayındaki bantlar — her biri kendi bileşenindeki koşulla. */
  const bantlar: Array<{ ad: string; son?: string; not?: string }> = [];
  if (simdi <= HAC_SON_GUN.getTime()) bantlar.push({ ad: 'Hac 2027 ön kayıt bandı', son: gunStr(HAC_SON_GUN) });
  else if (simdi <= HAC_KESIN_SON_GUN.getTime()) bantlar.push({ ad: 'Hac 2027 kesin kayıt evresi (Diyanet Hizmetleri kartı)', son: gunStr(HAC_KESIN_SON_GUN) });
  if (simdi <= UMRE_SON_GUN.getTime()) bantlar.push({ ad: 'Aralık umresi duyurusu', son: gunStr(UMRE_SON_GUN) });
  if (ayar.kursKayitLinki) {
    const dersBasladi = simdi >= new Date('2026-09-05T00:00:00+02:00').getTime();
    bantlar.push({ ad: "Kur'an kursu kayıt bandı", not: dersBasladi ? 'Dersler başladı; İçerik Yönetimi → Site ayarları’ndaki kayıt bağlantısı silinince bant kalkar' : 'Dersler 5 Eylül’de başlıyor' });
  }
  const vefat = (await vefatlar()).find((v) => {
    const cenaze = v.data.cenazeNamazi?.tarih?.getTime();
    return (cenaze && cenaze + GUN > simdi) || v.data.vefat.getTime() + 10 * GUN > simdi;
  });
  if (vefat) {
    const cenaze = vefat.data.cenazeNamazi?.tarih?.getTime();
    const son = new Date(Math.max(cenaze ? cenaze + GUN : 0, vefat.data.vefat.getTime() + 10 * GUN));
    bantlar.push({ ad: `Vefat bandı: ${vefat.data.ad}`, son: gunStr(son) });
  }

  /* Hero şeridi: yalnız süreli (son tarihi olan) mesajlar ilgi çeker — kalıcılar zaten hep orada. */
  const heroMesajlar = ayar.heroMesajlar
    .filter((m) => m.son && (!m.baslangic || simdi >= m.baslangic.getTime()) && simdi < m.son.getTime() + GUN)
    .map((m) => ({ metin: m.metin.tr.length > 90 ? m.metin.tr.slice(0, 87) + '…' : m.metin.tr, son: gunStr(m.son as Date) }));

  const govde = {
    derleme: new Date(simdi).toISOString(),
    namaz: { kaynakTuru: namaz.kaynakTuru, guncelleme: namaz.guncelleme, sonGun, kalanGun, bugunVar },
    bantlar,
    heroMesajlar,
  };
  return new Response(JSON.stringify(govde), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
