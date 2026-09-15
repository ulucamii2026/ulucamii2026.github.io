/**
 * Ders defteri kalıpları — hoca ekranında «dokuna dokuna» defter doldurma (14 Eyl 2026).
 *
 * NEDEN: 12–13 Eylül'ün 23 işlenmiş kaydı incelendi. Hoca her öğrenci için üç tür cümle yazıyor:
 * (1) katılım/tutum («Derse katılımı güzeldi», «Dersi dikkatle dinledi», «Katılımı düşük»),
 * (2) konuya bağlı «…öğrendik» cümlesi (dersin konusu zaten planda yazılı),
 * (3) ödev — çoğu öğrenciye BİREBİR AYNI cümle («Peygamber'in çocukluğunu evde birlikte tartışın» 4 kez,
 *     aynı uzun ödev 5 kez). «Sonraki adım», «okunan», «dikkat» alanları hiç kullanılmamış (0/23).
 * Rıdvan: «hazır kalıplar olsun, hazır butonlara basınca o metin ile defter kolay doldurulabilsin; özel bir durum
 * varsa hoca yine özel durumu yazar.» Bu modül yalnız metin üretir ve birleştirir; DOM ve Firestore bilmez.
 *
 * KURALLAR
 * · Kalıp bir CÜMLE ekler/çıkarır; hocanın yazdığı serbest metne dokunmaz (cümle sınırında eklenir).
 * · Aynı kalıba ikinci dokunuş cümleyi geri alır (aria-pressed ile görünür).
 * · Konuya bağlı kalıplar dersin `konu`/`kaynak`/sonraki dersinden türetilir; öğrenci adı ASLA kalıba girmez.
 * · Hazır kayıt yalnız BOŞ alanları doldurur; dolu alan ezilmez (durum hariç — hazır kaydın anlamı durumdur).
 */
import type { DefterDersi, DersKaydi } from "./ders-defteri";

export type KalipAlani = "calisma" | "odev" | "sonraki" | "okunan" | "dikkat";
/** cumle: boşlukla birleşir, nokta ile biter · madde: virgülle birleşir (kısa etiket alanları) */
export type KalipBicimi = "cumle" | "madde";
export type Kalip = { etiket: string; metin: string; secim?: string; dislar?: string[] };
export type KalipGrubu = { ad: string; kaliplar: Kalip[] };
export type HazirKayit = {
  id: string;
  etiket: string;
  aciklama: string;
  durum: DersKaydi["durum"];
  alanlar: Partial<Record<KalipAlani, string>>;
};

export const ALAN_BICIMI: Record<KalipAlani, KalipBicimi> = {
  calisma: "cumle",
  odev: "cumle",
  sonraki: "cumle",
  okunan: "madde",
  dikkat: "madde",
};

const konuCumlesi = (d: DefterDersi) => `«${d.konu}» konusunu birlikte işledik.`;
const konuTekrar = (d: DefterDersi) =>
  `«${d.konu}» konusunu evde tekrarlayın; kendisine sorun, bakalım hatırlayacak mı?`;
const kuranMi = (d: DefterDersi) => d.kod === "kuran";

/** Dersin türüne göre kalıp grupları. `sonraki` = planda bu dersten sonra gelen ders (varsa). */
export function defterKaliplari(
  d: DefterDersi,
  sonraki?: DefterDersi | null,
): Record<KalipAlani, KalipGrubu[]> {
  const calisma: KalipGrubu[] = [
    {
      ad: "Konu",
      kaliplar: [
        { etiket: "Konuyu işledik", metin: konuCumlesi(d) },
        { secim: "kavrama", etiket: "İyi kavradı", metin: "Konuyu iyi kavradı." },
        { secim: "kavrama", etiket: "Kısmen kavradı", metin: "Konuyu kısmen kavradı; tekrar gerekiyor." },
        { secim: "kavrama", etiket: "Zorlandı", metin: "Zorlandı; birlikte tekrar ettik." },
        { secim: "cevap", etiket: "Sorulara doğru cevap", metin: "Sorulan sorulara doğru cevap verdi." },
        { etiket: "Örnekle açıkladı", metin: "Konuyu kendi örnekleriyle açıkladı." },
        { etiket: "Hatırlatma ile cevap", metin: "Hatırlatma yardımıyla sorulara cevap verdi.", secim: "cevap" },
        { etiket: "Uygulamada destek", metin: "Konuyu uygularken bireysel desteğe ihtiyaç duydu." },
      ],
    },
    {
      ad: "Katılım",
      kaliplar: [
        { secim: "katilim", etiket: "Katılımı güzel", metin: "Derse katılımı güzeldi." },
        { secim: "odak", etiket: "Dikkatle dinledi", metin: "Dersi dikkatle dinledi." },
        { secim: "katilim", etiket: "Söz aldı", metin: "Söz alarak derse katıldı." },
        { secim: "katilim", etiket: "Çekingen", metin: "Çekingendi; cesaretlendirince katıldı." },
        { secim: "katilim", etiket: "Katılımı düşük", metin: "Katılımı düşüktü; derse daha çok ilgilenmesi gerekiyor." },
        { secim: "odak", etiket: "Dikkati dağınık", metin: "Dikkati dağınıktı; toparlanınca iyi çalıştı." },
        { etiket: "Özgüveni yerinde", metin: "Özgüveni yerinde, elhamdülillah." },
        { etiket: "Memnunum", metin: "Memnunum, elhamdülillah." },
        { etiket: "Yönlendirmeyle katıldı", metin: "Yönlendirme ve teşvikle derse katıldı.", secim: "katilim" },
        { etiket: "İstekle katıldı", metin: "Etkinliklere istekle katıldı.", secim: "katilim" },
        { etiket: "Arkadaşlarıyla uyumlu", metin: "Arkadaşlarıyla uyum içinde çalıştı." },
        { etiket: "Sırasını bekledi", metin: "Söz sırasını bekledi ve arkadaşlarını dinledi.", secim: "sira" },
        { etiket: "Sıra hatırlatması", metin: "Söz sırasını beklemesi için hatırlatma yapıldı.", secim: "sira" },
      ],
    },
  ];
  if (kuranMi(d))
    calisma.push({
      ad: "Okuma",
      kaliplar: [
        { secim: "harf", etiket: "Harfleri tanıdı", metin: "Harfleri tanıdı, seslerini doğru çıkardı." },
        { secim: "harf", etiket: "Sesleri karıştırıyor", metin: "Harflerin seslerini karıştırıyor; evde pratik gerekiyor." },
        { etiket: "Benimle tekrar etti", metin: "Okuduğum âyetleri benimle birlikte tekrar etti." },
        { etiket: "Mahreç", metin: "Mahreçlere dikkat etmesi gerekiyor." },
        { secim: "akicilik", etiket: "Akıcı okudu", metin: "Sureyi akıcı okudu." },
        { secim: "akicilik", etiket: "Okuyamadı", metin: "Sureyi okuyamadı; tekrar gerekiyor." },
        { etiket: "Yavaş ve doğru", metin: "Sureyi yavaş fakat doğru okudu.", secim: "akicilik" },
        { etiket: "Yardımla okudu", metin: "Sureyi öğretmen desteğiyle okudu.", secim: "akicilik" },
        { etiket: "Duraksayarak okudu", metin: "Sureyi duraksayarak okudu; akıcılık için tekrar gerekiyor.", secim: "akicilik" },
        { etiket: "Hatasını düzeltti", metin: "Hatırlatma sonrası okuma hatasını düzeltti." },
        { etiket: "Ezberini tamamladı", metin: "Verilen ezberi tamamladı.", secim: "ezber" },
        { etiket: "Ezber kısmen hazır", metin: "Verilen ezberin bir kısmını hazırladı; devamı çalışılacak.", secim: "ezber" },
        { etiket: "Ezber hazır değil", metin: "Verilen ezber henüz hazır değildi; birlikte tekrar ettik.", secim: "ezber" },
      ],
    });
  calisma.push({
    ad: "Gün notu",
    kaliplar: [
      { secim: "gelis", etiket: "Geç geldi", metin: "Geç geldi; dersin başını kaçırdı." },
      { etiket: "Sona doğru yoruldu", metin: "Ders sonuna doğru yoruldu." },
      { secim: "uyum", etiket: "İlk kez katıldı", metin: "Bugün ilk kez katıldı; uyumu iyi." },
      { etiket: "Rahatsızlandı", metin: "Biraz rahatsızlandı ama ilgisini yitirmedi." },
      { etiket: "Zamanında geldi", metin: "Derse zamanında geldi.", secim: "gelis" },
      { etiket: "Malzemeleri hazır", metin: "Ders malzemelerini eksiksiz getirdi.", secim: "malzeme" },
      { etiket: "Malzeme eksik", metin: "Ders malzemeleri eksikti; tamamlaması hatırlatıldı.", secim: "malzeme" },
      { etiket: "Molayla toparlandı", metin: "Kısa bir moladan sonra çalışmaya devam etti." },
      { etiket: "Uyum için destek", metin: "Bugün ilk kez katıldı; uyum sağlaması için destek verildi.", secim: "uyum" },
    ],
  });

  const odev: KalipGrubu[] = [
    {
      ad: "Tekrar",
      kaliplar: [
        { secim: "odev-var", etiket: "Konuyu evde tekrar", metin: "Bugün işlediğimiz konuyu evde birlikte tekrar edin lütfen." },
        { secim: "odev-var", etiket: "Sorun, hatırlasın", metin: konuTekrar(d) },
        { secim: "odev-var", etiket: "Pratik yapın", metin: "Evde birlikte uygulamalı pratik yapın lütfen." },
        { secim: "odev-var", etiket: "Aile yardımı", metin: "Anne-baba olarak yardım edin lütfen." },
        { secim: "odev-yok", dislar: ["odev-var"], etiket: "Ödev yok", metin: "Bu ders için ödev yok." },
      ],
    },
  ];
  if (kuranMi(d))
    odev.push({
      ad: "Okuma · ezber",
      kaliplar: [
        { secim: "odev-var", etiket: "Harfleri her gün", metin: "Öğrendiği harfleri evde her gün tekrar etsin." },
        { secim: "odev-var", etiket: "Elifbâ baştan sona", metin: "Elifbâ'yı baştan sona tekrar etsin." },
        { secim: "odev-var", etiket: "Mahreçlere dikkat", metin: "Harflerin mahreçlerine (kalın–ince, peltek) dikkat ederek çalışsın." },
        { secim: "odev-var", etiket: "Sureyi ezberlesin", metin: "Bugün öğrendiği sureyi/duayı evde ezberlesin." },
        { secim: "odev-var", etiket: "Ezberi pekiştirsin", metin: "Ezberini bir sonraki derse kadar pekiştirsin." },
      ],
    });
  odev.push({
    ad: "Kaynak",
    kaliplar: [{ etiket: `Kaynak: ${d.kaynak}`, metin: `Kaynak: ${d.kaynak}.` }],
  });

  const sonrakiGrubu: KalipGrubu[] = [
    {
      ad: "Sonraki adım",
      kaliplar: [
        ...(sonraki ? [{ etiket: "Sıradaki konu", metin: `Sıradaki konu: «${sonraki.konu}».` }] : []),
        { etiket: "Tekrar edeceğiz", metin: "Bu konuyu bir daha tekrar edeceğiz." },
        { etiket: "Bireysel okuma", metin: "Bireysel okuma yapacağız." },
        { etiket: "Veliyle görüşme", metin: "Veliyle görüşülecek." },
      ],
    },
  ];
  const okunan: KalipGrubu[] = kuranMi(d)
    ? [
        {
          ad: "Okunan",
          kaliplar: ["Elifbâ harfleri", "Fâtiha sûresi", "Kısa sûreler", "Dualar", "Tekbir"].map((x) => ({ etiket: x, metin: x })),
        },
      ]
    : [];
  const dikkat: KalipGrubu[] = kuranMi(d)
    ? [
        {
          ad: "Dikkat",
          kaliplar: ["Kalın–ince harfler", "Peltek harfler", "Mahreç", "Harekeler", "Uzatmalar (med)"].map((x) => ({ etiket: x, metin: x })),
        },
      ]
    : [];
  return { calisma, odev, sonraki: sonrakiGrubu, okunan, dikkat };
}

/** Tek dokunuşla tam kayıt. Metin alanları yalnız boşsa doldurulur (bkz. hazirKaydiUygula). */
export function hazirKayitlar(d: DefterDersi, sonraki?: DefterDersi | null): HazirKayit[] {
  return [
    {
      id: "islendi-iyi",
      etiket: "İşlendi · katılım iyi",
      aciklama: "Durum «İşlendi»; konu cümlesi, katılım notu ve evde tekrar ödevi.",
      durum: "islendi",
      alanlar: {
        calisma: `${konuCumlesi(d)} Derse katılımı güzeldi.`,
        odev: "Bugün işlediğimiz konuyu evde birlikte tekrar edin lütfen.",
      },
    },
    {
      id: "islendi-tekrar",
      etiket: "İşlendi · tekrar gerek",
      aciklama: "Durum «İşlendi»; konu kısmen kavrandı, evde sorulacak.",
      durum: "islendi",
      alanlar: {
        calisma: `${konuCumlesi(d)} Konuyu kısmen kavradı; tekrar gerekiyor.`,
        odev: konuTekrar(d),
      },
    },
    {
      id: "kismen",
      etiket: "Kısmen işlendi",
      aciklama: "Durum «Kısmen»; konuya başlandı, sonraki derste devam.",
      durum: "kismen",
      alanlar: {
        calisma: `«${d.konu}» konusuna başladık; devam edeceğiz.`,
        sonraki: `«${d.konu}» konusuna devam.`,
      },
    },
    {
      id: "ertelendi",
      etiket: "Ertelendi",
      aciklama: sonraki ? `Durum «Ertelendi»; konu «${sonraki.konu}» dersine kalır.` : "Durum «Ertelendi».",
      durum: "ertelendi",
      alanlar: {
        calisma: `«${d.konu}» konusu bugün işlenemedi; sonraki derse ertelendi.`,
      },
    },
  ];
}

/* ───────────────────────────── metin işlemleri (saf) ───────────────────────────── */
const temizle = (s: string) => s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/ {2,}/g, " ").trim();

/** Kalıp metinde var mı? (cümle sınırında, büyük-küçük harf duyarlı) */
export function kalipVar(metin: string, kalip: string): boolean {
  const m = metin || "";
  if (!kalip.trim()) return false;
  return m.includes(kalip.trim());
}

/** Kalıbı metnin sonuna ekler. cumle: önceki metin noktalama ile bitmiyorsa nokta konur. */
export function kalipEkle(metin: string, kalip: string, bicim: KalipBicimi = "cumle"): string {
  const m = (metin || "").trimEnd();
  const k = kalip.trim();
  if (!k) return metin;
  if (kalipVar(m, k)) return m;
  if (!m) return k;
  if (bicim === "madde") return temizle(`${m.replace(/[,;]\s*$/, "")}, ${k}`);
  const ayrac = /[.!?…:;]$/.test(m) ? " " : m.endsWith("\n") ? "" : ". ";
  return temizle(`${m}${ayrac}${k}`);
}

/** Kalıbı metinden çıkarır; hocanın kendi cümleleri olduğu gibi kalır. */
export function kalipCikar(metin: string, kalip: string, bicim: KalipBicimi = "cumle"): string {
  const m = metin || "";
  const k = kalip.trim();
  if (!k || !m.includes(k)) return m;
  const cik = m.split(k).join(bicim === "madde" ? "" : " ");
  return temizle(
    bicim === "madde"
      ? cik.replace(/,\s*,/g, ",").replace(/^\s*,\s*/, "").replace(/,\s*$/, "")
      : cik.replace(/\s+([.,;:!?])/g, "$1").replace(/^[ .]+/, ""),
  );
}

/** Dokunuş: varsa çıkarır, yoksa ekler. */
export function kalipDegistir(metin: string, kalip: string, bicim: KalipBicimi = "cumle"): string {
  return kalipVar(metin, kalip) ? kalipCikar(metin, kalip, bicim) : kalipEkle(metin, kalip, bicim);
}

/** Aynı değerlendirmede son seçim geçerlidir; bağımsız gözlemler birlikte kalır. */
export function mantikliKalipSec(metin: string, secilen: Kalip, kaliplar: Kalip[], bicim: KalipBicimi = "cumle") {
  if (kalipVar(metin, secilen.metin)) return { metin: kalipCikar(metin, secilen.metin, bicim), kaldirilan: [] as string[] };
  const kaldirilan: string[] = [];
  for (const k of kaliplar) {
    const celisir = k.secim && ((k.secim === secilen.secim && k.secim !== "odev-var") || secilen.dislar?.includes(k.secim))
      || secilen.secim && k.dislar?.includes(secilen.secim);
    if (celisir && kalipVar(metin, k.metin)) {
      metin = kalipCikar(metin, k.metin, bicim);
      kaldirilan.push(k.etiket);
    }
  }
  return { metin: kalipEkle(metin, secilen.metin, bicim), kaldirilan };
}

/**
 * Hazır kaydı taslağa uygular. Durum daima yazılır; metin alanları yalnız BOŞSA doldurulur.
 * Dönüş: yeni taslak + dolu olduğu için atlanan alanlar.
 */
export function hazirKaydiUygula<T extends Partial<Record<KalipAlani, string>> & { durum: string }>(
  taslak: T,
  hazir: HazirKayit,
): { taslak: T; atlanan: KalipAlani[] } {
  const yeni = { ...taslak, durum: hazir.durum } as T;
  const atlanan: KalipAlani[] = [];
  for (const [alan, metin] of Object.entries(hazir.alanlar) as [KalipAlani, string][]) {
    if ((yeni[alan] || "").trim()) atlanan.push(alan);
    else (yeni as Record<string, unknown>)[alan] = metin;
  }
  return { taslak: yeni, atlanan };
}

/**
 * Kullanım sayacına göre sıralama: çok kullanılan kalıp grubun başına gelir; eşitlikte tanım sırası korunur.
 * Sayaç cihazda (localStorage) tutulur, sunucuya yazılmaz.
 */
export function sayacaGoreSirala(kaliplar: Kalip[], sayac: Record<string, number>): Kalip[] {
  return kaliplar
    .map((k, i) => ({ k, i, n: sayac[k.metin] || 0 }))
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .map((x) => x.k);
}
