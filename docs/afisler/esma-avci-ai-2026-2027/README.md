# Esma Avcı 2026–2027 — AI görsel afiş serisi

Bu klasördeki ana seri, mevcut PDF tasarımından bağımsız olarak Anti-Gravity CLI iş akışıyla üretilen özgün görsel arka planlar üzerine kurulmuştur. Görsel arka planlar `kaynak/assets/` altında saklanır; metinler sonradan güvenli tipografiyle yerleştirilmiştir. Kurum logosu kullanılmamıştır; görev iki farklı camide yürütüldüğü için afişlerde görev yeri açıkça yazılmıştır.

## Ana seri

Her dosyanın PNG ve tek sayfalık PDF sürümü vardır:

- `00-ai-genel-tanitim` — genel tanıtım
- `01-ai-hanimlar-pazartesi` — pazartesi hanımlar programı
- `02-ai-hanimlar-persembe` — perşembe hanımlar programı
- `03-ai-marche-carsamba` — çarşamba Marche-en-Famenne programı
- `04-ai-genc-kizlar-cuma` — cuma genç kızlar programı
- `05-ai-kiz-cocuklari-hafta-sonu` — hafta sonu kız öğrenciler
- `06-ai-birebir-gorusme` — birebir görüşme (MDR)
- `07-ai-haftalik-program-ozeti` — haftalık çizelge özeti

`onizleme-ai-fotografik.jpg` sekiz afişi birlikte gösterir. Kaynak HTML ve üretim betiği `kaynak/` altındadır.

## Alternatif

`alternatif-generatif/` klasöründe önceki üretken-geometri yaklaşımının ayrı bir kopyası bulunur; ana seriyle karıştırılmaması için ayrılmıştır.

## Doğrulama

PNG ölçüsü 1080×1350, PDF sayfa sayısı 1 ve ana arka plan görselleri en az 190 DPI olacak şekilde kontrol edilmiştir. Ana seri tekrar üretimi:

```powershell
python .\kaynak\uret.py
```

