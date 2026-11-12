/** Hoca ekranı — «Ders kitapları» sekmesi arayüz metinleri (src/scripts/hoca-kitaplari.ts). Kitap adları ve sürümleri veri dosyasından gelir, çevrilmez. */
import { sozluk, type Metin } from '../hoca';
import type { Dil } from '../ui';

const tr = {
  'baslik': 'Ders kitapları',
  'giris': 'Camiye Gidiyorum kitaplarını ders hazırlığı için indirebilirsiniz. Büyük dosyalarda indirme biraz zaman alabilir.',
  'bekle': 'Hoca erişimi doğrulanıyor…',
  'hata': 'Kitap indirilemedi. Bağlantınızı ve hoca oturumunuzu kontrol edip yeniden deneyin.',
  'sayfa': { other: '{n} sayfa' },
  'boyut': '{mb} MB',
  'pdfIndir': 'PDF indir',
  'indirAria': '{ad} — {surum} PDF indir',
  'iptalDugme': 'İndirmeyi iptal et',
  'ilerleme': '{ad} indiriliyor… %{p}',
  'hazir': '{ad} hazır. Dosyayı cihazınızın indirilenler bölümünden açabilirsiniz.',
  'iptal': 'İndirme iptal edildi.',
} as const;

export const KITAPLAR = {
  tr,
  fr: {
    'baslik': 'Manuels de cours',
    'giris': 'Vous pouvez télécharger les livres « Camiye Gidiyorum » pour préparer vos cours. Le téléchargement des gros fichiers peut prendre un certain temps.',
    'bekle': 'Vérification de l’accès enseignant…',
    'hata': 'Impossible de télécharger le livre. Vérifiez votre connexion et votre session d’enseignant, puis réessayez.',
    'sayfa': { one: '{n} page', other: '{n} pages' },
    'boyut': '{mb} Mo',
    'pdfIndir': 'Télécharger le PDF',
    'indirAria': '{ad} — {surum}, télécharger le PDF',
    'iptalDugme': 'Annuler le téléchargement',
    'ilerleme': '{ad} : téléchargement en cours… {p} %',
    'hazir': '{ad} est prêt. Vous pouvez ouvrir le fichier depuis le dossier des téléchargements de votre appareil.',
    'iptal': 'Téléchargement annulé.',
  },
  en: {
    'baslik': 'Course books',
    'giris': 'You can download the “Camiye Gidiyorum” books to prepare your lessons. Large files may take a little while to download.',
    'bekle': 'Verifying teacher access…',
    'hata': 'The book could not be downloaded. Check your connection and your teacher session, then try again.',
    'sayfa': { one: '{n} page', other: '{n} pages' },
    'boyut': '{mb} MB',
    'pdfIndir': 'Download PDF',
    'indirAria': '{ad} — {surum}, download PDF',
    'iptalDugme': 'Cancel download',
    'ilerleme': '{ad}: downloading… {p}%',
    'hazir': '{ad} is ready. You can open the file from your device’s downloads folder.',
    'iptal': 'Download cancelled.',
  },
  nl: {
    'baslik': 'Lesboeken',
    'giris': 'U kunt de boeken “Camiye Gidiyorum” downloaden om uw lessen voor te bereiden. Het downloaden van grote bestanden kan even duren.',
    'bekle': 'Toegang als leerkracht wordt gecontroleerd…',
    'hata': 'Het boek kon niet worden gedownload. Controleer uw verbinding en uw sessie als leerkracht en probeer opnieuw.',
    'sayfa': { one: '{n} pagina', other: '{n} pagina’s' },
    'boyut': '{mb} MB',
    'pdfIndir': 'Pdf downloaden',
    'indirAria': '{ad} — {surum}, pdf downloaden',
    'iptalDugme': 'Download annuleren',
    'ilerleme': '{ad}: wordt gedownload… {p}%',
    'hazir': '{ad} is klaar. U kunt het bestand openen in de map met downloads van uw toestel.',
    'iptal': 'Download geannuleerd.',
  },
  de: {
    'baslik': 'Lehrbücher',
    'giris': 'Sie können die Bücher „Camiye Gidiyorum“ zur Unterrichtsvorbereitung herunterladen. Bei großen Dateien kann der Download etwas dauern.',
    'bekle': 'Lehrkraft-Zugang wird überprüft …',
    'hata': 'Das Buch konnte nicht heruntergeladen werden. Prüfen Sie Ihre Verbindung und Ihre Lehrkraft-Sitzung und versuchen Sie es erneut.',
    'sayfa': { one: '{n} Seite', other: '{n} Seiten' },
    'boyut': '{mb} MB',
    'pdfIndir': 'PDF herunterladen',
    'indirAria': '{ad} — {surum}, PDF herunterladen',
    'iptalDugme': 'Download abbrechen',
    'ilerleme': '{ad}: Download läuft … {p} %',
    'hazir': '{ad} ist bereit. Sie können die Datei im Download-Ordner Ihres Geräts öffnen.',
    'iptal': 'Download abgebrochen.',
  },
} satisfies Record<Dil, Record<keyof typeof tr, Metin>>;

export const tK = sozluk(KITAPLAR);
/** /kitap/ paylaşım sayfası (herkese açık, Türkçe) hoca dil tercihinden etkilenmez: her dilde Türkçe okuyan sözlük. */
export const tKTr = sozluk({ tr: KITAPLAR.tr, fr: KITAPLAR.tr, en: KITAPLAR.tr, nl: KITAPLAR.tr, de: KITAPLAR.tr } satisfies Record<Dil, Record<keyof typeof tr, Metin>>);
