# Build the blog post pages from Google Doc tabs exported as HTML
# (https://docs.google.com/document/d/<id>/export?format=html&tab=t.<tab>),
# using blog-dira-mekablan.html as the page template. Also rewrites the home
# page blog cards and the list in blog-posts.js. Usage:
#   python3 tools/build-blog.py <folder with a1.html, a2.html…> .
import re, html, math, sys, json
docdir, site = sys.argv[1], sys.argv[2]

POSTS = [  # (export file, page slug)
    ("a1.html", "blog-dira-mekablan"),
    ("a2.html", "blog-mechira-verechisha-bemakbil"),
    ("a3.html", "blog-michraz-yazamim"),
    ("a4.html", "blog-haskamot-dayarim"),
    ("a5.html", "blog-acharei-tama-38"),
    ("a6.html", "blog-schirut-iskit"),
    ("a7.html", "blog-rishum-bait-meshutaf"),
    ("a8.html", "blog-gishur"),
]
# Each post's photo (from Figma "Desktop - 7", cropped to the card framing):
# assets/blog/<name>-1600.webp for the article, <name>-800.webp for the home card.
# (large width, height), (card width, height)
IMG = {
    "blog-dira-mekablan": ((1600, 1063), (800, 532)),
    "blog-mechira-verechisha-bemakbil": ((1600, 1211), (800, 606)),
    "blog-michraz-yazamim": ((1600, 1032), (800, 516)),
    "blog-haskamot-dayarim": ((1600, 1068), (800, 534)),
    "blog-acharei-tama-38": ((1171, 886), (800, 606)),
    "blog-schirut-iskit": ((1600, 1210), (800, 605)),
    "blog-rishum-bait-meshutaf": ((1600, 1067), (800, 534)),
    "blog-gishur": ((1600, 1067), (800, 534)),
}
# Alt text for each post's photo, by image name
ALT = {
    "dira-mekablan": "דירה חדשה וריקה עם חלונות גדולים ומטבח לבן",
    "mechira-verechisha-bemakbil": "בניין מגורים מודרני עם מרפסות זכוכית",
    "michraz-yazamim": "פיגומים על חזית בניין בשיפוץ",
    "haskamot-dayarim": "לחיצת יד מעל תוכניות בנייה, ליד אנשים עם אפוד וקסדה של אתר בנייה",
    "acharei-tama-38": "בניין מגורים ישן עם מרפסות ותריסים",
    "schirut-iskit": "כניסה מזכוכית לשטח מסחרי בקומת הקרקע של בניין משרדים",
    "rishum-bait-meshutaf": "יד מחזיקה צרור מפתחות עם מחזיק בצורת בית",
    "gishur": "שני אנשים עוברים יחד על מסמכים ליד שולחן",
}
DESC = {"blog-dira-mekablan": "רכישת דירה מקבלן מבוססת על חוזה שנכתב כדי להגן על היזם. אלה חמשת הסעיפים שחשוב לבדוק לפני שחותמים על הסכם המכר."}
DATE_ISO, DATE_TXT = "2026-11-22", "22.11.2026"

def blocks(path):
    h = open(path, encoding="utf-8").read()
    bold = set(re.findall(r"\.(c\d+)\{[^}]*font-weight:700", h))
    body = h[h.find("<body"):]
    out = []
    for m in re.finditer(r"<(h\d|p|li)[^>]*>(.*?)</\1>", body, re.S):
        parts = []
        for s in re.finditer(r'<span class="([^"]*)"[^>]*>(.*?)</span>', m.group(2), re.S):
            t = html.unescape(re.sub(r"<[^>]+>", "", s.group(2))).replace("\xa0", " ")
            b = bool(bold & set(s.group(1).split()))
            if parts and parts[-1][1] == b: parts[-1][0] += t
            else: parts.append([t, b])
        plain = "".join(p[0] for p in parts).strip()
        if plain: out.append((m.group(1), plain, parts))
    return out

esc = lambda s: html.escape(s, quote=False)
attr = lambda s: html.escape(s, quote=True)

def rich(parts):
    s = ""
    for t, b in parts:
        lead = t[:len(t) - len(t.lstrip())]
        core = t.strip()
        trail = t[len(t.rstrip()):] if core else ""
        s += lead + (f"<strong>{esc(core)}</strong>" if b and core else esc(core)) + trail
    return s.strip()

def build(path, slug):
    bl = blocks(path)
    (bw, bh), _ = IMG[slug]
    img = slug.removeprefix("blog-")
    title, lead = bl[0][1], bl[1][1]
    rest = bl[2:]
    faq_i = next(i for i, b in enumerate(rest) if b[0] == "h2")
    body, faq_title, faq = rest[:faq_i], rest[faq_i][1], rest[faq_i + 1:]
    words = sum(len(b[1].split()) for b in bl)
    mins = max(1, math.ceil(words / 200))

    out, i = [], 0
    while i < len(body) and body[i][0] != "h4":
        out.append(f"        <p>{rich(body[i][2])}</p>\n"); i += 1
    while i < len(body):
        sec = [f'          <h2 class="post__heading">{esc(body[i][1])}</h2>\n']; i += 1
        items = []
        while i < len(body) and body[i][0] != "h4":
            tag, _, parts = body[i]
            if tag == "li": items.append(f"            <li>{rich(parts)}</li>\n")
            else:
                if items: sec.append('          <ul class="post__list">\n' + "".join(items) + "          </ul>\n"); items = []
                sec.append(f"          <p>{rich(parts)}</p>\n")
            i += 1
        if items: sec.append('          <ul class="post__list">\n' + "".join(items) + "          </ul>\n")
        out.append('\n        <section class="post__group">\n' + "".join(sec) + "        </section>\n")

    qa = ""
    for q, a in zip(faq[0::2], faq[1::2]):
        qa += f'''          <details class="faq__item">
            <summary class="faq__head">
              <h3 class="faq__q">{esc(q[1])}</h3>
              <img class="faq__arrow" src="assets/arrow.svg" width="40" height="40" alt="">
            </summary>
            <p class="faq__a">{rich(a[2])}</p>
          </details>
'''
    article = f'''          <h1 class="post__title">{esc(title)}</h1>
          <p class="post__lead">{esc(lead)}</p>
        </div>
        <p class="post__meta">
          <span>זמן קריאה: {mins} דקות</span>
          <img src="assets/dot.svg" width="4" height="4" alt="">
          <span>עודכן לאחרונה: <time datetime="{DATE_ISO}">{DATE_TXT}</time></span>
        </p>
      </header>

      <div class="post__media">
        <img class="post__image" src="assets/blog/{img}-1600.webp" srcset="assets/blog/{img}-800.webp 800w, assets/blog/{img}-1600.webp {bw}w" sizes="(max-width: 1440px) 100vw, 1200px" width="{bw}" height="{bh}" alt="{attr(ALT[img])}" fetchpriority="high">
      </div>

      <div class="post__body">
{"".join(out)}
        <!-- FAQ accordion: native <details>, any number open at once -->
        <section class="faq" aria-labelledby="faq-title">
          <h2 class="faq__title" id="faq-title">{esc(faq_title)}</h2>
{qa}        </section>
      </div>

'''
    return title, lead, mins, article

tpl = open(f"{site}/blog-dira-mekablan.html", encoding="utf-8").read()
a, b = tpl.index('          <h1 class="post__title">'), tpl.index("      <!-- Share:")
cards, listing = "", []
for f, slug in POSTS:
    title, lead, mins, article = build(f"{docdir}/{f}", slug)
    _, (cw, ch) = IMG[slug]
    img = slug.removeprefix("blog-")
    desc = DESC.get(slug) or (lead if len(lead) <= 160 else lead[:lead.rfind(" ", 0, 155)] + "…")
    page = tpl[:a] + article + tpl[b:]
    page = re.sub(r"<title>.*?</title>", lambda m: f"<title>{esc(title)} – הלה איינהורן, עורכת דין</title>", page, 1)
    page = re.sub(r'<meta name="description" content="[^"]*">', lambda m: f'<meta name="description" content="{attr(desc)}">', page, 1)
    page = re.sub(r'<meta property="og:title" content="[^"]*">', lambda m: f'<meta property="og:title" content="{attr(title)}">', page, 1)
    page = re.sub(r'<meta property="og:description" content="[^"]*">', lambda m: f'<meta property="og:description" content="{attr(desc)}">', page, 1)
    open(f"{site}/{slug}.html", "w", encoding="utf-8").write(page)
    listing.append({"href": slug + ".html", "title": title})
    cards += f'''          <li class="post-card">
            <a class="post-card__link" href="{slug}.html">
              <span class="post-card__media"><img class="post-card__img" src="assets/blog/{img}-800.webp" width="{cw}" height="{ch}" alt="{attr(ALT[img])}" loading="lazy"><span class="post-card__badge">זמן קריאה: {mins} דקות</span></span>
              <span class="post-card__title">{esc(title)}</span>
            </a>
          </li>
'''
    print(slug, mins, len(article))

# Home page cards
idx = open(f"{site}/index.html", encoding="utf-8").read()
s = idx.index('<ul class="carousel__track carousel__track--blog"')
s = idx.index("\n", s) + 1
e = idx.index("        </ul>", s)
open(f"{site}/index.html", "w", encoding="utf-8").write(idx[:s] + cards + idx[e:])

# Post list for previous / next
js = open(f"{site}/blog-posts.js", encoding="utf-8").read()
lst = "var BLOG_POSTS = [\n" + ",\n".join(f'  {{ href: {json.dumps(p["href"])}, title: {json.dumps(p["title"], ensure_ascii=False)} }}' for p in listing) + "\n];"
js = re.sub(r"var BLOG_POSTS = \[.*?\];", lambda m: lst, js, 1, re.S)
open(f"{site}/blog-posts.js", "w", encoding="utf-8").write(js)
