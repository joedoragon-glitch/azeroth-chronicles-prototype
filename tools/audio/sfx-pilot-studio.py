#!/usr/bin/env python3
"""SIBDLP non-shipping sound-effect identity studies.

Independent original-synthesis candidate studies, NOT replacements for original
assets or registered in the game. The full game owns its event timing and mixing.
Run: python3 sibdlp_sfx_pilot_studio.py [OUTPUT_DIR]
Dependencies: numpy, scipy. Files are deterministic on supported NumPy builds.
"""
import math, json, sys, wave
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
    n=int(.31*RATE); t=time(n)
    airy=whoosh(n,900,8500,.135,.085)*.16
    thin=.018*np.sin(2*np.pi*(2500*t+1500*t*t)) * np.exp(-.5*((t-.128)/.048)**2)
    trailing=band_noise(n,3200,11000)*np.exp(-.5*((t-.19)/.055)**2)*.022
    return airy+thin+trailing


def material_blade_contact():
    n=int(.42*RATE);t=time(n)
    ring=np.zeros(n)
    for f,a,d in [(1387,.12,.13),(1981,.083,.18),(2997,.068,.095),(4172,.038,.08),(5630,.026,.05)]:
        ring+=tone(t,f,a,d)
    scrape=band_noise(n,2400,10900)*.082*s_env(t,.0008,.032)
    steel=band_noise(n,650,5000)*.052*s_env(t,.0012,.055)
    body=tone(t,239,.047,.024)
    return ring+scrape+steel+body


def ranger_bow_loose():
    n=int(.36*RATE);t=time(n)
    string=sum(tone(t,f,a,d) for f,a,d in [(208,.08,.065),(417,.062,.048),(631,.039,.037),(832,.024,.034)])
    release=band_noise(n,650,4900)*.072*s_env(t,.0006,.026)
    shaft=whoosh(n,1600,9300,.092,.046)*.065
    return string+release+shaft


def ranger_arrow_hit():
    n=int(.31*RATE);t=time(n)
    thud=lp_noise(n,780)*.11*s_env(t,.0006,.037)
    crack=band_noise(n,1700,8000)*.063*s_env(t,.0002,.016)
    shaft=tone(t,321,.045,.095)+tone(t,718,.024,.071)
    return thud+crack+shaft


def mage_arcane_release():
    n=int(.44*RATE);t=time(n)
    rise=(1-np.exp(-t/.046))*np.exp(-t/.2)
    freq=400+1200*(1-np.exp(-t/.12))
    ph=2*np.pi*np.cumsum(freq)/RATE
    glimmer=.083*np.sin(ph)*rise+.048*np.sin(1.91*ph+np.sin(2*np.pi*17*t)) * rise
    fizz=band_noise(n,1500,9500)*.057*np.exp(-.5*((t-.12)/.10)**2)
    core=tone(t,581,.033,.24)
    return glimmer+fizz+core


def mage_arcane_impact():
    n=int(.43*RATE);t=time(n)
    glass=sum(tone(t,f,a,d) for f,a,d in [(487,.067,.17),(1109,.073,.13),(1739,.061,.09),(2877,.039,.11),(4093,.026,.065)])
    contact=band_noise(n,1800,12000)*.105*s_env(t,.0003,.025)
    shimmer=band_noise(n,4000,12000)*.034*s_env(t,.008,.14)
    return glass+contact+shimmer


def rogue_bell_basic():
    n=int(.48*RATE);t=time(n)
    modes=[(1080,.081,.17),(1435,.062,.21),(1968,.048,.12),(2727,.038,.15),(3561,.024,.10),(4741,.017,.075)]
    main=sum(tone(t,f,a,d) for f,a,d in modes)
    click=band_noise(n,3200,12000)*.039*s_env(t,.0004,.02)
    secondary=transients(n,[(.064,1968,.028,.047),(.067,2727,.022,.039)])
    return main+click+secondary


def rogue_bell_performance():
    n=int(.73*RATE);t=time(n)
    out=np.zeros(n)
    for index,(at,weight) in enumerate([(.0,.82),(.19,.67),(.41,1)]):
        d=t-at; q=np.maximum(d,0); m=d>=0
        for f,a,damp in [(1080,.073,.15),(1435,.053,.21),(1968,.043,.12),(2727,.031,.13),(3561,.018,.09)]:
            out+=weight*a*np.sin(2*np.pi*f*q)*np.minimum(1,q/.0018)*np.exp(-q/damp)*m
        out+=weight*band_noise(n,3200,12000)*.025*np.minimum(1,q/.001)*np.exp(-q/.012)*m
    return out


def enemy_claw_contact():
    n=int(.34*RATE);t=time(n)
    rip=band_noise(n,400,4300)*.102*np.exp(-.5*((t-.04)/.035)**2)
    scratch=band_noise(n,1800,10000)*.045*np.exp(-.5*((t-.096)/.06)**2)
    body=lp_noise(n,390)*.045*s_env(t,.001,.09)
    return rip+scratch+body


def warning_two_pulse():
    n=int(.38*RATE);t=time(n)
    y=transients(n,[(0,800,.093,.095),(.123,645,.11,.12)])
    for at in [0,.123]:
        u=np.maximum(t-at,0); mask=t>=at
        y+=.022*band_noise(n,1800,6800)*mask*np.minimum(u/.0005,1)*np.exp(-u/.01)
    return y


STUDIES={
 'paladin-sword-swing':('Paladin sword swing','Air displacement and a thin steel edge, distinct from impact.',material_blade_swish),
 'paladin-sword-impact':('Paladin sword contact','Steel-on-armor contact with crisp inharmonic ring and brief body.',material_blade_contact),
 'ranger-arrow-release':('Ranger bow release','Plucked bowstring and a separate arrow departure.',ranger_bow_loose),
 'ranger-arrow-impact':('Ranger arrow impact','Contact, short crack and shaft vibration; no release repeated.',ranger_arrow_hit),
 'mage-arcane-release':('Mage arcane release','Ascending, modulated arcane energy with controlled noise.',mage_arcane_release),
 'mage-arcane-impact':('Mage arcane impact','Crystalline contact distinct from the rising release.',mage_arcane_impact),
 'rogue-bell-basic':('Rogue staff bell: basic','One spherical hanging bell, one primary collision, subtle shell rattle.',rogue_bell_basic),
 'rogue-bell-performance':('Rogue staff bell: performance','The same bell, three controlled rhythmic strokes.',rogue_bell_performance),
 'enemy-claw-contact':('Creature claw contact','Short organic tear, scratch and physical body instead of pitched chime.',enemy_claw_contact),
 'critical-warning-study':('Danger warning study','Two short distinct pulses; experimental only, not a replacement for the live warning.',warning_two_pulse),
}
metadata=[]
for i,(key,(name,goal,render)) in enumerate(STUDIES.items()):
    y=np.asarray(render(),dtype=np.float64)
    assert np.isfinite(y).all() and y.ndim == 1
    y=y-y.mean()
    ramp=min(round(.0015*RATE),len(y)//10)
    y[:ramp]*=np.linspace(0,1,ramp)
    y[-ramp:]*=np.linspace(1,0,ramp)
    peak=np.max(np.abs(y))
    y=y*min(1,.46/max(peak,1e-9))
    peak=float(np.max(np.abs(y)));rms=float(np.sqrt(np.mean(y*y)))
    assert .015 < peak < .5 and .002 < rms < .22
    path=OUT/(key+'.wav')
    pcm=np.round(np.clip(y,-1,1)*32767).astype('<i2')
    with wave.open(str(path),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(pcm.tobytes())
    metadata.append(dict(id=key,title=name,brief=goal,sample_rate=RATE,channels=1,duration=round(len(y)/RATE,3),peak=round(peak,5),rms=round(rms,5),file=path.name))
(OUT/'pilot-manifest.json').write_text(json.dumps(dict(status='UNREVIEWED CONCEPTS, NOT LIVE GAME AUDIO',method='deterministic original spectral/physical-inspired synthesis',source='sibdlp_sfx_pilot_studio.py',cues=metadata),indent=2)+'\n')
print(json.dumps(dict(cues=len(metadata),min_peak=min(x['peak'] for x in metadata),max_peak=max(x['peak'] for x in metadata),durations=[x['duration'] for x in metadata]),indent=2))
