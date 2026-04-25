# Software_de_Asistencia_para_Aprendices# Arquitectura Full-Stack: Next.js + PostgreSQL + TypeScript

Documento de referencia para una arquitectura cliente-servidor moderna con backend en capas (Controller / Service / Repository) y frontend organizado por *features*.

---

## 1. Stack Tecnológico

### Lenguaje
- **TypeScript** (estricto, `strict: true` en `tsconfig.json`) — tipado estático en frontend y backend, contratos compartidos vía DTOs/tipos.

### Frontend
- **Next.js 14+** con **App Router** (`/app`).
- **React 18** (Server Components + Client Components).
- **TailwindCSS** para estilos utilitarios.
- **Axios** para hacer el consumo de las Apis.

### Backend
- **Next.js Route Handlers** (`app/api/**/route.ts`) como punto de entrada HTTP.
- **Node.js** runtime (no edge, para compatibilidad con Prisma).
- **Zod** para validación de entradas y parsing de DTOs.
- **bcrypt** para hashing de contraseñas.
- **jsonwebtoken (JWT)** para autenticación.

### Base de datos y ORM
- **PostgreSQL 15+** como sistema de gestión relacional.
- **Prisma ORM** como capa de acceso a datos (recomendado).



## 2. Arquitectura Cliente-Servidor

```
┌───────────────────────┐         HTTPS / JSON         ┌────────────────────────┐
│      CLIENTE (UI)     │  ───────────────────────►    │  SERVIDOR (Next.js)    │
│  Next.js Client +     │                              │   Route Handlers       │
│  Server Components    │  ◄─────────────────────────  │   (API REST en /api)   │
└───────────────────────┘        Respuesta JSON        └───────────┬────────────┘
                                                                   │
                                                                   ▼
                                                        ┌────────────────────────┐
                                                        │ Capa de Aplicación     │
                                                        │ Controller → Service   │
                                                        │     → Repository       │
                                                        └───────────┬────────────┘
                                                                    │ Prisma Client
                                                                    ▼
                                                        ┌────────────────────────┐
                                                        │     PostgreSQL         │
                                                        └────────────────────────┘
```


---

## 3. Arquitectura del Backend en Capas

El backend sigue una arquitectura **en capas** que separa responsabilidades y permite intercambiar implementaciones.

### 3.1 Capas

| Capa | Responsabilidad | Conoce a |
|------|-----------------|----------|
| **Controller (DTOs)** | Recibe la petición HTTP, valida entrada (Zod), delega al Service, formatea la respuesta y maneja errores. NO contiene lógica de negocio. | Service |
| **Service** | Orquesta la lógica de negocio, aplica reglas, coordina llamadas a uno o varios Repositories y servicios externos. NO conoce HTTP ni la base de datos. | Repository, otros Services |
| **Repository (Schemas)** | Único punto de acceso a la base de datos. Encapsula consultas Prisma, transacciones y mapeo entidad ↔ modelo. | Prisma Client |




## 4. ORM: Prisma

**Prisma** es un ORM type-safe para Node.js/TypeScript que se integra de forma natural con PostgreSQL y Next.js.

### Componentes
- **`schema.prisma`**: define modelos, relaciones, enums e índices. Es la fuente única de verdad del esquema.
- **Prisma Migrate**: genera y aplica migraciones SQL versionadas (`prisma migrate dev`, `prisma migrate deploy`).
- **Prisma Client**: cliente generado automáticamente con tipos TS exactos para cada modelo. Se importa donde se necesite acceso a datos (en la capa Repository).
- **Prisma Studio**: GUI para inspeccionar y editar datos en desarrollo.

### Ventajas
- Tipado fuerte end-to-end: los tipos del modelo se infieren automáticamente.
- Migraciones declarativas y reproducibles.
- Soporte para transacciones, relaciones, queries crudas (`$queryRaw`) y agregaciones.
- Buen ecosistema y documentación.

### Buenas prácticas
- Instanciar **una sola** instancia de `PrismaClient` (singleton) para evitar agotar conexiones en hot-reload de Next.js.
- Mantener todas las llamadas a Prisma encapsuladas en la capa **Repository**: ninguna otra capa debe importar `PrismaClient`.
- Usar `select` y `include` explícitos en lugar de devolver todos los campos.
- Manejar transacciones con `prisma.$transaction([...])` cuando una operación involucre múltiples escrituras.

---
# 5. Arquitectura del Frontend

En el frontend se utiliza una **arquitectura modular por features** (también conocida como *feature-based* o *feature-sliced*) sobre **Next.js con App Router** y **TypeScript**.

---

## En qué consiste

El código se organiza por **dominio funcional** (auth, products, orders, etc.) en lugar de por tipo técnico (todos los componentes juntos, todos los hooks juntos, etc.). Cada feature es una "mini-aplicación" autocontenida con todo lo que necesita para funcionar.

```
src/features/products/
├── components/   → UI específica de la feature
├── hooks/        → lógica de React (useProducts, useProductMutations...)
├── api/          → cliente HTTP que habla con el backend
├── schemas/      → validación Zod
├── types/        → tipos TypeScript
└── store/        → estado local (Zustand) si la feature lo necesita
```

---

## Principios que aplica

### 1. Alta cohesión, bajo acoplamiento
Lo que cambia junto vive junto. Si necesitas modificar la feature *products*, todo lo que vas a editar está en la misma carpeta. No tienes que saltar entre `components/`, `hooks/`, `services/` y `types/` repartidos por todo el proyecto.

### 2. Separación entre rutas y features
La carpeta `app/` solo contiene **rutas y composición de páginas**; la lógica real vive en `src/features/`. Las páginas de Next.js (`page.tsx`) simplemente importan y componen los componentes y hooks de las features. Esto evita que la capa de rutas se infle de lógica.

### 3. Capa `shared/`
Lo verdaderamente transversal vive en `src/shared/` para evitar duplicación:
- UI genérica (Button, Modal, Input, Card…)
- Cliente HTTP base (axios/fetch envuelto)
- Hooks utilitarios (useDebounce, useMediaQuery…)
- Helpers, formateadores, constantes
- Configuración de TanStack Query

### 4. Comunicación con el backend desacoplada
Cada feature tiene su propia carpeta `api/` que es la **única** que conoce los endpoints REST de su dominio. Si cambia el backend (URL, contrato), solo se toca ese archivo: los componentes y hooks no se enteran.

### 5. División entre Server y Client Components
Next.js 14 permite que las páginas y layouts en `app/` sean **Server Components** por defecto, ideales para data fetching inicial y SEO. Los componentes interactivos dentro de `features/` se marcan con `"use client"` solo cuando necesitan estado o efectos del navegador.

---



## 6. Estructura de Carpetas

Se propone un **monorepo simple** dentro de un proyecto Next.js, con carpetas separadas para frontend (`features/`) y backend (`server/`). El App Router de Next.js (`app/`) actúa como capa de entrada (vistas + route handlers).

```
my-app/
├── app/                              # App Router (Next.js)
│   ├── (public)/                     # Rutas públicas agrupadas
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/                  # Rutas privadas agrupadas
│   │   ├── layout.tsx
│   │   ├── products/page.tsx
│   │   └── orders/page.tsx
│   ├── api/                          # ←—— Capa Controller (HTTP)
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   └── register/route.ts
│   │   ├── products/
│   │   │   ├── route.ts              # GET /api/products, POST /api/products
│   │   │   └── [id]/route.ts         # GET/PUT/DELETE /api/products/:id
│   │   └── orders/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── src/
│   ├── features/                     # ←—— FRONTEND por features
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useLogin.ts
│   │   │   │   └── useSession.ts
│   │   │   ├── api/
│   │   │   │   └── auth.api.ts       # llamadas HTTP al backend
│   │   │   ├── schemas/
│   │   │   │   └── auth.schema.ts    # Zod schemas compartidos
│   │   │   ├── types/
│   │   │   │   └── auth.types.ts
│   │   │   └── store/
│   │   │       └── auth.store.ts     # Zustand
│   │   ├── products/
│   │   │   ├── components/
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   ├── ProductList.tsx
│   │   │   │   └── ProductForm.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useProducts.ts
│   │   │   │   └── useProductMutations.ts
│   │   │   ├── api/
│   │   │   │   └── products.api.ts
│   │   │   ├── schemas/
│   │   │   │   └── product.schema.ts
│   │   │   └── types/
│   │   │       └── product.types.ts
│   │   └── orders/
│   │       └── ... (misma estructura)
│   │
│   ├── shared/                       # Código compartido entre features
│   │   ├── components/               # Botones, Inputs, Modals genéricos
│   │   │   └── ui/
│   │   ├── hooks/                    # useDebounce, useMediaQuery...
│   │   ├── lib/
│   │   │   ├── http.ts               # cliente fetch/axios
│   │   │   └── query-client.ts       # config TanStack Query
│   │   ├── utils/                    # formatters, helpers
│   │   ├── constants/
│   │   └── types/                    # tipos globales
│   │
│   └── server/                       # ←—— BACKEND en capas
│       ├── modules/                  # un módulo por agregado/dominio
│       │   ├── auth/
│       │   │   ├── auth.controller.ts
│       │   │   ├── auth.service.ts
│       │   │   ├── auth.repository.ts
│       │   │   ├── auth.dto.ts       # Zod schemas + tipos
│       │   │   └── auth.types.ts
│       │   ├── products/
│       │   │   ├── product.controller.ts
│       │   │   ├── product.service.ts
│       │   │   ├── product.repository.ts
│       │   │   ├── product.dto.ts
│       │   │   └── product.types.ts
│       │   └── orders/
│       │       └── ...
│       │
│       ├── common/                   # utilidades transversales del backend
│       │   ├── errors/
│       │   │   ├── AppError.ts
│       │   │   ├── NotFoundError.ts
│       │   │   └── ValidationError.ts
│       │   ├── middlewares/
│       │   │   ├── withAuth.ts
│       │   │   └── withErrorHandler.ts
│       │   ├── validators/
│       │   │   └── validate.ts       # helper para parsear con Zod
│       │   └── http/
│       │       └── response.ts       # ok(), created(), error()...
│       │
│       ├── config/
│       │   ├── env.ts                # validación de env con Zod
│       │   └── logger.ts
│       │
│       └── db/
│           └── prisma.ts             # singleton de PrismaClient
│
├── prisma/
│   ├── schema.prisma                 # modelos y datasource
│   ├── migrations/                   # migraciones generadas
│   └── seed.ts                       # datos iniciales
│
├── public/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── .env
├── .env.example
├── docker-compose.yml
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```




