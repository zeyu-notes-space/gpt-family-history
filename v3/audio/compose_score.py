"""Original revised score: The Next Question (150 seconds).

Deterministic procedural composition and synthesis. No copied sound recording,
sample, melody, or training asset. Rendered at 32 kHz then upsampled by ffmpeg.
Music-only score with deliberate question pause, two crescendos, and a soft coda.
"""
from pathlib import Path
import json
import numpy as np
from scipy import signal
from scipy.io import wavfile

OUT=Path(__file__).resolve().parent
SR=32000
DURATION=150
N=SR*DURATION
RNG=np.random.default_rng(120518)
beat=60/72
bar=4*beat
stems={n:np.zeros((N,2),np.float32) for n in ('piano','strings','pluck','air')}

def frequency(m): return 440*2**((m-69)/12)
def place(stem, mono, start, amp=1, pan=0):
    i=int(round(start*SR)); j=min(N,i+len(mono))
    if i<0 or j<=i:return
    p=(np.clip(pan,-1,1)+1)*np.pi/4
    stems[stem][i:j,0]+=mono[:j-i]*np.cos(p)*amp
    stems[stem][i:j,1]+=mono[:j-i]*np.sin(p)*amp

def felt_piano(m, length=5.5, velocity=.65):
    f=frequency(m); t=np.arange(int(length*SR))/SR
    # Coupled unison strings with frequency-dependent inharmonic partials.
    out=np.zeros(len(t))
    for k in range(1,11):
        partial=f*k*np.sqrt(1+0.000055*k*k)
        amp=np.exp(-.29*(k-1))/k**.95
        decay=(1.7+260/f)/(1+.20*k)
        env=np.exp(-t/decay)
        # Small initial pitch relaxation and beating produce a felt instrument.
        relax=.0009*np.exp(-t/.10)
        phase=2*np.pi*partial*(t+relax*t)
        unison=np.sin(phase)+.36*np.sin(phase*1.00065+.3)+.31*np.sin(phase*.9993-.2)
        out+=amp*env*unison
    env=(1-np.exp(-t/.006))*np.minimum(1,(length-t)/.12)
    out*=env
    h=RNG.normal(0,1,len(t))
    h=signal.sosfilt(signal.butter(2,1600,fs=SR,output='sos'),h)
    out+=h*.04*np.exp(-t/.028)
    return (out*velocity*.32).astype(np.float32)

def plucked(m,length=3.2):
    f=frequency(m);t=np.arange(int(length*SR))/SR
    out=np.zeros(len(t))
    # Silk-string texture, intentionally rounded and non-percussive in the mix.
    for k in range(1,15):
        pick=np.sin(k*np.pi*.23)
        out+=pick*np.sin(2*np.pi*f*k*np.sqrt(1+.00009*k*k)*t+.02*k)*np.exp(-t*(.75+.33*k))/(k**.75)
    out*=(1-np.exp(-t/.003))
    return (out*.31).astype(np.float32)

def bowed(m,length,phase_offset=0):
    f=frequency(m);t=np.arange(int(length*SR))/SR
    attack=np.sin(np.minimum(t/1.0,1)*np.pi/2)**2
    release=np.sin(np.minimum((length-t)/1.4,1)*np.pi/2)**2
    out=np.zeros(len(t))
    vib=.0023*np.sin(2*np.pi*4.4*t+phase_offset)*(1-np.exp(-t/1.5))
    phase=2*np.pi*f*t + f*.0023/4.4*(1-np.cos(2*np.pi*4.4*t+phase_offset))
    for k in range(1,9):
        out+=(np.sin(k*phase)+.35*np.sin(k*phase*1.0009+.4)+.25*np.sin(k*phase*.9989-.3))*np.exp(-.25*k)/k**1.15
    breath=RNG.normal(0,1,len(t))
    breath=signal.sosfilt(signal.butter(2,[240,1300],btype='bandpass',fs=SR,output='sos'),breath)
    out=(out+.017*breath)*attack*release
    out*=.22*(1+.05*np.sin(2*np.pi*.31*t+phase_offset))
    return out.astype(np.float32)

# Each phrase is fitted to the editorial boundaries. Slight tempo changes feel
# like a played rubato score rather than a music bed cut to fit the film.
chords={
    'Dm9':(38,[57,60,64,65]), 'BbM7':(34,[57,60,62,65]),
    'F9':(41,[57,60,65,67]), 'C9':(36,[55,60,62,64]),
    'Gm9':(31,[55,57,62,65]), 'DmF':(41,[57,62,64,65]),
    'Am7':(33,[55,60,64,67]), 'Csus':(36,[55,60,62,65]),
    'F69':(41,[57,60,62,67]),
}
sections=[
    (0,10,['Dm9','Csus','Dm9'],0,.40,.02,.00),
    (10,24,['Dm9','BbM7','Gm9','Csus'],1,.51,.12,.02),
    (24,50,['F9','C9','Dm9','BbM7','Gm9','Csus','F9'],1,.57,.20,.05),
    (50,62,['F9','BbM7','Gm9','Csus'],2,.66,.26,.075),
    (62,68,['DmF','BbM7'],0,.37,.10,.00),
    (73.5,80,['F69','C9'],0,.37,.08,.00),
    (80,99,['Dm9','BbM7','F9','C9','Gm9','Csus'],1,.55,.18,.035),
    (99,119,['Dm9','BbM7','F9','Gm9','BbM7','Csus'],2,.66,.29,.075),
    (119,130,['F69','BbM7','Gm9'],1,.51,.20,.025),
    (130,141.5,['DmF','BbM7','F69'],0,.35,.12,.00),
]
events=[]
def record(kind,start,**extra):
    events.append(dict(kind=kind,time=round(float(start),3),**extra))

for begin,end,harmony,density,level,stringlevel,plucklevel in sections:
    local_bar=(end-begin)/len(harmony)
    local_beat=local_bar/4
    for b,c in enumerate(harmony):
        start=begin+b*local_bar
        bass,notes=chords[c]
        record('harmony',start,chord=c,phrase_start=begin)
        # Breath before the question: the final phrase has a clean release.
        piano_length=min(5.5,max(1.4,36-start)) if begin==10 else 5.5
        place('piano',felt_piano(bass+12,piano_length,.65),start+.018,.44*level,-.38)
        place('piano',felt_piano(bass+24,min(4,piano_length),.55),start+.035,.18*level,-.20)
        positions=[0,1.35,2.50] if density==0 else [0,.75,1.50,2.25,3]
        if density==2: positions=[0,.5,1,1.75,2.25,2.75,3.25]
        if b==len(harmony)-1: positions=positions[:-1]
        # Thinner first bar leaves the opening question suspended.
        if begin==0 and b==0: positions=[0,2.5]
        for q,pos in enumerate(positions):
            order=[0,2,1,3,2,1,3]
            m=notes[order[q%7]]
            onset=start+pos*local_beat+RNG.uniform(-.012,.012)
            length=min(4.8,max(.7,36-onset)) if begin==10 else 4.8
            v=level*(.90 if q==0 else .67)*RNG.uniform(.94,1.04)
            place('piano',felt_piano(m,length,.67),onset,v,.15+(m-62)*.035)
        if stringlevel:
            for q,m in enumerate([bass+12,notes[1],notes[3]]):
                if begin==10 and b<3 and q==2: continue
                length=local_bar+1.4
                if begin==10: length=min(length,max(.8,36-start))
                place('strings',bowed(m,length,q+b*.3),max(0,start-.1),stringlevel*(1 if q==0 else .57),[-.42,.30,.63][q])
        if plucklevel and not (begin==10 and b<3):
            slots=[.5,1.5,2.5] if density==2 else [1.5,3]
            for q,slot in enumerate(slots):
                m=notes[[2,0,3][q%3]]+12
                place('pluck',plucked(m),start+slot*local_beat,plucklevel,-.62+q*.23)

# The original seven-note motif becomes a four-note question, expands with
# learning, answers in the tools sequence, then returns in a human-scale coda.
motifs=[
    (1.0,[69,74,76,74],[0,1.4,3.4,5.7],.23),
    (13.0,[69,72,74,77,76],[0,1.4,2.6,4.2,6.2],.25),
    (25.0,[69,74,76,77,79,77,76],[0,1.2,2.4,3.4,4.8,6.5,8.0],.28),
    (36.0,[72,77,79,77,76],[0,1.5,3,5,7],.25),
    (52.0,[74,77,79,81,79,77,76],[0,1.2,2.5,3.8,5.2,7.3,9],.30),
    (75.0,[69,72,74],[0,1.4,3],.19),
    (82.0,[72,77,79,77,76],[0,1.5,3,5,7],.26),
    (101.0,[74,77,79,81,79,77],[0,1.45,3,4,6,8],.31),
    (113.5,[74,77,79,81],[0,.9,1.9,3],.32),
    (121.0,[77,76,74,72,69],[0,1.3,2.8,4.3,6],.27),
    (132.0,[74,72,69,65],[0,1.8,3.5,5.8],.23),
]
for start,mel,offsets,amp in motifs:
    for m,off in zip(mel,offsets):
        place('piano',felt_piano(m,5.7,.64),start+off,amp,.32)

# A long question mark, not dead air: one distant fifth rises from the pause.
place('piano',felt_piano(74,3.4,.30),71.2,.065,.28)
place('pluck',plucked(69,3),73.1,.028,-.32)
record('question_pause',68,end=73.5)

# First reveal opens the register around attention, while the second provides
# a larger, warm arrival on "Do it" without an aggressive impact sound.
for start,notes,amp in [(56.0,[53,57,60,65,69],.24),(116.1,[41,53,57,60,65,67,77],.31)]:
    for q,m in enumerate(notes):
        place('piano',felt_piano(m,6.2,.62),start+.045*q,amp,-.45+.14*q)
    record('crescendo_arrival',start)
for q,m in enumerate([65,69,72]):
    place('strings',bowed(m,5.1,q*.8),115.4,.18,.15+q*.22)

# Final F 6/9 cadence: a small echoed upper note and a long, dark release.
for q,m in enumerate([41,53,57,60,62,67]):
    place('piano',felt_piano(m,8.5,.55),141.5+.085*q,.32,-.5+q*.18)
for q,m in enumerate([53,60,67]):
    place('strings',bowed(m,7.2,q),141.3,.11,[-.40,.25,.58][q])
place('piano',felt_piano(77,5.7,.40),144.0,.14,.4)
record('final_cadence',141.5,chord='F6/9')

# Filtered room air and restrained musical swells are synthesised here; no
# field recording or reference-film audio enters the soundtrack.
noise=RNG.normal(0,1,N).astype(np.float32)
air=signal.sosfilt(signal.butter(2,[700,3300],fs=SR,btype='bandpass',output='sos'),noise).astype(np.float32)
t=np.arange(N,dtype=np.float32)/SR
place('air',air*.00045*(.75+.25*np.sin(2*np.pi*.041*t)),0,1,-.1)
for q,transition in enumerate([6,24,34,50,56,68,80,99,111,116.1,119,130,138]):
    length=1.8;size=int(length*SR);local=np.arange(size)/SR
    breath=RNG.normal(0,1,size)
    breath=signal.sosfilt(signal.butter(2,[400,3200],fs=SR,btype='bandpass',output='sos'),breath)
    shape=np.sin(np.pi*np.minimum(local/1.35,1))**2*np.exp(-local/1.3)
    place('air',(breath*shape*.008).astype(np.float32),transition-.65,1,-.25 if q%2 else .25)

dry=sum(stems.values())
wet=np.zeros_like(dry)
for delay,amp in [(0.039,.12),(.071,.09),(.113,.065),(.191,.050),(.307,.037),(.433,.026),(.617,.018),(.827,.014),(1.093,.009),(1.377,.006)]:
    d=int(delay*SR);wet[d:]+=dry[:-d,::-1]*amp
wet=signal.sosfilt(signal.butter(2,4300,fs=SR,output='sos'),wet,axis=0).astype(np.float32)
mix=dry+wet
# Post-reverb shaping leaves space around the public conversation at 68–73.5.
points=[(0,0),(.4,.68),(6,.88),(10,.72),(17,.74),(24,.89),
        (30,1.05),(34,.82),(44,.94),(50,1.02),(56,1.23),(60,1.18),
        (62,.74),(66,.68),(68,.15),(69,.055),(72,.055),(73.5,.48),(79,.67),
        (80,.8),(89,.9),(98,.84),(103,1.0),(111,1.10),(116.1,1.34),(118,1.28),
        (119,.96),(127,.88),(130,.65),(137,.57),(138,.69),(144,.60),(146,.44),(148,.17),(150,0)]
times,values=np.array(points).T
env=np.interp(t,times,values).astype(np.float32)
mix*=env[:,None]
mix=signal.sosfilt(signal.butter(2,38,fs=SR,btype='highpass',output='sos'),mix,axis=0).astype(np.float32)
# Float intermediate preserves all synthesis detail; mastering is a separate,
# reproducible step in render_audio.py. Native output has no accidental clips.
mix*=.76/float(np.max(np.abs(mix)))
mix[:320]*=np.linspace(0,1,320,dtype=np.float32)[:,None]
mix[-640:]*=np.linspace(1,0,640,dtype=np.float32)[:,None]
wavfile.write(OUT/'score_source_150s_float32.wav',SR,mix)
manifest={
 'title':'The Next Question',
 'duration_seconds':150,'seed':120518,'native_sample_rate':SR,
 'composition':'Original deterministic procedural composition and synthesis, adapted from the original commissioned score. No third-party recording, sample or reference-film audio.',
 'speech':False,
 'instrumentation':['warm felt piano','rounded silk-string plucks','soft bowed-string ensemble','synthesised room air'],
 'delivery':{'filename':'soundtrack_150s.wav','sample_rate':48000,'channels':2,'pcm_bits':24,'target_lufs':-16,'maximum_true_peak_dbtp':-3},
 'arc':[
  {'from':0,'to':24,'feel':'an intimate question and historical prelude'},
  {'from':24,'to':62,'feel':'attention, prediction and the growth of GPT; first arrival at 56'},
  {'from':62,'to':80,'feel':'human feedback and a quiet conversation; pause at 68–73.5'},
  {'from':80,'to':119,'feel':'perception, reasoning and tools; warm arrival at 116.1'},
  {'from':119,'to':150,'feel':'the family tree, a human question, and an ink landscape'}],
 'events':events,
}
(OUT/'audio_manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps({'source':str(OUT/'score_source_150s_float32.wav'),'duration_seconds':150,'native_peak_dbfs':float(20*np.log10(np.max(np.abs(mix))))}))
