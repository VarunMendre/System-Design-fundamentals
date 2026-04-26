/**
 * ============================================================
 *  Data Structure #4 — QUEUE
 *  File: 04_queue.js
 * ============================================================
 *
 *  Implementations:
 *    1. Queue           — basic FIFO using circular buffer
 *    2. Deque           — double-ended queue
 *    3. PriorityQueue   — heap-backed (preview; full heap in 05)
 *
 *  Sample Use Cases:
 *    A. Print Spooler   — manage print jobs in order
 *    B. BFS             — shortest path in a grid maze
 *    C. Rate Limiter    — sliding window request counter
 *
 *  Run: node 04_queue.js
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────
//  Queue — Circular Buffer Implementation
//  Uses a fixed-size array with head/tail pointers.
//  All operations O(1). No shifting needed.
// ─────────────────────────────────────────────────────────────

class Queue {
  constructor(capacity = 16) {
    this._data = new Array(capacity);
    this._capacity = capacity;
    this._head = 0;  // index of front element
    this._tail = 0;  // index where next element will be inserted
    this._size = 0;
  }

  // Add to rear — O(1)
  enqueue(item) {
    if (this._size === this._capacity) this._grow();
    this._data[this._tail] = item;
    this._tail = (this._tail + 1) % this._capacity;
    this._size++;
    return this;
  }

  // Remove from front — O(1)
  dequeue() {
    if (this.isEmpty()) throw new Error("Queue is empty");
    const item = this._data[this._head];
    this._data[this._head] = undefined;
    this._head = (this._head + 1) % this._capacity;
    this._size--;
    return item;
  }

  // View front — O(1)
  peek() {
    if (this.isEmpty()) return undefined;
    return this._data[this._head];
  }

  isEmpty() { return this._size === 0; }
  get size() { return this._size; }

  _grow() {
    const newCap = this._capacity * 2;
    const newData = new Array(newCap);
    for (let i = 0; i < this._size; i++) {
      newData[i] = this._data[(this._head + i) % this._capacity];
    }
    this._data = newData;
    this._head = 0;
    this._tail = this._size;
    this._capacity = newCap;
  }

  toArray() {
    return Array.from({ length: this._size }, (_, i) =>
      this._data[(this._head + i) % this._capacity]
    );
  }

  toString() {
    return `front → [${this.toArray().join(", ")}] ← rear`;
  }
}

// ─────────────────────────────────────────────────────────────
//  Deque — Double-Ended Queue
// ─────────────────────────────────────────────────────────────

class Deque {
  constructor() {
    this._data = [];
  }

  pushFront(item) { this._data.unshift(item); }       // O(n) — for demo purposes
  pushBack(item)  { this._data.push(item); }          // O(1)
  popFront()      { return this._data.shift(); }      // O(n) — for demo purposes
  popBack()       { return this._data.pop(); }        // O(1)
  peekFront()     { return this._data[0]; }
  peekBack()      { return this._data[this._data.length - 1]; }
  isEmpty()       { return this._data.length === 0; }
  get size()      { return this._data.length; }
  toString()      { return `[${this._data.join(" | ")}]`; }
}

// ─────────────────────────────────────────────────────────────
//  USE CASE A: Print Spooler
//  Documents added to queue, printer processes one at a time
// ─────────────────────────────────────────────────────────────

class PrintSpooler {
  constructor(printerName) {
    this.printerName = printerName;
    this.queue = new Queue();
    this.jobId = 1;
    this.processed = [];
  }

  addJob(document, pages) {
    const job = { id: this.jobId++, document, pages, addedAt: Date.now() };
    this.queue.enqueue(job);
    console.log(`  📄 Job #${job.id} queued: "${document}" (${pages} pages)`);
  }

  processNext() {
    if (this.queue.isEmpty()) {
      console.log("  🖨️  Printer idle — no jobs in queue");
      return null;
    }
    const job = this.queue.dequeue();
    this.processed.push(job);
    console.log(`  🖨️  Printing Job #${job.id}: "${job.document}" (${job.pages} pages)`);
    return job;
  }

  processAll() {
    console.log(`\n  Starting print run on ${this.printerName}...`);
    while (!this.queue.isEmpty()) this.processNext();
    console.log(`  ✅ All jobs complete. Processed: ${this.processed.length} documents.`);
  }

  status() {
    console.log(`  Queue: ${this.queue.size} job(s) pending → ${this.queue.toString()}`);
  }
}

// ─────────────────────────────────────────────────────────────
//  USE CASE B: BFS Shortest Path in a Grid Maze
//  0 = open path, 1 = wall
//  Find shortest path from start to end using BFS
// ─────────────────────────────────────────────────────────────

function bfsMaze(grid, start, end) {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited = Array.from({ length: rows }, () => new Array(cols).fill(false));
  const parent = Array.from({ length: rows }, () => new Array(cols).fill(null));

  const queue = new Queue();
  queue.enqueue(start);
  visited[start[0]][start[1]] = true;

  const directions = [[-1,0],[1,0],[0,-1],[0,1]]; // up, down, left, right

  while (!queue.isEmpty()) {
    const [r, c] = queue.dequeue();

    if (r === end[0] && c === end[1]) {
      // Reconstruct path
      const path = [];
      let cur = end;
      while (cur) {
        path.unshift(cur);
        cur = parent[cur[0]][cur[1]];
      }
      return { found: true, path, steps: path.length - 1 };
    }

    for (const [dr, dc] of directions) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols
          && !visited[nr][nc] && grid[nr][nc] === 0) {
        visited[nr][nc] = true;
        parent[nr][nc] = [r, c];
        queue.enqueue([nr, nc]);
      }
    }
  }

  return { found: false };
}

// ─────────────────────────────────────────────────────────────
//  USE CASE C: Sliding Window Rate Limiter
//  Allow max N requests per time window (e.g., 5 requests / 10s)
// ─────────────────────────────────────────────────────────────

class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.timestamps = new Deque(); // timestamps of requests in current window
  }

  allowRequest(clientId, now = Date.now()) {
    // Remove timestamps outside the current window
    while (!this.timestamps.isEmpty() && now - this.timestamps.peekFront() > this.windowMs) {
      this.timestamps.popFront();
    }

    if (this.timestamps.size < this.maxRequests) {
      this.timestamps.pushBack(now);
      return { allowed: true, remaining: this.maxRequests - this.timestamps.size };
    }

    const resetIn = this.windowMs - (now - this.timestamps.peekFront());
    return { allowed: false, remaining: 0, retryAfterMs: resetIn };
  }
}

// ─────────────────────────────────────────────────────────────
//  DEMO
// ─────────────────────────────────────────────────────────────

console.log("═══════════════════════════════════════════════════");
console.log("  DATA STRUCTURE: QUEUE");
console.log("═══════════════════════════════════════════════════\n");

// --- Core Queue Operations ---
console.log("── Core Queue Operations ───────────────────────────");
const q = new Queue(4);
q.enqueue("A").enqueue("B").enqueue("C");
console.log("  After enqueue A,B,C:", q.toString());
console.log("  Peek front:", q.peek());
console.log("  Dequeue:", q.dequeue(), "→", q.toString());
q.enqueue("D").enqueue("E").enqueue("F"); // triggers grow
console.log("  After more enqueues:", q.toString());

// --- Deque Demo ---
console.log("\n── Deque Operations ────────────────────────────────");
const deque = new Deque();
deque.pushBack("B");
deque.pushBack("C");
deque.pushFront("A");
deque.pushBack("D");
console.log("  Deque:", deque.toString());
console.log("  Pop front:", deque.popFront(), "→", deque.toString());
console.log("  Pop back:", deque.popBack(), "→", deque.toString());

// --- Print Spooler ---
console.log("\n── Use Case A: Print Spooler ────────────────────────");
const printer = new PrintSpooler("Office HP LaserJet");
printer.addJob("Q3 Financial Report", 42);
printer.addJob("Meeting Agenda", 2);
printer.addJob("Employee Handbook", 88);
printer.addJob("Invoice #10045", 1);
printer.status();
printer.processNext();
printer.processNext();
printer.status();
printer.processAll();

// --- BFS Maze ---
console.log("\n── Use Case B: BFS Shortest Path in Maze ───────────");
const maze = [
  [0, 0, 1, 0, 0],
  [1, 0, 1, 0, 1],
  [0, 0, 0, 0, 0],
  [0, 1, 1, 1, 0],
  [0, 0, 0, 1, 0],
];
console.log("  Maze (0=open, 1=wall):");
maze.forEach((row, i) => console.log(`    Row ${i}: [${row.join(", ")}]`));

const result = bfsMaze(maze, [0, 0], [4, 4]);
if (result.found) {
  console.log(`  ✅ Path found! Steps: ${result.steps}`);
  console.log(`  Path: ${result.path.map(([r,c]) => `(${r},${c})`).join(" → ")}`);
} else {
  console.log("  ❌ No path found");
}

// --- Rate Limiter ---
console.log("\n── Use Case C: Rate Limiter (5 req / 10s) ───────────");
const limiter = new RateLimiter(5, 10000);
let t = 1000;
for (let i = 1; i <= 7; i++) {
  const res = limiter.allowRequest("user_123", t);
  const icon = res.allowed ? "✅" : "❌";
  const info = res.allowed
    ? `allowed (${res.remaining} remaining)`
    : `BLOCKED — retry in ${res.retryAfterMs}ms`;
  console.log(`  ${icon} Request ${i} at t=${t}ms: ${info}`);
  t += 500; // 500ms apart — 6 requests hit within 10s window
}
