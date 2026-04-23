# ⚡ Latency Numbers Every Programmer Should Know

> **Series:** System Design Fundamentals — Crash Course #5  
> **Source:** [ByteByteGo — YouTube](https://youtu.be/FqR5vESuKe0)  
> **Topic:** Latency Numbers — From CPU Registers to Intercontinental Networks

---

## Table of Contents

1. [Why Latency Intuition Matters](#1-why-latency-intuition-matters)
2. [Time Units — A Quick Primer](#2-time-units--a-quick-primer)
3. [The Latency Spectrum — Overview](#3-the-latency-spectrum--overview)
4. [Sub-Nanosecond — CPU Registers & Clock Cycles](#4-sub-nanosecond--cpu-registers--clock-cycles)
5. [1–10 Nanoseconds — L1/L2 Cache](#5-110-nanoseconds--l1l2-cache)
6. [10–100 Nanoseconds — L3 Cache & Main Memory](#6-10100-nanoseconds--l3-cache--main-memory)
7. [100–1000 Nanoseconds — System Calls & Hashing](#7-1001000-nanoseconds--system-calls--hashing)
8. [1–10 Microseconds — Context Switching & Memory Copy](#8-110-microseconds--context-switching--memory-copy)
9. [10–100 Microseconds — HTTP Proxies, Memory Reads, SSD Reads](#9-10100-microseconds--http-proxies-memory-reads-ssd-reads)
10. [100–1000 Microseconds — SSD Writes, Intra-Zone Network, Redis/Memcache](#10-1001000-microseconds--ssd-writes-intra-zone-network-redismemcache)
11. [1–10 Milliseconds — Inter-Zone Network & HDD Seek](#11-110-milliseconds--inter-zone-network--hdd-seek)
12. [10–100 Milliseconds — Wide-Area Networks & Large Memory Reads](#12-10100-milliseconds--wide-area-networks--large-memory-reads)
13. [100–1000 Milliseconds — bcrypt, TLS Handshake, Intercontinental Networks](#13-1001000-milliseconds--bcrypt-tls-handshake-intercontinental-networks)
14. [Over 1 Second — Large Data Transfers](#14-over-1-second--large-data-transfers)
15. [Comparative Analysis — What's Relatively Slow?](#15-comparative-analysis--whats-relatively-slow)
16. [Practical Implications for System Design](#16-practical-implications-for-system-design)
17. [What Changes Over Time vs. What Doesn't](#17-what-changes-over-time-vs-what-doesnt)
18. [Quick Reference — Master Latency Table](#18-quick-reference--master-latency-table)
19. [Glossary](#19-glossary)
20. [Key Takeaways](#20-key-takeaways)

---

## 1. Why Latency Intuition Matters

In system design, you frequently make decisions like:

- *"Should I cache this in Redis or just re-query the database?"*
- *"Is it worth keeping this data in memory or is SSD fast enough?"*
- *"Can I afford a TLS handshake on every request?"*

These decisions are nearly impossible to make well without a **gut feeling for latency numbers**. You don't need to memorize exact figures — you need to know **orders of magnitude**.

Knowing that:
- An SSD read is ~**1000x slower** than reading from L1 cache
- A network round trip across continents is ~**1,000,000x slower** than a CPU register access
- HDD seek is ~**50x slower** than SSD read

...gives you the intuition to architect systems that perform well under real-world conditions.

> 💡 **The goal isn't precision — it's magnitude awareness.**  
> Being off by 2x doesn't matter. Being off by 1000x does.

---

## 2. Time Units — A Quick Primer

Before diving in, let's anchor the units:

| Unit | Symbol | Value | Analogy |
|---|---|---|---|
| **Nanosecond** | ns | $10^{-9}$ seconds (0.000000001 s) | Time for light to travel ~30 cm |
| **Microsecond** | μs | $10^{-6}$ seconds (0.000001 s) | 1,000 nanoseconds |
| **Millisecond** | ms | $10^{-3}$ seconds (0.001 s) | 1,000 microseconds |
| **Second** | s | 1 second | Human blink ≈ 150–400 ms |

```
1 second
= 1,000 milliseconds (ms)
= 1,000,000 microseconds (μs)
= 1,000,000,000 nanoseconds (ns)
```

---

## 3. The Latency Spectrum — Overview

Here's the full picture at a glance before we deep-dive each range:

```
FAST ◄────────────────────────────────────────────────────────────► SLOW

Sub-ns    1-10ns   10-100ns  100ns-1μs  1-10μs  10-100μs  100μs-1ms  1-10ms  10-100ms  100ms-1s  >1s
  │          │         │          │         │        │          │         │         │          │      │
CPU       L1/L2      L3/       Syscall/   Thread   Nginx/    SSD write  HDD     WAN RTT   bcrypt/  1GB
Register  cache     Main       MD5 hash   switch   1MB mem   Redis get  seek    (US-EU)   TLS HS  transfer
access             memory                          SSD read  intra-zone                  SSD 1GB
```

---

## 4. Sub-Nanosecond — CPU Registers & Clock Cycles

**Range:** `< 1 ns`

| Operation | Approximate Latency |
|---|---|
| CPU register access | < 1 ns |
| Single CPU clock cycle (modern CPU @ ~3 GHz) | ~0.3 ns |

### What's a CPU Register?

A **register** is a tiny, ultra-fast storage slot directly inside the CPU — no memory bus required. Modern CPUs have a few dozen registers (e.g., `rax`, `rbx`, `rcx` in x86-64). Operations that read/write registers happen within a single clock cycle.

At 3 GHz, one clock cycle = **0.33 nanoseconds** — this is the absolute floor of computational speed.

> 🔑 **Key point:** Everything else in this list is *slower* than this. Use this as your baseline.

---

## 5. 1–10 Nanoseconds — L1/L2 Cache

**Range:** `1 ns – 10 ns`

| Operation | Approximate Latency |
|---|---|
| L1 cache access | ~1–2 ns |
| L2 cache access | ~4–10 ns |
| Branch mispredict penalty | ~5–20 CPU cycles (~2–7 ns) |

### CPU Cache Hierarchy

Modern CPUs have **multiple levels of cache** to bridge the speed gap between registers and main memory:

```
CPU Core
├── Registers        (< 1 ns)      ← fastest, few KB
├── L1 Cache         (~1-2 ns)     ← per-core, ~32–64 KB
├── L2 Cache         (~4-10 ns)    ← per-core, ~256 KB – 1 MB
├── L3 Cache         (~20-40 ns)   ← shared across cores, ~8–32 MB
└── Main Memory RAM  (~60-100 ns)  ← GBs, but much slower
```

### Branch Misprediction

Modern CPUs use **branch prediction** — they speculatively execute the likely next instruction before the condition is resolved. When they guess wrong, the pipeline must be flushed, costing **~5–20 CPU cycles**.

This is why tight inner loops with unpredictable conditionals are notoriously hard to optimize.

---

## 6. 10–100 Nanoseconds — L3 Cache & Main Memory

**Range:** `10 ns – 100 ns`

| Operation | Approximate Latency |
|---|---|
| L3 cache access | ~20–40 ns |
| Main memory (RAM) access — Apple M1 | ~80–100 ns |
| Main memory (RAM) access — typical x86 | ~60–100 ns |

### Key Insight: Main Memory is Surprisingly Slow

RAM is **hundreds of times slower** than CPU registers. This is called the **Memory Wall** — the CPU can execute instructions far faster than it can fetch data from RAM.

This is why:
- **CPU caches exist** — to keep frequently accessed data close to the CPU
- **Cache-friendly data structures** (arrays > linked lists) matter
- **NUMA (Non-Uniform Memory Access)** matters in multi-socket servers

```
CPU Register:   < 1 ns   ▓
L1 Cache:       ~2 ns    ▓▓
L2 Cache:       ~7 ns    ▓▓▓▓▓▓▓
L3 Cache:       ~30 ns   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
Main Memory:    ~90 ns   ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
```

---

## 7. 100–1000 Nanoseconds — System Calls & Hashing

**Range:** `100 ns – 1 μs`

| Operation | Approximate Latency |
|---|---|
| Linux system call (trap into kernel + return) | ~200–400 ns |
| MD5 hash of a 64-bit number | ~200 ns |

### What is a System Call?

A **system call** is how a user-space program requests a privileged operation from the OS kernel (e.g., reading a file, opening a socket, allocating memory via `mmap`).

The process:
```
User program calls read()
→ CPU switches to kernel mode (trap)
→ Kernel validates + executes
→ CPU switches back to user mode
→ Return to program
```

This context switch costs ~200–400 ns — *even before* the actual I/O happens. This is why **syscall overhead matters** in high-performance systems, and why techniques like **io_uring** (Linux) or **kernel bypass networking** (DPDK) are used to minimize it.

### MD5 Hashing

MD5 on a small value (~64-bit) takes ~200 ns — fast, but not free. Worth noting if you're hashing millions of keys per second in a hot path.

---

## 8. 1–10 Microseconds — Context Switching & Memory Copy

**Range:** `1 μs – 10 μs`

| Operation | Approximate Latency |
|---|---|
| Linux thread context switch (best case) | ~2–5 μs |
| Copying 64 KB within main memory | ~2–5 μs |

> At this range, operations are ~**1,000x slower** than CPU register access.

### Thread Context Switch

A **context switch** happens when the OS scheduler pauses one thread and resumes another. The cost involves:

1. Saving the current thread's CPU registers and stack pointer
2. Loading the next thread's registers and stack pointer
3. Potentially flushing CPU caches (TLB invalidation)

**Best case:** ~2–5 μs (data already in cache)  
**Worst case:** Can be **much higher** if the new thread's memory pages aren't in cache, triggering cache misses and page faults.

This is why **goroutines** (Go), **async/await** (Python, JavaScript), and **green threads** are preferred over OS threads for high-concurrency workloads — they avoid expensive OS context switches.

### Copying 64 KB in Memory

Moving 64 KB between locations in RAM takes a few microseconds — relevant when thinking about buffer sizes, serialization, and data copying in tight loops.

---

## 9. 10–100 Microseconds — HTTP Proxies, Memory Reads, SSD Reads

**Range:** `10 μs – 100 μs`

| Operation | Approximate Latency |
|---|---|
| Nginx processing a typical HTTP request | ~50 μs |
| Reading 1 MB sequentially from main memory | ~50 μs |
| SSD random read of an 8 KB page | ~100 μs |

### Nginx HTTP Request Processing

Processing an HTTP request through a reverse proxy like Nginx (parsing headers, routing, connection handling) costs ~50 μs. This is the raw proxy overhead — not counting network transit or backend processing.

For a service doing 100,000 req/sec, that's 5 seconds of CPU time per second — **critical to keep in mind** when designing proxy chains or middleware stacks.

### Sequential 1 MB Memory Read

Reading 1 MB sequentially from RAM takes ~50 μs. Note that this is *sequential* — random access of the same total data would be far worse due to cache misses.

### SSD Random Read (8 KB Page)

An SSD takes ~100 μs to read a single random 8 KB page. This is the I/O cost you incur when your database performs an index lookup or page fetch.

> 💡 **Why 8 KB?** Most databases (PostgreSQL, MySQL InnoDB) use 8 KB or 16 KB as their internal page size — one SSD read per page access on a cache miss.

---

## 10. 100–1000 Microseconds — SSD Writes, Intra-Zone Network, Redis/Memcache

**Range:** `100 μs – 1 ms`

| Operation | Approximate Latency |
|---|---|
| SSD write latency (8 KB page) | ~500 μs – 1 ms |
| Intra-zone network RTT (same cloud availability zone) | ~100–300 μs |
| Redis / Memcache GET (including network RTT) | ~500 μs – 1 ms |

### SSD Writes vs. Reads

SSD writes are ~**5–10x slower** than reads, primarily because:
- NAND flash can only write to **erased blocks**
- Write amplification — data must sometimes be moved to free up blocks
- Write endurance management adds overhead

This asymmetry matters for **write-heavy workloads** (logging, analytics ingestion) where SSD write throughput and latency become bottlenecks.

### Intra-Zone Cloud Network

Machines in the **same cloud availability zone** (e.g., two EC2 instances in `us-east-1a`) can communicate with RTTs of **under 300 μs**, and often under 100 μs on modern infrastructure.

This is fast enough that a microservice calling another microservice in the same zone adds only sub-millisecond overhead per hop.

### Redis / Memcache GET

A Redis GET request (~1 ms) includes:
- Client-side serialization
- Network RTT (typically intra-zone)
- Redis command execution (~microseconds)
- Network return trip
- Client-side deserialization

~1 ms is the end-to-end cost. For comparison, a database query fetching the same data might be 10–100ms — Redis is **10–100x faster** for cache hits.

---

## 11. 1–10 Milliseconds — Inter-Zone Network & HDD Seek

**Range:** `1 ms – 10 ms`

| Operation | Approximate Latency |
|---|---|
| Inter-zone network RTT (different AZs, same region) | ~1–5 ms |
| HDD mechanical seek time | ~5–10 ms |

### Inter-Zone vs. Intra-Zone

| Type | Example | Typical RTT |
|---|---|---|
| Intra-zone | us-east-1a → us-east-1a | < 1 ms |
| Inter-zone | us-east-1a → us-east-1b | ~1–5 ms |
| Inter-region | us-east-1 → us-west-2 | ~60–80 ms |

This is why **replication across availability zones** (for fault tolerance) has a measurable latency cost, and why some systems use **synchronous replication within a zone** but **asynchronous replication across zones**.

### HDD Seek Time

A hard disk drive's **read/write arm must physically move** to the correct track before data can be read. This mechanical movement takes ~5–10 ms — compared to SSDs which have **no moving parts**.

```
HDD Seek:  ~5 ms   ████████████████████████████████████████████████████
SSD Read:  ~0.1 ms ██
```

HDDs are ~50x slower for random access. They're still used for **bulk sequential storage** (backups, cold storage) where the seek time matters less because reads are sequential.

---

## 12. 10–100 Milliseconds — Wide-Area Networks & Large Memory Reads

**Range:** `10 ms – 100 ms`

| Operation | Approximate Latency |
|---|---|
| US East Coast → US West Coast (RTT) | ~60–80 ms |
| US East Coast → Europe (RTT) | ~70–100 ms |
| Reading 1 GB sequentially from main memory | ~10–30 ms |

### Network Latency is Governed by Physics

The speed of light in fiber optic cable is roughly **200,000 km/s** (about 2/3 the speed of light in vacuum).

```
New York → Los Angeles ≈ 4,500 km
Theoretical minimum: 4,500 / 200,000 = 22.5 ms (one way)
Round trip minimum: ~45 ms
Actual RTT (with routing overhead): ~60–80 ms
```

You **cannot beat the speed of light**. This is why geographic proximity of your servers to your users matters, and why **CDNs** exist — to cache content closer to users.

### Reading 1 GB from RAM

Despite RAM being fast at the nanosecond scale per access, reading **1 gigabyte sequentially** takes tens of milliseconds simply due to the sheer volume of data. This matters for:
- Large in-memory sorts
- JVM garbage collection (scanning the heap)
- Full table scans of in-memory datasets

---

## 13. 100–1000 Milliseconds — bcrypt, TLS Handshake, Intercontinental Networks

**Range:** `100 ms – 1 s`

| Operation | Approximate Latency |
|---|---|
| bcrypt password hashing | ~300 ms |
| TLS handshake (full) | ~250–500 ms |
| US West Coast → Singapore (RTT) | ~150–200 ms |
| Reading 1 GB sequentially from SSD | ~200–500 ms |

### bcrypt — Intentionally Slow

bcrypt is a **deliberately slow** password hashing algorithm, designed to make brute-force attacks computationally expensive.

At ~300 ms per hash:
- An attacker trying 1 billion passwords would need **~9.5 years** on a single machine
- Your login endpoint: budget 300 ms for the password check (run it in a thread pool, never the main event loop)
- **Never use MD5 or SHA-1 for passwords** — at ~200 ns each, they're 1.5 million times faster to brute-force

### TLS Handshake

Establishing a secure HTTPS connection requires a **TLS handshake** before any application data flows:

```
Client                          Server
  |──── ClientHello ──────────────►|
  |◄─── ServerHello + Certificate ─|
  |──── Key Exchange ─────────────►|
  |◄─── Finished ──────────────────|
  |──── Finished ─────────────────►|
  |         [Encrypted data now]   |
```

Each round trip adds latency based on geographic distance. A US-to-Singapore handshake can take 500+ ms just for the TLS setup — before a single byte of useful data is exchanged.

**Mitigations:**
- **TLS session resumption** — skip the full handshake for returning clients
- **TLS 1.3** — reduces handshake to 1 RTT (vs 2 RTT in TLS 1.2)
- **HTTP/2 + connection multiplexing** — amortize the handshake cost over many requests

### Reading 1 GB from SSD

A full gigabyte sequential read from SSD takes several hundred milliseconds — fast compared to HDD (~3–4 seconds), but still slow for latency-sensitive paths.

---

## 14. Over 1 Second — Large Data Transfers

**Range:** `> 1 s`

| Operation | Approximate Latency |
|---|---|
| Transferring 1 GB over network (same cloud region) | ~10 seconds |

### Why So Slow?

Even within the same data center, transferring 1 GB over a typical 1 Gbps network link takes:

```
1 GB = 8 Gb
8 Gb / 1 Gbps = 8 seconds
(Plus protocol overhead → ~10 seconds)
```

For **10 Gbps** links (increasingly common in modern cloud): ~1 second.  
For **100 Gbps** links (high-end): ~0.1 seconds.

This matters for:
- **Database backups and snapshots** — moving large files
- **Microservice payloads** — avoid transferring large blobs over APIs
- **Data pipeline design** — keep data processing co-located with storage

---

## 15. Comparative Analysis — What's Relatively Slow?

One of the most valuable exercises is comparing operations you might consider "equivalent":

### Memory Hierarchy Comparison

```
CPU Register:   < 1 ns    (baseline)
L1 Cache:       ~2 ns     → 2x slower than register
L2 Cache:       ~7 ns     → 7x slower than register
L3 Cache:       ~30 ns    → 30x slower than register
Main Memory:    ~90 ns    → 90x slower than register
SSD (8KB read): ~100 μs   → 100,000x slower than register
HDD (seek):     ~5 ms     → 5,000,000x slower than register
```

### Storage vs. Network

| Operation | Latency | Comparison |
|---|---|---|
| SSD random read (8 KB) | ~100 μs | Baseline |
| SSD write (8 KB) | ~1 ms | 10x slower than SSD read |
| HDD seek | ~5 ms | 50x slower than SSD read |
| Intra-zone network RTT | ~200 μs | 2x slower than SSD read |
| Inter-zone RTT | ~3 ms | 30x slower than SSD read |
| Cross-country RTT | ~70 ms | 700x slower than SSD read |

### Cache vs. Database

| Data source | Latency | Relative speed |
|---|---|---|
| L1 cache (CPU) | ~2 ns | 1x (fastest) |
| Main memory | ~90 ns | 45x slower |
| Redis GET (same zone) | ~1 ms | 500,000x slower |
| PostgreSQL query (simple, indexed) | ~5–20 ms | up to 10,000,000x slower |
| PostgreSQL query (full table scan) | ~100+ ms | astronomical |

---

## 16. Practical Implications for System Design

### 1. Cache Aggressively — The Gap is Enormous

The latency difference between serving from memory vs. hitting a database is 3–6 orders of magnitude. Even a Redis cache (which adds network overhead) is 10–100x faster than a DB query.

```
Rule of thumb: If a piece of data is read frequently and changes infrequently → cache it.
```

### 2. Avoid Cross-Region Synchronous Calls in Hot Paths

A synchronous call from US to Singapore adds 150–200 ms *minimum* to every request. If your SLA is 200 ms total, a single cross-region call blows the entire budget.

```
Design principle: Synchronous cross-region calls → almost always wrong in a hot path.
Use async replication, regional read replicas, or CDN caching instead.
```

### 3. SSD is Not "Fast Enough to Ignore"

SSD reads are ~100 μs — 100x slower than RAM reads for the same data size. At 100,000 DB queries/sec, with each needing even one SSD page fetch → 10 CPU-seconds of I/O wait per real second. **Buffer pools and in-memory caches in databases exist for this reason.**

### 4. TLS Handshake Cost Justifies Connection Reuse

At 250–500 ms per handshake, reusing connections (HTTP keep-alive, connection pooling) is **not optional** for performance. A fresh TLS handshake per request would cap you at 2–4 requests/second per connection.

### 5. bcrypt Belongs in a Thread Pool

At 300 ms per call, running bcrypt on your main event loop (Node.js, Python asyncio) would block the entire server for 300 ms per login attempt. Always run it in a dedicated thread/worker pool.

### 6. HDD is Only Appropriate for Sequential Workloads

For random access patterns, HDD's 5 ms seek time makes it unacceptable for anything latency-sensitive. Use HDD only for cold storage, backups, or large sequential scans where the seek overhead is amortized.

---

## 17. What Changes Over Time vs. What Doesn't

Not all latency numbers evolve at the same rate:

| Category | Trend | Reason |
|---|---|---|
| **CPU cache latencies** | Slowly improving | Better chip architecture, larger caches |
| **SSD latencies** | Improving (NVMe SSDs ~10x faster than SATA) | Flash technology advancement |
| **HDD seek time** | Barely changing | Physical/mechanical limits nearly reached |
| **RAM latency** | Marginally improving | Constrained by physics of DRAM |
| **Intra-datacenter network** | Improving (25G/100G links common) | Infrastructure investment |
| **Cross-country/ocean network RTT** | Essentially fixed | **Speed of light in fiber — cannot change** |
| **TLS handshake** | Improving (TLS 1.3, session resumption) | Protocol improvements |
| **bcrypt** | Fixed by design | Intentionally kept slow |

> 🔑 **Key Insight:** Geographic network latency is **permanently bounded by physics**. No engineering breakthrough will make a New York → London round trip take less than ~35 ms (the theoretical minimum at speed of light). Every other category has room to improve.

---

## 18. Quick Reference — Master Latency Table

| Range | Operation | Latency | Notes |
|---|---|---|---|
| **< 1 ns** | CPU register access | ~0.3 ns | Absolute floor |
| **< 1 ns** | CPU clock cycle (3 GHz) | ~0.3 ns | |
| **1–10 ns** | L1 cache access | ~1–2 ns | |
| **1–10 ns** | L2 cache access | ~4–10 ns | |
| **1–10 ns** | Branch mispredict penalty | ~2–7 ns | 5–20 CPU cycles |
| **10–100 ns** | L3 cache access | ~20–40 ns | |
| **10–100 ns** | Main memory (RAM) access | ~60–100 ns | 90–100x slower than registers |
| **100 ns – 1 μs** | Linux system call | ~200–400 ns | Kernel trap overhead only |
| **100 ns – 1 μs** | MD5 hash (64-bit number) | ~200 ns | |
| **1–10 μs** | Linux thread context switch | ~2–5 μs | Best case |
| **1–10 μs** | Copy 64 KB in memory | ~2–5 μs | |
| **10–100 μs** | Nginx HTTP request processing | ~50 μs | Proxy overhead only |
| **10–100 μs** | Read 1 MB from RAM sequentially | ~50 μs | |
| **10–100 μs** | SSD random read (8 KB page) | ~100 μs | |
| **100 μs – 1 ms** | SSD write (8 KB page) | ~500 μs – 1 ms | 5–10x slower than read |
| **100 μs – 1 ms** | Intra-zone cloud network RTT | ~100–300 μs | Same availability zone |
| **100 μs – 1 ms** | Redis / Memcache GET | ~500 μs – 1 ms | Includes network RTT |
| **1–10 ms** | Inter-zone cloud network RTT | ~1–5 ms | Different AZ, same region |
| **1–10 ms** | HDD seek time | ~5–10 ms | Mechanical arm movement |
| **10–100 ms** | US East ↔ West Coast RTT | ~60–80 ms | |
| **10–100 ms** | US East ↔ Europe RTT | ~70–100 ms | |
| **10–100 ms** | Read 1 GB from RAM sequentially | ~10–30 ms | |
| **100 ms – 1 s** | bcrypt password hash | ~300 ms | Intentionally slow |
| **100 ms – 1 s** | TLS handshake (full) | ~250–500 ms | Distance-dependent |
| **100 ms – 1 s** | US West ↔ Singapore RTT | ~150–200 ms | |
| **100 ms – 1 s** | Read 1 GB from SSD sequentially | ~200–500 ms | |
| **> 1 s** | Transfer 1 GB over network (same region) | ~10 s | On 1 Gbps link |

---

## 19. Glossary

| Term | Definition |
|---|---|
| **CPU Register** | Tiny, ultra-fast storage directly inside the CPU core |
| **L1 / L2 / L3 Cache** | Levels of CPU cache — each level is larger and slower than the previous |
| **Cache Hit / Miss** | Hit: data found in cache (fast). Miss: data not in cache, must fetch from slower storage |
| **Branch Prediction** | CPU technique of speculatively executing the likely next instruction before a condition resolves |
| **System Call (syscall)** | A request from user-space code to the OS kernel for a privileged operation |
| **Context Switch** | Pausing one thread/process and resuming another; involves saving/restoring CPU state |
| **SSD (Solid State Drive)** | Non-volatile flash storage; no moving parts; much faster random access than HDD |
| **HDD (Hard Disk Drive)** | Magnetic storage with a mechanical arm; slow random access due to seek time |
| **RTT (Round Trip Time)** | Time for a packet to travel to a destination and return |
| **Intra-zone** | Within the same cloud availability zone (e.g., two instances in `us-east-1a`) |
| **Inter-zone** | Between different availability zones within the same cloud region |
| **TLS Handshake** | Protocol negotiation to establish a secure encrypted connection |
| **bcrypt** | Deliberately slow password hashing function to resist brute-force attacks |
| **Anycast** | Multiple servers share one IP; traffic routed to nearest node |
| **NUMA** | Non-Uniform Memory Access — memory access time depends on which CPU socket the memory is attached to |
| **NVMe** | Modern SSD interface (via PCIe) that is ~5–10x faster than older SATA SSDs |
| **io_uring** | Linux async I/O interface that minimizes system call overhead |

---

## 20. Key Takeaways

1. **Develop magnitude intuition, not memorized precision.** Knowing that RAM is 100x slower than L1 cache is more useful than knowing the exact nanosecond count.

2. **The memory hierarchy is a performance cliff.** Moving from registers → L1 → L2 → L3 → RAM → SSD → HDD → Network is a series of 10–1000x jumps at each step.

3. **Geographic network latency is bounded by physics.** You can't engineer around the speed of light — place services and data close to users.

4. **Caching is the most impactful optimization.** The gap between serving from memory vs. database is massive. Even a networked cache (Redis) is 10–100x faster than a DB.

5. **Writes are almost always slower than reads.** True for SSDs, databases, and most storage systems. Design write paths accordingly.

6. **TLS and bcrypt are expensive — by design or by physics.** TLS: use session resumption and TLS 1.3. bcrypt: always run off the main thread.

7. **HDD is effectively dead for latency-sensitive random I/O.** Use SSD (NVMe ideally) for anything that needs random access. HDD = cold storage only.

8. **Context switching and system calls are not free.** High-concurrency systems avoid OS threads and excessive syscalls — this is the reason for async I/O, coroutines, and kernel-bypass networking.

9. **Technology changes some latencies — not all.** SSD and network latencies improve with hardware investment. Cross-continent RTT is physically fixed.

10. **These numbers are your calibration tool.** When someone says "it's just one extra network call" — you now know that could be 70 ms. When someone says "it's in memory" — you know the difference between L1 cache and RAM-backed Redis.

---

> 📚 **Continue Learning:**
> - [ByteByteGo Newsletter](https://blog.bytebytego.com) — System Design deep dives
> - [Latency Numbers Every Programmer Should Know](https://github.com/sirupsen/napkin-math) — napkin-math by sirupsen
> - [Colin Scott's Interactive Latency Visualizer](https://colin-scott.github.io/personal_website/research/interactive_latency.html) — See how latencies have changed over the years
> - [What Every Programmer Should Know About Memory](https://people.freebsd.org/~lstewart/articles/cpumemory.pdf) — Ulrich Drepper's classic paper

---

*Guide based on ByteByteGo's "Latency Numbers Every Programmer Should Know: Crash Course System Design #5"*
