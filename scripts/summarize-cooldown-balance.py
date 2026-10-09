"""Summarize the full cooldown audit without treating deaths as fast victories.

Usage: python scripts/summarize-cooldown-balance.py INPUT.json[.gz] OUTPUT.json
Optional third output: deterministic compressed raw evidence (.json.gz).
Uses only the Python standard library.
"""
import json, gzip, hashlib, collections, statistics as st, pathlib, sys, math
root = pathlib.Path(__file__).resolve().parents[1]
input_path = pathlib.Path(sys.argv[1])
with gzip.open(input_path, 'rt') if input_path.suffix == '.gz' else input_path.open() as stream:
    p = json.load(stream)
assert [r['caseIndex'] for r in p['fights']] == list(range(p['totalCases']))
assert len(p['throughput']) == 810
assert all((r['unaccountedHpGain'] is None or abs(r['unaccountedHpGain']) <= 0.001 for r in p['fights']))
for row in p['fights']:
    for key in ['seconds', 'damage', 'primaryDamage', 'heroDamage', 'companionDamage', 'received', 'siphon', 'allSiphon', 'recovery', 'resetHpDelta', 'normalizationHpDelta']:
        assert isinstance(row[key], (int, float)) and math.isfinite(row[key]), (row['caseIndex'], key)
p.setdefault('harnessSha256', hashlib.sha256((root / 'scripts/cooldown-balance-audit.cjs').read_bytes()).hexdigest())
if len(sys.argv) > 3:
    blob = json.dumps(p, separators=(',', ':'), allow_nan=False).encode() + b'\n'
    pathlib.Path(sys.argv[3]).write_bytes(gzip.compress(blob, mtime=0))
f = p['fights']
t = p['throughput']

def clean(r):
    return r['won'] and (not r['died'])

def median(a):
    return round(st.median(a), 3) if a else None

def stats(rows):
    wins = [r for r in rows if clean(r)]
    return dict(n=len(rows), wins=len(wins), winPct=round(100 * len(wins) / len(rows), 1) if rows else None, deaths=sum((r['died'] for r in rows)), timeouts=sum((not clean(r) and (not r['died']) for r in rows)), medianWinSeconds=median([r['seconds'] for r in wins]), medianWinHeroHp=median([r['heroHp'] for r in wins]), medianWinCompanions=median([r['companionsAlive'] for r in wins]), resets=sum((r['resets'] > 0 for r in rows)), medianWinImmunity=median([r['immuneTime'] / r['seconds'] for r in wins]), medianWinHaste=median([r['hasteTime'] / r['seconds'] for r in wins]))
base = [r for r in f if r['caseIndex'] < 4644 and r['rank'] in [0, 5]]
late = [r for r in f if r.get('scenario') == 'late-awakening'] + [r for r in base if r['family'] == 'darklord' and r.get('form') == 'true']
summary = {'version': p['version'], 'engineCommit': p['commit'], 'harnessSha256': p['harnessSha256'], 'trials': len(f), 'benchmarks': len(t), 'seeds': p['seeds'], 'limits': p['limits'], 'overall': stats(f), 'primaryAccountingFailures': 0}
summary['classOutcomes'] = []
for cls in ['paladin', 'mage', 'ranger']:
    for mode in ['normal', 'nightmare']:
        for rank in [0, 5]:
            for category, rows in [('normal-bosses', [r for r in base if not r['family'].startswith('pack-') and r.get('form') == 'normal']), ('late-TRUE', late), ('packs', [r for r in base if r['family'].startswith('pack-')])]:
                summary['classOutcomes'].append(dict(cls=cls, mode=mode, rank=rank, category=category, **stats([r for r in rows if r['cls'] == cls and r['mode'] == mode and (r['rank'] == rank)])))
summary['partyOutcomes'] = [dict(cls=cls, mode=mode, party=party, **stats([r for r in late if r['cls'] == cls and r['mode'] == mode and (r['party'] == party) and (r['rank'] == 5)])) for cls in ['paladin', 'mage', 'ranger'] for mode in ['normal', 'nightmare'] for party in ['solo', 'mixed', 'six']]
summary['bossOutcomes'] = [dict(family=fam, form=form, mode=mode, **stats([r for r in (late if form == 'late-TRUE' else base) if r['family'] == fam and (form == 'late-TRUE' or r.get('form') == form) and (r['mode'] == mode)])) for fam in sorted(set((r['family'] for r in base if not r['family'].startswith('pack-')))) for form in ['normal', 'late-TRUE'] for mode in ['normal', 'nightmare'] if [r for r in (late if form == 'late-TRUE' else base) if r['family'] == fam and (form == 'late-TRUE' or r.get('form') == form) and (r['mode'] == mode)]]

def key(r):
    """Settings held constant for CDR pairs; other comparisons append the talent rank."""
    return tuple((r.get(k, 'normal' if k == 'form' else None) for k in ['cls', 'level', 'family', 'form', 'mode', 'party', 'seed']))

def pairs(rows, flag):
    groups = collections.defaultdict(dict)
    for r in rows:
        groups[key(r) + (r['rank'],)][r[flag]] = r
    return [(g[False], g[True]) for g in groups.values() if False in g and True in g]
ab = [r for r in f if 'healing' in r and 'partyHeal' not in r]
summary['healingPairs'] = []
for fam in ['crypt', 'archive', 'abyss', 'citadel', 'darklord']:
    ps = pairs([r for r in ab if r['family'] == fam], 'healing')
    valid = [(a, b) for a, b in ps if clean(a) and clean(b) and (not a['resets']) and (not b['resets'])]
    summary['healingPairs'].append(dict(family=fam, pairs=len(ps), offWins=sum((clean(a) for a, b in ps)), onWins=sum((clean(b) for a, b in ps)), gainedWins=sum((not clean(a) and clean(b) for a, b in ps)), lostWins=sum((clean(a) and (not clean(b)) for a, b in ps)), cleanPairedWins=len(valid), medianSecondsAdded=median([b['seconds'] - a['seconds'] for a, b in valid]), medianPercentAdded=median([100 * (b['seconds'] / a['seconds'] - 1) for a, b in valid]), minSecondsAdded=round(min([b['seconds'] - a['seconds'] for a, b in valid]), 3) if valid else None, maxSecondsAdded=round(max([b['seconds'] - a['seconds'] for a, b in valid]), 3) if valid else None, medianSiphonHp=median([b['siphon'] for a, b in ps]), maxSiphonPercent=round(max((b['siphon'] / b['initialBossHp'] * 100 for a, b in ps)), 3), medianRecoveryHp=median([b['recovery'] for a, b in ps]), maxRecoveryPercent=round(max((b['recovery'] / b['initialBossHp'] * 100 for a, b in ps)), 3)))
summary['partyHealPairs'] = []
for party in ['soldiers', 'mixed', 'six']:
    off = [r for r in f if r.get('partyHeal') is False and r['party'] == party]
    on = {key(r) + (r['rank'],): r for r in ab if r['healing'] and r['party'] == party}
    ps = [(r, on[key(r) + (r['rank'],)]) for r in off]
    valid = [(a, b) for a, b in ps if clean(a) and clean(b)]
    summary['partyHealPairs'].append(dict(party=party, pairs=len(ps), offWins=sum((clean(a) for a, b in ps)), onWins=sum((clean(b) for a, b in ps)), gainedWins=sum((not clean(a) and clean(b) for a, b in ps)), lostWins=sum((clean(a) and (not clean(b)) for a, b in ps)), pairedWins=len(valid), medianSurvivorsAdded=median([b['companionsAlive'] - a['companionsAlive'] for a, b in valid]), medianSecondsAdded=median([b['seconds'] - a['seconds'] for a, b in valid]), medianHeroHpChange=median([b['heroHp'] - a['heroHp'] for a, b in valid]), medianChargedHealCasts=median([b['casts'][10] for a, b in ps]), medianPartySkillHealing=median([b['partyHealing'] for a, b in ps]), medianRangerHealing=median([b['rangerHealing'] for a, b in ps])))
summary['authoredArchive'] = [dict(cls=cls, strategy=strategy, **stats([r for r in f if r.get('authored') and (not r.get('scenario')) and (r['cls'] == cls) and (r['strategy'] == strategy)])) for cls in ['paladin', 'mage', 'ranger'] for strategy in ['mixed', 'charged1', 'charged2']]
summary['cooldownPairs'] = []
for cls in ['paladin', 'mage', 'ranger']:
    for category, rows in [('normal-bosses', [r for r in base if not r['family'].startswith('pack-') and r.get('form') == 'normal']), ('late-TRUE', late)]:
        groups = collections.defaultdict(dict)
        for r in rows:
            if r['cls'] == cls:
                groups[key(r)][r['rank']] = r
        ps = [(g[0], g[5]) for g in groups.values() if 0 in g and 5 in g]
        valid = [(a, b) for a, b in ps if clean(a) and clean(b) and (not a['resets']) and (not b['resets'])]
        summary['cooldownPairs'].append(dict(cls=cls, category=category, pairs=len(ps), rank0Wins=sum((clean(a) for a, b in ps)), rank5Wins=sum((clean(b) for a, b in ps)), cleanPairedWins=len(valid), medianTimeReductionPercent=median([100 * (1 - b['seconds'] / a['seconds']) for a, b in valid])))
policy = [r for r in f if r.get('scenario') == 'charge-policy']
summary['chargePolicyPairs'] = []
for cls in ['paladin', 'mage', 'ranger']:
    for fam in ['archive', 'darklord']:
        groups = collections.defaultdict(dict)
        for r in policy:
            if r['cls'] == cls and r['family'] == fam:
                groups[key(r) + (r['rank'],)][r['strategy']] = r
        for strategy in ['charged1', 'charged2']:
            ps = [(g['mixed'], g[strategy]) for g in groups.values()]
            valid = [(a, b) for a, b in ps if clean(a) and clean(b) and (not a['resets']) and (not b['resets'])]
            summary['chargePolicyPairs'].append(dict(cls=cls, family=fam, strategy=strategy, pairs=len(ps), mixedWins=sum((clean(a) for a, b in ps)), chargeWins=sum((clean(b) for a, b in ps)), gainedWins=sum((not clean(a) and clean(b) for a, b in ps)), lostWins=sum((clean(a) and (not clean(b)) for a, b in ps)), cleanPairedWins=len(valid), medianPercentSlower=median([100 * (b['seconds'] / a['seconds'] - 1) for a, b in valid])))
summary['dodgingPairs'] = []
lookup = {key(r) + (r['rank'],): r for r in f if (r['caseIndex'] < 4644 or r.get('scenario') == 'late-awakening') and r['rank'] in [0, 5]}
for cls in ['paladin', 'mage', 'ranger']:
    ps = [(lookup[key(r) + (r['rank'],)], r) for r in f if r.get('dodge') is False and r['cls'] == cls and (key(r) + (r['rank'],) in lookup)]
    summary['dodgingPairs'].append(dict(cls=cls, pairs=len(ps), dodgingWins=sum((clean(a) for a, b in ps)), noDodgeWins=sum((clean(b) for a, b in ps))))
summary['healingByClass'] = []
for cls in ['paladin', 'mage', 'ranger']:
    for fam in ['crypt', 'archive', 'abyss', 'citadel', 'darklord']:
        ps = pairs([r for r in ab if r['cls'] == cls and r['family'] == fam], 'healing')
        valid = [(a, b) for a, b in ps if clean(a) and clean(b) and (not a['resets']) and (not b['resets'])]
        summary['healingByClass'].append(dict(cls=cls, family=fam, pairs=len(ps), offWins=sum((clean(a) for a, b in ps)), onWins=sum((clean(b) for a, b in ps)), cleanPairedWins=len(valid), medianPercentAdded=median([100 * (b['seconds'] / a['seconds'] - 1) for a, b in valid]), maxSecondsAdded=max([round(b['seconds'] - a['seconds'], 2) for a, b in valid]) if valid else None))
summary['throughputLevel30'] = [r for r in t if r['level'] == 30 and r['targets'] == 1]
summary['cooldowns'] = [dict(slot=slot, charged=charged, seconds=[round(base * (1 - 0.04 * rank), 3) for rank in range(6)]) for slot, charged, base in [(i + 1, False, x) for i, x in enumerate([0.85, 3, 8, 14, 9, 4, 15, 24])] + [(i + 1, True, x) for i, x in enumerate([3, 6, 20])]]
pathlib.Path(sys.argv[2]).write_text(json.dumps(summary, indent=2, allow_nan=False) + '\n')
print('Saved summary:', sys.argv[2], '·', len(f), 'encounters')
