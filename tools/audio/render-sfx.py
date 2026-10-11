"""Original short SFX masters, reproducible without third-party samples.
Run: python3 tools/audio/render-sfx.py [--id sfx-stone-impact]
Preserves imported replacements, edited guides and unrelated assets/routing.
"""
from pathlib import Path
import argparse, hashlib, json, wave
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
OWNER='sfx-book'
def render(cue,rate):
    n=round(cue['seconds']*rate); t=np.arange(n)/rate
    rng=np.random.default_rng(cue['seed'])
    freq=np.fft.rfftfreq(n,1/rate)
    shape=np.exp(-(freq/cue['noiseHz'])**4)*(1-np.exp(-(freq/180)**4))
    noise=np.fft.irfft(np.fft.rfft(rng.normal(0,1,n))*shape,n=n)
    noise/=max(np.sqrt(np.mean(noise**2)),1e-9)
    start,end=cue['fromHz'],cue['toHz']
    phase=2*np.pi*np.cumsum(end+(start-end)*np.exp(-t/.045))/rate
    attack=np.minimum(t/.003,1); tail=np.maximum(1-t/cue['seconds'],0)**3
    result=(noise*.10*np.exp(-t/.055)+np.sin(phase)*.12*np.exp(-t/.085))*attack*tail
    if cue['material'] in ['steel','bone','holy']:
        for ratio in [1,1.47,2.09]: result+=.035*np.sin(2*np.pi*start*ratio*t)*np.exp(-t/.08)*attack*tail
    if cue['material']=='wet':result+=.045*np.sin(phase*1.72)*np.exp(-t/.045)*attack*tail
    if cue['material']=='warning':
        result*=.22
        for at,hz,level in [(0,831,.16),(.11,622,.13)]:
            u=np.maximum(t-at,0); env=np.where(t>=at,np.minimum(u/.004,1)*np.exp(-u/.045),0)
            # Each warning pulse owns its local tail; the global envelope
            # previously reduced the second pulse before it even began.
            pulse_tail=np.maximum(1-u/.16,0)**2
            result+=level*np.sin(2*np.pi*hz*u)*env*pulse_tail
    if cue['id']=='sfx-piercing-volley':
        original=result.copy();result*=.55
        for delay in [.07,.14]:
            k=round(delay*rate);result[k:]+=original[:-k]*.4
    result-=result.mean();result*=np.minimum(t/.002,1)*np.minimum((cue['seconds']-t)/.012,1)
    peak=float(np.max(np.abs(result)));rms=float(np.sqrt(np.mean(result**2)))
    assert 0.01<peak<.85 and .004<rms<.2 and np.isfinite(result).all()
    return result,{'peak':round(peak,6),'rms':round(rms,6),'first':round(float(result[0]),6),'last':round(float(result[-1]),6)}
def main():
    parser=argparse.ArgumentParser();parser.add_argument('--id');args=parser.parse_args()
    book=json.loads((ROOT/'tools/audio/sfx-book.json').read_text());manifest=json.loads((ROOT/'assets/audio/manifest.json').read_text());metrics={}
    # A single-cue render must retain measurements for untouched masters.
    measurements=ROOT/'tools/audio/sfx-measurements.json'
    if args.id and measurements.exists():metrics=json.loads(measurements.read_text())
    rendered=0
    outdir=ROOT/'assets/audio/effects';outdir.mkdir(exist_ok=True)
    for cue in book['cues']:
        if args.id and args.id!=cue['id']:continue
        old=manifest['assets'].get(cue['id'])
        if old and old.get('managedBy')!=OWNER:continue
        signal,metrics[cue['id']]=render(cue,book['sampleRate']);rendered+=1;file=outdir/(cue['id']+'.wav')
        with wave.open(str(file),'wb') as w:
            w.setnchannels(1);w.setsampwidth(2);w.setframerate(book['sampleRate']);w.writeframes((signal*32767).astype('<i2').tobytes())
        manifest['assets'][cue['id']]={**(old or {}),'kind':'effect','src':'./'+str(file.relative_to(ROOT)),'duration':len(signal)/book['sampleRate'],'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'credits':{'author':'Azeroth Chronicles original synthesis','license':'CC0-1.0'},'managedBy':OWNER,'creationMethod':'deterministic-spectral-synthesis','title':cue['id'].replace('sfx-','').replace('-',' ').title(),'generationGuide':(old or {}).get('generationGuide',cue['guide']),'recipe':{'source':'tools/audio/sfx-book.json','id':cue['id'],'renderer':'tools/audio/render-sfx.py'}}
    # Validate the whole publishing contract before committing manifest metadata.
    candidate=ROOT/'assets/audio/sfx-candidate.json';candidate.write_text(json.dumps(manifest,indent=2)+'\n')
    import subprocess
    try:
        subprocess.run(['node','-e',"require('./scripts/audio-assets.cjs').publishedFiles(process.cwd(),require('./assets/audio/sfx-candidate.json'))"],cwd=ROOT,check=True)
        candidate.replace(ROOT/'assets/audio/manifest.json')
    finally:
        candidate.unlink(missing_ok=True)
    (ROOT/'tools/audio/sfx-measurements.json').write_text(json.dumps(metrics,indent=2)+'\n')
    print('Rendered',rendered,'original short mono SFX; measured finite peaks/RMS and zero-edge envelopes.')
if __name__=='__main__':main()
