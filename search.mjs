const STOP = new Set('a o as os e de da das do dos no na nos nas em para por com um uma ao aos'.split(' '));
export function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}
export function tokens(value) { return normalize(value).split(' ').filter(w => w && !STOP.has(w)); }
export function distance(a, b) {
  const d = Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
  for(let i=0;i<=a.length;i++)d[i][0]=i;
  for(let j=0;j<=b.length;j++)d[0][j]=j;
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
    d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
    if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d[i][j]=Math.min(d[i][j],d[i-2][j-2]+1);
  }
  return d[a.length][b.length];
}
export function searchRecords(records, query, {mode='title',date='',area=''}={}) {
  const terms=tokens(query), phrase=normalize(query);
  if(phrase.length<3||!terms.length)return {items:[],approximate:false};
  const pool=records.filter(r=>(!date||r.date===date)&&(!area||r.area===area));
  const field=r=>normalize(mode==='author'?r.authors:r.title);
  const rank=(r,approximate)=>({record:r,approximate,score:(field(r)===phrase?1000:field(r).includes(phrase)?500:100)});
  const strict=pool.filter(r=>terms.every(term=>field(r).includes(term))).map(r=>rank(r,false));
  const sort=(a,b)=>b.score-a.score||a.record.date.localeCompare(b.record.date)||a.record.start.localeCompare(b.record.start)||a.record.room-b.record.room||a.record.id-b.record.id;
  if(strict.length)return {items:strict.sort(sort),approximate:false};
  const approximate=pool.filter(r=>{
    const value=field(r),words=tokens(value);
    return terms.every(term=>value.includes(term)||(term.length>=5&&words.some(w=>Math.abs(w.length-term.length)<=(term.length>=9?2:1)&&distance(term,w)<=(term.length>=9?2:1))));
  }).map(r=>rank(r,true));
  return {items:approximate.sort(sort),approximate:approximate.length>0};
}
