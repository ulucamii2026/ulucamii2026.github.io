import json, urllib.request, urllib.parse, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
IDS = """rtzu3OQUmGg _LSLySyEdDI GvoPKTWw1IU fSQHUgdE0to Lvl_ekd6Asg xNtRAQyB_yo R2DKaFxgDRA sST704CV290
lpzDMlHmCfw n9XdFz1vguw ULCe_8Y-pQw YU-ZluwwNrQ Xk68bTWN27A 2y-6RSyghAU w0lvzSaN73w 3Krg27PuQYQ
tX_NMZjTSc8 nnXakWTazFk 3AsoamSK-JM EkKfKohLgu8 cvQ2Tf5lsC4 ZSxR6FQm_U0 E6aR05Mit54 ukFWeUR7UIk
osXNfzXuva4 sXIIGVOA9Bg oXpPWFT6rCg wgSzrmFxNaI cqxobuvcNhA BwJB-Td2J6A 5-wM_0CDc0M mjHqbXLBzvI
USgJjlXPmMY odzuZY5Awsg j9ZkrWYCwUM E-RM6AyWV84 hFkQnO1dMAQ X_nHi0kJ45I olJ-LyxFZU4 chRE5FRv6QA
Y7CCVAhDFdk hHC26YKQQ6s VZtGB8kGuI4 a58XA-Qm0yI 7MrLI0avPFw""".split()
out = []
for v in IDS:
    u = "https://www.youtube.com/oembed?format=json&url=" + urllib.parse.quote("https://www.youtube.com/watch?v=" + v, safe="")
    try:
        with urllib.request.urlopen(u, timeout=15) as r:
            d = json.load(r)
        out.append({"id": v, "baslik": d["title"], "kanal": d["author_name"], "canli": True})
        print("OK  ", v, d["author_name"], "|", d["title"])
    except Exception as e:
        out.append({"id": v, "canli": False, "hata": str(e)[:60]})
        print("OLU ", v, e)
json.dump(out, open("islam-nedir.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
