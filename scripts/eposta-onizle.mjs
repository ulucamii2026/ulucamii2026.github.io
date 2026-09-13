/** Kurum × dil × düz/zengin: on iki yerel HTML. Gönderim veya ağ isteği yapmaz. */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { kimlikKaynakOku } from './kimlik-uret.mjs';
import { epostaRender } from './veli-eposta-render.mjs';

const { kimlik } = await kimlikKaynakOku();
const klasor = 'D:/tmp/eposta-onizleme';
const metinler = {
  tr: {
    onay: 'Kayıt onayı — UC-2099-0001', davet: 'Veli portalı: giriş bağlantınız',
    metin: '**Deniz TESTOGLU** adına oluşturulan örnek kayıt alınmıştır. Referansınız: UC-2099-0001.\n\nBilgilerinizi aşağıdaki bağlantıdan kontrol edebilirsiniz.',
    giris: 'Deniz TESTOGLU için hazırlanan örnek portal daveti aşağıdadır. Ders bilgilerini ve duyuruları portalda bulabilirsiniz.',
    adimlar: 'İlk girişte', dugme: 'Veli portalını aç', gorsel: 'Kurum amblemi — önizleme yer tutucusu',
    liste: [{baslik:'Giriş bağlantısını açın', not:'Kayıt e-postanızı kullanın: veli@example.test.'}, {baslik:'Bilgilerinizi kontrol edin', not:'Ders ve kitap bilgilerini birlikte gözden geçirin.'}],
    maddeler: ['Duyuruları okuyun.', 'İletişim dilinizi kontrol edin.'], not: 'Bu belge yalnız yerel önizlemedir. E-posta gönderilmemiştir.'
  },
  fr: {
    onay: 'Confirmation d’inscription — UC-2099-0001', davet: 'Portail des parents : votre lien de connexion',
    metin: 'L’inscription d’exemple de **Deniz TESTOGLU** a été reçue. Votre référence : UC-2099-0001.\n\nVous pouvez vérifier vos informations à l’aide du lien ci-dessous.',
    giris: 'Voici l’invitation d’exemple au portail pour Deniz TESTOGLU. Vous y trouverez les informations sur les cours et les annonces.',
    adimlar: 'Lors de votre première connexion', dugme: 'Ouvrir le portail des parents', gorsel: 'Emblème de l’institution — illustration d’aperçu',
    liste: [{baslik:'Ouvrez le lien de connexion', not:'Utilisez votre adresse d’inscription : veli@example.test.'}, {baslik:'Vérifiez vos informations', not:'Consultez ensemble les informations sur les cours et les livres.'}],
    maddeler: ['Lisez les annonces.', 'Vérifiez votre langue de communication.'], not: 'Ce document est un aperçu local. Aucun e-mail n’a été envoyé.'
  },
  en: {
    onay: 'Registration confirmation — UC-2099-0001', davet: 'Parents’ portal: your sign-in link',
    metin: 'The sample registration for **Deniz TESTOGLU** has been received. Your reference: UC-2099-0001.\n\nYou can check your details using the link below.',
    giris: 'Here is the sample portal invitation for Deniz TESTOGLU. The portal contains course information and announcements.',
    adimlar: 'When you first sign in', dugme: 'Open the parents’ portal', gorsel: 'Institution emblem — preview placeholder',
    liste: [{baslik:'Open the sign-in link', not:'Use your registration address: veli@example.test.'}, {baslik:'Check your details', not:'Review the course and book information together.'}],
    maddeler: ['Read the announcements.', 'Check your communication language.'], not: 'This document is a local preview. No e-mail has been sent.'
  }
};
await mkdir(klasor, { recursive: true });
for (const kurum of ['kurs', 'cami']) for (const dil of kimlik.diller) {
  const m = metinler[dil], k = kimlik.kurumlar[kurum], url = kimlik.iletisim.veliPortali[dil];
  const hitap = kimlik.yazisma.hitap[dil][kurum === 'kurs' ? 'veliGenel' : 'topluluk'];
  const kapanis = kimlik.yazisma.kapanis[dil].genel;
  const ornekler = {
    duz: {metin: hitap + '\n\n' + m.metin + '\n\n' + url + '\n\n' + kapanis, baslik:m.onay},
    zengin: {baslik:m.davet, bloklar:[
      {tur:'paragraf', metin:hitap}, {tur:'paragraf', metin:m.giris},
      {tur:'dugme', metin:m.dugme, url},
      {tur:'gorsel', src:k.logo.web, alt:m.gorsel + ' 1'}, {tur:'gorsel', src:k.logo.web, alt:m.gorsel + ' 2'},
      {tur:'baslik', metin:m.adimlar}, {tur:'liste', ogeler:m.liste}, {tur:'madde', ogeler:m.maddeler},
      {tur:'cizgi'}, {tur:'not', metin:m.not}, {tur:'paragraf', metin:kapanis}
    ]}
  };
  for (const [tur, data] of Object.entries(ornekler)) {
    const yol = join(klasor, kurum + '-' + dil + '-' + tur + '.html');
    await writeFile(yol, epostaRender({...data, dil, kurum, onIzleme:m.not}), 'utf8');
    console.log(yol);
  }
}
