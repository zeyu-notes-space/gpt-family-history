'use strict';
const fs=require('fs');
const path=require('path');
const {spawn}=require('child_process');
const {once}=require('events');
const {createCanvas,loadImage,GlobalFonts}=require('@napi-rs/canvas');
const motifs=require('./language_motifs.cjs');
const ink=require('./ink_motifs.cjs');
const film=require('./film_motifs.cjs');

const story=require('./story.json');
const ROOT=path.resolve(__dirname,'..');
const OUT=path.join(__dirname,'output');
const W=1920,H=1080,FPS=story.fps;
GlobalFonts.registerFromPath(path.join(ROOT,'fonts/NotoSerifCJKsc-Regular.otf'),'Chinese');
GlobalFonts.registerFromPath(path.join(ROOT,'fonts/Serif.otf'),'Serif');
GlobalFonts.registerFromPath(path.join(ROOT,'fonts/SerifItalic.otf'),'SerifItalic');
const C={paper:'#f5eedb',ink:'#302a22',red:'#ac4439',gold:'#cba767',cream:'#f1e6d1',navy:'#101d29'};
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const ease=x=>1-Math.pow(1-clamp(x),3);
const mix=(a,b,t)=>a+(b-a)*t;
const TAU=Math.PI*2;
const images={};
let bluePlate,blueMask,blueCtx;
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let n=Math.imul(seed^seed>>>15,1|seed);n=n+Math.imul(n^n>>>7,61|n)^n;return((n^n>>>14)>>>0)/4294967296}}
const R=rng(4026);
const motes=Array.from({length:135},()=>({x:R()*W,y:R()*H,z:.2+R()*.8,p:R()*TAU,v:8+R()*25}));
const pages=Array.from({length:23},()=>({p:R(),x:R(),y:R(),z:R(),r:R()}));
const stars=Array.from({length:600},()=>({a:R()*TAU,h:R()*2-1,r:R(),p:R()*TAU}));
const grain=createCanvas(480,270),gc=grain.getContext('2d');
const noise=gc.createImageData(480,270);
for(let i=0;i<noise.data.length;i+=4){const n=80+R()*175;noise.data[i]=noise.data[i+1]=noise.data[i+2]=n;noise.data[i+3]=255;}gc.putImageData(noise,0,0);
function tx(ctx,str,x,y,size=40,color=C.ink,alpha=1,align='center',font='Chinese'){
  if(alpha<.002)return;ctx.save();ctx.globalAlpha*=clamp(alpha);ctx.fillStyle=color;ctx.font=`${size}px "${font}"`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(str,x,y);ctx.restore();
}
function fit(ctx,str,size,maxWidth,font='Chinese') {ctx.font=`${size}px "${font}"`;return Math.min(size,size*maxWidth/ctx.measureText(str).width)}
function rule(ctx,x1,y1,x2,y2,color,width=1,alpha=1){ctx.save();ctx.globalAlpha*=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.restore()}
function circle(ctx,x,y,r,color,alpha=1){ctx.save();ctx.globalAlpha*=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore()}
function flower(ctx,x,y,r,t,alpha=1){ctx.save();ctx.translate(x,y);ctx.rotate(t*.08);ctx.globalAlpha*=alpha;ctx.fillStyle=C.red;for(let j=0;j<6;j++){ctx.save();ctx.rotate(j*TAU/6);ctx.beginPath();ctx.ellipse(0,-r*.55,r*.34,r*.65,0,0,TAU);ctx.fill();ctx.restore();}circle(ctx,0,0,r*.16,C.gold);ctx.restore()}
function paper(ctx,t){ctx.fillStyle=C.paper;ctx.fillRect(0,0,W,H);const g=ctx.createRadialGradient(930+25*Math.sin(t*.08),450,60,960,530,1150);g.addColorStop(0,'rgba(255,253,242,.75)');g.addColorStop(.6,'rgba(254,248,230,.12)');g.addColorStop(1,'rgba(91,70,43,.19)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.save();ctx.globalAlpha=.052;ctx.drawImage(grain,-8+Math.sin(t*.2)*4,-4,W+16,H+8);ctx.restore();
  ctx.save();ctx.strokeStyle='rgba(118,93,55,.035)';ctx.lineWidth=.7;for(let i=0;i<65;i++){let y=30+i*17.4;ctx.beginPath();ctx.moveTo(0,y);ctx.bezierCurveTo(500,y+5,1400,y-6,1920,y+2);ctx.stroke();}ctx.restore();}
function dark(ctx,t){ctx.fillStyle='#0a0d10';ctx.fillRect(0,0,W,H);let g=ctx.createRadialGradient(960,470,10,960,470,1100);g.addColorStop(0,'#203446');g.addColorStop(.5,'#111b24');g.addColorStop(1,'#080a0c');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);dust(ctx,t,'#b99d73',.35);}
function dust(ctx,t,color=C.gold,intensity=.7){ctx.save();ctx.fillStyle=color;for(const p of motes){const x=(p.x+Math.sin(t*.11+p.p)*33+t*p.v*.16)%W,y=((p.y-t*p.v*.24)%H+H)%H;ctx.globalAlpha=intensity*p.z*(.18+.18*Math.sin(t*.7+p.p));ctx.beginPath();ctx.arc(x,y,.6+p.z*1.7,0,TAU);ctx.fill()}ctx.restore()}
function plate(ctx,name,t,dur){const im=images[name];if(!im){paper(ctx,t);return;}if(name==='11_cave_hand'||name==='12_keyboard_hand'){const z=Math.max(W/im.width,H/im.height)*1.035;ctx.drawImage(im,(W-im.width*z)/2,(H-im.height*z)/2,im.width*z,im.height*z);return;}const p=clamp(t/dur),s=1.035+.055*smooth(p),sx=(im.width-W/(W/im.width*s))/2;
  ctx.save();const scale=Math.max(W/im.width,H/im.height)*s;let dx=(W-im.width*scale)/2+Math.sin(p*1.7)*12,dy=(H-im.height*scale)/2+(p-.5)*11;ctx.drawImage(im,dx,dy,im.width*scale,im.height*scale);ctx.restore();
}
function edgeShade(ctx,amount=.6){const g=ctx.createRadialGradient(960,440,360,960,520,1250);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(0,0,0,${amount})`);ctx.fillStyle=g;ctx.fillRect(0,0,W,H)}
function softHaze(ctx,t,light=true){ctx.save();for(let i=0;i<3;i++){let x=500+i*550+Math.sin(t*.12+i)*130,y=660+i*45;let g=ctx.createRadialGradient(x,y,0,x,y,420);g.addColorStop(0,light?'rgba(247,239,217,.12)':'rgba(188,157,105,.065)');g.addColorStop(1,'rgba(247,239,217,0)');ctx.fillStyle=g;ctx.fillRect(x-430,y-430,860,860)}ctx.restore()}
function flyingPages(ctx,t,intensity=1){ctx.save();for(let i=0;i<pages.length;i++){const p=pages[i],u=(p.p+t*.032)%1,depth=.35+u*.9;let x=mix(1040,80+p.x*1800,u),y=mix(380,120+p.y*690,u);ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*.25+p.r*6)*.45);ctx.scale(depth,depth);let w=24+p.z*45,h=w*.7,flip=Math.cos(t*.55+p.r*6);ctx.globalAlpha=intensity*Math.sin(Math.PI*u)*.45;ctx.fillStyle='#e6d9b7';ctx.strokeStyle='#745c39';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-w*flip,-h);ctx.quadraticCurveTo(0,-h+12,w*flip,-h);ctx.lineTo(w*flip,h);ctx.quadraticCurveTo(0,h-12,-w*flip,h);ctx.closePath();ctx.fill();ctx.stroke();for(let k=0;k<3;k++)rule(ctx,-w*flip*.75,-h*.45+k*h*.43,w*flip*.7,-h*.45+k*h*.43,'#8b7656',.8,.6);ctx.restore()}ctx.restore()}
function title(ctx,t){ctx.fillStyle='#0c0b09';ctx.fillRect(0,0,W,H);const a=smooth((t-.3)/2);let g=ctx.createRadialGradient(970,470,15,970,470,580);g.addColorStop(0,'rgba(157,75,40,.18)');g.addColorStop(1,'rgba(15,10,9,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);dust(ctx,t,C.gold,.65);
  const chars=['G','P','T'];for(let i=0;i<3;i++){const k=ease((t-.3-i*.22)/1.8);tx(ctx,chars[i],700+i*265,570+(1-k)*35,290,C.cream,k,'center','Serif');}
  flower(ctx,655,408,25,t,a);tx(ctx,'家  族  史',960,721,52,C.cream,smooth((t-1.5)/1.3));tx(ctx,'语言的回声',960,790,26,'#bba68b',smooth((t-2.2)/1.3));tx(ctx,'A genealogy of language',960,847,26,'#a78d70',smooth((t-2.5)/1.2),'center','SerifItalic');
}
function rain(ctx,t){ctx.save();ctx.beginPath();ctx.rect(1110,40,760,760);ctx.clip();ctx.strokeStyle='#b9c6cc';for(let i=0;i<95;i++){let p=motes[i];let x=1150+p.x*.37,y=(p.y+t*(25+p.z*25))%800;ctx.globalAlpha=.07+p.z*.065;ctx.lineWidth=.6+p.z*.9;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-1,y+12+p.z*32);ctx.stroke()}ctx.restore()}
function sphere(ctx,t,radius=305,alpha=1,mode=0){ctx.save();ctx.translate(960,465);for(let i=0;i<stars.length;i++){const p=stars[i],theta=p.a+t*.11,phi=Math.acos(p.h),x0=Math.cos(theta)*Math.sin(phi),z=Math.sin(theta)*Math.sin(phi),y0=p.h;let pr=1/(1-z*.18),x=x0*radius*pr,y=y0*radius*.78*pr;ctx.globalAlpha=alpha*(.1+.45*(z+1)/2);ctx.fillStyle=i%9===0?C.red:C.gold;ctx.beginPath();ctx.arc(x,y,(.65+p.r*1.3)*pr,0,TAU);ctx.fill();if(i%43===0){ctx.strokeStyle=C.gold;ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x*.4,y*.4,-x*.65,y*.5);ctx.stroke()}}ctx.restore()}
function scaleScene(ctx,t,d){dark(ctx,t);const p=smooth(t/3);sphere(ctx,t,300+40*Math.sin(t*.13),p);tx(ctx,'175',940,538,205,C.cream,p,'center','Serif');tx(ctx,'BILLION PARAMETERS',960,610,25,'#d9bc80',p,'center','Serif');tx(ctx,'GPT-3',960,745,49,C.cream,smooth((t-2)/1.3),'center','Serif')}
function manuscript(ctx,t,d){paper(ctx,t);const a=smooth(t/1.5);ctx.save();ctx.translate(960,470);ctx.rotate(-.012);ctx.shadowColor='rgba(70,50,30,.11)';ctx.shadowBlur=30;ctx.shadowOffsetY=14;ctx.fillStyle='#fbf5e4';ctx.fillRect(-560,-240,1120,480);ctx.shadowColor='transparent';ctx.strokeStyle='rgba(78,59,33,.10)';ctx.strokeRect(-560,-240,1120,480);ctx.restore();
  const labels=['请把这段话写得更清楚。','保留事实，说明原因。','然后，检查你的答案。'];labels.forEach((v,i)=>{let q=smooth((t-.5-i*1.3)/1.1);tx(ctx,v.slice(0,Math.floor(v.length*ease(q))),960,352+i*127,41,C.ink,a,'center');if(q>.7){const len=260+50*i;rule(ctx,960-len,373+i*127,960-len+2*len*smooth((q-.7)/.3),373+i*127,C.red,1.8,.55)}});flower(ctx,1480,683,19,t,smooth((t-5)/1.0));}
function omni(ctx,t,d){paper(ctx,t);const cx=960,cy=472;for(let j=0;j<3;j++){let appear=smooth((t-j*.45)/1.6);ctx.save();ctx.translate(cx,cy);ctx.rotate(t*.055+j*TAU/3);ctx.strokeStyle=j===1?C.red:j===2?C.gold:C.ink;ctx.globalAlpha=appear*.65;ctx.lineWidth=1.8;ctx.beginPath();for(let k=0;k<=300;k++){let a=k/300*TAU,r=250+Math.sin(a*3+t*.55+j)*34+Math.sin(a*7-t*.4)*8;let x=Math.cos(a)*r,y=Math.sin(a)*r*.86;k?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();ctx.restore()}
  const labels=[['文 字',510,475],['视 觉',1410,475],['声 音',960,782]];labels.forEach((l,i)=>tx(ctx,l[0],l[1],l[2],34,C.ink,smooth((t-1-i*.7)/1.3)*.8));
  ctx.save();ctx.strokeStyle=C.red;ctx.lineWidth=2;ctx.globalAlpha=.75*smooth((t-1.2)/2);ctx.beginPath();for(let x=0;x<=480;x+=3){const env=Math.sin(x/480*Math.PI);let yy=Math.sin(x*.047-t*3.3)*Math.sin(x*.018+t*.45)*75*env;let px=720+x,py=472+yy;x?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.stroke();ctx.restore();tx(ctx,'omni',960,650,42,C.ink,smooth((t-2.5)/1.6),'center','SerifItalic');}
function tag(ctx,s,t){if(!s.year)return;const darkTheme=s.theme==='dark',a=smooth((t-.1)/.9);if(darkTheme){ctx.save();let g=ctx.createRadialGradient(250,95,0,250,95,420);g.addColorStop(0,'rgba(0,0,0,.28)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,750,300);ctx.restore();}rule(ctx,100,110,152,110,darkTheme?C.gold:C.red,1.5,a*.7);tx(ctx,s.year,173,107,26,darkTheme?C.cream:C.ink,a,'left','Serif');tx(ctx,s.tag,173,145,19,darkTheme?'#c7bba7':'#91836b',a*.88,'left');}
function subtitles(ctx,s,t){const cap=(s.captions||[]).find(c=>t>=c[0]&&t<c[1]);if(!cap)return;const a=smooth((t-cap[0])/.36)*smooth((cap[1]-t)/.35),isDark=s.theme==='dark';ctx.save();if(isDark){let g=ctx.createLinearGradient(0,775,0,H);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(.45,'rgba(0,0,0,.30)');g.addColorStop(1,'rgba(0,0,0,.45)');ctx.fillStyle=g;ctx.fillRect(0,775,W,305);}else{let g=ctx.createLinearGradient(0,807,0,H);g.addColorStop(0,'rgba(245,238,219,0)');g.addColorStop(.4,'rgba(245,238,219,.80)');g.addColorStop(1,'rgba(245,238,219,.95)');ctx.fillStyle=g;ctx.fillRect(0,807,W,273);}ctx.restore();
  const col=isDark?C.cream:C.ink;const sz=fit(ctx,cap[2],48,1680);tx(ctx,cap[2],960,919,sz,col,a);rule(ctx,863,948,940,948,C.red,1,a*.4);rule(ctx,980,948,1057,948,C.red,1,a*.4);flower(ctx,960,948,5,t,a*.8);const en=fit(ctx,cap[3],27,1580,'SerifItalic');tx(ctx,cap[3],960,991,en,isDark?'#c4b7a1':'#8f826d',a,'center','SerifItalic');}
function drawScene(ctx,s,t){t=clamp(t,0,s.end-s.start);const d=s.end-s.start;ctx.save();ctx.clearRect(0,0,W,H);
  if(s.id==='omni')paper(ctx,t);
  else if(s.plate)plate(ctx,s.plate,s.id==='final'?t+9:t,s.id==='final'?12:d);
  else if(s.theme==='paper')paper(ctx,t);else dark(ctx,t);
  switch(s.id){
    case'opening':film.opening(ctx,t,d);break;
    case'title':title(ctx,t*1.7);break;
    case'origin':film.ancestry(ctx,t,d);dust(ctx,t,C.gold,.45);softHaze(ctx,t,false);break;
    case'turing':rain(ctx,t);tx(ctx,'Can machines think?'.slice(0,Math.floor(clamp((t-.4)/2.2)*19)),1095,461,57,C.cream,smooth(t/1.2),'center','SerifItalic');dust(ctx,t,C.gold,.23);break;
    case'attention':ink.drawAttention(ctx,t,d);softHaze(ctx,t,true);break;
    case'tokens':ink.drawTokens(ctx,t,d);break;
    case'continuation':film.continuation(ctx,t,d);break;
    case'scale':film.scale(ctx,t,d);break;
    case'feedback':film.feedback(ctx,t,d);break;
    case'chat':film.chat(ctx,t,d);break;
    case'omni':{const reveal=smooth((t-.45)/3.0),exit=smooth((t-d+2.15)/2.15);blueCtx.clearRect(0,0,W,H);blueCtx.globalCompositeOperation='source-over';blueCtx.drawImage(bluePlate,0,0);blueCtx.globalCompositeOperation='destination-in';const edge=-700+3400*reveal;let g=blueCtx.createLinearGradient(edge-1100,0,edge+150,0);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.52,'rgba(0,0,0,.76)');g.addColorStop(1,'rgba(0,0,0,0)');blueCtx.fillStyle=g;blueCtx.fillRect(0,0,W,H);ctx.save();ctx.globalAlpha=(1-exit)*.92;ctx.drawImage(blueMask,0,0);ctx.restore();film.wave(ctx,t,d);break;}
    case'reasoning':ink.drawReasoning(ctx,t,d);break;
    case'tools':motifs.drawTools(ctx,t,d);break;
    case'action':film.action(ctx,t,d);break;
    case'family':film.family(ctx,t,d);break;
    case'mirror':film.mirror(ctx,t,d);break;
    case'epilogue':softHaze(ctx,t,true);film.epilogue(ctx,t,d);break;
    case'final':softHaze(ctx,t+9,true);film.final(ctx,t,d);break;
  }
  if(s.theme==='dark'&&s.plate)edgeShade(ctx,.23);if(s.id==='omni'){const w=smooth((t-1.7)/1.5)*(1-smooth((t-d+2)/1.5));ctx.save();ctx.globalAlpha=1-w;tag(ctx,{...s,theme:'paper'},t);subtitles(ctx,{...s,theme:'paper'},t);ctx.restore();ctx.save();ctx.globalAlpha=w;tag(ctx,{...s,theme:'dark'},t);subtitles(ctx,{...s,theme:'dark'},t);ctx.restore();}else{tag(ctx,s,t);subtitles(ctx,s,t);}
  ctx.save();ctx.globalAlpha=s.theme==='paper'?.014:.022;ctx.globalCompositeOperation='soft-light';ctx.drawImage(grain,(Math.floor(t*30)%5)*-2,(Math.floor(t*19)%5)*-2,W+10,H+10);ctx.restore();ctx.restore();
}
const temp=createCanvas(W,H),tc=temp.getContext('2d');
function renderFrame(ctx,absolute){let idx=story.scenes.findIndex(s=>absolute>=s.start&&absolute<s.end);if(idx<0)idx=story.scenes.length-1;const s=story.scenes[idx],t=absolute-s.start;
  const prev=idx>0?story.scenes[idx-1]:null;
  let transition=prev&&prev.theme!==s.theme?1.15:.55;
  if(s.id==='omni')transition=1.65;
  if(s.id==='epilogue')transition=1.5;
  if(s.id==='final')transition=.6;
  if(idx>0&&t<transition){drawScene(ctx,prev,Math.max(0,prev.end-prev.start-transition+t));drawScene(tc,s,t);ctx.save();ctx.globalAlpha=smooth(t/transition);ctx.drawImage(temp,0,0);ctx.restore();}else drawScene(ctx,s,t);
  if(absolute<.18){ctx.fillStyle=`rgba(6,6,6,${1-smooth(absolute/.18)})`;ctx.fillRect(0,0,W,H)}
}
async function init(){for(const s of story.scenes){if(s.plate&&!images[s.plate])images[s.plate]=await loadImage(path.join(ROOT,'assets',s.plate+'.png'));}
bluePlate=createCanvas(W,H);const bc=bluePlate.getContext('2d');const im=images['06_multimodal'];bc.drawImage(im,0,0,W,H);bc.fillStyle='rgba(15,28,39,.23)';bc.fillRect(0,0,W,H);blueMask=createCanvas(W,H);blueCtx=blueMask.getContext('2d');}

async function main(){await init();const args=process.argv.slice(2);let mode=args[0]||'stills';fs.mkdirSync(OUT,{recursive:true});
  if(mode==='stills'){const out=path.join(OUT,'qa_stills');fs.mkdirSync(out,{recursive:true});const times=args[1]?args[1].split(',').map(Number):story.scenes.map(s=>s.start+(s.end-s.start)*.62);const cv=createCanvas(W,H),ct=cv.getContext('2d');for(const t of times){renderFrame(ct,t);fs.writeFileSync(path.join(out,`${t.toFixed(2).padStart(6,'0')}.jpg`),cv.toBuffer('image/jpeg',92));}console.log(JSON.stringify({stills:times.length,out}));return;}
  if(mode==='segment'){const start=Number(args[1]),end=Number(args[2]),out=args[3];const width=Number(args[4]||1920),height=width*9/16;const cv=createCanvas(W,H),ct=cv.getContext('2d');const finalcv=width===W?cv:createCanvas(width,height),finalctx=finalcv.getContext('2d');const ff=spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgba','-s',`${width}x${height}`,'-r',String(FPS),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','18','-pix_fmt','yuv420p','-threads','2','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']});
    let error;ff.on('error',e=>error=e);const count=Math.round((end-start)*FPS);for(let i=0;i<count;i++){renderFrame(ct,start+i/FPS);if(width!==W)finalctx.drawImage(cv,0,0,width,height);const data=finalctx.getImageData(0,0,width,height).data;if(!ff.stdin.write(Buffer.from(data.buffer,data.byteOffset,data.byteLength)))await once(ff.stdin,'drain');if(global.gc&&i%60===0)global.gc();if(i%300===0)console.log(`frame ${i}/${count} (${start}..${end})`);}ff.stdin.end();const [code]=await once(ff,'close');if(code!==0||error)throw error||new Error('ffmpeg exit '+code);console.log(JSON.stringify({out,start,end,frames:count}));return;
  }throw new Error('Unknown mode '+mode);
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
module.exports={init,renderFrame,story};
