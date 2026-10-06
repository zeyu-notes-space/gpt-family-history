'use strict';

// Transparent 1920 x 1080 foregrounds. Each time argument is relative to its scene.
// These are visual metaphors and illustrative dialogue, not product recordings.
const C={paper:'#f5eedb',ink:'#302a22',red:'#ac4439',gold:'#cba767',cream:'#f1e6d1',navy:'#101d29'};
const TAU=Math.PI*2;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,p)=>a+(b-a)*p;
const smooth=p=>{p=clamp(p);return p*p*(3-2*p)};
const ease=p=>1-Math.pow(1-clamp(p),3);
const appear=(t,a,b)=>smooth((t-a)/Math.max(.001,b-a));
const window=(t,a,b,c,d)=>appear(t,a,b)*(1-appear(t,c,d));
function begin(ctx){
  ctx.save();ctx.beginPath();ctx.moveTo(520,0);ctx.lineTo(1920,0);ctx.lineTo(1920,865);ctx.lineTo(0,865);ctx.lineTo(0,170);ctx.lineTo(520,170);ctx.closePath();ctx.clip();ctx.lineCap='round';ctx.lineJoin='round';
}
function tx(ctx,str,x,y,size=40,color=C.ink,alpha=1,align='center',font='Serif'){
  if(alpha<.002||!str)return;ctx.save();ctx.globalAlpha*=clamp(alpha);ctx.fillStyle=color;ctx.font=`${size}px "${font}"`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(str,x,y);ctx.restore();
}
function width(ctx,str,size=40,font='Serif'){ctx.save();ctx.font=`${size}px "${font}"`;const w=ctx.measureText(str).width;ctx.restore();return w}
function dot(ctx,x,y,r,color,alpha=1){if(alpha<.002||r<=0)return;ctx.save();ctx.globalAlpha*=clamp(alpha);ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore()}
function line(ctx,x,y,xx,yy,color=C.gold,lw=1,alpha=1){if(alpha<.002)return;ctx.save();ctx.globalAlpha*=clamp(alpha);ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.stroke();ctx.restore()}
function cubic(a,b,c,d,n=64){const pts=[];for(let i=0;i<=n;i++){const t=i/n,u=1-t;pts.push([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]])}return pts}
function stroke(ctx,pts,p=1,color=C.gold,lw=1,alpha=1){
  const count=clamp(p)*(pts.length-1);if(count<.001||alpha<.002)return;ctx.save();ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.globalAlpha*=clamp(alpha);ctx.beginPath();ctx.moveTo(...pts[0]);for(let i=1;i<=Math.floor(count);i++)ctx.lineTo(...pts[i]);const i=Math.floor(count);if(i<pts.length-1)ctx.lineTo(mix(pts[i][0],pts[i+1][0],count-i),mix(pts[i][1],pts[i+1][1],count-i));ctx.stroke();ctx.restore();
}
function along(pts,p){const q=clamp(p)*(pts.length-1),i=Math.min(pts.length-2,Math.floor(q));return [mix(pts[i][0],pts[i+1][0],q-i),mix(pts[i][1],pts[i+1][1],q-i)]}
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let n=Math.imul(seed^seed>>>15,1|seed);n=n+Math.imul(n^n>>>7,61|n)^n;return((n^n>>>14)>>>0)/4294967296}}
const rand=rng(76241);
const binary=Array.from({length:7},(_,i)=>Array.from({length:28},()=>rand()>.5?'1':'0').join(' '));
const embDust=Array.from({length:68},()=>({x:rand()*2-1,y:rand()*2-1,z:rand(),p:rand()*TAU}));

function drawCode(ctx,t,dur=12){
  begin(ctx);const q=clamp(t/dur)*12;
  // The typography advances through successive layers while previous marks recede.
  const binA=window(q,0,.7,2.2,3.7);
  if(binA>.002){ctx.save();ctx.translate(960,465);const s=1-.18*appear(q,1.4,3.7);ctx.scale(s,s);ctx.rotate(-.015);for(let r=0;r<7;r++){const a=binA*(.17+.35*(1-Math.abs(r-3)/4)),drift=Math.sin(q*.4+r)*17,chosen=(Math.floor(q*4)+r*3)%28;for(let k=0;k<28;k++)tx(ctx,binary[r][k*2],-621+k*46+drift,-190+r*64,34,k===chosen?C.gold:C.cream,k===chosen?binA*.8:a)}ctx.restore()}
  const asmA=window(q,2.1,2.9,4.55,5.35),asmP=ease((q-2.1)/1.1);
  if(asmA>.002){ctx.save();ctx.translate(960,460+(1-asmP)*35);ctx.scale(.94+.06*asmP,.94+.06*asmP);tx(ctx,'MOV  AX, 1',0,-16,67,C.cream,asmA);tx(ctx,'ADD  AX, 1',0,72,67,C.cream,asmA*.65);tx(ctx,'assembly',0,-144,23,C.gold,asmA*.8,'center','SerifItalic');line(ctx,-310,104,-310+620*appear(q,2.55,3.6),104,C.gold,.9,asmA*.28);ctx.restore()}
  const forA=window(q,4.5,5.2,6.8,7.6);
  if(forA>.002){tx(ctx,'FORTRAN',960,303,24,C.gold,forA*.8);tx(ctx,'PRINT *, "HELLO"',960,480+25*(1-ease((q-4.5)/1)),68,C.cream,forA);tx(ctx,'END',960,570,33,C.cream,forA*.32)}
  const cA=window(q,6.85,7.55,9.1,10.05),cY=480-16*appear(q,8.7,10.1);
  if(cA>.002){tx(ctx,'C',960,303,26,C.gold,cA*.8);const str='printf("Hello, world!");';tx(ctx,str,960,cY,70,C.cream,cA);const cw=width(ctx,str,70);line(ctx,960-cw/2,cY+24,960-cw/2+cw*appear(q,7.3,8.4),cY+24,C.gold,1,cA*.3)}
  const uiA=appear(q,9.1,10.15);
  if(uiA>.002){const open=ease((q-9.1)/1.15),w=1020,h=330;ctx.save();ctx.translate(960,470);ctx.scale(.9+.1*open,.9+.1*open);ctx.globalAlpha*=uiA;ctx.strokeStyle=C.cream;ctx.lineWidth=1.3;ctx.globalAlpha*=.42;ctx.strokeRect(-w/2,-h/2,w,h);line(ctx,-w/2,-h/2+47,w/2,-h/2+47,C.cream,1,.55);for(let i=0;i<3;i++)dot(ctx,-w/2+28+i*23,-h/2+23,3,i===0?C.red:C.gold,.85);ctx.globalAlpha/= .42;const input='Hello, world'.slice(0,Math.floor(12*clamp((q-10)/1.2)));tx(ctx,input,-383,27,58,C.cream,1,'left');const xx=-383+width(ctx,input,58);line(ctx,xx+10,-22,xx+10,40,C.gold,2,.65+.35*Math.sin(q*7));ctx.strokeStyle=C.gold;ctx.lineWidth=1.4;ctx.globalAlpha*=.8;ctx.beginPath();ctx.arc(412,-3,15,0,TAU);ctx.stroke();line(ctx,423,9,437,23,C.gold,1.5,1);line(ctx,-382,68,444,68,C.gold,1,.32);ctx.restore();tx(ctx,'a window into language',960,725,25,C.cream,uiA*.42,'center','SerifItalic')}
  ctx.restore();
}

const embNodes=[{word:'king',x:546,y:333},{word:'queen',x:1040,y:267},{word:'man',x:642,y:625},{word:'woman',x:1136,y:559},{word:'Paris',x:1480,y:315},{word:'France',x:1600,y:632}];
const embEdges=[
  {a:0,b:1,color:C.gold,path:cubic([546,303],[684,181],[883,164],[1040,237])},
  {a:2,b:3,color:C.gold,path:cubic([642,595],[780,473],[979,456],[1136,529])},
  {a:0,b:2,color:C.cream,path:cubic([522,338],[456,426],[520,535],[618,602])},
  {a:1,b:3,color:C.cream,path:cubic([1051,288],[1175,352],[1210,453],[1157,532])},
  {a:4,b:5,color:C.gold,path:cubic([1481,348],[1404,467],[1468,555],[1575,600])}
];
function drawEmbeddings(ctx,t,dur=8){
  begin(ctx);const q=clamp(t/dur)*8,a=appear(q,0,1);ctx.save();ctx.translate(960,470);const scale=1+.027*Math.sin(q*.22);ctx.scale(scale,scale);ctx.translate(-960+Math.sin(q*.23)*9,-470+Math.cos(q*.25)*5);
  // Sparse points drift at different depths: a space, not an exact plotted embedding.
  for(const p of embDust){const x=1000+p.x*800+Math.sin(q*.27+p.p)*12,y=477+p.y*307+Math.cos(q*.19+p.p)*9;dot(ctx,x,y,.65+p.z*1.2,C.cream,a*(.09+.11*p.z))}
  for(let i=0;i<embEdges.length;i++){const e=embEdges[i],p=ease((q-.85-i*.3)/2.1);stroke(ctx,e.path,p,e.color,i<2?1.7:.9,(i<2?.67:.25)*a);if(p>.02){const travel=(q*(.16+i*.013)+i*.21)%1;if(travel<=p){const at=along(e.path,travel);dot(ctx,at[0],at[1],i<2?3:2,e.color,a*.82)}}}
  for(let i=0;i<embNodes.length;i++){const n=embNodes[i],ap=appear(q,.15+i*.16,1.25+i*.16);tx(ctx,n.word,n.x,n.y,49,C.cream,ap);dot(ctx,n.x,n.y+24,3.3,i<4?C.gold:C.red,ap*.82);const halo=ctx.createRadialGradient(n.x,n.y-9,0,n.x,n.y-9,97);halo.addColorStop(0,'rgba(203,167,103,.025)');halo.addColorStop(1,'rgba(203,167,103,0)');ctx.fillStyle=halo;ctx.fillRect(n.x-100,n.y-109,200,200)}
  // The paired vectors briefly agree, then remain as quiet spatial relationships.
  const da=appear(q,3.3,4.8)*.23;line(ctx,570,393,1064,327,C.gold,1,da);line(ctx,666,685,1160,619,C.gold,1,da);dot(ctx,1064,327,2,C.gold,da*2);dot(ctx,1160,619,2,C.gold,da*2);ctx.restore();ctx.restore();
}

const memoryWords=['Once','a word','found','another,','and the','story','continued.'];
function drawMemory(ctx,t,dur=6){
  begin(ctx);const q=clamp(t/dur)*6,ap=appear(q,0,.7),vanX=970,vanY=286;
  // Older phrases retreat first into one continuous perspective corridor.
  for(let i=0;i<11;i++){const spread=(i-5)*155;line(ctx,vanX+spread*.045,vanY+12,vanX+spread,855,C.gold,.55,ap*.07)}
  for(let i=0;i<memoryWords.length;i++){
    const z=(memoryWords.length-1-i)*.81+q*.47,s=1/(1+z*.74),side=i%2===0?-1:1;
    const x=vanX+side*(365+(i%3)*42)*s,y=vanY+493*s;
    const alpha=ap*Math.pow(s,.77)*(.7+.3*appear(q,i*.06,i*.06+.65));
    ctx.save();ctx.translate(x,y);ctx.rotate(side*(-.02-.028*s));ctx.transform(1,side*.022,-side*.17,1,0,0);ctx.scale(s,s);ctx.globalAlpha*=alpha;
    // Uneven edges and faint rules evoke loose manuscript fragments, not interface tiles.
    ctx.fillStyle=C.paper;ctx.globalAlpha*=.27;ctx.beginPath();ctx.moveTo(-318,-87);ctx.quadraticCurveTo(-42,-95,313,-80);ctx.lineTo(326,90);ctx.quadraticCurveTo(2,82,-327,96);ctx.closePath();ctx.fill();ctx.globalAlpha/=.27;
    line(ctx,-274,-56,268,-59,C.gold,.8,.27);line(ctx,-274,56,273,59,C.gold,.8,.18);
    tx(ctx,memoryWords[i],0,22,65,C.cream,.82);ctx.restore();
  }
  const glow=ctx.createRadialGradient(vanX,vanY,5,vanX,vanY,135);glow.addColorStop(0,'rgba(203,167,103,.065)');glow.addColorStop(1,'rgba(203,167,103,0)');ctx.fillStyle=glow;ctx.fillRect(vanX-140,vanY-140,280,280);dot(ctx,vanX,vanY+6,2.2,C.gold,ap*.32);ctx.restore();
}

function drawPrediction(ctx,t,dur=10){
  begin(ctx);const q=clamp(t/dur)*10,prefix='The meaning of life is',size=65,x=322,y=471;
  const count=Math.floor(prefix.length*clamp((q-.3)/2.25)),typed=prefix.slice(0,count),prefW=width(ctx,prefix,size),space=width(ctx,' ',size),toW=width(ctx,'to',size),learnW=width(ctx,'learn',size);
  tx(ctx,'prediction',960,265,27,C.ink,appear(q,.1,.8)*.44,'center','SerifItalic');tx(ctx,typed,x,y,size,C.ink,appear(q,0,.5),'left');
  const toA=appear(q,4.0,4.62),learnA=appear(q,7.2,7.92),periodA=appear(q,8.65,9.2);
  const toX=x+prefW+space,learnX=toX+toW+space,periodX=learnX+learnW;
  // Only the chosen next token joins the context; alternatives dissolve in place.
  tx(ctx,'to',toX,y+mix(62,0,ease((q-4)/.62)),size,C.ink,toA,'left');
  tx(ctx,'learn',learnX,y+mix(84,0,ease((q-7.2)/.72)),size,C.ink,learnA,'left');tx(ctx,'.',periodX,y,size,C.ink,periodA,'left');
  const first=window(q,2.65,3.2,3.92,4.5);
  if(first>.002){const labels=[['to',toX+36,614],['about',toX+197,674],['a',toX-112,674]];labels.forEach((n,i)=>{const a=first*(i===0?.76:.24);tx(ctx,n[0],n[1],n[2]-10*Math.sin(q*.5+i),i===0?48:38,i===0?C.red:C.ink,a,'center','SerifItalic');line(ctx,toX+28,504,n[1],n[2]-56,C.ink,.8,a*.19)})}
  const candidates=window(q,4.8,5.45,7.18,7.95);
  if(candidates>.002){const labels=[['learn',learnX+74,623],['create',learnX-139,711],['connect',learnX+298,702]];labels.forEach((n,i)=>{const drift=Math.sin(q*.55+i)*7,a=candidates*(i===0?.8:.25);tx(ctx,n[0],n[1],n[2]+drift,i===0?49:39,i===0?C.red:C.ink,a,'center','SerifItalic');line(ctx,learnX+61,510,n[1],n[2]-53+drift,C.ink,.75,a*.17)})}
  let cx=x+width(ctx,typed,size)+8;if(q>=2.55)cx=toX;if(q>=4.62)cx=learnX;if(q>=7.92)cx=periodX+3;if(q>=9.2)cx=periodX+width(ctx,'.',size)+12;
  const cursorA=appear(q,.2,.55)*(1-appear(q,9.2,9.9));line(ctx,cx,y+16,cx+Math.max(24,q<4?63:q<7.92?154:23),y+16,C.red,1.8,cursorA*(.42+.24*Math.sin(q*4.8)));
  if(q>9.1)line(ctx,x,534,x+(periodX-x+25)*ease((q-9.1)/.7),534,C.red,1,appear(q,9.1,9.55)*.23);ctx.restore();
}

const taskData=[
  {prompt:'Translate this.',out:'Bonjour.',x:462,y:321,start:.35,font:'Serif',path:cubic([960,446],[825,406],[755,327],[641,304])},
  {prompt:'Write this.',out:'A small idea became a story.',x:1433,y:361,start:2.55,font:'Serif',path:cubic([962,449],[1102,426],[1130,331],[1248,336])},
  {prompt:'Explain this.',out:'In other words…',x:499,y:666,start:4.7,font:'SerifItalic',path:cubic([956,452],[784,487],[864,640],[696,645])},
  {prompt:'Code this.',out:'print("Hello")',x:1392,y:703,start:6.85,font:'Serif',path:cubic([965,454],[1108,487],[1105,688],[1213,680])}
];
function drawTasks(ctx,t,dur=11){
  begin(ctx);const q=clamp(t/dur)*11,ap=appear(q,0,.75);
  // A common language center writes into four different directions.
  for(let i=0;i<taskData.length;i++){const d=taskData[i],grow=ease((q-d.start)/1.6),outA=appear(q,d.start+1.05,d.start+2),inA=appear(q,d.start,d.start+.8);stroke(ctx,d.path,grow,C.ink,1,.21);tx(ctx,d.prompt,d.x,d.y-21,31,C.ink,inA*(1-.55*outA),'center','SerifItalic');const display=d.out.slice(0,Math.floor(d.out.length*ease((q-d.start-1.1)/1.65)));tx(ctx,display,d.x,d.y+40, i===1?36:47,C.ink,outA,'center',d.font);if(grow>.01){const u=(q*.2+i*.2)%1;if(u<grow){const pos=along(d.path,u);dot(ctx,pos[0],pos[1],2.5,C.red,Math.sin(u*Math.PI)*.65)}}}
  const pulse=.76+.24*Math.sin(q*4.2);line(ctx,958,429,958,472,C.red,3.2,ap*pulse);line(ctx,948,476,969,476,C.red,1,ap*.32);tx(ctx,'GPT-3',960,528,23,C.ink,ap*.54);ctx.save();ctx.strokeStyle=C.gold;ctx.lineWidth=.75;ctx.globalAlpha*=ap*.17;ctx.beginPath();ctx.ellipse(960,451,87+5*Math.sin(q*.5),60,-.13,0,TAU);ctx.stroke();ctx.restore();ctx.restore();
}

function drawChat(ctx,t,dur=8){
  begin(ctx);const q=clamp(t/dur)*8,ap=appear(q,0,.75),open=ease(q/.9);
  ctx.save();ctx.translate(960,476+(1-open)*22);ctx.rotate(-.0025);ctx.scale(.985+.015*open,.985+.015*open);ctx.globalAlpha*=ap;
  ctx.shadowColor='rgba(48,42,34,.10)';ctx.shadowBlur=34;ctx.shadowOffsetY=15;ctx.fillStyle='#fcf8ee';ctx.fillRect(-700,-250,1400,565);ctx.shadowColor='transparent';ctx.strokeStyle='rgba(48,42,34,.10)';ctx.lineWidth=.8;ctx.strokeRect(-700,-250,1400,565);
  dot(ctx,-650,-206,4,C.red,.7);tx(ctx,'a conversation',-624,-198,23,C.ink,.4,'left','SerifItalic');line(ctx,-650,-165,650,-165,C.ink,.75,.1);
  const question='Explain quantum computing like I’m five.',typed=question.slice(0,Math.floor(question.length*clamp((q-.65)/2.05)));
  tx(ctx,'you',-599,-96,20,C.ink,.35,'left','SerifItalic');tx(ctx,typed,-599,-43,42,C.ink,1,'left','SerifItalic');
  if(q<2.9&&q>.7){const end=-599+width(ctx,typed,42,'SerifItalic');line(ctx,end+8,-82,end+8,-38,C.red,1.5,.55+.4*Math.sin(q*8))}
  const reply1='Imagine a tiny world that follows',reply2='different rules.',reply=reply1+' '+reply2,n=Math.floor(reply.length*clamp((q-3.5)/2.8));
  const answerA=appear(q,3.15,3.8);tx(ctx,'reply',-599,56,20,C.ink,answerA*.35,'left','SerifItalic');line(ctx,-625,89,-625,204,C.red,1.5,answerA*.36);tx(ctx,reply1.slice(0,n),-599,119,45,C.ink,answerA,'left');if(n>reply1.length)tx(ctx,reply2.slice(0,Math.max(0,n-reply1.length-1)),-599,181,45,C.ink,answerA,'left');
  if(q>3.5&&q<6.7){const second=n>reply1.length;const shown=second?reply2.slice(0,Math.max(0,n-reply1.length-1)):reply1.slice(0,n),yy=second?181:119,xx=-599+width(ctx,shown,45);dot(ctx,xx+12,yy-15,2.3,C.red,.4+.3*Math.sin(q*7))}
  ctx.restore();ctx.restore();
}

const toolsData=[
  {name:'Vision',x:407,y:657,start:.7,path:cubic([964,484],[835,530],[635,417],[407,604])},
  {name:'Voice',x:696,y:776,start:3.15,path:cubic([964,484],[932,610],[785,546],[696,724])},
  {name:'Research',x:1035,y:758,start:9.0,path:cubic([964,484],[1075,544],[957,650],[1035,706])},
  {name:'Codex',x:1339,y:709,start:6.1,path:cubic([964,484],[1138,453],[1160,606],[1339,657])},
  {name:'Agents',x:1592,y:595,start:12.1,path:cubic([964,484],[1190,501],[1390,373],[1592,543])}
];
const toolPhrases=['See.','Listen.','Research.','Code.','Create.'];
function toolGlyph(ctx,index,x,y,t,a){
  ctx.save();ctx.translate(x,y);ctx.globalAlpha*=a;ctx.strokeStyle=C.cream;ctx.lineWidth=1;
  if(index===0){ctx.beginPath();ctx.moveTo(-29,0);ctx.quadraticCurveTo(0,-29,29,0);ctx.quadraticCurveTo(0,29,-29,0);ctx.stroke();dot(ctx,Math.sin(t*.4)*6,0,5,C.gold,.85)}
  else if(index===1){ctx.beginPath();for(let j=0;j<=60;j++){const xx=j-30,yy=Math.sin(j*.35-t*3)*Math.sin(j*Math.PI/60)*14;j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.stroke()}
  else if(index===2){for(let j=0;j<3;j++){const xx=(j-1)*22,yy=j===1?-14:7;dot(ctx,xx,yy,3,C.gold,.9);if(j<2)line(ctx,xx,yy,(j)*22,j===0?-14:7,C.cream,.8,.65)}line(ctx,-20,24,20,24,C.cream,.8,.4)}
  else if(index===3){ctx.beginPath();ctx.moveTo(-15,-13);ctx.lineTo(-30,0);ctx.lineTo(-15,13);ctx.moveTo(15,-13);ctx.lineTo(30,0);ctx.lineTo(15,13);ctx.stroke();line(ctx,5,-17,-5,17,C.gold,1,.8)}
  else{dot(ctx,0,0,4,C.gold,.9);for(let j=0;j<3;j++){const angle=j*TAU/3+t*.14,xx=Math.cos(angle)*27,yy=Math.sin(angle)*21;line(ctx,0,0,xx,yy,C.cream,.8,.7);dot(ctx,xx,yy,3,C.cream,.9)}}
  ctx.restore();
}
function drawTools(ctx,t,dur=18){
  begin(ctx);const q=clamp(t/dur)*18,ap=appear(q,0,.8);
  // A moving thought releases actions into a branching field, with equal visual weight.
  for(let i=0;i<toolsData.length;i++){const d=toolsData[i],p=ease((q-d.start)/2.0),a=appear(q,d.start+.45,d.start+1.6);stroke(ctx,d.path,p,i===3?C.cream:C.gold,1.2,.48);ctx.save();ctx.translate(0,6);stroke(ctx,d.path,p,C.gold,.5,.09);ctx.restore();tx(ctx,d.name,d.x,d.y,33,C.cream,a*.86);toolGlyph(ctx,i,d.x,d.y-91,q,a*.63);for(let j=0;j<2;j++){const u=(q*(.1+i*.006)+j*.47+i*.13)%1;if(u<p){const pos=along(d.path,u);dot(ctx,pos[0],pos[1],2.2,C.gold,Math.sin(u*Math.PI)*a*.9)}}}
  const idx=Math.min(4,Math.floor(q/3.15)),local=q-idx*3.15,phraseA=appear(local,0,.6)*(idx===4?1:1-appear(local,2.5,3.15));
  tx(ctx,toolPhrases[idx],960,332+mix(20,0,ease(local/.75)),idx===0?65:78,C.cream,phraseA,'center','SerifItalic');
  const breathing=1+.12*Math.sin(q*1.5);dot(ctx,964,484,4.2*breathing,C.red,ap*.9);ctx.save();ctx.strokeStyle=C.gold;ctx.lineWidth=.8;ctx.globalAlpha*=ap*.24;ctx.beginPath();ctx.ellipse(964,484,28*breathing,28*breathing,0,0,TAU);ctx.stroke();ctx.restore();
  // At the held end, a faint secondary connection circulates among the capabilities.
  const allA=appear(q,14.2,16.7)*.14;for(let i=0;i<toolsData.length-1;i++){const aa=toolsData[i],bb=toolsData[i+1];line(ctx,aa.x+45,aa.y-22,bb.x-55,bb.y-22,C.cream,.65,allA)}ctx.restore();
}

module.exports={drawCode,drawEmbeddings,drawMemory,drawPrediction,drawTasks,drawChat,drawTools};
