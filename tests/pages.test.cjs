const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'../dist');
const read=relative=>fs.readFileSync(path.join(root,relative),'utf8');
test('cliente contém pedidos e reservas, sem painel ou atalhos administrativos',()=>{
  const html=read('cardapio/index.html'),script=read('app.js');
  assert.match(html,/id="checkoutForm"/);assert.match(html,/id="reservationForm"/);
  assert.doesNotMatch(html,/kitchenApp|kitchenDialog|kitchenOpen|showKitchenDemo|kitchen\.js|href="[^"]*admin|1234/);
  assert.doesNotMatch(script,/AngusKitchen|kitchenOpen|showKitchenDemo|kitchenDialog/);
  assert.match(html,/Continuar no cardápio/);
});
test('admin mantém login e quadro da cozinha e aponta ao cardápio correto',()=>{
  const html=read('admin/index.html');
  assert.match(html,/id="adminLoginForm"/);assert.match(html,/id="kitchenApp"/);
  assert.match(html,/href="\/cardapio\/"/);assert.match(html,/src="\/kitchen.js"/);
});
test('todos os arquivos locais das duas páginas existem e independem da barra final',()=>{
  for(const page of ['cardapio/index.html','admin/index.html']){
    for(const match of read(page).matchAll(/(?:src|href)="([^"#]+)"/g)){
      const url=match[1];if(/^(https?:|mailto:|tel:)/.test(url))continue;
      assert.ok(url.startsWith('/'),`${page}: caminho relativo inesperado ${url}`);
      const resolved=path.join(root,url);assert.ok(fs.existsSync(resolved),`${page}: arquivo ausente ${url}`);
    }
  }
});
test('Vercel publica dist e redireciona a entrada ao cardápio',()=>{
  const config=JSON.parse(fs.readFileSync(path.join(__dirname,'../vercel.json'),'utf8'));
  assert.equal(config.outputDirectory,'dist');
  assert.ok(config.redirects.some(r=>r.source==='/'&&r.destination==='/cardapio/'));
  assert.match(read('index.html'),/\/cardapio\//);
  assert.ok(!config.rewrites?.some(r=>r.source==='/(.*)'), 'Não deve misturar as páginas por uma reescrita genérica');
});
