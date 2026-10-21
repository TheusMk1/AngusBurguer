# AngusBurguer

Aplicação estática em HTML, CSS e JavaScript. Na pasta do projeto, execute `node serve.cjs` (ou `npm start`, se tiver npm).

Cliente: http://127.0.0.1:4173/cardapio/ — cardápio, pedidos e reservas de mesas.

Administração: http://127.0.0.1:4173/admin/ — senha demonstrativa `1234`.

Leia [GUIA-PUBLICACAO.md](GUIA-PUBLICACAO.md) para publicar o portfólio e planejar banco de dados, autenticação e uso comercial.

## Conteúdo
- `dist/index.html`: redirecionamento para `/cardapio/`.
- `dist/cardapio/index.html`: página exclusiva do cliente, sem painel ou atalhos administrativos.
- `dist/styles.css`: identidade visual e responsividade.
- `dist/app.js`: cardápio, carrinho e reservas do cliente.
- `dist/admin/`: página administrativa separada, com entrada demonstrativa.
- `dist/order-store.js`: pedidos e turnos em armazenamento local, compartilhados pelo cliente e admin.
- `dist/kitchen.js`: quadro de pedidos, retirada, faturamento e fechamento com histórico.
- `dist/config.js`: contatos, localização e horários.

O carrinho e os tickets são armazenados no navegador com localStorage. O painel de cozinha sincroniza entre abas da mesma origem. Não há pagamento, backend ou envio de pedidos a uma cozinha real.

Em **Prontos**, use **Pedido retirado · remover**. O ticket sai do quadro, mas a venda continua registrada. **Fechar loja** exige a senha `1234` e não permite pedidos pendentes. O fechamento salva o faturamento bruto, pedidos entregues, ticket médio e produtos vendidos. Depois use **Abrir novo turno**. A data comercial vira às 06h de Brasília. Pedidos confirmados pelo cliente são bloqueados enquanto o turno estiver fechado.

O faturamento demonstrativo considera pedidos entregues, sem comprovação de pagamento. Não representa lucro. Login e senha do fechamento são simulações públicas, não segurança real. Use somente dados fictícios.

Verificação: `node --test tests/*.test.cjs`. Com npm instalado, também estão disponíveis `npm run check` e `npm test`.

## Publicar na Vercel

Envie o conteúdo desta pasta ao GitHub, importe o repositório na Vercel e use framework **Other**, comando de build vazio e saída **dist**. Mantenha `vercel.json` na raiz do projeto. Não há variáveis de ambiente ou instalação de dependências para a demonstração estática.

O endereço inicial redireciona para `/cardapio/`. Para entrar no admin, substitua `cardapio` por `admin` na barra de endereço. A página do cliente não oferece botões, links ou modais de administração. No admin, a equipe pode abrir o cardápio em outra aba pelo link **Ver site do cliente**.

O WhatsApp fornecido é fictício. Reservas preparam uma mensagem e exigem ação do visitante para abrir o WhatsApp; a confirmação deve ser feita pelo estabelecimento. Substitua o número antes de usar comercialmente.

Endereço informado sem município: a localização abre uma busca no Maps. Configure `mapsUrl` com o local exato. Perfis sociais devem ser configurados; inicialmente abrem a página principal de cada plataforma.

Fotografias, depoimentos, notas e comodidades são ilustrativos. Substitua por materiais e avaliações verificadas antes do uso comercial. Preços e produtos compõem o cardápio demonstrativo. Horários: terça a sábado das 18h às 00h; domingo das 18h às 22h30; segunda fechado. Status calculado no fuso America/Sao_Paulo.

Fontes via Google Fonts, fotografias via Unsplash, Tailwind via CDN. O CSS autoral mantém a estrutura visual sem depender do Tailwind.
