"""Extract reviewed source passages. Run locally, not during the Netlify build.

Usage: python tools/extract-laws-ro.py PATH_TO_ROMANIAN_PDF
Requires pypdf. No translation, inferred references, or keyword ranking.
"""
import hashlib
import json
from pathlib import Path
import re
import sys

from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1])
definitions = json.loads((root / "laws/references.json").read_text(encoding="utf-8"))
questions = json.loads((root / "dist/questions.json").read_text(encoding="utf-8-sig"))
reader = PdfReader(source)
source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
if source_hash != definitions["expectedSourceSha256"]:
    raise ValueError("PDF edition/content changed: review the source before extraction")


def compact(text):
    # Preserve the document's words and punctuation; only fold PDF line wraps.
    return re.sub(r"\s+", " ", text).strip()


excerpts = []
for definition in definitions["excerpts"]:
    if definition.get("source", {}).get("kind") == "ifab-web":
        excerpts.append(definition.copy())
        continue
    page = reader.pages[definition["page"] - 1]
    text = compact(page.extract_text())
    start = text.index(compact(definition["start"]))
    end = text.index(compact(definition["end"]), start + 1) if definition.get("end") else len(text)
    passage = text[start:end].strip()
    if not passage:
        raise ValueError(f"Empty source passage: {definition['id']}")
    excerpts.append({key: definition[key] for key in ("id", "law", "article", "title", "page")} |
                    {"text": passage, "source": {
                        "kind": "official-ro-pdf", "edition": definitions["edition"],
                        "language": "ro", "translation": "official", "sha256": source_hash,
                        "title": definitions["sourceTitle"]}})

by_id = {q["id"]: q for q in questions}
references = []
by_excerpt = {item["id"]: item for item in excerpts}
for association in definitions["reviewedQuestions"]:
    q = by_id[association["id"]]
    if (q["questionRo"] != association["questionRo"] or
            q["options"][q["correctOption"]] != association["correctText"]):
        raise ValueError(f"Question/answer changed since source review: {q['id']}")
    passages = []
    for item in association["passages"]:
        text = by_excerpt[item["id"]]["text"]
        highlights = [compact(quote) for quote in item["highlights"]]
        if not highlights or any(not quote or text.count(quote) != 1 for quote in highlights):
            raise ValueError(f"Invalid question-specific highlight: {q['id']}, {item['id']}")
        passages.append({"id": item["id"], "justifies": item["justifies"], "highlights": highlights})
    references.append({"seedId": q["id"], "questionRo": q["questionRo"],
                       "reviewedEdition": association["reviewedEdition"],
                       "correctText": q["options"][q["correctOption"]],
                       "passages": passages})

output = {"schemaVersion": 3, "edition": definitions["edition"],
          "targetEdition": definitions["targetEdition"],
          "revisionLabel": definitions["revisionLabel"],
          "sourceTitle": definitions["sourceTitle"], "sourceFile": source.name,
          "sourceSha256": source_hash,
          "excerpts": excerpts, "references": references}
(root / "dist/laws-ro.json").write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Extracted {len(excerpts)} passages; {len(references)} reviewed scenarios.")
