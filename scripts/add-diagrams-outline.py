#!/usr/bin/env python3
"""
Add a PDF outline (sidebar bookmarks) to the GreenToken diagrams document.

Chromium renders the internal Contents links as named destinations but emits no
outline tree, so most readers show a flat "no bookmarks" sidebar even though
the Contents page works. This rebuilds the PDF with the same file and adds a
two-level outline matching the printed Contents.

Page numbers are resolved from the named destinations Chromium already wrote,
so the bookmarks and the printed Contents cannot drift apart.

Usage: python3 scripts/add-diagrams-outline.py [diagrams.pdf]
"""
import sys
import pathlib

from pypdf import PdfWriter, PdfReader

ROOT = pathlib.Path("/workspace/greentoken")
PDF = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "docs" / "GreenToken-Fabric-Diagrams.pdf"

# (anchor id, outline title, parent anchor id or None)
TREE = [
    ("d1", "D1  ·  Fabric in one picture", None),
    ("d2", "D2  ·  The consortium — four organisations, one channel", None),
    ("d3", "D3  ·  The six-phase transaction lifecycle", None),
    ("d4", "D4  ·  Endorsement and quorum anatomy", None),
    ("d5", "D5  ·  Ledger anatomy — blocks, transactions, Merkle root, world state", None),
    ("d6", "D6  ·  The hash chain and how tampering is localised", None),
    ("d7", "D7  ·  One contract, three hosts", None),
    ("d8", "D8  ·  The token state machine and the end-to-end flow", None),
    ("d9", "D9  ·  The eight trust rules, mapped to code", None),
    ("d10", "D10  ·  Determinism and private data", None),
    ("d11", "D11  ·  Reads versus writes, and what the Gateway does", None),
    ("d12", "D12  ·  What is real and what is emulated", None),
    ("d13", "D13  ·  One-page revision sheet", None),
]


def main():
    reader = PdfReader(str(PDF))
    dests = reader.named_destinations

    # Resolve pages from the page objects' indirect references. pypdf's
    # get_page_number() mis-resolves named destinations that carry a plain page
    # dictionary rather than the page object itself, which shifts every
    # bookmark by one — so the idnum map is used instead.
    page_index = {}
    for i, page in enumerate(reader.pages):
        page_index[page.indirect_reference.idnum] = i

    page_of = {}
    for anchor, _title, _parent in TREE:
        d = dests.get("/" + anchor)
        if d is None:
            raise SystemExit("named destination missing: /" + anchor)
        ref = d.page.indirect_reference
        if ref.idnum not in page_index:
            raise SystemExit("destination /%s does not resolve to a page" % anchor)
        page_of[anchor] = page_index[ref.idnum]

    writer = PdfWriter(clone_from=str(PDF))
    items = {}
    for anchor, title, parent in TREE:
        kwargs = {"parent": items[parent]} if parent else {}
        items[anchor] = writer.add_outline_item(title, page_of[anchor], **kwargs)

    tmp = PDF.with_suffix(".tmp.pdf")
    with tmp.open("wb") as fh:
        writer.write(fh)
    tmp.replace(PDF)

    check = PdfReader(str(PDF))
    print("outline written:", PDF)
    print("pages:", len(check.pages), "| bookmarks:", len(check.outline))
    for anchor, title, _p in TREE:
        print("   /%-4s -> page %2d   %s" % (anchor, page_of[anchor] + 1, title))


if __name__ == "__main__":
    main()
