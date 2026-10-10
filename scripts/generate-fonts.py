#!/usr/bin/env python3
"""Convert the supplied Jost master to WOFF2 with fonttools[woff]==4.66.0."""
from pathlib import Path
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
folder = root / 'src/assets/fonts'
source = TTFont(folder / 'jost-variable.ttf', recalcTimestamp=False)
source.flavor = 'woff2'
source.save(folder / 'jost-variable.woff2')
result = TTFont(folder / 'jost-variable.woff2')
assert source.getBestCmap() == result.getBestCmap()
assert source['hmtx'].metrics == result['hmtx'].metrics
assert [(a.axisTag, a.minValue, a.maxValue) for a in source['fvar'].axes] == [
    (a.axisTag, a.minValue, a.maxValue) for a in result['fvar'].axes
]
print(f"Generated Jost WOFF2: {(folder / 'jost-variable.woff2').stat().st_size} bytes")
