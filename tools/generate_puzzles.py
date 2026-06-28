#!/usr/bin/env python3
"""Generate Annagrams puzzle packs from a local Hunspell/SCOWL-style word list.

Usage:
    python3 tools/generate_puzzles.py /usr/share/hunspell/en_US.dic > puzzles.json

The game deliberately uses target caps: many dictionary-valid words may be
accepted, but the player is not required to find all of them.
"""
from __future__ import annotations

import collections
import json
import re
import sys
from pathlib import Path

MIN_WORD_LENGTH = 3
MAX_WORD_LENGTH = 9
POINTS = {3: 1, 4: 2, 5: 4, 6: 7, 7: 11, 8: 16, 9: 25}
TARGET_CAPS = {
    4: {3: 4, 4: 1},
    5: {3: 6, 4: 5, 5: 1},
    6: {3: 8, 4: 8, 5: 4, 6: 1},
    7: {3: 9, 4: 9, 5: 6, 6: 2, 7: 1},
    8: {3: 10, 4: 10, 5: 7, 6: 4, 7: 2, 8: 1},
    9: {3: 11, 4: 11, 5: 8, 6: 5, 7: 3, 8: 1, 9: 1},
}

COMMON_THREE = set('''
ace act add age ago aid aim air ale all and ant any ape app apt arc are arm art ash ask ate awe
bad bag ban bar bat bay bed bee beg bet bid big bin bit bow box boy bud bug bun bus but buy bye
cab can cap car cat cod cog cop cow cry cue cup cut dad day den dew did die dig dim dip dog dot dry due dug
ear eat egg ego elf end era eye fan far fat fee few fig fin fit fix fly fog for fox fry fun fur
gap gas gem get gin gum gun guy had ham has hat hay hem hen her hid him hip his hit hop hot how hug hum hut
ice ill ink inn ion ire its jam jar jet job jog joy jug key kid kin kit lab lad lag lap law lay led leg let lie lip lit log lot low
mad man map mat may men met mix mob mud mug nap net new nod nor not now nun nut oak oar odd off oil old one opt orb ore our out owe owl own
pad pal pan paw pay pea pen per pet pie pig pin pit pod pop pot pry pub pun put rag ram ran rat raw ray red rib rid rim rip rob rod rot row rub rug run rye
sad sag sat saw say sea see set sew she shy sin sip sir sit six sky sly sob son sow soy spa spy sub sue sum sun tag tan tap tar tax tea ten the tie tin tip toe ton top toy try tug two use van vet via war was way web wed wet who why wig win wit won wow yak yam yap yea yes yet you zap
'''.split())

# Small safety/quality filter. The source dictionary can contain taboo terms,
# names, and technical debris. This list is intentionally conservative; it is
# not a complete profanity filter.
OMIT = set('''
ass arse damn hell crap shit piss fuck cunt dick cock slut whore bastard bugger
anus porn rape nazi
aaa aah aal aas aba abba abbe abed abet ably abut aby acey ach adz aeon aga agin ain ait alb alee alp ane ani azo
qat qis qibla qindarka qintar qiviut za zee zed zoa
'''.split())

BASE_WORDS = {
    4: 'star cart lamp farm time tone rain path ship bird word book fire moon tree'.split(),
    5: 'plant river house light bread crown money beach table heart clean plane stone chair music cloud apple train field smile dream grass fruit earth water dance sound'.split(),
    6: 'planet candle garden silver animal travel forest orange guitar flower basket winter summer castle circle marble gentle wonder bright stream meadow window father mother friend school pocket pretty yellow button reason'.split(),
    7: 'balance picture morning kitchen problem country journey weather machine lantern teacher holiday station village blanket orchard library whisper harvest doorway freedom grammar visitor cabinet captain'.split(),
    8: 'triangle elephant mountain notebook language birthday calendar computer hospital ceremony painting variable ordinary reaction sunlight graceful kindness daughter thousand mushroom umbrella sandwich tomorrow'.split(),
    9: 'adventure education chocolate carpenter statement important afternoon apartment telephone yesterday knowledge fireplace newspaper breakfast butterfly wonderful challenge evergreen direction happiness'.split(),
}


def root_from_hunspell(line: str) -> str:
    return line.strip().split('/')[0].split('\t')[0].lower()


def load_words(path: Path) -> set[str]:
    words: set[str] = set()
    with path.open(encoding='utf-8', errors='ignore') as fh:
        first = True
        for line in fh:
            if first and line.strip().isdigit():
                first = False
                continue
            first = False
            word = root_from_hunspell(line)
            if not re.fullmatch(r'[a-z]{3,9}', word):
                continue
            if word in OMIT:
                continue
            if len(word) == 3 and word not in COMMON_THREE:
                continue
            words.add(word)

    # Ensure the puzzle titles and earlier hand-curated answers remain valid.
    for base_list in BASE_WORDS.values():
        words.update(base_list)
    return words


def can_build(word: str, letters: str) -> bool:
    return not (collections.Counter(word) - collections.Counter(letters))


def title_case(word: str) -> str:
    return word[:1].upper() + word[1:]


def targets_for(size: int, answers: list[str]) -> dict[str, int]:
    by_len = collections.Counter(map(len, answers))
    caps = TARGET_CAPS[size]
    targets: dict[str, int] = {}
    for length in range(MIN_WORD_LENGTH, size + 1):
        available = by_len.get(length, 0)
        if available <= 0:
            continue
        target = min(available, caps.get(length, 0))
        if target > 0:
            targets[str(length)] = target
    return targets


def score_target(size: int, targets: dict[str, int], has_full_length: bool) -> int:
    base = sum(POINTS[int(length)] * count for length, count in targets.items())
    if has_full_length and size >= 6:
        base += 20
    if has_full_length and size == 9:
        base += 20
    return max(10, int(round(base * 0.92)))


def make_puzzles(words: set[str]) -> list[dict]:
    puzzles = []
    for size, bases in BASE_WORDS.items():
        for base in bases:
            if len(base) != size:
                continue
            answers = sorted(
                [word for word in words if MIN_WORD_LENGTH <= len(word) <= size and can_build(word, base)],
                key=lambda w: (len(w), w),
            )
            if base not in answers:
                answers.append(base)
                answers.sort(key=lambda w: (len(w), w))
            # Skip thin generated puzzles.
            if len(answers) < max(3, size - 1):
                continue
            targets = targets_for(size, answers)
            puzzles.append({
                'id': f'{size}-{base}',
                'title': title_case(base),
                'letters': base.upper(),
                'size': size,
                'targets': targets,
                'scoreTarget': score_target(size, targets, base in answers),
                'answers': answers,
            })
    return puzzles


def main() -> None:
    if len(sys.argv) > 1:
        source = Path(sys.argv[1])
    else:
        source = Path('/usr/share/hunspell/en_US.dic')
    if not source.exists():
        raise SystemExit(f'Word list not found: {source}')
    puzzles = make_puzzles(load_words(source))
    json.dump(puzzles, sys.stdout, indent=2)
    sys.stdout.write('\n')


if __name__ == '__main__':
    main()
