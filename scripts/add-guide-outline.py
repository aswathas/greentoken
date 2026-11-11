#!/usr/bin/env python3
"""
Add a PDF outline (sidebar bookmarks) to the GreenToken study guide.

Chromium's page.pdf() renders the internal TOC links as named destinations but
does not emit an outline tree, so most PDF readers show a flat "no bookmarks"
sidebar even though the Contents page works. This rebuilds the PDF with the
same file and adds a two-level outline: Parts and their sections.

Page numbers are resolved from the named destinations that Chromium already
wrote, so the bookmarks and the printed Contents can never drift apart.

Usage: python3 scripts/add-guide-outline.py [guide.pdf]
"""
import sys
import pathlib

from pypdf import PdfWriter, PdfReader

ROOT = pathlib.Path("/workspace/greentoken")
PDF = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "docs" / "GreenToken-Fabric-Guide.pdf"

# (anchor id, outline title, parent anchor id or None)
TREE = [
    ("p1", "Part 1 — Hyperledger Fabric from first principles", None),
    ("p1-1", "1.2  What a ledger is, and why a database is not enough", "p1"),
    ("p1-2", "1.3  The hash chain — the single most important idea", "p1"),
    ("p1-3", "1.4  The building blocks: MSP, channel, peer, orderer, chaincode", "p1"),
    ("p1-4", "1.5  World state versus the transaction log", "p1"),
    ("p1-5", "1.6  The six-phase transaction lifecycle", "p1"),
    ("p1-6", "1.7  Determinism, endorsement policies, private data", "p1"),
    ("p1-7", "1.8  Fabric versus Ethereum, and what v2.5 changed", "p1"),
    ("p2", "Part 2 — How the GreenToken app works", None),
    ("p2-1", "2.2  One contract, three hosts", "p2"),
    ("p2-2", "2.3  The data model", "p2"),
    ("p2-3", "2.4  The ten chaincode functions", "p2"),
    ("p2-4", "2.5  The cryptography actually used", "p2"),
    ("p2-5", "2.6  The eight trust rules", "p2"),
    ("p2-6", "2.7  What is real and what is emulated", "p2"),
    ("p3", "Part 3 — The demo", None),
    ("p3-1", "3.2  The eight-step run of show — steps 1–4", "p3"),
    ("p3-2", "3.2  The eight-step run of show — steps 5–8", "p3"),
    ("p3-3", "3.3  The tamper moment, in detail", "p3"),
    ("p3-4", "3.4  Presenting on a phone", "p3"),
    ("p3-5", "3.5  When it breaks", "p3"),
    ("p4", "Part 4 — Viva preparation", None),
    ("p4-1", "4.2  The numbers to memorise", "p4"),
    ("p4-2", "4.3  Glossary", "p4"),
    ("apx", "Appendix A — File map and how to run it yourself", None),
    ("apx-2", "Appendix B — Standing up the real Fabric network", "apx"),
    ("apx-3", "Appendix C — References and further reading", "apx"),
]


def main():
    reader = PdfReader(str(PDF))
    dests = reader.named_destinations

    # resolve every anchor to a page index using the READER's own page objects
    page_of = {}
    for anchor, _title, _parent in TREE:
        d = dests.get("/" + anchor)
        if d is None:
            raise SystemExit("named destination missing: /" + anchor)
        page_of[anchor] = reader.get_page_number(d.page)

    writer = PdfWriter(clone_from=str(PDF))

    items = {}
    for anchor, title, parent in TREE:
        kwargs = {}
        if parent:
            kwargs["parent"] = items[parent]
        items[anchor] = writer.add_outline_item(title, page_of[anchor], **kwargs)

    tmp = PDF.with_suffix(".tmp.pdf")
    with tmp.open("wb") as fh:
        writer.write(fh)
    tmp.replace(PDF)

    check = PdfReader(str(PDF))
    print("outline written:", PDF)
    print("pages:", len(check.pages), "| top-level bookmarks:",
          len([i for i in check.outline if not isinstance(i, list)]))


if __name__ == "__main__":
    main()
