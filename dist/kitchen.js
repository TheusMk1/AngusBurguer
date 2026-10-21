(function () {
  'use strict';
  const root=document.querySelector('#kitchenApp');if(!root)return;
  const store=window.AngusOrders;
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=value=>(value/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const date=value=>new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  const day=value=>value.split('-').reverse().join('/');
  let closing=false,selectedReport=null;
  root.innerHTML=`<div id="kitchenNotice" class="operation-notice" role="status" aria-live="polite"></div><div id="shiftToolbar" class="shift-toolbar"></div><div id="shiftMetrics" class="shift-metrics"></div><div id="kitchenBoard" class="kitchen-board"></div><section class="closure-history"><div class="history-heading"><h3>FECHAMENTOS ANTERIORES</h3><span>Histórico preservado neste navegador</span></div><div id="closureHistory"></div></section><section id="closePanel" class="close-panel" hidden><h3>CONFIRMAR FECHAMENTO DO DIA</h3><p>Os pedidos entregues continuarão registrados. A loja deixará de receber pedidos até a abertura de um novo turno.</p><form id="closeDayForm"><label for="closePassword">Senha de fechamento</label><div class="close-form-row"><input id="closePassword" type="password" inputmode="numeric" autocomplete="off" required placeholder="Senha de demonstração: 1234"><button class="btn gold" type="submit">Confirmar fechamento</button><button class="btn glass" id="cancelClose" type="button">Cancelar</button></div><p id="closeError" class="form-error" role="alert"></p></form></section><section id="closeReport" class="close-report" hidden aria-live="polite"></section>`;
  const $=selector=>root.querySelector(selector);
  function notice(text){$('#kitchenNotice').textContent=text;}
  function renderReport(session){
    selectedReport=session;
    const r=session.report;
    $('#closeReport').hidden=false;
    $('#closeReport').innerHTML=`<div class="report-title"><div><div class="eyebrow">FECHAMENTO CONCLUÍDO · ${day(session.businessDate)}</div><h3>UM DIA DE BOM TRABALHO.</h3></div><button class="text-link" data-dismiss-report>Ocultar resumo ×</button></div><p>Fechado em ${date(session.closedAt)}. Valores simulados, sem confirmação de pagamento.</p><div class="shift-metrics"><div><small>FATURAMENTO BRUTO DO DIA</small><strong>${money(r.dayTotal)}</strong></div><div><small>FATURAMENTO DESTE TURNO</small><strong>${money(r.total)}</strong></div><div><small>PEDIDOS ENTREGUES NO TURNO</small><strong>${r.count}</strong></div><div><small>TICKET MÉDIO DO TURNO</small><strong>${money(r.average)}</strong></div></div><div class="report-items">${r.items.length?r.items.map(i=>`<div><span>${i.qty}× ${esc(i.name)}</span><strong>${money(i.total)}</strong></div>`).join(''):'Nenhuma venda registrada neste turno.'}</div><p class="demo-note">Faturamento não é lucro: custos, taxas, descontos e despesas não são calculados nesta demonstração. O total do dia soma os turnos da mesma data comercial até este fechamento.</p>`;
  }
  function render(){
    try {
      const state=store.snapshot();const session=state.sessions.find(s=>s.id===state.activeSessionId);
      const report=store.summary();
      $('#shiftToolbar').innerHTML=`<div><span class="shift-indicator ${session?'is-open':''}"></span><b>${session?'LOJA ABERTA PARA PEDIDOS':'LOJA FECHADA NO PAINEL'}</b><small>Dia comercial: ${day(report.session.businessDate)} · vira às 06h de Brasília</small></div>${session?'<button class="btn close-store" id="closeStore">Fechar loja ↗</button>':'<button class="btn gold" id="openStore">Abrir novo turno ↗</button>'}`;
      $('#shiftMetrics').innerHTML=`<div><small>FATURAMENTO DO TURNO</small><strong>${money(report.total)}</strong></div><div><small>PEDIDOS ENTREGUES</small><strong>${report.count}</strong></div><div><small>PEDIDOS PENDENTES</small><strong>${report.pending}</strong></div><div><small>FATURAMENTO DO DIA</small><strong>${money(report.dayTotal)}</strong></div>`;
      $('#kitchenBoard').innerHTML=['Novo','Em preparo','Pronto'].map(status=>{
        const list=state.orders.filter(o=>o.sessionId===session?.id&&o.status===status).reverse();
        return `<section class="kitchen-column"><h3>${status==='Novo'?'● NOVOS':status==='Em preparo'?'◷ EM PREPARO':'✓ PRONTOS'} <span>${list.length}</span></h3>${list.length?list.map(o=>`<article class="ticket"><div class="ticket-head"><strong>#${esc(o.number)}</strong><time>${date(o.createdAt)}</time></div><p class="ticket-customer">${esc(o.customer)} · ${esc(o.service)}</p><ul>${o.items.map(i=>`<li><b>${i.qty}×</b> ${esc(i.name)}</li>`).join('')}</ul>${o.notes?`<p class="ticket-notes">Obs.: ${esc(o.notes)}</p>`:''}<p class="ticket-total">${money(o.total)}</p>${status==='Pronto'?`<p class="ticket-customer">✓ Aguardando retirada</p><button class="btn gold" data-deliver="${esc(o.id)}">Pedido retirado · remover ✓</button>`:`<button class="btn gold" data-advance="${esc(o.id)}">${status==='Novo'?'Iniciar preparo →':'Marcar como pronto ✓'}</button>`}</article>`).join(''):'<p class="no-tickets">Nenhum pedido por aqui.</p>'}</section>`;
      }).join('');
      const closed=state.sessions.filter(s=>s.closedAt&&s.report).reverse();
      $('#closureHistory').innerHTML=closed.length?closed.map(s=>`<button class="history-row" data-report="${esc(s.id)}"><span>${day(s.businessDate)}<small>Fechado em ${date(s.closedAt)}</small></span><span>${s.report.count} ${s.report.count===1?'pedido':'pedidos'}</span><strong>${money(s.report.total)}</strong><b>Ver resumo ↗</b></button>`).join(''):'<p class="no-tickets">O primeiro fechamento aparecerá aqui.</p>';
      if(!session){$('#closePanel').hidden=true;closing=false;}
    }catch(error){notice(error.message);}
  }
  root.addEventListener('click',e=>{
    try {
      const advance=e.target.closest('[data-advance]'),deliver=e.target.closest('[data-deliver]'),history=e.target.closest('[data-report]');
      if(advance){const order=store.advance(advance.dataset.advance);notice(`Pedido #${order.number}: ${order.status.toLowerCase()}.`);}
      else if(deliver){const order=store.deliver(deliver.dataset.deliver);notice(`Pedido #${order.number} retirado e removido do painel. ${money(order.total)} preservados no faturamento.`);}
      else if(e.target.closest('#closeStore')){closing=true;$('#closePanel').hidden=false;$('#closeError').textContent='';$('#closePassword').value='';$('#closePassword').focus();}
      else if(e.target.closest('#cancelClose')){closing=false;$('#closePanel').hidden=true;$('#closeStore')?.focus();}
      else if(e.target.closest('#openStore')){store.openShift();$('#closeReport').hidden=true;notice('Novo turno aberto. A loja pode receber pedidos.');}
      else if(history){const session=store.snapshot().sessions.find(s=>s.id===history.dataset.report);renderReport(session);$('#closeReport').scrollIntoView({behavior:'smooth',block:'nearest'});}
      else if(e.target.closest('[data-dismiss-report]'))$('#closeReport').hidden=true;
    }catch(error){notice(error.message);}
  });
  $('#closeDayForm').addEventListener('submit',e=>{
    e.preventDefault();if(!closing)return;
    try {const session=store.closeDay($('#closePassword').value);$('#closePassword').value='';closing=false;renderReport(session);notice('Loja fechada. Resumo salvo no histórico.');$('#closeReport').scrollIntoView({behavior:'smooth',block:'nearest'});}
    catch(error){$('#closeError').textContent=error.message;}
  });
  window.addEventListener('angus:operations',render);
  window.addEventListener('storage',e=>{if(e.key===store.key){render();if(selectedReport){const saved=store.snapshot().sessions.find(s=>s.id===selectedReport.id);if(saved?.report)renderReport(saved);}}});
  window.AngusKitchen={render};render();
})();

