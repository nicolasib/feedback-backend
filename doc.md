# Sistema de Feedback – Backend (NestJS + Firebase)

*Versão 0.1 – 31 mai 2025*

---

## 1. Contexto & Objetivo

Criar um serviço backend que permita colaboradores da **UTUA** e **BeGrowth** trocarem feedbacks estruturados. O sistema:

1. Autentica usuários via **Google Sign‑In** aceitando apenas domínios `@utua.com.br` ou `@begrowth.com.br`.
2. No primeiro acesso o usuário define **cargo** e **senioridade**.
3. Usuários podem selecionar colegas para avaliar e responder perguntas específicas conforme a combinação *cargo/senioridade* de ambos.
4. Líderes de setor têm acesso a um dashboard com feedbacks recebidos por qualquer membro da sua equipe.

---

## 2. Pilha Tecnológica

| Camada     | Tecnologia                                          |
| ---------- | --------------------------------------------------- |
| Linguagem  | Node.js 20 LTS                                      |
| Framework  | NestJS 11 (TypeScript)                              |
| Auth & DB  | Firebase Auth (Google) • Firestore (NoSQL)          |
| Admin SDK  | `firebase-admin` dentro do NestJS                   |
| Hospedagem | Cloud Run (Nest) • Firebase Hosting (docs/admin UI) |
| CI/CD      | GitHub Actions → deploy GCP                         |
| Dev Local  | Firebase Emulators + `npm run start:dev`            |

---

## 3. Arquitetura de Alto Nível

```
   Front‑end SPA
        │  (Bearer ID‑Token)
        ▼
   NestJS API Gateway ──┐──────────→ Firestore
        │ AuthGuard     │            (users, feedbacks, questionSets)
        │               │
        │               └──→ Firebase Cloud Functions (triggers, e‑mails)
```

* **NestJS** expõe endpoints REST/GraphQL.
* **AuthGuard** valida o `ID‑Token` do Firebase e injeta `req.user`.
* **Firestore** armazena documentos; regras replicam a lógica de autorização.
* **Cloud Functions** tratam side‑effects (ex. notificação Slack quando novo feedback).

---

## 4. Modelos de Dados (Firestore)

### 4.1 `users`

```json
{
  "uid": "google‑uid",
  "email": "fulano@utua.com.br",
  "displayName": "Fulano de Tal",
  "photoURL": "https://...",
  "cargo": "Designer de Produto",      // obrigatório no 1º login
  "senioridade": "L3 – Architect",
  "sectorId": "design",
  "role": "user" | "manager",          // managers enxergam dashboard
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

### 4.2 `questionSets`

```json
{
  "id": "designer_L3→designLead_L4",
  "from": { "cargo": "Designer de Produto", "senioridade": "L3" },
  "to":   { "cargo": "Design Lead",        "senioridade": "L4" },
  "questions": [
    { "id": "clarity", "text": "O briefing entregue estava claro?", "type": "rating" },
    { "id": "ownership", "text": "Como avalia a autonomia do colega?", "type": "rating" },
    { "id": "comentario", "text": "Comentário livre", "type": "text" }
  ],
  "updatedAt": Timestamp
}
```

### 4.3 `feedbacks`

```json
{
  "id": "auto‑id",
  "fromUid": "uid‑A",
  "toUid": "uid‑B",
  "questionSetId": "designer_L3→designLead_L4",
  "answers": [
    { "questionId": "clarity", "value": 4 },
    { "questionId": "ownership", "value": 5 },
    { "questionId": "comentario", "value": "Excelente colaboração!" }
  ],
  "feedbackTag": String,
  "createdAt": Timestamp
}
```

### 4.4 Índices Sugeridos

```text
feedbacks: composite (toUid, createdAt desc)
feedbacks: composite (fromUid, createdAt desc)
questionSets: single field (id)
```

---

## 5. Módulos NestJS

| Módulo                 | Responsabilidade                                         |
| ---------------------- | -------------------------------------------------------- |
| **AuthModule**         | Google ID‑Token Guard, domínio permitido, refresh tokens |
| **UsersModule**        | CRUD usuário, onboarding (definir cargo/senioridade)     |
| **QuestionSetsModule** | CRUD para admins importar perguntas                      |
| **FeedbackModule**     | Criar/listar feedbacks, business rules                   |
| **DashboardModule**    | Endpoints agregados para managers                        |

> Todos os módulos compartilham `FirebaseAdminProvider` para acesso ao Firestore via Dependency Injection.

---

## 6. Endpoints REST (r00t = `/api/v1`)

### 6.1 Auth

| Verbo  | Rota           | Descrição                                                   |
| ------ | -------------- | ----------------------------------------------------------- |
| `POST` | `/auth/google` | Recebe `idToken` → retorna JWT assinado pela API (opcional) |

### 6.2 Users

\| `GET` `/users/me` | Perfil do usuário logado | | `PATCH` `/users/me` | Atualizar `cargo`/`senioridade` no onboarding | | `GET` `/users` | Listar colegas (visível para todos, campos limitados) |

### 6.3 Feedback

| Verbo/Rota             | Descrição                                          |
| ---------------------- | -------------------------------------------------- |
| `POST` `/feedbacks`    | Envia respostas (body contém `toUid`, `answers[]`) |
| `GET` `/feedbacks`     | Query params: `fromUid` / `toUid` / paginação      |
| `GET` `/feedbacks/:id` | Detalhe                                            |

### 6.4 Dashboard (manager‑only)

\| `GET` `/dashboards/sector/:sectorId` | Lista feedbacks por membro | | `GET` `/dashboards/user/:uid` | Feedbacks recebidos por um usuário |

---

## 7. Regras de Segurança Firestore (esboço)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {

    // Users
    match /users/{uid} {
      allow read: if request.auth != null;
      allow update: if request.auth.uid == uid;
    }

    // QuestionSets (somente admins)
    match /questionSets/{id} {
      allow read: if true;
      allow write: if request.auth.token.role == 'admin';
    }

    // Feedbacks
    match /feedbacks/{fid} {
      allow create: if request.auth.uid == request.resource.data.fromUid;
      allow read: if request.auth.uid in [resource.data.fromUid, resource.data.toUid] ||
                  request.auth.token.role == 'manager';
    }
  }
}
```

---

## 8. Fluxos Principais

### 8.1 Onboarding

1. Front envia `idToken`.
2. AuthGuard valida domínio (`@utua.com.br` / `@begrowth.com.br`).
3. Caso seja primeiro login (sem documento `users/{uid}`), API devolve flag `needsProfile=true`.
4. Front solicita `cargo` + `senioridade` → `PATCH /users/me`.

### 8.2 Envio de Feedback

1. Front chama `GET /users` para montar select.
2. Selecionado colega → frontend obtém `cargo/senioridade` de ambos e chama `GET /questionSets?from=...&to=...`.
3. Usuário responde perguntas → `POST /feedbacks`.

### 8.3 Dashboard Manager

1. Manager faz `GET /dashboards/sector/:sectorId`.
2. API agrega feedbacks por membro (`GROUP BY toUid`).
3. Resposta é enviada já pronta para exibidores de gráficos (ex: média por pergunta).

---

---

## 09. Convenções & Ambiente

* **Lint/Format:** ESLint + Prettier (airbnb‑base).
* **Commits:** Conventional Commits (obrigatório).
* **Branching:** GitFlow simplificado (`main`, `dev`, feature branches).
* **Env Vars:** carregadas via `@nestjs/config` (ex.: `GOOGLE_CLIENT_ID`, `FIREBASE_PROJECT_ID`).

---
