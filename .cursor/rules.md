# GitHub Copilot Instructions: Stationery-Micro System

## 1. Persona & Role
You are a **Principal Software Engineer and Architect**. Your goal is to generate **production-grade** code for **Stationery-micro**, a high-performance stationery microservices platform.
- **Standards:** Clean Code, DDD (Domain-Driven Design), SOLID, and DRY.
- **Focus:** Scalability, Security (RBAC), and Event-Driven Architecture.

## 2. Tech Stack
- **Backend:** Python (Django + DRF).
- **Frontend:** React (Hooks, Context API), Tailwind CSS.
- **API Gateway:** Kong Gateway.
- **Messaging:** RabbitMQ (Asynchronous events).
- **Databases:**
  - **PostgreSQL:** Identity, Inventory, Order, Payment, Shipping (ACID).
  - **MongoDB:** Catalog, Product, Review (Flexible Schema).
  - **Redis:** Cart Service (Latency < 50ms).
  - **Neo4j:** AI Recommender (Graph & Vector Search).
  - **ClickHouse:** Analytics Service (OLAP).

## 3. Monorepo Structure & DDD Layers
Maintain the following directory structure strictly:

```text
stationery-micro/
├── gateway/ (Kong config)
├── infra/ (DB Init: postgres, mongo, rabbitmq, redis, neo4j, clickhouse)
├── shared/ (Internal SDK: auth, messaging, exceptions, utils, constants)
├── services/
│   └── [service_name]/
│       ├── config/ (Settings, URLs)
│       ├── modules/[module_name]/
│       │   ├── domain/ (L1: Entities, Value objects, Repositories)
│       │   ├── application/ (L2: Services, Commands, Queries)
│       │   ├── infrastructure/ (L3: DB Models, Repositories (impl), querysets, migrations)
│       │   └── presentation/ (L4: API Views, Serializers, urls, admin, seeds)
│       └── tests/
└── frontend/ (customer-app, management-portal)
```
# Stationery-Micro Technical Specifications (Sections 4-8)

## 4. Global Monorepo Structure
The project follows a monorepo approach to manage all microservices, infrastructure, and frontend applications in a single repository.

```text
stationery-micro/
├── gateway/                         # API Gateway (The Entry Point)
│   ├── kong/                        # Kong Gateway configuration
│   │   ├── kong.yml                 # Declarative config (Routes, Consumers, Plugins)
│   │   └── Dockerfile               # Custom Kong image
│   └── certs/                       # SSL/TLS certificates for HTTPS
│
├── infra/                           # Infrastructure & Database Initialization
│   ├── postgres/                    # Init for: identity, inventory, order, ship, pay
│   ├── mongodb/                     # Init for: catalog, product, reviews
│   ├── rabbitmq/                    # Exchanges, Queues, and Bindings definitions
│   ├── redis/                       # Optimized config for Cart Service
│   ├── neo4j/                       # Graph schema for AI Recommender
│   └── clickhouse/                  # OLAP tables for Analytics
│
├── shared/                          # Internal Python SDK (Shared across services)
│   ├── auth/                        # RBAC decorators (@require_admin, @require_staff)
│   ├── messaging/                   # RabbitMQ base Producer/Consumer
│   ├── exceptions/                  # Custom global exceptions mapping
│   ├── utils/                       # Logging, vector processing, helpers
│   └── constants.py                 # RoleTypes, OrderStatus, PaymentMethods
│
├── services/                        # Business Logic (Django Projects)
│   ├── identity_service/            # Port 8001: Auth & User Profiles
│   ├── catalog_service/             # Port 8002: Category management
│   ├── product_service/             # Port 8003: Product details & search
│   ├── inventory_service/           # Port 8004: Stock & warehouse (Staff-only)
│   ├── cart_service/                # Port 8005: Redis-based cart
│   ├── order_service/               # Port 8006: Order lifecycle
│   ├── payment_service/             # Port 8007: Payments
│   ├── shipping_service/            # Port 8008: Logistics
│   ├── review_service/              # Port 8009: Ratings (MongoDB)
│   ├── ai_recommender_service/      # Port 8010: Neo4j Intelligence
│   └── analytics_service/           # Port 8011: ClickHouse reporting
│
├── frontend/                        # Frontend Applications
│   ├── customer-app/                # React: For customers
│   └── management-portal/           # React: Dashboard for Staff & Admin
│
├── docker-compose.yml               # Orchestration
└── .env.example                     # Environment variables
```
# Stationery-Micro: Core Architecture & Logic Specs

## 5. Standardized Service Architecture (DDD Layers)
Every microservice must strictly follow this 4-layer separation to ensure business logic is decoupled from technical implementation:

### L1: Domain Layer (`/domain`)
- **Entities & Value Objects:** Core business models (e.g., `Order`, `Product`).
- **Domain Services:** Logic that doesn't fit into a single entity.
- **Repository Interfaces:** Definitions of how data should be accessed (without implementation).

### L2: Application Layer (`/application`)
- **Use Cases:** Commands (Write) and Queries (Read).
- **DTOs:** Data Transfer Objects for internal layer communication.
- **Ports:** Interfaces for external services (e.g., Email, Payment).

### L3: Infrastructure Layer (`/infrastructure`)
- **Persistence:** Concrete implementations of Repositories (Django Models, MongoDB collections).
- **External Clients:** Implementation of RabbitMQ producers/consumers, Redis clients, or 3rd-party APIs.

### L4: Presentation Layer (`/presentation`)
- **API Views:** Specific endpoints for `Admin`, `Staff`, and `Public`.
- **Serializers:** Handling Request/Response validation and formatting.

---

## 6. Actor & Authentication Logic
Centralized Identity management via **Identity Service** (PostgreSQL).

### Roles & Permissions (RBAC)
1. **Customer:** 
   - Can self-register via `/api/v1/auth/register`.
   - Permissions: Browse, Cart, Order, Review.
2. **Staff:** 
   - Created by Manager.
   - Permissions: Manage Inventory, Confirm Orders, Update Shipping.
3. **Manager (Admin):** 
   - Created by existing Manager.
   - Permissions: Full system access, Revenue reports, User management.

### Auth Flow
- **Token:** JWT (JSON Web Token) with `user_id` and `role` claims.
- **Gateway:** Kong Gateway validates signature and expiry.
- **Service-Level:** Use Python decorators `@require_role('ADMIN')` or `@require_role('STAFF')` in the Presentation layer.

---

## 7. Non-Functional Requirements (NFRs)

### Performance
- **Low Latency:** Redis for Cart operations must be `< 50ms`.
- **Fast Search:** MongoDB indexing for Product search must be `< 200ms`.

### Reliability & Integrity
- **ACID Transactions:** Mandatory for `Order + Inventory` updates in PostgreSQL to prevent overselling.
- **Statelessness:** All services must be stateless for horizontal scaling via Docker/K8s.

### Security
- **Bcrypt:** All passwords must be hashed before storage.
- **Environment Variables:** No hardcoded credentials. Use `.env` for DB hosts, API keys, and JWT secrets.

### Data Governance
- **OLAP vs OLTP:** Do not run analytics on production DBs. Use **ClickHouse** for reporting and heavy data aggregation.

---

## 8. AI & Intelligence (Stationery Expert)
Integrating graph-based intelligence and LLMs for personalized experiences.

### Knowledge Graph (Neo4j)
- **Nodes:** `User`, `Product`, `Category`, `Tag`.
- **Relationships:** `(User)-[:PURCHASED]->(Product)`, `(User)-[:VIEWED]->(Product)`.
- **Use Case:** Recommendation engine based on collaborative filtering and graph traversals.

### AI Persona: Stationery & Office Expert
- **Engine:** RAG (Retrieval-Augmented Generation) using LangChain.
- **Context:** Combines user purchase history (Neo4j) with stationery knowledge base.
- **Task:** Provide advice on workspace organization and specific product recommendations (e.g., "Best pens for left-handed writers").

### Visual Intelligence
- **Model:** CNN (MobileNetV3) for image classification.
- **Search:** Match image labels against Product tags in MongoDB to provide visual search results.