# 🧠 System Design Fundamentals: Memory & Storage

## 📌 Overview
This note covers the fundamentals of **computer memory and storage systems**, their types, characteristics, and real-world relevance in backend/system design.

---

## 🧩 Types of Memory & Storage

```
Memory & Storage
├── Memory
│   ├── RAM
│   │   ├── SRAM (CPU Cache)
│   │   └── DRAM
│   │       ├── SDRAM
│   │       ├── DDR4 / DDR5
│   │       └── GDDR
│   └── ROM
│       ├── Firmware
│       └── BIOS
└── Storage
    ├── HDD
    ├── SSD
    │   └── NVMe
    ├── USB Drive
    └── SD Card
```

---

## ⚡ RAM vs ROM

### 🟢 RAM (Random Access Memory)
- Temporary memory used while programs are running
- Volatile → data lost when power is off
- Very fast access
- Used for:
  - Running applications
  - Storing active data

👉 Backend relevance:
- Server memory (Node.js runtime, variables, caching layer)

---

### 🔵 ROM (Read Only Memory)
- Permanent memory
- Non-volatile → retains data without power
- Stores critical startup instructions

#### Key Components:
- **Firmware** → controls hardware communication
- **BIOS** → initializes system and loads OS

👉 Backend relevance:
- Low-level system initialization (not directly used in apps but important for infra understanding)

---

## 🚀 Types of RAM

### 🔸 SRAM (Static RAM)
- Extremely fast
- Expensive
- Used in CPU cache (L1, L2, L3)

👉 Insight:
- Helps CPU access frequently used data quickly

---

### 🔸 DRAM (Dynamic RAM)
- Slower than SRAM
- Cheaper
- Needs constant refreshing

#### Evolution of DRAM:
- FPM DRAM
- EDO DRAM
- SDRAM
- DDR SDRAM

#### Modern Types:
- **DDR4 / DDR5** → main system memory
- **GDDR** → used in GPUs (parallel processing)

👉 Backend relevance:
- Server RAM uses DDR
- GPU memory used in AI/ML workloads

---

## 💾 Storage Systems

### 🟡 HDD (Hard Disk Drive)
- Uses spinning magnetic disks
- High capacity
- Low cost
- Slow performance

👉 Use cases:
- Archives, backups

---

### 🟢 SSD (Solid State Drive)
- Uses NAND flash memory
- Much faster than HDD
- No moving parts → more durable

👉 Use cases:
- Databases
- Backend servers

---

### ⚡ NVMe (High-Speed SSD Interface)
- Uses PCIe lanes (direct CPU connection)
- Very low latency
- Extremely high speed

👉 Insight:
- Faster than SATA SSD
- Critical for high-performance systems

---

## 📦 Portable Storage

### 🔹 USB Flash Drive
- Portable
- Plug-and-play
- Used for quick file transfer

### 🔹 SD Cards
- Used in phones, cameras
- Types: SD, microSD, miniSD

---

## 🔥 Key Concepts to Remember

- RAM = Fast + Temporary
- ROM = Permanent + Startup logic
- SRAM vs DRAM = Speed vs Cost tradeoff
- SSD >> HDD in performance
- NVMe = Game changer in storage speed

---

## 🧠 System Design Insights (Important)

### 1. Why Memory Matters
- Faster memory → faster application performance
- Example: In-memory caching (Redis)

### 2. Why Storage Matters
- Impacts:
  - Database performance
  - API response time

### 3. Real Backend Example

Without cache:
- API → DB → Response (slow)

With cache:
- API → RAM (fast) → Response

---

## 📊 DRAM Evolution Timeline

| Generation | Description | Improvement |
|-----------|------------|------------|
| FPM DRAM | Early DRAM | Basic memory |
| EDO DRAM | Improved DRAM | Faster access |
| SDRAM | Synchronized | Better efficiency |
| DDR SDRAM | Double transfer | Higher speed |
| DDR4/DDR5 | Modern RAM | High performance |

---

## 🎯 Final Takeaway

- Memory = Speed
- Storage = Capacity
- System design = Balancing both

👉 As a backend developer:
- Use RAM smartly (caching)
- Choose storage wisely (SSD/NVMe for performance)

---

## 📌 Next Step
Try implementing:
- Basic caching using Redis in Node.js
- Measure response time improvement 🚀
