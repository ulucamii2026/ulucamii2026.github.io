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
export type Kalip = { etiket: string; metin: string };
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
        { etiket: "İyi kavradı", metin: "Konuyu iyi kavradı." },
        { etiket: "Kısmen kavradı", metin: "Konuyu kısmen kavradı; tekrar gerekiyor." },
        { etiket: "Zorlandı", metin: "Zorlandı; birlikte tekrar ettik." },
        { etiket: "Sorulara doğru cevap", metin: "Sorulan sorulara doğru cevap verdi." },
      ],
    },
    {
      ad: "Katılım",
      kaliplar: [
        { etiket: "Katılımı güzel", metin: "Derse katılımı güzeldi." },
        { etiket: "Dikkatle dinledi", metin: "Dersi dikkatle dinledi." },
        { etiket: "Söz aldı", metin: "Söz alarak derse katıldı." },
        { etiket: "Çekingen", metin: "Çekingendi; cesaretlendirince katıldı." },
        { etiket: "Katılımı düşük", metin: "Katılımı düşüktü; derse daha çok ilgilenmesi gerekiyor." },
        { etiket: "Dikkati dağınık", metin: "Dikkati dağınıktı; toparlanınca iyi çalıştı." },
        { etiket: "Özgüveni yerinde", metin: "Özgüveni yerinde, elhamdülillah." },
        { etiket: "Memnunum", metin: "Memnunum, elhamdülillah." },
      ],
    },
  ];
  if (kuranMi(d))
    calisma.push({
      ad: "Okuma",
      kaliplar: [
        { etiket: "Harfleri tanıdı", metin: "Harfleri tanıdı, seslerini doğru çıkardı." },
        { etiket: "Sesleri karıştırıyor", metin: "Harflerin seslerini karıştırıyor; evde pratik gerekiyor." },
        { etiket: "Benimle tekrar etti", metin: "Okuduğum âyetleri benimle birlikte tekrar etti." },
        { etiket: "Mahreç", metin: "Mahreçlere dikkat etmesi gerekiyor." },
        { etiket: "Akıcı okudu", metin: "Sureyi akıcı okudu." },
        { etiket: "Okuyamadı", metin: "Sureyi okuyamadı; tekrar gerekiyor." },
      ],
    });
  calisma.push({
    ad: "Gün notu",
    kaliplar: [
      { etiket: "Geç geldi", metin: "Geç geldi; dersin başını kaçırdı." },
      { etiket: "Sona doğru yoruldu", metin: "Ders sonuna doğru yoruldu." },
      { etiket: "İlk kez katıldı", metin: "Bugün ilk kez katıldı; uyumu iyi." },
      { etiket: "Rahatsızlandı", metin: "Biraz rahatsızlandı ama ilgisini yitirmedi." },
    ],
  });

  const odev: KalipGrubu[] = [
    {
      ad: "Tekrar",
      kaliplar: [
        { etiket: "Konuyu evde tekrar", metin: "Bugün işlediğimiz konuyu evde birlikte tekrar edin lütfen." },
        { etiket: "Sorun, hatırlasın", metin: konuTekrar(d) },
        { etiket: "Pratik yapın", metin: "Evde birlikte uygulamalı pratik yapın lütfen." },
        { etiket: "Aile yardımı", metin: "Anne-baba olarak yardım edin lütfen." },
        { etiket: "Ödev yok", metin: "Bu ders için ödev yok." },
      ],
    },
  ];
  if (kuranMi(d))
    odev.push({
      ad: "Okuma · ezber",
      kaliplar: [
        { etiket: "Harfleri her gün", metin: "Öğrendiği harfleri evde her gün tekrar etsin." },
        { etiket: "Elifbâ baştan sona", metin: "Elifbâ'yı baştan sona tekrar etsin." },
        { etiket: "Mahreçlere dikkat", metin: "Harflerin mahreçlerine (kalın–ince, peltek) dikkat ederek çalışsın." },
        { etiket: "Sureyi ezberlesin", metin: "Bugün öğrendiği sureyi/duayı evde ezberlesin." },
        { etiket: "Ezberi pekiştirsin", metin: "Ezberini bir sonraki derse kadar pekiştirsin." },
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
