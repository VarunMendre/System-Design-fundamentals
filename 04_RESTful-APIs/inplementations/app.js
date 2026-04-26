/**
 * ============================================================
 *  RESTful API Example — System Design Guide
 *  Topic: What Is REST API? Examples And How To Use It
 * ============================================================
 *
 *  Concepts demonstrated:
 *    ✅ Resource-based URI design (nouns, not verbs)
 *    ✅ All HTTP methods: GET, POST, PUT, PATCH, DELETE
 *    ✅ Correct HTTP status codes for every scenario
 *    ✅ Stateless request handling
 *    ✅ Idempotency (PUT, DELETE)
 *    ✅ Pagination (limit + offset)
 *    ✅ API versioning (/v1/...)
 *    ✅ Consistent error response format
 *    ✅ Input validation
 *    ✅ Rate limiting (simple in-memory)
 *    ✅ CORS headers
 *
 *  Run:
 *    npm install
 *    npm start          (production)
 *    npm run dev        (development with auto-reload via nodemon)
 *
 *  Base URL: http://localhost:3000/v1
 * ============================================================
 */

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────────────────────
//  Middleware
// ─────────────────────────────────────────────────────────────

// Parse incoming JSON request bodies
app.use(express.json());

// CORS headers — allow cross-origin requests (for browser clients)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
  // Handle preflight OPTIONS requests
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Request logger middleware — logs method, path, and timestamp
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}]  ${req.method}  ${req.originalUrl}`);
  next();
});

// ─────────────────────────────────────────────────────────────
//  Simple In-Memory Rate Limiter
//  Demonstrates the 429 Too Many Requests status code
//  (In production, use Redis + a library like express-rate-limit)
// ─────────────────────────────────────────────────────────────
const RATE_LIMIT = 100;           // max requests per window
const RATE_WINDOW_MS = 60 * 1000; // 1 minute window
const requestCounts = new Map();

app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, windowStart: now });
  } else {
    const record = requestCounts.get(ip);
    if (now - record.windowStart > RATE_WINDOW_MS) {
      // Reset window
      record.count = 1;
      record.windowStart = now;
    } else {
      record.count++;
    }
    if (record.count > RATE_LIMIT) {
      res.setHeader("X-RateLimit-Limit", RATE_LIMIT);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", Math.ceil((record.windowStart + RATE_WINDOW_MS) / 1000));
      return res.status(429).json(
        errorResponse("RATE_LIMIT_EXCEEDED", "Too many requests. Please slow down.")
      );
    }
    const remaining = Math.max(0, RATE_LIMIT - record.count);
    res.setHeader("X-RateLimit-Limit", RATE_LIMIT);
    res.setHeader("X-RateLimit-Remaining", remaining);
  }
  next();
});

// ─────────────────────────────────────────────────────────────
//  In-Memory "Database"
//  Simulates a data store — replace with a real DB in production
// ─────────────────────────────────────────────────────────────
let products = [
  { id: 1, name: "Wireless Keyboard",  price: 79.99,  category: "electronics", stock: 150 },
  { id: 2, name: "Mechanical Mouse",   price: 49.99,  category: "electronics", stock: 200 },
  { id: 3, name: "USB-C Hub",          price: 39.99,  category: "electronics", stock: 300 },
  { id: 4, name: "Monitor Stand",      price: 29.99,  category: "accessories", stock: 80  },
  { id: 5, name: "Laptop Backpack",    price: 59.99,  category: "accessories", stock: 120 },
  { id: 6, name: "Noise Cancelling Headphones", price: 199.99, category: "electronics", stock: 60 },
  { id: 7, name: "Ergonomic Chair",    price: 349.99, category: "furniture",   stock: 25  },
  { id: 8, name: "Standing Desk",      price: 499.99, category: "furniture",   stock: 15  },
];

let nextId = products.length + 1; // Auto-increment ID counter

// ─────────────────────────────────────────────────────────────
//  Helper Functions
// ─────────────────────────────────────────────────────────────

/**
 * Builds a consistent success response envelope.
 * @param {*}      data     - The payload to return
 * @param {object} meta     - Optional metadata (pagination info, etc.)
 */
function successResponse(data, meta = {}) {
  return {
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
    error: null,
  };
}

/**
 * Builds a consistent error response envelope.
 * @param {string} code     - Machine-readable error code
 * @param {string} message  - Human-readable error message
 * @param {Array}  details  - Optional array of field-level errors
 */
function errorResponse(code, message, details = []) {
  return {
    data: null,
    error: {
      code,
      message,
      ...(details.length > 0 && { details }),
    },
  };
}

/**
 * Validates fields for creating/replacing a product (POST / PUT).
 * Returns an array of validation errors, or empty array if valid.
 */
function validateProductFull(body) {
  const errors = [];
  if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
    errors.push({ field: "name", issue: "is required and must be a non-empty string" });
  }
  if (body.price === undefined || typeof body.price !== "number" || body.price < 0) {
    errors.push({ field: "price", issue: "is required and must be a non-negative number" });
  }
  if (!body.category || typeof body.category !== "string") {
    errors.push({ field: "category", issue: "is required and must be a string" });
  }
  if (body.stock !== undefined && (typeof body.stock !== "number" || body.stock < 0)) {
    errors.push({ field: "stock", issue: "must be a non-negative integer" });
  }
  return errors;
}

// ─────────────────────────────────────────────────────────────
//  ROUTES
//  Base path: /v1   ← demonstrates URI versioning
// ─────────────────────────────────────────────────────────────

const router = express.Router();

// ────────────────────────────────────────────
//  GET /v1/products
//  List all products with filtering + pagination
//  Demonstrates: GET, 200, pagination, query params
// ────────────────────────────────────────────
router.get("/products", (req, res) => {
  let results = [...products];

  // ── Filtering ──────────────────────────────
  // Filter by category: GET /products?category=electronics
  if (req.query.category) {
    results = results.filter(
      (p) => p.category.toLowerCase() === req.query.category.toLowerCase()
    );
  }

  // Filter by max price: GET /products?maxPrice=100
  if (req.query.maxPrice) {
    const max = parseFloat(req.query.maxPrice);
    if (!isNaN(max)) results = results.filter((p) => p.price <= max);
  }

  // ── Sorting ────────────────────────────────
  // Sort by field: GET /products?sort=price&order=asc
  const sortField = req.query.sort;
  const sortOrder = req.query.order === "desc" ? -1 : 1;
  if (sortField && ["name", "price", "stock"].includes(sortField)) {
    results.sort((a, b) => {
      if (a[sortField] < b[sortField]) return -1 * sortOrder;
      if (a[sortField] > b[sortField]) return 1 * sortOrder;
      return 0;
    });
  }

  // ── Pagination ─────────────────────────────
  // GET /products?limit=3&offset=0
  const total = results.length;
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // default 10, max 100
  const offset = parseInt(req.query.offset) || 0;

  const page = results.slice(offset, offset + limit);
  const nextOffset = offset + limit < total ? offset + limit : null;
  const prevOffset = offset > 0 ? Math.max(0, offset - limit) : null;

  return res.status(200).json(
    successResponse(page, {
      pagination: {
        total,
        limit,
        offset,
        returned: page.length,
        next: nextOffset !== null ? `/v1/products?limit=${limit}&offset=${nextOffset}` : null,
        previous: prevOffset !== null ? `/v1/products?limit=${limit}&offset=${prevOffset}` : null,
      },
    })
  );
});

// ────────────────────────────────────────────
//  GET /v1/products/:id
//  Get a single product by ID
//  Demonstrates: GET, 200, 404
// ────────────────────────────────────────────
router.get("/products/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json(
      errorResponse("INVALID_ID", "Product ID must be a valid integer")
    );
  }

  const product = products.find((p) => p.id === id);

  if (!product) {
    return res.status(404).json(
      errorResponse("RESOURCE_NOT_FOUND", `Product with id ${id} does not exist`)
    );
  }

  return res.status(200).json(successResponse(product));
});

// ────────────────────────────────────────────
//  POST /v1/products
//  Create a new product
//  Demonstrates: POST, 201 Created, 400 validation error
//  NOT idempotent — each call creates a new resource
// ────────────────────────────────────────────
router.post("/products", (req, res) => {
  const validationErrors = validateProductFull(req.body);

  if (validationErrors.length > 0) {
    return res.status(400).json(
      errorResponse("VALIDATION_ERROR", "Invalid request body", validationErrors)
    );
  }

  const newProduct = {
    id: nextId++,
    name: req.body.name.trim(),
    price: req.body.price,
    category: req.body.category.trim().toLowerCase(),
    stock: req.body.stock ?? 0,
  };

  products.push(newProduct);

  // 201 Created + Location header pointing to the new resource
  res.setHeader("Location", `/v1/products/${newProduct.id}`);
  return res.status(201).json(successResponse(newProduct));
});

// ────────────────────────────────────────────
//  PUT /v1/products/:id
//  Full replacement of a product (all fields required)
//  Demonstrates: PUT, 200, 404, idempotency
//  IDEMPOTENT — calling multiple times with same body = same result
// ────────────────────────────────────────────
router.put("/products/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json(
      errorResponse("INVALID_ID", "Product ID must be a valid integer")
    );
  }

  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json(
      errorResponse("RESOURCE_NOT_FOUND", `Product with id ${id} does not exist`)
    );
  }

  const validationErrors = validateProductFull(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json(
      errorResponse("VALIDATION_ERROR", "Invalid request body", validationErrors)
    );
  }

  // Full replacement — preserve only the ID
  const updatedProduct = {
    id,
    name: req.body.name.trim(),
    price: req.body.price,
    category: req.body.category.trim().toLowerCase(),
    stock: req.body.stock ?? 0,
  };

  products[index] = updatedProduct;

  return res.status(200).json(successResponse(updatedProduct));
});

// ────────────────────────────────────────────
//  PATCH /v1/products/:id
//  Partial update — only update provided fields
//  Demonstrates: PATCH, 200, 404
// ────────────────────────────────────────────
router.patch("/products/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json(
      errorResponse("INVALID_ID", "Product ID must be a valid integer")
    );
  }

  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json(
      errorResponse("RESOURCE_NOT_FOUND", `Product with id ${id} does not exist`)
    );
  }

  const body = req.body;
  const errors = [];

  // Validate only the fields that were provided
  if (body.name !== undefined && (typeof body.name !== "string" || body.name.trim() === "")) {
    errors.push({ field: "name", issue: "must be a non-empty string" });
  }
  if (body.price !== undefined && (typeof body.price !== "number" || body.price < 0)) {
    errors.push({ field: "price", issue: "must be a non-negative number" });
  }
  if (body.stock !== undefined && (typeof body.stock !== "number" || body.stock < 0)) {
    errors.push({ field: "stock", issue: "must be a non-negative integer" });
  }

  if (errors.length > 0) {
    return res.status(400).json(
      errorResponse("VALIDATION_ERROR", "Invalid patch body", errors)
    );
  }

  // Merge provided fields into the existing product (partial update)
  const patched = { ...products[index] };
  if (body.name !== undefined)     patched.name     = body.name.trim();
  if (body.price !== undefined)    patched.price    = body.price;
  if (body.category !== undefined) patched.category = body.category.trim().toLowerCase();
  if (body.stock !== undefined)    patched.stock    = body.stock;

  products[index] = patched;

  return res.status(200).json(successResponse(patched));
});

// ────────────────────────────────────────────
//  DELETE /v1/products/:id
//  Remove a product
//  Demonstrates: DELETE, 204 No Content, 404
//  IDEMPOTENT — deleting a deleted resource returns 404 (not an error for the client)
// ────────────────────────────────────────────
router.delete("/products/:id", (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json(
      errorResponse("INVALID_ID", "Product ID must be a valid integer")
    );
  }

  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json(
      errorResponse("RESOURCE_NOT_FOUND", `Product with id ${id} does not exist`)
    );
  }

  products.splice(index, 1);

  // 204 No Content — success with no response body
  return res.status(204).send();
});

// ────────────────────────────────────────────
//  GET /v1/categories
//  List all unique product categories
//  Demonstrates: derived/computed resources
// ────────────────────────────────────────────
router.get("/categories", (req, res) => {
  const categories = [...new Set(products.map((p) => p.category))].sort();
  return res.status(200).json(successResponse(categories));
});

// ────────────────────────────────────────────
//  GET /v1/categories/:category/products
//  List products under a specific category (nested resource)
//  Demonstrates: nested URI design, 404 for unknown category
// ────────────────────────────────────────────
router.get("/categories/:category/products", (req, res) => {
  const category = req.params.category.toLowerCase();
  const matches = products.filter((p) => p.category === category);

  if (matches.length === 0) {
    return res.status(404).json(
      errorResponse("RESOURCE_NOT_FOUND", `No products found in category '${category}'`)
    );
  }

  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const offset = parseInt(req.query.offset) || 0;
  const page = matches.slice(offset, offset + limit);

  return res.status(200).json(
    successResponse(page, {
      pagination: {
        total: matches.length,
        limit,
        offset,
        returned: page.length,
      },
    })
  );
});

// ────────────────────────────────────────────
//  GET /v1/health
//  Health check endpoint — standard practice for any API
// ────────────────────────────────────────────
router.get("/health", (req, res) => {
  return res.status(200).json(
    successResponse({
      status: "healthy",
      uptime_seconds: Math.floor(process.uptime()),
      products_in_store: products.length,
    })
  );
});

// ─────────────────────────────────────────────────────────────
//  Mount the router under /v1 — URI versioning
// ─────────────────────────────────────────────────────────────
app.use("/v1", router);

// ─────────────────────────────────────────────────────────────
//  Root Endpoint — API info / discovery
// ─────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({
    name: "RESTful API Example",
    description: "A demo API illustrating REST principles for System Design study",
    version: "v1",
    base_url: `http://localhost:${PORT}/v1`,
    endpoints: {
      "GET    /v1/health":                         "Health check",
      "GET    /v1/products":                       "List products (supports ?limit, ?offset, ?category, ?sort, ?order, ?maxPrice)",
      "GET    /v1/products/:id":                   "Get a single product",
      "POST   /v1/products":                       "Create a new product",
      "PUT    /v1/products/:id":                   "Full replacement of a product",
      "PATCH  /v1/products/:id":                   "Partial update of a product",
      "DELETE /v1/products/:id":                   "Delete a product",
      "GET    /v1/categories":                     "List all categories",
      "GET    /v1/categories/:category/products":  "List products in a category",
    },
  });
});

// ─────────────────────────────────────────────────────────────
//  404 Handler — for unknown routes
// ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json(
    errorResponse(
      "ENDPOINT_NOT_FOUND",
      `Route ${req.method} ${req.originalUrl} does not exist`
    )
  );
});

// ─────────────────────────────────────────────────────────────
//  Global Error Handler — catches any unhandled errors
//  Ensures 500 is returned instead of crashing
// ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("[ERROR]", err);
  res.status(500).json(
    errorResponse("INTERNAL_SERVER_ERROR", "An unexpected error occurred on the server")
  );
});

// ─────────────────────────────────────────────────────────────
//  Start Server
// ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("─────────────────────────────────────────────");
  console.log(`  RESTful API Example running on port ${PORT}`);
  console.log(`  Base URL : http://localhost:${PORT}/v1`);
  console.log(`  Docs     : http://localhost:${PORT}/`);
  console.log("─────────────────────────────────────────────");
  console.log("\nSample requests to try:\n");
  console.log(`  GET    http://localhost:${PORT}/v1/products`);
  console.log(`  GET    http://localhost:${PORT}/v1/products?category=electronics&limit=3&offset=0`);
  console.log(`  GET    http://localhost:${PORT}/v1/products/1`);
  console.log(`  POST   http://localhost:${PORT}/v1/products`);
  console.log(`         Body: { "name": "Webcam", "price": 89.99, "category": "electronics", "stock": 50 }`);
  console.log(`  PATCH  http://localhost:${PORT}/v1/products/1`);
  console.log(`         Body: { "price": 69.99 }`);
  console.log(`  DELETE http://localhost:${PORT}/v1/products/1`);
  console.log(`  GET    http://localhost:${PORT}/v1/categories`);
  console.log(`  GET    http://localhost:${PORT}/v1/categories/electronics/products`);
  console.log("");
});
