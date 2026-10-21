const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../dist/order-store.js'),'utf8');
function setup(data=new Map()){
  const window=new EventTarget();
  const storage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};
  const context={window,localStorage:storage,crypto:require('node:crypto').webcrypto,Date,Intl,Math,JSON,Number,String,Array,Object,Set,Map,structuredClone,Event};
  vm.createContext(context);vm.runInContext(source,context);
  return {store:window.AngusOrders,data,storage,window};
}
const input={customer:'Cliente teste',service:'Retirada no balcão',notes:'Sem cebola',items:[{name:'Angus Original',qty:2,price:3290},{name:'Limonada',qty:1,price:1290}]};
function complete(store,id){store.advance(id);store.advance(id);store.deliver(id);}
test('retirada remove o pedido ativo e mantém a venda uma única vez',()=>{
  const {store}=setup();const o=store.createOrder(input);assert.equal(o.total,7870);
  assert.throws(()=>store.deliver(o.id),/Somente pedidos prontos/);
  assert.equal(store.summary().total,0);assert.equal(store.summary().pending,1);
  complete(store,o.id);
  assert.equal(store.snapshot().orders[0].status,'Entregue');assert.equal(store.summary().total,7870);assert.equal(store.summary().count,1);
  assert.throws(()=>store.deliver(o.id),/Somente pedidos prontos/);assert.equal(store.summary().total,7870);
});
test('fechamento exige senha e não aceita pedidos pendentes',()=>{
  const {store}=setup();const o=store.createOrder(input);
  assert.throws(()=>store.closeDay('0000'),/Senha incorreta/);assert.throws(()=>store.closeDay('1234'),/pendente/);
  assert.ok(store.snapshot().activeSessionId);store.advance(o.id);store.advance(o.id);
  assert.throws(()=>store.closeDay('1234'),/pendente/);store.deliver(o.id);
  const closed=store.closeDay('1234');assert.equal(closed.report.total,7870);assert.equal(closed.report.count,1);assert.equal(closed.report.average,7870);
  assert.equal(closed.report.items.find(i=>i.name==='Angus Original').qty,2);
  assert.equal(store.snapshot().activeSessionId,null);assert.throws(()=>store.closeDay('1234'),/já está fechado/);assert.throws(()=>store.createOrder(input),/Abra um novo turno/);
});
test('reabrir mantém o histórico, separa turnos e soma o faturamento da mesma data',()=>{
  const {store,data}=setup();const o=store.createOrder(input);complete(store,o.id);const closed=store.closeDay('1234');
  const nextSession=store.openShift();assert.notEqual(nextSession.id,closed.id);assert.equal(store.summary().total,0);assert.equal(store.summary().dayTotal,7870);
  const next=store.createOrder(input);assert.equal(next.number,o.number+1);complete(store,next.id);
  assert.equal(store.summary().total,7870);assert.equal(store.summary().dayTotal,15740);
  const restored=setup(data).store;assert.equal(restored.summary().total,7870);assert.equal(restored.snapshot().sessions[0].report.dayTotal,7870);
  assert.equal(restored.closeDay('1234').report.dayTotal,15740);
});
test('dia comercial da noite não muda à meia-noite e respeita o fuso brasileiro',()=>{
  const {store}=setup();assert.equal(store.businessDate('2026-10-22T02:59:00Z'),'2026-10-21');
  assert.equal(store.businessDate('2026-10-22T03:01:00Z'),'2026-10-21');
  assert.equal(store.businessDate('2026-10-22T08:59:00Z'),'2026-10-21');
  assert.equal(store.businessDate('2026-10-22T09:00:00Z'),'2026-10-22');
});
test('migra tickets antigos sem perder números ou observações',()=>{
  const legacy=[{id:'legacy-1',number:1050,items:input.items,total:7870,customer:'Legado',notes:'Sem sal',status:'Pronto',createdAt:'2026-10-21T21:00:00Z'}];
  const data=new Map([['angus-orders-v1',JSON.stringify(legacy)]]);const {store}=setup(data);
  assert.equal(store.snapshot().orders[0].notes,'Sem sal');assert.equal(store.summary().pending,1);store.deliver('legacy-1');
  assert.equal(store.summary().total,7870);assert.equal(store.createOrder(input).number,1051);assert.equal(JSON.parse(data.get('angus-orders-v1')).length,1);
});
test('duas abas leem a versão mais recente antes de alterar pedidos',()=>{
  const data=new Map();const a=setup(data).store,b=setup(data).store;const o=a.createOrder(input);
  b.advance(o.id);assert.equal(a.snapshot().orders[0].status,'Em preparo');a.advance(o.id);b.deliver(o.id);
  b.closeDay('1234');assert.throws(()=>a.createOrder(input),/Abra um novo turno/);
});
test('falha no armazenamento não confirma alteração nem apaga pedidos existentes',()=>{
  const {store,storage}=setup();const o=store.createOrder(input);const original=storage.setItem;
  storage.setItem=()=>{throw new Error('QuotaExceeded');};assert.throws(()=>store.advance(o.id),/Não foi possível salvar/);
  storage.setItem=original;assert.equal(store.snapshot().orders[0].status,'Novo');
});
test('valores inválidos são recusados e turno vazio pode ser fechado com zero',()=>{
  const {store}=setup();assert.throws(()=>store.createOrder({...input,items:[{name:'Produto',qty:1,price:-10}]}),/inválido/);
  assert.equal(store.snapshot().orders.length,0);const closed=store.closeDay('1234');assert.equal(closed.report.total,0);assert.equal(closed.report.count,0);
});
