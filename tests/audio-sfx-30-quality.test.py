#!/usr/bin/env python3
"""Phase 1: adversarial waveform/inventory/independence test for all 30 SFX.

Technical checks only. They cannot prove pleasing or credible acoustic quality.
"""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import wave
import numpy as np
from scipy import signal

root=Path(__file__).resolve().parents[1]
directory=Path(sys.argv[1] if len(sys.argv)>1 else "tools/audio/sfx-30-previews")
manifest=json.loads((root/"assets/audio/manifest.json").read_text())
report=json.loads((directory/"candidate-manifest.json").read_text())
live=[k for k,v in manifest["assets"].items() if v["kind"]=="effect"]
assert len(live)==30
assert report["candidateCount"]==30 and report["originalRegistrationCount"]==30
assert "UNHEARD" in report["status"] and "NOT GAME AUDIO" in report["status"]
assert [c["id"] for c in report["cues"]]==live
assert set(x.name for x in directory.iterdir())=={"candidate-manifest.json"}|{k+".wav" for k in live}
rows={}
for entry in report["cues"]:
    key=entry["id"]
    with wave.open(str(directory/(key+".wav")),"rb") as file:
        assert (file.getnchannels(),file.getsampwidth(),file.getframerate())==(1,2,48000)
        x=np.frombuffer(file.readframes(file.getnframes()),dtype="<i2").astype(float)/32768
    assert .19 < len(x)/48000 < .37, (key,len(x)/48000)
    assert np.isfinite(x).all() and x[0]==0 and x[-1]==0
    peak=np.max(np.abs(x))
    rms=np.sqrt(np.mean(x*x))
    assert .045 <= peak <= .46 and .005 < rms < .075,(key,peak,rms)
    # At identical in-game manifest gain, a large RMS change makes A/B unfair.
    # RMS is not psychoacoustic loudness; this is a baseline parity signal guard.
    ref=float(entry["baselineRms"])
    original=float(json.loads((root/"tools/audio/sfx-measurements.json").read_text())[key]["rms"])
    assert abs(ref-original)<1e-8
    ratio_db=20*np.log10(rms/ref)
    assert abs(ratio_db)<2.5,(key,"original-vs-new RMS dB",ratio_db)
    assert abs(entry["peak"]-peak)<.00001 and abs(entry["rms"]-rms)<.00001
    assert entry["sha256"]==hashlib.sha256((directory/(key+".wav")).read_bytes()).hexdigest()
    assert entry["baseline"]==manifest["assets"][key]["src"]
    baseline_path=root/entry["baseline"].removeprefix("./")
    baseline_bytes=baseline_path.read_bytes()
    assert hashlib.sha256(baseline_bytes).hexdigest()==manifest["assets"][key]["sha256"], key
    with wave.open(str(baseline_path),"rb") as previous:
        assert previous.getnchannels()==1 and previous.getsampwidth()==2
        original_pcm=np.frombuffer(previous.readframes(previous.getnframes()),dtype="<i2")
        original_rms=np.sqrt(np.mean((original_pcm.astype(float)/32768)**2))
        assert abs(original_rms-entry["baselineRms"])<.0002, key
    power=abs(np.fft.rfft(x*np.hanning(len(x)),n=32768))**2
    hz=np.fft.rfftfreq(32768,d=1/48000)
    total=max(power.sum(),1e-12)
    lo=float(power[hz<350].sum()/total)
    mids=float(power[(hz>=700)&(hz<6000)].sum()/total)
    rows[key]={"peak":round(float(peak),5),"rms":round(float(rms),5),
                "sub350":round(lo,4),"mids700to6000":round(mids,4)}
    assert np.max(np.abs(np.diff(x)))<.6, "Discontinuity "+key
assert rows["sfx-arrow-impact"]["sub350"]<.18, "Arrow impact must survive small speakers"
assert rows["sfx-critical-warning"]["mids700to6000"]>.5, "Critical warning has no midrange"
assert rows["sfx-hero-steel-swing"]["sub350"]<.15, "Sword swish should not rumble"

# Basic anti-clone check against near-identical waveform power spectra.
def sampled_spectrum(key):
    with wave.open(str(directory/(key+".wav")),"rb") as file:
        x=np.frombuffer(file.readframes(file.getnframes()),dtype="<i2").astype(float)
    fft=np.abs(np.fft.rfft(x*np.hanning(len(x)),n=4096))
    norm=np.linalg.norm(fft)
    return fft/max(norm,1e-12)
spectra={k:sampled_spectrum(k) for k in live}
near=[]
for i,key in enumerate(live):
    for other in live[i+1:]:
        score=float(np.dot(spectra[key],spectra[other]))
        if score>.985:near.append((key,other,round(score,5)))
assert not near,"Identically textured cues in distinct event slots: "+repr(near)

if "--verify-rebuild" in sys.argv:
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run([sys.executable,str(root/"tools/audio/sfx-30-studio.py"),tmp],
                       check=True,stdout=subprocess.PIPE,env={**os.environ,"PYTHONHASHSEED":"7891"})
        for key in live:
            assert (Path(tmp)/(key+".wav")).read_bytes()==(directory/(key+".wav")).read_bytes(),key

print(json.dumps({"result":"PASS source/render only; auditory identity remains UNVERIFIED",
                  "count":len(rows),"spectrumNearClones":len(near),
                  "bytes":sum((directory/(key+".wav")).stat().st_size for key in live),
                  "cues":rows},indent=2))
