"""Official sources watched by the daily corpus sync. One function per source; each returns Items.

A listing that answers but yields no items raises: every listing always has items, so an empty
result means the page layout changed and the parser needs fixing, not that nothing is new.
"""

import html
import json
import re
from dataclasses import dataclass
from datetime import date
from functools import partial
from urllib.parse import urljoin

import httpx

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
MONTHS = {m: i for i, m in enumerate(
    ["januari", "februari", "maret", "april", "mei", "juni", "juli", "agustus", "september", "oktober", "november", "desember"], 1)}
MONTHS |= {m[:3]: i for m, i in MONTHS.items()} | {"agt": 8}  # DIY writes "23 Des 2025"


class Blocked(Exception):
    """A bot wall or a broken site search. Reported as `blocked`, never as "no changes"."""


@dataclass
class Item:
    source: str
    title: str  # "Peraturan Pemerintah Nomor 49 Tahun 2025"
    about: str  # the "tentang" line
    url: str  # detail page
    issued: date | None = None
    pdf_url: str = ""
    effective: date | None = None  # "Tanggal Berlaku", when the site gives one
    province: str = ""  # wage decrees only


def clean(fragment: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()


def parse_date(text: str) -> date | None:
    m = re.search(r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", text or "")
    if m and m[2].lower() in MONTHS:
        return date(int(m[3]), MONTHS[m[2].lower()], int(m[1]))
    return None


class Fetcher:
    """httpx for plain sites; one lazily started headless Chromium for sites behind Cloudflare."""

    def __init__(self):
        self.http = httpx.Client(headers={"User-Agent": UA}, follow_redirects=True, timeout=60)
        self._pw = self._page = None

    def get(self, url: str, **params) -> str:
        r = self.http.get(url, params=params or None)
        if r.status_code >= 400 or "Just a moment" in r.text[:3000]:
            raise Blocked(f"HTTP {r.status_code} from {url}")
        return r.text

    def browse(self, url: str) -> str:
        page = self._browser()
        r = page.goto(url, timeout=60_000)
        page.wait_for_timeout(6000)  # challenge pages and single-page apps render after load
        content = page.content()
        if (r and r.status >= 400) or "Just a moment" in content[:5000]:
            raise Blocked(f"HTTP {r.status if r else '?'} from {url} (headless browser)")
        return content

    def download(self, url: str) -> tuple[bytes, str]:
        r = self.http.get(url)
        if r.status_code == 403 and self._page:  # Cloudflare: reuse the browser's clearance cookie
            res = self._page.request.get(url, timeout=120_000)
            if res.ok:
                return res.body(), res.headers.get("content-type", "")
        if r.status_code >= 400:
            raise Blocked(f"HTTP {r.status_code} downloading {url}")
        return r.content, r.headers.get("content-type", "")

    def _browser(self):
        if not self._page:
            try:
                from playwright.sync_api import sync_playwright
            except ImportError as exc:
                raise Blocked("needs a headless browser: pip install playwright && playwright install chromium") from exc
            self._pw = sync_playwright().start()
            self._page = self._pw.chromium.launch(headless=True).new_page(user_agent=UA)
        return self._page

    def close(self):
        self.http.close()
        if self._pw:
            self._pw.stop()


def _items_or_raise(items: list[Item], source: str) -> list[Item]:
    if not items:
        raise ValueError(f"{source}: parser found no items; the page layout probably changed")
    return items


# S1: JDIH Kemnaker. "sort=terbaru" across all types is not newest-first, but it is per type.
KEMNAKER_TYPES = (2, 3, 4, 5, 8, 9, 10)  # UU, Perppu, PP, Perpres, Peraturan/Keputusan/SE Menteri


def kemnaker(f: Fetcher) -> list[Item]:
    items = []
    for jenis in KEMNAKER_TYPES:
        page = f.get("https://jdih.kemnaker.go.id/peraturan", **{"sort": "terbaru", "jenis[]": jenis})
        for card in page.split('class="result-card"')[1:]:
            a = re.search(r'href="(https://jdih\.kemnaker\.go\.id/peraturan/detail/[^"]+)">(.*?)</a>', card, re.S)
            if not a:
                continue
            about = re.search(r'<p class="description">(.*?)</p>', card, re.S)
            issued = re.search(r"Ditetapkan:\s*([^<]+)", card)
            items.append(Item("kemnaker", clean(a[2]), clean(about[1]) if about else "", a[1],
                              parse_date(issued[1]) if issued else None))
    return _items_or_raise(items, "kemnaker")


# S2: JDIH BPK. Search is full text, so a few queries cover UU/PP/Perpres on the corpus topics.
BPK_QUERIES = ("ketenagakerjaan", "pengupahan", "perjanjian kerja")


def bpk(f: Fetcher) -> list[Item]:
    items = []
    for query in BPK_QUERIES:
        page = f.get("https://peraturan.bpk.go.id/Search", keywords=query, sort="terbaru")
        for card in page.split('<div class="card-body p-xl-10')[1:]:
            links = re.findall(r'href="(/Details/\d+/[^"]+)">(.*?)</a>', card, re.S)  # title, then "tentang"
            if links:
                items.append(Item("bpk", clean(links[0][1]), clean(links[1][1]) if len(links) > 1 else "",
                                  "https://peraturan.bpk.go.id" + links[0][0]))
    return _items_or_raise(items, "bpk")


# S3: provincial JDIH, searched for wage decrees. province: (search url, detail link pattern, needs browser)
REGIONAL = {
    "DKI Jakarta": ("https://jdih.jakarta.go.id/pencarianHome?kata_pencarian=upah+minimum",
                    r"https://jdih\.jakarta\.go\.id/dokumen/detail/\d+/[^\"]+", False),
    "Jawa Tengah": ("https://jdih.jatengprov.go.id/pencarian/pencarian?dokumen=upah+minimum",
                    r"https://jdih\.jatengprov\.go\.id/inventarisasi-hukum/detail/[^\"]+", False),
    "Jawa Barat": ("https://jdih.jabarprov.go.id/page/cari_produk/1/?tentang=upah+minimum&tahun=&daerah=&jenis=",
                   r"https://jdih\.jabarprov\.go\.id/page/info/produk/\d+/[^\"]*", True),
    "DI Yogyakarta": ("https://jdih.jogjaprov.go.id/produk-hukum/peraturan-perundang-undangan?keyword=upah%20minimum",
                      r"/produk-hukum/peraturan-perundang-undangan/detail/[^\"]+", True),
}


def regional(f: Fetcher, province: str) -> list[Item]:
    search, pattern, needs_browser = REGIONAL[province]
    page = f.browse(search) if needs_browser else f.get(search)
    found: dict[str, Item] = {}
    for m in re.finditer(rf'<a[^>]+href="({pattern})"[^>]*>(.*?)</a>', page, re.S):
        text = clean(m[2])
        url = urljoin(search, html.unescape(m[1]))
        if not re.search(r"(?i)\bnomor\b", text) or url in found:
            continue
        title, about = (re.split(r"(?i)\s+tentang\s+", text, maxsplit=1) + [""])[:2]
        if not about:  # Jateng puts "Tentang …" after the link
            after = re.search(r"(?i)\btentang\s+(.{1,250})", clean(page[m.end(): m.end() + 3000]))
            about = after[1] if after else ""
        found[url] = Item(f"jdih-{province}", title, about, url, province=province)
    return _items_or_raise(list(found.values()), f"jdih-{province}")


# S4: MK decisions. The page embeds its list as JSON; the JSON API itself sits behind Cloudflare.
def mk(f: Fetcher) -> list[Item]:
    page = f.browse("https://www.mkri.id/perkara/persidangan/putusan").replace('\\"', '"')
    items = []
    # ponytail: first page only (10 newest); a day with more than 10 decisions can slip past, add paging if that happens
    for raw in re.findall(r'\{"jenisnya":.*?"link_hit":"[^"]*"\}', page):
        try:
            d = json.loads(raw)
        except ValueError:
            continue
        items.append(Item("mk", f"Putusan MK Nomor {d['no_perkara']}", f"{d['pokok_perkara']} ({d['status']})",
                          "https://www.mkri.id/perkara/persidangan/putusan", date.fromisoformat(d["date"][:10]),
                          d["supporting_file"]))
    return _items_or_raise(items, "mk")


# Sites with no parser yet: a plain or headless fetch is walled off or the site search is broken.
# They are still checked daily so the job summary shows when one opens up.
UNPARSED = {
    "dpr": "https://www.dpr.go.id/uu/prolegnas",
    "jdih-Jawa Timur": "https://jdih.jatimprov.go.id/",
    "jdih-Banten": "https://jdih.bantenprov.go.id/produkshukum/search?keyword=upah+minimum",
}


def unparsed(f: Fetcher, url: str) -> list[Item]:
    f.browse(url)  # raises Blocked while the wall is up
    raise Blocked(f"{url} is reachable now, but has no parser yet: add one in sync/sources.py")


# name: (fetch function, required). A required source failing fails the job; the rest are best effort.
SOURCES = {
    "kemnaker": (kemnaker, True),
    "bpk": (bpk, True),
    **{f"jdih-{p}": (partial(regional, province=p), False) for p in REGIONAL},
    "mk": (mk, False),
    **{name: (partial(unparsed, url=url), False) for name, url in UNPARSED.items()},
}
BROWSER_SOURCES = {f"jdih-{p}" for p, (_, _, browser) in REGIONAL.items() if browser} | {"mk"}


def details(f: Fetcher, item: Item) -> None:
    """Fill the official PDF link, and the dates where the detail page has them."""
    if item.pdf_url:
        return
    page = f.browse(item.url) if item.source in BROWSER_SOURCES else f.get(item.url)
    # Kemnaker embeds the regulation as <iframe src="….pdf#toolbar=0">; abstracts, minutes and translations sit beside it.
    # BPK links each PDF twice: /Read/… is an HTML viewer, /Download/… the file.
    links = re.findall(r'(?:href|src)="([^"]+?\.pdf)(?:[#?][^"]*)?"', page, re.I)
    pdfs = [urljoin(item.url, html.unescape(u)) for u in links]
    pdfs = [u for u in pdfs if not re.search(r"(?i)abstrak|datadukung|terjemahan|risalah|jspdf|/Read/\d+/", u)]
    item.pdf_url = pdfs[0] if pdfs else ""
    if item.source == "bpk":
        text = clean(page)
        for label, attr in (("Tanggal Penetapan", "issued"), ("Tanggal Berlaku", "effective")):
            at = text.find(label)
            if at >= 0:
                setattr(item, attr, parse_date(text[at + len(label): at + len(label) + 40]))
