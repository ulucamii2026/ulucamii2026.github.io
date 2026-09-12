import type { Dil } from "./ui";
const s = (tr: string, fr: string, en: string) => ({ tr, fr, en });
const metinler = {
  baslik: s("Haftalık bülten", "Bulletin de classe", "Weekly class bulletin"),
  aciklama: s(
    "Dersin özeti, evde tekrar ve çanta hazırlığı bir arada.",
    "Le cours, les révisions et le matériel à préparer, au même endroit.",
    "Lessons, home practice and what to bring, together.",
  ),
  hafta: s("Hafta", "Semaine", "Week"),
  surum: s("Sürüm", "Version", "Version"),
  ders: s("Bu haftanın dersleri", "Cours de la semaine", "This week’s lessons"),
  odev: s(
    "Evde birlikte tekrar",
    "À revoir en famille",
    "Practise together at home",
  ),
  getir: s("Çantamda bulunsun", "Dans mon cartable", "What to bring"),
  not: s(
    "Hocamızdan aileye",
    "Un mot pour la famille",
    "A note for the family",
  ),
  yok: s(
    "Henüz yayımlanmış bülten yok. Hazır olduğunda burada göreceksiniz.",
    "Aucun bulletin publié pour le moment. Il apparaîtra ici dès qu’il sera prêt.",
    "No bulletin has been published yet. It will appear here when ready.",
  ),
  bos: s(
    "Bu bölüm için ayrıca not eklenmedi.",
    "Aucune note supplémentaire.",
    "No additional note for this section.",
  ),
  yukle: s(
    "Bültenler yükleniyor…",
    "Chargement des bulletins…",
    "Loading bulletins…",
  ),
  hata: s(
    "Bülten alınamadı. Bağlantınızı kontrol edip yeniden deneyin.",
    "Impossible de charger le bulletin. Vérifiez votre connexion et réessayez.",
    "Could not load the bulletin. Check your connection and try again.",
  ),
  yeniden: s("Yeniden yükle", "Recharger", "Reload"),
  yazdir: s(
    "Yazdır / PDF kaydet",
    "Imprimer / enregistrer en PDF",
    "Print / save as PDF",
  ),
  okudum: s("Okudum", "J’ai lu le bulletin", "I have read the bulletin"),
  okundu: s(
    "Bu sürümü okuduğunuz kaydedildi.",
    "Votre lecture de cette version est enregistrée.",
    "Your acknowledgement of this version is saved.",
  ),
  imzaAciklama: s(
    "“Okudum” bildirimi dijital takip içindir. Kâğıt bülteni imzalı getirmeniz istenirse çıktıdaki imza alanını kullanın.",
    "La confirmation de lecture permet le suivi numérique. Si le bulletin papier doit être rendu signé, utilisez l’espace de signature sur la copie imprimée.",
    "The acknowledgement is for digital tracking. If a signed paper copy is requested, use the signature space on the printed copy.",
  ),
  imza: s(
    "Veli adı, tarih ve imza",
    "Nom du parent, date et signature",
    "Parent’s name, date and signature",
  ),
  aileNot: s(
    "Ailenin notu (isteğe bağlı)",
    "Note de la famille (facultative)",
    "Family’s note (optional)",
  ),
  degisti: s(
    "Bülten güncellendi. Yeniden yükleyip son sürümü okuyun.",
    "Le bulletin a changé. Rechargez-le pour lire la dernière version.",
    "The bulletin has changed. Reload and read the latest version.",
  ),
  kayitHata: s(
    "Okuma bildirimi kaydedilemedi. Bağlantınızı kontrol edip yeniden deneyin.",
    "La confirmation n’a pas pu être enregistrée. Vérifiez votre connexion et réessayez.",
    "Could not save your acknowledgement. Check your connection and try again.",
  ),
  kaydediliyor: s("Kaydediliyor…", "Enregistrement…", "Saving…"),
  taslak: s(
    "Taslak · veliye görünmez",
    "Brouillon · non visible aux parents",
    "Draft · not visible to parents",
  ),
  dil: s(
    "Bültenin içerik dili",
    "Langue du bulletin",
    "Bulletin content language",
  ),
  dilAdi: s("Türkçe", "Français", "English"),
};
export const bultenMetni = (dil: Dil) =>
  Object.fromEntries(
    Object.entries(metinler).map(([k, v]) => [k, v[dil]]),
  ) as Record<keyof typeof metinler, string>;
