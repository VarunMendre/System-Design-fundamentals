# 🧠 10 Key Data Structures We Use Every Day — Complete Guide

> **Series:** System Design Fundamentals  
> **Source:** [ByteByteGo — YouTube](https://youtu.be/ouipSd_5ivQ)  
> **Topic:** Essential Data Structures — Internals, Time Complexity, Use Cases & Cache Behavior

---

## Table of Contents

1. [Why Data Structures Matter](#1-why-data-structures-matter)
2. [Big O Notation — Quick Primer](#2-big-o-notation--quick-primer)
3. [Cache Friendliness — The Hidden Performance Factor](#3-cache-friendliness--the-hidden-performance-factor)
4. [Lists](#4-lists)
5. [Arrays](#5-arrays)
6. [Stacks](#6-stacks)
7. [Queues](#7-queues)
8. [Heaps](#8-heaps)
9. [Trees](#9-trees)
10. [Hash Tables](#10-hash-tables)
11. [Suffix Trees](#11-suffix-trees)
12. [Graphs](#12-graphs)
13. [R-Trees](#13-r-trees)
14. [Choosing the Right Data Structure](#14-choosing-the-right-data-structure)
15. [Quick Reference — Complexity Cheat Sheet](#15-quick-reference--complexity-cheat-sheet)
16. [Glossary](#16-glossary)
17. [Key Takeaways](#17-key-takeaways)

---

## 1. Why Data Structures Matter

A **data structure** is a way of organizing, storing, and managing data in memory so that it can be accessed and modified efficiently.

Choosing the *wrong* data structure is one of the most common sources of performance bottlenecks in software. Consider:

```
Scenario: Find if a username exists in a set of 1,000,000 users

With an Array (unsorted):    ~500,000 comparisons on average  → O(n)
With a Hash Table:           ~1 comparison                    → O(1)
With a Balanced BST:         ~20 comparisons                  → O(log n)
```

The right choice can make your code **millions of times faster** — not an exaggeration.

Data structures are the vocabulary of system design. When an interviewer asks "how would you build a leaderboard?" the answer is a **heap**. "How would you implement autocomplete?" — a **trie (prefix tree)**. "How does Google Maps find the shortest route?" — a **graph**.

---

## 2. Big O Notation — Quick Primer

Before diving into each data structure, here's a reference for time complexity notation:

| Notation | Name | Example | How it scales |
|---|---|---|---|
| **O(1)** | Constant | Hash table lookup | Doesn't grow with input size |
| **O(log n)** | Logarithmic | Binary search | Doubles input → 1 extra step |
| **O(n)** | Linear | Array scan | Doubles input → doubles time |
| **O(n log n)** | Linearithmic | Merge sort | Slightly worse than linear |
| **O(n²)** | Quadratic | Bubble sort | Doubles input → 4x time |
| **O(2ⁿ)** | Exponential | Brute-force subset enumeration | Catastrophic for large n |

```
Performance ranking (best → worst):
O(1) > O(log n) > O(n) > O(n log n) > O(n²) > O(2ⁿ)
```

---

## 3. Cache Friendliness — The Hidden Performance Factor

Modern CPUs are significantly faster than RAM. To bridge this gap, CPUs use a **cache hierarchy**:

```
CPU Core
├── L1 Cache   (~2 ns,   32–64 KB)    ← fastest, smallest
├── L2 Cache   (~7 ns,   256 KB–1 MB)
├── L3 Cache   (~30 ns,  8–32 MB)
└── Main RAM   (~90 ns,  GBs)         ← slowest, largest
```

When the CPU reads memory, it loads not just the requested byte but an entire **cache line** (~64 bytes) around it. This means data stored **contiguously in memory** gets loaded together — neighboring elements are "free" to access.

### Cache-Friendly vs Cache-Hostile

```
Array [1][2][3][4][5] — stored contiguously in memory:
  CPU loads element 1 → entire block [1,2,3,4,5] loaded into cache
  Accessing elements 2,3,4,5 → CACHE HIT ✅ (already loaded)

Linked List: Node1 → Node2 → Node3 (scattered in heap memory)
  CPU loads Node1 → only Node1 in cache
  Accessing Node2 → CACHE MISS ❌ (different memory location)
  Accessing Node3 → CACHE MISS ❌
```

| Data Structure | Cache Friendliness | Reason |
|---|---|---|
| **Arrays** | ✅ Excellent | Contiguous memory — perfect prefetching |
| **Lists (linked)** | ❌ Poor | Pointer-chased — scattered in heap |
| **Stacks (array-backed)** | ✅ Good | Contiguous memory |
| **Queues (array-backed)** | ✅ Good | Contiguous memory |
| **Hash Tables** | ⚠️ Moderate | Buckets contiguous, chained entries not |
| **Trees** | ⚠️ Moderate | Node-per-allocation — pointer chasing |
| **Graphs** | ⚠️ Variable | Adjacency list = poor; adjacency matrix = better |
| **Heaps (array-backed)** | ✅ Good | Stored as array, implicit structure |

> 💡 **This is why arrays often outperform linked lists in practice** even when Big O complexity is identical — cache misses at 90 ns each add up.

---

## 4. Lists

### What is a List?

A **list** is an ordered, dynamic collection of elements. Unlike arrays, lists don't require a fixed size upfront — they grow and shrink as needed. In most languages, the default "list" is implemented as a **dynamic array** (e.g., Python's `list`, Java's `ArrayList`) or a **linked list** (e.g., Java's `LinkedList`).

### Two Core Implementations

#### Dynamic Array (ArrayList)

```
Memory layout:
[ "Alice" | "Bob" | "Carol" | "Dave" | ___ | ___ ]
  index 0    1       2         3      (unused capacity)

When full → allocate new array of 2x size → copy all elements
```

- Access by index: **O(1)**
- Insert/delete at end: **O(1) amortized**
- Insert/delete at middle: **O(n)** (shift elements)
- Cache friendly ✅

#### Singly Linked List

```
Head → [Alice|•] → [Bob|•] → [Carol|•] → [Dave|null]
         data  next   data  next
```

- Access by index: **O(n)** (must traverse from head)
- Insert/delete at head: **O(1)**
- Insert/delete at tail: **O(n)** unless tail pointer maintained
- Cache hostile ❌

#### Doubly Linked List

```
Head ↔ [•|Alice|•] ↔ [•|Bob|•] ↔ [•|Carol|•] ↔ null
         prev data next
```

- Navigate forward and backward: **O(1)** per step
- Insert/delete at any known node: **O(1)**

### Time Complexity

| Operation | Dynamic Array | Linked List |
|---|---|---|
| Access by index | O(1) | O(n) |
| Search | O(n) | O(n) |
| Insert at end | O(1) amortized | O(1) |
| Insert at beginning | O(n) | O(1) |
| Insert at middle | O(n) | O(1) + O(n) to find |
| Delete at end | O(1) | O(n) |
| Delete at beginning | O(n) | O(1) |

### Real-World Use Cases

| Use Case | Why List |
|---|---|
| **Social media feed** | Ordered posts, dynamic additions at the top |
| **Shopping cart** | Add/remove/reorder items |
| **Task management (Trello, Jira)** | Ordered tasks, drag-to-reorder |
| **Browser DOM** | HTML elements in document order |
| **Music playlist** | Ordered, supports insert/remove/reorder |
| **OS process list** | Linked list of PCBs (Process Control Blocks) |

### When to Use What

```
Lots of random access by index?        → Dynamic Array
Lots of insert/delete at both ends?    → Doubly Linked List
Need fast insert at front only?        → Singly Linked List
General purpose ordered collection?    → Dynamic Array (better cache locality)
```

---

## 5. Arrays

### What is an Array?

An **array** is a fixed-size, contiguous block of memory where every element is of the same type and can be accessed in **O(1)** time via its index.

```
Index:  [0]    [1]    [2]    [3]    [4]
Value:  [23.5] [19.2] [31.0] [28.7] [22.1]
        ↑_________________________↑
        All stored contiguously in memory
        Address of [i] = base_address + (i × element_size)
```

Because the address of any element can be computed arithmetically, random access is always **constant time** regardless of array size.

### Multi-Dimensional Arrays

```
2D Array (image pixels — 4×4 grid):
       Col 0  Col 1  Col 2  Col 3
Row 0 [ 255 ][ 128 ][ 64  ][ 0   ]
Row 1 [ 200 ][ 180 ][ 90  ][ 45  ]
Row 2 [ 100 ][ 110 ][ 120 ][ 130 ]
Row 3 [ 50  ][ 60  ][ 70  ][ 80  ]

In memory (row-major order):
[255][128][64][0][200][180][90][45][100][110][120][130][50][60][70][80]
```

### Time Complexity

| Operation | Time |
|---|---|
| Access by index | O(1) |
| Search (unsorted) | O(n) |
| Search (sorted, binary search) | O(log n) |
| Insert at end (if space) | O(1) |
| Insert at arbitrary position | O(n) (shift) |
| Delete at arbitrary position | O(n) (shift) |

### Real-World Use Cases

| Use Case | Why Array |
|---|---|
| **Image processing** | Pixels stored in 2D arrays (height × width × RGB) |
| **Weather data** | Temperature readings indexed by timestamp |
| **Matrix math / ML** | Neural network weights stored as tensors (N-D arrays) |
| **Database buffer pools** | Fixed-size page frames in memory |
| **Video frames** | Each frame is a 2D array of pixels |
| **Ring buffers** | Circular array for streaming data |

### Arrays vs Lists — When to Choose

```
✅ Use Arrays when:
  - Size is known upfront
  - Frequent random access by index
  - Mathematical operations (matrix multiplication, etc.)
  - Maximum cache performance is required
  - Working with raw binary data / hardware-level code

✅ Use Lists when:
  - Size changes frequently
  - Many insertions/deletions at arbitrary positions
  - Don't know the size in advance
```

---

## 6. Stacks

### What is a Stack?

A **Stack** is a linear data structure that follows the **LIFO (Last-In, First-Out)** principle. Think of a stack of plates — you always add and remove from the top.

```
         │ PUSH ↓    POP ↑ │
         ┌──────────────────┐
  TOP →  │   "Step 3"       │  ← most recently added
         │   "Step 2"       │
  BOT →  │   "Step 1"       │  ← first added
         └──────────────────┘
```

### Core Operations

| Operation | Description | Time |
|---|---|---|
| **push(item)** | Add item to top | O(1) |
| **pop()** | Remove and return top item | O(1) |
| **peek()** | View top item without removing | O(1) |
| **isEmpty()** | Check if stack is empty | O(1) |

All core operations are **O(1)** — this is a feature of the constraint that you only operate at one end.

### Implementation

A stack can be backed by an **array** (better cache performance) or a **linked list** (truly dynamic, no pre-allocation).

```
Array-backed stack:
  [ "Step1" | "Step2" | "Step3" | ___ | ___ ]
                                  ↑
                              top pointer (index = 2)
  push("Step4") → top becomes index 3
  pop()         → returns "Step3", top becomes index 1
```

### Real-World Use Cases

| Use Case | How Stack is Used |
|---|---|
| **Undo/Redo (text editors, Photoshop)** | Each action pushed; undo = pop |
| **Browser back/forward navigation** | Back stack + forward stack |
| **Function call stack** | CPU call stack — each function call pushed, return = pop |
| **Expression evaluation** | Compilers parse `3 + (4 × 2)` using operator/operand stacks |
| **Balanced parentheses checker** | Push `(`, `[`, `{`; pop on matching close |
| **DFS (Depth-First Search)** | Iterative DFS uses explicit stack instead of recursion |
| **Backtracking algorithms** | Maze solving, N-Queens — track path and backtrack |

### Deep Dive: The Call Stack

Every programming language uses a stack to manage function calls:

```javascript
function c() { return 1; }
function b() { return c() + 1; }
function a() { return b() + 1; }
a();

Call Stack:
  ┌───────────────┐
  │  c()          │  ← currently executing
  │  b()          │
  │  a()          │
  │  main()       │  ← bottom
  └───────────────┘
  After c() returns:
  ┌───────────────┐
  │  b()          │  ← resumes with c()'s return value
  │  a()          │
  │  main()       │
  └───────────────┘
```

Stack overflow = call stack exceeds maximum depth (too deep recursion).

---

## 7. Queues

### What is a Queue?

A **Queue** follows the **FIFO (First-In, First-Out)** principle. Like a line at a ticket counter — first person in is first served.

```
  ENQUEUE →  [ C | B | A ] → DEQUEUE
  (rear/back)              (front)
  "Carol"    "Bob"  "Alice"   ← "Alice" dequeued first (arrived first)
```

### Core Operations

| Operation | Description | Time |
|---|---|---|
| **enqueue(item)** | Add to rear | O(1) |
| **dequeue()** | Remove from front | O(1) |
| **peek()** | View front without removing | O(1) |
| **isEmpty()** | Check if queue is empty | O(1) |

### Queue Variants

#### Circular Queue (Ring Buffer)

Array-based queue where the end wraps around to the beginning — avoids wasting space.

```
Indices:  [0] [1] [2] [3] [4]
Values:   [ C][ D][ A][ B][  ]
               ↑           ↑
             front        rear (wraps around)
```

#### Deque (Double-Ended Queue)

Supports add/remove at **both** ends — a generalization of both stack and queue.

```
← PUSH/POP    [ D | C | B | A ]    PUSH/POP →
```

Used in: sliding window algorithms, browser history (deque of pages).

#### Priority Queue

Elements dequeued in order of **priority**, not arrival time. Implemented with a **heap** (see Section 8).

```
Regular Queue:   [Task1] → [Task2] → [Task3] (order: arrival)
Priority Queue:  [CRITICAL] → [HIGH] → [LOW]  (order: priority)
```

### Real-World Use Cases

| Use Case | Why Queue |
|---|---|
| **Printer job queue** | Documents printed in order submitted |
| **Message queues (Kafka, RabbitMQ)** | Events processed in order, decouples producers/consumers |
| **CPU task scheduling (Round Robin)** | Processes in ready queue, each gets a time slice |
| **Chat message delivery** | Messages displayed in order received |
| **Web server request handling** | Requests buffered and served in order |
| **BFS (Breadth-First Search)** | Queue of nodes to visit level by level |
| **Rate limiting (token bucket)** | Request queue drains at fixed rate |

### Queues in Distributed Systems

Message queues like **Apache Kafka**, **RabbitMQ**, and **AWS SQS** are one of the most critical patterns in large-scale systems:

```
Producer         Queue              Consumer(s)
   |               |                    |
   |── Message ───►|                    |
   |── Message ───►|── Message ────────►| Worker 1
   |── Message ───►|── Message ────────►| Worker 2
                   |── Message ────────►| Worker 3

Benefits:
  - Decouples producers from consumers
  - Absorbs traffic spikes (backpressure)
  - Enables horizontal scaling of consumers
  - Messages persist if consumer is down
```

---

## 8. Heaps

### What is a Heap?

A **Heap** is a specialized **binary tree** stored as an array that satisfies the **heap property**:

- **Max-Heap:** Every parent node is ≥ its children → root is the maximum element
- **Min-Heap:** Every parent node is ≤ its children → root is the minimum element

```
Max-Heap example:
           100
          /    \
        85      90
       /  \    /  \
      70  80  60   50

Array representation: [100, 85, 90, 70, 80, 60, 50]
                         0    1   2   3   4   5   6

Parent of index i    = ⌊(i-1)/2⌋
Left child of i      = 2i + 1
Right child of i     = 2i + 2
```

The array representation makes heaps extremely **cache-friendly** — the entire structure lives in contiguous memory.

### Core Operations

| Operation | Description | Time |
|---|---|---|
| **peek()** | View min/max (root) | O(1) |
| **insert(item)** | Add item, bubble up to restore heap property | O(log n) |
| **extractMin/Max()** | Remove root, sink last element down | O(log n) |
| **heapify(array)** | Build heap from array | O(n) |
| **heapSort** | Sort using heap | O(n log n) |

### How Insert Works (Min-Heap)

```
Insert 5 into: [10, 15, 20, 30, 40]

Step 1: Add to end
  [10, 15, 20, 30, 40, 5]
                        ↑ new element

Step 2: Bubble up (swap with parent if smaller)
  Parent of index 5 = index 2 (value 20) → 5 < 20, swap
  [10, 15, 5, 30, 40, 20]

  Parent of index 2 = index 0 (value 10) → 5 < 10, swap
  [5, 15, 10, 30, 40, 20]

  At root → done. Min is now 5 ✅
```

### Real-World Use Cases

| Use Case | Why Heap |
|---|---|
| **OS task scheduler** | Always run highest-priority task next — O(log n) insert/extract |
| **Dijkstra's shortest path** | Min-heap of unvisited nodes by current distance |
| **A* pathfinding** | Priority queue of nodes by f-score |
| **Media streaming (Netflix)** | Buffer management — prioritize critical frames |
| **Hospital ER triage** | Patients sorted by severity |
| **Top-K problems** | "Find top 10 trending topics" — maintain min-heap of size K |
| **Memory allocator (buddy system)** | Free block lists organized by size |

### Heap vs Sorted Array for Priority Queue

```
Operation           Heap          Sorted Array
──────────────────────────────────────────────
Insert              O(log n)      O(n)         ← heap wins
Extract min/max     O(log n)      O(1)
Peek min/max        O(1)          O(1)
Build from array    O(n)          O(n log n)   ← heap wins
```

---

## 9. Trees

### What is a Tree?

A **Tree** is a hierarchical, non-linear data structure consisting of **nodes** connected by **edges**, with no cycles. One node is designated the **root**; every other node has exactly one parent.

```
              [Root: Company]
             /               \
     [Dept: Eng]         [Dept: Sales]
     /         \               \
[Team: FE]  [Team: BE]     [Team: NA]
   /    \        |
[Alice] [Bob] [Carol]
```

### Key Terminology

| Term | Definition |
|---|---|
| **Root** | Top node with no parent |
| **Leaf** | Node with no children |
| **Height** | Longest path from root to any leaf |
| **Depth** | Distance from root to a given node |
| **Subtree** | A node and all its descendants |
| **Degree** | Number of children a node has |

### Binary Search Tree (BST)

A binary tree where:
- Left subtree contains nodes with values **less than** the parent
- Right subtree contains nodes with values **greater than** the parent

```
         [50]
        /    \
      [30]   [70]
      /  \   /  \
    [20][40][60][80]

Search for 60:
  Start at root 50 → 60 > 50, go right
  At 70 → 60 < 70, go left
  At 60 → found! (3 comparisons, not 7)
```

| Operation | Average (Balanced) | Worst (Skewed) |
|---|---|---|
| Search | O(log n) | O(n) |
| Insert | O(log n) | O(n) |
| Delete | O(log n) | O(n) |

### Self-Balancing Trees

A plain BST degenerates to a linked list with sorted input. Self-balancing trees maintain O(log n):

| Tree Type | Mechanism | Used In |
|---|---|---|
| **AVL Tree** | Strict balance (height diff ≤ 1) | In-memory sorted maps |
| **Red-Black Tree** | Color-based relaxed balance | Java `TreeMap`, Linux kernel scheduler |
| **B-Tree** | Multi-way, disk-optimized | **Database indexes** (PostgreSQL, MySQL) |
| **B+ Tree** | B-tree + linked leaves | Most relational DB indexes |
| **Trie (Prefix Tree)** | Characters as edges | Autocomplete, spell check, DNS routing |

### B-Tree and B+ Tree — Why Databases Use Them

```
B+ Tree (order 3):
                  [30 | 60]
                 /    |    \
          [10|20] [30|40|50] [60|70|80]
            ↕        ↕           ↕
      [Linked leaf nodes for range scans]

Why B+ Tree for databases:
  1. Each node holds many keys → fewer disk reads (node = disk page)
  2. All data in leaves → predictable leaf scan for range queries
  3. Height stays very small → 3-4 levels handles billions of rows
```

### Trie (Prefix Tree)

```
Dictionary: ["can", "cat", "car", "card", "care"]

Trie:
  root
   └── c
        └── a
             ├── n (end) "can"
             ├── t (end) "cat"
             └── r (end) "car"
                  ├── d (end) "card"
                  └── e (end) "care"

Autocomplete "ca" → traverse to 'a', return all words below
```

### Real-World Use Cases

| Tree Type | Use Case |
|---|---|
| **BST / Red-Black** | Language runtime maps and sets |
| **B+ Tree** | MySQL InnoDB indexes, PostgreSQL indexes |
| **Trie** | Search autocomplete, spell checker, IP routing |
| **Segment Tree** | Range min/max queries, interval updates |
| **Fenwick Tree** | Cumulative frequency tables |
| **Decision Tree** | Machine learning classification |
| **AST (Abstract Syntax Tree)** | Compiler/interpreter parses code into tree |
| **DOM Tree** | Browser's HTML document model |
| **File system** | Directory hierarchy (inode tree) |

---

## 10. Hash Tables

### What is a Hash Table?

A **Hash Table** (also called a Hash Map or Dictionary) stores **key-value pairs** and provides **O(1) average time** for insert, lookup, and delete.

```
Key            Hash Function        Bucket Index    Value
"alice"    →  hash("alice") % 8  =      3       →  { age: 28, role: "admin" }
"bob"      →  hash("bob")   % 8  =      7       →  { age: 34, role: "user"  }
"carol"    →  hash("carol") % 8  =      1       →  { age: 25, role: "user"  }

Array of buckets:
[ 0: empty ]
[ 1: carol's data ]
[ 2: empty ]
[ 3: alice's data ]
[ 4: empty ]
[ 5: empty ]
[ 6: empty ]
[ 7: bob's data   ]
```

### Hash Functions

A good hash function must be:
1. **Deterministic** — same key always produces same hash
2. **Uniform** — distributes keys evenly across buckets
3. **Fast** — O(1) to compute
4. **Avalanche** — small key change → completely different hash

### Collision Handling

Two keys can produce the same bucket index — this is a **collision**.

#### Chaining

Each bucket holds a linked list of all entries that hash to it:

```
Bucket 3: → [alice, data] → [zara, data] → null
            (both hashed to index 3)
```

#### Open Addressing (Linear Probing)

When a collision occurs, probe the next available slot:

```
Insert "zara" → hashes to bucket 3 (occupied by alice)
  → try bucket 4 (empty) → insert here
```

### Load Factor and Rehashing

```
Load Factor = (number of entries) / (number of buckets)

If load factor > 0.75 (common threshold):
  → Allocate new array of 2x size
  → Re-hash all existing entries
  → O(n) operation, but amortized O(1) per insert
```

### Real-World Use Cases

| Use Case | How Hash Table Is Used |
|---|---|
| **Search engine index** | `{ "python": [doc1, doc3, doc7], "java": [doc2, doc5] }` |
| **Database query cache** | `{ query_hash: result_set }` — avoids re-executing same query |
| **Compiler symbol table** | `{ variable_name: type, memory_address }` |
| **Python/JS objects** | `{key: value}` literally backed by hash tables |
| **DNS cache** | `{ "google.com": "142.250.190.78" }` |
| **Session storage** | `{ session_id: user_data }` |
| **Counting word frequency** | `{ word: count }` — O(1) per word |
| **Deduplication** | Store seen items in hash set — O(1) lookup |

---

## 11. Suffix Trees

### What is a Suffix Tree?

A **Suffix Tree** is a compressed trie of all **suffixes** of a given string. It enables extremely fast pattern matching — finding if a substring exists in a text takes **O(m)** time where `m` is the length of the pattern (independent of text length `n`).

```
Text: "banana"
Suffixes:
  "banana"  (start index 0)
  "anana"   (start index 1)
  "nana"    (start index 2)
  "ana"     (start index 3)
  "na"      (start index 4)
  "a"       (start index 5)

Suffix Tree (compressed):
  root
  ├── "a" → [start:5]
  │    └── "na" → [start:3]
  │         └── "na" → [start:1]
  ├── "banana" → [start:0]
  ├── "na" → [start:4]
  │    └── "na" → [start:2]
  └── ...
```

### Time Complexity

| Operation | Time |
|---|---|
| Build suffix tree | O(n) — Ukkonen's algorithm |
| Find if pattern P exists | O(m) where m = |P| |
| Find all occurrences of P | O(m + k) where k = number of matches |
| Longest repeated substring | O(n) |
| Longest common substring | O(n + m) |

### Real-World Use Cases

| Use Case | How Suffix Tree Helps |
|---|---|
| **Text editors (Find/Replace)** | Instant search across large documents |
| **Bioinformatics** | DNA sequence matching (genome is a very long string) |
| **Plagiarism detection** | Find common substrings between documents |
| **Search engine full-text search** | Faster than naive string scanning |
| **Data compression** | Find repeated patterns (LZ77, used in gzip) |
| **Intrusion detection** | Pattern matching in network packets |

> ⚠️ **Note:** Suffix trees use **O(n)** memory which can be large. **Suffix Arrays** are a more memory-efficient alternative providing most of the same functionality.

---

## 12. Graphs

### What is a Graph?

A **Graph** is a collection of **nodes (vertices)** connected by **edges**. Unlike trees, graphs can have cycles, multiple paths between nodes, and disconnected components.

```
Undirected Graph (friendship):
   Alice --- Bob --- Carol
     |               |
   Dave ---------- Eve

Directed Graph (follows on Twitter):
   Alice → Bob
   Bob → Carol
   Carol → Alice  (cycle)
   Dave → Alice
```

### Graph Properties

| Property | Description | Example |
|---|---|---|
| **Directed / Undirected** | Edges have direction or not | Twitter (directed) vs Facebook (undirected) |
| **Weighted / Unweighted** | Edges have a cost/distance | Road map (weighted) vs friendship (unweighted) |
| **Cyclic / Acyclic** | Contains cycles or not | DAG (Directed Acyclic Graph) for task dependencies |
| **Connected / Disconnected** | All nodes reachable from any node | Social network components |
| **Dense / Sparse** | Many vs few edges relative to nodes | Road network (sparse) vs fully connected mesh (dense) |

### Graph Representations

#### Adjacency List (most common)

```javascript
graph = {
  "Alice": ["Bob", "Dave"],
  "Bob":   ["Alice", "Carol"],
  "Carol": ["Bob", "Eve"],
  "Dave":  ["Alice", "Eve"],
  "Eve":   ["Carol", "Dave"]
}
Space: O(V + E)     ← efficient for sparse graphs
```

#### Adjacency Matrix

```
       Alice Bob Carol Dave Eve
Alice [  0    1    0    1    0  ]
Bob   [  1    0    1    0    0  ]
Carol [  0    1    0    0    1  ]
Dave  [  1    0    0    0    1  ]
Eve   [  0    0    1    1    0  ]

Space: O(V²)        ← efficient for dense graphs, fast edge lookup O(1)
```

### Graph Traversal

#### BFS — Breadth-First Search

Uses a **queue**. Visits all neighbors at distance 1, then distance 2, etc. Finds **shortest path** in unweighted graphs.

```
Start: Alice
BFS order: Alice → Bob → Dave → Carol → Eve

Level 0: [Alice]
Level 1: [Bob, Dave]
Level 2: [Carol, Eve]
```

#### DFS — Depth-First Search

Uses a **stack** (or recursion). Goes as deep as possible before backtracking.

```
Start: Alice
DFS order: Alice → Bob → Carol → Eve → Dave
```

### Key Graph Algorithms

| Algorithm | Problem Solved | Time Complexity |
|---|---|---|
| **BFS** | Shortest path (unweighted), level traversal | O(V + E) |
| **DFS** | Cycle detection, topological sort, connected components | O(V + E) |
| **Dijkstra's** | Shortest path (non-negative weights) | O((V + E) log V) |
| **Bellman-Ford** | Shortest path (negative weights) | O(V × E) |
| **A\*** | Heuristic shortest path (pathfinding) | O(E log V) |
| **Prim's / Kruskal's** | Minimum Spanning Tree | O(E log V) |
| **Topological Sort** | Dependency ordering in DAG | O(V + E) |
| **Floyd-Warshall** | All-pairs shortest paths | O(V³) |

### Real-World Use Cases

| Use Case | Graph Type | Algorithm |
|---|---|---|
| **Google Maps navigation** | Weighted directed | Dijkstra / A* |
| **Facebook friend suggestions** | Undirected | BFS (find friends-of-friends) |
| **Twitter follow recommendations** | Directed | PageRank, BFS |
| **Package dependency resolution (npm)** | DAG | Topological sort |
| **Fraud detection** | Weighted | Anomaly detection on transaction graph |
| **Airline route planning** | Weighted directed | Shortest path variants |
| **Web crawling** | Directed | BFS from seed URLs |
| **Circuit board routing** | Grid graph | A* pathfinding |
| **Netflix/Spotify recommendations** | Bipartite weighted | Collaborative filtering |

---

## 13. R-Trees

### What is an R-Tree?

An **R-Tree** is a tree data structure designed for efficient **spatial queries** — operations involving geographic coordinates, rectangles, or multi-dimensional ranges. It's the data structure behind "find all restaurants within 2 km of me."

### How It Works

R-Trees organize spatial data into **nested minimum bounding rectangles (MBRs)**:

```
Root MBR: [entire map]
  ├── MBR A: [North America region]
  │    ├── MBR A1: [New York metro]
  │    │    ├── Point: [Empire State Building, lat/lng]
  │    │    ├── Point: [Central Park, lat/lng]
  │    │    └── Point: [Brooklyn Bridge, lat/lng]
  │    └── MBR A2: [Los Angeles metro]
  │         └── ...
  └── MBR B: [Europe region]
       └── ...
```

To answer "find all POIs near (lat, lng, radius r)":
1. Check if the query circle intersects root MBR → yes, descend
2. Check which child MBRs intersect the query circle
3. Only recurse into intersecting children
4. At leaf level, check exact coordinates

This **prunes** huge portions of the search space, making it far faster than checking every point.

### Time Complexity

| Operation | Average | Worst |
|---|---|---|
| Insert | O(log n) | O(n) |
| Delete | O(log n) | O(n) |
| Point query | O(log n) | O(n) |
| Range query | O(√n + k) | O(n) |

### Real-World Use Cases

| Use Case | Details |
|---|---|
| **Google Maps / Apple Maps** | Finding nearby restaurants, gas stations, POIs |
| **Uber / Lyft driver matching** | Finding drivers within radius of a rider |
| **PostGIS (PostgreSQL)** | Geospatial queries (`ST_DWithin`, `ST_Intersects`) |
| **Game collision detection** | Objects in 2D/3D space — find nearby objects |
| **CAD/GIS software** | Spatial indexing of geometric shapes |
| **COVID contact tracing** | Finding people who were spatially close |
| **Satellite imagery analysis** | Region-of-interest queries |

---

## 14. Choosing the Right Data Structure

Use this decision tree when designing a system:

```
What do you need to do most often?
│
├── Fast lookup by key?
│    └── → Hash Table (O(1) average)
│
├── Ordered data with fast search/insert/delete?
│    └── → Balanced BST / Red-Black Tree (O(log n))
│
├── Priority-based access (always get min or max)?
│    └── → Heap / Priority Queue (O(1) peek, O(log n) insert)
│
├── LIFO behavior (undo, call stack, backtracking)?
│    └── → Stack (O(1) push/pop)
│
├── FIFO behavior (task queue, message queue)?
│    └── → Queue (O(1) enqueue/dequeue)
│
├── Hierarchical / parent-child relationships?
│    └── → Tree (BST, B+Tree, Trie based on use case)
│
├── Complex relationships (many-to-many)?
│    └── → Graph
│
├── Pattern matching / substring search?
│    └── → Suffix Tree / Trie
│
├── Spatial / geographic queries?
│    └── → R-Tree / KD-Tree
│
├── Sequential access, cache performance is critical?
│    └── → Array
│
└── Dynamic ordered list with frequent insert/delete?
     └── → Linked List (if middle ops) or Dynamic Array (if end ops)
```

---

## 15. Quick Reference — Complexity Cheat Sheet

| Data Structure | Access | Search | Insert | Delete | Space |
|---|---|---|---|---|---|
| **Array** | O(1) | O(n) | O(n) | O(n) | O(n) |
| **Dynamic Array / List** | O(1) | O(n) | O(1)* | O(n) | O(n) |
| **Linked List (singly)** | O(n) | O(n) | O(1) | O(1)** | O(n) |
| **Stack** | O(n) | O(n) | O(1) | O(1) | O(n) |
| **Queue** | O(n) | O(n) | O(1) | O(1) | O(n) |
| **Hash Table** | N/A | O(1)† | O(1)† | O(1)† | O(n) |
| **BST (balanced)** | O(log n) | O(log n) | O(log n) | O(log n) | O(n) |
| **Heap** | O(1)‡ | O(n) | O(log n) | O(log n) | O(n) |
| **Trie** | O(m) | O(m) | O(m) | O(m) | O(n×m) |
| **Graph (adj. list)** | O(V+E) | O(V+E) | O(1) | O(V+E) | O(V+E) |

*O(1) amortized at end; O(n) at middle  
**O(1) given pointer to node  
†Average case; O(n) worst case (many collisions)  
‡O(1) for min/max only (root)  
m = length of key/string

---

## 16. Glossary

| Term | Definition |
|---|---|
| **Node** | A single element in a linked structure (list, tree, graph) |
| **Edge** | A connection between two nodes in a tree or graph |
| **LIFO** | Last-In, First-Out — stack behavior |
| **FIFO** | First-In, First-Out — queue behavior |
| **Heap Property** | Parent ≤ children (min-heap) or parent ≥ children (max-heap) |
| **Hash Function** | A function mapping keys to bucket indices |
| **Collision** | Two keys mapping to the same hash bucket |
| **Load Factor** | Ratio of entries to buckets in a hash table |
| **Cache Line** | Unit of data transfer between RAM and CPU cache (~64 bytes) |
| **Cache Miss** | Requested data not found in cache; must fetch from RAM |
| **Amortized O(1)** | Single operation may cost O(n) rarely, but average over many operations is O(1) |
| **Balanced Tree** | Tree where height is O(log n) — no path is much longer than another |
| **MBR** | Minimum Bounding Rectangle — tightest rectangle enclosing a set of spatial objects |
| **DAG** | Directed Acyclic Graph — directed graph with no cycles |
| **Trie** | A tree where paths from root represent strings (prefix tree) |
| **Suffix** | A trailing portion of a string; "banana" has suffixes "banana", "anana", ..., "a" |
| **Adjacency List** | Graph representation: each node stores a list of its neighbors |
| **Adjacency Matrix** | Graph representation: 2D array where `matrix[i][j]=1` means edge from i to j |

---

## 17. Key Takeaways

1. **There is no universally "best" data structure.** The best choice depends entirely on your access patterns — what operations you do most frequently and at what scale.

2. **Arrays are underrated.** Their cache-friendliness often makes them faster than theoretically superior structures for small-to-medium n. Always consider arrays before reaching for more complex structures.

3. **Hash tables are the workhorses of software.** O(1) average access makes them ideal for lookups, caches, counts, and deduplication — and they're inside almost every modern programming language's core.

4. **Heaps are the correct choice for priority queues.** Don't sort a list when you only need the minimum or maximum — a heap is O(log n) per operation vs O(n log n) sorting.

5. **Trees dominate database internals.** B+ trees are behind virtually every relational database index. Understanding them explains why queries with indexes are fast and table scans are slow.

6. **Graphs model the real world.** Social networks, maps, dependency trees, the web itself — all are graphs. BFS, DFS, Dijkstra's, and topological sort are fundamental algorithms every developer should know.

7. **Cache behavior is a practical constraint, not a theoretical one.** A linked list with O(1) theoretical insert can be slower than an array with O(n) insert in practice due to cache misses — especially for small n.

8. **Stacks and queues are patterns, not just structures.** The LIFO/FIFO pattern appears everywhere: function calls, undo systems, job queues, BFS/DFS traversal, message brokers.

9. **Spatial data needs spatial structures.** Using a hash table or BST for "find all nearby restaurants" is the wrong tool. R-Trees (or KD-Trees) exist precisely for this and are orders of magnitude faster.

10. **Know the worst case, not just the average.** Hash tables are O(1) average but O(n) worst case (all keys collide). In adversarial or high-stakes environments, this matters.

---

> 📂 **See also:** The `implementations/` folder contains working JavaScript implementations of all 10 data structures with realistic sample use cases.

---

> 📚 **Continue Learning:**
> - [Visualgo — Algorithm Visualizations](https://visualgo.net/)
> - [Big-O Cheat Sheet](https://www.bigocheatsheet.com/)
> - [CLRS — Introduction to Algorithms](https://mitpress.mit.edu/9780262046305/)
> - [ByteByteGo Newsletter](https://blog.bytebytego.com)

---

*Guide based on ByteByteGo's "10 Key Data Structures We Use Every Day" and extended with additional depth.*
