# 🌐 What Is REST API? Everything You Need to Know

> **Series:** System Design Fundamentals  
> **Source:** [ByteByteGo — YouTube](https://youtu.be/-mN3VyJuCjM)  
> **Topic:** RESTful APIs — Principles, Design, HTTP Methods, Status Codes & Best Practices

---

## Table of Contents

1. [What is an API?](#1-what-is-an-api)
2. [What is REST?](#2-what-is-rest)
3. [What is a RESTful API?](#3-what-is-a-restful-api)
4. [Core REST Principles](#4-core-rest-principles)
   - 4.1 [Statelessness](#41-statelessness)
   - 4.2 [Client-Server Architecture](#42-client-server-architecture)
   - 4.3 [Uniform Interface](#43-uniform-interface)
   - 4.4 [Layered System](#44-layered-system)
   - 4.5 [Cacheability](#45-cacheability)
   - 4.6 [Code on Demand (Optional)](#46-code-on-demand-optional)
5. [Resources and URIs](#5-resources-and-uris)
6. [HTTP Methods — CRUD Mapping](#6-http-methods--crud-mapping)
7. [Request Structure](#7-request-structure)
8. [Response Structure and HTTP Status Codes](#8-response-structure-and-http-status-codes)
9. [Idempotency](#9-idempotency)
10. [Pagination](#10-pagination)
11. [Versioning](#11-versioning)
12. [Authentication and Security](#12-authentication-and-security)
13. [RESTful API Design Best Practices](#13-restful-api-design-best-practices)
14. [Real-World Examples of RESTful APIs](#14-real-world-examples-of-restful-apis)
15. [REST vs GraphQL vs gRPC](#15-rest-vs-graphql-vs-grpc)
16. [Common REST API Mistakes](#16-common-rest-api-mistakes)
17. [Quick Reference Tables](#17-quick-reference-tables)
18. [Glossary](#18-glossary)
19. [Key Takeaways](#19-key-takeaways)

---

## 1. What is an API?

An **API (Application Programming Interface)** is a contract that defines how two pieces of software can communicate with each other.

Think of it like a waiter at a restaurant:

```
You (Client)        Waiter (API)         Kitchen (Server)
     |                   |                      |
     |── "I'd like       |                      |
     |    a burger" ────►|── Sends your order ──►|
     |                   |                      |── Prepares burger
     |◄── Brings food ───|◄───── Sends food ─────|
```

You don't need to know how the kitchen works. The waiter (API) handles the communication using a defined interface.

In software:
- **Client** = a web browser, mobile app, or another server
- **API** = the defined endpoints and rules
- **Server** = the backend that processes requests and returns responses

---

## 2. What is REST?

**REST** stands for **RE**presentational **S**tate **T**ransfer.

It was introduced by **Roy Fielding** in his 2000 doctoral dissertation at UC Irvine. It's **not a protocol or a formal standard** — it's an **architectural style**, a set of constraints and principles for designing networked applications.

Key point: REST uses **HTTP** as its transport protocol, leveraging existing web infrastructure.

> 💡 REST became dominant in the 2000s because it's simple, stateless, and works naturally with the web's existing HTTP infrastructure — unlike SOAP (which required complex XML envelopes) or other RPC mechanisms.

---

## 3. What is a RESTful API?

A **RESTful API** is an API that conforms to the REST architectural constraints.

```
Client                    Internet                   Server
  |                          |                          |
  |── HTTP Request ─────────►|── Routes to server ─────►|
  |   (GET /products)        |                          |── Processes request
  |                          |                          |── Returns JSON data
  |◄── HTTP Response ────────|◄─────────────────────────|
  |   (200 OK + JSON body)   |
```

RESTful APIs:
- Use **HTTP methods** (GET, POST, PUT, DELETE, PATCH)
- Address **resources** via **URIs**
- Transfer data (usually as **JSON** or XML)
- Are **stateless** — each request is self-contained

---

## 4. Core REST Principles

Roy Fielding defined **6 constraints** that a system must satisfy to be considered RESTful.

---

### 4.1 Statelessness

**The most important constraint.**

Each HTTP request from a client to a server must contain **all the information needed** to understand and process the request. The server stores **no session state** about the client between requests.

```
❌ Stateful (bad):
  Request 1: "Log me in as user123"    → Server saves session
  Request 2: "Show my orders"          → Server looks up session
  (Server must remember who you are)

✅ Stateless (REST):
  Request 1: "GET /orders" + Authorization: Bearer <token>
  Request 2: "GET /orders" + Authorization: Bearer <token>
  (Every request carries its own identity)
```

**Why it matters for system design:**
- Any server in a cluster can handle any request → **horizontal scaling**
- No shared session state → **simpler infrastructure**
- Failed requests can be safely retried → **higher reliability**

---

### 4.2 Client-Server Architecture

The **client** and **server** are separate, independent systems that communicate only through a well-defined API.

- The client handles **UI and user experience**
- The server handles **data storage and business logic**
- They evolve independently — change your React frontend without touching the API backend

---

### 4.3 Uniform Interface

All REST APIs share a **consistent, standardized interface**. This is achieved through:

1. **Resource identification via URIs** — resources have unique addresses
2. **Manipulation through representations** — clients interact with JSON/XML representations, not direct objects
3. **Self-descriptive messages** — each message includes enough info to describe how to process it
4. **HATEOAS** — Hypermedia As The Engine Of Application State (responses include links to related actions)

---

### 4.4 Layered System

A client doesn't need to know if it's talking directly to the server, or through intermediaries like:
- Load balancers
- API gateways
- Caching servers (CDN)
- Security proxies

This enables scalability and lets you add infrastructure layers transparently.

---

### 4.5 Cacheability

Responses must define themselves as **cacheable** or **non-cacheable** via HTTP headers (`Cache-Control`, `ETag`, `Expires`).

When responses are cached:
- Clients reuse cached data → **fewer requests** to server
- CDNs cache responses at the edge → **lower latency** for end users

---

### 4.6 Code on Demand (Optional)

Servers can optionally send executable code to clients (e.g., JavaScript). This is the only **optional** constraint. Most REST APIs don't use it.

---

## 5. Resources and URIs

In REST, everything is a **resource** — a conceptual entity (a user, a product, an order). Resources are identified by **URIs** (Uniform Resource Identifiers).

### ✅ Good URI Design — Use Nouns, Not Verbs

REST uses **HTTP methods** to express actions. Your URIs should name **things**, not actions.

| ❌ Bad (verb in URI) | ✅ Good (noun URI + HTTP method) |
|---|---|
| `GET /getAllProducts` | `GET /products` |
| `POST /createUser` | `POST /users` |
| `GET /deleteOrder?id=5` | `DELETE /orders/5` |
| `POST /updateProduct/3` | `PUT /products/3` |

### URI Structure Conventions

```
https://api.example.com/v1/products
│       │               │   │
│       │               │   └── Resource (plural noun)
│       │               └────── Version
│       └────────────────────── API subdomain (common convention)
└────────────────────────────── Protocol (always HTTPS)
```

### Nested Resources (Relationships)

```
GET /users/42/orders          → All orders belonging to user 42
GET /users/42/orders/7        → Order 7 belonging to user 42
DELETE /users/42/orders/7     → Delete order 7 of user 42
```

Keep nesting to **max 2 levels deep** — deeper nesting becomes hard to read and maintain.

---

## 6. HTTP Methods — CRUD Mapping

HTTP methods map directly to **CRUD** operations:

| HTTP Method | CRUD Operation | Description | Example |
|---|---|---|---|
| **GET** | Read | Retrieve a resource or collection | `GET /products` |
| **POST** | Create | Create a new resource | `POST /products` |
| **PUT** | Update (full) | Replace an entire resource | `PUT /products/5` |
| **PATCH** | Update (partial) | Modify part of a resource | `PATCH /products/5` |
| **DELETE** | Delete | Remove a resource | `DELETE /products/5` |

### PUT vs PATCH

```
Existing resource: { "id": 5, "name": "Laptop", "price": 999, "stock": 50 }

PUT /products/5     → Must send ALL fields; replaces the entire resource
Body: { "name": "Laptop Pro", "price": 1199, "stock": 50 }   ← stock required

PATCH /products/5   → Send ONLY changed fields; partial update
Body: { "price": 1199 }    ← only update price, leave everything else alone
```

### HEAD and OPTIONS

| Method | Purpose |
|---|---|
| **HEAD** | Same as GET but returns only headers, no body — useful for checking if a resource exists |
| **OPTIONS** | Returns allowed HTTP methods for a resource — used in CORS preflight |

---

## 7. Request Structure

A complete REST API request consists of:

```
POST /v1/products HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Accept: application/json

{
  "name": "Wireless Keyboard",
  "price": 79.99,
  "category": "electronics",
  "stock": 200
}
```

Breaking it down:

| Part | Description | Example |
|---|---|---|
| **HTTP Method** | The action to perform | `POST` |
| **URI/Path** | The resource being acted on | `/v1/products` |
| **Host** | The server domain | `api.example.com` |
| **Content-Type** | Format of the request body | `application/json` |
| **Authorization** | Authentication credentials | `Bearer <JWT token>` |
| **Accept** | Preferred response format | `application/json` |
| **Body** | Data payload (for POST/PUT/PATCH) | JSON object |

### Query Parameters

Used for filtering, sorting, searching, and pagination:

```
GET /products?category=electronics&sort=price&order=asc&limit=20&offset=0

                 ↑ filter          ↑ sort field    ↑ direction ↑ pagination
```

---

## 8. Response Structure and HTTP Status Codes

Every REST response includes:
1. An **HTTP status code** indicating what happened
2. **Response headers** (Content-Type, etc.)
3. Optionally, a **JSON body** with data or error details

### HTTP Status Code Reference

#### 2xx — Success

| Code | Name | When to Use |
|---|---|---|
| `200 OK` | Success | Successful GET, PUT, PATCH, DELETE |
| `201 Created` | Resource Created | Successful POST — new resource created |
| `204 No Content` | Success, No Body | Successful DELETE with no response body |
| `206 Partial Content` | Partial Data | Paginated or range response |

#### 3xx — Redirection

| Code | Name | When to Use |
|---|---|---|
| `301 Moved Permanently` | Permanent Redirect | Resource URL has changed permanently |
| `304 Not Modified` | Cached Response | Client's cached version is still current |

#### 4xx — Client Errors

| Code | Name | When to Use |
|---|---|---|
| `400 Bad Request` | Invalid Request | Malformed JSON, missing required fields |
| `401 Unauthorized` | Not Authenticated | Missing or invalid authentication token |
| `403 Forbidden` | Not Authorized | Authenticated but lacks permission |
| `404 Not Found` | Resource Missing | Resource doesn't exist |
| `405 Method Not Allowed` | Wrong HTTP Method | e.g., `DELETE` on a read-only resource |
| `409 Conflict` | State Conflict | e.g., duplicate email on registration |
| `422 Unprocessable Entity` | Validation Error | Request is well-formed but semantically invalid |
| `429 Too Many Requests` | Rate Limited | Client exceeded API rate limit |

#### 5xx — Server Errors

| Code | Name | When to Use |
|---|---|---|
| `500 Internal Server Error` | Generic Server Error | Unhandled exception on the server |
| `502 Bad Gateway` | Upstream Failure | Proxy received invalid response from upstream |
| `503 Service Unavailable` | Server Down | Server overloaded or under maintenance |
| `504 Gateway Timeout` | Upstream Timeout | Upstream server took too long to respond |

### Example Response Bodies

**Success (200):**
```json
{
  "data": {
    "id": 42,
    "name": "Wireless Keyboard",
    "price": 79.99,
    "category": "electronics"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

**Error (400):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": [
      { "field": "price", "issue": "must be a positive number" },
      { "field": "name",  "issue": "is required" }
    ]
  }
}
```

---

## 9. Idempotency

An operation is **idempotent** if performing it multiple times produces the same result as performing it once.

| Method | Idempotent? | Safe (no side effects)? | Notes |
|---|---|---|---|
| **GET** | ✅ Yes | ✅ Yes | Reading never changes state |
| **HEAD** | ✅ Yes | ✅ Yes | Same as GET |
| **PUT** | ✅ Yes | ❌ No | Replacing with same data = same result |
| **DELETE** | ✅ Yes | ❌ No | Deleting twice = still deleted (404 on 2nd) |
| **PATCH** | ❌ No* | ❌ No | *Depends on implementation |
| **POST** | ❌ No | ❌ No | Creates a new resource each time |

### Why Idempotency Matters

In distributed systems, **network failures** mean a request might time out before you know if it succeeded. With idempotent methods, you can safely **retry** the request:

```
Client sends DELETE /orders/7
  → Network times out (did server receive it?)
  → Client retries DELETE /orders/7
  → Server: order already deleted → returns 404
  → Client: either 200 or 404 is fine — goal achieved ✅

vs.

Client sends POST /orders (create new order)
  → Network times out
  → Client retries POST /orders
  → Server creates ANOTHER order ❌ (duplicate!)
```

**Solution for non-idempotent POST:** Use an **idempotency key** header:
```
POST /orders
Idempotency-Key: a8098c1a-f86e-11da-bd1a-00112444be1e
```
The server stores this key and returns the same response if the key is seen again.

---

## 10. Pagination

Never return all records in a single response for large datasets — it's slow, memory-intensive, and a poor user experience.

### Offset-Based Pagination

```
GET /products?limit=20&offset=0    → Records 1–20
GET /products?limit=20&offset=20   → Records 21–40
GET /products?limit=20&offset=40   → Records 41–60
```

**Pros:** Simple, easy to implement  
**Cons:** Inconsistent if records are added/deleted between pages (items can shift)

### Cursor-Based Pagination (Recommended for large datasets)

```
GET /products?limit=20
→ Response includes: "next_cursor": "eyJpZCI6MjB9"

GET /products?limit=20&cursor=eyJpZCI6MjB9
→ Returns next 20 records after cursor position
```

**Pros:** Stable even as data changes; better performance on large tables  
**Cons:** Can't jump to arbitrary pages

### Paginated Response Body

```json
{
  "data": [ ... ],
  "pagination": {
    "total": 1500,
    "limit": 20,
    "offset": 0,
    "next": "/v1/products?limit=20&offset=20",
    "previous": null
  }
}
```

> 💡 Always set **sensible server-side defaults** (e.g., `limit=20`) and a **maximum cap** (e.g., `limit=100`) even if the client doesn't specify — never allow `GET /products` to return 1 million rows.

---

## 11. Versioning

APIs evolve. Versioning lets you **introduce breaking changes** without breaking existing clients.

### Option 1: URI Path Versioning (Most Common)

```
https://api.example.com/v1/products
https://api.example.com/v2/products
```

**Pros:** Explicit, easy to see in logs, browser-friendly  
**Cons:** Clutters URI; can't version individual resources easily

### Option 2: Query Parameter Versioning

```
GET /products?version=2
```

**Pros:** URI stays clean  
**Cons:** Easy to forget; less visible

### Option 3: Header Versioning

```
GET /products
Accept: application/vnd.example.v2+json
```

**Pros:** Clean URIs; follows HTTP spec  
**Cons:** Less visible; harder to test in browser

### Option 4: Subdomain Versioning

```
https://v2.api.example.com/products
```

**Pros:** Complete isolation per version  
**Cons:** DNS/infrastructure complexity

### Version Lifecycle Best Practices

```
v1 (Current)    → Fully supported
v1 (Deprecated) → Still works, returns Deprecation header, sunset date announced
v1 (Sunset)     → Returns 410 Gone
```

Always give clients **at least 6–12 months notice** before sunsetting an old API version.

---

## 12. Authentication and Security

### Common Authentication Methods

#### 1. API Keys

```
GET /products
X-API-Key: abc123xyz789
```

Simple but not suitable for user-level authorization. Best for server-to-server communication.

#### 2. Bearer Tokens (JWT)

```
GET /products
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**JWT (JSON Web Token)** encodes user identity and claims in a signed token. The server validates the signature without querying a database — stateless authentication.

```
JWT Structure:
eyJhbGciOiJIUzI1NiJ9    ← Header (algorithm)
.eyJ1c2VySWQiOiI0MiJ9  ← Payload (claims: userId, roles, expiry)
.SflKxwRJSMeKKF2QT4fw  ← Signature (HMAC of header + payload)
```

#### 3. OAuth 2.0

The industry standard for **delegated authorization**. Used when your API needs to act on behalf of a user (e.g., "Login with Google").

```
User → Your App → Google OAuth → Access Token → Your API
```

### Security Best Practices

| Practice | Details |
|---|---|
| **Always use HTTPS** | Never send credentials or data over plain HTTP |
| **Validate all input** | Sanitize and validate every request field server-side |
| **Rate limiting** | Prevent abuse — return `429 Too Many Requests` when exceeded |
| **Short-lived tokens** | JWTs should expire quickly (15 min–1 hr); use refresh tokens |
| **CORS headers** | Control which origins can call your API |
| **HSTS** | Force HTTPS via `Strict-Transport-Security` header |

---

## 13. RESTful API Design Best Practices

### ✅ DO

```
✅ Use plural nouns for collections:     /users, /products, /orders
✅ Use HTTP methods for actions:         DELETE /users/5 (not /deleteUser/5)
✅ Return proper status codes:           201 for create, 204 for delete
✅ Use consistent JSON structure:        { "data": {...}, "error": null }
✅ Version your API from day one:        /v1/...
✅ Implement pagination for collections
✅ Use HTTPS everywhere
✅ Document your API (OpenAPI/Swagger)
✅ Use nouns in snake_case or camelCase  (pick one, be consistent)
```

### ❌ DON'T

```
❌ Use verbs in URIs:                    /getProducts, /createUser
❌ Use 200 OK for all responses:         Return 404 for not found, 400 for bad input
❌ Return all records without pagination
❌ Put sensitive data in URLs:           /users?password=abc (visible in logs)
❌ Ignore HTTP method semantics:         Using GET for state-changing operations
❌ Break backward compatibility without versioning
❌ Use inconsistent naming:              /user_list and /getOrders in the same API
```

---

## 14. Real-World Examples of RESTful APIs

### Stripe (Payments)

```
POST   /v1/charges                 → Create a charge
GET    /v1/charges/ch_abc123       → Retrieve a charge
GET    /v1/customers               → List all customers
POST   /v1/customers               → Create a customer
DELETE /v1/customers/cus_xyz       → Delete a customer
```

### Twilio (Communications)

```
POST   /2010-04-01/Accounts/{AccountSid}/Messages   → Send an SMS
GET    /2010-04-01/Accounts/{AccountSid}/Messages   → List messages
```

### GitHub (Developer Tools)

```
GET    /repos/{owner}/{repo}                        → Get repository info
GET    /repos/{owner}/{repo}/issues                 → List issues
POST   /repos/{owner}/{repo}/issues                 → Create an issue
PATCH  /repos/{owner}/{repo}/issues/{issue_number}  → Update an issue
```

These are textbook-clean REST APIs — they all use nouns, correct HTTP methods, proper status codes, versioning, and pagination.

---

## 15. REST vs GraphQL vs gRPC

REST isn't always the right choice. Here's when to use each:

| | **REST** | **GraphQL** | **gRPC** |
|---|---|---|---|
| **Best for** | Public APIs, CRUD apps, most web/mobile | Complex queries, frontend flexibility | Internal microservices, high performance |
| **Data fetching** | Fixed endpoints return fixed shapes | Client specifies exact fields needed | Defined via Protobuf schema |
| **Over-fetching** | Common (get more than needed) | None — client asks for exactly what it needs | None |
| **Under-fetching** | Common (multiple round trips) | None — single query can fetch nested data | None |
| **Transport** | HTTP 1.1 | HTTP 1.1 | HTTP/2 (streaming, multiplexing) |
| **Caching** | Easy (HTTP caching works) | Complex | Complex |
| **Learning curve** | Low | Medium | High |
| **Tooling/ecosystem** | Excellent | Good | Good |
| **Type safety** | Optional | Optional | Strong (Protobuf) |
| **Versioning** | Required | Usually not needed | Schema evolution |

```
Rule of Thumb:
  Public API for external developers?  → REST
  Complex frontend data requirements?  → GraphQL
  Internal microservices at scale?     → gRPC
```

---

## 16. Common REST API Mistakes

### 1. Using GET for State-Changing Operations

```
❌ GET /deleteUser?id=5
✅ DELETE /users/5
```

GET requests can be cached and bookmarked — never use them to change data.

### 2. Returning 200 for Errors

```
❌ HTTP 200 OK + body: { "error": "User not found" }
✅ HTTP 404 Not Found + body: { "error": "User not found" }
```

Clients and monitoring tools rely on status codes. Don't lie with 200.

### 3. Exposing Internal Implementation Details

```
❌ /mysql_users_table/42
❌ /api?query=SELECT+*+FROM+users+WHERE+id=42
✅ /users/42
```

URIs should represent **logical resources**, not database tables or internal code.

### 4. Not Handling Errors Consistently

Pick a **consistent error format** and use it everywhere:
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "User with id 42 does not exist",
    "request_id": "req_9f8e7d6c"
  }
}
```

### 5. Missing Rate Limiting

Without rate limiting, a single misbehaving client can take down your API. Always include `X-RateLimit-*` response headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1706270400
```

---

## 17. Quick Reference Tables

### HTTP Methods Summary

| Method | CRUD | Idempotent | Safe | Body in Request | Body in Response |
|---|---|---|---|---|---|
| GET | Read | ✅ | ✅ | ❌ | ✅ |
| POST | Create | ❌ | ❌ | ✅ | ✅ |
| PUT | Update (full) | ✅ | ❌ | ✅ | ✅ |
| PATCH | Update (partial) | ❌* | ❌ | ✅ | ✅ |
| DELETE | Delete | ✅ | ❌ | Optional | Optional |
| HEAD | Read (no body) | ✅ | ✅ | ❌ | ❌ |
| OPTIONS | Metadata | ✅ | ✅ | ❌ | ✅ |

### Status Codes Cheat Sheet

| Scenario | Status Code |
|---|---|
| GET success | `200 OK` |
| POST success (resource created) | `201 Created` |
| DELETE success (no content) | `204 No Content` |
| Bad JSON / missing fields | `400 Bad Request` |
| Missing/invalid auth token | `401 Unauthorized` |
| Valid token but no permission | `403 Forbidden` |
| Resource doesn't exist | `404 Not Found` |
| Duplicate / conflict | `409 Conflict` |
| Rate limited | `429 Too Many Requests` |
| Server bug / unhandled exception | `500 Internal Server Error` |
| Server overloaded / maintenance | `503 Service Unavailable` |

---

## 18. Glossary

| Term | Definition |
|---|---|
| **REST** | Representational State Transfer — an architectural style for distributed hypermedia systems |
| **RESTful API** | An API that follows REST constraints |
| **Resource** | Any conceptual entity accessible via an API (user, product, order) |
| **URI** | Uniform Resource Identifier — the unique address of a resource |
| **HTTP Method** | The action to perform on a resource (GET, POST, PUT, DELETE, PATCH) |
| **Stateless** | No client session state stored on the server; each request is self-contained |
| **Idempotent** | An operation that produces the same result no matter how many times it's called |
| **CRUD** | Create, Read, Update, Delete — the four basic operations on data |
| **JSON** | JavaScript Object Notation — the most common data format for REST APIs |
| **JWT** | JSON Web Token — a compact, signed token for stateless authentication |
| **Pagination** | Breaking large result sets into manageable pages |
| **Versioning** | Mechanism to evolve an API without breaking existing clients |
| **Rate Limiting** | Controlling how many requests a client can make in a time period |
| **CORS** | Cross-Origin Resource Sharing — browser security mechanism controlling cross-domain requests |
| **HATEOAS** | Hypermedia As The Engine Of Application State — responses include links to related actions |
| **OpenAPI** | Specification format (formerly Swagger) for documenting REST APIs |
| **OAuth 2.0** | Industry standard authorization framework for delegated access |

---

## 19. Key Takeaways

1. **REST is a design philosophy, not a specification.** There's no REST police — but following the principles produces APIs that are scalable, understandable, and maintainable.

2. **Resources = nouns, HTTP methods = verbs.** Never put actions in your URLs. Let `DELETE /users/5` speak for itself.

3. **Statelessness enables horizontal scaling.** When no server needs to remember session state, you can add servers freely.

4. **HTTP status codes are your API's vocabulary.** Use them correctly — they're how clients, proxies, and monitoring tools understand what happened.

5. **Idempotency is a resilience superpower.** Design endpoints to be safely retried wherever possible.

6. **Pagination is not optional.** Any endpoint returning a collection needs pagination with sane defaults and maximums.

7. **Version from day one.** Adding `/v1/` at the start costs nothing and saves enormous pain later.

8. **REST is great — but not universal.** Know when GraphQL (flexible queries) or gRPC (high-performance internals) is a better fit.

9. **Security is not an afterthought.** HTTPS everywhere, proper auth, input validation, and rate limiting are baseline requirements.

10. **Good APIs are self-documenting.** Use OpenAPI/Swagger to generate living documentation from your code.

---

> 📂 **See also:** The `rest-api-example/` folder in this repository contains a working Node.js + Express RESTful API demonstrating all concepts from this guide.

---

> 📚 **Continue Learning:**
> - [Roy Fielding's Original REST Dissertation (2000)](https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm)
> - [OpenAPI Specification](https://swagger.io/specification/)
> - [REST API Tutorial](https://restfulapi.net/)
> - [HTTP Status Codes Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)

---

*Guide based on ByteByteGo's "What Is REST API? Examples And How To Use It" and extended with additional system design depth.*
