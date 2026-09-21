# Seviye tespit testi — rıza metni arşivi

Katılımcının onayladığı metin, kayıtla birlikte saklanan `rizaSurumu` damgasıyla buradan bulunur. Metin değişince
`src/i18n/seviye-testi.ts → RIZA_SURUMU` yeni tarihle damgalanır ve **eski sürüm silinmeden** yeni sürüm bu dosyanın
başına eklenir. Yürürlükteki metnin tek kaynağı `src/i18n/seviye-testi.ts`'dir; burası yalnız arşivdir.

## Sürüm 2026-09-21

Değişiklik (form sürümü 2, Apps Script v39): teste Avrupa'nın her yerinden katılınabildiği için başvuranın ülkesi/şehri soruluyor ve
**iki ayrı, isteğe bağlı, işaretsiz gelen** paylaşım onayı eklendi (en yakın Diyanet camisinin din görevlisi · ülkedeki Din Hizmetleri
Müşavirliği / Ataşeliği). Zorunlu iki kutu (yaş, rıza) aynı kaldı; bilgilendirmenin 2. maddesi «kendiniz işaretlemedikçe üçüncü kişiyle
paylaşılmaz» biçiminde güncellendi. Metinler ilk kez beş dilde (TR/FR/EN/NL/DE). Tek kaynak: `src/i18n/seviye-testi.ts` + `src/i18n/seviye-yerel.ts`.

### Türkçe
- **Yaş:** «18 yaşından büyüğüm.»
- **Rıza:** «Dinî inancıma ve dinî bilgi düzeyime ilişkin yanıtlarımın, bana özel eğitim planlanması amacıyla Ulu Camii derneği tarafından işlenmesine ve din görevlisine iletilmesine açıkça rıza veriyorum.»
- **Bilgilendirme:**
  1. Veri sorumlusu: Association Diyanet Mosquée Ulu Camii de Marche en Famenne ASBL (BCE 0421.900.807).
  2. Yanıtlarınız özel nitelikli veridir; yalnız açık rızanızla işlenir (GDPR md. 9/2-a). Ayrıntılı sonucu yalnız din görevlimiz görür; aşağıdaki isteğe bağlı iki paylaşım kutusundan birini kendiniz işaretlemedikçe hiçbir üçüncü kişiyle paylaşılmaz.
  3. Kayıt derneğin Google hesabındaki herkese kapalı bir defterde en fazla 24 ay saklanır ve süre sonunda kendiliğinden silinir. E-postalar Brevo (Fransa) üzerinden gönderilir.
  4. Rızanızı dilediğiniz an geri alabilir, verilerinizin silinmesini isteyebilirsiniz: imam@ulucamii.be
- **Yerel destek için paylaşım (isteğe bağlı):** Bu iki kutu isteğe bağlıdır; işaretlemeden de testi gönderebilirsiniz. İşaretlemezseniz bilgileriniz ve sonucunuz yalnız din görevlimizde kalır.
  - ☐ «Adımın, iletişim bilgilerimin ve test sonucumun, eğitimimin bana en yakın yerde planlanabilmesi için bana en yakın Diyanet camisinin din görevlisiyle paylaşılmasına ve o görevlinin benimle iletişim kurmasına açıkça rıza veriyorum.»
  - ☐ «Adımın, iletişim bilgilerimin ve test sonucumun, yaşadığım ülkedeki Din Hizmetleri Müşavirliği / Ataşeliği ile, yerel eğitim imkânlarının düzenlenebilmesi amacıyla paylaşılmasına açıkça rıza veriyorum.»
  - Bu rızaları dilediğiniz an geri alabilirsiniz: imam@ulucamii.be

### Français
- **18+:** «J’ai plus de 18 ans.»
- **Consent:** «Je consens expressément à ce que mes réponses, qui concernent mes convictions religieuses et mon niveau de connaissances religieuses, soient traitées par l’association Ulu Camii et transmises à l’imam afin de préparer une formation qui me soit adaptée.»
- **Information:**
  1. Responsable du traitement : Association Diyanet Mosquée Ulu Camii de Marche en Famenne ASBL (BCE 0421.900.807).
  2. Vos réponses sont des données sensibles ; elles ne sont traitées qu’avec votre consentement explicite (RGPD, art. 9.2.a). Seul notre imam voit le résultat détaillé ; rien n’est communiqué à des tiers, sauf si vous cochez vous-même l’une des deux cases de partage facultatives ci-dessous.
  3. L’enregistrement est conservé 24 mois au maximum dans un registre non public du compte Google de l’association, puis supprimé automatiquement. Les e-mails sont envoyés via Brevo (France).
  4. Vous pouvez retirer votre consentement et demander la suppression de vos données à tout moment : imam@ulucamii.be
- **Partage pour un accompagnement local (facultatif):** Ces deux cases sont facultatives ; vous pouvez envoyer le test sans les cocher. Dans ce cas, vos informations et votre résultat restent auprès de notre imam uniquement.
  - ☐ «Je consens expressément à ce que mon nom, mes coordonnées et le résultat de mon test soient communiqués à l’imam de la mosquée Diyanet la plus proche de chez moi, et à ce que celui-ci me contacte, afin que ma formation puisse être organisée près de chez moi.»
  - ☐ «Je consens expressément à ce que mon nom, mes coordonnées et le résultat de mon test soient communiqués au Conseiller / à l’Attaché aux affaires religieuses de mon pays de résidence, afin que des possibilités de formation locales puissent être organisées.»
  - Vous pouvez retirer ces consentements à tout moment : imam@ulucamii.be

### English
- **18+:** «I am over 18 years old.»
- **Consent:** «I give my explicit consent for my answers, which concern my religious beliefs and my level of religious knowledge, to be processed by the Ulu Camii association and passed on to the imam in order to plan teaching suited to me.»
- **Information:**
  1. Data controller: Association Diyanet Mosquée Ulu Camii de Marche en Famenne ASBL (BCE 0421.900.807).
  2. Your answers are special-category data; they are processed only with your explicit consent (GDPR art. 9(2)(a)). Only our imam sees the detailed result; nothing is shared with third parties unless you yourself tick one of the two optional sharing boxes below.
  3. The record is kept for 24 months at most in a non-public ledger in the association’s Google account and is then deleted automatically. E-mails are sent through Brevo (France).
  4. You can withdraw your consent and ask for your data to be deleted at any time: imam@ulucamii.be
- **Sharing for local support (optional):** These two boxes are optional; you can send the test without ticking them. If you leave them unticked, your details and your result stay with our imam only.
  - ☐ «I give my explicit consent for my name, my contact details and my test result to be shared with the imam of the Diyanet mosque nearest to me, and for that imam to contact me, so that my teaching can be arranged close to where I live.»
  - ☐ «I give my explicit consent for my name, my contact details and my test result to be shared with the Counsellor / Attaché for Religious Affairs in my country of residence, so that local teaching can be organised.»
  - You can withdraw these consents at any time: imam@ulucamii.be

### Nederlands
- **18+:** «Ik ben ouder dan 18 jaar.»
- **Consent:** «Ik geef uitdrukkelijk toestemming dat mijn antwoorden, die mijn religieuze overtuiging en mijn niveau van religieuze kennis betreffen, door de vereniging Ulu Camii worden verwerkt en aan de imam worden bezorgd om een opleiding voor te bereiden die bij mij past.»
- **Information:**
  1. Verwerkingsverantwoordelijke: Association Diyanet Mosquée Ulu Camii de Marche en Famenne ASBL (KBO 0421.900.807).
  2. Uw antwoorden zijn gevoelige gegevens; ze worden alleen met uw uitdrukkelijke toestemming verwerkt (AVG, art. 9, lid 2, a). Alleen onze imam ziet het gedetailleerde resultaat; er wordt niets met derden gedeeld, tenzij u hieronder zelf een van de twee facultatieve vakjes voor het delen aankruist.
  3. De registratie wordt maximaal 24 maanden bewaard in een niet-openbaar register in de Google-account van de vereniging en wordt daarna automatisch gewist. E-mails worden verstuurd via Brevo (Frankrijk).
  4. U kunt uw toestemming op elk moment intrekken en vragen om uw gegevens te wissen: imam@ulucamii.be
- **Delen voor lokale begeleiding (facultatief):** Deze twee vakjes zijn facultatief; u kunt de test ook versturen zonder ze aan te kruisen. In dat geval blijven uw gegevens en uw resultaat uitsluitend bij onze imam.
  - ☐ «Ik geef uitdrukkelijk toestemming dat mijn naam, mijn contactgegevens en mijn testresultaat worden gedeeld met de imam van de Diyanet-moskee die het dichtst bij mij ligt, en dat die imam contact met mij opneemt, zodat mijn opleiding dicht bij mijn woonplaats kan worden georganiseerd.»
  - ☐ «Ik geef uitdrukkelijk toestemming dat mijn naam, mijn contactgegevens en mijn testresultaat worden gedeeld met de Raad / Attaché voor Religieuze Zaken van het land waar ik woon, zodat lokale opleidingsmogelijkheden kunnen worden georganiseerd.»
  - U kunt deze toestemmingen op elk moment intrekken: imam@ulucamii.be

### Deutsch
- **18+:** «Ich bin älter als 18 Jahre.»
- **Consent:** «Ich willige ausdrücklich ein, dass meine Antworten, die meine religiöse Überzeugung und meinen religiösen Wissensstand betreffen, vom Verein Ulu Camii verarbeitet und an den Imam weitergegeben werden, um einen Unterricht zu planen, der zu mir passt.»
- **Information:**
  1. Verantwortlicher: Association Diyanet Mosquée Ulu Camii de Marche en Famenne ASBL (Unternehmensnr. 0421.900.807).
  2. Ihre Antworten sind besonders schützenswerte Daten; sie werden nur mit Ihrer ausdrücklichen Einwilligung verarbeitet (DSGVO, Art. 9 Abs. 2 lit. a). Das ausführliche Ergebnis sieht nur unser Imam; an Dritte wird nichts weitergegeben, es sei denn, Sie kreuzen unten selbst eines der beiden freiwilligen Kästchen zur Weitergabe an.
  3. Der Eintrag wird höchstens 24 Monate in einem nicht öffentlichen Register im Google-Konto des Vereins aufbewahrt und danach automatisch gelöscht. E-Mails werden über Brevo (Frankreich) versendet.
  4. Sie können Ihre Einwilligung jederzeit widerrufen und die Löschung Ihrer Daten verlangen: imam@ulucamii.be
- **Weitergabe für Unterstützung vor Ort (freiwillig):** Diese beiden Kästchen sind freiwillig; Sie können den Test auch absenden, ohne sie anzukreuzen. Dann bleiben Ihre Angaben und Ihr Ergebnis ausschließlich bei unserem Imam.
  - ☐ «Ich willige ausdrücklich ein, dass mein Name, meine Kontaktdaten und mein Testergebnis an den Imam der mir nächstgelegenen Diyanet-Moschee weitergegeben werden und dass dieser Imam Kontakt mit mir aufnimmt, damit mein Unterricht in der Nähe meines Wohnorts organisiert werden kann.»
  - ☐ «Ich willige ausdrücklich ein, dass mein Name, meine Kontaktdaten und mein Testergebnis an den Botschaftsrat / Attaché für religiöse Angelegenheiten meines Wohnsitzlandes weitergegeben werden, damit Unterrichtsangebote vor Ort organisiert werden können.»
  - Sie können diese Einwilligungen jederzeit widerrufen: imam@ulucamii.be

## Sürüm 2026-09-20 (ilk sürüm)

Dayanak: GDPR md. 9/2-a (açık rıza). İki ayrı kutu, ikisi de zorunlu, hiçbiri önceden işaretli değil, taslağa yazılmaz.

### Türkçe
- **Yaş:** «18 yaşından büyüğüm.»
- **Rıza:** «Dinî inancıma ve dinî bilgi düzeyime ilişkin yanıtlarımın, bana özel eğitim planlanması amacıyla Ulu Camii
  derneği tarafından işlenmesine ve din görevlisine iletilmesine açıkça rıza veriyorum.»
- **Bilgilendirme:**
  1. Veri sorumlusu: Association Diyanet Mosquée Ulu Camii de Marche en Famenne ASBL (BCE 0421.900.807).
  2. Yanıtlarınız özel nitelikli veridir; yalnız açık rızanızla işlenir (GDPR md. 9/2-a). Ayrıntılı sonucu yalnız din
     görevlimiz görür; üçüncü kişilerle paylaşılmaz.
  3. Kayıt derneğin Google hesabındaki herkese kapalı bir defterde en fazla 24 ay saklanır ve süre sonunda kendiliğinden
     silinir. E-postalar Brevo (Fransa) üzerinden gönderilir.
  4. Rızanızı dilediğiniz an geri alabilir, verilerinizin silinmesini isteyebilirsiniz: imam@ulucamii.be

### Français
- **Âge :** « J’ai plus de 18 ans. »
- **Consentement :** « Je consens expressément à ce que mes réponses, qui concernent mes convictions religieuses et mon
  niveau de connaissances religieuses, soient traitées par l’association Ulu Camii et transmises à l’imam afin de
  préparer une formation qui me soit adaptée. »
- **Information :**
  1. Responsable du traitement : Association Diyanet Mosquée Ulu Camii de Marche en Famenne ASBL (BCE 0421.900.807).
  2. Vos réponses sont des données sensibles ; elles ne sont traitées qu’avec votre consentement explicite (RGPD,
     art. 9.2.a). Seul notre imam voit le résultat détaillé ; rien n’est communiqué à des tiers.
  3. L’enregistrement est conservé 24 mois au maximum dans un registre non public du compte Google de l’association,
     puis supprimé automatiquement. Les e-mails sont envoyés via Brevo (France).
  4. Vous pouvez retirer votre consentement et demander la suppression de vos données à tout moment : imam@ulucamii.be

### English
- **Age:** “I am over 18 years old.”
- **Consent:** “I give my explicit consent for my answers, which concern my religious beliefs and my level of religious
  knowledge, to be processed by the Ulu Camii association and passed on to the imam in order to plan teaching suited to
  me.”
- **Information:**
  1. Data controller: Association Diyanet Mosquée Ulu Camii de Marche en Famenne ASBL (BCE 0421.900.807).
  2. Your answers are special-category data; they are processed only with your explicit consent (GDPR art. 9(2)(a)).
     Only our imam sees the detailed result; nothing is shared with third parties.
  3. The record is kept for 24 months at most in a non-public ledger in the association’s Google account and is then
     deleted automatically. E-mails are sent through Brevo (France).
  4. You can withdraw your consent and ask for your data to be deleted at any time: imam@ulucamii.be
