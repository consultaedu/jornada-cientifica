import {searchRecords, normalize} from './search.mjs';
const $=id=>document.getElementById(id);
let records=[],mode='title',matches=[],visible=12,ready=false,delay,toastTimer;
const weekdays={ '2026-11-16':'Segunda-feira','2026-11-17':'Terça-feira','2026-11-18':'Quarta-feira','2026-11-19':'Quinta-feira' };
const fmtDate=iso=>`${iso.slice(8,10)}/${iso.slice(5,7)}/${iso.slice(0,4)}`;
const element=(tag,className,text)=>{const e=document.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;};
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3600);}
function detail(label,value,sub){const box=element('div');box.append(element('span','detail-label',label));const v=element('div','detail-value',value);if(sub)v.append(element('small','',sub));box.append(v);return box;}
function card(r){
  const article=element('article','result-card');article.dataset.id=r.id;
  const main=element('div','card-main'),top=element('div','card-top');top.append(element('span','area-tag',r.area),element('span','work-number',`Trabalho ${String(r.id).padStart(3,'0')}`));
  const title=element('h3','',r.title),authors=element('p','authors');authors.append(element('strong','','Autores: '),document.createTextNode(r.authors));
  const details=element('div','card-details');details.append(detail('Dia da apresentação',fmtDate(r.date),weekdays[r.date]),detail('Horário',`${r.start} às ${r.end}`,'Horário de Brasília'),detail('Sala virtual',`Sala ${r.room}`,r.roomLabel.replace(/^Sala\s+\d+\s*-\s*/,'')));
  main.append(top,title,authors,details);
  const bottom=element('div','card-bottom'),mediator=element('p','mediator');mediator.append(document.createTextNode('Mediação: '),element('strong','',r.mediator));
  const actions=element('div','card-actions'),meet=element('a','meet-button','Acessar sala no Meet ↗');meet.href=r.link;meet.target='_blank';meet.rel='noopener noreferrer';meet.setAttribute('aria-label',`Acessar sala ${r.room} para ${r.title}, em ${fmtDate(r.date)}, às ${r.start}`);
  const copy=element('button','copy-button','Copiar informações');copy.type='button';copy.addEventListener('click',async()=>{
    const content=`${r.title}\nAutores: ${r.authors}\nData: ${fmtDate(r.date)}\nHorário: ${r.start} às ${r.end} (Brasília)\nSala ${r.room} — ${r.area}\nMediação: ${r.mediator}\n${r.link}`;
    try{await navigator.clipboard.writeText(content);toast('Informações copiadas.');}catch{toast('Não foi possível copiar. Selecione as informações no resultado.');}
  });
  actions.append(meet,copy);bottom.append(mediator,actions);article.append(main,bottom);return article;
}
function empty(title,message,examples=false){$('status').replaceChildren(element('div','empty-icon','⌕'),element('h2','',title),element('p','',message));$('status').hidden=false;if(examples){const ex=element('div','suggestions');ex.append(element('span','','Experimente:'));for(const q of ['Burnout','Autismo','Educação']){const b=element('button','',q);b.type='button';b.addEventListener('click',()=>suggest(q));ex.append(b);}$('status').append(ex);}}
function render(){
  $('results').replaceChildren(...matches.slice(0,visible).map(m=>card(m.record)));
  $('load-more').hidden=visible>=matches.length;
}
function perform(){
  if(!ready)return;
  const q=$('query').value.trim();$('clear').hidden=!q;
  $('reset-filters').hidden=!$('date-filter').value&&!$('area-filter').value;
  $('approximate-note').hidden=true;visible=12;matches=[];
  if(normalize(q).length<3){$('results-top').hidden=true;empty('Qual trabalho vamos encontrar?','Digite pelo menos 3 letras do título ou escolha a busca por autor.',true);render();return;}
  const found=searchRecords(records,q,{mode,date:$('date-filter').value,area:$('area-filter').value});matches=found.items;
  $('results-top').hidden=false;$('results-count').textContent=`${matches.length} ${matches.length===1?'trabalho encontrado':'trabalhos encontrados'}`;
  $('status').hidden=matches.length>0;
  if(!matches.length)empty('Não encontramos esse trabalho.','Tente uma palavra menos específica do título, confira a grafia ou limpe os filtros. Você também pode pesquisar pelo nome de um autor.');
  $('approximate-note').hidden=!found.approximate;render();
  const url=new URL(location.href);url.searchParams.delete('q');url.searchParams.delete('modo');url.searchParams.delete('dia');url.searchParams.delete('area');
  if(q){url.searchParams.set('q',q);if(mode!=='title')url.searchParams.set('modo',mode);if($('date-filter').value)url.searchParams.set('dia',$('date-filter').value);if($('area-filter').value)url.searchParams.set('area',$('area-filter').value);}
  history.replaceState(null,'',url);
}
function suggest(q){mode='title';document.querySelector('input[name="mode"][value="title"]').checked=true;updateMode();$('query').value=q;$('date-filter').value='';$('area-filter').value='';perform();$('query').focus();}
function updateMode(){const isAuthor=mode==='author';$('query-label').textContent=isAuthor?'Nome ou parte do nome do autor':'Título ou parte do título';$('query').placeholder=isAuthor?'Ex.: Ana Paula Rodrigues':'Ex.: alterações neuroquímicas no cérebro';}
$('search-form').addEventListener('submit',e=>{e.preventDefault();clearTimeout(delay);perform();});
$('query').addEventListener('input',()=>{clearTimeout(delay);delay=setTimeout(perform,180);});
$('clear').addEventListener('click',()=>{$('query').value='';perform();$('query').focus();});
for(const input of document.querySelectorAll('input[name="mode"]'))input.addEventListener('change',()=>{mode=input.value;updateMode();perform();});
for(const id of ['date-filter','area-filter'])$(id).addEventListener('change',perform);
$('reset-filters').addEventListener('click',()=>{$('date-filter').value='';$('area-filter').value='';perform();});
$('load-more').addEventListener('click',()=>{visible+=12;render();});
for(const b of document.querySelectorAll('[data-query]'))b.addEventListener('click',()=>suggest(b.dataset.query));
try{
  const response=await fetch('data.json');if(!response.ok)throw new Error('data');const payload=await response.json();
  records=payload.records;if(!Array.isArray(records)||records.length!==137)throw new Error('data');
  for(const area of [...new Set(records.map(r=>r.area))].sort((a,b)=>a.localeCompare(b,'pt-BR'))){const o=element('option','',area);o.value=area;$('area-filter').append(o);}
  const params=new URLSearchParams(location.search);$('query').value=(params.get('q')||'').slice(0,180);if(params.get('modo')==='author'){mode='author';document.querySelector('input[name="mode"][value="author"]').checked=true;updateMode();}
  if(weekdays[params.get('dia')])$('date-filter').value=params.get('dia');if(records.some(r=>r.area===params.get('area')))$('area-filter').value=params.get('area');
  ready=true;$('loading').hidden=true;perform();
}catch{
  $('loading').hidden=true;$('results-top').hidden=true;empty('A programação não carregou.','Atualize esta página para tentar novamente.');$('search-form').querySelectorAll('input,button,select').forEach(el=>el.disabled=true);
}
