'use strict';

// Transparent 1920 × 1080 foregrounds. All time is local scene time in seconds.
// Tree groupings are chronological; branch geometry does not assert model ancestry.
const INK = '#272a26';
const GRAY = '#727469';
const GOLD = '#a38a48';
const RED = '#ab4b3e';
const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, p) => a + (b - a) * p;
const smooth = p => { p = clamp(p); return p * p * (3 - 2 * p); };
const ease = p => 1 - Math.pow(1 - clamp(p), 3);
const fade = (t, a, b) => smooth((t - a) / Math.max(.001, b - a));
function rng(seed) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let n = Math.imul(seed ^ seed >>> 15, 1 | seed); n = n + Math.imul(n ^ n >>> 7, 61 | n) ^ n; return ((n ^ n >>> 14) >>> 0) / 4294967296; };
}
function begin(ctx) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(520, 0); ctx.lineTo(1920, 0); ctx.lineTo(1920, 865);
  ctx.lineTo(0, 865); ctx.lineTo(0, 170); ctx.lineTo(520, 170); ctx.closePath(); ctx.clip();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
}
function text(ctx, str, x, y, size, color = INK, alpha = 1, align = 'center', family = 'Chinese') {
  if (alpha <= .001) return;
  ctx.save(); ctx.globalAlpha *= clamp(alpha); ctx.fillStyle = color;
  ctx.font = `${size}px "${family}"`; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y); ctx.restore();
}
function dot(ctx, x, y, r, color, alpha = 1) {
  if (alpha <= .001 || r <= 0) return;
  ctx.save(); ctx.globalAlpha *= clamp(alpha); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
}
function line(ctx, x1, y1, x2, y2, color, width, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= clamp(alpha); ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}
function cubic(a, b, c, d, n = 64) {
  const p = [];
  for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; p.push([u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0], u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]]); }
  return p;
}
function polyStroke(ctx, points, progress, width, color, alpha = 1, taper = false) {
  const count = clamp(progress) * (points.length - 1);
  if (count <= .001) return;
  ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha *= clamp(alpha);
  if (!taper) {
    ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(...points[0]);
    for (let i = 1; i <= Math.floor(count); i++) ctx.lineTo(...points[i]);
    if (Math.floor(count) < points.length - 1) { const i = Math.floor(count), f = count - i; ctx.lineTo(lerp(points[i][0], points[i+1][0], f), lerp(points[i][1], points[i+1][1], f)); }
    ctx.stroke();
  } else {
    for (let i = 0; i < Math.ceil(count); i++) {
      const f = Math.min(1, count-i), p = i/(points.length-1);
      ctx.lineWidth = Math.max(.5, width*(1-.86*p)*(1+.13*Math.sin(i*1.81)));
      ctx.beginPath(); ctx.moveTo(...points[i]); ctx.lineTo(lerp(points[i][0], points[i+1][0], f), lerp(points[i][1], points[i+1][1], f)); ctx.stroke();
    }
  }
  ctx.restore();
}
function blossom(ctx, x, y, amount, size, time, color = RED) {
  if (amount <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(.1*Math.sin(time*.23)); ctx.globalAlpha *= clamp(amount);
  for (let k = 0; k < 5; k++) {
    const a = k*TAU/5-.5, open = size*(.2+.8*ease(amount));
    ctx.save(); ctx.rotate(a); ctx.fillStyle = color; ctx.globalAlpha *= .7+.12*Math.sin(k*1.8);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-open*.56, -open*.35, -open*.48, -open*1.38, 0, -open*1.24); ctx.bezierCurveTo(open*.62, -open*1.35, open*.69, -open*.27, 0, 0); ctx.fill(); ctx.restore();
  }
  dot(ctx, 0, 0, size*.14, GOLD, .92); ctx.restore();
}
function bird(ctx, x, y, size, phase, angle, alpha) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.globalAlpha *= clamp(alpha); ctx.strokeStyle=INK; ctx.lineWidth=Math.max(.6,size*.09);
  const flap = .45+.55*Math.sin(phase);
  ctx.beginPath(); ctx.moveTo(-size, -size*.3*flap); ctx.quadraticCurveTo(-size*.46, -size*.85*flap, 0, 0); ctx.quadraticCurveTo(size*.44, -size*.82*flap, size, -size*.3*flap); ctx.stroke(); ctx.restore();
}

const randA = rng(5017);
const flock = Array.from({ length: 74 }, (_, i) => ({ a:randA()*TAU, r:.35+randA()*.65, phase:randA()*TAU, speed:.45+randA()*.8, size:4+randA()*9, weight:.25+randA()*.55, target:i%4 }));
const attentionNodes = [[450,530,'词语'],[780,310,'语境'],[1180,540,'关系'],[1510,340,'意义']];
const attentionArcs = [[0,1,-155],[1,2,-150],[2,3,-120],[0,2,170],[1,3,-60],[0,3,-235]].map(([a,b,lift])=>({a,b, points:cubic(attentionNodes[a], [attentionNodes[a][0]+140,attentionNodes[a][1]+lift],[attentionNodes[b][0]-140,attentionNodes[b][1]+lift],attentionNodes[b])}));

function drawAttention(ctx, t, duration = 20) {
  begin(ctx);
  const s = clamp(t / Math.max(1,duration)), gather = smooth((s-.12)/.5), reveal = fade(s,.12,.35);
  const sway = Math.sin(t*.21)*9;
  // Long graphite arcs emerge from the flight paths.
  for (let i=0;i<attentionArcs.length;i++) {
    const arc=attentionArcs[i], p=ease((s-.09-i*.027)/.38);
    polyStroke(ctx,arc.points,p,i<3?1.6:.9, i===2?GOLD:INK, (.22+(i<3?.20:0))*reveal);
    if (p > .05) { const j=Math.floor(((t*(.13+i*.007)+i*.17)%1)*(arc.points.length-1)); const pt=arc.points[j]; dot(ctx,pt[0],pt[1],i===2?3:2,i===2?GOLD:INK,.44*reveal); }
  }
  for (let i=0;i<flock.length;i++) {
    const b=flock[i], theta=b.a+t*.052*b.speed;
    const freeX=960+Math.cos(theta)*710*b.r+Math.sin(t*.53+b.phase)*25;
    const freeY=467+Math.sin(theta)*278*b.r+Math.cos(t*.39+b.phase)*20;
    const n=attentionNodes[b.target], orbit=t*.22*b.speed+b.phase;
    const targetX=n[0]+Math.cos(orbit)*(45+55*b.r), targetY=n[1]+Math.sin(orbit)*(30+45*b.r);
    const x=lerp(freeX,targetX,gather)+sway, y=lerp(freeY,targetY,gather);
    const a=b.weight*fade(s,0,.06);
    if (i%4===0 || gather<.82) bird(ctx,x,y,b.size*1.25*(1-.5*gather),t*3*b.speed+b.phase,Math.sin(theta)*.22,a*(1-.57*gather));
    dot(ctx,x,y,lerp(.5,1.7+b.r*1.3,gather),INK,a*gather*.62);
  }
  attentionNodes.forEach((n,i)=>{
    const a=fade(s,.16+i*.035,.33+i*.035);
    dot(ctx,n[0],n[1],4.5, i===3?GOLD:INK,a);
    text(ctx,n[2],n[0],n[1]+(i%2?85:83),37,INK,a);
  });
  // A single changing emphasis travels across the sentence.
  const headline = fade(s,.28,.48);
  text(ctx,'Attention',963,740,56,INK,.84*headline,'center','Serif');
  text(ctx,'在语境中，寻找联系',963,798,28,GRAY,.86*headline);
  for (let i=0;i<3;i++) {
    const a=fade(s,.62,.8)*(.11+.06*Math.sin(t*.7+i));
    line(ctx,875+i*59,822,906+i*59,822,GOLD,1,a);
  }
  ctx.restore();
}

const trunk = cubic([935,836],[1010,692],[878,414],[979,177],100);
const familyData = [
  {year:'2018',name:'GPT',start:.5,y:758,x:650,side:-1,note:'预训练'},
  {year:'2019',name:'GPT-2',start:2.6,y:682,x:1245,side:1,note:'规模'},
  {year:'2020',name:'GPT-3',start:5.0,y:596,x:633,side:-1,note:'示例'},
  {year:'2022',name:'GPT-3.5',start:8.4,y:510,x:1265,side:1,note:'对话'},
  {year:'2023',name:'GPT-4',start:11.2,y:429,x:648,side:-1,note:'图文'},
  {year:'2024',name:'GPT-4o',start:14.2,y:352,x:1274,side:1,note:'多模态'},
  {year:'2025',name:'GPT-5',start:17.4,y:275,x:654,side:-1,note:'汇流'},
  {year:'2026',name:'GPT-6',start:21.5,y:204,x:1251,side:1,note:'新章'},
].map((b,i)=>{
  const sx=948+Math.sin(i*.92)*15, sy=b.y+57;
  return {...b, path:cubic([sx,sy],[sx+b.side*75,sy-18],[b.x-b.side*97,b.y-12],[b.x,b.y-6],52), twig:cubic([lerp(sx,b.x,.73),b.y+3],[b.x-b.side*35,b.y-25],[b.x-b.side*16,b.y-53],[b.x+b.side*14,b.y-67],26)};
});
const rootPaths = [
  cubic([936,836],[878,815],[815,843],[759,850],28),
  cubic([941,836],[999,817],[1064,852],[1123,849],28),
  cubic([939,830],[908,818],[875,807],[851,825],24)
];

function drawFamily(ctx, t, duration = 26) {
  begin(ctx);
  const q=clamp(t/Math.max(1,duration))*26;
  // Camera settles gently as the chronicle grows.
  ctx.translate(Math.sin(t*.13)*2.2,0);
  for (const p of rootPaths) polyStroke(ctx,p,ease(q/2.2),5,INK,.36,true);
  const growth=clamp(.14+q/25*.87);
  polyStroke(ctx,trunk,growth,18,INK,.89,true);
  // A parallel dry edge gives the trunk a brush grain instead of a vector fill.
  ctx.save();ctx.translate(5,-1);polyStroke(ctx,trunk,growth,3.5,INK,.2,true);ctx.restore();
  for (let i=0;i<familyData.length;i++) {
    const b=familyData[i], grow=ease((q-b.start)/1.65), open=fade(q,b.start+.85,b.start+2.1), a=fade(q,b.start+1.05,b.start+2.2);
    if(grow<=0) continue;
    polyStroke(ctx,b.path,grow,6.8-i*.31,INK,.82,true);
    polyStroke(ctx,b.twig,ease((q-b.start-.75)/1.6),2.5,INK,.56,true);
    blossom(ctx,b.x,b.y-8,open,10.7+(i>5?3.5:0),t+i);
    blossom(ctx,b.x+b.side*14,b.y-67,fade(q,b.start+1.65,b.start+2.65),5.5,t*.7+i);
    const align=b.side<0?'right':'left', lx=b.x+b.side*35;
    text(ctx,b.name,lx,b.y+6,39,INK,a,align,'Serif');
    text(ctx,b.year,lx,b.y+36,20,GRAY,a*.82,align,'Serif');
    // The restrained Chinese word is a visual chapter cue, not a capability claim.
    text(ctx,b.note,lx+b.side*85,b.y+36,19,GRAY,a*.62,align);
  }
  // Fallen petal drift gives a held final tree an ongoing quiet motion.
  const petalAlpha=fade(q,6,10);
  for(let i=0;i<9;i++) {
    const p=((t*.045+i*.127)%1), x=1110+Math.sin(p*6.3+i)*135+i*22, y=210+p*610;
    ctx.save();ctx.translate(x,y);ctx.rotate(p*6+i);ctx.fillStyle=RED;ctx.globalAlpha*=petalAlpha*.18*Math.sin(Math.PI*p);
    ctx.beginPath();ctx.ellipse(0,0,3,7,0,0,TAU);ctx.fill();ctx.restore();
  }
  text(ctx,'家',1740,237,31,INK,fade(q,1,3)*.76,'center');
  text(ctx,'谱',1740,283,31,INK,fade(q,1,3)*.76,'center');
  line(ctx,1740,309,1740,360,GRAY,.8,fade(q,1,3)*.3);
  text(ctx,'按发布年代排列',1740,399,18,GRAY,fade(q,1,3)*.58,'center');
  ctx.restore();
}

const tokenRng=rng(8193);
const floatingTokens=Array.from({length:38},(_,i)=>({x:180+tokenRng()*1560,y:225+tokenRng()*533,phase:tokenRng()*TAU,size:18+tokenRng()*13,a:.08+tokenRng()*.16,char:['山','水','光','人','风','文','字','意','言','间','生','长','?','A','…','。'][i%16]}));
const tokenPhrases=[
  ['山','水','之间','，','语言','开始','生长','。'],
  ['我们','写下','一句','话','，','世界','有了','回声'],
  ['从','上下文','出发','，','走向','下一个','可能','。']
];
function drawTokens(ctx,t,duration=20) {
  begin(ctx);
  const s=clamp(t/Math.max(1,duration)), q=s*20, cycle=Math.min(2,Math.floor(q/7.1)), ct=q-cycle*7.1;
  const cycleAlpha=cycle===2?1:(1-fade(ct,6.45,7.1));
  const phrase=tokenPhrases[cycle], sizes=phrase.map(v=>v.length===1?64:58);
  ctx.save();ctx.font='58px "Chinese"';const widths=phrase.map((v,i)=>{ctx.font=`${sizes[i]}px "Chinese"`;return ctx.measureText(v).width});ctx.restore();
  const gap=17, total=widths.reduce((a,b)=>a+b,0)+gap*(phrase.length-1);let cursor=960-total/2;
  for(const p of floatingTokens) {
    const d=Math.sin(t*.27+p.phase), attract=fade(ct,.8,3.8);
    const x=lerp(p.x,960+(p.x-960)*.79,attract)+d*17, y=lerp(p.y,p.y<490?265:716,attract)+Math.cos(t*.32+p.phase)*13;
    text(ctx,p.char,x,y,p.size,INK,p.a*(1-.56*attract)*fade(s,0,.05));
  }
  text(ctx,'语言，从一个词元开始',960,283,32,GRAY,fade(ct,.05,.9)*cycleAlpha*.84);
  const active=(ct-1.2)/.52;
  for(let i=0;i<phrase.length;i++) {
    const arrive=ease((ct-.35-i*.39)/1.18), visible=fade(ct,.1+i*.26,.6+i*.26)*cycleAlpha;
    const restX=cursor+widths[i]/2, restY=501;
    const fromX=restX+(i%2?-1:1)*(60+i*13),fromY=i%2?664:354;
    const x=lerp(fromX,restX,arrive),y=lerp(fromY,restY,arrive);
    const selecting=1-smooth(Math.abs(active-i)/1.2), chosen=ct>1.2+i*.52;
    text(ctx,phrase[i],x,y,sizes[i]*(.93+.07*arrive),chosen?INK:GRAY,visible,'center');
    if(selecting>0) {
      line(ctx,restX-widths[i]/2,526,restX+widths[i]/2,526,GOLD,2.2,selecting*.7*cycleAlpha);
      const glow=ctx.createRadialGradient(restX,505,5,restX,505,65);glow.addColorStop(0,'rgba(163,138,72,0.055)');glow.addColorStop(1,'rgba(163,138,72,0)');
      ctx.fillStyle=glow;ctx.fillRect(restX-66,440,132,100);
    }
    cursor+=widths[i]+gap;
  }
  const lineA=fade(ct,1,2)*cycleAlpha;
  line(ctx,373,606,1547,606,GRAY,.8,lineA*.23);
  const marker=clamp((ct-.85)/4.7);
  dot(ctx,lerp(373,1547,marker),606,3.4,GOLD,lineA*.83);
  text(ctx,'上下文',373,662,25,GRAY,lineA*.75,'left');
  text(ctx,'下一个词元',1547,662,25,GRAY,lineA*.75,'right');
  const candidates=[['流动','相遇','生长'],['形状','颜色','回声'],['世界','方向','可能']][cycle];
  candidates.forEach((word,i)=>{
    const a=fade(ct,2.8,3.7)*(i===2?1:1-fade(ct,4.7,5.6))*cycleAlpha;
    text(ctx,word,803+i*157,765,i===2?30:27,i===2?GOLD:GRAY,a*(i===2?.8:.33));
  });
  ctx.restore();
}

// An organic labyrinth: imperfect concentric passages with offset gateways.
const mazeRng=rng(4019);
const mazeCenter=[987,492], mazeWalls=[];
const ringGaps=[-2.2,-.7,1.65,-.1,2.75];
for(let ring=0;ring<5;ring++) {
  const rx=171+ring*91,ry=96+ring*52, gap=ringGaps[ring], points=[];
  for(let k=0;k<=150;k++) {
    const a=gap+.29+(TAU-.58)*k/150, wob=Math.sin(a*7+ring)*1.8+Math.sin(a*13+.4)*.7;
    points.push([mazeCenter[0]+Math.cos(a)*(rx+wob),mazeCenter[1]+Math.sin(a)*(ry+wob*.64)]);
  }
  mazeWalls.push({points,width:3.3+mazeRng()*2.4,alpha:.55+mazeRng()*.21});
}
const partitionAngles=[[-.45,1.5],[2.4,3.35],[.45,1.1],[.35,1.5]];
const mazePartitions=[];
partitionAngles.forEach((arr,i)=>arr.forEach(a=>{
  mazePartitions.push(cubic([987+Math.cos(a)*(171+i*91),492+Math.sin(a)*(96+i*52)],[987+Math.cos(a+.05)*(192+i*91),492+Math.sin(a+.05)*(113+i*52)],[987+Math.cos(a-.02)*(238+i*91),492+Math.sin(a-.02)*(130+i*52)],[987+Math.cos(a)*(262+i*91),492+Math.sin(a)*(148+i*52)],18));
}));
function ellipseArc(rx,ry,a,b,n=40) {
  return Array.from({length:n+1},(_,i)=>{const p=i/n,angle=lerp(a,b,p);return [987+Math.cos(angle)*rx,492+Math.sin(angle)*ry]});
}
const route=[];
// Route is drawn through open corridors, gradually moving to the centre.
const polar=(rx,ry,a)=>[987+Math.cos(a)*rx,492+Math.sin(a)*ry];
const radial=(rx1,ry1,rx2,ry2,a)=>cubic(polar(rx1,ry1,a),polar(lerp(rx1,rx2,.33),lerp(ry1,ry2,.33),a),polar(lerp(rx1,rx2,.66),lerp(ry1,ry2,.66),a),polar(rx2,ry2,a),16);
const routeParts=[
  cubic([365,758],[439,777],[528,761],polar(579,327,2.4),25),
  ellipseArc(579,327,2.4,2.75,12),
  radial(579,327,488,275,2.75),
  ellipseArc(488,275,2.75,TAU-.1,70),
  radial(488,275,397,223,-.1),
  ellipseArc(397,223,-.1,1.65-TAU,80),
  radial(397,223,306,171,1.65),
  ellipseArc(306,171,1.65,-.7,52),
  radial(306,171,215,121,-.7),
  ellipseArc(215,121,-.7,-2.2,40),
  cubic(polar(215,121,-2.2),[890,416],[922,443],[940,456],20),
  cubic([940,456],[965,477],[975,484],[987,492],16)
];
for(const p of routeParts) route.push(...p);
const wrongRoutes=[
  cubic([548,612],[496,570],[501,454],[541,405],32),
  ellipseArc(399,222,-.1,.65,30),
  ellipseArc(306,171,1.6,2.15,24)
];
function drawReasoning(ctx,t,duration=20) {
  begin(ctx);
  const s=clamp(t/Math.max(1,duration)), appear=fade(s,.015,.2), explore=clamp((s-.16)/.71);
  // A subtle moving wash under the perimeter, with no opaque background fill.
  for(let i=0;i<mazeWalls.length;i++) {
    const wall=mazeWalls[i], p=ease((s-i*.014)/.21);
    polyStroke(ctx,wall.points,p,wall.width,INK,wall.alpha*appear);
    ctx.save();ctx.translate(1.6,1);polyStroke(ctx,wall.points,p,1.3,INK,.16*appear);ctx.restore();
  }
  mazePartitions.forEach((p,i)=>polyStroke(ctx,p,ease((s-.075-i*.005)/.16),3.4,INK,.56*appear));
  wrongRoutes.forEach((p,i)=>{
    const trial=clamp((s-.23-i*.17)/.12),a=(1-fade(s,.42+i*.17,.53+i*.17))*.6;
    polyStroke(ctx,p,trial,2.4,GOLD,a);
  });
  // Short pauses at the forks prevent the line from reading as a loading spinner.
  const routeProgress=clamp(explore+.016*Math.sin(explore*TAU*3));
  polyStroke(ctx,route,routeProgress,4.4,GOLD,.13);
  polyStroke(ctx,route,routeProgress,2.4,GOLD,.9);
  if(routeProgress>0) {
    const idx=Math.min(route.length-2,Math.floor(routeProgress*(route.length-1))),frac=routeProgress*(route.length-1)-idx;
    const x=lerp(route[idx][0],route[idx+1][0],frac),y=lerp(route[idx][1],route[idx+1][1],frac);
    const g=ctx.createRadialGradient(x,y,0,x,y,22);g.addColorStop(0,'rgba(163,138,72,0.22)');g.addColorStop(1,'rgba(163,138,72,0)');ctx.fillStyle=g;ctx.fillRect(x-22,y-22,44,44);
    dot(ctx,x,y,4,GOLD,.95);
  }
  const done=fade(s,.86,.98);
  blossom(ctx,987,492,done,17,t,RED);
  text(ctx,'推敲',1659,323,35,INK,fade(s,.13,.23)*.84);
  text(ctx,'回望',1659,400,29,GRAY,fade(s,.34,.47)*.7);
  text(ctx,'再前行',1659,477,29,GRAY,fade(s,.59,.72)*.7);
  line(ctx,1659,520,1659,594,GOLD,1.1,fade(s,.65,.8)*.55);
  text(ctx,'Reasoning',1648,645,29,INK,fade(s,.65,.8)*.77,'center','Serif');
  ctx.restore();
}

module.exports = { drawAttention, drawFamily, drawTokens, drawReasoning };
