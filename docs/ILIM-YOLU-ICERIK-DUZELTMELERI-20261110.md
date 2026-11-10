# İlim Yolu — içerik düzeltmeleri (10 Kasım 2026)

Kapsam: `src/data/ilim-yolu/kartlar/*.json`, `egitim/src/i18n/*.ts` (mevcut dosyalar), `paylasilan/ogrenme-yolu/icerik.json`. Hiçbir `durum` değişmedi (hepsi `taslak`). Kart sayısı 261, soru sayısı 372 (değişmedi). Commit/yayın yok.

## 1. Kart bulguları (INPUT A)

33 bulgunun 33'ü uygulandı; reddedilen: ib-023 («yapılandır» doğru Türkçe, bulgu kendiliğinden düşürüldü). Her bulgu arşivde yeniden açılıp doğrulandı (fitre #207316, Ebvâ #28897, lâmelif #79301, izhâr #69004/#41782, tokalaşma #123639, vahiy kâtipleri #191966, Mi'râc #88542, Tecrîd #186405, Bakara 168 #192884).

Not: bazı özetler 280 karakter sınırını (test `OZET_ENCOK`) aştığı için ilgili dillerde cümleler kısaltıldı (ah-022, ah-030, ib-040, it-003, it-017, si-009, si-031; ah-009 fr/de). Anlam eklemesi değil, yalnız sıkıştırma.

| Kart | Dil | Önce | Sonra | Kaynak |
|---|---|---|---|---|
| ah-009 | tr | ulu’l-azm | ülü’l-azm | DIA, MUHAMMED ARUÇİ, «ÜLÜ'l-AZM» #126390: başlık ve metin «ülü'l-azm peygamberlerin...» (Hz. Muhammed, Nûh, İbrâhim, Mûsâ ve Îsâ); karttaki  |
| ah-009 | fr | les six articles de foi. | les six articles de foi et les cinq plus grands prophètes (ülü’l-azm). | DIA, MUHAMMED ARUÇİ, «ÜLÜ'l-AZM» #126390: başlık ve metin «ülü'l-azm peygamberlerin...» (Hz. Muhammed, Nûh, İbrâhim, Mûsâ ve Îsâ); karttaki  |
| ah-009 | de | die sechs Glaubensartikel. | die sechs Glaubensartikel und die fünf größten Propheten (ülü’l-azm). | DIA, MUHAMMED ARUÇİ, «ÜLÜ'l-AZM» #126390: başlık ve metin «ülü'l-azm peygamberlerin...» (Hz. Muhammed, Nûh, İbrâhim, Mûsâ ve Îsâ); karttaki  |
| ah-022 | tr | el sıkışmak, gülümsemek de selamdır. | el sıkışmak selamlaşmayı tamamlar, güler yüz de güzel bir iyiliktir. | DIA, TOKALAŞMA #123639: «tokalaşmanın selâmlaşmanın tamamlayıcısı olduğunu» (Tirmizî, İstiʾzân, 31); «Selâm söz bakımından güven ve güvence  |
| ah-022 | fr | poignée de main et sourire sont aussi des saluts. | la poignée de main complète le salut, et un visage souriant est aussi une belle action. | DIA, TOKALAŞMA #123639: «tokalaşmanın selâmlaşmanın tamamlayıcısı olduğunu» (Tirmizî, İstiʾzân, 31); «Selâm söz bakımından güven ve güvence  |
| ah-022 | en | a handshake or a smile is a greeting too. | a handshake completes the greeting, and a cheerful face is a good deed too. | DIA, TOKALAŞMA #123639: «tokalaşmanın selâmlaşmanın tamamlayıcısı olduğunu» (Tirmizî, İstiʾzân, 31); «Selâm söz bakımından güven ve güvence  |
| ah-022 | nl | ook een handdruk of glimlach is een groet. | een handdruk maakt het groeten compleet, en een vriendelijk gezicht is ook een goede daad. | DIA, TOKALAŞMA #123639: «tokalaşmanın selâmlaşmanın tamamlayıcısı olduğunu» (Tirmizî, İstiʾzân, 31); «Selâm söz bakımından güven ve güvence  |
| ah-022 | de | auch Händedruck und Lächeln sind Gruß. | der Händedruck vervollständigt den Gruß, und ein freundliches Gesicht ist auch eine gute Tat. | DIA, TOKALAŞMA #123639: «tokalaşmanın selâmlaşmanın tamamlayıcısı olduğunu» (Tirmizî, İstiʾzân, 31); «Selâm söz bakımından güven ve güvence  |
| ah-030 | tr | fitre bayram namazından önce verilir. | fitreyi bayram namazından önce vermek müstehaptır (daha güzeldir). | Fetva arşivi #207316: fitrenin vâcip olma zamanı bayramın birinci günü; önceden verilebilir (daha faziletli), bayram namazından önce verilme |
| ah-030 | fr | la zakât al-fitr se donne avant la prière. | il est recommandé (mustahab) de donner la zakât al-fitr avant la prière. | Fetva arşivi #207316: fitrenin vâcip olma zamanı bayramın birinci günü; önceden verilebilir (daha faziletli), bayram namazından önce verilme |
| ah-030 | en | the fitr charity is given before it. | it is recommended (mustahab) to give the fitr charity before it. | Fetva arşivi #207316: fitrenin vâcip olma zamanı bayramın birinci günü; önceden verilebilir (daha faziletli), bayram namazından önce verilme |
| ah-030 | nl | de fitr-aalmoes wordt ervoor gegeven. | het is aanbevolen (mustahab) de fitr-aalmoes ervoor te geven. | Fetva arşivi #207316: fitrenin vâcip olma zamanı bayramın birinci günü; önceden verilebilir (daha faziletli), bayram namazından önce verilme |
| ah-030 | de | die Fitr-Spende wird davor gegeben. | es ist empfohlen (mustahab), die Fitr-Spende davor zu geben. | Fetva arşivi #207316: fitrenin vâcip olma zamanı bayramın birinci günü; önceden verilebilir (daha faziletli), bayram namazından önce verilme |
| ah-030 | tr | Fitre (sadaka-i fıtır) ne zamana kadar verilmelidir? | Fitreyi (sadaka-i fıtır) ne zaman vermek müstehaptır (daha güzeldir)? | Fetva arşivi #207316: fitrenin vâcip olma zamanı bayramın birinci günü; önceden verilebilir (daha faziletli), bayram namazından önce verilme |
| ah-030 | fr | Jusqu’à quand la zakât al-fitr doit-elle être donnée ? | Quand est-il recommandé (mustahab) de donner la zakât al-fitr ? | Fetva arşivi #207316: fitrenin vâcip olma zamanı bayramın birinci günü; önceden verilebilir (daha faziletli), bayram namazından önce verilme |
| ah-030 | en | By when should the fitr charity be given? | When is it recommended (mustahab) to give the fitr charity? | Fetva arşivi #207316: fitrenin vâcip olma zamanı bayramın birinci günü; önceden verilebilir (daha faziletli), bayram namazından önce verilme |
| ah-030 | nl | Tot wanneer moet de fitr-aalmoes gegeven worden? | Wanneer is het aanbevolen (mustahab) de fitr-aalmoes te geven? | Fetva arşivi #207316: fitrenin vâcip olma zamanı bayramın birinci günü; önceden verilebilir (daha faziletli), bayram namazından önce verilme |
| ah-030 | de | Bis wann sollte die Fitr-Spende gegeben werden? | Wann ist es empfohlen (mustahab), die Fitr-Spende zu geben? | Fetva arşivi #207316: fitrenin vâcip olma zamanı bayramın birinci günü; önceden verilebilir (daha faziletli), bayram namazından önce verilme |
| ah-036 | tr | Peygamberimiz hangi yiyeceklerden yememizi öğütler? | Kur’an’a göre hangi yiyeceklerden yemeliyiz? | — |
| ah-036 | fr | Quels aliments le Prophète nous conseille-t-il de manger ? | Selon le Coran, de quels aliments devons-nous manger ? | — |
| ah-036 | en | From which foods does the Prophet advise us to eat? | According to the Qur’an, which foods should we eat? | — |
| ah-036 | nl | Welk voedsel raadt de Profeet ons aan te eten? | Welk voedsel moeten we volgens de Koran eten? | — |
| ah-036 | de | Von welchen Speisen rät uns der Prophet zu essen? | Von welchen Speisen sollen wir nach dem Koran essen? | — |
| ib-016 | tr | Mevlit, | Mevlid, | DIA KANDİL maddesi #71035: "Bunlar Mevlid, Regaib, Mi'rac, Berat ve Kadir geceleridir." |
| ib-040 | fr | dix premiers jours de Dhou al-hijja. | dix premiers jours de Dhou al-hijja. La ‘umra est la visite accomplie en dehors du hajj. | kartlar.json TR özet: 'Umre ise haccın dışında yapılan ziyarettir.' — FR özet bu cümleyi içermiyor. |
| ib-040 | en | first ten days of Dhul-Hijjah. | first ten days of Dhul-Hijjah. Umrah is the visit performed outside hajj. | kartlar.json TR özet: 'Umre ise haccın dışında yapılan ziyarettir.' — FR özet bu cümleyi içermiyor. |
| ib-040 | nl | tien dagen van Dhoe al-hidjdja. | tien dagen van Dhoe al-hidjdja. De oemra is het bezoek buiten de hadj. | kartlar.json TR özet: 'Umre ise haccın dışında yapılan ziyarettir.' — FR özet bu cümleyi içermiyor. |
| ib-040 | de | zehn Tagen von Dhul-Hiddscha statt. | zehn Tagen von Dhul-Hiddscha statt. Die Umra ist der Besuch außerhalb der Hadsch. | kartlar.json TR özet: 'Umre ise haccın dışında yapılan ziyarettir.' — FR özet bu cümleyi içermiyor. |
| it-003 | fr | As-Sami‘, Al-Basir et Ar-Rahim | As-Sami‘, Al-Basir, Al-Alim, Ar-Rahim et Al-Wadoud | #205158 (Esma-i Hüsna) ve kartın Türkçe özeti: Semî’, Basîr, Alîm, Rahîm ve Vedûd; çeviride Alîm ve Vedûd yer almıyor. |
| it-003 | en | As-Sami‘, Al-Basir and Ar-Rahim | As-Sami‘, Al-Basir, Al-Alim, Ar-Rahim and Al-Wadud | #205158 (Esma-i Hüsna) ve kartın Türkçe özeti: Semî’, Basîr, Alîm, Rahîm ve Vedûd; çeviride Alîm ve Vedûd yer almıyor. |
| it-003 | nl | As-Sami‘, Al-Basier en Ar-Rahiem | As-Sami‘, Al-Basier, Al-Aliem, Ar-Rahiem en Al-Wadoed | #205158 (Esma-i Hüsna) ve kartın Türkçe özeti: Semî’, Basîr, Alîm, Rahîm ve Vedûd; çeviride Alîm ve Vedûd yer almıyor. |
| it-003 | de | As-Sami‘, Al-Basir und Ar-Rahim | As-Sami‘, Al-Basir, Al-Alim, Ar-Rahim und Al-Wadud | #205158 (Esma-i Hüsna) ve kartın Türkçe özeti: Semî’, Basîr, Alîm, Rahîm ve Vedûd; çeviride Alîm ve Vedûd yer almıyor. |
| it-008 | tr | Melekler neden yaratılmıştır? | Melekler neyden yaratılmıştır? | — |
| it-017 | tr | kâğıt henüz yaygın değilken | kâğıt henüz yokken | #191966: vahiy kâtipleri taş, kemik ve deriye yazıyordu; “Çünkü henüz kâğıt yoktu.” Karttaki “yaygın değilken” ifadesi kâğıdın var olduğunu  |
| it-017 | fr | à une époque où le papier était encore rare | à une époque où il n’y avait pas encore de papier | #191966: vahiy kâtipleri taş, kemik ve deriye yazıyordu; “Çünkü henüz kâğıt yoktu.” Karttaki “yaygın değilken” ifadesi kâğıdın var olduğunu  |
| it-017 | en | when paper was still uncommon | when there was not yet any paper | #191966: vahiy kâtipleri taş, kemik ve deriye yazıyordu; “Çünkü henüz kâğıt yoktu.” Karttaki “yaygın değilken” ifadesi kâğıdın var olduğunu  |
| it-017 | nl | toen papier nog zeldzaam was | toen er nog geen papier was | #191966: vahiy kâtipleri taş, kemik ve deriye yazıyordu; “Çünkü henüz kâğıt yoktu.” Karttaki “yaygın değilken” ifadesi kâğıdın var olduğunu  |
| it-017 | de | als Papier noch selten war | als es noch kein Papier gab | #191966: vahiy kâtipleri taş, kemik ve deriye yazıyordu; “Çünkü henüz kâğıt yoktu.” Karttaki “yaygın değilken” ifadesi kâğıdın var olduğunu  |
| it-029 | de | Al-Ghaffar | Al-Ghafur | DİA GAFÛR (#38951): 'Esmâ-i hüsnânın zikredildiği İbn Mâce ile ("Duʿâʾ", 10) Tirmizî ("Daʿavât", 82) rivayetlerinde gaffâr ve gafûr isimleri |
| it-042 | tr | Namazı vaktinden sonra kılmak | Ezanın bir bölümü | — |
| it-042 | fr | Faire la prière après son temps | Une partie de l’appel à la prière | — |
| it-042 | en | Praying after its time | A part of the call to prayer | — |
| it-042 | nl | Het gebed na zijn tijd verrichten | Een onderdeel van de gebedsoproep | — |
| it-042 | de | Das Gebet nach seiner Zeit verrichten | Ein Teil des Gebetsrufs | — |
| ku-013 | tr | Lâm ile elifin birleşmesiyle oluşan lâmelifi kelime içinde tanır ve doğru okuruz. | Lâmelifi, yani lâm desteğine yazılmış sâkin med elifini, kelime içinde tanır ve doğru okuruz. | DIA LÂMELİF maddesi, müellif İsmail Durmuş (#79301): “Lâmelif, sanıldığının aksine lâm ve eliften oluşan birleşik bir harf olmayıp lâm deste |
| ku-013 | fr | le lâm-alif, formé de la réunion du lâm et de l’alif, dans les mots | le lâm-alif, c’est-à-dire l’alif d’allongement sans voyelle écrit sur le support du lâm, dans les mots | DIA LÂMELİF maddesi, müellif İsmail Durmuş (#79301): “Lâmelif, sanıldığının aksine lâm ve eliften oluşan birleşik bir harf olmayıp lâm deste |
| ku-013 | en | lām-alif, the joining of lām and alif, inside words | lām-alif, that is, the vowel-less lengthening alif written on a lām support, inside words | DIA LÂMELİF maddesi, müellif İsmail Durmuş (#79301): “Lâmelif, sanıldığının aksine lâm ve eliften oluşan birleşik bir harf olmayıp lâm deste |
| ku-013 | nl | lām-alif, de samenvoeging van lām en alif, in woorden | lām-alif, dat wil zeggen de klinkerloze verlengings-alif op een lām-steun, in woorden | DIA LÂMELİF maddesi, müellif İsmail Durmuş (#79301): “Lâmelif, sanıldığının aksine lâm ve eliften oluşan birleşik bir harf olmayıp lâm deste |
| ku-013 | de | das Lām-Alif, die Verbindung von Lām und Alif, in Wörtern | das Lām-Alif, das heißt das vokallose Dehnungs-Alif auf einer Lām-Stütze, in Wörtern | DIA LÂMELİF maddesi, müellif İsmail Durmuş (#79301): “Lâmelif, sanıldığının aksine lâm ve eliften oluşan birleşik bir harf olmayıp lâm deste |
| ku-019 | tr | Her hareketeyi | Her harekeyi | M. M. Çörtü, Arapça Dilbilgisi – Nahiv, s. 447 (#136175): “her üç harekeyi de alan”; DIA REVM maddesi (#103827): “harekeyi hafif bir sesle b |
| ku-024 | tr | Sâkin (cezmli) | Sâkin (cezimli) | Dînî Kavramlar Sözlüğü, I harfi s. 282 (IZHAR, #145505): sâkin (cezimli) nûn; AUZEF Kur’an Okuma ve Tecvid I s. 232 (#253584) ve s. 84 (#253 |
| ku-024 | tr | karıştırmamayı çalışırız | karıştırmamaya çalışırız | Dînî Kavramlar Sözlüğü, I harfi s. 282 (IZHAR, #145505): sâkin (cezimli) nûn; AUZEF Kur’an Okuma ve Tecvid I s. 232 (#253584) ve s. 84 (#253 |
| ku-045 | tr | nûn sesi açıkça, geniz sesi katmadan çıkarılır | nûn sesi açıkça çıkarılır | DİA, İZHAR (Abdurrahman Çetin), c.23 s.506, #69004: «Gerek sâkin nûn gerekse sâkin mîmle ilgili izhar uygulanırken gunneleri belirtilir.»; D |
| ku-045 | fr | le nûn est prononcé clairement, sans nasalisation : | le nûn est prononcé clairement : | DİA, İZHAR (Abdurrahman Çetin), c.23 s.506, #69004: «Gerek sâkin nûn gerekse sâkin mîmle ilgili izhar uygulanırken gunneleri belirtilir.»; D |
| ku-045 | en | pronounced clearly, without nasalisation; | pronounced clearly; | DİA, İZHAR (Abdurrahman Çetin), c.23 s.506, #69004: «Gerek sâkin nûn gerekse sâkin mîmle ilgili izhar uygulanırken gunneleri belirtilir.»; D |
| ku-045 | nl | duidelijk uitgesproken, zonder neusklank; | duidelijk uitgesproken; | DİA, İZHAR (Abdurrahman Çetin), c.23 s.506, #69004: «Gerek sâkin nûn gerekse sâkin mîmle ilgili izhar uygulanırken gunneleri belirtilir.»; D |
| ku-045 | de | klar und ohne Nasalierung gesprochen; | klar gesprochen; | DİA, İZHAR (Abdurrahman Çetin), c.23 s.506, #69004: «Gerek sâkin nûn gerekse sâkin mîmle ilgili izhar uygulanırken gunneleri belirtilir.»; D |
| ku-049 | fr | Cette année, nous écrivons | Ce Ramadan, nous écrivons | Kart içi karşılaştırma: TR «Bu Ramazan’da Kur’an hedefimizi bir kartta yazarız.» ile EN «This Ramadan we write our Qur’an goal on a card.» v |
| ku-049 | de | Dieses Jahr schreiben wir | Diesen Ramadan schreiben wir | Kart içi karşılaştırma: TR «Bu Ramazan’da Kur’an hedefimizi bir kartta yazarız.» ile EN «This Ramadan we write our Qur’an goal on a card.» v |
| si-002 | nl | Chadidscha | Khadija | — |
| si-008 | tr | Amcası Ebû Tâlib'e bakıp koyun otlattı | Amcası Ebû Tâlib'e yardım için koyun otlattı | DIA Muhammed md.: Hz. Muhammed'in Ebû Tâlib'e yardım için on yaşlarında koyun güttüğü (Buhârî, İcâre, 2); mevcut bakıp ifadesi bakım veren/a |
| si-009 | tr | sonra Ebû Tâlib'e emanet edildi. | önce dedesi Abdülmuttalib'e, sonra Ebû Tâlib'e emanet edildi. | EBVÂ md. #28897: Ümmü Eymen Mekke'ye getirdiği Muhammed'i dedesi Abdülmuttalib'e teslim etti; DIA Muhammed md.: Abdülmuttalib ölümünden önce |
| si-009 | fr | puis fut confié à Abû Tâlib. | puis fut confié d'abord à son grand-père Abdulmuttalib, ensuite à Abû Tâlib. | EBVÂ md. #28897: Ümmü Eymen Mekke'ye getirdiği Muhammed'i dedesi Abdülmuttalib'e teslim etti; DIA Muhammed md.: Abdülmuttalib ölümünden önce |
| si-009 | en | and was then entrusted to Abu Talib. | and was entrusted first to his grandfather Abdulmuttalib, then to Abu Talib. | EBVÂ md. #28897: Ümmü Eymen Mekke'ye getirdiği Muhammed'i dedesi Abdülmuttalib'e teslim etti; DIA Muhammed md.: Abdülmuttalib ölümünden önce |
| si-009 | nl | en werd toevertrouwd aan Abu Talib. | en werd eerst toevertrouwd aan zijn grootvader Abdulmuttalib en daarna aan Abu Talib. | EBVÂ md. #28897: Ümmü Eymen Mekke'ye getirdiği Muhammed'i dedesi Abdülmuttalib'e teslim etti; DIA Muhammed md.: Abdülmuttalib ölümünden önce |
| si-009 | de | und wurde dann Abu Talib anvertraut. | und wurde zuerst seinem Großvater Abdulmuttalib, dann Abu Talib anvertraut. | EBVÂ md. #28897: Ümmü Eymen Mekke'ye getirdiği Muhammed'i dedesi Abdülmuttalib'e teslim etti; DIA Muhammed md.: Abdülmuttalib ölümünden önce |
| si-018 | tr | Sonra yetmiş beş kişi Peygamberimizi korumaya söz verdi. Miraç'ta namaz hediye edildi. | Bu sıralarda Miraç'ta namaz hediye edildi. Sonra yetmiş beş kişi Peygamberimizi korumaya söz verdi. | Mİ‘RAC md. #88542: en sahih rivayet hicretten bir yıl önce; DIA Muhammed md. #91493: İkinci Akabe nübüvvetin 13. yılı (622) hac mevsiminde,  |
| si-018 | fr | Puis soixante-quinze promirent de protéger le Prophète. La prière fut offerte lors du Mi'râj. | À cette époque, la prière fut offerte lors du Mi'râj. Puis soixante-quinze promirent de protéger le Prophète. | Mİ‘RAC md. #88542: en sahih rivayet hicretten bir yıl önce; DIA Muhammed md. #91493: İkinci Akabe nübüvvetin 13. yılı (622) hac mevsiminde,  |
| si-018 | en | Then seventy-five promised to protect the Prophet. Prayer was gifted at the Mi'raj. | Around this time prayer was gifted at the Mi'raj. Then seventy-five promised to protect the Prophet. | Mİ‘RAC md. #88542: en sahih rivayet hicretten bir yıl önce; DIA Muhammed md. #91493: İkinci Akabe nübüvvetin 13. yılı (622) hac mevsiminde,  |
| si-018 | nl | Daarna beloofden vijfenzeventig de Profeet te beschermen. Het gebed werd geschonken tijdens de Mi'radj. | In die tijd werd het gebed geschonken tijdens de Mi'radj. Daarna beloofden vijfenzeventig de Profeet te beschermen. | Mİ‘RAC md. #88542: en sahih rivayet hicretten bir yıl önce; DIA Muhammed md. #91493: İkinci Akabe nübüvvetin 13. yılı (622) hac mevsiminde,  |
| si-018 | de | Dann versprachen fünfundsiebzig, den Propheten zu schützen. Das Gebet wurde im Miradsch geschenkt. | In dieser Zeit wurde das Gebet im Miradsch geschenkt. Dann versprachen fünfundsiebzig, den Propheten zu schützen. | Mİ‘RAC md. #88542: en sahih rivayet hicretten bir yıl önce; DIA Muhammed md. #91493: İkinci Akabe nübüvvetin 13. yılı (622) hac mevsiminde,  |
| si-021 | tr | Muhacir | Muhacirler | — |
| si-027 | de | mit Datteln. | mit einigen Datteln. | Kart içi karşılaştırma (arşiv alıntısı gerektirmez): TR 'birkaç hurmayla açardı' = EN 'with a few dates' = FR 'avec quelques dattes' = NL 'm |
| si-031 | tr | Tâif'te kötü karşılandı ama Tâiflilerin cezalandırılmasını istemedi. | Tâif'te kötü karşılandı; dönüşte dağlar meleği kavmini cezalandırmayı önerdi, o ise istemedi. | — |
| si-031 | fr | À Tâif, le Prophète fut mal reçu mais ne voulut pas qu'on punisse les habitants. | À Tâif, le Prophète fut mal reçu ; au retour, l'ange des montagnes proposa de punir son peuple, mais il refusa. | — |
| si-031 | en | At Ta'if the Prophet was treated badly but did not want its people punished. | At Ta'if the Prophet was treated badly; on the way back the angel of the mountains offered to punish his people, but he did not want that. | — |
| si-031 | nl | In Ta'if werd de Profeet slecht ontvangen, maar hij wilde niet dat de bewoners gestraft werden. | In Ta'if werd de Profeet slecht ontvangen; op de terugweg bood de bergengel aan zijn volk te straffen, maar dat wilde hij niet. | — |
| si-031 | de | In Taif wurde der Prophet schlecht aufgenommen, wollte aber nicht, dass die Bewohner bestraft werden. | In Taif wurde der Prophet schlecht aufgenommen; auf dem Rückweg bot der Bergengel an, sein Volk zu bestrafen, doch er wollte das nicht. | — |
| si-031 | tr | Tâif'te kötü karşılanan Peygamberimiz, Tâiflilerin cezalandırılması teklifine ne cevap verdi? | Tâif dönüşü dağlar meleği kavmini cezalandırmayı önerdiğinde Peygamberimiz ne cevap verdi? | — |
| si-031 | fr | Maltraité à Tâif, que répondit le Prophète à la proposition de punir ses habitants ? | Au retour de Tâif, l’ange des montagnes proposa de punir son peuple ; que répondit le Prophète ? | — |
| si-031 | en | Badly treated at Ta'if, how did the Prophet answer the offer to have its people punished? | After Ta'if, the angel of the mountains offered to punish his people. How did the Prophet answer? | — |
| si-031 | nl | Slecht behandeld in Ta'if, hoe antwoordde de Profeet op het aanbod de bewoners te straffen? | Na Ta'if bood de bergengel aan zijn volk te straffen. Hoe antwoordde de Profeet? | — |
| si-031 | de | In Taif schlecht behandelt: Wie antwortete der Prophet auf das Angebot, die Bewohner zu bestrafen? | Nach Taif bot der Bergengel an, sein Volk zu bestrafen. Wie antwortete der Prophet? | — |

(Yukarıdaki tablo ilk uygulama turudur; 280 karakter sınırı için ikinci turda yapılan sıkıştırmalar aşağıdaki özette ayrıca belirtildi. Son metin için doğrudan JSON dosyalarına bakın.)

## 2. Çeviri bulguları (INPUT B) — dil bazında

| Dil | Uygulanan | Reddedilen | Toplam |
|---|---|---|---|
| nl | 40 | 94 | 134 |
| de | 28 | 35 | 63 |
| fr | 28 | 27 | 55 |
| en | 11 | 14 | 25 |
| toplam | 107 | 170 | 277 |

Reddetme nedenleri (özet):
- nl «emir kipi = gayriresmî» iddiası (Kies, Luister, Zie, Begin…): Felemenkçede yalın emir kipi «u» ile de kullanılır; zamir «je/jij» yoksa hata değil. ~90 bulgu reddedildi.
- «prière/Gebet/gebed/prayer → salât/Salat/salaat» ve «abdest → wudû/woedoe»: yerleşik karşılıklar; zevk meselesi. ~60 bulgu reddedildi.
- «imam → din görevlisi/religious official»: bu camide din görevlisi imamdır; fr/en/nl'de «imam» korundu (de'de ayrı sorun, aşağıda).
- «taslakNotu» boş-Türkçe bulguları, «Directoraat→Presidium», «Lernstand→Übungsverlauf», «ezber→memoriseren» gibi sözlük tercihleri, «prière/foi» vb.: üslup.
- «sourate/…» kısa özetlerdeki fr «à relire» rozeti: kasıtlı (çeviri gözden geçirilecek).
- Uygulanıp geri alınan: giris.fr «simple» (#171) ve h01.metin.fr uzun cümle (#178 kısaltılarak uygulandı) — 600/900 karakter sınırı yüzünden.

### Bulgu dışı ek düzeltmeler (aynı kurala göre)

- `icerik.json` nl metinlerinin tamamı «je/jij/jullie/jouw» ile yazılmıştı; bulgular yalnız bir kısmını yakalamıştı. Hepsi «u/uw» yapıldı (≈45 alan; fiil sonları dahil: kunt u, leert u, wast u…). Kalan `je` yok.
- `icerik.json` de: «din görevlisi» her yerde «Lehrperson» (öğretmen) diye çevrilmişti; 9 yerde «Religionsbeauftragte(r)» yapıldı («öğretici» geçen 3 yerde Lehrperson kaldı). h11 de: «nach Ihrer,» (eksik «Lage») düzeltildi.

### En önemli 20 uygulanan çeviri düzeltmesi

1. icerik.json nl — Tüm «je/jij/jullie» → «u/uw» (giris, h01–h12 metin/yap/soru/şıklar) (kayıt tonu)
2. icerik.json de — «Lehrperson» → «Religionsbeauftragten» (din görevlisi; 9 yer) (yanlış çeviri)
3. icerik.json de h11 — «fragen Sie eine Lehrperson nach Ihrer,» → «…einen Religionsbeauftragten nach Ihrer Lage,» (eksik sözcük)
4. icerik.json fr h01 — Düşen cümle geri geldi: «aucun détail privé exigé» (özel ayrıntı anlatmak zorunda değilsiniz) (eksik metin)
5. icerik.json fr/en/de — «doğruluk»: fr «sincérité» → «honnêteté» (h03 metin, h03 şık, h08 metin) (yanlış terim)
6. icerik.json fr/en/nl/de — Kaynak adı «(Cibrîl hadisi)» çevrildi (hadith de Jibrîl…) (çevrilmemiş)
7. icerik.json fr/en/nl/de — «meâl» çevrildi: (mushaf, traduction du sens/translation/vertaling/Übersetzung) (çevrilmemiş)
8. icerik.json fr/nl/de — «tahminle»: au hasard/op gevoel/nach Gefühl → en devinant/door te gissen/durch Raten (yanlış anlam)
9. icerik.json fr/en/de — «dinleyip okuduktan sonra»: ou/or/oder → et/and/und (h02) (yanlış anlam)
10. icerik.json fr — h09 «baskı hissetmeyeceğiniz» düşmüştü → «à ressentir la pression de convaincre» (eksik metin)
11. icerik.json fr — h06 «uygulamalı destek»: «une démonstration à l'imam» → «une aide pratique à l'imam» (yanlış anlam)
12. icerik.json fr/en — «yedi alanlı seviye yolu» (yollar.ts lead): «sept domaines / seven-area / zeven gebieden / sieben Bereichen» (eksik metin)
13. icerik.json fr — «Aileyle iletişim»: Les relations familiales → La communication avec la famille (yanlış anlam)
14. icerik.json en — «paylaşma»: giving → sharing; «güzel söz»: fair → beautiful (yanlış anlam)
15. icerik.json de — Kur'an cümlesi: «…Gottes Wort ist und … offenbart wurde» (eksik yardımcı fiil) (dilbilgisi)
16. cevrimdisi.ts fr — «se lise / se lisent» (ses çalmak) → «s'écouter / s'écoutent», «ne fonctionnent que» (yanlış fiil)
17. cevrimdisi.ts nl — «kan … niet openen» → «niet geopend worden» (dilbilgisi)
18. madde.ts fr/en/nl/de — «1 versets/verses/verzen/Verse» → tekil biçim (n === 1) (dilbilgisi)
19. madde.ts fr — namazBaslik «Dans la prière» → «Où il est récité dans la prière» (eksik metin)
20. sina.ts de — kayitBekle «Warte auf…» (du) → «Warten auf…» (Sie ile uyumlu) (kayıt tonu)

Tam liste (alan, önce → sonra): `scratchpad/icerik-duzeltme/ceviri-log.json` (130 kayıt).

## 3. Dinî ifadesi değişenler — sahibinin (imam) gözden geçirmesi için

- **ah-030**: Fitre: «bayram namazından önce verilir» → «bayram namazından önce vermek müstehaptır (daha güzeldir)»; soru: «ne zamana kadar verilmelidir?» → «ne zaman vermek müstehaptır?» (fetva #207316)
- **ah-022**: Selam: «el sıkışmak, gülümsemek de selamdır» → «el sıkışmak selamlaşmayı tamamlar, güler yüz de güzel bir iyiliktir» (DİA Tokalaşma)
- **ah-036-2**: Soru kaynağı Peygamber → Kur'an (Bakara 2/168 «helâl ve temiz olan şeylerden yiyiniz»)
- **si-009**: Peygamberimiz annesini kaybedince önce dedesi Abdülmuttalib'e, sonra Ebû Tâlib'e emanet edildi (DİA Ebvâ, Muhammed)
- **si-018**: Miraç cümlesi İkinci Akabe'den önceye alındı ve «Bu sıralarda» eklendi (Mi'râc md.: hicretten bir yıl önce; İkinci Akabe 622)
- **si-031**: Taif: «Tâiflilerin cezalandırılması» → dönüşte dağlar meleğinin kavmini cezalandırma teklifi (Buhârî, Bed'ü'l-halk 7); hem özet hem soru 5 dilde
- **si-008**: «Ebû Tâlib'e bakıp koyun otlattı» → «yardım için koyun otlattı»
- **it-017**: «kâğıt henüz yaygın değilken» → «henüz yokken» (kaynak: «Çünkü henüz kâğıt yoktu»); 5 dilde
- **it-042-2**: Çeldirici «Namazı vaktinden sonra kılmak» (fıkıhta kaza, yani o da doğru) → «Ezanın bir bölümü» (5 dil)
- **ku-013**: Lâmelif: «lâm ile elifin birleşmesi» → «lâm desteğine yazılmış sâkin med elifi» (DİA Lâmelif); 5 dilde
- **ku-045**: İzhâr: «geniz sesi katmadan» ifadesi çıkarıldı (DİA: izharda da gunne belirtilir); 5 dilde
- **it-003**: Esmâ-i hüsnâ listesine Alîm ve Vedûd eklendi (fr/en/nl/de; Türkçe zaten böyleydi)
- **ib-040**: Umre cümlesi fr/en/nl/de'ye eklendi
- **ib-016**: Mevlit → Mevlid (DİA Kandil)
- **ah-009**: ulu'l-azm → ülü'l-azm (DİA); fr/de'ye «beş büyük peygamber» eklendi
- **icerik.json**: Religionsbeauftragte: «din görevlisi» artık de'de de din görevlisi (öğretmen değil)
- **icerik.json fr/en/de**: h02 «dinleyip okuduktan sonra»: ou → et
- **icerik.json**: honnêteté (doğruluk), «tahminle» = gissen/devinant/Raten; hadith adları ve meâl çevirileri

## 4. Doğrulama

- Düğümde `node --test` (kartlar, eşitle, ilerleme, yollar, ortak-aktar, ogrenme-yolu-icerik, kullanıcı adı): 43 test, 0 hata. `tests/egitim/hesap-giris` ve `hesap-profil`: 26/26.
- JSON ayrıştırma: 5 kart dosyası + icerik.json tamam; 261 kart / 372 soru; tüm `durum` = taslak.
- Tip denetimi: `tsc --noEmit -p egitim` yalnız 1 hata verdi: `egitim/src/scripts/kart.ts(84,70)` (başka ajanın dosyası; i18n/icerik tarafında hata yok).
