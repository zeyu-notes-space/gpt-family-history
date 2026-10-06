'use strict';
// Original restrained motion studies, 1920x1080; all dialogue is illustrative.
const C={paper:'#f5eedb',ink:'#302a22',red:'#ac4439',gold:'#b69b68',cream:'#f1e6d1',muted:'#8d816d'};
const PI=Math.PI,TAU=2*PI,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,p)=>a+(b-a)*p,smooth=x=>{x=clamp(x);return x*x*(3-2*x)},ease=x=>1-(1-clamp(x))**3;
function text(c,s,x,y,z=40,col=C.ink,a=1,f='Chinese',align='center') {if(a<.002||!s)return;c.save();c.globalAlpha*=clamp(a);c.fillStyle=col;c.font=`${z}px "${f}"`;c.textAlign=align;c.textBaseline='alphabetic';c.fillText(s,x,y);c.restore();}
function line(c,x,y,xx,yy,col=C.ink,w=1,a=1){c.save();c.strokeStyle=col;c.lineWidth=w;c.globalAlpha*=clamp(a);c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();c.restore();}
function dot(c,x,y,r,col=C.red,a=1){if(r<=0)return;c.save();c.globalAlpha*=clamp(a);c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();}
function width(c,s,z=40,f='Chinese'){c.save();c.font=`${z}px "${f}"`;const w=c.measureText(s).width;c.restore();return w;}
function curve(a,b,c,d,n=70){return Array.from({length:n+1},(_,i)=>{let t=i/n,u=1-t;return [u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]]});}
function path(c,pts,p=1,col=C.ink,w=1,a=1,taper=false){const n=clamp(p)*(pts.length-1);if(n<.001)return;c.save();c.globalAlpha*=clamp(a);c.strokeStyle=col;c.lineCap='round';c.lineJoin='round';if(taper){for(let i=0;i<Math.ceil(n);i++){let f=Math.min(1,n-i);c.lineWidth=Math.max(.5,w*(1-.83*i/(pts.length-1))*(1+.1*Math.sin(i*1.7)));c.beginPath();c.moveTo(...pts[i]);c.lineTo(mix(pts[i][0],pts[i+1][0],f),mix(pts[i][1],pts[i+1][1],f));c.stroke();}}else{c.lineWidth=w;c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<=Math.floor(n);i++)c.lineTo(...pts[i]);let i=Math.floor(n);if(i<pts.length-1)c.lineTo(mix(pts[i][0],pts[i+1][0],n-i),mix(pts[i][1],pts[i+1][1],n-i));c.stroke();}c.restore();}
function blossom(c,x,y,r,p,t=0){if(p<=0)return;c.save();c.translate(x,y);c.rotate(.05*Math.sin(t));c.globalAlpha*=clamp(p);for(let i=0;i<5;i++){c.save();c.rotate(i*TAU/5);c.fillStyle=C.red;c.beginPath();c.ellipse(0,-r*.45,r*.35,r*.65,0,0,TAU);c.fill();c.restore();}dot(c,0,0,r*.13,C.gold,.9);c.restore();}
function clip(c){c.save();c.beginPath();c.rect(70,175,1780,670);c.clip();}
function typed(c,s,x,y,z,t,start,duration,col=C.ink,align='left',f='Chinese',cursor=true){let p=clamp((t-start)/duration),v=s.slice(0,Math.floor(s.length*p));text(c,v,x,y,z,col,1,f,align);if(cursor&&t>start){let xx=x+width(c,v,z,f);if(align==='center')xx=x+width(c,v,z,f)/2;line(c,xx+9,y-z*.83,xx+9,y+7,C.red,2,.35+.5*(.5+.5*Math.sin(t*6)));}}

function opening(c,t,d){
  const a=smooth(t/.5),exit=smooth((t-5.2)/.8);c.save();c.globalAlpha=a*(1-exit*.65);
  text(c,'ChatGPT',960,304,57,C.cream,1,'Serif');line(c,385,365,1535,365,C.gold,1,.26);
  text(c,'你',400,432,24,C.cream,.55,'Chinese','left');
  typed(c,'你是怎么学会说话的？',460,512,65,t,.45,1.8,C.cream);
  text(c,'GPT',400,622,24,C.gold,smooth((t-2.65)/.4),'Serif','left');
  typed(c,'故事，要从很久以前说起。',460,697,47,t,2.9,1.7,C.cream,'left','Chinese',false);
  line(c,460,739,1450,739,C.gold,1,.20*smooth((t-3)/2));c.restore();
}

function ancestry(c,t,d){
  // Traced pigment travels out of the wall; the historical painting remains intact.
  const a=smooth(t/1.2)*.46;
  const pts=curve([410,640],[680,330],[1150,590],[1625,320]);
  path(c,pts,ease(t/5.4),C.gold,1.3,a);
  const marks=['言','文','字','?'];
  for(let i=0;i<marks.length;i++){const p=smooth((t-1.1-i*.65)/1.4),x=790+i*203,y=465-45*i+Math.sin(t*.4+i)*9;text(c,marks[i],x,y,30,C.cream,p*.38);}
  for(let i=0;i<12;i++){const q=(t*.08+i*.067)%1,idx=Math.floor(q*(pts.length-1));dot(c,...pts[idx],1.3,C.gold,a*Math.sin(q*PI));}
}

function continuation(c,t,d){
  clip(c);const p=ease(t/1.4);c.save();c.translate(960,455);c.rotate(-.012);c.globalAlpha=smooth(t/.6);
  c.fillStyle='#faf4e5';c.shadowColor='rgba(76,58,35,.09)';c.shadowBlur=22;c.shadowOffsetY=12;c.fillRect(-650,-220,1300,440);c.shadowColor='transparent';
  text(c,'从一句话，到一篇故事',-555,-123,25,C.muted,.8,'Chinese','left');
  const rows=['山水之间，语言开始生长。','一个词，牵出下一个词。','短句延伸，渐渐连成了篇章。'];
  rows.forEach((s,i)=>typed(c,s,-555,-24+i*89,49,t,.55+i*1.45,1.4,C.ink,'left','Chinese',false));
  line(c,-555,229,-555+1110*p,229,C.red,1,.23);c.restore();
  for(let i=0;i<7;i++){let u=(t*.08+i*.137)%1,x=150+u*1630,y=252+Math.sin(u*TAU+i)*43;c.save();c.translate(x,y);c.rotate(Math.sin(t*.3+i)*.2);c.globalAlpha=.09*Math.sin(u*PI);c.strokeStyle=C.ink;c.strokeRect(-27,-16,54,32);c.restore();}c.restore();
}

const taskNodes=[['翻译','sea → 海',470,340],['改写','简洁 → 生动',1420,350],['解释','复杂 → 清楚',500,697],['编程','想法 → 代码',1415,697]];
function scale(c,t,d){
  clip(c);const spread=ease(t/3.5),settle=smooth((t-2.4)/2.6),radius=mix(80,275,spread);
  for(let i=0;i<170;i++){let a=i*2.39996+t*.10,r=Math.sqrt((i+.5)/170)*radius,x=960+Math.cos(a)*r,y=492+Math.sin(a)*r*.66;dot(c,x,y,.7+(i%5)*.18,C.ink,(.06+.13*(i%7)/7)*(1-settle*.55));}
  text(c,'GPT-3',960,510,92,C.ink,smooth(t/.7),'Serif');text(c,'同一个模型',960,564,23,C.muted,settle);
  taskNodes.forEach((n,i)=>{let a=smooth((t-2.8-i*1.05)/1.25),route=curve([960,474],[mix(960,n[2],.30),n[3]+50],[mix(960,n[2],.8),n[3]+20],[n[2],n[3]+20]);path(c,route,ease((t-2.5-i*1.05)/1.4),C.ink,1.2,.28);text(c,n[0],n[2],n[3]-19,31,C.muted,a);text(c,n[1],n[2],n[3]+44,44,C.ink,a);const q=(t*.21+i*.24)%1;if(a>.1){let idx=Math.floor(q*(route.length-1));dot(c,...route[idx],2.8,C.red,a*.5);}});
  text(c,'示例写在提示里，参数不必为每次任务更新',960,798,24,C.muted,smooth((t-8.1)/1.8)*.82);c.restore();
}

function feedback(c,t,d){
  clip(c);const a=smooth(t/.6);text(c,'同一个问题，怎样回答得更好？',960,275,31,C.muted,a);
  text(c,'把这句话解释给一个孩子听。',960,420,51,C.ink,a);
  const oldA=(1-smooth((t-2.0)/1.05))*.56;
  text(c,'请参见相关定义与技术术语……',960,570,39,C.muted,oldA);
  line(c,580,552,580+760*ease((t-1.25)/.8),552,C.red,1.4,oldA);
  typed(c,'想象一下，你手里有一颗小种子。',960,575,45,t,2.35,2.0,C.ink,'center','Chinese',false);
  const b=smooth((t-4.35)/.9);line(c,605,631,1315,631,C.red,1,b*.38);blossom(c,1370,568,12,b,t);
  text(c,'示范  ·  比较  ·  反馈',960,739,28,C.muted,smooth((t-2.9)/1.3));c.restore();
}

function chat(c,t,d){
  clip(c);const a=smooth(t/.6),p=ease(t/1);c.save();c.translate(960,490+(1-p)*18);c.globalAlpha=a;
  c.shadowColor='rgba(66,48,28,.09)';c.shadowBlur=26;c.shadowOffsetY=12;c.fillStyle='#fbf6e9';c.fillRect(-710,-265,1420,540);c.shadowColor='transparent';
  text(c,'ChatGPT',-643,-207,31,C.ink,.9,'Serif','left');line(c,-644,-173,642,-173,C.ink,1,.15);
  text(c,'你',-640,-105,25,C.muted,1,'Chinese','left');
  typed(c,'为什么天空是蓝色的？',-566,-55,51,t,.75,2.3,C.ink,'left','Chinese',t<3.3);
  const answer=smooth((t-3.5)/.7);text(c,'GPT',-640,49,25,C.muted,answer,'Serif','left');
  typed(c,'阳光里有许多颜色。',-566,99,46,t,3.8,2.0,C.ink,'left','Chinese',false);
  typed(c,'蓝光更容易被空气散射，进入你的眼睛。',-566,176,42,t,6.0,3.45,C.ink,'left','Chinese',false);
  if(t>9.6)blossom(c,573,218,7,smooth((t-9.6)/.8),t);c.restore();c.restore();
}

function wave(c,t,d){
  clip(c);const q=t/d,a=smooth((t-.7)/1.3);c.save();c.strokeStyle=C.ink;c.lineWidth=1.05;c.globalAlpha=.28*smooth(t/1.4)*(1-smooth((t-1.7)/1.8));c.beginPath();c.ellipse(960,467,666,286,-.045,0,TAU*ease(t/2.6));c.stroke();c.restore();c.save();c.globalAlpha=a*.73;
  // A written line becomes a living waveform across the painted ribbon.
  const pts=Array.from({length:200},(_,i)=>{const u=i/199;return [440+1040*u,504+Math.sin(u*PI*10-t*2.5)*Math.sin(u*PI)*38*smooth((t-1.2)/2)]});
  path(c,pts,ease(t/3),C.cream,1.8,.74);c.restore();
  const words=[['文字',516,727],['视觉',960,727],['声音',1404,727]];words.forEach((n,i)=>{const a=smooth((t-1.1-i*.85)/1.2)*.89,w=smooth((t-1.7)/1.5)*(1-smooth((t-d+2)/1.5));text(c,n[0],n[1],790,30,C.ink,a*(1-w));text(c,n[0],n[1],790,30,C.cream,a*w);});c.restore();
}

function action(c,t,d){
  clip(c);const start=smooth(t/.4),morph=smooth((t-2.3)/2.3),run=smooth((t-4.6)/.9);
  text(c,t<4.5?'Make it.':'Do it.',960,269,77,C.cream,start,'SerifItalic');
  const sentence='画一个圆，让光点沿着它旋转。';text(c,sentence,960,396,43,C.cream,(1-smooth((t-1.9)/1.7))*start);
  const code=['angle += speed;','x = cx + r * cos(angle);','y = cy + r * sin(angle);'];
  code.forEach((s,i)=>{let a=smooth((t-1.6-i*.15)/.55)*(1-smooth((t-4.1)/1));text(c,s,615,467+i*66,33,C.cream,a*.8,'Serif','left');});
  const r=mix(15,235,ease((t-3.55)/1.35)),cx=960,cy=552,ap=smooth((t-3.45)/1.0);
  c.save();c.strokeStyle=C.gold;c.globalAlpha=ap*.65;c.lineWidth=1.4;c.beginPath();c.ellipse(cx,cy,r,r*.48,-.16,0,TAU*ease((t-3.6)/1.3));c.stroke();c.restore();
  dot(c,cx,cy,6,C.red,ap);let theta=(t-4.8)*1.4*run-.6,x=cx+Math.cos(theta)*r,y=cy+Math.sin(theta)*r*.48;dot(c,x,y,7,C.cream,ap);
  const trail=Array.from({length:50},(_,i)=>{let th=theta-.8+i/49*.8;return [cx+Math.cos(th)*r,cy+Math.sin(th)*r*.48]});path(c,trail,run,C.cream,2.2,.65*ap);
  text(c,'一个想法，开始运行。',960,790,27,C.cream,run*.82);c.restore();
}

const trunk=curve([950,820],[985,670],[912,425],[985,212],100);
const branches=[
  {x:651,y:726,name:'GPT',sub:'2018 · 预训练',side:-1,time:.4},
  {x:1252,y:609,name:'GPT-3',sub:'2020 · 示例',side:1,time:1.5},
  {x:653,y:489,name:'ChatGPT',sub:'2022 · 对话',side:-1,time:2.6},
  {x:1265,y:362,name:'GPT-4o',sub:'2024 · 多模态',side:1,time:3.7},
  {x:660,y:261,name:'推理与工具',sub:'继续生长',side:-1,time:4.8},
];
function family(c,t,d){
  clip(c);path(c,trunk,.08+.92*ease(t/7.2),C.ink,16,.9,true);
  c.save();c.translate(4,0);path(c,trunk,.08+.92*ease(t/7.2),C.ink,2.3,.20,true);c.restore();
  path(c,curve([950,820],[908,807],[831,835],[784,831]),ease(t/2.1),C.ink,3,.34,true);
  path(c,curve([950,820],[1008,804],[1069,835],[1126,831]),ease(t/2.1),C.ink,3,.34,true);
  branches.forEach((b,i)=>{let a=smooth((t-b.time-.9)/.8),p=ease((t-b.time)/1.4),stem=curve([955,b.y+67],[980+b.side*85,b.y+44],[b.x-b.side*81,b.y+4],[b.x,b.y]);path(c,stem,p,C.ink,5.5,.83,true);let twig=curve([b.x-b.side*70,b.y+12],[b.x-b.side*39,b.y-6],[b.x-b.side*4,b.y-39],[b.x+b.side*24,b.y-50]);path(c,twig,ease((t-b.time-.75)/1.4),C.ink,2.1,.6,true);blossom(c,b.x,b.y,12,a,t);blossom(c,b.x+b.side*24,b.y-50,6,smooth((t-b.time-1.5)/.7),t);const align=b.side<0?'right':'left',x=b.x+b.side*36;text(c,b.name,x,b.y+9,i===4?36:44,C.ink,a,i===4?'Chinese':'Serif',align);text(c,b.sub,x,b.y+46,24,C.muted,a,'Chinese',align);});
  text(c,'家',1687,264,36,C.ink,smooth(t/1.8));text(c,'谱',1687,314,36,C.ink,smooth(t/1.8));
  text(c,'代表里程碑',1687,379,20,C.muted,smooth((t-1.8)/1.2));
  for(let i=0;i<8;i++){let p=(t*.061+i*.139)%1,x=1220+Math.sin(p*4+i)*90,y=220+p*590;c.save();c.translate(x,y);c.rotate(p*4+i);c.globalAlpha=.16*Math.sin(p*PI)*smooth((t-4)/2);c.fillStyle=C.red;c.beginPath();c.ellipse(0,0,2.2,5,0,0,TAU);c.fill();c.restore();}c.restore();
}

function mirror(c,t,d){
  clip(c);const morph=smooth((t-2.7)/2.0),a=smooth(t/.5);
  const chars='010011010010001100110101100101001101001010001';
  for(let i=0;i<42;i++){const row=Math.floor(i/14),col=i%14,x0=440+col*80,y0=377+row*84,x1=400+i%20*59,y1=479;let x=mix(x0,x1,morph),y=mix(y0,y1,morph);text(c,chars[i],x,y,33,C.muted,a*(1-morph)*.56,'Serif');}
  text(c,'printf("Hello, world!");',960,688,49,C.ink,a*(1-morph),'Serif');
  const prompt='请，把这个想法变成现实。';const shown=prompt.slice(0,Math.floor(prompt.length*clamp((t-4.0)/1.9)));text(c,shown,960,520,64,C.ink,morph);const xx=960+width(c,shown,64)/2;line(c,xx+10,466,xx+10,530,C.red,2,morph*(.5+.4*Math.sin(t*6)));
  line(c,430,613,430+1060*smooth((t-4)/2),613,C.red,1,morph*.23);c.restore();
}

function epilogue(c,t,d){
  // Leave the established ink landscape spacious; the opening prompt returns.
  c.save();const a=smooth((t-1.3)/1.4),x=1290,y=395;
  text(c,'ChatGPT',x,y,37,C.ink,a*.64,'Serif');
  typed(c,'你想创造什么？',x,y+112,56,t,2.6,2.7,C.ink,'center');
  line(c,982,551,1588,551,C.ink,1,a*.27);
  text(c,'下一页，尚未写下。',x,629,27,C.muted,smooth((t-5.7)/1.0));
  c.restore();
}
function final(c,t,d){const a=smooth(t/.6);text(c,'GPT',1280,381,156,C.ink,a,'Serif');text(c,'家 族 史',1280,470,46,C.ink,a);blossom(c,1280,528,15,a,t);text(c,'语言的回声',1280,593,29,C.ink,a*.84);text(c,'A genealogy of language',1280,643,27,C.muted,a,'SerifItalic');}
module.exports={opening,ancestry,continuation,scale,feedback,chat,wave,action,family,mirror,epilogue,final};
