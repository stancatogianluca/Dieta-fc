(()=>{'use strict';
const D=window.DIET_DATA,S=window.FC_SWAPS,R=window.FC_RECIPES,V=()=>window.FC_V4,F=()=>window.FC_V48;
const root=()=>document.querySelector('#shopping'),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')||{}}catch{return {}}};
const KEY='fc_shop_checked_v48',fmt=n=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:1}).format(Math.max(0,n));
const PACK_KEY='fc_shop_packs_v1',packs=read(PACK_KEY),defaults={
'Barretta proteica Crownfield 40 g':{size:120,label:'scatole (3 barrette)'},
'Yogurt greco Neogal 10%':{size:150,label:'vasetti'},
'Latte intero senza lattosio':{size:1000,label:'cartoni da 1 L'},
'Tonno al naturale sgocciolato':{size:80,label:'scatolette'},
'Riso basmati':{size:1000,label:'confezioni da 1 kg'},
'Banana':{size:120,label:'banane'},
'Couscous':{size:500,label:'scatole da 500 g'},
'Bistecca di manzo':{size:200,label:'bistecche'},
'Hamburger di scottona':{size:150,label:'hamburger'},
'Passata di pomodoro':{size:700,label:'bottiglie da 700 g'}
};
const packFor=k=>packs[k]||defaults[k.split('|')[0]]||null;
const packCount=(qty,p)=>p&&p.size>0?Math.ceil(Math.max(0,qty-1e-7)/p.size):0;
const liquid=k=>/^(Latte intero senza lattosio|Olio EVO)$/.test(k.split('|')[0]);
const litreSize=k=>k.startsWith('Olio EVO|')?920:1000;
const displayQty=(k,qty)=>liquid(k)?fmt(qty/litreSize(k))+' L':fmt(qty)+' '+esc(k.split('|').pop());
const stockValue=(k,qty)=>liquid(k)?Number((qty/litreSize(k)).toFixed(3)):qty;
const stockUnit=k=>liquid(k)?'L':esc(k.split('|').pop());
const toStock=(k,n)=>liquid(k)?n*litreSize(k):n;
const buying=x=>{if(liquid(x.k))return displayQty(x.k,x.buy);const p=packFor(x.k);return p&&p.size>0?packCount(x.buy,p)+' '+esc(p.label||'confezioni'):displayQty(x.k,x.buy)};

let checked=read(KEY);const save=()=>localStorage.setItem(KEY,JSON.stringify(checked));
const currentWeek=()=>F()?.weekDates(F().today())||[];
const weekKey=()=>currentWeek()[0]||'weekly';
function quantity(){const q={};const add=(name,unit,v)=>{v=Number(v);if(!name||!unit||!Number.isFinite(v)||v<=0)return;const k=name+'|'+unit;q[k]=(q[k]||0)+v};
if(F()){for(const date of currentWeek()){const day=F().dayOf(date);if(day===6)continue;D[day].meals.forEach((_,i)=>Object.entries(F().ingredients(F().get(date,i))).forEach(([k,v])=>{const ix=k.lastIndexOf('|');add(k.slice(0,ix),k.slice(ix+1),v)}))}}else{const rs=S.recipeSwaps(),recipe=(id,p)=>{const r=R?.get(id);if(r&&r.portions>0)r.ingredients.forEach(a=>add(a.name,a.unit||'g',a.qty*p/r.portions))};D.forEach((d,di)=>d.meals.forEach((m,mi)=>{m.items.forEach((_,i)=>{const key=di+'_'+mi+'_'+i;if(rs[key])recipe(rs[key].recipeId,rs[key].portions);else{const x=S.current(di,mi,i);add(x.name,x.unit,x.qty)}});S.extras(di,mi).forEach(x=>add(x.name,x.unit,x.qty));(R?.used(di,mi)||[]).forEach(x=>recipe(x.id,x.portions))}))}return q}
function dialog(k,need){
 const ix=k.lastIndexOf('|'),name=k.slice(0,ix),unit=k.slice(ix+1),p=liquid(k)?null:packFor(k);
 const pack=!!(p&&p.size>0),factor=liquid(k)?litreSize(k):pack?p.size:1;
 const label=liquid(k)?'litri (L)':pack?p.label||'confezioni':unit;
 const suggested=pack?packCount(need,p):liquid(k)?Math.ceil(need/factor*10)/10:Math.ceil(need*10)/10;
 const box=document.createElement('dialog');box.className='swapdialog v48dialog';
 box.innerHTML='<form method="dialog"><h3>🛒 Acquisto e dispensa</h3><p><strong>'+esc(name)+'</strong></p><p>Da acquistare: '+buying({k,buy:need})+'</p><label>Quantità acquistata ('+esc(label)+')<input name="qty" type="number" inputmode="decimal" min="'+(pack?'1':'0.001')+'" max="100000" step="'+(pack?'1':'any')+'" required value="'+suggested+'"></label><p class="muted">Confermando, la quantità verrà aggiunta alla dispensa automaticamente.</p><div class="swapactions"><button type="button" class="secondary" id="fc-cancel-buy">Annulla</button><button type="submit">✓ Conferma acquisto</button></div></form>';
 document.body.appendChild(box);box.querySelector('#fc-cancel-buy').onclick=()=>box.close();
 box.querySelector('form').onsubmit=e=>{e.preventDefault();const input=box.querySelector('[name="qty"]');if(!input.reportValidity())return;const n=Number(input.value);if(!Number.isFinite(n)||n<=0||n>100000||(pack&&!Number.isInteger(n)))return;
 const qty=n*factor,old=Number(V()?.pantry()?.[k]||0);if(!V()?.setStock)return;
 V().setStock(k,Math.max(0,old)+qty);checked[weekKey()+'|'+k]=true;save();box.close();render()};
 box.onclose=()=>box.remove();box.showModal();
}
function render(){const el=root();if(!el)return;const q=quantity(),stock=V()?.pantry()||{},wk=weekKey();
const rows=Object.entries(q).map(([k,need])=>{const ix=k.lastIndexOf('|'),name=k.slice(0,ix),unit=k.slice(ix+1),have=Math.max(0,Number(stock[k])||0),buy=Math.max(0,need-have);return {k,name,unit,need,have,buy,done:!!checked[wk+'|'+k]}}).sort((a,b)=>Number(a.done)-Number(b.done)||a.name.localeCompare(b.name,'it'));
const toBuy=rows.filter(x=>x.buy>0.001),pending=toBuy.filter(x=>!x.done),done=toBuy.filter(x=>x.done),available=rows.filter(x=>x.buy<=0.001);const pct=toBuy.length?Math.round(done.length/toBuy.length*100):100;
const amount=x=>buying(x);
el.innerHTML='<div class="s46summary"><strong>🛒 Spesa settimanale</strong><span>'+pending.length+' da comprare</span></div><p class="muted">Settimana '+currentWeek()[0]+' – '+currentWeek()[6]+' · '+done.length+' comprati · '+available.length+' già in dispensa</p><div class="s46progress"><div style="width:'+pct+'%"></div></div><div class="s46quick">Totale necessario: <b>'+toBuy.length+' prodotti</b> · Ancora da comprare: <b>'+pending.length+'</b></div><button type="button" class="secondary s46clear" id="s46clear" style="margin:12px 0;padding:11px 15px;border-radius:12px">🗑️ Svuota dispensa</button>'+rows.map(x=>'<article class="s46row '+(x.done||x.buy<=0.001?'s46done':'')+'"><div class="s46check"><strong>'+esc(x.name)+'</strong><small>'+(x.buy<=0.001?'✓ Già in dispensa':x.done?'Da completare: '+amount(x):'Da comprare: '+amount(x))+'</small></div><div class="s46details"><span>Settimana: '+fmt(x.need)+' '+esc(x.unit)+'</span><label>In dispensa <input type="number" inputmode="decimal" min="0" step="any" data-stock="'+esc(x.k)+'" value="'+stockValue(x.k,x.have)+'" aria-label="Quantità in dispensa di '+esc(x.name)+'"> '+stockUnit(x.k)+'</label></div>'+(x.buy>0.001?'<button type="button" class="secondary v48buy" data-buy="'+esc(x.k)+'">✓ Comprato</button>':'')+'</article>').join('');
el.onclick=e=>{if(e.target.closest('#s46clear')){if(!confirm('Svuotare tutta la dispensa e azzerare le spunte Comprato? Questa operazione non può essere annullata.'))return;V()?.clearPantry();checked={};save();localStorage.setItem('fc_shop_v1','{}');render();return}const btn=e.target.closest('[data-buy]');if(!btn)return;const k=btn.dataset.buy,need=Math.max(0,Number(q[k]||0)-Number(V()?.pantry()?.[k]||0));if(need>0.001)dialog(k,need)};
el.onchange=e=>{const input=e.target;if(input.dataset.pack!==undefined){const n=Number(input.value);if(input.value.trim()===''||!Number.isFinite(n)||n<0){alert('Formato non valido.');render();return}if(n===0)delete packs[input.dataset.pack];else packs[input.dataset.pack]={size:n,label:'confezioni'};localStorage.setItem(PACK_KEY,JSON.stringify(packs));render();return}if(input.dataset.stock===undefined)return;const n=Number(input.value);if(input.value.trim()===''||!Number.isFinite(n)||n<0){alert('Inserisci una quantità valida.');render();return}V()?.setStock(input.dataset.stock,toStock(input.dataset.stock,n));const legacy=read('fc_shop_v1');delete legacy[input.dataset.stock];localStorage.setItem('fc_shop_v1',JSON.stringify(legacy));render()};
}
function missing(){const stock=V()?.pantry()||{};return Object.entries(quantity()).map(([k,need])=>{const ix=k.lastIndexOf('|'),name=k.slice(0,ix),unit=k.slice(ix+1),have=Math.max(0,Number(stock[k])||0),buy=Math.max(0,need-have),p=packFor(k);return {name,unit,need,have,buy,packs:liquid(k)?null:p&&p.size>0?packCount(buy,p):null,packLabel:p?.label||'confezioni',display:buying({k,buy})}}).filter(x=>x.buy>0.001).sort((a,b)=>a.name.localeCompare(b.name,'it'))}
window.FC_SHOP46={render,missing,clearChecks(){checked={};save();render()}};
document.addEventListener('fc-swap-changed',()=>{if(!document.querySelector('#shop')?.hidden)render()});
document.addEventListener('fc-pantry-changed',()=>{if(!document.querySelector('#shop')?.hidden)render()});
document.addEventListener('fc-plan-changed',()=>{if(!document.querySelector('#shop')?.hidden)render()});
})();