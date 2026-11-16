#!/usr/bin/env python3
"""SIBDLP non-shipping sound-effect identity studies.

Independent original-synthesis candidate studies, NOT replacements for original
assets or registered in the game. The full game owns its event timing and mixing.
Run: python3 tools/audio/sfx-pilot-studio.py [OUTPUT_DIR]
Dependencies: numpy, scipy. Files are deterministic on supported NumPy builds.
"""
import math, json, sys, wave, hashlib
from pathlib import Path
import numpy as np
from scipy import signal

RATE = 48000
SEED = 88312026
rng = np.random.default_rng(SEED)
OUT = Path(sys.argv[1] if len(sys.argv) > 1 else 'sibdlp_sfx_pilot')
OUT.mkdir(parents=True, exist_ok=True)


def time(n):
    return np.arange(n, dtype=np.float64) / RATE


def band_noise(n, lo, hi, seed_rng=None):
    source = (seed_rng or rng).standard_normal(n)
    hi = min(hi, RATE*.48)
    b, a = signal.butter(2, [lo, hi], btype='bandpass', fs=RATE)
    y = signal.lfilter(b, a, source)
    return y / max(1e-8, np.sqrt(np.mean(y*y)))


def lp_noise(n, high):
    b,a=signal.butter(2, high, fs=RATE)
    s=signal.lfilter(b,a,rng.standard_normal(n))
    return s/max(1e-8,np.sqrt(np.mean(s*s)))


def s_env(t, attack, decay):
    return np.minimum(1, t/max(attack,1e-6)) * np.exp(-t/max(decay, 1e-6))


def tone(t, frequency, amp=1, decay=.1, phase=0.0):
    return amp * np.sin(2*np.pi*frequency*t+phase) * s_env(t,.002,decay)


def whoosh(n, low, high, center=.12, spread=.085):
    t=time(n)
    left=band_noise(n,low,high)
    sweep=(.55+.45*np.sin(np.pi*np.clip((t-(center-spread))/(2*spread),0,1)))
    blob=np.exp(-.5*((t-center)/spread)**2)
    return left*blob*sweep


def transients(n, events):
    t=time(n); out=np.zeros(n)
    for at,freq,level,decay in events:
        d=t-at; mask=(d>=0)
        q=np.maximum(0,d)
        out += level*np.sin(2*np.pi*freq*q)*np.minimum(q/.001,1)*np.exp(-q/decay)*mask
    return out


def material_blade_swish():
    # Sword acceleration is airy lateral motion, not an impact/explosion.
    n=int(.23*RATE);t=time(n)
    body=whoosh(n,680,6800,.105,.053)*.064
    edge=band_noise(n,2200,8000)*np.exp(-.5*((t-.13)/.028)**2)*.019
    return body+edge

def material_blade_contact():
    n=int(.30*RATE);t=time(n)
    # Bright steel contact, without prolonged melodic ringing.
    ring=sum(tone(t,f,a,d) for f,a,d in [(1271,.055,.052),(1777,.058,.087),(2633,.033,.059),(3911,.017,.038)])
    rasp=band_noise(n,1400,8200)*.067*s_env(t,.0005,.023)
    body=band_noise(n,340,1900)*.033*s_env(t,.001,.035)
    return ring+rasp+body

def ranger_bow_loose():
    n=int(.26*RATE);t=time(n)
    string=sum(tone(t,f,a,d) for f,a,d in [(219,.041,.063),(427,.034,.051),(649,.018,.039)])
    snap=band_noise(n,720,4800)*.050*s_env(t,.0008,.016)
    departure=whoosh(n,1300,6900,.056,.030)*.028
    return string+snap+departure

def ranger_arrow_hit():
    # V1 failed portable-speaker energy review: ~72% of impact energy below 350 Hz.
    n=int(.235*RATE);t=time(n)
    wood=band_noise(n,560,2600)*.060*s_env(t,.0005,.024)
    bite=band_noise(n,2100,8700)*.045*s_env(t,.0003,.012)
    shaft=sum(tone(t,f,a,d) for f,a,d in [(690,.038,.047),(1300,.024,.056),(2110,.012,.039)])
    return wood+bite+shaft

def mage_arcane_release():
    n=int(.32*RATE);t=time(n)
    freq=530+920*(1-np.exp(-t/.075))
    ph=2*np.pi*np.cumsum(freq)/RATE
    rise=(1-np.exp(-t/.021))*np.exp(-t/.095)
    core=.051*np.sin(ph)*rise+.026*np.sin(1.81*ph+np.sin(2*np.pi*16*t))*rise
    air=band_noise(n,1500,7600)*.024*np.exp(-.5*((t-.090)/.052)**2)
    return core+air

def mage_arcane_impact():
    n=int(.26*RATE);t=time(n)
    shards=sum(tone(t,f,a,d) for f,a,d in [(811,.038,.079),(1719,.046,.069),(2861,.027,.052),(4087,.014,.045)])
    flash=band_noise(n,1900,9500)*.055*s_env(t,.0005,.016)
    return shards+flash

def rogue_bell_basic():
    # Small spherical jingle shell: two short loose collisions, no handbell sustain.
    n=int(.275*RATE);t=time(n)
    y=np.zeros(n)
    for at,g in [(0,.85),(.039,.54)]:
        q=np.maximum(0,t-at);mask=(t>=at)
        for f,a,d in [(2280,.039,.045),(3510,.027,.055),(4730,.018,.029),(6220,.009,.024)]:
            y+=g*a*np.sin(2*np.pi*f*q)*np.minimum(1,q/.0009)*np.exp(-q/d)*mask
        y+=g*band_noise(n,1850,9600)*.027*np.minimum(1,q/.001)*np.exp(-q/.014)*mask
    return y

def rogue_bell_performance():
    # Three articulated taps from the same little bell, not a pitched melody.
    n=int(.515*RATE);t=time(n);y=np.zeros(n)
    for at,g in [(0,.8),(.146,.56),(.325,.94)]:
        q=np.maximum(0,t-at);mask=(t>=at)
        for f,a,d in [(2280,.039,.045),(3510,.027,.055),(4730,.018,.029),(6220,.009,.024)]:
            y+=g*a*np.sin(2*np.pi*f*q)*np.minimum(1,q/.0009)*np.exp(-q/d)*mask
        y+=g*band_noise(n,1850,9600)*.027*np.minimum(1,q/.001)*np.exp(-q/.014)*mask
    return y

def enemy_claw_contact():
    n=int(.27*RATE);t=time(n)
    tear=band_noise(n,450,3500)*.068*np.exp(-.5*((t-.024)/.016)**2)
    scrape=band_noise(n,1350,6900)*.048*np.exp(-.5*((t-.079)/.042)**2)
    body=band_noise(n,180,800)*.036*s_env(t,.001,.041)
    return tear+scrape+body

def warning_two_pulse():
    # Warning must compete with music; distinct midrange pair, not subbass.
    n=int(.33*RATE);t=time(n);y=np.zeros(n)
    for at,f,amp in [(0,1420,.087),(.132,1120,.096)]:
        q=np.maximum(0,t-at);mask=(t>=at)
        y+=amp*np.sin(2*np.pi*f*q)*np.minimum(q/.002,1)*np.exp(-q/.073)*mask
        y+=.023*np.sin(2*np.pi*1.53*f*q)*np.minimum(q/.002,1)*np.exp(-q/.061)*mask
        y+=.028*band_noise(n,2300,5700)*np.minimum(q/.001,1)*np.exp(-q/.018)*mask
    return y

STUDIES={
 'paladin-sword-swing':('Paladin sword swing','Air displacement and a thin steel edge, distinct from impact.',material_blade_swish),
 'paladin-sword-impact':('Paladin sword contact','Steel-on-armor contact with crisp inharmonic ring and brief body.',material_blade_contact),
 'ranger-arrow-release':('Ranger bow release','Plucked bowstring and a separate arrow departure.',ranger_bow_loose),
 'ranger-arrow-impact':('Ranger arrow impact','Contact, short crack and shaft vibration; no release repeated.',ranger_arrow_hit),
 'mage-arcane-release':('Mage arcane release','Ascending, modulated arcane energy with controlled noise.',mage_arcane_release),
 'mage-arcane-impact':('Mage arcane impact','Crystalline contact distinct from the rising release.',mage_arcane_impact),
 'rogue-bell-basic':('Rogue staff bell: basic','One spherical loose-shell jingle, two short impacts; no handbell sustain.',rogue_bell_basic),
 'rogue-bell-performance':('Rogue staff bell: performance','The same small loose-shell bell, three short rhythmic jingle clusters.',rogue_bell_performance),
 'enemy-claw-contact':('Creature claw contact','Short organic tear, scratch and physical body instead of pitched chime.',enemy_claw_contact),
 'critical-warning-study':('Danger warning study','Two short distinct pulses; experimental only, not a replacement for the live warning.',warning_two_pulse),
}
metadata=[]
for i,(key,(name,goal,render)) in enumerate(STUDIES.items()):
    # Independent stable event seed: cue catalog reordering must not change WAV identity.
    rng = np.random.default_rng((SEED + int.from_bytes(hashlib.sha256(key.encode()).digest()[:8], 'little')) % (1 << 64))
    y=np.asarray(render(),dtype=np.float64)
    assert np.isfinite(y).all() and y.ndim == 1
    y=y-y.mean()
    ramp=min(round(.0015*RATE),len(y)//10)
    y[:ramp]*=np.linspace(0,1,ramp)
    y[-ramp:]*=np.linspace(1,0,ramp)
    peak=np.max(np.abs(y))
    y=y*min(1,.38/max(peak,1e-9))
    peak=float(np.max(np.abs(y)));rms=float(np.sqrt(np.mean(y*y)))
    assert .015 < peak < .5 and .002 < rms < .22
    path=OUT/(key+'.wav')
    pcm=np.round(np.clip(y,-1,1)*32767).astype('<i2')
    with wave.open(str(path),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(pcm.tobytes())
    metadata.append(dict(id=key,title=name,brief=goal,sample_rate=RATE,channels=1,duration=round(len(y)/RATE,3),peak=round(peak,5),rms=round(rms,5),file=path.name))
(OUT/'pilot-manifest.json').write_text(json.dumps(dict(status='V2 SOURCE-REVISED, UNHEARD CONCEPTS, NOT LIVE GAME AUDIO',method='deterministic original spectral/physical-inspired synthesis',source='sfx-pilot-studio.py',cues=metadata),indent=2)+'\n')
print(json.dumps(dict(cues=len(metadata),min_peak=min(x['peak'] for x in metadata),max_peak=max(x['peak'] for x in metadata),durations=[x['duration'] for x in metadata]),indent=2))
