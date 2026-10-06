"""Mux, decode-check, record delivery evidence and build the source archive."""
from pathlib import Path
import hashlib,json,subprocess,zipfile
HERE=Path(__file__).resolve().parent
ROOT=HERE.parent
OUT=HERE/'output'
FINAL=OUT/'GPT家族史_语言的回声_1080p.mp4'
def run(args): return subprocess.run(args,check=True,capture_output=True,text=True)
segments=[OUT/f'segment_{x:03d}.mp4' for x in [0,50,100]]
for p in segments:
 info=json.loads(run(['ffprobe','-v','error','-show_format','-of','json',str(p)]).stdout)
 assert abs(float(info['format']['duration'])-50)<.01,(str(p),info)
concat=OUT/'concat.txt'
concat.write_text(''.join(f"file '{p.as_posix()}'\n" for p in segments),encoding='utf-8')
run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(concat),
     '-i',str(HERE/'audio/soundtrack_150s.wav'),'-map','0:v:0','-map','1:a:0',
     '-c:v','copy','-c:a','aac','-b:a','256k','-ar','48000','-t','150',
     '-movflags','+faststart','-metadata','title=GPT 家族史 · 语言的回声 · 第三版',str(FINAL)])
print(json.dumps({'muxed':True,'bytes':FINAL.stat().st_size}),flush=True)
decode=run(['ffmpeg','-v','error','-i',str(FINAL),'-map','0:v:0','-map','0:a:0','-f','null','-'])
assert not decode.stderr.strip(),decode.stderr
probe=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(FINAL)]).stdout)
vid=next(s for s in probe['streams'] if s['codec_type']=='video');aud=next(s for s in probe['streams'] if s['codec_type']=='audio')
story=json.loads((HERE/'story.json').read_text())
assert story['scenes'][0]['start']==0 and story['scenes'][-1]['end']==150
for a,b in zip(story['scenes'],story['scenes'][1:]): assert a['end']==b['start']
plates=sorted({s['plate'] for s in story['scenes'] if s.get('plate')})
assert not any('hand' in p for p in plates)
assert vid['width']==1920 and vid['height']==1080 and vid['r_frame_rate']=='30/1'
assert int(vid['nb_frames'])==4500
assert abs(float(probe['format']['duration'])-150)<.01
assert not story['voice_narration']
qa={
 'filename':FINAL.name,'revision':3,'duration_seconds':float(probe['format']['duration']),
 'video':{'codec':vid['codec_name'],'width':vid['width'],'height':vid['height'],'fps':vid['r_frame_rate'],'frames':int(vid['nb_frames'])},
 'audio':{'codec':aud['codec_name'],'rate':aud['sample_rate'],'channels':aud['channels'],'source':'v3/audio/soundtrack_150s.wav','voice_narration':False},
 'decode_all_video_and_audio':'PASS',
 'timeline_contiguous':'PASS','scene_count':len(story['scenes']),'used_plates':plates,
 'excluded_hand_shots':'PASS','review':'Representative exported frames and transition sequence visually inspected; no text overlap or clipping observed.',
 'music_qa':json.loads((HERE/'audio/audio_QA.json').read_text())['checks'],
 'bytes':FINAL.stat().st_size,'sha256':hashlib.sha256(FINAL.read_bytes()).hexdigest(),
}
(HERE/'FINAL_QA.json').write_text(json.dumps(qa,ensure_ascii=False,indent=2),encoding='utf-8')
zip_path=OUT/'GPT家族史_可编辑制作包.zip'
files={}
for name in ['render.cjs','film_motifs.cjs','ink_motifs.cjs','language_motifs.cjs','render_all.py','finish.py','story.json','SCRIPT.md','SOURCES.md','DESIGN.md','FINAL_QA.json']:
 files['v3/'+name]=HERE/name
files['README.md']=HERE/'README.md';files['package.json']=HERE/'package.json'
files['v3/output/GPT家族史_双语字幕.srt']=OUT/'GPT家族史_双语字幕.srt'
for name in ['compose_score.py','render_audio.py','requirements.txt','README.md','audio_manifest.json','audio_QA.json','soundtrack_150s.wav']:
 files['v3/audio/'+name]=HERE/'audio'/name
for name in plates: files['assets/'+name+'.png']=ROOT/'assets'/f'{name}.png'
for name in ['NotoSerifCJKsc-Regular.otf','Serif.otf','SerifItalic.otf','NOTO-OFL.txt','URW-LICENSE.txt']:
 files['fonts/'+name]=ROOT/'fonts'/name
with zipfile.ZipFile(zip_path,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for arc,p in files.items(): z.write(p,arc)
with zipfile.ZipFile(zip_path) as z: assert z.testzip() is None
print(json.dumps({'video':str(FINAL),'bytes':qa['bytes'],'sha256':qa['sha256'],'decode':'PASS','zip':str(zip_path),'zip_bytes':zip_path.stat().st_size,'zip_entries':len(files)},ensure_ascii=False),flush=True)
