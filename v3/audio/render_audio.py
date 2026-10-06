"""Reproduce the music-only 150-second score and its delivery QA.

Requirements: Python 3, numpy, scipy, ffmpeg, ffprobe.
Run: python render_audio.py
"""
from pathlib import Path
import hashlib
import json
import math
import re
import subprocess
import sys
import numpy as np
from scipy.io import wavfile

OUT = Path(__file__).resolve().parent
SOURCE = OUT / 'score_source_150s_float32.wav'
FINAL = OUT / 'soundtrack_150s.wav'

def command(args):
    return subprocess.run(args,check=True,capture_output=True,text=True)

def loudness(path):
    result=command(['ffmpeg','-hide_banner','-i',str(path),'-af',
                    'loudnorm=I=-16:TP=-3.3:LRA=18:print_format=json',
                    '-f','null','-'])
    match=re.search(r'\{\s*"input_i".*?\}',result.stderr,re.S)
    return json.loads(match.group(0))

if '--master-only' not in sys.argv:
    command([sys.executable,str(OUT/'compose_score.py')])
baseline=loudness(SOURCE)
gain_db=-16-float(baseline['input_i'])
passes=[]
for attempt in range(3):
    # Oversampled peak limiting controls only the loudest piano attacks and
    # preserves the authored pause. It does not normalise the quiet sections.
    filters=(f'aresample=192000,volume={gain_db:.8f}dB,'
             'alimiter=limit=0.66834:attack=5:release=120:level=false:latency=true,'
             'aresample=48000:resampler=soxr:precision=28,'
             'apad=whole_dur=150,atrim=duration=150')
    command(['ffmpeg','-hide_banner','-v','error','-y','-i',str(SOURCE),
             '-af',filters,'-ar','48000','-ac','2','-c:a','pcm_s24le',str(FINAL)])
    measured=loudness(FINAL)
    passes.append({'applied_gain_db':round(gain_db,5),'measured':measured})
    error=-16-float(measured['input_i'])
    if abs(error)<=.08: break
    gain_db+=error

sr,pcm=wavfile.read(FINAL)
audio=pcm.astype(np.float64)/2147483648
windows=[('opening',0,10),('historical_prelude',10,24),
         ('attention_prediction',24,50),('scale_build',50,55),('first_arrival',55,61),
         ('feedback',62,68),('chat_pause',69,72),('chat',74,80),
         ('multimodal_reasoning',80,99),('tools_build',99,112),
         ('action_arrival',115,119),('family',119,130),('coda',138,150)]
levels=[]
for name,start,end in windows:
    excerpt=audio[round(start*sr):round(end*sr)]
    rms=float(np.sqrt(np.mean(excerpt**2)))
    peak=float(np.max(np.abs(excerpt)))
    levels.append({'name':name,'start':start,'end':end,
                   'rms_dbfs':round(20*math.log10(max(1e-15,rms)),3),
                   'peak_dbfs':round(20*math.log10(max(1e-15,peak)),3)})
probe=json.loads(command(['ffprobe','-v','error','-show_streams','-show_format',
                          '-of','json',str(FINAL)]).stdout)
qa={
 'file':FINAL.name,'sha256':hashlib.sha256(FINAL.read_bytes()).hexdigest(),
 'sample_rate':sr,'channels':audio.shape[1],'frames':audio.shape[0],
 'duration_seconds':audio.shape[0]/sr,'codec':probe['streams'][0]['codec_name'],
 'bits_per_raw_sample':int(probe['streams'][0]['bits_per_raw_sample']),
 'integrated_lufs':float(measured['input_i']),
 'true_peak_dbtp':float(measured['input_tp']),
 'loudness_range_lu':float(measured['input_lra']),
 'peak_dbfs':round(20*math.log10(float(np.max(np.abs(audio)))),4),
 'first_frame':pcm[0].tolist(),'last_frame':pcm[-1].tolist(),
 'rms_windows':levels,'mastering_passes':passes,
 'content':'Original music only. No speech, TTS, copied reference audio or external samples.',
}
qa['checks']={
 'exact_150_seconds':audio.shape[0]==7200000,
 'stereo_48khz_24bit':sr==48000 and audio.shape[1]==2 and qa['bits_per_raw_sample']==24,
 'true_peak_below_minus_3':qa['true_peak_dbtp'] < -3,
 'loudness_within_0_2_lu_of_minus_16':abs(qa['integrated_lufs']+16)<=.2,
 'clean_boundaries':bool(np.max(np.abs(audio[0]))<.00001 and np.max(np.abs(audio[-1]))<.00001),
 'question_pause_is_quieter':levels[6]['rms_dbfs']<levels[1]['rms_dbfs']-12,
 'two_dynamic_arrivals':levels[4]['rms_dbfs']>levels[3]['rms_dbfs'] and levels[10]['rms_dbfs']>levels[9]['rms_dbfs'],
}
(OUT/'audio_QA.json').write_text(json.dumps(qa,indent=2))
manifest=json.loads((OUT/'audio_manifest.json').read_text())
manifest['measured_delivery']={key:qa[key] for key in [
    'sample_rate','channels','frames','duration_seconds','bits_per_raw_sample',
    'integrated_lufs','true_peak_dbtp','loudness_range_lu','sha256']}
(OUT/'audio_manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
print(json.dumps(qa,indent=2))
assert all(qa['checks'].values()), 'Delivery QA failed; inspect audio_QA.json'
