(function(){
  'use strict';
  const $=selector=>document.querySelector(selector);
  function show(logged){$('#adminLogin').hidden=logged;$('#adminDashboard').hidden=!logged;$('#logout').hidden=!logged;if(logged)window.AngusKitchen.render();}
  // Apenas experiência visual de portfólio. Não substitui autenticação de servidor.
  $('#adminLoginForm').addEventListener('submit',e=>{e.preventDefault();if($('#adminPassword').value!=='1234'){$('#adminLoginError').textContent='Senha incorreta. Nesta demonstração, use 1234.';return;}$('#adminPassword').value='';$('#adminLoginError').textContent='';show(true);$('#adminDashboard').setAttribute('tabindex','-1');$('#adminDashboard').focus();});
  $('#logout').addEventListener('click',()=>{show(false);$('#adminPassword').focus();});show(false);
})();
