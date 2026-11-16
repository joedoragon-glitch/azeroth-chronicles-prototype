#!/usr/bin/env python3
"""SIBDLP phase-one original 30-ID SFX masters. No new skills or event identities.

Original authored hybrid transient/resonator synthesis, no third-party samples.
Stable cue-specific seeds, short mono master, staged player-event distinction.
Default: render unregistered previews. --integrate archives exact previous assets
and swaps ONLY the 30 existing effect IDs, with complete/partial rollback receipt.
--restore ID[,ID...] or --restore all: copy frozen old masters back by hash.
"""
from pathlib import Path
import argparse, hashlib, json, shutil, sys, wave
import numpy as np
from scipy import signal

ROOT=Path(__file__).resolve().parents[2]
RATE=48000
KEY="sfx-phase1-original-hybrid"
MANIFEST=ROOT/"assets/audio/manifest.json"
BACKUPS=ROOT/"tools/audio/sfx-legacy/dev288"
ROLLBACK=ROOT/"tools/audio/sfx-phase1-rollback.json"
METRICS=ROOT/"tools/audio/sfx-phase1-metrics.json"
PROFILES=("steel","claw","bone","stone","wet","arrow","spectral","ash","holy","arcane","root","dust")
SPECIALS=("critical-warning","hero-steel-swing","hero-steel-impact","power-strike","holy-cleave","piercing-volley")
IDS=tuple(f"sfx-{name}-{stage}" for name in PROFILES for stage in ("release","impact"))+tuple("sfx-"+s for s in SPECIALS)
T=np.arange(int(RATE*.65))/RATE
RNG=None

def noise(lo,hi):
    global RNG
    a=RNG.normal(size=len(T))
    if hi is not None:
        sos=signal.butter(2,[lo,min(hi,RATE*.47)],btype="bandpass",fs=RATE,output="sos")
    else:
        sos=signal.butter(2,lo,btype="highpass",fs=RATE,output="sos")
    x=signal.sosfilt(sos,a)
    return x/max(1e-9,float(np.sqrt(np.mean(x*x))))

def env(start=.0,attack=.001,fall=.04):
    t=np.maximum(T-start,0)
    return (T>=start)*np.minimum(t/max(.0001,attack),1)*np.exp(-t/max(.001,fall))

def burst(lo,hi,vol=.04,at=0,attack=.001,decay=.04):
    return noise(lo,hi)*vol*env(at,attack,decay)

def partial(freq,vol,decay,at=0,phase=0):
    t=np.maximum(T-at,0)
    return vol*np.sin(2*np.pi*freq*t+phase)*env(at,.0016,decay)

def clang(freqs,at=0,scale=1,decay=.065):
    return sum(partial(f,amp*scale,decay/(1+i*.17),at) for i,(f,amp) in enumerate(freqs))

def pitch(start,end,vol=.04,at=0,duration=.12,decay=.06,kind='sine'):
    t=np.maximum(T-at,0)
    freq=end+(start-end)*np.exp(-t/max(.006,duration*.38))
    ph=2*np.pi*np.cumsum(freq)/RATE
    wave=np.sin(ph) if kind=='sine' else np.sin(ph)+.22*np.sin(2*ph)
    return vol*wave*env(at,.002,decay)

def puff(hz,at=0,vol=.04,tail=.06):
    return burst(max(120,hz*.5),min(15000,hz*2.1),vol,at,.0012,tail)

def swoop(lo,hi,at,spread,vol):
    return noise(lo,hi)*vol*np.exp(-.5*((T-at)/spread)**2)

# Different physical/imagined material events are independently voiced. Every
# release denotes departure/air/movement, every impact denotes true contact;
# no hit-like body sound on an intentionally silent miss stage.
def material(kind,stage):
    hit=stage=="impact"
    if kind=="steel":
        if hit:
            return (clang([(1097,.055),(1733,.051),(2621,.035),(3851,.019)],decay=.077)
                    +burst(1500,9000,.047,decay=.021)+puff(720,vol=.026,tail=.038))
        return swoop(600,7500,.091,.044,.064)+swoop(2300,11500,.139,.026,.018)
    if kind=="claw":
        if hit:
            return (swoop(390,3400,.031,.016,.090)+swoop(1400,7900,.086,.037,.049)
                    +puff(440,vol=.032,tail=.042))
        return swoop(850,5300,.077,.052,.060)+swoop(2200,9700,.145,.023,.016)
    if kind=="bone":
        if hit:
            return (clang([(710,.024),(1197,.045),(1963,.030)],decay=.038)
                    +burst(950,7200,.075,decay=.019)+puff(460,vol=.033,tail=.027))
        return (burst(1400,6200,.048,decay=.029)
                +partial(967,.028,.029)+swoop(1700,7000,.074,.039,.031))
    if kind=="stone":
        if hit:
            return (burst(210,1650,.102,decay=.062)+burst(1450,4100,.025,decay=.018)
                    +partial(272,.030,.085)+partial(480,.019,.052))
        return (swoop(180,1600,.108,.065,.049)+puff(410,vol=.025,tail=.076)
                +burst(900,3900,.016,at=.10,decay=.029))
    if kind=="wet":
        if hit:
            return (burst(180,1400,.086,decay=.06)+burst(800,4800,.052,at=.027,decay=.026)
                    +partial(325,.016,.043,at=.022))
        return (swoop(230,1850,.06,.042,.071)+swoop(750,4200,.143,.028,.038)
                +partial(460,.011,.045))
    if kind=="arrow":
        if hit:
            return (burst(640,2600,.071,decay=.020)+burst(1900,8100,.045,decay=.012)
                    +clang([(780,.029),(1390,.019),(2320,.014)],decay=.047))
        return (clang([(227,.036),(463,.027),(682,.013)],decay=.049)
                +burst(950,4700,.046,decay=.013)+swoop(1500,8200,.065,.028,.035))
    if kind=="spectral":
        if hit:
            return (pitch(1680,740,.035,decay=.12)+clang([(1831,.029),(2939,.019)],decay=.091)
                    +burst(2300,10500,.044,decay=.033))
        return (pitch(610,1650,.040,at=.018,duration=.125,decay=.105)
                +swoop(1250,8700,.11,.059,.029))
    if kind=="ash":
        if hit:
            return (burst(380,2600,.072,decay=.044)+burst(3100,12500,.041,at=.016,decay=.032)
                    +partial(362,.018,.074))
        return (swoop(500,4100,.091,.056,.054)+burst(2600,11000,.028,at=.064,decay=.074)
                +partial(547,.013,.061))
    if kind=="holy":
        if hit:
            return (clang([(625,.021),(1248,.040),(1877,.026),(3110,.015)],decay=.088)
                    +burst(2600,10900,.046,decay=.017))
        return (pitch(520,1250,.042,at=.014,decay=.079)
                +clang([(940,.017),(1871,.015)],at=.038,decay=.068)
                +burst(2400,9100,.023,decay=.031))
    if kind=="arcane":
        if hit:
            return (clang([(803,.031),(1667,.037),(2827,.022),(4191,.012)],decay=.077)
                    +burst(2100,9700,.060,decay=.017))
        return (pitch(540,1480,.040,at=.011,duration=.092,decay=.095)
                +swoop(1300,8500,.091,.05,.034)+partial(1980,.014,.061,at=.042))
    if kind=="root":
        if hit:
            return (burst(290,1600,.072,decay=.038)+burst(1300,6200,.058,at=.015,decay=.025)
                    +clang([(560,.021),(1120,.015)],decay=.043))
        return (swoop(360,2100,.085,.044,.051)
                +burst(1650,6500,.032,at=.056,decay=.031)
                +partial(356,.019,.051,at=.015))
    if kind=="dust":
        if hit:
            return (burst(950,7300,.062,decay=.023)+burst(270,1750,.045,decay=.030)
                    +burst(3200,13000,.020,at=.029,decay=.021))
        return (swoop(1000,8800,.101,.058,.058)
                +swoop(350,2150,.067,.037,.020))
    raise KeyError(kind)

def special(name):
    if name=="critical-warning":
        # two midrange danger pulses are never used as routine contact
        return (clang([(1317,.076),(1983,.028)],decay=.067)
                +clang([(1109,.090),(1674,.027)],at=.119,decay=.083)
                +burst(2300,6300,.026,decay=.016)
                +burst(2300,6300,.026,at=.119,decay=.016))
    if name=="hero-steel-swing":
        return swoop(700,7700,.096,.046,.058)+swoop(2100,10000,.151,.022,.016)
    if name=="hero-steel-impact":
        return (clang([(1141,.050),(1777,.062),(2693,.036),(4049,.017)],decay=.080)
                +burst(1500,8200,.061,decay=.019)+puff(790,vol=.025,tail=.036))
    if name=="power-strike":
        return (burst(280,1700,.082,decay=.061)
                +clang([(870,.034),(1460,.041),(2380,.022)],decay=.082)
                +burst(2200,7400,.056,at=.013,decay=.019))
    if name=="holy-cleave":
        return (swoop(950,6900,.072,.042,.037)
                +clang([(680,.022),(1350,.043),(2110,.027),(3270,.015)],at=.059,decay=.082)
                +burst(2300,9300,.043,at=.059,decay=.025))
    if name=="piercing-volley":
        y=np.zeros(len(T))
        for at,g in [(0,1),(.081,.78),(.161,.85)]:
            y+=g*(clang([(370,.029),(730,.025),(1240,.013)],at=at,decay=.047)
                  +burst(1050,6500,.048,at=at,decay=.012))
        return y
    raise KeyError(name)

CREATIVE={
    "steel":("Blade edge & metal tension","clean air-edge movement","resonant tempered-metal contact"),
    "claw":("Animal tear & scrape","unpitched scratch entering range","contact tear with short ripping drag"),
    "bone":("Dry calcified click","joint rattle before strike","hard brittle crack with dry debris"),
    "stone":("Dense mineral mass","weight shift with falling grit","solid mineral contact and quick gravel"),
    "wet":("Mud & biological fluid","shallow suction and splash","viscous contact with secondary spray"),
    "arrow":("Bowstring & wooden shaft","single string snap and aerodynamic departure","crisp target contact and shaft ring"),
    "spectral":("Unstable ghostly presence","ascending airy supernatural motion","reversed contour on spiritual collision"),
    "ash":("Cinder & hot dust","dry sweeping heat-grit","brief cinder crackle on hit"),
    "holy":("Restrained luminous magic","short rising harmonic radiance","bright consecrated contact, no choir"),
    "arcane":("Anomalous crystalline energy","accelerating harmonic flutter","short glass-like magical strike"),
    "root":("Splitting wooden fibers","fibrous brushing approach","snapped branch and root entanglement"),
    "dust":("Fine dry airborne particles","fine airy powder movement","compressed grit burst on contact"),
}
SPECIAL_INTENT={
    "critical-warning":"Two clearly separated midrange dangerous windup pulses; protected high-priority cue.",
    "hero-steel-swing":"Paladin basic sword air movement only; distinct from contact.",
    "hero-steel-impact":"Paladin basic sword contact only; tempered bright steel edge.",
    "power-strike":"Companion Soldier Power Strike, heavier steel body with short attack.",
    "holy-cleave":"Companion Paladin Holy Cleave, moving blade and distinct luminous contact.",
    "piercing-volley":"Companion Piercing Volley, three short bow launches, not a machine gun.",
}

def generate(key):
    global RNG
    RNG=np.random.default_rng((88312026+int.from_bytes(hashlib.sha256(key.encode()).digest()[:8],"little"))%(1<<64))
    raw=key[4:]
    if raw in SPECIALS:
        v=special(raw);duration={"critical-warning":.32,"hero-steel-swing":.25,
        "hero-steel-impact":.29,"power-strike":.32,"holy-cleave":.37,"piercing-volley":.36}[raw]
        guide=SPECIAL_INTENT[raw]
    else:
        family,stage=raw.rsplit("-",1)
        v=material(family,stage)
        duration={"release":.285,"impact":.27}[stage]
        guide=f"{CREATIVE[family][0]}. {CREATIVE[family][1 if stage=='release' else 2]}. Short mono event; no voice, musical bed, generic boom or delayed contact."
    v=np.asarray(v[:round(duration*RATE)],dtype=float)
    v-=v.mean()
    ramp=min(96,len(v)//8)
    v[:ramp]*=np.linspace(0,1,ramp)
    v[-ramp:]*=np.linspace(1,0,ramp)
    peak=float(np.max(np.abs(v)));rms=float(np.sqrt(np.mean(v*v)))
    assert peak>.005 and rms>.001 and np.isfinite(v).all(),key
    # Independent post-render quality audit found that v1 inflated some RMS
    # dramatically (hero sword swing 3.92x; warning 1.77x). That violates the
    # standing "better identity != louder" contract. Preserve each original
    # cue's relative presence, not a blanket RMS shared by all 30 sounds.
    original=json.loads((ROOT/"tools/audio/sfx-measurements.json").read_text())
    baseline=float(original[key]["rms"])
    assert .005<baseline<.2,("Missing original authored reference level",key)
    relative={"critical-warning":1.04,"hero-steel-swing":1.10,
              "hero-steel-impact":1.12,"power-strike":1.10,
              "holy-cleave":1.10,"piercing-volley":1.10}.get(
                raw,1.05 if raw.endswith("-release") else 1.10)
    target=baseline*relative
    v*=min(.40/peak,target/rms)
    peak=float(np.max(np.abs(v)));rms=float(np.sqrt(np.mean(v*v)))
    assert .025<peak<=.401 and .007<rms<.085,(key,peak,rms)
    pcm=np.round(np.clip(v,-1,1)*32767).astype('<i2')
    return pcm.tobytes(),round(len(v)/RATE,6),guide,dict(
        peak=round(peak,5),rms=round(rms,5),referenceRms=round(baseline,6),
        rmsRatio=round(rms/baseline,4),duration=round(len(v)/RATE,6))

def writewav(path,frames):
    path.parent.mkdir(parents=True,exist_ok=True)
    with wave.open(str(path),"wb") as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(frames)

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def writejson(path,data):path.write_text(json.dumps(data,indent=2,ensure_ascii=False)+"\n")

def render(out):
    table={}
    for key in IDS:
        data,seconds,guide,values=generate(key)
        dest=out/(key+".wav")
        writewav(dest,data)
        table[key]=dict(sha256=sha(dest),guide=guide,**values)
    return table

def integrate():
    assert not ROLLBACK.exists(),"Already integrated; restore selectively with --restore"
    manifest=json.loads(MANIFEST.read_text())
    effects={k:v for k,v in manifest["assets"].items() if v["kind"]=="effect"}
    assert set(effects)==set(IDS),("Unexpected current SFX keys",sorted(set(effects)^set(IDS)))
    assert all(v.get("managedBy")=="sfx-book" for v in effects.values()),"Not all 30 are untouched baseline assets"
    assert all(v["src"]=="./assets/audio/effects/"+k+".wav" for k,v in effects.items())
    expected={}
    for key,entry in effects.items():
        source=ROOT/entry["src"][2:]
        assert sha(source)==entry["sha256"],"Unexpected previous master: "+key
        expected[key]=entry["sha256"]
    BACKUPS.mkdir(parents=True,exist_ok=True)
    for key in IDS:
        shutil.copyfile(ROOT/effects[key]["src"][2:],BACKUPS/(key+".wav"))
        assert sha(BACKUPS/(key+".wav"))==expected[key]
    original_binding_map={key:[] for key in IDS}
    for event,bindings in manifest["director"]["events"].items():
        for index,binding in enumerate(bindings):
            if binding["asset"] in original_binding_map:
                original_binding_map[binding["asset"]].append(dict(
                    event=event,index=index,binding=binding))
    assert all(original_binding_map.values()),"Original 30 bindings incomplete"
    archive=dict(schemaVersion=1,origin="SIBDLP dev.288 pre-modernization 30 SFX assets",
                 originalEntries=effects,originalSha256=expected,
                 originalEventBindings=original_binding_map,
                 rollbackIncludes="WAV, master manifest entry and exact event playback binding",
                 archiveFolder=str(BACKUPS.relative_to(ROOT)),notPublished=True)
    writejson(ROLLBACK,archive)
    samples=render(ROOT/"assets/audio/effects")
    for key in IDS:
        file=ROOT/"assets/audio/effects"/(key+".wav")
        assert sha(file)==samples[key]["sha256"]
        entry=manifest["assets"][key]
        entry["sha256"]=samples[key]["sha256"]
        entry["duration"]=samples[key]["duration"]
        entry["credits"]={"author":"Original SIBDLP handcrafted hybrid SFX sound design",
                          "license":"Original project-owned audio; no third-party samples"}
        entry["managedBy"]=KEY
        entry["creationMethod"]="original-material-specific-hybrid-synthesis"
        entry["generationGuide"]=samples[key]["guide"]
        entry["recipe"]={"source":"tools/audio/sfx-phase1-master.py","id":key,
                         "renderer":"tools/audio/sfx-phase1-master.py"}
    writejson(MANIFEST,manifest)
    writejson(METRICS,{"status":"SOURCE/RENDER TECHNICAL CHECK; UNHEARD",
                       "retainedIds":len(IDS),"origin":"dev288","cues":samples})
    print("Integrated",len(IDS),"stable IDs, archived originals, new material-specific WAV masters")

def revise():
    # Safe rerender on an already staged development branch. Do not copy the
    # modernized candidate over the archived v4-era original recording.
    assert ROLLBACK.exists(),"No original audio archive to protect"
    book=json.loads(ROLLBACK.read_text())
    manifest=json.loads(MANIFEST.read_text())
    assert set(book["originalEntries"])==set(IDS)
    effects={k:v for k,v in manifest["assets"].items() if v["kind"]=="effect"}
    assert set(effects)==set(IDS)
    for key in IDS:
        old=BACKUPS/(key+".wav")
        assert sha(old)==book["originalSha256"][key],"Original immutable backup changed: "+key
        entry=effects[key]
        assert entry.get("managedBy")==KEY,("Unexpected active master owner",key)
        assert entry["src"]=="./assets/audio/effects/"+key+".wav"
        assert sha(ROOT/entry["src"][2:])==entry["sha256"],"Unexpected candidate change: "+key
    results=render(ROOT/"assets/audio/effects")
    for key in IDS:
        entry=manifest["assets"][key]
        entry["sha256"]=results[key]["sha256"]
        entry["duration"]=results[key]["duration"]
        entry["generationGuide"]=results[key]["guide"]
    writejson(MANIFEST,manifest)
    writejson(METRICS,{"status":"SOURCE/RENDER TECHNICAL CHECK; UNHEARD",
        "qualityRevision":"v2 reference-RMS balanced after adversarial gain audit",
        "retainedIds":len(IDS),"origin":"dev288","cues":results})
    print("Revised",len(IDS),"SFX within original level hierarchy; exact backups preserved")


def restore(ids):
    assert ROLLBACK.exists(),"No first-generation archive available"
    book=json.loads(ROLLBACK.read_text());manifest=json.loads(MANIFEST.read_text())
    to_restore=IDS if ids=="all" else tuple(ids.split(","))
    assert set(to_restore)<=set(IDS) and to_restore,"Unknown restoration ID(s)"
    assert len(set(to_restore))==len(to_restore),"Duplicate restoration IDs"
    assert set(book["originalEventBindings"])==set(IDS),"Original event-level rollback not proven"
    # Validate EVERY requested archive and active binding before altering files.
    # A corrupt member of an "all" restore must not leave half-updated assets.
    for key in to_restore:
        original=BACKUPS/(key+".wav")
        assert sha(original)==book["originalSha256"][key],"Frozen original archive hash mismatch"
        assert book["originalEntries"][key]["sha256"]==book["originalSha256"][key]
        assert manifest["assets"][key]["src"]==book["originalEntries"][key]["src"]
        for receipt in book["originalEventBindings"][key]:
            event=receipt["event"];index=receipt["index"]
            assert receipt["binding"]["asset"]==key
            assert manifest["director"]["events"][event][index]["asset"]==key,("Event binding topology changed",key,event)
    for key in to_restore:
        original=BACKUPS/(key+".wav")
        live=ROOT/"assets/audio/effects"/(key+".wav")
        shutil.copyfile(original,live)
        manifest["assets"][key]=book["originalEntries"][key]
        for receipt in book["originalEventBindings"][key]:
            manifest["director"]["events"][receipt["event"]][receipt["index"]]=receipt["binding"]
        assert sha(live)==manifest["assets"][key]["sha256"]
    writejson(MANIFEST,manifest)
    print("Restored",len(to_restore),"original WAV, authoring metadata AND event gains (rebuild/version before publishing)")

def main():
    p=argparse.ArgumentParser()
    mode=p.add_mutually_exclusive_group()
    mode.add_argument("--integrate",action="store_true")
    mode.add_argument("--revise",action="store_true")
    mode.add_argument("--restore",metavar="all|sfx-id[,sfx-id...]")
    p.add_argument("--out",default="/tmp/sibdlp-sfx-phase1")
    a=p.parse_args()
    if a.integrate: integrate()
    elif a.revise: revise()
    elif a.restore: restore(a.restore)
    else:
        data=render(Path(a.out));writejson(Path(a.out)/"sfx-phase1-preview.json",data)
        print("Rendered",len(data),"unregistered original candidate studies to",a.out)
if __name__=="__main__":main()
