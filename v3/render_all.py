"""Render the current 150-second film with bounded native-Canvas memory."""
import os, subprocess, concurrent.futures, pathlib, json, time
HERE=pathlib.Path(__file__).resolve().parent
env=dict(os.environ)
env['NODE_PATH']=env.get('CODEX_PRIMARY_RUNTIME_NODE_MODULES',env.get('NODE_PATH',''))
node=env.get('CODEX_PRIMARY_RUNTIME_NODE','node')
def run_segment(item):
    start,end=item
    out=HERE/'output'/f'segment_{start:03d}.mp4'
    log=HERE/'output'/f'segment_{start:03d}.log'
    with log.open('w') as f:
        p=subprocess.run([node,'--expose-gc',str(HERE/'render.cjs'),'segment',str(start),str(end),str(out)],env=env,stdout=f,stderr=subprocess.STDOUT)
    if p.returncode: raise RuntimeError(f'exit={p.returncode}\n'+log.read_text())
    print(json.dumps({'segment':start,'end':end,'bytes':out.stat().st_size}),flush=True)
    return out
if __name__=='__main__':
    (HERE/'output').mkdir(exist_ok=True)
    now=time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:
        files=list(ex.map(run_segment,[(0,50),(50,100),(100,150)]))
    concat=HERE/'output/concat.txt'
    concat.write_text(''.join(f"file '{p.as_posix()}'\n" for p in files),encoding='utf-8')
    soundtrack=HERE/'audio/soundtrack_150s.wav'
    if not soundtrack.is_file():
        raise FileNotFoundError('Run python v3/audio/render_audio.py first.')
    final=HERE/'output/GPT家族史_语言的回声_1080p.mp4'
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y',
                    '-f','concat','-safe','0','-i',str(concat),'-i',str(soundtrack),
                    '-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac',
                    '-b:a','256k','-ar','48000','-t','150','-movflags','+faststart',
                    '-metadata','title=GPT 家族史 · 语言的回声 · 第三版',
                    str(final)],check=True)
    print(json.dumps({'render_complete':True,'seconds':round(time.time()-now,1)}),flush=True)
