# Conteúdo do site

Tudo o que aparece no site vive nesta pasta. Editou, salvou, enviou para o GitHub: o site se atualiza sozinho.
O guia completo está no `README.md` da raiz; aqui vai o essencial.

```
conteudo/
  site.json            WhatsApp, Instagram, endereço, mapa, texto da página "Sobre"…
  categorias.json      as categorias (Cozinhas, Lojas…) e a ordem em que aparecem
  projetos/
    <nome-do-projeto>/ uma pasta por projeto (o nome da pasta vira o endereço da página)
      projeto.json     título, categoria, descrição, lista de fotos…
      foto.png         foto tratada (a que o site mostra)
      foto-original.jpg  foto original, sem tratamento (o visitante escolhe ver)
```

## Adicionar um projeto

```bash
npm run novo:projeto -- "Cozinha em U azul" cozinhas
```

Isso cria a pasta com um `projeto.json` pronto. Coloque as fotos dentro dela, liste-as em `"fotos"` e troque
`"publicado"` para `true`.

## Esconder / mostrar

- Esconder um projeto: `"publicado": false` no `projeto.json` (a pasta e as fotos ficam guardadas).
- Esconder uma categoria inteira: `"ativa": false` em `categorias.json`.
- Destacar na página inicial: `"destaque": true`.

Se algo estiver errado (foto que não existe, vírgula faltando…), o comando avisa em português, apontando o arquivo
e o campo, e o site não é gerado até corrigir.
