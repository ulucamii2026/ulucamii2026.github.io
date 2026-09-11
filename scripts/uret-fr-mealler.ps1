# Gemini 3.1 Flash TTS ile Sure ve Dualarin Fransizca Meallerini Uretir
$ErrorActionPreference = 'Continue'

$hedefDizin = "public/media/ses/mealler/fr"
if (-not (Test-Path $hedefDizin)) {
    New-Item -ItemType Directory -Force -Path $hedefDizin | Out-Null
}

$mealler = @(
    @{ id = "ayetel-kursi"; metin = "Allah ! Point de divinité à part Lui, le Vivant, Celui qui subsiste par Lui-même. Ni somnolence ni sommeil ne Le saisissent. À Lui appartient tout ce qui est dans les cieux et sur la terre. Qui peut intercéder auprès de Lui sans Sa permission ? Il sait leur passé et leur futur. Et, de Sa science, ils n’embrassent que ce qu’Il veut. Son Trône déborde les cieux et la terre, dont la garde ne Lui coûte aucune peine. Et Il est le Très Haut, le Très Grand." },
    @{ id = "insirah"; metin = "Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux. N’avons-Nous pas ouvert pour toi ta poitrine ? Et ne t’avons-Nous pas déchargé de ton fardeau qui accablait ton dos ? Et exalté pour toi ta renommée ? À côté de la difficulté est certes une facilité ! Oui, à côté de la difficulté est une facilité. Quand tu as terminé, lève-toi donc, et vers ton Seigneur chemine avec ardeur." },
    @{ id = "kadir"; metin = "Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux. Nous l’avons certes fait descendre pendant la nuit d’Al-Qadr. Et qui te dira ce qu’est la nuit d’Al-Qadr ? La nuit d’Al-Qadr est meilleure que mille mois. Durant celle-ci descendent les Anges ainsi que l’Esprit, par permission de leur Seigneur pour tout ordre. Elle est paix et salut jusqu’à l’apparition de l’aube." },
    @{ id = "asr"; metin = "Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux. Par le Temps ! L’homme est certes en perdition, sauf ceux qui croient et accomplissent les bonnes œuvres, s’enjoignent mutuellement la vérité et s’enjoignent mutuellement l’endurance." },
    @{ id = "fil"; metin = "Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux. N’as-tu pas vu comment ton Seigneur a agi envers les gens de l’Éléphant ? N’a-t-Il pas rendu leur ruse complètement vaine ? Et envoyé sur eux des oiseaux par volées qui leur lançaient des pierres d’argile, et Il les a rendus semblables à une paille mâchée." },
    @{ id = "kureys"; metin = "Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux. À cause du pacte des Quraïsh, de leur pacte des voyages d’hiver et d’été. Qu’ils adorent donc le Seigneur de cette Maison, qui les a nourris contre la faim et rassurés de la crainte !" },
    @{ id = "maun"; metin = "Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux. Vois-tu celui qui traite de mensonge la Rétribution ? C’est bien lui qui repousse l’orphelin, et qui n’encourage point à nourrir le pauvre. Malheur donc à ceux qui prient tout en négligeant leur prière, qui sont pleins d’ostentation, et refusent l’aide la plus modeste !" },
    @{ id = "kevser"; metin = "Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux. Nous t’avons certes accordé l’Abondance. Accomplis donc la prière pour ton Seigneur et sacrifie. Celui qui te hait sera certes sans postérité." },
    @{ id = "kafirun"; metin = "Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux. Dis : « Ô vous les infidèles ! Je n’adore pas ce que vous adorez. Et vous n’êtes pas adorateurs de ce que j’adore. Je ne suis pas adorateur de ce que vous avez adoré. Et vous n’êtes pas adorateurs de ce que j’adore. À vous votre religion, et à moi ma religion. »" },
    @{ id = "nasr"; metin = "Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux. Lorsque vient le secours d’Allah ainsi que la victoire, et que tu vois les gens entrer en foule dans la religion d’Allah, alors, par la louange, célèbre la gloire de ton Seigneur et implore Son pardon. Car c’est Lui le grand Accueillant au repentir." },
    @{ id = "tebbet"; metin = "Au nom d’Allah, le Tout Miséricordieux, le Très Miséricordieux. Que périssent les deux mains d’Abû Lahab et que lui-même périsse ! Sa fortune ne lui a servi à rien, ni ce qu’il a acquis. Il brûlera dans un Feu plein de flammes, de même que sa femme, la porteuse de bois, avec à son cou une corde de fibres." },
    @{ id = "ihlas"; metin = "Dis : « Il est Allah, Unique. Allah, Le Seul à être imploré pour ce que nous désirons. Il n’a jamais engendré, n’a pas été engendré non plus. Et nul n’est égal à Lui. »" },
    @{ id = "felak"; metin = "Dis : « Je cherche protection auprès du Seigneur de l’aube naissante, contre le mal des êtres qu’Il a créés, contre le mal de l’obscurité quand elle s’approfondit, contre le mal de celles qui soufflent sur les nœuds, et contre le mal de l’envieux quand il envie. »" },
    @{ id = "nas"; metin = "Dis : « Je cherche protection auprès du Seigneur des hommes, le Roi des hommes, Dieu des hommes, contre le mal du mauvais conseiller furtif, qui souffle le mal dans les poitrines des hommes, qu’il soit parmi les djinns ou les hommes. »" },
    @{ id = "subhaneke"; metin = "Gloire et pureté à Toi, ô Allah, et à Toi la louange. Que Ton Nom soit béni, que Ta majesté soit exaltée, et il n’y a point d’autre divinité que Toi." },
    @{ id = "tahiyyat"; metin = "Toutes les salutations, les prières et les bonnes œuvres sont pour Allah. Que la paix soit sur toi, ô Prophète, ainsi que la miséricorde d’Allah et Ses bénédictions. Que la paix soit sur nous et sur les vertueux serviteurs d’Allah. J’atteste qu’il n’y a point de divinité digne d’adoration en dehors d’Allah, et j’atteste que Muhammad est Son serviteur et Son messager." },
    @{ id = "salli-barik"; metin = "Ô Allah ! Prie sur Muhammad et sur la famille de Muhammad comme Tu as prié sur Ibrahim et sur la famille d’Ibrahim. Tu es certes Digne de louanges et Glorieux. Ô Allah ! Bénis Muhammad et la famille de Muhammad comme Tu as béni Ibrahim et la famille d’Ibrahim. Tu es certes Digne de louanges et Glorieux." },
    @{ id = "rabbena"; metin = "Seigneur ! Accorde-nous belle part ici-bas, et belle part aussi dans l’au-delà ; et protège-nous du châtiment du Feu ! Ô notre Seigneur ! Pardonne-moi, ainsi qu’à mes père et mère et aux croyants, le jour où s’élèvera le compte." }
)

foreach ($item in $mealler) {
    $id = $item.id
    $sonDosya = Join-Path $hedefDizin "$id.mp3"
    if (Test-Path $sonDosya) {
        Write-Host "Zaten var: $id.mp3 atlandi." -ForegroundColor Green
        continue
    }

    Write-Host "Uretiliyor ($id)..." -ForegroundColor Cyan
    try {
        & "C:\Users\ridva\.claude\skills\sesli-anlatim\sesli-anlatim.ps1" -Metin $item.metin -Baslik "fr-$id" -Dil "fr" -Force
        $kaynak = "D:\sesli-anlatim\fr-$id.mp3"
        if (Test-Path $kaynak) {
            Move-Item -Path $kaynak -Destination $sonDosya -Force
            Write-Host "Tamamlandi: $sonDosya" -ForegroundColor Green
        }
    } catch {
        Write-Host "Hata olustu ($id): $_" -ForegroundColor Yellow
    }
}
Write-Host "Tum Fransizca Gemini 3.1 TTS mealleri tamamlandi!" -ForegroundColor Green
