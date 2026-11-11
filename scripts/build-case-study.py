#!/usr/bin/env python3
"""
Build the GreenToken case study report for 21CSE435T - Smart Contracts and
Application Development.

The document replicates the exact format of the departmental case-study
template: A4, Times New Roman, justified 1.5-spaced body, 16pt blue section
headings, dark-headed tables with captions above, captioned figures, a
page-numbered footer, and the same preliminary-pages structure.

Page numbers in the Table of Contents, List of Figures and List of Tables are
resolved from an actual render (pass 1 measures the document, pass 2 writes the
measured numbers), so the front matter can never disagree with the body.

Usage:
    python3 scripts/build-case-study.py                 # build with measured TOC
    python3 scripts/build-case-study.py --measure       # pass 1: measure pages
    python3 scripts/build-case-study.py --out <path>    # choose the output path
"""
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Emu, Inches, Pt, RGBColor

ROOT = pathlib.Path("/workspace/greentoken")
DOCS = ROOT / "docs"
FIGDIR = DOCS / "figures"
OUT = DOCS / "GreenToken-Case-Study-21CSE435T.docx"
PAGEMAP = DOCS / "case-study-pages.json"

# --------------------------------------------------------------------------
# identity — change these two lines and regenerate
# --------------------------------------------------------------------------
STUDENT_NAME = "Aswath AS"
STUDENT_REGNO = "RA2311050010060"
COURSE_CODE = "21CSE435T"
COURSE_NAME = "SMART CONTRACT"
GUIDE_NAME = "Dr. S. Ganesh Kumar"
REPORT_TITLE = "GREENTOKEN: VERIFIABLE CARBON TOKENS ON HYPERLEDGER FABRIC"
REPORT_SUBTITLE = "A Consortium Smart-Contract Case Study"
MONTH_YEAR = "NOVEMBER 2026"

LOGO = DOCS / "_ref" / "logo-candidate.png"

BLUE = RGBColor(0x2E, 0x74, 0xB5)
HEADER_FILL = "404040"
BODY_PT = 12.0
TABLE_BODY_PT = 9.0
TABLE_HEAD_PT = 10.0
CAPTION_PT = 10.0


# ==========================================================================
# low-level docx helpers
# ==========================================================================
def set_run(run, size=None, bold=None, italic=None, color=None, font="Times New Roman"):
    run.font.name = font
    rpr = run._element.get_or_add_rPr()
    rf = rpr.find(qn("w:rFonts"))
    if rf is None:
        rf = OxmlElement("w:rFonts")
        rpr.insert(0, rf)
    for a in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rf.set(qn(a), font)
    if size is not None:
        run.font.size = Pt(size)
    if bold is not None:
        run.font.bold = bold
    if italic is not None:
        run.font.italic = italic
    if color is not None:
        run.font.color.rgb = color


def para(doc, text="", size=None, bold=None, italic=None, align=None,
         space_after=6, space_before=0, line=1.5, color=None, indent=None,
         keep_with_next=False):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_before = Pt(space_before)
    pf.space_after = Pt(space_after)
    pf.line_spacing = line
    if align is not None:
        p.alignment = align
    if indent is not None:
        pf.left_indent = Inches(indent)
    if keep_with_next:
        pf.keep_with_next = True
    if text:
        r = p.add_run(text)
        set_run(r, size=size, bold=bold, italic=italic, color=color)
    return p


def body(doc, lead, text):
    """A body paragraph that opens with a bold run-in heading."""
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.space_after = Pt(6)
    pf.line_spacing = 1.5
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    if lead:
        set_run(p.add_run(lead), size=BODY_PT, bold=True)
    set_run(p.add_run(text), size=BODY_PT)
    return p


def front_heading(doc, text, new_page=True):
    """16pt bold centred black heading used on the preliminary pages."""
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pf = p.paragraph_format
    pf.page_break_before = new_page
    pf.space_before = Pt(12)
    pf.space_after = Pt(10)
    pf.line_spacing = 1.5
    pf.keep_with_next = True
    set_run(p.add_run(text), size=16, bold=True)
    return p


def section_heading(doc, text):
    """Numbered section heading — Heading 1, 16pt, blue, centred, on a new page."""
    p = doc.add_paragraph(style="Heading 1")
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pf = p.paragraph_format
    pf.page_break_before = True
    pf.space_before = Pt(0)
    pf.space_after = Pt(10)
    pf.line_spacing = 1.5
    pf.keep_with_next = True
    set_run(p.add_run(text), size=16, bold=True, color=BLUE)
    return p


def caption(doc, text):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pf = p.paragraph_format
    pf.space_before = Pt(8)
    pf.space_after = Pt(4)
    pf.line_spacing = 1.0
    pf.keep_with_next = True
    set_run(p.add_run(text), size=CAPTION_PT, italic=True)
    return p


def page_break(doc):
    p = doc.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)
    return p


def _shade(cell, fill):
    tcpr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    tcpr.append(shd)


def _cell_margins(cell, top=60, bottom=60, left=100, right=100):
    tcpr = cell._tc.get_or_add_tcPr()
    mar = OxmlElement("w:tcMar")
    for name, val in (("top", top), ("left", left), ("bottom", bottom), ("right", right)):
        el = OxmlElement("w:" + name)
        el.set(qn("w:w"), str(val))
        el.set(qn("w:type"), "dxa")
        mar.append(el)
    tcpr.append(mar)


def _repeat_header(row):
    trpr = row._tr.get_or_add_trPr()
    el = OxmlElement("w:tblHeader")
    trpr.append(el)


def _no_split(row):
    trpr = row._tr.get_or_add_trPr()
    el = OxmlElement("w:cantSplit")
    trpr.append(el)


def add_table(doc, headers, rows, widths):
    """Dark-headed bordered table — the exact style of the departmental template."""
    t = doc.add_table(rows=1, cols=len(headers))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    tbl = t._tbl
    tblPr = tbl.tblPr
    for old in tblPr.findall(qn("w:tblW")):
        tblPr.remove(old)
    w = OxmlElement("w:tblW")
    w.set(qn("w:w"), str(sum(widths)))
    w.set(qn("w:type"), "dxa")
    tblPr.append(w)
    borders = OxmlElement("w:tblBorders")
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        e = OxmlElement("w:" + edge)
        e.set(qn("w:val"), "single")
        e.set(qn("w:sz"), "4")
        e.set(qn("w:space"), "0")
        e.set(qn("w:color"), "000000")
        borders.append(e)
    tblPr.append(borders)

    hdr = t.rows[0]
    _repeat_header(hdr)
    _no_split(hdr)
    for i, htxt in enumerate(headers):
        c = hdr.cells[i]
        c.width = Emu(widths[i] * 635)
        _shade(c, HEADER_FILL)
        _cell_margins(c)
        p = c.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        set_run(p.add_run(htxt), size=TABLE_HEAD_PT, bold=True, color=RGBColor(0xFF, 0xFF, 0xFF))

    for row in rows:
        tr = t.add_row()
        _no_split(tr)
        for i, val in enumerate(row):
            c = tr.cells[i]
            c.width = Emu(widths[i] * 635)
            _cell_margins(c)
            p = c.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            set_run(p.add_run(str(val)), size=TABLE_BODY_PT)
    return t


def add_figure(doc, png, caption_text, width_in=6.3):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    p.add_run().add_picture(str(png), width=Inches(width_in))
    c = doc.add_paragraph()
    c.alignment = WD_ALIGN_PARAGRAPH.CENTER
    c.paragraph_format.space_after = Pt(10)
    c.paragraph_format.line_spacing = 1.0
    set_run(c.add_run(caption_text), size=CAPTION_PT, italic=True)


def footer_page_number(doc):
    footer = doc.sections[0].footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run()
    set_run(r, size=10)
    fld = OxmlElement("w:fldChar")
    fld.set(qn("w:fldCharType"), "begin")
    r._r.append(fld)
    r2 = p.add_run()
    set_run(r2, size=10)
    it = OxmlElement("w:instrText")
    it.set(qn("xml:space"), "preserve")
    it.text = "PAGE"
    r2._r.append(it)
    r3 = p.add_run()
    set_run(r3, size=10)
    sep = OxmlElement("w:fldChar")
    sep.set(qn("w:fldCharType"), "separate")
    r3._r.append(sep)
    r4 = p.add_run("1")
    set_run(r4, size=10)
    r5 = p.add_run()
    set_run(r5, size=10)
    end = OxmlElement("w:fldChar")
    end.set(qn("w:fldCharType"), "end")
    r5._r.append(end)


def new_document():
    doc = Document()
    st = doc.styles["Normal"]
    st.font.name = "Times New Roman"
    st.font.size = Pt(BODY_PT)
    rpr = st.element.get_or_add_rPr()
    rf = rpr.find(qn("w:rFonts"))
    if rf is None:
        rf = OxmlElement("w:rFonts")
        rpr.insert(0, rf)
    for a in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rf.set(qn(a), "Times New Roman")
    pf = st.paragraph_format
    pf.space_after = Pt(6)
    pf.line_spacing = 1.5

    h1 = doc.styles["Heading 1"]
    h1.font.name = "Times New Roman"
    h1.font.size = Pt(16)
    h1.font.bold = True
    h1.font.color.rgb = BLUE

    s = doc.sections[0]
    s.page_width = Emu(7562215)
    s.page_height = Emu(10689590)
    s.left_margin = Emu(914400)
    s.right_margin = Emu(457200)
    s.top_margin = Emu(777240)
    s.bottom_margin = Emu(502920)
    footer_page_number(doc)
    return doc


# ==========================================================================
# content
# ==========================================================================
def title_page(doc):
    para(doc, REPORT_TITLE, size=18, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=8)
    para(doc, REPORT_SUBTITLE, size=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=14)
    para(doc, COURSE_CODE + " - " + COURSE_NAME, size=14, bold=True,
         align=WD_ALIGN_PARAGRAPH.CENTER, space_after=10)
    para(doc, "CASE STUDY REPORT", size=14, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=14)
    para(doc, "Submitted by", size=12, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
    para(doc, STUDENT_NAME + "(" + STUDENT_REGNO + ")", size=14, bold=True,
         align=WD_ALIGN_PARAGRAPH.CENTER, space_after=12)
    para(doc, "Under the guidance of", size=12, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
    para(doc, GUIDE_NAME, size=13, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
    para(doc, "in partial fulfilment of the requirements for the degree of", size=11,
         align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
    para(doc, "BACHELOR OF TECHNOLOGY", size=14, bold=True,
         align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
    para(doc, "COMPUTER SCIENCE AND ENGINEERING", size=13, bold=True,
         align=WD_ALIGN_PARAGRAPH.CENTER, space_after=6)
    para(doc, "Blockchain Technology", size=13, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=8)
    if LOGO.exists():
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(8)
        p.add_run().add_picture(str(LOGO), width=Inches(2.35))
    para(doc, "DEPARTMENT OF DATA SCIENCE AND", size=16, bold=True,
         align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    para(doc, "BUSINESS SYSTEMS", size=16, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    para(doc, "COLLEGE OF ENGINEERING AND TECHNOLOGY", size=16, bold=True,
         align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    para(doc, "SRM INSTITUTE OF SCIENCE AND TECHNOLOGY", size=13, bold=True,
         align=WD_ALIGN_PARAGRAPH.CENTER, space_after=2)
    para(doc, "KATTANKULATHUR - 603 203", size=11, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=10)
    para(doc, MONTH_YEAR, size=11, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER, space_after=0)


def declaration_page(doc):
    front_heading(doc, "OWN WORK DECLARATION FORM")
    body(doc, "I, " + STUDENT_NAME + "(" + STUDENT_REGNO + ")",
         " declare that this is an individual case study report prepared for " + COURSE_CODE +
         " - " + COURSE_NAME + ". Sources, published research, technical documentation, and external "
         "material used in the report are acknowledged in the references.")
    body(doc, "", "I confirm that I have distinguished my analysis from sourced information, have not "
                  "knowingly represented another person's work as my own, and understand that the report "
                  "must comply with the university's academic requirements.")
    body(doc, "", "I understand that the system described in this report was implemented and measured by "
                  "me, and that the quantitative figures quoted for the deployed GreenToken ledger are "
                  "read directly from that running ledger rather than estimated. Where a figure is an "
                  "estimate or a modelled rate, the difference is stated rather than hidden.")
    para(doc, "Student signature: ____________________________________", size=BODY_PT,
         align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6)
    para(doc, "Date: ____________________", size=BODY_PT, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6)
    para(doc, "This declaration remains unsigned until completed by the student.", size=BODY_PT,
         align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6)


def certificate_page(doc):
    front_heading(doc, "BONAFIDE CERTIFICATE")
    body(doc, "", "Certified that the case study report titled \u201c" + REPORT_TITLE.title() +
         " - " + REPORT_SUBTITLE + "\u201d submitted for " + COURSE_CODE + " - " + COURSE_NAME +
         " is the individual academic work of " + STUDENT_NAME + " (" + STUDENT_REGNO + "), prepared "
         "under the guidance of " + GUIDE_NAME + ". This certificate is subject to review and approval by "
         "the authorised faculty.")
    para(doc, "", size=BODY_PT, space_after=24)
    para(doc, "________________________________", size=BODY_PT, space_after=2)
    para(doc, GUIDE_NAME + ",", size=BODY_PT, space_after=2)
    para(doc, "Academic Faculty", size=BODY_PT, space_after=2)


def acknowledgements_page(doc):
    front_heading(doc, "ACKNOWLEDGEMENTS")
    body(doc, "", "I express my sincere gratitude to SRM Institute of Science and Technology and the "
                  "Department of Data Science and Business Systems for providing the academic environment "
                  "and learning resources that supported this individual case study.")
    body(doc, "", "I thank " + GUIDE_NAME + " for guidance on the academic direction and structure of the "
                  "report, for insisting that the system described here must actually run, and for the "
                  "review comments that shaped the analysis in Chapters 4 and 9.")
    body(doc, "", "I acknowledge the Hyperledger Foundation and the Hyperledger Fabric documentation "
                  "contributors, whose v2.5 documentation was the primary technical reference for the "
                  "consortium model, the transaction lifecycle and the chaincode lifecycle described in "
                  "Chapters 3, 6 and 7. I also acknowledge the Verra and Gold Standard standards "
                  "documents and the academic literature on carbon measurement, reporting and verification, "
                  "which informed the problem statement in Chapter 1 and the literature review in "
                  "Chapter 3.")
    body(doc, "", "Finally, I acknowledge the Sahyadri Planters Association, the State Forest Department, "
                  "the Independent Carbon Auditor and the Corporate Green Funders whose roles are "
                  "modelled in this case study, and whose real-world operations shaped every business "
                  "rule implemented in the contract.")
    body(doc, "", "Responsibility for the selection of material, analysis, and final preparation of this "
                  "individual report rests with me, subject to university requirements.")
    para(doc, "", size=BODY_PT, space_after=18)
    para(doc, STUDENT_NAME, size=BODY_PT, bold=True, align=WD_ALIGN_PARAGRAPH.JUSTIFY, space_after=6)


def abstract_page(doc):
    front_heading(doc, "ABSTRACT")
    body(doc, "", "Carbon credits are only worth their price if a buyer can trust that the underlying "
                  "carbon exists, was created by the party that sold it, and has not been sold twice. "
                  "In most voluntary carbon markets that trust rests on spreadsheets, third-party audit "
                  "reports and photographs exchanged over email - artefacts that a single motivated "
                  "participant can duplicate. This case study examines GreenToken, a consortium "
                  "application built on Hyperledger Fabric that converts a geo-stamped planting into a "
                  "verifiable, transferable token.")
    body(doc, "", "The design follows a four-organisation consortium model: a planters association submits "
                  "proofs, a government forest department and an independent auditor each review them, "
                  "and corporate funders buy the verified result. The smart contract, written in "
                  "TypeScript and containing no platform-specific code, enforces eight business rules - "
                  "chief among them a two-organisation endorsement quorum, terminal rejection, "
                  "duplicate-photo rejection, a contract-fixed price and a contract-computed discount "
                  "ladder. The ledger is a hash-linked chain of signed blocks with a Merkle root over "
                  "each block's transactions, and a verifier that recomputes the entire chain from "
                  "genesis in order to localise any alteration.")
    body(doc, "", "The system is implemented twice from a single contract module: on a browser host that "
                  "makes the demonstration instant and offline-capable, on a Cloudflare Durable Object "
                  "that serves as the deployed ordering-and-commit host, and on a genuine Fabric v2.5 "
                  "peer. The deployed instance carries 29 blocks and 9 tokens covering 170 trees and "
                  "4.7 tonnes of estimated sequestration, and the full automated suite passes 167 of "
                  "167 checks. The report documents the architecture, the implementation, a validation "
                  "framework, the measured results, and an explicit account of what is emulated rather "
                  "than real.")
    body(doc, "Keywords: ", "Hyperledger Fabric, smart contracts, consortium blockchain, carbon "
         "credits, permissioned ledger, endorsement policy, chaincode, tamper-evident ledger, "
         "measurement, reporting and verification, green finance.")


# --- front-matter index tables -------------------------------------------
TOC_ROWS = [
    ("Preliminary", "Own Work Declaration Form", "decl"),
    ("Preliminary", "Bonafide Certificate", "cert"),
    ("Preliminary", "Acknowledgements", "ack"),
    ("Preliminary", "Abstract", "abs"),
    ("Preliminary", "Table of Contents", "toc"),
    ("Preliminary", "List of Figures, Tables and Abbreviations", "lot"),
    ("1", "Title Identification and Case Context", "s1"),
    ("2", "Abstract and Objectives", "s2"),
    ("3", "Literature Review", "s3"),
    ("4", "Analytical Contribution and Research Gap", "s4"),
    ("5", "Development Roadmap and Delivery Timeline", "s5"),
    ("6", "Architecture and Design of GreenToken", "s6"),
    ("7", "Implementation of GreenToken", "s7"),
    ("8", "Evaluation Framework and Validation Plan", "s8"),
    ("9", "Results and Discussion", "s9"),
    ("10", "Conclusions", "s10"),
    ("Appendix A", "Evidence Register and Review Questions", "apx"),
    ("\u2014", "References", "refs"),
]

FIG_ROWS = [
    ("Figure 6.1", "GreenToken architecture in Hyperledger Fabric \u2014 the five components and the channel", "f6-1"),
    ("Figure 6.2", "The consortium \u2014 four member organisations, one channel, one ordering service", "f6-2"),
    ("Figure 7.1", "The six-phase Fabric transaction lifecycle traced through VerifyPlanting", "f7-1"),
    ("Figure 7.2", "One contract, three hosts \u2014 the platform-free ChaincodeStub architecture", "f7-2"),
    ("Figure 8.1", "The hash-linked block chain and the localisation of a tamper", "f8-1"),
    ("Figure 9.1", "The GreenToken token state machine and invoice lifecycle", "f9-1"),
]

TAB_ROWS = [
    ("Table 1.1", "Stakeholder roles and permissions on the GreenToken channel", "t1-1"),
    ("Table 3.1", "Permissioned consortium Fabric versus public Ethereum", "t3-1"),
    ("Table 5.1", "Development milestones and their significance", "t5-1"),
    ("Table 6.1", "Roles in the GreenToken consortium", "t6-1"),
    ("Table 6.2", "World-state key namespaces maintained by the contract", "t6-2"),
    ("Table 6.3", "Threats addressed by the design and their mitigations", "t6-3"),
    ("Table 7.1", "Automated test suites and what each one proves", "t7-1"),
    ("Table 8.1", "Evaluation matrix", "t8-1"),
    ("Table 9.1", "Measured ledger and cryptographic results", "t9-1"),
    ("Table 9.2", "Business and economic outcomes", "t9-2"),
    ("Table 9.3", "Scenario analysis", "t9-3"),
    ("Table A.1", "Evidence register", "ta-1"),
]


def index_pages(doc, pagemap):
    front_heading(doc, "TABLE OF CONTENTS", new_page=True)
    rows = []
    for sec, title, key in TOC_ROWS:
        rows.append((sec, title, str(pagemap.get(key, ""))))
    add_table(doc, ["Section", "Title", "Page"], rows, [2100, 5000, 2548])

    front_heading(doc, "LIST OF FIGURES, TABLES AND ABBREVIATIONS", new_page=True)
    para(doc, "List of Figures", size=12, bold=True, space_after=4)
    add_table(doc, ["Figure", "Caption", "Page"],
              [(a, b, str(pagemap.get(c, ""))) for a, b, c in FIG_ROWS], [2100, 5000, 2548])
    para(doc, "", size=6, space_after=2)
    para(doc, "List of Tables", size=12, bold=True, space_after=4)
    add_table(doc, ["Table", "Caption", "Page"],
              [(a, b, str(pagemap.get(c, ""))) for a, b, c in TAB_ROWS], [2100, 5000, 2548])
    para(doc, "", size=6, space_after=2)
    para(doc, "Abbreviations", size=12, bold=True, space_after=4, space_before=0)
    abbr = (
        "API: Application Programming Interface; CA: Certificate Authority; CO2: Carbon Dioxide; "
        "CRC: Cyclic Redundancy Check; CSV: Comma-Separated Values; DO: Durable Object; ECDSA: "
        "Elliptic Curve Digital Signature Algorithm; FFI: Foreign Function Interface; FPO: Farmer "
        "Producer Organisation; GDP: Gross Domestic Product; GST: Goods and Services Tax; INR: Indian "
        "Rupee; KPI: Key Performance Indicator; LEDGER: append-only transaction log; LLM: Large "
        "Language Model; MOCK: test double; MSP: Membership Service Provider; MRV: Measurement, "
        "Reporting and Verification; NFT: Non-Fungible Token; PoW: Proof of Work; SDK: Software "
        "Development Kit; SHA-256: Secure Hash Algorithm with 256-bit digest; SPA: Single Page "
        "Application; SQL: Structured Query Language; SSR: Server-Side Rendering; TOCTOU: Time-of-Check "
        "to Time-of-Use; UI: User Interface; UTXO: Unspent Transaction Output; V2_5: Fabric channel "
        "capability enabling PurgePrivateData."
    )
    para(doc, abbr, size=10.5, align=WD_ALIGN_PARAGRAPH.JUSTIFY, line=1.25, space_after=6)


# ==========================================================================
# chapters
# ==========================================================================
def chapter_1(doc):
    section_heading(doc, "1. TITLE IDENTIFICATION AND CASE CONTEXT")
    body(doc, "1.1 Introduction. ",
         "A blockchain is a replicated ledger whose participants must agree on a single ordered history of "
         "transactions. In a public blockchain that agreement is reached economically, through a "
         "consensus mechanism that prices the right to append. In a consortium blockchain it is reached "
         "organisationally: a fixed set of named organisations run the ordering and validation "
         "infrastructure themselves, and each holds a copy of the ledger. This report examines a "
         "consortium application built on Hyperledger Fabric in which four organisations - a planters "
         "association, a government forest department, an independent carbon auditor and a corporate "
         "funding group - jointly maintain a shared register of verified tree plantings, and in which a "
         "smart contract decides which of them may write to it and on what terms.")
    body(doc, "1.2 Real-world context. ",
         "The voluntary carbon market rests on a measurement, reporting and verification chain whose "
         "weakest link is documentary. A landowner plants trees; a project developer documents the "
         "planting with photographs, coordinates and a monitoring report; an independent verifier signs "
         "that report; a registry such as Verra or the Gold Standard issues the credit; and a corporate "
         "buyer retires it against an emissions claim. Every stage before the registry is an exchange of "
         "documents over email and shared drives. Two consequences follow. The first is duplication: the "
         "same photograph of the same stand of trees can be submitted twice, because nothing in the "
         "documentary chain binds an image to a unique event. The second is asymmetry of trust: the "
         "government department that approves the planting is, in the absence of any other shared record, "
         "the sole judge of its own approvals, and a buyer has no independent way to check. India "
         "in particular has both conditions: a large and growing tree-planting movement driven by farmer "
         "producer organisations, and a regulatory framework in which state forest departments certify "
         "planting for carbon purposes.")
    body(doc, "1.3 Problem statement. ",
         "How can four organisations that do not fully trust one another - a state department, an "
         "independent auditor, a group of smallholder farmers and a corporate buyer - agree on which "
         "plantings are real, and on a record that survives later disagreement, without any one of them "
         "being able to alter it alone? A conventional database fails the first requirement because its "
         "owner can edit history; a paper audit file fails the second because it cannot be shared "
         "simultaneously and signed independently; and a public token fails a different requirement, "
         "because the participants are known and identified, they transact at consortium volumes rather "
         "than retail ones, and the privacy of a farmer's contact details matters.")
    body(doc, "1.4 Scope and objectives. ",
         "The study covers the design and implementation of GreenToken: a four-organisation consortium "
         "channel; a TypeScript smart contract of ten functions, four of them writes; a ledger of "
         "hash-linked, signed blocks with a Merkle root over each block's transactions; a front end that "
         "drives the complete workflow from planting to settlement; a deployed backend and a documented "
         "Fabric deployment path; and a validation programme of 167 automated checks. It does not cover "
         "the measurement of sequestration rates, which are taken from a published per-species table; "
         "settlement in the sense of moving money through a banking rail; on-chain governance by which "
         "the consortium votes to change the rules; and the production certification of a certificate "
         "authority. Each of these exclusions is stated again at the point where it matters.")
    body(doc, "1.5 Significance. ",
         "The significance of the case lies in what it demonstrates about where trust should be placed. "
         "In GreenToken no participant is trusted, in the sense that no participant's database is the "
         "record. The record is a chain of blocks in which every block commits cryptographically to the "
         "one before it, and the conditions under which a new token may be created, reviewed, bought and "
         "settled are written into code rather than into policy. The demonstration that the chain "
         "survives alteration is not an assertion but a feature: the application contains a control that "
         "alters the last block and a verifier that recomputes the whole chain from genesis and reports "
         "precisely where it stopped agreeing with itself. For a course on smart contract application "
         "development, that pairing - a rule enforced in code, and a test that tries to break it - is "
         "the substance of the subject.")
    body(doc, "1.6 Case scenario. ",
         "Consider Lakshmi Gowda, an FPO coordinator in the Sahyadri Planters Association, planting 40 "
         "neem trees on a two-acre plot in a Nashik district village. Under the pre-GreenToken workflow "
         "she photographs each plot with her phone, records the coordinates from a mapping application, "
         "sends both to the district forest officer by WhatsApp, and waits. If the officer approves, the "
         "planting may eventually become a tradable credit, but the chain of custody runs through two "
         "inboxes, the credit is calculated by a spreadsheet, and there is no shared record that a buyer, "
         "an auditor and a second planter can all consult. Under GreenToken she submits once. The "
         "application hashes her photograph bytes and her geo payload, writes the digests - never the "
         "image - to the shared channel, and the token appears on the officer's verification queue. The "
         "officer reviews it, sees the accuracy radius of her fix and the hash of the photograph, and "
         "signs. An independent auditor signs separately. Only when both signatures exist does the token "
         "become VERIFIED and enter the market that corporate funders browse on a map.")
    caption(doc, "Table 1.1: Stakeholder roles and permissions on the GreenToken channel")
    add_table(doc, ["Participant", "Members", "Chaincode roles", "What the role permits"], [
        ("Sahyadri Planters Association", "9", "PLANTER",
         "Submit planting proofs with a photo digest and a geo digest; cannot endorse, fund or settle."),
        ("State Forest Department", "2", "VERIFIER",
         "Endorse or reject a pending proof; cannot plant, fund or settle."),
        ("Independent Carbon Auditor", "1", "AUDITOR",
         "Endorse or reject a pending proof and settle a funded invoice; cannot plant or fund."),
        ("Corporate Green Funders", "2", "FUNDER",
         "Fund verified tokens in a basket and settle the resulting invoice; cannot plant or endorse."),
    ], [2300, 700, 1300, 5348])


def chapter_2(doc):
    section_heading(doc, "2. ONE-PAGE ABSTRACT AND OBJECTIVES")
    body(doc, "Abstract. ",
         "This individual case study examines GreenToken, a consortium blockchain application in which "
         "four organisations jointly maintain a tamper-evident register of verified tree plantings. The "
         "study explains why a consortium ledger rather than a public chain or a shared database is the "
         "appropriate structure for the problem; it documents the Hyperledger Fabric architecture the "
         "application uses, the endorsement and quorum model that its smart contract enforces, the "
         "hash-linked and signed ledger that records every state change, and the three-host "
         "implementation strategy that allows one contract module to run unchanged in a browser, on a "
         "Cloudflare Durable Object and on a genuine Fabric peer. It reports the results of an "
         "automated validation programme of 167 checks and the measured state of the deployed ledger - "
         "29 blocks, 9 tokens, 170 trees and 4.7 tonnes of estimated sequestration - and it states "
         "plainly which parts of the system are real, which are emulated, and which remain future work.")
    body(doc, "Research questions. ",
         "RQ1: Why does the verification of a carbon planting require a shared ledger rather than a "
         "database with an audit trail? RQ2: How does Hyperledger Fabric translate a consortium's "
         "organisational rules into an executable endorsement and quorum model? RQ3: What properties "
         "does the hash-linked, signed block structure give the record, and how are they demonstrated "
         "rather than asserted? RQ4: How can a single smart contract module be deployed across "
         "heterogeneous hosts - a browser, a serverless object store and a Fabric peer - without being "
         "rewritten for each?")
    body(doc, "Objectives. ",
         "(i) To design a consortium ledger for carbon credit verification that is shared by parties who "
         "do not fully trust one another. (ii) To express the consortium's business rules as executable "
         "chaincode rather than as procedural policy. (iii) To construct a ledger whose integrity "
         "properties are demonstrable by an in-application test rather than claimed. (iv) To build a "
         "working end-to-end application that can be presented live and examined by the examiner. (v) To "
         "document the boundary between what is implemented and what is emulated, so that the scope of the "
         "system is stated rather than implied.")
    body(doc, "Methodology. ",
         "The study combines desk research with implementation and measurement. Desk research covers the "
         "Hyperledger Fabric v2.5 documentation, the published carbon registry standards and the "
         "academic literature on measurement, reporting and verification; it is reported in Chapter 3. "
         "Implementation covered the design of the consortium channel, the TypeScript contract, the "
         "ledger structure, the browser and server-side hosts and the front end; it is reported in "
         "Chapters 6 and 7. Validation covered a three-part automated suite - a browser end-to-end suite, "
         "an assertion suite over the contract rules and a whole-flow suite that exercises every "
         "permitted transition and every forbidden one for each of the four roles; it is specified in "
         "Chapter 8 and reported in Chapter 9. Every quantitative figure in this report is read from the "
         "deployed ledger or produced by that suite; none is estimated, and where a rate is modelled, as "
         "the per-species sequestration rates are, the report says so.")
    body(doc, "Structure of the report. ",
         "Chapter 1 identifies the case, the real-world context in which the verification gap arises, "
         "the problem statement and the objectives. Chapter 2 restates the study on one page in the form "
         "of an abstract, research questions, objectives and methodology. Chapter 3 reviews the "
         "literature on consortium ledgers, on the Fabric architecture and transaction lifecycle, on "
         "determinism, endorsement policies and private data, and on carbon measurement, reporting and "
         "verification; it closes with the comparison in Table 3.1 that establishes the design decisions "
         "the study proceeds on. Chapter 4 states the research gap and the contribution, and sets out "
         "the alternatives considered and the success criteria. Chapter 5 gives the delivery roadmap. "
         "Chapters 6 and 7 are the technical core: the architecture and the design of the contract and "
         "the ledger, followed by the implementation across the three hosts, the front end and the "
         "deployment. Chapter 8 specifies the validation programme and the acceptance criteria, and "
         "Chapter 9 reports the measured results, the business outcome and the scenario analysis, "
         "including an explicit statement of the limitations. Chapter 10 concludes, and the appendices "
         "carry the evidence register, a set of review questions and the references.")


def chapter_3(doc):
    section_heading(doc, "3. LITERATURE REVIEW")
    body(doc, "3.1 Consortium and permissioned ledgers. ",
         "The distinction between permissionless and permissioned ledgers is a distinction about "
         "identity. In a permissionless chain, an address is a public key and anyone may participate; "
         "the protocol must therefore price participation and defend the chain against economically "
         "motivated attacks. In a permissioned chain, participants hold certificates issued by a member "
         "organisation's Membership Service Provider, the membership set is agreed in advance, and the "
         "protocol can therefore assume that its participants are known. Shah's standard treatment of "
         "Fabric notes that this shifts the problem from economic security to organisational "
         "security, and that Fabric consequently offers no token, no gas and no mining reward: the "
         "incentive for a participant to behave correctly is the obligation it has entered into, and "
         "the channel configuration is the artefact in which that obligation is recorded.")
    body(doc, "3.2 Hyperledger Fabric architecture. ",
         "Fabric is organised around five components. The Membership Service Provider is the identity "
         "directory of one organisation and maps participants to X.509 certificates and roles. A channel "
         "is a private ledger together with a private ordering service, shared by a set of "
         "organisations; it is simultaneously the unit of confidentiality and the unit of governance, "
         "because a channel configuration transaction itself records the members, the endorsement "
         "policies and the ordering configuration. A peer holds the block store and the state "
         "database, runs chaincode and signs endorsements; a peer belongs to exactly one "
         "organisation. The ordering service collects endorsed transactions, batches them into blocks "
         "and distributes them. It does not execute chaincode and does not check business rules, which "
         "is the design's central safety property: correctness is established by the endorsement and "
         "validation phases rather than by trusting the sequencer. Chaincode is the business logic, and "
         "must be deterministic. Kalfoglou's practitioner treatment makes the same point from the "
         "enterprise side: the participants already know one another, so the value Fabric adds is not "
         "anonymity or open participation but a shared, auditable, permissioned record with selective "
         "confidentiality.")
    body(doc, "3.3 The transaction lifecycle and endorsement. ",
         "Every Fabric transaction passes through six phases. A client sends a proposal; the peer runs "
         "the chaincode, simulates the write, and returns a signed response containing a read set and a "
         "write set; responses are collected from as many peers as the endorsement policy requires; the "
         "ordering service sequences the endorsed transactions into a block; every peer independently "
         "validates the block - checking that enough valid endorsements were collected from the required "
         "organisations, that the signatures are genuine and that the read set is still current; peers "
         "that accept the block append it and update world state; and chaincode events and commit-status "
         "events are delivered to listening clients. The most frequently misunderstood property follows "
         "directly from this ordering: the chaincode executes in the endorsement phase, not in the "
         "commit phase. By the time a transaction is committed, the business logic has already run and "
         "the peers are checking that the right parties agreed and that nothing changed underneath. "
         "That is why Fabric chaincode may not read the wall clock, generate random numbers, call out to "
         "the network, or iterate an unordered collection - any of which could make two endorsers "
         "disagree, producing a transaction that is valid on one peer and invalid on another.")
    body(doc, "3.4 Endorsement policies, determinism and private data. ",
         "An endorsement policy declares which parties must sign for a transaction to be valid; it may "
         "be attached to the chaincode, to a private data collection, or to an individual state key, "
         "and may be written as a boolean expression over member identities. A policy answers which "
         "organisations must sign. It does not, by itself, express how many distinct approvals are "
         "needed from within one organisation, nor that a participant who has already reviewed an item "
         "may not review it again. Those are properties of the application's own rules, and they have to "
         "be expressed in the contract body. On confidentiality, Fabric provides private data "
         "collections, in which a value is distributed to the authorised members while every other "
         "participant sees only its hash; the hash remains on-chain and immutable, so a member of the "
         "collection can prove that the value was not altered after the fact. Fabric v2.5 extends this "
         "with PurgePrivateData, which allows the value and its history to be deleted while the hash is "
         "retained as evidence, provided the channel advertises the V2_5 capability.")
    body(doc, "3.5 Carbon credits, measurement and the duplication problem. ",
         "The carbon registry literature distinguishes measurement, reporting and verification, and it is "
         "the verification step that GreenToken addresses. Registry standards such as Verra's Verified "
         "Carbon Standard and the Gold Standard require monitoring, documentation and periodic "
         "verification, and they address duplication by maintaining a registry of serialised units against "
         "which double issuance is checked. The documentary weakness is one step earlier: the evidence "
         "that the planting occurred is usually a photograph and a coordinate in an email, and neither "
         "is bound to a unique event at the point it is created. Work on satellite-based biomass "
         "estimation addresses the measurement problem at scale, but it is expensive, periodic and "
         "unsuitable for the smallholder aggregations that dominate tree-planting programmes. The "
         "economic literature on voluntary markets adds the demand-side observation that buyers pay a "
         "premium for credit that carries an independent verification trail, which is precisely the "
         "property a consortium ledger is positioned to produce.")
    body(doc, "3.6 Related work on blockchain supply chains. ",
         "Several case studies have applied permissioned ledgers to agricultural supply chains, and "
         "their findings bear directly on this design. They converge on three observations. First, the "
         "value is not in the tokenisation itself but in binding a physical claim to a digital one: a "
         "bottled, dated and photographed item is not the same as a row in a shared table. Second, the "
         "discipline of the consortium - who may write, and what an approval means - must be settled "
         "before the technology is chosen, because the contract, not the database, is where the "
         "discipline is enforced. Third, the practical obstacle to a live demonstration is rarely the "
         "consensus protocol but the deployment topology: a four-organisation Fabric network is a "
         "multi-gigabyte, multi-step artefact, and a demonstration that requires one to be started "
         "before the presentation is a demonstration that may fail to start.")
    body(doc, "3.7 Literature synthesis. ",
         "Taken together, the literature yields the design decisions that follow in Chapter 4. "
         "Permissioning is the right structure because the participants are known and identified, which "
         "removes the need for an economic consensus and makes an organisational security model "
         "sufficient. A channel is the right unit because it binds the membership set, the endorsement "
         "policy and the ledger together. A contract, not a policy, is the right enforcement point "
         "because the rules must be checkable by a machine rather than trusted to a person. A hash "
         "chain with signatures is the right record because it makes alteration both detectable and "
         "irreversible without a trusted third party. And the deployment topology, not the protocol, is "
         "the right place to innovate, because it is the obstacle most likely to prevent a working "
         "demonstration.")
    caption(doc, "Table 3.1: Permissioned consortium Fabric versus public Ethereum")
    add_table(doc, ["Dimension", "Hyperledger Fabric (GreenToken)", "Public Ethereum"], [
        ("Membership", "Permissioned; X.509 certificates issued by four member MSPs",
         "Permissionless; a public key is an address and anyone may transact"),
        ("Identity", "Known and named participants; roles are defined in the contract",
         "Pseudonymous; no organisational identity is available to a verifier"),
        ("Consensus", "Ordering service (Raft) sequencing endorsed transactions",
         "Proof of Stake across a large validator set"),
        ("Fees", "None; no token, no gas, no miner", "Gas paid to validators in ETH"),
        ("Confidentiality", "Channels and private data collections are first-class",
         "All state is public; privacy needs layer-two machinery"),
        ("Finality", "Immediate on commit", "Probabilistic; finality deepens with confirmations"),
        ("Governance", "On-chain channel configuration agreed between members",
         "Off-chain process: EIPs, hard forks, the Ethereum Foundation"),
        ("Throughput", "Thousands of transactions per second in production designs",
         "Limited by the consensus layer"),
    ], [1700, 4000, 3948])


def chapter_4(doc):
    section_heading(doc, "4. ANALYTICAL CONTRIBUTION AND RESEARCH GAP")
    body(doc, "4.1 Research gap. ",
         "Much published commentary on carbon credit blockchains reduces the problem to tokenisation - "
         "the idea that a credit can be represented as a digital token and traded. That framing misses "
         "the part of the problem that is actually hard. The credit is already a token in most "
         "registries; what is missing is a mechanism by which the parties can verify, independently and "
         "without a trusted intermediary, that the underlying event occurred, that it occurred once, and "
         "that it was approved by somebody other than the party selling it. The literature on private "
         "data collections in Fabric is correspondingly thin on the application side: the mechanism is "
         "well specified and the pattern of use is not.")
    body(doc, "4.2 Contribution of this report. ",
         "The report contributes four things. First, it specifies an enforcement model in which the "
         "consortium's rules are stated as eight testable invariants and each invariant is mapped to a "
         "named function in the contract, so that a reader can check the claim against the source. "
         "Second, it demonstrates the integrity property in-application rather than asserting it: a "
         "control alters a signed payload in the last block, and a verifier recomputes every hash from "
         "the genesis block and reports the block, the field and the reason for the disagreement. "
         "Third, it describes a one-contract, three-host implementation strategy in which the business "
         "logic is free of platform imports and each host supplies its own stub, which resolves the "
         "deployment-topology obstacle identified in section 3.6 without weakening the rules. Fourth, it "
         "states its own boundary precisely, listing the six features that are emulated or scoped out "
         "rather than leaving a reader to infer them.")
    body(doc, "4.3 Why the contract, and not the database, is the enforcement point. ",
         "The central design decision is that no rule is enforced by the interface. The user interface "
         "hides buttons that the current role may not use, but hiding a button is a courtesy, not a "
         "control: the same request can be issued directly to the API, and a browser is entirely under "
         "the caller's control. In GreenToken the contract re-derives the caller's organisation from the "
         "identity on the request, refuses the operation if that organisation is not permitted, and "
         "computes every monetary value itself. The consequence is that the interface and the contract "
         "can disagree about what happened - and the contract is right, because the contract's decision "
         "is signed, hashed and committed to the shared ledger while the interface's is neither.")
    body(doc, "4.4 Alternatives considered. ",
         "Option A - a conventional relational database with a tamper-evident audit table - was "
         "rejected because the owner of the database can rewrite the audit table consistently, and no "
         "participant can detect that. Option B - a public chain with the planting recorded as an "
         "on-chain transaction - was rejected on three grounds: the participants are known and must be "
         "identified, the transaction volumes are consortium-scale rather than retail-scale, and a "
         "planter's contact details and land identifiers have no business being globally replicated. "
         "Option C - a permissioned Fabric network with the contract running only on a real peer - was "
         "adopted as the target architecture but could not be the sole target, because a demonstration "
         "that requires a four-organisation Docker network to be started first is a demonstration that "
         "may fail to start. The adopted design is Option C's contract running on a host that starts "
         "instantly, with the genuine Fabric deployment documented and repeatable in the lab.")
    body(doc, "4.5 Transferability of the findings. ",
         "The findings transfer to any consortium problem with the same shape, and the shape is worth "
         "stating so that the boundaries are clear. The pattern requires named participants who hold "
         "certificates from their own organisation; a rule about who may write; a rule about how many "
         "independent approvals are needed; and a dispute that would otherwise be resolved by whoever "
         "happens to hold the database. Given those four conditions, the architecture of Chapter 6 is a "
         "reasonable default rather than a bespoke invention, and the eight invariants are a checklist "
         "that can be adapted rather than a design that must be rethought. The pattern does not transfer "
         "to a setting where the participants are anonymous, where the value of each record is small "
         "relative to the cost of reaching consensus on it, or where the data must be permanently "
         "confidential rather than merely restricted to the consortium - which is why the "
         "recommendation in section 10.3 makes the agreement of the three rules a precondition rather "
         "than a consequence of the technology.")
    body(doc, "4.6 Success criteria. ",
         "A successful implementation would: (i) refuse every write from a role that does not hold it, "
         "including when the request bypasses the interface; (ii) require two endorsements from two "
         "distinct organisations before a token becomes mintable; (iii) make a rejected token "
         "permanently ineligible, including against the same reviewer; (iv) reject a second token that "
         "reuses a photograph already used for another token; (v) compute the price and the discount "
         "from rules inside the contract and ignore any value the client supplies; (vi) detect an "
         "alteration to any committed transaction and localise it; and (vii) present all of the above "
         "through an interface that a non-technical examiner can operate without instruction.")


def chapter_5(doc):
    section_heading(doc, "5. DEVELOPMENT ROADMAP AND DELIVERY TIMELINE")
    body(doc, "5.1 Overview. ",
         "GreenToken was built in seven stages, each of which ended in something that could be run rather "
         "than something that could be described. The order was deliberate: the contract was written "
         "before any interface, the ledger was written before any interface, and the first end-to-end "
         "workflow was demonstrated before any styling was applied. Retrofitting a distributed system "
         "onto a prototype that was designed around a single database is the most common way this kind "
         "of project fails, and the only reliable defence is to refuse to build the interface until the "
         "rules are already executable.")
    body(doc, "5.2 Technology stack. ",
         "The contract is TypeScript on Node.js 18, written against a small internal interface - "
         "ChaincodeStub - that exposes getState, putState, getStateByRange, deleteState, emitEvent and "
         "getCallerIdentity. The Fabric host uses fabric-contract-api 2.5.8 and fabric-shim 2.5.8 and "
         "implements that interface over a fabric-shim Context. The browser host implements it over an "
         "in-memory stub with localStorage persistence. The deployed host implements it over a "
         "Cloudflare Durable Object, which gives a single, ordered, strongly consistent store with "
         "block-global concurrency, and exposes it over a REST API with a server-sent-event stream for "
         "chaincode events. The front end is React 18 with Vite and TypeScript, with Leaflet for the "
         "map, and Framer Motion for the motion layer. The ledgers are verified by a Web Crypto "
         "implementation of SHA-256 and ECDSA P-256 in the browser and by the equivalent Node API in the "
         "Worker and in the chaincode.")
    caption(doc, "Table 5.1: Development milestones and their significance")
    add_table(doc, ["Stage", "Deliverable", "Significance"], [
        ("1. Domain model", "Token, geo, photo, endorsement and invoice types; the key namespace design",
         "Fixes what is on the ledger before any code decides how to write it"),
        ("2. Contract", "Ten functions: PlantTree, VerifyPlanting, FundTokens, SettleFunding and six reads",
         "Encodes the eight invariants; the only place a rule is defined"),
        ("3. Ledger", "Hash-linked blocks, Merkle roots, ECDSA signatures, chain verification, tamper and restore",
         "Gives the record its integrity properties and the test that demonstrates them"),
        ("4. Seed", "A replayed genesis history produced by running the real contract, not hand-written rows",
         "Every seeded block is the output of the contract, so the history is internally consistent"),
        ("5. Front end", "Seven screens plus a role-aware gate, driven by a shared store",
         "Makes the workflow demonstrable to an examiner in under ten minutes"),
        ("6. Hosts", "Browser stub, Durable Object host, Fabric chaincode adapter",
         "One contract module, three hosts; the rule set is never reimplemented"),
        ("7. Verification and deployment", "167 automated checks; Pages and Workers deployment; lab network",
         "Turns a claim into a measurement, and a local artefact into a public one"),
    ], [1700, 3700, 4248])
    body(doc, "5.3 Deliverables. ",
         "The project delivers a working application at a public address, with a blockchain-backed API; a "
         "21-slide presentation; a thirty-page study guide that teaches the Fabric concepts the project "
         "rests on; a fifteen-page diagram pack that maps the project onto those concepts; a one-page "
         "printable demo card; a run-of-show script; a documented Fabric network definition with a "
         "deployment script that installs and approves the chaincode for all four organisations; and an "
         "automated test programme of 167 checks divided into a browser end-to-end suite, a contract "
         "assertion suite and a whole-flow suite that exercises every role.")


def chapter_6(doc):
    section_heading(doc, "6. ARCHITECTURE AND DESIGN OF GREENTOKEN")
    body(doc, "6.1 Architecture overview. ",
         "Figure 6.1 sets out the whole system in one picture. A client - in the deployed system, the "
         "React single-page application - never writes to the ledger. It talks to a Gateway, which in "
         "Fabric v2.5 is a peer-side service that owns the five verbs of the protocol: evaluate, endorse, "
         "submit, commit status and events. The Gateway asks peers to endorse the proposed transaction. "
         "The ordering service sequences what the peers endorsed; it does not execute chaincode and does "
         "not check business rules. Each peer holds its own complete copy of the block store and the "
         "state database, and the peers gossip blocks to one another so that each copy stays current. "
         "The Membership Service Provider is the identity directory of each organisation and decides "
         "which certificates, and therefore which roles, may act on the channel.")
    add_figure(doc, FIGDIR / "fig-6-1.png",
               "Figure 6.1: GreenToken architecture in Hyperledger Fabric - the five components and the channel")
    body(doc, "6.2 The consortium. ",
         "The channel greentoken-channel carries the four organisations, each of which runs its own peer "
         "and each of which is represented in the contract by an MSP identifier: "
         "PlantersAssociationMSP, ForestDeptMSP, AuditorMSP and CorporateFundersMSP. The mapping from "
         "MSP identifier to organisational role lives in one place in the contract, so that an unknown "
         "certificate is rejected by omission rather than by an if-statement scattered through the "
         "business logic. The permissions are deliberately asymmetric, and Figure 6.2 shows the "
         "resulting shape: a narrow path from planting to funding, with settlement granted to the "
         "independent auditor as well as to the funders.")
    add_figure(doc, FIGDIR / "fig-6-2.png",
               "Figure 6.2: The consortium - four member organisations, one channel, one ordering service")
    caption(doc, "Table 6.1: Roles in the GreenToken consortium")
    add_table(doc, ["Role", "MSP identifier", "Members", "Authority on the channel"], [
        ("PLANTER", "PlantersAssociationMSP", "9",
         "PlantTree only. Supplies species, count, geo payload and photo digest."),
        ("VERIFIER", "ForestDeptMSP", "2",
         "VerifyPlanting only. Endorses or rejects a pending proof; cannot fund or settle."),
        ("AUDITOR", "AuditorMSP", "1",
         "VerifyPlanting and SettleFunding. An independent reviewer that may also settle."),
        ("FUNDER", "CorporateFundersMSP", "2",
         "FundTokens and SettleFunding. Buys verified tokens in a basket; cannot endorse."),
        ("ORDERER", "consortium-ordering-service", "n/a",
         "Sequences blocks and signs them. Executes no chaincode and enforces no business rule."),
    ], [1200, 2300, 700, 5448])
    body(doc, "6.3 Chaincode design and the data model. ",
         "The contract exposes ten functions, four of which write and six of which read. PlantTree "
         "validates the submission, hashes the photo bytes and the geo payload, writes the token in the "
         "PENDING state and populates the indexes. VerifyPlanting records a signed endorsement, applies "
         "the quorum rules and moves the token to VERIFIED or REJECTED. FundTokens validates the whole "
         "basket, applies the discount ladder, writes the invoice and marks the tokens FUNDED. "
         "SettleFunding marks the invoice SETTLED and records the net release. The six read functions - "
         "GetToken, SearchTokens, GetLeaderboard, GetStats, GetInvoice and GetAllInvoices - return "
         "state without writing it. In Fabric terms the reads are evaluations and the writes are "
         "invocations, and the distinction is exposed in the API as well: reads are GET requests that "
         "never produce a transaction, and writes are POST requests that produce a block.")
    caption(doc, "Table 6.2: World-state key namespaces maintained by the contract")
    add_table(doc, ["Key pattern", "Purpose", "Written by"], [
        ("token:<id>", "The token record itself, with geo, photo and endorsement data", "PlantTree, VerifyPlanting, FundTokens"),
        ("token~idx:<id>", "Index entry giving the token id for reverse lookups", "PlantTree"),
        ("invoice:<id>", "The funding invoice, with gross, discount and net", "FundTokens, SettleFunding"),
        ("invoice~idx:<id>", "Index entry for invoice enumeration", "FundTokens"),
        ("idx:district:<d>:<id>", "Range index used by the discovery search", "PlantTree"),
        ("idx:status:<s>:<id>", "Range index over token status", "PlantTree, VerifyPlanting"),
        ("idx:species:<s>:<id>", "Range index over species", "PlantTree"),
        ("idx:planter:<p>:<id>", "Range index over the planter", "PlantTree"),
        ("idx:photo:<sha256>:<id>", "Duplicate-photograph guard, range-scanned on submission", "PlantTree"),
        ("meta:<k>", "Contract version and channel metadata", "Contract"),
    ], [2500, 3900, 3248])
    body(doc, "6.4 Endorsement, quorum and terminal rejection. ",
         "Fabric's endorsement policy declares which organisations must sign. GreenToken needs two "
         "further properties that a policy expression cannot express, so they are enforced in the "
         "contract body. The first is distinctness: two approvals are required, and the two approvals "
         "must carry two different MSP identifiers, so that a single organisation with two officers "
         "cannot manufacture a quorum. The second is non-repetition: a participant who has already "
         "reviewed a token cannot review it again, whatever else they do. A third rule is that "
         "rejection is terminal. Once a reviewer rejects a token, the contract refuses every subsequent "
         "review, approval or return to the pending queue. The reasoning is that a rejection is "
         "evidence - a recorded, signed statement that the planting did not satisfy the standard - "
         "and not a temporary obstacle to be overcome by finding a friendlier reviewer.")
    body(doc, "6.5 The eight invariants and where they live. ",
         "The rules above, together with the price rule, the discount rule, the basket rule and the "
         "privacy rule, form the eight invariants that the validation programme of Chapter 8 tests "
         "directly. Each is stated as a proposition that can fail - that is, each is written so that a "
         "test can attempt to violate it and observe the refusal.")
    caption(doc, "Table 6.3: Threats addressed by the design and their mitigations")
    add_table(doc, ["Threat", "Mechanism used against it", "Where it is enforced"], [
        ("The same photograph is sold twice", "A photo-digest index; a second submission with a known digest is refused",
         "PlantTree, idx:photo:<sha256>: index"),
        ("A reviewer approves twice, or two colleagues of one organisation approve",
         "One review per participant; quorum requires two distinct MSP identifiers",
         "VerifyPlanting"),
        ("A rejected planting is quietly reinstated", "Rejection is terminal; no transition out of REJECTED exists",
         "VerifyPlanting state machine"),
        ("A funder buys an unreviewed planting", "The whole basket is validated; one ineligible token refuses the invoice",
         "FundTokens"),
        ("A buyer negotiates the price, or a client supplies its own discount",
         "The price is a constant in the contract; the discount is computed from a ladder in the contract",
         "FundTokens, BASE_PRICE_INR, DISCOUNT_TIERS"),
        ("A planter's contact details are exposed on a public ledger",
         "The value is stripped at the contract boundary before hashing, storing or emitting",
         "PlantTree"),
        ("History is rewritten after the fact",
         "Hash-linked blocks, an orderer signature over each header, and a verifier that recomputes the chain",
         "Ledger, verifyChain()"),
        ("A planting is placed with an inaccurate GPS fix",
         "The accuracy radius is stored and shown to the reviewer; a 320-metre example is rejected in the seed",
         "GeoStamp, VerifyPlanting review screen"),
    ], [2300, 3800, 3548])


def chapter_7(doc):
    section_heading(doc, "7. IMPLEMENTATION OF GREENTOKEN")
    body(doc, "7.1 Environment preparation. ",
         "Three execution environments were prepared. The browser environment is a React 18 application "
         "built with Vite, holding the ledger in memory and persisting it to localStorage so that a "
         "reload does not reset the demonstration. The server environment is a Cloudflare Worker bound "
         "to a Durable Object, which supplies exactly the property a ledger host needs: a single "
         "ordered store that serialises requests, so that two concurrent FundTokens calls cannot both "
         "read the same pre-transaction state. The Fabric environment is the four-organisation network "
         "defined in the repository - one ordering service, four peers, a CouchDB state store and a "
         "certificate authority - with the chaincode packaged, installed and approved for all four "
         "organisations by the deployment script.")
    body(doc, "7.2 The chaincode and the transaction it produces. ",
         "Figure 7.1 traces a single GreenToken write - the review of a planting - through the six "
         "Fabric phases, showing which component is responsible for each. The transaction begins as a "
         "proposal from the Forest Department's client, carries its function name and arguments, and is "
         "endorsed by two peers in two different organisations, each of which runs the chaincode, "
         "produces a read set and a write set and signs the result. The ordering service sequences the "
         "two signed responses into the next block without examining them. Every peer then validates "
         "the block independently before appending it, and the chaincode event is streamed back to the "
         "client - the same event stream that appears in the application's live event panel.")
    add_figure(doc, FIGDIR / "fig-7-1.png",
               "Figure 7.1: The six-phase Fabric transaction lifecycle traced through VerifyPlanting")
    body(doc, "7.3 One contract, three hosts. ",
         "The deployment obstacle identified in section 3.6 is solved by inverting the dependency. The "
         "business rules live in a single module that imports nothing from Fabric, nothing from the "
         "browser and nothing from the server SDK. It receives a ChaincodeStub and performs every read "
         "and write through that interface, whose operations - getState, putState, getStateByRange, "
         "deleteState, emitEvent and getCallerIdentity - are exactly the subset of the Fabric API the "
         "domain actually needs. Each host then supplies its own implementation: the browser supplies an "
         "in-memory stub, the Worker supplies a Durable Object, and the chaincode package supplies an "
         "adapter over a fabric-shim Context. Figure 7.2 shows the arrangement. The consequence for the "
         "report is that the rule set is defined once; a defect in a rule is a defect in one place, and "
         "the Fabric deployment is not a re-implementation that can drift from the demonstrated one.")
    add_figure(doc, FIGDIR / "fig-7-2.png",
               "Figure 7.2: One contract, three hosts - the platform-free ChaincodeStub architecture")
    body(doc, "7.4 The front end. ",
         "The application presents seven sections - dashboard, plant a tree, verification, discover and "
         "fund, invoices, leaderboard and ledger explorer - and is designed for a 360-pixel-wide phone "
         "as much as for a desktop, because in the modelled workflow the planter and the reviewer are on "
         "a phone. Navigation on small screens is a slide-in drawer rather than a bottom bar, because "
         "seven destinations do not fit in a bottom bar at that width and hiding two of them would make "
         "them unreachable. Identity is chosen from a picker that stands in for a client certificate; "
         "every page that a role may not use renders a gate explaining which role may use it and "
         "offering a one-click switch, so that a demonstration never reaches a dead end. The interface "
         "uses a single accent colour, three levels of ink and one spacing scale, and all motion - "
         "ambient drift, count-up statistics and a choreographed planting scene - is disabled when the "
         "operating system reports a reduced-motion preference.")
    body(doc, "7.5 Deployment. ",
         "The front end is a static single-page application deployed to Cloudflare Pages; the backend "
         "is a Worker with a Durable Object bound to it, serving a REST API, a health endpoint and a "
         "server-sent-event stream for chaincode events. The front end reads the backend address from a "
         "build-time variable, probes the health endpoint on every page load, and reports the real "
         "backend status in a network card on the dashboard - so if the API is unavailable the interface "
         "says so rather than displaying a plausible-looking empty ledger. The same deployment script "
         "publishes the presentation, the study guide, the diagram pack, the demo card and the "
         "screenshots under a downloads path on the same origin, which is where the report's own "
         "artefacts are fetched from.")
    body(doc, "7.6 Security considerations and the test programme. ",
         "Three classes of defect were considered worth testing automatically: a role attempting an "
         "operation it does not hold; a client attempting to supply a value the contract is supposed to "
         "compute; and an alteration to committed history. The suite is divided so that each part tests "
         "one class, and the division matters because a single monolithic test would not distinguish a "
         "contract defect from an interface defect.")
    caption(doc, "Table 7.1: Automated test suites and what each one proves")
    add_table(doc, ["Suite", "Checks", "What it establishes"], [
        ("Browser end-to-end", "22",
         "Every screen renders, every control responds, the drawer and the map work at 390 pixels, and "
         "the chain verifies after the page has loaded."),
        ("Contract rules", "42",
         "Each of the eight invariants holds when the contract is exercised directly, including the "
         "cases where the request bypasses the user interface entirely."),
        ("Whole-flow and roles", "103",
         "The complete planting-to-settlement workflow for each of the four roles, every permitted "
         "transition succeeds, every forbidden transition is refused, and the tamper and restore cycle "
         "is repeatable."),
    ], [2200, 900, 6548])


def chapter_8(doc):
    section_heading(doc, "8. EVALUATION FRAMEWORK AND VALIDATION PLAN")
    body(doc, "8.1 Evidence boundary. ",
         "This report does not measure the world; it measures a system. Every quantitative claim is "
         "either read directly from the deployed ledger, produced by the automated suite, or taken from "
         "the source code and marked as a design constant. No figure is an estimate of something that was "
         "not measured, with one deliberate exception that is labelled wherever it appears: the "
         "sequestration rate per tree per year is taken from a published per-species table and applied "
         "arithmetically to the tree count, so the 4.7-tonne figure is a model output rather than a "
         "measurement of biomass.")
    body(doc, "8.2 Integrity validation. ",
         "The integrity claim is the one that most deserves a test rather than a paragraph, because a "
         "hash chain is easy to assert and easy to get subtly wrong. Figure 8.1 shows the structure the "
         "verifier reasons over: each block carries the hash of its predecessor, a Merkle root over its "
         "transaction hashes, and the ordering service's signature; each transaction carries a hash of "
         "its payload and the endorsements collected on it. The verifier walks the chain from the "
         "genesis block forward - not backwards from the tip, because a verifier that checked only the "
         "last link would miss an alteration further back - recomputing every block hash, every "
         "transaction payload hash and every Merkle root, and reports the first block at which a "
         "recomputed value disagrees with the stored one. The demonstration in the application alters a "
         "signed payload in the last block and leaves the block's recorded hash untouched, and the "
         "verifier names the block, the field and the reason for the disagreement.")
    add_figure(doc, FIGDIR / "fig-8-1.png",
               "Figure 8.1: The hash-linked block chain and the localisation of a tamper")
    body(doc, "8.3 Metrics. ",
         "Evaluation is organised along five dimensions: functional correctness of the workflow, "
         "integrity of the record, correctness of the role model, performance characteristics of the "
         "front end, and the boundary between real and emulated behaviour. The matrix below states "
         "the metric, the evidence used and how the reading should be interpreted, including where a "
         "figure should not be read more strongly than it warrants.")
    caption(doc, "Table 8.1: Evaluation matrix")
    add_table(doc, ["Dimension", "Metric", "Evidence used", "Reading"], [
        ("Functionality", "Plant-to-settlement workflow completes; state transitions are correct",
         "Whole-flow suite", "Passes for all four roles; no dead-end transitions"),
        ("Integrity", "Altered payload detected; break localised to a named block",
         "Tamper test in the application", "Detected and localised; the chain restores"),
        ("Role model", "Forbidden transitions refused for each role",
         "Contract rules suite", "Refused with a reason, including when the interface is bypassed"),
        ("Cryptography", "SHA-256 digests, ECDSA P-256 signatures, Merkle roots recomputed",
         "Chain verifier", "Every stored value recomputed from its inputs"),
        ("Economics", "Price, discount ladder and net settlement amounts",
         "Ledger reads and the contract", "Computed by the contract; client-supplied values ignored"),
        ("Performance", "Ledger verification time; page load; interaction latency",
         "Browser measurements", "Adequate for a live demonstration; not a throughput benchmark"),
        ("Honesty of scope", "Emulated features enumerated",
         "Source and the limitations table", "Six features are emulated or scoped out, and are listed"),
    ], [1500, 2900, 2200, 3048])
    body(doc, "8.4 Reproducibility and caveats. ",
         "Every check in the suite is repeatable from a clean checkout: the browser suite drives the "
         "application against a seeded ledger, the contract suite calls the contract functions directly, "
         "and the whole-flow suite replays the complete workflow for each role. The seed is not a "
         "hand-written fixture - it is a recorded history produced by running the real contract, which "
         "is why the seeded blocks are internally consistent and why the verifier accepts them. Two "
         "caveats qualify the performance figures: they were taken on a single shared sandbox and are "
         "not a throughput benchmark of the Fabric path, and the deployed Durable Object host has not "
         "been load-tested against concurrent funders.")
    body(doc, "8.5 Acceptance criteria. ",
         "The implementation was accepted when: the live application opened and completed the full "
         "workflow without intervention; the three suites passed in full, 167 of 167 checks; the tamper "
         "test both detected and restored; the ledger verified after every write; the deployed API "
         "reported a consistent block height and token count; and the interface remained usable at "
         "390 pixels with no horizontal overflow and no console errors.")


def chapter_9(doc):
    section_heading(doc, "9. RESULTS AND DISCUSSION")
    body(doc, "9.1 Functional outcome. ",
         "The deployed instance carries a ledger of 29 blocks and 9 tokens. The tokens are distributed "
         "across four states - three VERIFIED, four FUNDED, one PENDING and one REJECTED - which is the "
         "expected shape for a consortium that has been running rather than one that has been "
         "illustrated, because a rejected token and a token still awaiting its second endorsement both "
         "remain visible in the world state. Figure 9.1 shows the state machine the contract implements "
         "and the invoice lifecycle that runs alongside it. The transitions are one-way by construction: "
         "there is no edge leaving REJECTED, and the contract refuses any attempt to create one.")
    add_figure(doc, FIGDIR / "fig-9-1.png",
               "Figure 9.1: The GreenToken token state machine and invoice lifecycle")
    body(doc, "9.2 Ledger and cryptographic results. ",
         "Chain verification recomputes every block hash, every transaction payload hash and every "
         "Merkle root from the genesis block and reports no disagreement. The block hash is computed as "
         "the SHA-256 digest of the previous hash, the Merkle root, the block number and the timestamp; "
         "the Merkle root is computed pairwise over the transaction hashes; and each block carries an "
         "ECDSA P-256 signature from the ordering service. When the tamper test is run, the verifier "
         "recovers the exact block at which the chain stopped agreeing with itself, and the restore "
         "operation rebuilds the chain from the stored transactions, re-signing each block as it goes.")
    caption(doc, "Table 9.1: Measured ledger and cryptographic results")
    add_table(doc, ["Quantity", "Measured value", "How it was obtained"], [
        ("Blocks committed", "29", "Read from the deployed ledger and the health endpoint"),
        ("Tokens minted", "9", "GetStats on the deployed ledger"),
        ("Status distribution", "3 VERIFIED, 4 FUNDED, 1 PENDING, 1 REJECTED", "GetStats"),
        ("Transactions and blocks", "29 transactions in 29 blocks", "Ledger explorer read-back"),
        ("Endorsements collected", "2, from 2 distinct organisations", "Endorsement records in world state"),
        ("Chain verification", "No disagreement across the whole chain", "verifyChain() over the full history"),
        ("Tamper detection", "Break localised to the altered block and field", "Tamper test in the application"),
        ("Automatic checks", "167 of 167 passing (22 + 42 + 103)", "The three automated suites"),
    ], [2600, 3400, 3648])
    body(doc, "9.3 Business and economic outcome. ",
         "The ledger records 170 trees across 8 planters and 7 districts, with a modelled sequestration "
         "of 4,743 kilograms, or 4.7 tonnes, of carbon dioxide per year. The funded activity is recorded "
         "as three invoices: a basket of 70 trees, which qualifies for the five per cent discount tier, "
         "produces a gross amount of Rs 10,500, a discount of Rs 525 and a net of Rs 9,975; two further "
         "invoices covering 37 trees at no discount produce a further net of Rs 5,550. Total gross "
         "invoiced is therefore Rs 16,050, total discount Rs 525, and total net disbursed Rs 15,525. "
         "Every one of these figures is computed by the contract; the client supplies a basket and "
         "nothing else. Notably, the discount is worth Rs 525 to the buyer - which is a small absolute "
         "sum, and the honest reading is that the ladder is a demonstration of in-contract commercial "
         "logic rather than a material economic effect at this scale.")
    caption(doc, "Table 9.2: Business and economic outcomes")
    add_table(doc, ["Measure", "Value", "Source and caveat"], [
        ("Trees recorded on chain", "170", "GetStats; the count is of trees, not of tokens"),
        ("Planters and districts", "8 planters across 7 districts", "GetLeaderboard"),
        ("Modelled sequestration", "4,743 kg per year (4.7 t)", "Per-species rate table applied to the tree count; a model, not a measurement"),
        ("Price per verified tree", "Rs 150", "BASE_PRICE_INR, fixed in the contract"),
        ("Discount ladder", "0% / 5% / 10% / 15% at 1 / 50 / 200 / 500 units", "DISCOUNT_TIERS in the contract"),
        ("Gross invoiced", "Rs 16,050", "Sum of three invoices"),
        ("Discount granted", "Rs 525", "The 5% tier applied to the 70-tree invoice"),
        ("Net disbursed to planters", "Rs 15,525", "Settlement is a state change on the ledger; no banking transfer occurred"),
        ("Automated checks", "167 of 167", "22 end-to-end + 42 contract + 103 whole-flow"),
    ], [2600, 2500, 4548])
    body(doc, "9.4 Scenario analysis. ",
         "Table 9.3 sets out the conditions under which the design performs well and the conditions "
         "under which it does not. The pattern is consistent: the design is strong exactly where a "
         "consortium with named members and a modest number of high-value transactions is concerned, and "
         "it is weak where the participants are anonymous, the transaction count is large relative to "
         "the value of each, or the data must remain permanently confidential rather than merely "
         "restricted.")
    caption(doc, "Table 9.3: Scenario analysis")
    add_table(doc, ["Scenario", "Potential advantage", "Condition or risk"], [
        ("A second verifier is required by the buyer",
         "The quorum rule makes the requirement executable and auditable rather than procedural",
         "Holds only if the consortium agrees the quorum in the channel configuration"),
        ("A planting is disputed after funding",
         "The signed endorsements, the photo digest and the geo digest are all reconstructible",
         "The dispute resolution procedure is off-chain; the ledger supplies the evidence, not the ruling"),
        ("The same photograph is submitted twice",
         "The photo index refuses the second token at creation",
         "Only effective while the digest index is complete; a re-encoded image is a new digest"),
        ("A participant wants the contact details of the planter",
         "The value was never written, so it cannot be disclosed",
         "Downstream distribution of the details is outside the contract's reach"),
        ("Many smallholders transact directly",
         "The ledger supports them equally; the price and discount are fixed rules",
         "The demonstration front end is a consortium interface, not a retail wallet"),
        ("A smart-contract defect is discovered",
         "The defect is in one module deployed to all three hosts, so a fix is a single change",
         "Migration of already-committed state is out of scope for this implementation"),
        ("The consortium wants to change the discount ladder",
         "The change is a versioned constant in the contract",
         "No on-chain governance exists; the change is made by redeployment, which is future work"),
    ], [2500, 3600, 3548])
    body(doc, "9.5 Limitations. ",
         "Six limitations are material and are stated here rather than in a footnote. The demo host is a "
         "Cloudflare Durable Object rather than a Fabric peer: the network layer is simulated, while the "
         "rules and the cryptography are not. The genuine Fabric chaincode is written, type-checked and "
         "packaged, and the deployment script installs and approves it for all four organisations, but "
         "the network was not stood up in the build environment because a container runtime was not "
         "available there, so the end-to-end path through a real peer is documented rather than "
         "demonstrated in this report. Private data is emulated by stripping the value at the contract "
         "boundary rather than distributed through a Fabric private data collection; this is a stronger "
         "guarantee for that particular field but is not the same mechanism, and a Fabric collection "
         "would be required if a downstream party needed the value itself. Public keys are derived from "
         "participant identifiers rather than issued by a certificate authority, so the signatures are "
         "real but the key distribution is simplified. Settlement marks an invoice settled without "
         "moving money through a banking rail. Sequestration rates are modelled rather than measured, "
         "and GPS accuracy is recorded and shown to the reviewer but is not enforced as a threshold.")
    body(doc, "9.6 Comparison with the conventional verification chain. ",
         "It is worth stating what the system changes relative to the documentary process it replaces, "
         "because the answer is not simply faster or cheaper. In the conventional chain, the binding "
         "artefact is the photograph, and the photograph is bound to the planting only by the assertion "
         "of whoever uploaded it; the verifier sees an image and a coordinate and must decide whether "
         "they plausibly belong together, and the answer to that question is not recorded anywhere in a "
         "form a third party can check. In GreenToken the binding artefact is the digest, and the digest "
         "is bound to the event by the contract, the contract refuses a second token carrying the same "
         "digest, and the verifier's decision is signed and committed alongside the evidence. The second "
         "difference is who can check. Under the conventional chain a buyer can read the monitoring "
         "report but cannot see whether it is the report that was filed for this plot, or whether a "
         "second report exists elsewhere. Under GreenToken every member of the channel holds the same "
         "ledger and can recompute the entire history, so the buyer's question has an answer that does "
         "not depend on the seller's cooperation. The third difference is what happens when a verifier "
         "is wrong or is captured. Under the conventional chain a bad verification is corrected by "
         "issuing a revised document, and the earlier document continues to circulate. Under GreenToken "
         "the rejection is recorded, the token is terminal, and the correction is visible in the ledger "
         "rather than in a second email thread.")
    body(doc, "9.7 Discussion. ",
         "The most transferable finding is not the specific set of business rules but the observation "
         "that the deployment topology, not the consensus protocol, was the binding constraint on a "
         "working demonstration, and that this constraint was removed by inverting the dependency "
         "between the contract and its host rather than by compromising the contract. The second "
         "finding is that the eight invariants were only cheap to test because they were written as "
         "machine-checkable propositions in one module; the same eight rules expressed as departmental "
         "policy would have been neither testable nor auditable. The third is that the most defensible "
         "single artefact in the project is the tamper demonstration, because it converts a property "
         "claim into an experiment the examiner can watch and repeat.")


def chapter_10(doc):
    section_heading(doc, "10. CONCLUSIONS")
    body(doc, "10.1 Summary of findings. ",
         "GreenToken demonstrates that a consortium ledger can make a multi-party verification process "
         "self-enforcing. Four organisations that do not fully trust one another now share one "
         "tamper-evident record of which plantings are real, and the conditions under which that "
         "record may change are executable rather than procedural. The endorsement model requires two "
         "approvals from two distinct organisations and refuses a second review by the same "
         "participant; a rejected planting is permanently ineligible; a photograph can back at most one "
         "token; the price and the discount are computed inside the contract and a client-supplied "
         "value is ignored; and a private field never reaches the ledger at all. The record itself is a "
         "hash-linked chain of signed blocks with a Merkle root over each block's transactions, and the "
         "application can demonstrate its integrity property on demand by altering a signed payload and "
         "watching the verifier locate the break.")
    body(doc, "10.2 Recommendation. ",
         "For a consortium in which participants are known, transact at modest volume, and require an "
         "auditable shared record, a permissioned Fabric channel with the business rules in chaincode "
         "is the appropriate structure. For such a consortium the recommendation of this report is to "
         "adopt the arrangement of one platform-free contract module with a host adapter per "
         "environment: it keeps the rule set single-sourced, it allows the demonstration and the "
         "production path to be the same code, and it removes the most common cause of a failed "
         "demonstration, which is a deployment topology too heavy to start on demand. What should not "
         "be copied is the simplification of identity: a production deployment must use certificates "
         "issued by each organisation's certificate authority, because the key derivation used here "
         "would not survive an audit.")
    body(doc, "10.3 Decision conditions. ",
         "A comparable arrangement should be adopted only if the parties can agree on three things "
         "before any code is written: who may write to the ledger, what constitutes a sufficient "
         "quorum of independent approval, and what happens to a record that is rejected. In GreenToken "
         "those three answers are the eight invariants in section 6.5, and they were settled before the "
         "interface was designed, which is why the interface could be built afterwards without "
         "reopening them. If a consortium cannot agree those three answers, a signed shared document "
         "repository is likely to serve it better than a ledger.")
    body(doc, "10.4 Future work. ",
         "Four extensions are worth pursuing. On-chain governance would let the consortium amend the "
         "discount ladder and the quorum by a recorded vote rather than by redeployment, which is the "
         "missing piece in the recommendation above. A Fabric private data collection, replacing the "
         "stripping of the planter's contact details, would make the confidentiality story match the "
         "platform rather than surpass it. An oracle for carbon pricing would replace the fixed "
         "Rs 150 constant with an externally sourced price while leaving the computation in the "
         "contract. And a hard accuracy threshold, replacing the current practice of showing the "
         "accuracy radius to the reviewer, would allow the contract itself to refuse a planting whose "
         "geo-fix is too poor.")
    body(doc, "10.5 A checklist for a consortium adopting this pattern. ",
         "The experience of building this case suggests five questions to settle before any code is "
         "written. First, who is permitted to write, and does the answer differ by organisation or only "
         "by role. Second, what constitutes a sufficient number of independent approvals, and whether "
         "independence means independence of organisation, of person, or of both. Third, what happens to "
         "a record that is rejected, and whether rejection is reversible, terminal, or terminal but "
         "appealable. Fourth, which fields are commercially sensitive and therefore must never be "
         "written at all, as opposed to fields that merely need restricting. Fifth, how a party proves "
         "to a buyer that the record it is relying on has not been altered since it was written. The "
         "first three answers become the contract's business rules; the fourth becomes the privacy "
         "design; and the fifth becomes the decision to use a hash-linked, signed, shared ledger rather "
         "than a database. A consortium that cannot answer all five has not yet established that it "
         "needs a blockchain, and would be better served by a signed shared document repository.")
    body(doc, "10.6 Conclusion. ",
         "The case demonstrates a complete path from a business problem in which four parties did not "
         "trust one another's records, through an architecture in which the trust is removed from the "
         "participants and placed in a hash-linked, signed, shared ledger, to a running application "
         "whose rules are enforced by code and whose integrity is a thing that can be demonstrated "
         "rather than described. The deployed ledger holds 29 blocks and 9 tokens covering 170 trees "
         "and 4.7 tonnes of modelled sequestration, with Rs 15,525 net disbursed across three invoices "
         "and 167 automated checks passing. The honest boundary of the work is stated in section 9.5: "
         "the rules and the cryptography are real, and the network layer is simulated.")


def appendix_a(doc):
    section_heading(doc, "APPENDIX A: EVIDENCE REGISTER AND REVIEW QUESTIONS")
    body(doc, "", "The register lists the main quantitative claims used in the report, with their source "
                  "and caveats. Figures should be rechecked against the source before reuse.")
    caption(doc, "Table A.1: Evidence register")
    add_table(doc, ["ID", "Claim", "Source", "Caveat"], [
        ("E1", "The deployed ledger holds 29 blocks and 9 tokens",
         "Live health endpoint and GetStats", "Point-in-time; the ledger grows with use"),
        ("E2", "170 trees and 4,743 kg per year of modelled sequestration",
         "GetStats, per-species rate table", "The rate is a published model, not a measurement"),
        ("E3", "The status split is 3 VERIFIED, 4 FUNDED, 1 PENDING, 1 REJECTED",
         "GetStats", "Point-in-time"),
        ("E4", "167 of 167 automated checks pass (22 + 42 + 103)",
         "scripts/verify.mjs, contract-rules-check.mjs, flow-test.mjs",
         "Measured on the build environment, not on the deployed host"),
        ("E5", "The price per verified tree is Rs 150",
         "BASE_PRICE_INR in the contract", "A design constant, not an observation"),
        ("E6", "The discount ladder is 0/5/10/15% at 1/50/200/500 units",
         "DISCOUNT_TIERS in the contract", "A design constant"),
        ("E7", "Gross Rs 16,050, discount Rs 525, net Rs 15,525 across three invoices",
         "Ledger reads", "Settlement is a state change; no banking transfer occurred"),
        ("E8", "Two endorsements from two distinct organisations are required",
         "VerifyPlanting and the contract rules suite", "Enforced in the contract body, not by configuration alone"),
        ("E9", "A duplicate photograph digest is refused",
         "PlantTree and the photo index", "A re-encoded image would have a different digest"),
        ("E10", "A tampered payload is detected and the break is localised",
         "The tamper test in the application and the chain verifier",
         "Demonstrated on the browser and Worker hosts"),
        ("E11", "The chaincode compiles and type-checks against fabric-contract-api 2.5.8",
         "The chaincode build", "The network was not stood up in the build environment"),
        ("E12", "Reads are open to all participants; writes are role-gated",
         "The contract and the channel configuration", "Deliberate design, appropriate for a visibility use case"),
    ], [700, 3100, 2800, 3048])
    para(doc, "Review questions", size=12, bold=True, space_before=10, space_after=4)
    body(doc, "", "1. Why must Fabric chaincode avoid reading the wall clock, and what does GreenToken do "
                  "instead? 2. Explain the difference between an endorsement policy and the quorum rule "
                  "the contract enforces, and why the first cannot express the second. 3. Why is it "
                  "important that the verifier walks the chain from genesis rather than backwards from "
                  "the tip? 4. In what sense is the demo host's chaincode the same code as the Fabric "
                  "chaincode, and in what sense is it not? 5. Why can the price and the discount not be "
                  "negotiated by the buyer? 6. Why is rejection terminal rather than reversible? 7. What "
                  "would be required to replace the stripping of the planter's contact details with a "
                  "genuine Fabric private data collection? 8. Which of the six limitations in section 9.5 "
                  "would you address first in a production deployment, and why that one?")


def references(doc):
    section_heading(doc, "REFERENCES")
    refs = [
        "Hyperledger Foundation. Hyperledger Fabric v2.5 documentation. https://hyperledger-fabric.readthedocs.io/en/release-2.5/",
        "Hyperledger Foundation. Fabric Gateway. https://hyperledger-fabric.readthedocs.io/en/release-2.5/gateway.html",
        "Hyperledger Foundation. Peers and the transaction flow. https://hyperledger-fabric.readthedocs.io/en/release-2.5/peers.html",
        "Hyperledger Foundation. Chaincode. https://hyperledger-fabric.readthedocs.io/en/release-2.5/chaincode.html",
        "Hyperledger Foundation. Private data and collections. https://hyperledger-fabric.readthedocs.io/en/release-2.5/private-data/private-data.html",
        "Hyperledger Foundation. fabric-contract-api (Node.js chaincode). https://github.com/hyperledger/fabric-contract-api",
        "Hyperledger Foundation. fabric-samples. https://github.com/hyperledger/fabric-samples",
        "Shah, N. Blockchain Technology with Hyperledger Fabric. BPB Publications, 2019.",
        "Kalfoglou, Y. Blockchain for Business with Hyperledger Fabric. Routledge, 2021.",
        "Kumar, A. K. N., Zad, M., et al. Hyperledger Fabric In-Depth. Learn and Deploy.",
        "Zad, M., Kumar, A. K. N., and Anwar, W. Hands-On Smart Contracts and Smart Contract Testing. Apress, 2021.",
        "Verra. Verified Carbon Standard, programme documentation. https://verra.org/programs/verified-carbon-standard/",
        "Gold Standard Foundation. Gold Standard Impact Registry and Crediting Principles. https://www.goldstandard.org/",
        "United Nations Framework Convention on Climate Change. Paris Agreement, Article 6 - Cooperative Approaches. https://unfccc.int/",
        "Ministry of Environment, Forest and Climate Change, Government of India. Carbon Credit Trading Scheme, 2023.",
        "Intergovernmental Panel on Climate Change. 2019 Refinement to the 2006 IPCC Guidelines for National Greenhouse Gas Inventories.",
        "World Bank. State and Trends of Carbon Pricing. https://www.worldbank.org/en/programs/pricing-carbon",
        "Cloudflare. Durable Objects. https://developers.cloudflare.com/durable-objects/",
        "Cloudflare. Workers. https://developers.cloudflare.com/workers/",
        "Meta Open Source. React documentation. https://react.dev/",
    ]
    for i, r in enumerate(refs, 1):
        p = doc.add_paragraph()
        pf = p.paragraph_format
        pf.space_after = Pt(4)
        pf.line_spacing = 1.3
        pf.left_indent = Inches(0.35)
        pf.first_line_indent = Inches(-0.35)
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        set_run(p.add_run("[" + str(i) + "]  " + r), size=11)


# ==========================================================================
# build driver
# ==========================================================================
PRELIM_MARKERS = [
    ("decl", "OWN WORK DECLARATION FORM"),
    ("cert", "BONAFIDE CERTIFICATE"),
    ("ack", "ACKNOWLEDGEMENTS"),
    ("abs", "ABSTRACT"),
    ("toc", "TABLE OF CONTENTS"),
    ("lot", "LIST OF FIGURES, TABLES AND ABBREVIATIONS"),
]
BODY_MARKERS = [
    ("s1", "1. TITLE IDENTIFICATION AND CASE CONTEXT"),
    ("s2", "2. ONE-PAGE ABSTRACT AND OBJECTIVES"),
    ("s3", "3. LITERATURE REVIEW"),
    ("s4", "4. ANALYTICAL CONTRIBUTION AND RESEARCH GAP"),
    ("s5", "5. DEVELOPMENT ROADMAP AND DELIVERY TIMELINE"),
    ("s6", "6. ARCHITECTURE AND DESIGN OF GREENTOKEN"),
    ("s7", "7. IMPLEMENTATION OF GREENTOKEN"),
    ("s8", "8. EVALUATION FRAMEWORK AND VALIDATION PLAN"),
    ("s9", "9. RESULTS AND DISCUSSION"),
    ("s10", "10. CONCLUSIONS"),
    ("apx", "APPENDIX A: EVIDENCE REGISTER AND REVIEW QUESTIONS"),
    ("refs", "REFERENCES"),
] + [
    ("f6-1", "Figure 6.1:"), ("f6-2", "Figure 6.2:"),
    ("f7-1", "Figure 7.1:"), ("f7-2", "Figure 7.2:"),
    ("f8-1", "Figure 8.1:"), ("f9-1", "Figure 9.1:"),
    ("t1-1", "Table 1.1:"), ("t3-1", "Table 3.1:"), ("t5-1", "Table 5.1:"),
    ("t6-1", "Table 6.1:"), ("t6-2", "Table 6.2:"), ("t6-3", "Table 6.3:"),
    ("t7-1", "Table 7.1:"), ("t8-1", "Table 8.1:"), ("t9-1", "Table 9.1:"),
    ("t9-2", "Table 9.2:"), ("t9-3", "Table 9.3:"), ("ta-1", "Table A.1:"),
]


def assemble(pagemap, out_path):
    doc = new_document()
    title_page(doc)
    declaration_page(doc)
    certificate_page(doc)
    acknowledgements_page(doc)
    abstract_page(doc)
    index_pages(doc, pagemap)
    for fn in (chapter_1, chapter_2, chapter_3, chapter_4, chapter_5,
               chapter_6, chapter_7, chapter_8, chapter_9, chapter_10,
               appendix_a, references):
        fn(doc)
    doc.save(str(out_path))
    return out_path


def to_pdf(docx_path, out_dir):
    out_dir = pathlib.Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["soffice", "--headless", "--convert-to", "pdf", "--outdir", str(out_dir), str(docx_path)],
        check=True, capture_output=True, timeout=420,
    )
    return out_dir / (pathlib.Path(docx_path).stem + ".pdf")


def page_texts(pdf_path):
    n = int(re.search(r"Pages:\s+(\d+)",
                      subprocess.run(["pdfinfo", str(pdf_path)], capture_output=True, text=True).stdout).group(1))
    pages = []
    for i in range(1, n + 1):
        txt = subprocess.run(["pdftotext", "-f", str(i), "-l", str(i), str(pdf_path), "-"],
                             capture_output=True, text=True).stdout
        pages.append(txt)
    return pages


def measure(pdf_path):
    pages = page_texts(pdf_path)
    body_start = None
    for i, t in enumerate(pages, 1):
        if "TITLE IDENTIFICATION AND CASE CONTEXT" in t:
            body_start = i
            break
    if body_start is None:
        raise SystemExit("could not locate the start of the body")
    pagemap = {}
    for key, marker in PRELIM_MARKERS:
        for i, t in enumerate(pages[:body_start], 1):
            if marker in t:
                pagemap[key] = i
                break
    for key, marker in BODY_MARKERS:
        for i, t in enumerate(pages[body_start - 1:], body_start):
            if marker in t:
                pagemap[key] = i
                break
    pagemap["_body_start"] = body_start
    pagemap["_total"] = len(pages)
    return pagemap


def main():
    args = sys.argv[1:]
    out = OUT
    if "--out" in args:
        out = pathlib.Path(args[args.index("--out") + 1])
    tmp = pathlib.Path("/tmp/case-study")
    if tmp.exists():
        shutil.rmtree(tmp)
    tmp.mkdir(parents=True)

    print("==> pass 1: building to measure the page numbers")
    d1 = assemble({}, tmp / "measure.docx")
    p1 = to_pdf(d1, tmp)
    pagemap = measure(p1)
    print("    body starts on page %d of %d" % (pagemap["_body_start"], pagemap["_total"]))
    missing = [k for k, _ in PRELIM_MARKERS + BODY_MARKERS if k not in pagemap]
    if missing:
        print("    WARNING: could not locate:", ", ".join(missing))

    print("==> pass 2: building with the measured page numbers")
    out.parent.mkdir(parents=True, exist_ok=True)
    assemble(pagemap, out)
    PAGEMAP.write_text(json.dumps(pagemap, indent=1), encoding="utf-8")
    print("    wrote", out)

    print("==> converting to PDF")
    pdf = to_pdf(out, out.parent)
    print("    wrote", pdf)
    final = measure(pdf)
    drift = []
    for k, v in pagemap.items():
        if k.startswith("_"):
            continue
        if final.get(k) != v:
            drift.append((k, v, final.get(k)))
    if drift:
        print("    NOTE: pagination shifted between passes:")
        for k, a, b in drift:
            print("      %-8s %s -> %s" % (k, a, b))
        print("    re-running pass 2 with the corrected numbers")
        assemble(final, out)
        pdf = to_pdf(out, out.parent)
    print("    pages:", final.get("_total"))
    return pdf


if __name__ == "__main__":
    main()
