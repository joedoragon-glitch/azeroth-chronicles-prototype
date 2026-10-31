"""Authored Phase 2 arrangement renderer; isolated studio studies, not game assets.

Each bar selects an explicit dramatic figure from phase2-pilots.json. The figure
grammar exists to play an authored score, not to generate anonymous preset loops.
No licensed samples or external audio sources are used.
"""
import hashlib
import numpy as np
from scipy.signal import butter, sosfilt


def render_stem(family, part, original):
    rate = original.RATE
    beat = 60.0 / family["bpm"]
    n = round(family["bars"] * 4 * beat * rate)
    signal = np.zeros(n, dtype=np.float64)
    seed = hashlib.sha256((family["family"] + ":arranged:" + part).encode()).digest()
    rng = np.random.default_rng(int.from_bytes(seed[:8], "little"))
    plan = family["performance"]
    style = family["style"]
    peace = part == "peace"
    additive = part in ("action", "true")
    mode = family.get("peaceMode", family["mode"]) if peace else family["mode"]
    harmony = family.get("peaceHarmony", family["harmony"]) if peace else family["harmony"]
    lead = family.get("peaceLead", family["lead"]) if peace else family["lead"]
    energy = plan.get("peaceEnergy", plan["energy"]) if peace else plan["energy"]

    def add(bar, pos, samples, gain, jitter=False):
        # Frame-synchronized stems retain identical sample length. Humanized
        # microtiming is deterministic, and never changes the bar/loop clock.
        delta = float(rng.uniform(-.009, .009)) if jitter else 0.0
        start = round((4 * bar + pos + delta) * beat * rate) % n
        if len(samples) >= n:
            raise ValueError("An authored event exceeds its musical loop")
        wet = samples * gain * energy[bar]
        first = min(len(wet), n - start)
        signal[start:start + first] += wet[:first]
        if len(wet) > first:
            signal[:len(wet) - first] += wet[first:]

    def note(bar, pos, degree, length, instrument, gain, register=0,
             articulation="normal", jitter=False):
        midi = family["root"] + register + original.degree(degree, mode)
        sample = original.instrument(midi, length * beat, instrument, rng)
        # Shapes the instrument's written phrase, rather than applying one
        # immutable amplitude to every nominally distinct note.
        t = np.arange(len(sample)) / rate
        if articulation == "short":
            gate = np.clip((length * beat * .82 - t) / .1, 0, 1)
            sample *= gate
        elif articulation == "bowed":
            sample *= .85 + .14 * np.sin(np.pi * np.minimum(t / max(length * beat, .01), 1))
        elif articulation == "soft":
            sample *= np.clip(t / .11, 0, 1)
        add(bar, pos, sample, gain, jitter)

    def drum(bar, pos, kind, level):
        add(bar, pos, original.drum(kind, rng), level, jitter=True)

    def bass(bar, chord, gain=.060, length=2.1):
        note(bar, 0, chord, length, "cello", gain, -24, "bowed")

    def chord_veil(bar, chord, gain=.032, length=3.2, dyad=False):
        for voice in (0, 4) if dyad else (0, 2, 4):
            note(bar, .03 * (voice + 1), chord + voice, length,
                 "strings", gain, -12, "soft")

    def pluck(bar, chord, pitches, inst, gain=.05):
        for at, step, duration in pitches:
            note(bar, at, chord + step, duration, inst, gain, -12,
                 "short", jitter=True)

    def pastoral(bar, chord, figure):
        if figure == "hush":
            chord_veil(bar, chord, .020, 3.6, True)
        elif figure == "home":
            bass(bar, chord, .064, 2.4)
            pluck(bar, chord, [(0,0,.65),(1.6,4,.65),(2.75,2,.8)],"harp",.053)
            if bar in (0, 1, 10): chord_veil(bar, chord, .032, 3.3, True)
        elif figure == "lane":
            bass(bar, chord, .047, 1.7)
            pluck(bar,chord,[(.3,0,.55),(1.25,2,.55),(2.45,4,.65),(3.35,2,.45)],"harp",.046)
            note(bar,2.1,chord+2,1.05,"cello",.031,-12)
        elif figure == "patrol":
            bass(bar,chord,.072,2.0)
            pluck(bar,chord,[(0,0,.6),(.8,2,.5),(1.85,4,.57),(3.1,2,.5)],"harp",.045)
            note(bar,1.75,chord+3,1.15,"strings",.027,-12,"soft")
        elif figure == "return":
            bass(bar,chord,.05,2.3)
            pluck(bar,chord,[(0,0,1.0),(2.1,4,.65),(3.1,2,.6)],"harp",.038)
        else: raise ValueError(("pastoral",figure))

    def archive(bar, chord, figure):
        if figure == "breath":
            note(bar,0,chord,2.15,"piano",.039,-12)
        elif figure == "read":
            bass(bar,chord,.05,3.2)
            pluck(bar,chord,[(0,0,.4),(.75,2,.42),(2.55,4,.48)],"piano",.05)
            note(bar,2.15,chord+2,1.55,"strings",.027,-12,"soft")
        elif figure == "hurry":
            bass(bar,chord,.056,2.1)
            pluck(bar,chord,[(0,0,.36),(.75,2,.37),(1.55,4,.36),(2.3,2,.36),(3.2,0,.36)],"piano",.047)
        elif figure == "rescue":
            bass(bar,chord,.052,1.8)
            pluck(bar,chord,[(.3,2,.45),(1.2,4,.42),(2.05,0,.44),(3.25,2,.38)],"piano",.05)
            note(bar,0,chord+2,2.1,"strings",.03,-12,"soft")
        elif figure == "missing":
            note(bar,.05,chord,2.8,"cello",.06,-24,"bowed")
            note(bar,1.8,chord+4,1.5,"bell",.03,0)
        elif figure == "resolve":
            bass(bar,chord,.048,3.2)
            pluck(bar,chord,[(0,0,1.0),(1.35,2,.75),(2.6,4,.85)],"piano",.044)
            chord_veil(bar,chord,.02,3.4,True)
        else: raise ValueError(("archive",figure))

    def domestic(bar, chord, figure):
        if figure == "hush":
            note(bar,0,chord,1.7,"cello",.038,-24,"bowed")
        elif figure in ("home","family"):
            bass(bar,chord,.061,2.0)
            figure_notes = [(0,0,.63),(1.35,4,.56),(2.5,2,.62)] if figure == "home" else [
                (.4,2,.5),(1.5,4,.48),(2.25,0,.73),(3.3,2,.42)]
            pluck(bar,chord,figure_notes,"harp" if peace else "guitar",.049)
            if figure == "family": note(bar,0,chord+2,2.15,"strings",.025,-12,"soft")
        elif figure in ("work","threat","question"):
            bass(bar,chord,.049 if peace else .066,1.8)
            pluck(bar,chord,[(0,0,.45),(.9,2,.42),(2.15,4,.42),(3.2,2,.42)],
                  "piano" if peace else "dulcimer",.043)
            if figure == "threat": note(bar,1.45,chord+3,1.4,"cello",.04,-12,"bowed")
            if figure == "question": note(bar,2.5,chord+5,.8,"bell",.026,0)
        elif figure in ("return","relief"):
            bass(bar,chord,.043,2.4)
            pluck(bar,chord,[(0,0,.9),(2,4,.8)],"harp" if peace else "guitar",.037)
            if peace: chord_veil(bar,chord,.022,3.15,True)
        else: raise ValueError(("domestic",figure))

    def craft(bar, chord, figure):
        if figure == "silence":
            note(bar,0,chord,2.4,"strings",.022,-12,"soft")
        elif figure in ("measure","stitch","work"):
            bass(bar,chord,.067,2.0)
            patterns = {
                "measure":[(0,0,.75),(2,2,.75)],
                "stitch":[(.3,2,.55),(1.4,4,.62),(2.75,2,.52)],
                "work":[(0,0,.57),(.85,2,.5),(1.9,4,.6),(3.1,2,.52)]}
            pluck(bar,chord,patterns[figure],"dulcimer",.041)
            if figure == "work": note(bar,0,chord+2,2.8,"strings",.03,-12,"soft")
        elif figure in ("debate","argument","judgment"):
            bass(bar,chord,.065,2.1)
            pluck(bar,chord,[(0,0,.5),(1.25,4,.58),(2.35,2,.55)],"dulcimer",.045)
            if figure != "debate":
                note(bar,1.6,chord+3,1.65,"horn",.031,0,"soft")
        elif figure in ("memory","close"):
            bass(bar,chord,.047,2.65)
            note(bar,0,chord+2,2.4,"strings",.03,-12,"bowed")
            if figure == "memory": note(bar,2.3,chord+4,1.1,"cello",.033,0,"bowed")
        else: raise ValueError(("craft",figure))

    def foreground(bar, chord):
        fig = plan["figures"][bar] if not peace else plan["secondFigures"][bar]
        if style == "pastoral": pastoral(bar,chord,fig)
        elif style == "archive": archive(bar,chord,fig)
        elif style == "domestic": domestic(bar,chord,fig)
        elif style == "craft": craft(bar,chord,fig)
        else: raise ValueError(style)
        phrases = family.get("peacePhrases",family["phrases"]) if peace else family["phrases"]
        shifts = plan.get("peaceShifts",plan["leadShifts"]) if peace else plan["leadShifts"]
        overrides = plan.get("peaceOverrides",{}) if peace else plan["leadOverrides"]
        notes = overrides.get(str(bar))
        if notes is None:
            notes = [(at,degree+shifts[bar],length) for at,degree,length in family["cells"][phrases[bar]]]
        for i,(at,degree,length) in enumerate(notes):
            strength = (.119 if style in ("pastoral","domestic") else .139)
            # Phrasal downbeat vs. breath-tone accents; fixed musical-clock bar.
            strength *= (1.06 if i == 0 else .91 if i == len(notes)-1 else .96)
            note(bar,at,degree,length,lead,strength,12,
                 "bowed" if lead in ("cello","strings") and length > .75 else "normal")
        counter = plan.get("peaceCounterpoint",{}) if peace else plan["counterpoint"]
        for at,degree,length,kind,amount in counter.get(str(bar),[]):
            note(bar,at,degree,length,kind,.084 * amount,0,"soft")

    def combat(bar, chord):
        fig = plan["secondFigures"][bar]
        if style == "pastoral":
            if fig == "breath": return
            if fig in ("watch","release"):
                note(bar,.55,chord+2,.65,"harp",.055,-12,"short")
                if fig == "watch" and bar % 2 == 1: drum(bar,2.5,"shaker",.10)
            elif fig in ("approach","pursuit"):
                for at,step in ((0,0),(1.4,2),(2.8,4)):
                    note(bar,at,chord+step,.53,"harp",.061,-12,"short",True)
                drum(bar,1.55,"shaker",.11)
                if fig == "pursuit": drum(bar,3.1,"frame",.11)
            elif fig == "surge":
                for at,step in ((0,0),(1.0,2),(2.1,4),(3.1,2)):
                    note(bar,at,chord+step,.51,"cello",.07,-12,"short")
                drum(bar,0,"frame",.14)
                drum(bar,2.75,"shaker",.1)
            else: raise ValueError(fig)
        elif style == "archive":
            if fig == "breath": return
            sequences = {
                "alert":[(.4,0),(2.25,2)],"urgent":[(0,0),(.8,2),(1.7,4),(3.1,2)],
                "rescue":[(.25,2),(1.2,4),(2.15,0),(3.05,2)],
                "release":[(0,0),(2.15,4)]}
            if fig not in sequences: raise ValueError(fig)
            for at,step in sequences[fig]:
                note(bar,at,chord+step,.34,"piano",.071,-12,"short",True)
            if fig in ("urgent","rescue"):
                drum(bar,0,"frame",.10)
                drum(bar,2.7 if fig=="rescue" else 3.3,"tom",.11)
        elif style == "craft":
            if fig == "silence": return
            sequences = {
                "hold":[(0,0)],"stitch":[(.25,2),(2.1,4)],
                "judgment":[(0,0),(1.15,4),(2.7,2)],
                "memory":[(0,0),(2.15,2)],"doubt":[(.6,2),(2.5,0)],
                "insist":[(0,0),(.8,2),(1.65,4),(3.1,2)],
                "decision":[(0,0),(1.15,4),(2.25,2),(3.2,0)],
                "release":[(0,0),(2,2)]}
            if fig not in sequences: raise ValueError(fig)
            for at,step in sequences[fig]:
                note(bar,at,chord+step,.55,"cello",.073,-12,"bowed",True)
            if fig in ("stitch","judgment","insist","decision"):
                drum(bar,0,"frame",.12)
            if fig in ("insist","decision"): drum(bar,2.65,"tom",.15)
            # The former-party horn contour is specific to this character:
            # no generic universal TRUE brass layer.
            for at,degree,length,kind,amount in plan.get("trueCounterpoint",{}).get(str(bar),[]):
                note(bar,at,degree,length,kind,.105 * amount,0,"soft")
        else: raise ValueError("Unexpected additive style: "+style)

    for bar, chord in enumerate(harmony):
        if additive: combat(bar,chord)
        else: foreground(bar,chord)

    dry = signal.copy()
    for delay,gain in ((.047,.057),(.118,.028),(.241,.015)):
        signal += np.roll(dry,round(delay*rate))*gain
    signal = sosfilt(butter(2,45,btype="highpass",fs=rate,output="sos"),
                    np.tile(signal,2))[n:]
    signal = sosfilt(butter(2,10900,btype="lowpass",fs=rate,output="sos"),
                    np.tile(signal,2))[n:]
    rms = float(np.sqrt(np.mean(signal**2)))
    target = .065 if additive else (.088 if peace else .092)
    peak = float(np.max(np.abs(signal)))
    signal *= min(target/max(rms,1e-9), .68/max(peak,1e-9))
    return signal,rate
