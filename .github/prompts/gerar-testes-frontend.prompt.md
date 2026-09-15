---
description: Gera testes para um módulo ou componente do frontend React.
name: gerar-testes-frontend
argument-hint: caminho do modulo (ex. frontend/src/components/DocumentList.jsx)
agent: agent
---

# Gerar testes do frontend

Gere testes automatizados para o módulo `${input:modulo:caminho do modulo}` do frontend React, respeitando a estrutura e as convenções do projeto.

Requisitos:

- Cubra os casos principais de sucesso, carregamento e erro.
- Para componentes, teste o comportamento observável e as interações do usuário, evitando testar detalhes internos de implementação.
- Para serviços, teste as chamadas `fetch`, os dados enviados, as respostas bem-sucedidas e os erros HTTP.
- Mantenha os testes isolados, determinísticos e legíveis.
- Não dependa de um backend, rede ou serviços externos em execução; use mocks ou stubs locais quando necessário.
- Coloque os testes em `frontend/src` ou em uma pasta de testes do frontend, seguindo a organização já existente.
- Antes de implementar, verifique se o runner e as bibliotecas de teste já estão disponíveis em `frontend/package.json`. Se não estiverem, informe as dependências necessárias e não invente APIs de uma ferramenta não instalada.
- Preserve o uso de JavaScript, React Hooks e componentes funcionais.
