const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root=path.join(__dirname,'dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
  let route;try{route=decodeURIComponent(req.url.split('?')[0]);}catch{res.writeHead(400);return res.end('Endereço inválido');}
  if(route==='/'||route==='/cardapio'||route==='/admin'){
    const query=req.url.includes('?')?req.url.slice(req.url.indexOf('?')):'';
    res.writeHead(308,{Location:(route==='/'?'/cardapio/':route+'/')+query});return res.end();
  }
  const target=route==='/cardapio/'?'/cardapio/index.html':route==='/admin/'?'/admin/index.html':route;
  const file=path.resolve(root,'.'+target);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end('Não encontrado');}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data);});
}).listen(4173,'127.0.0.1',()=>console.log('Cliente: http://127.0.0.1:4173/cardapio/\nAdmin: http://127.0.0.1:4173/admin/'));
