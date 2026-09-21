# Flemenkçe (nl) ve Almanca (de) — çeviri ve entegrasyon kılavuzu

Karar: 21 Eylül 2026, kullanıcı — «camimiz bundan sonra Flemenkçe ve Almanca da olsun, iki dil daha ekle»; seviye tespit testi
Avrupa'nın her yerinden doldurulabildiği için formlar ve sesli okuma da beş dilde çalışır. Site dilleri: `tr` (varsayılan), `fr`, `en`, `nl`, `de`.
Tek kaynak `src/i18n/ui.ts → diller`; `Dil` tipi oradan türetilir, bu yüzden eksik kalan her yer `npm run check` hatasıdır.

## For translators (agents) — binding rules

**Source of truth for meaning:** the Turkish text. Use French and English as cross-checks (the French is the most carefully reviewed). Translate
meaning, not words. Never change, reorder or delete the existing `tr` / `fr` / `en` entries, keys, ids, slugs, placeholders (`{ad}`, `${…}`, `%s`),
HTML tags, URLs, e-mail addresses, phone numbers, file paths or code. Add `nl` and `de` right after `en`, same shape, same order.

**Audience and register**
- `nl`: Belgian Dutch (Flanders / Brussels). Polite **u**-form everywhere (u / uw), never «je/jij» — including forms for adults and parents. Use
  Belgian usage where it differs (e.g. «gsm» for mobile phone, «e-mail», «inschrijving», «vzw» for ASBL/dernek, «gemeente», «postcode»).
- `de`: standard German as used in East Belgium and Germany. Polite **Sie**-form everywhere. «E-Mail», «Handy/Mobiltelefon», «Anmeldung»,
  «VoG» (Vereinigung ohne Gewinnerzielungsabsicht) for the Belgian ASBL/dernek, «Gemeinde», «Postleitzahl».
- Warm, plain, welcoming; no bureaucratic or missionary tone. Short sentences on buttons and labels (keep them as short as the French).
- Gender: prefer neutral wording. `de`: avoid gender asterisks; use neutral nouns («Teilnehmende», «Eltern», «Lehrkraft») or pair forms only
  where unavoidable. `nl`: «leerling», «ouder», «deelnemer».

**Names that are never translated:** Ulu Camii, Marche-en-Famenne, Diyanet, Belçika Diyanet Vakfı (first mention may add a gloss:
nl «Belgische Diyanetstichting», de «Belgische Diyanet-Stiftung»), people's names, course book titles, Sveltia/CMS, Payconiq, WhatsApp.

**Religious vocabulary (keep consistent)**

| tr | nl | de |
|---|---|---|
| cami | moskee | Moschee |
| din görevlisi | imam (godsdienstbeambte only in official context) | Imam (Religionsbeauftragter only in official context) |
| Din Hizmetleri Müşavirliği / Ateşeliği | Raad voor Religieuze Zaken (Turkse ambassade) / Attaché voor Religieuze Zaken | Botschaftsrat / Attaché für religiöse Angelegenheiten (türkische Botschaft) |
| namaz vakitleri | gebedstijden | Gebetszeiten |
| sabah / güneş / öğle / ikindi / akşam / yatsı | fajr (ochtendgebed) / zonsopgang / dhuhr (middaggebed) / asr (namiddaggebed) / maghrib (avondgebed) / isha (nachtgebed) | Fadschr (Morgengebet) / Sonnenaufgang / Dhuhr (Mittagsgebet) / Asr (Nachmittagsgebet) / Maghrib (Abendgebet) / Ischa (Nachtgebet) |
| cuma namazı | vrijdaggebed | Freitagsgebet |
| hutbe / vaaz | khutba (vrijdagpreek) / preek | Chutba (Freitagspredigt) / Predigt |
| ezan | adhan (gebedsoproep) | Adhan (Gebetsruf) |
| abdest / gusül | wudu (rituele wassing) / ghusl | Wudu (rituelle Waschung) / Ghusl |
| Kur'an kursu | Koranschool | Koranschule |
| Kur'an-ı Kerim | de Koran (de Edele Koran in formal titles) | der Koran (der edle Koran in formal titles) |
| sûre / âyet | soera / vers (aya) | Sure / Vers (Aya) |
| ihtida / mühtedi | bekering tot de islam, moslim worden / bekeerling (prefer «nieuwe moslim») | Konversion zum Islam, Muslim werden / Konvertit (prefer «neue Muslime») |
| kelime-i şehadet | geloofsgetuigenis (shahada — yaygın yazım; seviye testi bankasında okunuş yazımı «sjahada», ش = sj) | Glaubensbekenntnis (Schahada) |
| Hz. Muhammed (s.a.s.) | de Profeet Mohammed (vrede zij met hem) | der Prophet Muhammad (Friede sei mit ihm) |
| oruç / ramazan / iftar / sahur | vasten / ramadan / iftar / sahur (suhoor) | Fasten / Ramadan / Iftar / Sahur |
| zekât / fitre / sadaka | zakat / zakat al-fitr (fitre) / sadaka | Zakat / Zakat al-Fitr (Fitre) / Sadaka |
| hac / umre / kurban | hadj / umra / offer (kurban) | Hadsch / Umra / Opfer (Kurban) |
| Ramazan Bayramı / Kurban Bayramı | Suikerfeest (Ramazan Bayramı) / Offerfeest (Kurban Bayramı) | Ramadanfest (Ramazan Bayramı) / Opferfest (Kurban Bayramı) |
| kandil | kandil (gezegende nacht) | Kandil (gesegnete Nacht) |
| cenaze hizmetleri | uitvaartdiensten | Bestattungsdienste |
| bağış / üyelik / aidat | gift, doneren / lidmaatschap / lidgeld | Spende, spenden / Mitgliedschaft / Mitgliedsbeitrag |
| dernek / yönetim kurulu | vereniging (vzw) / bestuur | Verein (VoG) / Vorstand |
| veli / öğrenci / hoca | ouder / leerling / leerkracht (imam) | Elternteil, Eltern / Schüler, Schülerin → «Lernende» / Lehrkraft (Imam) |
| ders defteri / yoklama / ödev / mazeret | lesdagboek / aanwezigheid / huiswerk / afwezigheidsmelding | Klassenbuch / Anwesenheit / Hausaufgabe / Entschuldigung |
| Elifbâ / hareke / tecvid | Arabisch alfabet (Elifba) / klinkerteken (haraka) / tadjwied | arabisches Alphabet (Elifba) / Vokalzeichen (Haraka) / Tadschwid |
| seviye tespit testi | niveautest | Einstufungstest |
| künye / gizlilik | wettelijke vermeldingen / privacy | Impressum / Datenschutz |
| açık rıza | uitdrukkelijke toestemming | ausdrückliche Einwilligung |

**Transliteration of Arabic letter names and syllables in answer options** (level test, Elifbâ): each language uses its own spelling habits so
that the option is *read aloud correctly by a speaker of that language*: `nl` — sj for ش (sjien), ch for خ (chaa), dj for ج (djiem), oe for the
ū sound (noen, soera), ie for ī (mien → «miem»), th, dh, gh, q, ', ʿ as in French/English; `de` — sch for ش (Schin), ch for خ (Cha), dsch for ج
(Dschim), u for ū (Nun), i/ie for ī (Mim), th, dh, gh, q. Short vowels: nl a / i / oe; de a / i / u. Keep the SAME distractor logic as the French
and English items — options must stay pairwise distinct after lower-casing and stripping diacritics.

**Typography:** nl quotation marks “…” ; de „…“. Decimal comma in both. Dates are formatted by code (`nl-BE`, `de-BE`); never hard-code a
formatted date. Non-breaking space before units and in phone numbers as in the French text. Curly apostrophe ’.

**Qur'an verse meanings and hadith texts:** never quote a published nl/de translation from memory (risk of misquoting and of copyright).
Translate the meaning faithfully from the site's Turkish text (Diyanet meâl / Diyanet hadith wording), cross-checking the French and English
entries, in plain modern language, without adding or dropping anything; keep the reference (sûre:âyet, hadith source) exactly as it is. Do not
attribute the wording to any translator. List every such entry in your report under «âyet/hadis çevirileri — gözden geçirilecek».

**Legal pages (gizlilik, künye):** translate faithfully and completely; GDPR terms: nl «verwerkingsverantwoordelijke», «rechtsgrond»,
«uitdrukkelijke toestemming (art. 9, lid 2, a AVG)», «Gegevensbeschermingsautoriteit (GBA)»; de «Verantwortlicher», «Rechtsgrundlage»,
«ausdrückliche Einwilligung (Art. 9 Abs. 2 lit. a DSGVO)», «Datenschutzbehörde (belgische DSB / GBA-APD)». Add to the top of each translated legal
page the sentence that the Turkish and French versions prevail in case of doubt (nl: «Bij twijfel gelden de Turkse en de Franse versie.» /
de: «Im Zweifel gelten die türkische und die französische Fassung.»).

**Report back (Turkish):** files touched, number of entries translated per language, every place where you were unsure, and anything you left
untranslated on purpose.

## For engineers (agents) — binding rules for the nl/de integration

- Single source of languages: `src/i18n/ui.ts → diller` (tr, fr, en, nl, de). Use `dilListesi`, `dilMi()`, `yerelKodu` and `hreflangKodu` from
  `src/i18n/utils.ts`; never write `['tr','fr','en']`, `dil === 'fr' || …` chains or a local locale map again. A local `type Dil` is replaced by an
  import (or, where a file must stay dependency-free — `src/lib/seviye-testi/**` is bundled into Apps Script — by the same five-member union).
- **Forbidden pattern:** `dil === 'tr' ? A : dil === 'en' ? B : C` (the last branch silently serves French to nl/de). Replace by a
  `Record<Dil, …>` object with all five languages, indexed `[dil]`. TypeScript then guarantees completeness.
- Content that exists only in Turkish and French (duyurular, etkinlikler, vaazlar, afişler, vefat): nl and de fall back exactly like English does
  today (`icerikDili`: en/nl/de → fr), and the visitor sees the «only available in Turkish and French» note in his own language.
- Do not edit files outside your package; other agents work in the same tree at the same time, so `npm run check` will show THEIR unfinished
  errors — judge your work by the lines that mention your files. `npm run check` is heavy and many agents share this machine: run it AT MOST
  TWICE, only when your edits are complete, redirect the output to a file in your scratch area and grep that file for your paths. Do not run `npm run build`,
  `npm run dogrula*`, Playwright, git commit, git push, or anything that talks to live services (Apps Script, Firebase, e-mail).
- Keep line endings and indentation of every file as they are; use the Edit tool (or small Python/Node scripts WITHOUT backslashes in heredocs —
  this machine's bash heredocs mangle backslashes). Never rewrite a whole large file when an insertion will do.
- Privacy: no personal data, no secrets, the imam's phone number never appears as text; institutional contact is `info@ulucamii.be` and the
  mosque line `+32 472 98 50 73`.


## Yerel doğrulamada tamamlananlar — 21 Eylül 2026

- Veli portalı manifestleri beş dilde bulunur; nl/de başlangıç ve kapsam yolları sırasıyla
  `/nl/ouderportaal/` ve `/de/elternportal/`. Simge ve renkler İngilizce manifestle aynıdır.
- Site denetimi her iki Flemenkçe çeviri notunu tanır; saklanan Fransızca içerik görünür dil uyarısıyla sunulur.
- Seviye formu v2 tarayıcı sözleşmesi iki isteğe bağlı paylaşım onayını işaretsizken açıkça `false` olarak doğrular;
  ders dili seçenekleri beştir, yer bölümü ilk adımda görünür.
- Dar ekran marka düzeltmesi yalnız nl/de için uygulanır. Ortak WhatsApp bağlantısında kişisel ad/kullanıcı adı
  ve telefon görünür metin veya başlık ipucuna taşınmaz; etiket yalnız WhatsApp, telefon yalnız sohbet hedefidir.
- Bu işin tarihli yerel test kanıtı ve 360/768/1280 piksel açık/koyu matrisi `.codex/agy-dil-nl-de/RAPOR.md`
  dosyasındadır. Yerel doğrulama yayın anlamına gelmez; bu oturumda commit/push/yayın yapılmadı.
