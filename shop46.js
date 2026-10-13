(()=>{'use strict';
const D=window.DIET_DATA,S=window.FC_SWAPS,R=window.FC_RECIPES,V=()=>window.FC_V4;
const $=q=>document.querySelector(q),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')||{}}catch{return {}}};
const KEY='fc_shop_checked_v46';let checked=read(KEY);
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(checked))}catch{alert('Impossibile salvare le spunte.')}};
const fmt=n=>new Intl.NumberFormat('it-IT',{maximumFractionDigits:1}).format(Math.max(0,n));
const quantity=()=>{const q={};const add=(n,u,v)=>{v=Number(v);if(!n||!u||!Number.isFinite(v)||v<=0)return;const k=n+'|'+u;q[k]=(q[k]||0)+v};
const recipe=(id,portions)=>{const r=R?.get(id);if(!r||!(Number(r.portions)>0))return;for(const a of r.ingredients||[])add(a.name,a.unit||'g',Number(a.qty)*Number(portions)/r.portions)};
const rs=S.recipeSwaps();
D.forEach((day,d)=>day.meals.forEach((meal,m)=>{meal.items.forEach((item,i)=>{const id=d+'_'+m+'_'+i;if(rs[id])recipe(rs[id].recipeId,rs[id].portions);else{const x=S.current(d,m,i);add(x.name,x.unit,x.qty)}});S.extras(d,m).forEach(x=>add(x.name,x.unit,x.qty));(R?.used(d,m)||[]).forEach(x=>recipe(x.id,x.portions))}));
return q};
function render(){const root=$('#shopping');if(!root)return;const quantities=quantity(),stock=V()?.pantry()||{},old=read('fc_shop_v1');
const rows=Object.keys(quantities).map(k=>{const [name,unit]=k.split('|');const need=quantities[k],legacy=!!old[k]&&!Object.prototype.hasOwnProperty.call(stock,k),have=legacy?need:Math.max(0,Number(stock[k])||0),buy=Math.max(0,need-have);return {k,name,unit,need,have,buy,done:!!checked[k]}}).sort((a,b)=>Number(a.done)-Number(b.done)||a.name.localeCompare(b.name,'it'));
const active=rows.filter(x=>x.buy>0.001),done=active.filter(x=>x.done).length,percent=active.length?Math.round(done/active.length*100):100;
root.innerHTML='<div class="s46summary"><strong>'+done+' di '+active.length+' prodotti acquistati</strong><span>'+percent+'%</span></div><div class="s46progress" role="progressbar" aria-label="Avanzamento spesa" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+percent+'"><div style="width:'+percent+'%"></div></div><p class="muted">Quantità per l’intera settimana, aggiornate da menù, modifiche e ricette. La dispensa viene sottratta automaticamente.</p>'+
(active.length?active.map(x=>'<article class="s46row '+(x.done?'s46done':'')+'"><label class="s46check"><input type="checkbox" data-bought="'+esc(x.k)+'" '+(x.done?'checked':'')+'><span><strong>'+esc(x.name)+'</strong><small>Da comprare: <b>'+fmt(x.buy)+' '+esc(x.unit)+'</b></small></span></label><div class="s46details"><span>Servono '+fmt(x.need)+' '+esc(x.unit)+'</span><label>In casa <input type="number" inputmode="decimal" min="0" step="any" data-stock="'+esc(x.k)+'" value="'+x.have+'" aria-label="Quantità disponibile: '+esc(x.name)+'"> '+esc(x.unit)+'</label></div></article>').join(''):'<p class="s46empty">🎉 Nessun prodotto da acquistare!</p>')+
(rows.length>active.length?'<details class="s46owned"><summary>✓ Già in dispensa ('+(rows.length-active.length)+')</summary>'+rows.filter(x=>x.buy<=0.001).map(x=>'<div class="s46ownedrow"><strong>'+esc(x.name)+'</strong><small>Servono '+fmt(x.need)+' '+esc(x.unit)+'</small><label>In casa <input type="number" inputmode="decimal" min="0" step="any" data-stock="'+esc(x.k)+'" value="'+x.have+'" aria-label="Quantità disponibile: '+esc(x.name)+'"> '+esc(x.unit)+'</label></div>').join('')+'</details>':'');
root.onchange=e=>{const el=e.target;if(el.dataset.bought!==undefined){checked[el.dataset.bought]=el.checked;save();render();return}if(el.dataset.stock!==undefined){const v=Number(el.value);if(el.value.trim()===''||!Number.isFinite(v)||v<0){alert('Inserisci una quantità valida.');render();return}V()?.setStock(el.dataset.stock,v);const oldChecks=read('fc_shop_v1');delete oldChecks[el.dataset.stock];localStorage.setItem('fc_shop_v1',JSON.stringify(oldChecks));render()}};
}
window.FC_SHOP46={render,clearChecks(){checked={};save();render()}};
document.addEventListener('fc-swap-changed',()=>{if(!$('#shop')?.hidden)render()});
})();