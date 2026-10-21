'use strict';
const config = window.ANGUS_CONFIG;
const $ = (selector) => document.querySelector(selector);
const money = cents => (cents / 100).toLocaleString('pt-BR', {style:'currency',currency:'BRL'});
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const photo = (id, width=800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
const products = [
  {id:'classic',category:'Clássicos',name:'Angus Original',weight:'180g',price:3290,badge:'O CLÁSSICO DA CASA',image:'photo-1568901346375-23c9450c58cd',description:'Blend Angus 180g, queijo cheddar, alface, tomate e maionese da casa no pão brioche.'},
  {id:'bacon',category:'Clássicos',name:'Bacon & Brasa',weight:'180g',price:3890,badge:'MAIS PEDIDO · DEMO',image:'photo-1561758033-d89a9ad46330',description:'Blend Angus 180g, cheddar cremoso, bacon crocante e barbecue artesanal no pão brioche.'},
  {id:'cheese',category:'Clássicos',name:'Cheese Lovers',weight:'180g',price:3690,badge:'PARA QUEM AMA QUEIJO',image:'photo-1571091718767-18b5b1457add',description:'Blend Angus 180g, cheddar, muçarela, queijo prato e maionese de alho assado.'},
  {id:'signature',category:'Especiais Angus',name:'Angus Signature',weight:'200g',price:4490,badge:'ASSINATURA DA CASA',image:'photo-1550547660-d9450f859349',description:'Angus 200g, queijo brie, cebola caramelizada e rúcula no pão de fermentação natural.'},
  {id:'double',category:'Especiais Angus',name:'Double Smoke',weight:'360g',price:4990,badge:'DOSE DUPLA DE SABOR',image:'photo-1561758033-d89a9ad46330',description:'Dois blends Angus de 180g, cheddar duplo, bacon defumado e molho especial da casa.'},
  {id:'pepper',category:'Especiais Angus',name:'Fire Angus',weight:'180g',price:4190,badge:'UM TOQUE DE FOGO',image:'photo-1568901346375-23c9450c58cd',description:'Angus 180g, cheddar, jalapeños, cebola roxa e maionese de páprica defumada.'},
  {id:'fries',category:'Acompanhamentos',name:'Fritas da Casa',weight:'250g',price:1990,badge:'CROCANTE DE VERDADE',image:'photo-1573080496219-bb080dd4f877',description:'Batatas douradas e sequinhas, sal de ervas e uma porção da nossa maionese artesanal.'},
  {id:'loaded',category:'Acompanhamentos',name:'Fritas Cheddar & Bacon',weight:'350g',price:2890,image:'photo-1630384060421-cb20d0e0649d',description:'Fritas da casa cobertas com cheddar cremoso, bacon crocante e cebolinha fresca.'},
  {id:'lemon',category:'Bebidas',name:'Limonada da Casa',weight:'400ml',price:1290,image:'photo-1534353473418-4cfa6c56fd38',description:'Limão espremido na hora, água gelada e um toque de hortelã. Refrescante na medida.'},
  {id:'soda',category:'Bebidas',name:'Refrigerante',weight:'350ml',price:790,image:'photo-1622483767028-3f66f32aef97',description:'Lata gelada para acompanhar sua escolha. Informe o sabor de preferência nas observações.'},
  {id:'brownie',category:'Sobremesas',name:'Brownie da Brasa',weight:'1 porção',price:2190,badge:'FINAL FELIZ',image:'photo-1606313564200-e75d5e30476c',description:'Brownie de chocolate intenso, servido morno com sorvete de baunilha e calda de chocolate.'},
  {id:'shake',category:'Sobremesas',name:'Milk-shake de Chocolate',weight:'400ml',price:2290,image:'photo-1572490122747-3968b75cc699',description:'Sorvete de chocolate batido com leite, calda artesanal e chantilly. Cremoso até o fim.'}
];
const categories = ['Todos','Clássicos','Especiais Angus','Acompanhamentos','Bebidas','Sobremesas'];
const categoryLabels = {'Todos':'Nossos burgers','Clássicos':'Burgers Clássicos','Especiais Angus':'Especiais Angus'};
function readStorage(key,fallback){try{return JSON.parse(localStorage.getItem(key)) ?? fallback;}catch{return fallback;}}
function saveStorage(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{toast('Armazenamento indisponível. Seus dados ficam somente nesta sessão.');}}
let cart = readStorage('angus-cart-v1',{});
if(!cart || typeof cart!=='object' || Array.isArray(cart)) cart={};
for(const id of Object.keys(cart)) if(!products.some(p=>p.id===id)||!Number.isInteger(cart[id])||cart[id]<1||cart[id]>99) delete cart[id];
let activeCategory='Todos', previousFocus=null, toastTimer;
const cartEntries = () => products.filter(p=>cart[p.id]).map(p=>({...p,qty:cart[p.id]}));
const cartTotal = () => cartEntries().reduce((sum,p)=>sum+p.price*p.qty,0);
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3300);}
function renderProducts(){
  $('#tabs').innerHTML=categories.map(c=>`<button class="tab ${c===activeCategory?'active':''}" role="tab" aria-selected="${c===activeCategory}" tabindex="${c===activeCategory?'0':'-1'}" data-category="${c}">${categoryLabels[c]||c}</button>`).join('');
  const items=products.filter(p=>activeCategory==='Todos'?['Clássicos','Especiais Angus'].includes(p.category):p.category===activeCategory);
  $('#menuCount').textContent=`${items.length} opções ${activeCategory==='Todos'?'de burgers':''}`;
  $('#products').innerHTML=items.map((p,i)=>`<article class="product-card" style="animation-delay:${i*45}ms"><div class="product-image"><img src="${photo(p.image)}" alt="Imagem ilustrativa de ${p.name}" loading="lazy">${p.badge?`<span class="badge ${i%3===2?'secondary':''}">${p.badge}</span>`:''}</div><div class="product-info"><div class="product-title"><h3>${p.name}</h3><span>${p.weight}</span></div><p>${p.description}</p><div class="product-bottom"><span class="price"><small>R$</small>${(p.price/100).toFixed(2).replace('.',',')}</span><button class="add-button" data-add="${p.id}" aria-label="Adicionar ${p.name} ao pedido">Adicionar ao pedido <b>+</b></button></div></div></article>`).join('');
}
$('#tabs').addEventListener('click',e=>{const btn=e.target.closest('[data-category]');if(btn){activeCategory=btn.dataset.category;renderProducts();$('#tabs').querySelector('[aria-selected="true"]').focus({preventScroll:true});}});
$('#tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();let i=categories.indexOf(activeCategory);i=e.key==='Home'?0:e.key==='End'?categories.length-1:(i+(e.key==='ArrowRight'?1:-1)+categories.length)%categories.length;activeCategory=categories[i];renderProducts();$('#tabs').querySelector('[aria-selected="true"]').focus({preventScroll:true});});
$('#products').addEventListener('click',e=>{const btn=e.target.closest('[data-add]');if(!btn)return;const id=btn.dataset.add;if((cart[id]||0)>=99)return toast('Limite de 99 unidades por item.');cart[id]=(cart[id]||0)+1;renderCart();toast(`${products.find(p=>p.id===id).name} adicionado ao pedido`);});
function renderCart(){
  const entries=cartEntries(),qty=entries.reduce((s,p)=>s+p.qty,0);
  $('#cartCount').textContent=qty;$('#floatingQty').textContent=qty;$('#floatingTotal').textContent=money(cartTotal());$('#floatingCart').hidden=!qty;
  $('#cartTotal').textContent=money(cartTotal());
  $('#cartItems').innerHTML=entries.length?entries.map(p=>`<div class="cart-item"><img src="${photo(p.image,150)}" alt=""><div class="cart-item-info"><h3>${p.name}</h3><strong>${money(p.price*p.qty)}</strong><div class="quantity"><button data-qty="${p.id}" data-delta="-1" aria-label="Diminuir ${p.name}">−</button><span>${p.qty}</span><button data-qty="${p.id}" data-delta="1" aria-label="Aumentar ${p.name}">+</button><button class="remove-item" data-remove="${p.id}">Remover</button></div></div></div>`).join(''):'<div class="empty-cart"><span>◫</span>Seu próximo favorito está no cardápio.<br>Adicione um burger para começar.<br><button class="text-link" data-close-cart>Explorar o cardápio ↗</button></div>';
  $('#checkoutForm').hidden=!entries.length;saveStorage('angus-cart-v1',cart);
}
$('#cartItems').addEventListener('click',e=>{const qty=e.target.closest('[data-qty]'),remove=e.target.closest('[data-remove]');if(qty){const id=qty.dataset.qty;cart[id]=Math.min(99,cart[id]+Number(qty.dataset.delta));if(cart[id]<1)delete cart[id];renderCart();}else if(remove){delete cart[remove.dataset.remove];renderCart();}else if(e.target.closest('[data-close-cart]'))closeCart();});
function openCart(){previousFocus=document.activeElement;$('#cartOverlay').hidden=false;$('#cartDrawer').hidden=false;document.body.style.overflow='hidden';$('[data-close-cart]').focus();}
function closeCart(){if($('#cartDrawer').hidden)return;$('#cartOverlay').hidden=true;$('#cartDrawer').hidden=true;document.body.style.overflow='';previousFocus?.focus();}
document.querySelectorAll('[data-open-cart]').forEach(b=>b.addEventListener('click',openCart));
document.querySelectorAll('[data-close-cart]').forEach(b=>b.addEventListener('click',closeCart));$('#cartOverlay').addEventListener('click',closeCart);
document.addEventListener('keydown',e=>{if($('#cartDrawer').hidden)return;if(e.key==='Escape')closeCart();if(e.key==='Tab'){const nodes=[...$('#cartDrawer').querySelectorAll('button,input,select,textarea')].filter(n=>n.offsetParent!==null&&!n.disabled);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
let confirming=false;
$('#checkoutForm').addEventListener('submit',e=>{
  e.preventDefault();if(confirming||!cartEntries().length)return;
  const name=$('#customer').value.trim();if(!name){$('#customer').setCustomValidity('Informe seu nome.');$('#customer').reportValidity();return;}
  confirming=true;
  try {
    const order=window.AngusOrders.createOrder({customer:name,service:$('#service').value,notes:$('#notes').value.trim(),items:cartEntries().map(p=>({name:p.name,qty:p.qty,price:p.price}))});
    cart={};renderCart();$('#checkoutForm').reset();closeCart();
    $('#orderConfirmationText').textContent=`Pedido #${order.number} recebido! Total: ${money(order.total)}. Seu pedido foi enviado para o preparo.`;
    $('#orderConfirmation').showModal();toast(`Pedido #${order.number} enviado para a cozinha de demonstração!`);
  } catch(error) {toast(error.message);}
  finally {setTimeout(()=>confirming=false,700);}
});
$('#customer').addEventListener('input',()=>$('#customer').setCustomValidity(''));
document.querySelectorAll('[data-close-dialog]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
const saoPauloDate=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Sao_Paulo'});
$('#resDate').min=saoPauloDate();$('#resDate').value=saoPauloDate();
$('#reserve').addEventListener('click',()=>$('#reservationDialog').showModal());
let reservationBusy=false;
$('#reservationForm').addEventListener('submit',e=>{e.preventDefault();if(reservationBusy)return;const name=$('#resName').value.trim(),date=$('#resDate').value,time=$('#resTime').value;if(!name)return toast('Informe seu nome para preparar a reserva.');if(date<saoPauloDate())return toast('Escolha uma data a partir de hoje.');const day=new Date(`${date}T12:00:00`).getDay(),hours=config.hours[day];const [h,m]=time.split(':').map(Number),requested=h+m/60;if(!hours||requested<hours[0]||requested>=hours[1])return toast('Escolha um horário dentro do funcionamento da casa.');const nowParts=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date());if(date===saoPauloDate()&&time<=nowParts)return toast('Escolha um horário futuro para sua reserva.');const message=`Olá, AngusBurguer! Gostaria de solicitar uma reserva.\nNome: ${name}\nData: ${date.split('-').reverse().join('/')}\nHorário: ${time}\nPessoas: ${$('#resPeople').value}\nAguardo a confirmação da equipe.`;const result=$('#reservationResult');result.hidden=false;result.textContent=config.whatsappDemo?'Solicitação preparada (demonstração — número fictício):\n\n'+message:message;if(config.whatsapp){const link=document.createElement('a');link.className='btn gold checkout';link.textContent=config.whatsappDemo?'Abrir WhatsApp fictício ↗':'Enviar pelo WhatsApp ↗';link.href=`https://wa.me/${config.whatsapp}?text=${encodeURIComponent(message)}`;link.target='_blank';link.rel='noopener noreferrer';result.append(document.createElement('br'),link);}reservationBusy=true;$('#reservationSubmit').disabled=true;setTimeout(()=>{reservationBusy=false;$('#reservationSubmit').disabled=false;},2500);});
$('#resDate').addEventListener('change',()=>{const hours=config.hours[new Date(`${$('#resDate').value}T12:00:00`).getDay()];$('#resTime').max=hours&&hours[1]<24?`${Math.floor(hours[1])}:${Math.round((hours[1]%1)*60).toString().padStart(2,'0')}`:'23:59';});
if(config.address)$('#address').textContent=config.address;
if(config.whatsapp){$('#reservationNote').textContent=config.whatsappDemo?'WhatsApp fictício: (18) 9999-9999. Esta demonstração prepara a mensagem; nenhuma reserva é confirmada automaticamente.':'Você será direcionado ao WhatsApp com uma mensagem pronta. A reserva depende de confirmação da equipe.';}
function openMap(){window.open(config.mapsUrl||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(config.address||'AngusBurguer')}`,'_blank','noopener,noreferrer');}
$('#mapLink').addEventListener('click',openMap);$('#route').addEventListener('click',openMap);
if(config.address){$('.map-caption').textContent=config.address.toUpperCase();$('#route').textContent='Buscar este endereço ↗';}
if(config.instagram)document.querySelector('.socials a:first-child').href=config.instagram;
if(config.tiktok)document.querySelector('.socials a:last-child').href=config.tiktok;
function updateOpening(){if(!config.verifiedHours)return;const parts=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());const get=k=>parts.find(p=>p.type===k)?.value;const day=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(get('weekday'));const t=Number(get('hour'))+Number(get('minute'))/60;const hours=config.hours[day];const open=hours&&t>=hours[0]&&t<hours[1];$('#opening .status-dot').classList.toggle('open',!!open);$('#opening span:last-child').textContent=open?`Aberto agora · até ${hours[1]===24?'00h':hours[1]===22.5?'22h30':'23h'}`:hours&&t<hours[0]?'Fechado agora · abrimos hoje às 18h':'Fechado agora · ter. a dom. a partir das 18h';}
$('#mobileNav').addEventListener('click',()=>{const open=$('.header nav').classList.toggle('mobile-open');$('#mobileNav').setAttribute('aria-expanded',String(open));});
document.querySelectorAll('.header nav a').forEach(a=>a.addEventListener('click',()=>{$('.header nav').classList.remove('mobile-open');$('#mobileNav').setAttribute('aria-expanded','false');}));
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.1});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
function updateStoreAvailability(){
  try{const state=window.AngusOrders.snapshot();const closed=!state.activeSessionId;const submit=$('#checkoutForm button[type="submit"]');submit.disabled=closed;submit.innerHTML=closed?'Loja fechada no painel':'Confirmar pedido <span>↗</span>';if(closed){$('#opening .status-dot').classList.remove('open');$('#opening span:last-child').textContent='Loja fechada no painel · pedidos pausados';}else updateOpening();}catch(error){toast(error.message);}
}
window.addEventListener('angus:operations',updateStoreAvailability);
window.addEventListener('storage',e=>{if(e.key===window.AngusOrders.key)updateStoreAvailability();});
$('#year').textContent=new Date().getFullYear();renderProducts();renderCart();updateStoreAvailability();setInterval(updateStoreAvailability,30000);


