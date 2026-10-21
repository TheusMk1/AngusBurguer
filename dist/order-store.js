/* Repositório local da demonstração. Em produção, estas operações pertencem à API. */
(function () {
  'use strict';
  const KEY = 'angus-operations-v2';
  const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  const now = () => new Date().toISOString();
  // A operação da noite continua no mesmo dia comercial até 06h de Brasília.
  function businessDate(value = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value));
    const get = type => parts.find(p => p.type === type).value;
    const date = new Date(`${get('year')}-${get('month')}-${get('day')}T12:00:00Z`);
    if (Number(get('hour')) < 6) date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
  }
  function read(key, fallback) { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  function load() {
    const value = read(KEY, null);
    if (value) {
      if (value.version !== 2 || !Array.isArray(value.orders) || !Array.isArray(value.sessions)) throw new Error('Os dados locais não puderam ser lidos. Preserve o armazenamento e procure suporte.');
      return value;
    }
    const session = {id:uid(),businessDate:businessDate(),openedAt:now(),closedAt:null,report:null};
    let legacy = read('angus-orders-v1', []);
    if (!Array.isArray(legacy)) legacy = [];
    const orders = legacy.filter(o => o && typeof o.id === 'string' && Array.isArray(o.items) && ['Novo','Em preparo','Pronto'].includes(o.status) && Number.isSafeInteger(o.total) && o.total >= 0).map(o => ({...o,sessionId:session.id,imported:true}));
    const state = {version:2,orders,sessions:[session],activeSessionId:session.id,nextNumber:orders.reduce((n,o) => Math.max(n,Number(o.number)||0),1000)+1};
    write(state); return state;
  }
  function write(state) {
    try {localStorage.setItem(KEY, JSON.stringify(state));}
    catch {throw new Error('Não foi possível salvar os dados neste navegador. Libere espaço ou permita o armazenamento e tente novamente.');}
  }
  function snapshot() {return structuredClone(load());}
  function active(state) {return state.sessions.find(s => s.id === state.activeSessionId && !s.closedAt);}
  function summary(state, session) {
    const own = state.orders.filter(o => o.sessionId === session.id);
    const delivered = own.filter(o => o.status === 'Entregue');
    const lines = new Map();
    for (const order of delivered) for (const item of order.items) {
      const line = lines.get(item.name) || {name:item.name,qty:0,total:0};
      line.qty += item.qty; line.total += item.qty * item.price; lines.set(item.name,line);
    }
    const total = delivered.reduce((sum,o) => sum + o.total,0);
    const daySessionIds = new Set(state.sessions.filter(s => s.businessDate === session.businessDate).map(s => s.id));
    return {total,dayTotal:state.orders.filter(o => daySessionIds.has(o.sessionId) && o.status === 'Entregue').reduce((sum,o) => sum + o.total,0),count:delivered.length,average:delivered.length ? Math.round(total/delivered.length):0,pending:own.filter(o => o.status !== 'Entregue').length,items:[...lines.values()].sort((a,b) => b.qty-a.qty)};
  }
  function notify() {window.dispatchEvent(new Event('angus:operations'));}
  function mutate(fn) {const state=load(); const result=fn(state); write(state); notify(); return result;}
  window.AngusOrders = {
    key:KEY, snapshot, businessDate,
    summary(sessionId) {const state=load();const session=state.sessions.find(s=>s.id===sessionId)||active(state)||state.sessions.at(-1);return {...summary(state,session),session};},
    createOrder(input) {return mutate(state => {
      const session=active(state); if(!session) throw new Error('A loja foi fechada no painel. Abra um novo turno para receber pedidos.');
      if(!input.customer?.trim() || !Array.isArray(input.items) || !input.items.length) throw new Error('Preencha o nome e adicione um item ao pedido.');
      const items=input.items.map(item=>{
        if(!Number.isSafeInteger(item.qty)||item.qty<1||item.qty>99||!Number.isSafeInteger(item.price)||item.price<0) throw new Error('Item do pedido inválido.');
        return {name:String(item.name),qty:item.qty,price:item.price};
      });
      const total=items.reduce((sum,item)=>sum+item.qty*item.price,0);
      if(!Number.isSafeInteger(total)) throw new Error('Total inválido.');
      const order={id:uid(),number:state.nextNumber++,sessionId:session.id,customer:input.customer.trim().slice(0,60),service:input.service,notes:String(input.notes||'').slice(0,500),items,total,status:'Novo',createdAt:now(),deliveredAt:null};
      state.orders.push(order);return structuredClone(order);
    });},
    advance(id) {return mutate(state=>{
      const order=state.orders.find(o=>o.id===id);const session=active(state);
      if(!order||order.sessionId!==session?.id) throw new Error('Pedido indisponível neste turno.');
      if(order.status==='Novo') order.status='Em preparo';else if(order.status==='Em preparo') order.status='Pronto';
      return structuredClone(order);
    });},
    deliver(id) {return mutate(state=>{
      const order=state.orders.find(o=>o.id===id);const session=active(state);
      if(!order||order.sessionId!==session?.id||order.status!=='Pronto') throw new Error('Somente pedidos prontos podem ser retirados do painel.');
      order.status='Entregue';order.deliveredAt=now();return structuredClone(order);
    });},
    closeDay(password) {
      if(password!=='1234') throw new Error('Senha incorreta. Use 1234 nesta demonstração.');
      return mutate(state=>{
        const session=active(state);if(!session) throw new Error('Este turno já está fechado.');
        const report=summary(state,session);
        if(report.pending) throw new Error(`Há ${report.pending} pedido(s) pendente(s). Finalize o preparo e confirme a retirada antes de fechar.`);
        session.closedAt=now();session.report=report;state.activeSessionId=null;
        return structuredClone(session);
      });
    },
    openShift() {return mutate(state=>{
      if(active(state)) throw new Error('Já existe um turno aberto.');
      const session={id:uid(),businessDate:businessDate(),openedAt:now(),closedAt:null,report:null};
      state.sessions.push(session);state.activeSessionId=session.id;return structuredClone(session);
    });}
  };
})();
