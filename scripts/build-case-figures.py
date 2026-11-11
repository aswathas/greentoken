#!/usr/bin/env python3
"""
Extract the case-study figures from the diagram pack.

The diagram pack (docs/diagrams.html) already contains the hand-authored SVG
diagrams. This script lifts the ones the case study needs out of that file,
wraps each as a standalone SVG with its styles inlined, and writes them to
docs/figures/. The PNG versions are produced by scripts/render-case-figures.sh
using headless Chromium.
"""
import pathlib
import re

ROOT = pathlib.Path("/workspace/greentoken")
SRC = ROOT / "docs" / "diagrams.html"
OUT = ROOT / "docs" / "figures"

# figure id -> (output name, caption)
FIGURES = [
    ("d1", "fig-6-1", "GreenToken architecture in Hyperledger Fabric — the five components and the channel"),
    ("d2", "fig-6-2", "The consortium — four member organisations, one channel, one ordering service"),
    ("d3", "fig-7-1", "The six-phase Fabric transaction lifecycle traced through VerifyPlanting"),
    ("d7", "fig-7-2", "One contract, three hosts — the platform-free ChaincodeStub architecture"),
    ("d6", "fig-8-1", "The hash-linked block chain and the localisation of a tamper"),
    ("d8", "fig-9-1", "The GreenToken token state machine and invoice lifecycle"),
]

# The diagram page CSS scopes several rules under `.dg` (the line and box
# classes). A standalone SVG must therefore keep the same root class, or the
# scoped rules stop matching and the open paths fall back to the default black
# fill. The override below restores the page-relative sizing afterwards.
OVERRIDE = """
.dg { width: 100%; height: auto; display: block; }
svg { background: #FFFFFF; }
text { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; }
"""


def main():
    html = SRC.read_text(encoding="utf-8")
    css = re.search(r"<style>(.*?)</style>", html, re.S).group(1)

    OUT.mkdir(parents=True, exist_ok=True)
    written = []
    for pid, name, _caption in FIGURES:
        m = re.search(r'<section class="[^"]*" id="' + pid + r'">(.*?)</section>', html, re.S)
        if not m:
            raise SystemExit("section %s not found" % pid)
        body = m.group(1)
        sm = re.search(r'<svg class="dg" viewBox="0 0 (\d+) (\d+)"[^>]*>(.*?)</svg>', body, re.S)
        if not sm:
            raise SystemExit("svg not found in %s" % pid)
        w, h, inner = int(sm.group(1)), int(sm.group(2)), sm.group(3)
        # keep the marker definitions, drop the probe span if present
        inner = re.sub(r'<span class="probe">.*?</span>', '', inner, flags=re.S)
        svg = (
            '<svg class="dg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + str(w) + " " + str(h) + '" '
            'width="' + str(w) + '" height="' + str(h) + '">'
            "<style>" + css + OVERRIDE + "</style>"
            '<rect x="0" y="0" width="' + str(w) + '" height="' + str(h) + '" fill="#FFFFFF"/>'
            + inner + "</svg>"
        )
        path = OUT / (name + ".svg")
        path.write_text(svg, encoding="utf-8")
        written.append((name, w, h))
        print("%-10s %4dx%-4d  %s" % (name, w, h, path.name))

    # a manifest the DOCX builder reads
    lines = ["name|figure_id|caption"]
    for pid, name, caption in FIGURES:
        lines.append(name + "|" + pid + "|" + caption)
    (OUT / "manifest.txt").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("\nmanifest written:", OUT / "manifest.txt")


if __name__ == "__main__":
    main()
