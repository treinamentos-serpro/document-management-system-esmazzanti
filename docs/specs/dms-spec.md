# Especificação - Document Management System

> Especificação funcional e técnica para orientar a implementação incremental
> do Document Management System (DMS). Esta etapa define contratos e decisões;
> não implementa arquivos de back-end ou front-end.

## 1. Objetivo

Entregar uma aplicação web que permita a usuários identificados enviar,
listar e baixar seus documentos, mantendo os arquivos no filesystem local e os
metadados em memória durante esta fase inicial.

## 2. Escopo

### Dentro do escopo

- Receber um documento por upload usando `multipart/form-data`.
- Validar a presença do arquivo, o tamanho máximo configurado e o tipo MIME
  conforme a política configurada.
- Identificar o usuário por meio do header `X-User-Id`.
- Listar somente os documentos associados ao usuário informado.
- Baixar um documento pelo identificador, desde que ele pertença ao usuário
  informado.
- Persistir o conteúdo do arquivo em `backend/storage` usando `multer` com
  `diskStorage`.
- Manter os metadados dos documentos em memória nesta fase.
- Disponibilizar o endpoint `GET /health` para verificação da aplicação.
- Fornecer uma interface React para as operações de upload, listagem e
  download, consumindo a API por meio do prefixo `/api`.

### Fora do escopo

- Autenticação, autorização baseada em sessão, tokens ou integração com um
  provedor de identidade. O `X-User-Id` é apenas uma identificação declarada
  pelo cliente nesta fase.
- Banco de dados ou qualquer persistência dos metadados fora da memória do
  processo.
- Armazenamento externo, cloud, S3, serviços de terceiros ou filesystem
  compartilhado.
- Versionamento, exclusão, restauração, expiração ou histórico de documentos.
- Busca textual, filtros avançados, paginação e ordenação configuráveis.
- Compartilhamento de documentos entre usuários.
- Conversão, pré-visualização, antivírus ou processamento do conteúdo.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar um arquivo no campo `file` de uma requisição `multipart/form-data` para `POST /upload`. |
| RF-02 | O sistema deve exigir um `X-User-Id` não vazio nas operações de negócio e associar o documento ao valor informado. |
| RF-03 | O sistema deve rejeitar upload sem arquivo com erro `400` e sem criar metadados ou arquivo persistido. |
| RF-04 | O sistema deve rejeitar arquivos que excedam o limite configurado ou não atendam à política MIME configurada, usando erro `413` para excesso de tamanho e `400` para tipo inválido. |
| RF-05 | Após um upload válido, o sistema deve gravar o conteúdo em `backend/storage`, criar metadados em memória e retornar o documento criado com status `201`. |
| RF-06 | O sistema deve gerar um identificador único e opaco para cada documento, independente do nome original do arquivo. |
| RF-07 | `GET /documents` deve retornar somente os metadados dos documentos cujo `owner` corresponda ao `X-User-Id` da requisição. |
| RF-08 | A resposta de listagem não deve expor o nome físico, o caminho absoluto ou qualquer detalhe interno do filesystem. |
| RF-09 | `GET /documents/:id/download` deve localizar o documento pelo identificador e permitir o download somente ao usuário proprietário. |
| RF-10 | O download deve preservar o nome original como nome sugerido para o cliente, sem usar o nome original como caminho físico. |
| RF-11 | O sistema deve retornar `404` quando o documento não existir, não pertencer ao usuário informado ou não puder ser localizado no storage. |
| RF-12 | Falhas inesperadas devem retornar um erro JSON uniforme, sem stack trace, caminho local ou informações sensíveis. |
| RF-13 | `GET /health` deve continuar retornando `200` e `{ "status": "ok" }`. |

### Critérios de aceitação

- Dado um usuário válido e um arquivo dentro das políticas, o upload retorna
  `201`, um `id` e os metadados esperados; o conteúdo pode ser encontrado no
  storage local.
- Dado um upload sem `file`, com usuário ausente ou com arquivo acima do
  limite, nenhuma entrada parcial permanece no repositório de metadados.
- Dado um usuário, a listagem não contém documentos de outro usuário.
- Dado o proprietário e um `id` válido, o download retorna o conteúdo original
  e o nome original em `Content-Disposition`.
- Dado um `id` de outro usuário, inexistente ou sem arquivo físico, o download
  retorna `404` sem revelar se há um documento pertencente a outro usuário.
- Após reiniciar o processo, os arquivos podem continuar no filesystem, mas os
  metadados em memória não são recuperados; essa limitação é aceita nesta
  versão.

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O back-end deve usar Node.js e Express em CommonJS, preservando a organização existente do projeto. |
| RNF-02 | O back-end deve seguir Clean Architecture simples, com dependência no sentido `routes -> controllers -> services -> repositories`. |
| RNF-03 | O upload deve usar `multer` configurado com `diskStorage`; não são permitidos provedores externos de armazenamento. |
| RNF-04 | Os arquivos devem ser gravados em `backend/storage`, com nomes físicos seguros e não controlados diretamente pelo usuário. |
| RNF-05 | Os metadados devem permanecer em memória nesta fase e a perda após reinício deve ser documentada e coberta por teste. |
| RNF-06 | Limite de tamanho, porta, diretório de storage e política de MIME devem ser configuráveis por variáveis de ambiente, com defaults documentados. |
| RNF-07 | O sistema não deve permitir traversal de caminho; nomes originais devem ser tratados como metadados e nunca concatenados a caminhos físicos. |
| RNF-08 | As respostas de erro da API devem usar JSON com estrutura previsível e mensagens adequadas para o usuário, sem detalhes de implementação. |
| RNF-09 | O código deve manter funções pequenas, responsabilidades únicas, nomes descritivos em inglês e mensagens ao usuário em português. |
| RNF-10 | O back-end deve ser testado com o runner nativo `node:test`, incluindo testes de integração HTTP das rotas de negócio. |
| RNF-11 | O front-end deve usar React com componentes funcionais e Hooks, consumindo o back-end via `fetch` e o prefixo `/api`. |
| RNF-12 | A interface deve apresentar estados de carregamento, sucesso e erro sem bloquear a consulta ou o download de documentos já listados. |

## 5. Modelo de dados (metadados do documento)

Os metadados são armazenados em uma coleção em memória no processo do
back-end. Eles não devem conter o conteúdo binário nem caminhos absolutos.

| Campo | Tipo | Obrigatório | Regras e descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador opaco, único na execução do processo, preferencialmente UUID. Não deve ser derivado do nome do arquivo. |
| `originalName` | string | Sim | Nome enviado pelo cliente, preservado para exibição e download. Deve ser tratado como texto não confiável. |
| `storedName` | string | Sim, interno | Nome físico seguro gerado pelo sistema. Não deve ser retornado pela API pública. |
| `size` | number | Sim | Tamanho do arquivo em bytes, inteiro não negativo, obtido do arquivo recebido. |
| `mimeType` | string | Sim | Tipo MIME informado/detectado pelo upload e aceito pela política configurada. |
| `uploadedAt` | string | Sim | Data e hora de criação em ISO 8601, preferencialmente UTC. |
| `owner` | string | Sim | Valor validado do header `X-User-Id`; não vazio e limitado ao tamanho configurado. |

### Regras de consistência

- `id` e `storedName` devem ser únicos entre os documentos ativos na memória.
- O `owner` deve ser comparado exatamente, sem normalização que altere sua
  identidade.
- O objeto retornado publicamente contém `id`, `originalName`, `size`,
  `mimeType`, `uploadedAt` e `owner`; `storedName` é somente interno.
- O repositório deve remover metadados se a gravação ou o registro do arquivo
  falhar. Se o arquivo for gravado e o registro falhar, o serviço deve tentar
  removê-lo para evitar órfãos.

## 6. Contratos de API

### Convenções gerais

- A API de negócio é exposta pelo back-end nas rotas descritas abaixo. O
  front-end usa o prefixo `/api` por meio do proxy do Vite; portanto, no
  navegador as URLs serão `/api/upload`, `/api/documents` e
  `/api/documents/:id/download`.
- `X-User-Id` é obrigatório em todos os endpoints de negócio. Ausência ou
  valor vazio retorna `400`.
- Erros JSON seguem o formato:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

- Códigos previstos: `INVALID_REQUEST` (`400`), `FILE_TOO_LARGE` (`413`),
  `DOCUMENT_NOT_FOUND` (`404`) e `INTERNAL_ERROR` (`500`). O código é estável
  para o cliente; a mensagem é adequada para apresentação ao usuário.

### POST /upload

Recebe e registra um documento para o usuário informado.

**Headers**

- `X-User-Id: string` obrigatório.
- `Content-Type: multipart/form-data; boundary=...` obrigatório.

**Entrada**

- Campo multipart `file`, obrigatório, contendo um único arquivo.
- Não há campos de texto adicionais nesta versão.

**Resposta de sucesso: `201 Created`**

```json
{
  "id": "2f8b3f9a-7bb1-4dc1-9e45-7c75f4a8712a",
  "originalName": "contrato.pdf",
  "size": 24576,
  "mimeType": "application/pdf",
  "uploadedAt": "2026-09-15T12:00:00.000Z",
  "owner": "user-123"
}
```

**Erros**

- `400 INVALID_REQUEST`: usuário ausente, arquivo ausente, arquivo vazio ou
  MIME não permitido.
- `413 FILE_TOO_LARGE`: arquivo acima de `MAX_FILE_SIZE`.
- `500 INTERNAL_ERROR`: falha inesperada ao gravar ou registrar o arquivo.

### GET /documents

Lista os documentos do usuário informado. A ordem padrão deve ser a mais
recente primeiro, usando `uploadedAt` como critério.

**Headers**

- `X-User-Id: string` obrigatório.

**Resposta de sucesso: `200 OK`**

```json
{
  "documents": [
    {
      "id": "2f8b3f9a-7bb1-4dc1-9e45-7c75f4a8712a",
      "originalName": "contrato.pdf",
      "size": 24576,
      "mimeType": "application/pdf",
      "uploadedAt": "2026-09-15T12:00:00.000Z",
      "owner": "user-123"
    }
  ]
}
```

Uma conta sem documentos recebe `200` com `documents: []`.

**Erros**

- `400 INVALID_REQUEST`: usuário ausente ou vazio.
- `500 INTERNAL_ERROR`: falha inesperada ao consultar o repositório.

### GET /documents/:id/download

Baixa o conteúdo binário de um documento pertencente ao usuário informado.

**Headers**

- `X-User-Id: string` obrigatório.

**Parâmetros de rota**

- `id`: identificador do documento, tratado como valor opaco e validado antes
  da consulta ao repositório.

**Resposta de sucesso: `200 OK`**

- Corpo binário com o conteúdo original.
- `Content-Type` igual ao `mimeType` registrado, quando disponível.
- `Content-Length` igual a `size`, quando disponível.
- `Content-Disposition: attachment; filename="<nome-original-seguro>"`.

**Erros**

- `400 INVALID_REQUEST`: usuário ausente ou identificador inválido.
- `404 DOCUMENT_NOT_FOUND`: documento inexistente, de outro usuário ou sem
  arquivo físico correspondente.
- `500 INTERNAL_ERROR`: falha inesperada ao ler o arquivo.

### GET /health

Endpoint de verificação sem identificação de usuário.

**Resposta de sucesso: `200 OK`**

```json
{
  "status": "ok"
}
```

## 7. Decisões arquiteturais

### Camadas do back-end

- `routes/`: registra os caminhos HTTP e conecta middleware, controllers e
  tratamento de erros. Não contém regra de negócio.
- `controllers/`: lê headers, parâmetros, arquivos e configura a resposta
  HTTP. Deve delegar validações de negócio e operações ao service.
- `services/`: aplica regras de usuário, validação, autorização por
  propriedade, criação de metadados e coordenação entre storage e repositório.
- `repositories/`: encapsula a coleção em memória e as operações de arquivo
  local. Não conhece detalhes de HTTP ou React.

O sentido de dependência é `routes -> controllers -> services -> repositories`.
O controller não deve acessar diretamente o filesystem ou a coleção de
metadados.

### Armazenamento local

- `multer` deve usar `diskStorage` com destino `backend/storage`.
- O nome físico deve ser gerado pelo sistema, preferencialmente a partir de um
  identificador seguro, e nunca deve ser o nome original sem tratamento.
- A pasta deve existir ou ser criada durante a inicialização/configuração do
  repositório.
- Os arquivos permanecem no filesystem local; não usar adaptadores de nuvem ou
  APIs de terceiros.
- Metadados e arquivo devem ser tratados como uma operação coordenada: falha
  no registro deve disparar a tentativa de remoção do arquivo físico.

### Configuração

As configurações devem vir de variáveis de ambiente, com defaults definidos
na implementação e documentados, por exemplo:

| Variável | Finalidade | Default sugerido |
| --- | --- | --- |
| `PORT` | Porta HTTP do back-end | `3000` |
| `STORAGE_DIR` | Diretório local dos uploads | `backend/storage` |
| `MAX_FILE_SIZE` | Tamanho máximo em bytes | `10485760` (10 MiB) |
| `ALLOWED_MIME_TYPES` | Lista de MIME permitidos | Política mínima definida pelo produto |
| `MAX_USER_ID_LENGTH` | Tamanho máximo do identificador | `100` |

Os defaults são uma decisão de implementação e devem ser mantidos
consistentes entre back-end, testes e documentação.

### Front-end

O front-end usa React e Vite, com componentes funcionais organizados em
`components/`, `pages/` e `services/`. A camada de serviço encapsula `fetch`,
envia `X-User-Id`, interpreta respostas e converte erros da API em estados de
interface. O front-end não acessa o filesystem nem replica regras do service.

## 8. Plano de execução

As etapas abaixo descrevem a implementação futura. A entrega atual termina
com esta especificação e não executa nenhuma delas.

1. **Configuração e contratos**: definir variáveis de ambiente, defaults,
   estrutura de erros, validação de `X-User-Id` e interfaces internas. Conclusão:
   contratos revisados e configuração centralizada.
2. **Repositório de metadados**: criar a coleção em memória com operações de
   inserir, listar por owner e buscar por id/owner. Conclusão: testes unitários
   cobrem isolamento e unicidade.
3. **Storage local e Multer**: configurar `diskStorage`, criação de
   `backend/storage`, nome físico seguro, limite e política MIME. Conclusão:
   um arquivo válido é gravado localmente e entradas inválidas são rejeitadas.
4. **Serviço de documentos**: implementar upload coordenado, listagem e
   download, incluindo limpeza de arquivo órfão e autorização por owner.
   Conclusão: regras não dependem de Express e possuem testes unitários.
5. **Controllers e tratamento HTTP**: traduzir requisições, erros de domínio,
   status, headers e respostas para os contratos desta especificação.
   Conclusão: nenhum detalhe de storage vaza para a API pública.
6. **Rotas e integração do app**: registrar `/upload`, `/documents`,
   `/documents/:id/download` e preservar `/health`. Conclusão: o app exportado
   atende aos testes HTTP e mantém o smoke test existente.
7. **Testes de integração do back-end**: cobrir upload válido e inválido,
   usuário ausente, isolamento de listagem, download autorizado,
   documento inexistente, limite de tamanho, MIME e limpeza após falha.
   Conclusão: `npm test` passa sem depender de serviços externos.
8. **Serviços e componentes do front-end**: criar chamadas `fetch`, formulário
   de upload, lista, estados de erro/sucesso e ação de download. Conclusão: o
   fluxo principal funciona usando o proxy `/api`.
9. **Validação ponta a ponta**: executar build do front-end, testes do
   back-end e uma verificação manual dos headers e arquivos em storage.
   Conclusão: contratos, mensagens e estados da interface permanecem
   consistentes.
10. **Documentação e revisão**: atualizar instruções de execução, conferir
    variáveis de ambiente e revisar que não foram introduzidos banco de dados,
    armazenamento externo ou alterações fora do escopo.

### Cenários mínimos de teste

| Cenário | Resultado esperado |
| --- | --- |
| Upload válido com `X-User-Id` | `201`, metadados públicos e arquivo em `backend/storage`. |
| Upload sem arquivo | `400`, nenhum metadado e nenhum arquivo parcial. |
| Upload sem usuário | `400`, nenhuma gravação. |
| Upload acima do limite | `413`, nenhuma entrada válida criada. |
| Upload com MIME rejeitado | `400`, nenhuma entrada válida criada. |
| Listagem do proprietário | `200` somente com seus documentos. |
| Listagem de usuário sem documentos | `200` com lista vazia. |
| Download do proprietário | `200`, bytes originais e nome de download correto. |
| Download por outro usuário | `404`, sem exposição de existência. |
| Download de id inexistente | `404` com erro uniforme. |
| Reinício do processo | Metadados não são recuperados nesta fase; comportamento documentado. |
| Health check | `GET /health` continua retornando `200` e status `ok`. |