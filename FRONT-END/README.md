# 🫧 PetClean · Banho e Tosa

Interface web (front end) do sistema de pet shop **PetClean**, feita com HTML, CSS e JavaScript puros, sem frameworks e sem instalação.

O back end original foi feito em Python (terminal). Aqui as mesmas regras de negócio foram portadas para JavaScript.

## Funcionalidades

- **Cadastro de pet:** nome, espécie, porte e tutor (não permite nomes repetidos).
- **Serviços:** banho, tosa e hidratação, com preço por porte (objeto aninhado `PRECOS[servico][porte]`).
- **Combo banho + tosa:** 15% de desconto.
- **Programa de fidelidade:** a cada 10 banhos pagos, o próximo é grátis (contador por pet, mostrado em bolhas).
- **Resumo ao vivo** do valor enquanto os serviços são marcados e **recibo** ao registrar.
- **Histórico** de atendimentos com faturamento total.
- Os dados ficam salvos no navegador (`localStorage`).

## Como executar

Basta abrir o arquivo `index.html` no navegador (duplo clique). Não precisa de servidor.

## Estrutura

```
petclean/
├── index.html      # estrutura das telas
├── css/
│   └── style.css   # estilos
├── js/
│   └── app.js      # regras de negócio e interação
└── README.md
```

## Regras de negócio (em `js/app.js`)

| Regra | Onde |
|-------|------|
| Tabela de preços | constante `PRECOS` |
| Desconto do combo (15%) | `DESCONTO_COMBO` e `calcularAtendimento()` |
| Banho grátis a cada 10 | `BANHOS_PARA_GRATIS` e `calcularAtendimento()` |
| Combo não é aplicado se o banho for grátis | `calcularAtendimento()` |



## Equipe

- Front end: Mariele Barboza 
- Back end: Hugo
