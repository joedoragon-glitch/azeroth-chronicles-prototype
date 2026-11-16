#!/usr/bin/env python3
"""SIBDLP Phase 1: re-authored comparison studies for exactly 30 LIVE effect IDs.

This is NOT an in-game asset replacement. Do not change the catalog or manifest.
Recipes are original generated waveforms, not foley recordings or AI audio.
Authoritative existing IDs and roles are read from assets/audio/manifest.json.
"""
from pathlib import Path
import hashlib
import json
import sys
import wave
import numpy as np
from scipy import signal

SR = 48000
SEED = 2026111609
ROOT = Path(__file__).resolve().parents[2]
OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "tools/audio/sfx-30-previews")
OUT.mkdir(parents=True, exist_ok=True)

def time(duration):
    return np.arange(int(round(SR*duration)),dtype="float64")/SR

class Canvas:
    def __init__(self,key,length):
        seed = int.from_bytes(hashlib.sha256(key.encode("utf-8")).digest()[:8],"little")
        self.rng=np.random.default_rng((SEED+seed)%(1<<64))
        self.t=time(length)
        self.n=len(self.t)
        self.y=np.zeros(self.n,dtype="float64")
    def puff(self,lo,hi,gain,start=0.0,attack=.002,decay=.047,pulse=None):
        noise=self.rng.standard_normal(self.n)
        if lo and hi:
            b,a=signal.butter(2,[max(20,lo),min(hi,SR*.47)],fs=SR,btype="bandpass")
        elif hi:
            b,a=signal.butter(2,hi,fs=SR,btype="lowpass")
        else:
            b,a=signal.butter(2,lo,fs=SR,btype="highpass")
        filtered=signal.lfilter(b,a,noise)
        filtered/=max(1e-9,np.sqrt(np.mean(filtered**2)))
        d=self.t-start;q=np.maximum(d,0)
        envelope=np.minimum(1,q/max(.0005,attack))*np.exp(-q/max(.002,decay))*(d>=0)
        if pulse:
            envelope*=np.exp(-.5*((self.t-pulse[0])/pulse[1])**2)
        self.y+=gain*filtered*envelope
    def strike(self,freq,gain,decay=.06,start=0.0,attack=.0018,harmonics=None,warble=0):
        d=self.t-start;q=np.maximum(d,0)
        ph=2*np.pi*(freq*q+warble*np.sin(2*np.pi*13*q)/13)
        env=np.minimum(1,q/max(.0004,attack))*np.exp(-q/max(.002,decay))*(d>=0)
        self.y+=gain*np.sin(ph)*env
        for n,volume in harmonics or []:
            self.y+=gain*volume*np.sin(n*ph)*env
    def sweep(self,a,b,gain,start=.015,span=.10,decay=.07):
        d=self.t-start;q=np.maximum(d,0)
        freq=a+(b-a)*np.minimum(1,q/max(span,.001))
        ph=2*np.pi*np.cumsum(freq)/SR
        env=np.minimum(1,q/.008)*np.exp(-q/max(decay,.01))*(d>=0)
        self.y+=gain*np.sin(ph)*env
    def flecks(self,lo,hi,pattern,gain=.022):
        for i,(start,weight) in enumerate(pattern):
            self.puff(lo,hi,gain*weight,start=start,attack=.0007,decay=.009+(.003*(i%3)))
    def finish(self):
        y=self.y-np.mean(self.y)
        ramp=min(int(.0018*SR),len(y)//15)
        y[:ramp]*=np.linspace(0,1,ramp)
        y[-ramp:]*=np.linspace(1,0,ramp)
        peak=max(np.max(np.abs(y)),1e-12)
        y*=min(1,.38/peak)
        return np.round(np.clip(y,-1,1)*32767).astype('<i2')

# Each material has a different causal sound gesture, not merely a fixed
# oscillator recipe retuned across the full catalog. These are source studies;
# a spectral design cannot certify naturalness without listening.
def steel(c,hit):
    if hit:
        c.puff(1200,7900,.059,decay=.025)
        for f,g,d in [(1137,.045,.055),(1772,.037,.073),(2949,.025,.054),(4117,.012,.038)]:
            c.strike(f,g,d)
        c.puff(280,1500,.022,decay=.038)
    else:
        c.puff(1000,7000,.036,start=.015,pulse=(.07,.042),decay=.095)
        c.sweep(410,890,.010,start=.014,span=.095,decay=.060)

def claw(c,hit):
    # Organic scratch has no ringing pitched core.
    c.puff(320,3200,.055,start=.012,decay=.033,pulse=(.060,.041))
    c.puff(1650,8300,.031,start=.055,decay=.038,pulse=(.092,.043))
    if hit:c.puff(160,900,.048,start=.008,decay=.033)
    else:c.puff(1700,6500,.016,start=.012,decay=.079,pulse=(.098,.065))

def bone(c,hit):
    # Separate brittle dry small-component clacks.
    hits=[(.0,1),(.028,.55),(.052,.32)] if hit else [(.010,.63),(.041,.41)]
    c.flecks(820,4300,hits,.048)
    for at,weight in hits:c.strike(1220,.026*weight,.018,at)
    if hit:c.strike(2850,.022,.039,.004)

def stone(c,hit):
    # Granular low rumble with a midrange crack on contact.
    c.puff(100,1000,.060,start=.007,decay=.081 if hit else .090)
    c.puff(700,4800,.037,start=.012,decay=.025 if hit else .051)
    if hit:
        c.strike(490,.036,.055,.006)
        c.flecks(1400,6800,[(.012,1),(.036,.32)],.025)
    else:c.puff(170,1100,.027,start=.045,decay=.078)

def wet(c,hit):
    # No pitchy chimes: liquid pressure and droplets.
    if hit:
        c.puff(180,1850,.060,start=.005,decay=.055)
        c.flecks(1100,7100,[(.015,1),(.040,.72),(.070,.49),(.087,.27)],.025)
    else:
        c.puff(330,2600,.040,start=.008,decay=.083,pulse=(.105,.08))
        c.flecks(1200,5100,[(.045,.60),(.082,.45)],.017)

def arrow(c,hit):
    if hit:
        c.puff(650,3200,.058,decay=.023)
        c.puff(2500,9200,.037,decay=.014)
        for f,g,d in [(650,.033,.049),(1290,.022,.044),(2120,.013,.029)]:
            c.strike(f,g,d)
    else:
        # A short string snap followed by departing air: no hit material.
        for f,g,d in [(218,.039,.052),(437,.029,.039),(660,.013,.025)]:
            c.strike(f,g,d)
        c.puff(840,5600,.043,decay=.017)
        c.puff(2100,8400,.019,start=.046,decay=.042,pulse=(.080,.045))

def spectral(c,hit):
    # Diffuse airy texture with a slight unstable narrow-band bloom.
    if hit:
        c.puff(1750,9300,.043,decay=.077,pulse=(.045,.056))
        c.strike(1215,.023,.066,warble=7)
        c.strike(1843,.019,.063,warble=8)
    else:
        c.sweep(480,1330,.026,start=.011,span=.10,decay=.11)
        c.puff(1300,7300,.029,start=.018,decay=.080,pulse=(.079,.067))

def ash(c,hit):
    # Dry scattered ember ticks and a brief breath, not a repeating metal ring.
    c.puff(350,2500,.025,start=.006,decay=.060)
    c.flecks(2600,10200,
             [(.006,.7),(.022,1),(.057,.45),(.076,.3)] if hit
             else [(.030,.5),(.063,.36),(.095,.25)],.032 if hit else .024)
    if hit:c.puff(420,3100,.038,decay=.030)
    else:c.puff(1300,6000,.021,start=.03,decay=.058,pulse=(.076,.040))

def holy(c,hit):
    # Luminous consonant overtones but no choir/chord/long melodic bed.
    if hit:
        c.puff(850,4900,.042,decay=.024)
        c.strike(1217,.026,.060)
        c.strike(1810,.016,.058)
        c.strike(3080,.010,.041)
    else:
        c.sweep(650,1050,.023,start=.01,span=.080,decay=.074)
        c.strike(1520,.015,.055,start=.021)
        c.puff(1600,6300,.024,start=.012,decay=.036)

def arcane(c,hit):
    # Inharmonic/glitchy fantasy electricity, distinguished from holy.
    if hit:
        c.puff(1800,9200,.057,decay=.018)
        for f,g,d in [(801,.028,.061),(1579,.024,.043),(2701,.018,.032)]:
            c.strike(f,g,d,warble=4)
    else:
        c.sweep(540,1620,.034,start=.006,span=.095,decay=.085)
        c.puff(2000,8500,.025,start=.022,decay=.048,pulse=(.068,.050))

def root(c,hit):
    # Woody compression and twig shear, not steel/stone.
    if hit:
        c.puff(230,1250,.053,decay=.048)
        c.flecks(680,4700,[(.004,1),(.029,.55),(.049,.23)],.036)
    else:
        c.puff(240,1300,.036,start=.016,decay=.079)
        c.puff(770,3800,.027,start=.042,decay=.038)
        c.strike(380,.017,.039,start=.065)

def dust(c,hit):
    # Sand/fine grit moves in a cluster; weak/no musical body.
    if hit:
        c.puff(580,5200,.042,decay=.039)
        c.flecks(2200,10100,[(.012,.74),(.028,1),(.043,.52),(.074,.26)],.023)
    else:
        c.puff(900,7600,.031,start=.021,decay=.097,pulse=(.085,.070))
        c.flecks(3000,9700,[(.039,.24),(.071,.20)],.018)

MATERIALS={
    "steel": steel, "claw": claw, "bone": bone, "stone": stone,
    "wet": wet, "arrow": arrow, "spectral": spectral, "ash": ash,
    "holy": holy, "arcane": arcane, "root": root, "dust": dust,
}

def special(c,key):
    if key=="sfx-critical-warning":
        # Keep exact two-pulse danger grammar. Do not mistake this for approval
        # to replace a gameplay critical warning without real mixed listening.
        for at,f,g in [(0,1500,.077),(.122,1170,.091)]:
            c.strike(f,g,.069,at,attack=.002)
            c.strike(f*1.53,g*.25,.052,at)
            c.puff(2200,6500,.022,start=at,decay=.010)
    elif key=="sfx-hero-steel-swing":
        c.puff(690,7200,.044,start=.019,decay=.08,pulse=(.087,.057))
        c.puff(2400,8900,.018,start=.036,decay=.05,pulse=(.103,.037))
    elif key=="sfx-hero-steel-impact":
        steel(c,True)
        c.puff(2300,9200,.019,start=.011,decay=.027)
    elif key=="sfx-power-strike":
        c.puff(370,2100,.056,decay=.065)
        c.strike(220,.039,.066)
        c.puff(1750,6900,.040,start=.008,decay=.027)
        c.strike(1470,.031,.053,start=.011)
    elif key=="sfx-holy-cleave":
        c.puff(800,5500,.047,start=.008,decay=.033)
        c.strike(1270,.036,.063,start=.011)
        c.strike(1925,.024,.073,start=.016)
        c.puff(2300,8400,.023,start=.038,decay=.050)
    elif key=="sfx-piercing-volley":
        for at,w in [(0,.72),(.076,.56),(.157,1.0)]:
            c.strike(421,.032*w,.034,at)
            c.strike(848,.015*w,.023,at)
            c.puff(1200,6100,.032*w,start=at,decay=.014)
        c.puff(2100,9000,.021,start=.13,decay=.050)
    else:raise ValueError("Unknown special "+key)

def expected_ids():
    manifest=json.loads((ROOT/"assets/audio/manifest.json").read_text())
    ordered=[key for key,entry in manifest["assets"].items() if entry["kind"]=="effect"]
    assert len(ordered)==30, "Owner phase one preserves exact 30 current recorded effects"
    return manifest,ordered

def main():
    manifest,ids=expected_ids()
    rows=[]
    for key in ids:
        parts=key.split("-")
        if len(parts)==3 and parts[1] in MATERIALS and parts[2] in ("release","impact"):
            impact=parts[2]=="impact"
            c=Canvas(key,.285 if impact else .32)
            MATERIALS[parts[1]](c,impact)
            family=parts[1]
        else:
            lengths={"sfx-critical-warning":.30,"sfx-hero-steel-swing":.24,
              "sfx-hero-steel-impact":.30,"sfx-power-strike":.32,
              "sfx-holy-cleave":.35,"sfx-piercing-volley":.34}
            assert key in lengths,key
            c=Canvas(key,lengths[key]);special(c,key);family="special"
        pcm=c.finish()
        filename=key+".wav";dest=OUT/filename
        with wave.open(str(dest),"wb") as w:
            w.setframerate(SR);w.setnchannels(1);w.setsampwidth(2);w.writeframes(pcm.tobytes())
        rows.append({
          "id":key,"title":manifest["assets"][key].get("title",key),
          "baseline":manifest["assets"][key]["src"],"family":family,
          "file":filename,"duration":len(pcm)/SR,
          "sha256":hashlib.sha256(dest.read_bytes()).hexdigest(),
          "peak":round(float(np.max(np.abs(pcm.astype(float)/32768)),6),
          "rms":round(float(np.sqrt(np.mean((pcm.astype(float)/32768)**2))),6),
        })
    (OUT/"candidate-manifest.json").write_text(json.dumps({
      "status":"SOURCE-REVISED, UNHEARD PHASE ONE REPLACEMENT STUDIES; NOT GAME AUDIO",
      "source":"tools/audio/sfx-30-studio.py",
      "originalRegistrationCount":len(ids),
      "candidateCount":len(rows),
      "creativeLimits":"No claim of foley realism, phone acceptance, combat mixing or owner artistic approval",
      "cues":rows,
    },indent=2)+"\n")
    print("Rendered",len(rows),"non-shipping registered-ID candidates into",OUT)

if __name__=="__main__": main()
