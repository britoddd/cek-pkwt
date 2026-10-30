"""Run: python sync/test_corpus_sync.py (or pytest). No network, no LLM."""

from datetime import date

import corpus_sync as cs
from sources import Item


def row(**fields) -> dict:
    r = {c: "" for c in cs.COLUMNS} | {"id": "x-1", "regulation": "PP 1/2026", "article": "Pasal 1", "topic": "upah",
                                       "status": "berlaku", "regime": "current", "region": "nasional",
                                       "source_url": "https://peraturan.bpk.go.id/a.pdf", "retrieved_on": "2026-10-30",
                                       "verification": "checked_official"} | fields
    r["text"] = cs.header(r) + "\nIsi pasal."
    return r


def test_verbatim_guard():
    pdf = cs.squash("sesuai ketentuan peraturan perundang-\nundangan  dan/atau syarat kerja yang\ndiatur")
    assert cs.verbatim("sesuai ketentuan peraturan perundang-undangan dan/atau syarat kerja yang diatur", pdf)
    assert not cs.verbatim("sesuai ketentuan peraturan perundang-undangan dan syarat kerja yang diatur", pdf)
    assert not cs.verbatim("syarat kerja", pdf), "short spans prove nothing"


def test_validator():
    corpus = cs.load()
    assert cs.validate(corpus, corpus, cs.COLUMNS) == [], "the committed corpus must pass"
    assert cs.validate([row()]) == []
    assert any("pending_review" in e for e in cs.validate([row(verification=cs.PENDING)]))
    assert any("never be removed" in e for e in cs.validate([row()], base=[row(), row(id="gone")]))
    assert any("header" in e for e in cs.validate([row() | {"text": "[wrong]\nIsi."}]))
    assert any("effective_from" in e for e in cs.validate([row(status="belum_berlaku")]))
    assert cs.validate([row(status="belum_berlaku", effective_from="2027-01-01")]) == []
    assert any(".go.id" in e for e in cs.validate([row(source_url="https://www.detik.com/x")]))
    assert any("duplicate" in e for e in cs.validate([row(), row()]))


def test_changed_rows():
    old = [row(id="a"), row(id="b")]
    new = [row(id="a"), row(id="b", topic="thr"), row(id="c")]
    assert [r["id"] for r in cs.changed(old, new)] == ["b", "c"]


def test_classify_and_relevance():
    corpus = cs.load()
    pp = Item("bpk", "Peraturan Pemerintah (PP) Nomor 49 Tahun 2025",
              "Perubahan Kedua Atas Peraturan Pemerintah Nomor 36 Tahun 2021 tentang Pengupahan", "u")
    assert cs.classify(pp)[:1] == ("pp-2025-49",) and cs.relevant(pp, "pp", corpus)
    skkni = Item("kemnaker", "Keputusan Menteri Ketenagakerjaan Nomor 299 Tahun 2026",
                 "Penetapan Standar Kompetensi Kerja Nasional Indonesia Pendidikan", "u")
    assert not cs.relevant(skkni, cs.classify(skkni)[1], corpus)
    assert cs.classify(Item("kemnaker", "Keputusan Dirjen Nomor 3/3804/PK.01.00/VII/2026", "", "u")) is None
    law = Item("kemnaker", "Undang-Undang Nomor 12 Tahun 2026", "Pelindungan Ketenagakerjaan", "u")
    assert cs.classify(law)[0] == "uu-2026-12" and cs.is_new_law(law, "uu") and cs.relevant(law, "uu", corpus)
    se = Item("kemnaker", "Surat Edaran Menteri Ketenagakerjaan Nomor M/7/HK.04/VII/2026", "Pelaksanaan THR", "u")
    assert cs.classify(se)[0] == "se-menaker-2026-m-7-hk-04-vii-2026"
    granted = Item("mk", "Putusan MK Nomor 12/PUU-XXIV/2026",
                   "Pengujian Materiil Undang-Undang Nomor 6 Tahun 2023 tentang Cipta Kerja (Mengabulkan Sebagian)", "u")
    assert cs.relevant(granted, "mk", corpus)
    assert not cs.relevant(Item("mk", granted.title, granted.about.replace("Mengabulkan Sebagian", "Menolak Seluruhnya"),
                                "u"), "mk", corpus)
    umk = Item("jdih-Jawa Tengah", "Keputusan Gubernur Jawa Tengah Nomor 100.3.3.1/600 Tahun 2026",
               "Upah Minimum Kabupaten/Kota Pada 35 Kabupaten/Kota Di Provinsi Jawa Tengah Tahun 2027", "u",
               province="Jawa Tengah")
    assert cs.relevant(umk, "kepgub", corpus)
    assert not cs.relevant(Item(umk.source, umk.title, umk.about.replace("2027", "2026"), "u", province="Jawa Tengah"),
                           "kepgub", corpus), "the corpus already has 2026"
    assert not cs.relevant(Item(umk.source, umk.title, "Upah Minimum Sektoral Provinsi Tahun 2027", "u",
                                province="Jawa Tengah"), "kepgub", corpus)


def test_wage_amounts():
    assert cs.parse_amount("Rp3.701.709,00") == (3701709, "")
    assert cs.parse_amount("Rp.2.700.926.00") == (2700926, "")
    assert cs.parse_amount("Rp2.698.273,24") == (2698273, "24")
    assert cs.parse_amount("Rp5.729.876") == (5729876, "")
    assert cs.rupiah(2698273, "24") == "Rp2.698.273,24"
    pdf = cs.squash("33. Kota Semarang Rp3.701.709,00 \n4. Kota \nSemarang \nJasa Pekerjaan Konstruksi \n42930 Rp3.721.126,00")
    assert cs.amount_near("Kota Semarang", 3701709, pdf, need_region=True)
    assert not cs.amount_near("Kota Semarang", 3721126, pdf, need_region=True), "sectoral wage, not the UMK"
    assert not cs.amount_near("Kota Semarang", 701709, pdf, need_region=False), "no partial numbers"


def test_wage_row_and_flip():
    corpus = cs.load()
    old = next(r for r in corpus if r["id"] == "um2026-kota-semarang")
    item = Item("jdih-Jawa Tengah", "Keputusan Gubernur Jawa Tengah Nomor 100.3.3.1/600 Tahun 2026",
                "Upah Minimum Kabupaten/Kota Tahun 2027", "u", pdf_url="https://jdih.jatengprov.go.id/x.pdf",
                province="Jawa Tengah")
    d = cs.Draft(item, "kepgub-jawa-tengah-2026-100-3-3-1-600", item.title)
    d.rows = [dict(r) for r in corpus]
    cs.ask = lambda *a: {"wages": [{"region": "Kota Semarang", "amount": "Rp3.901.000,00", "year": 2027},
                                   {"region": "Kota Semarang", "amount": "Rp9.999.999,00", "year": 2027}]}
    cs.draft_wages(d, "35. Kota Semarang Rp3.901.000,00", "Keputusan Gubernur Jawa Tengah No. 100.3.3.1/600 Tahun 2026",
                   date(2026, 12, 1))
    assert len(d.added) == 1 and len(d.rejected) == 1, d.rejected
    new = d.added[0]
    assert new["id"] == "um2027-kota-semarang" and new["effective_from"] == "2027-01-01"
    assert "Rp3.901.000" in new["text"] and "tahun 2027" in new["text"] and "Rp3.701.709" not in new["text"]
    assert cs.validate([new | {"verification": "checked_official"}]) == []
    reviewed = [r | {"verification": "checked_official"} if r["id"] == new["id"] else r for r in d.rows]
    assert cs.flips(reviewed, date(2026, 12, 31)) == {}
    flip = cs.flips(reviewed, date(2027, 1, 1))["flip-2027-01-01"]
    status = {r["id"]: r["status"] for r in flip.rows}
    assert status["um2027-kota-semarang"] == "berlaku" and status["um2026-kota-semarang"] == "tidak_berlaku"
    assert status["um2026-kota-bekasi"] == "berlaku"
    assert cs.validate(flip.rows) == []
    assert old["status"] == "berlaku", "the loaded corpus is never mutated"


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
    print("ok")
