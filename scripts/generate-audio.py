#!/usr/bin/env python3
"""Pre-render one MP3 per dataset word with Kokoro (af_heart).

Usage (from the repo root, with a Python env that has kokoro + soundfile):
    python3 scripts/generate-audio.py                 # all words (skips existing)
    python3 scripts/generate-audio.py --group 1
    python3 scripts/generate-audio.py --only compound,quixotic
    python3 scripts/generate-audio.py --force         # regenerate everything

Outputs:
    client/public/audio/words/<slug>.mp3

The client derives the same slug at runtime, so no manifest is written; a slug
collision between two words is a hard error here because the files would clash.

Heteronyms whose default stress does not match the definition's primary sense
are given a misaki phoneme override in scripts/audio-overrides.json.
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "server/data/gregmat-words.json"
OUT = ROOT / "client/public/audio"
WORDS_DIR = OUT / "words"
OVERRIDES_FILE = ROOT / "scripts/audio-overrides.json"

VOICE = "af_heart"
LANG_CODE = "a"
SAMPLE_RATE = 24000
BITRATE = "48k"


def slug(word):
    return re.sub(r"[^a-z0-9]+", "-", word.lower()).strip("-")


def load_words(group=None, only=None):
    groups = json.loads(DATA.read_text())["groups"]
    words = [
        w["word"]
        for g in groups
        if not group or g["group"] == group
        for w in g["words"]
    ]
    if only:
        wanted = {x.lower() for x in only}
        words = [w for w in words if w.lower() in wanted]
    return words


def build_text(word, overrides):
    ipa = overrides.get(word.lower())
    return f"[{word}](/{ipa}/)" if ipa else word


def to_mp3(wav, mp3):
    subprocess.run(
        [
            "ffmpeg", "-y", "-loglevel", "error", "-i", str(wav),
            "-ac", "1", "-ar", str(SAMPLE_RATE), "-b:a", BITRATE, str(mp3),
        ],
        check=True,
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--group", type=int)
    ap.add_argument("--only", help="comma-separated words")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    overrides = json.loads(OVERRIDES_FILE.read_text()) if OVERRIDES_FILE.exists() else {}
    words = load_words(args.group, args.only.split(",") if args.only else None)
    if not words:
        sys.exit("no words selected")

    WORDS_DIR.mkdir(parents=True, exist_ok=True)

    seen = {}
    for word in words:
        s = slug(word)
        if s in seen and seen[s] != word:
            sys.exit(f"slug collision for {s!r}: {seen[s]!r} vs {word!r}")
        seen[s] = word

    todo = [
        w for w in words
        if args.force or not (WORDS_DIR / f"{slug(w)}.mp3").exists()
    ]
    print(f"{len(words)} word(s), {len(todo)} to generate", flush=True)
    if not todo:
        return

    import numpy as np
    import soundfile as sf
    from kokoro import KPipeline

    pipe = KPipeline(lang_code=LANG_CODE)
    tmp = ROOT / ".audio-tmp.wav"

    for i, word in enumerate(todo, 1):
        wrote = False
        for _, _, audio in pipe(build_text(word, overrides), voice=VOICE):
            arr = audio.detach().cpu().numpy() if hasattr(audio, "detach") else np.asarray(audio)
            sf.write(str(tmp), arr, SAMPLE_RATE)
            wrote = True
        if not wrote:
            print(f"SKIP (no audio): {word}", flush=True)
            continue
        to_mp3(tmp, WORDS_DIR / f"{slug(word)}.mp3")
        print(f"[{i}/{len(todo)}] {word}", flush=True)

    if tmp.exists():
        tmp.unlink()
    print(f"{len(todo)} clip(s) attempted", flush=True)


if __name__ == "__main__":
    main()
