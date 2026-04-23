# 🌐 Everything You Need to Know About DNS

> **Series:** System Design Fundamentals — Crash Course #4  
> **Source:** [ByteByteGo — YouTube](https://youtu.be/27r4Bzuj5NQ)  
> **Topic:** Domain Name System (DNS) — Architecture, Query Flow, TTL, and Best Practices

---

## Table of Contents

1. [What is DNS?](#1-what-is-dns)
2. [Why DNS Exists — The Problem It Solves](#2-why-dns-exists--the-problem-it-solves)
3. [Key Players in DNS](#3-key-players-in-dns)
   - 3.1 [DNS Resolver](#31-dns-resolver)
   - 3.2 [Root Name Servers](#32-root-name-servers)
   - 3.3 [TLD Name Servers](#33-tld-name-servers-top-level-domain)
   - 3.4 [Authoritative Nameservers](#34-authoritative-nameservers)
4. [DNS Hierarchy — The Big Picture](#4-dns-hierarchy--the-big-picture)
5. [How a DNS Query Works — Step by Step](#5-how-a-dns-query-works--step-by-step)
6. [DNS Caching — Multiple Layers](#6-dns-caching--multiple-layers)
7. [DNS Record Types](#7-dns-record-types)
8. [TTL — Time To Live](#8-ttl--time-to-live)
9. [DNS Propagation — Challenges and Best Practices](#9-dns-propagation--challenges-and-best-practices)
10. [Anycast Routing in DNS](#10-anycast-routing-in-dns)
11. [Why DNS is Robust and Decentralized](#11-why-dns-is-robust-and-decentralized)
12. [Public DNS Resolvers — Cloudflare vs Google](#12-public-dns-resolvers--cloudflare-vs-google)
13. [Common DNS Pitfalls](#13-common-dns-pitfalls)
14. [Quick Reference — Summary Tables](#14-quick-reference--summary-tables)
15. [Key Takeaways](#15-key-takeaways)

---

## 1. What is DNS?

**DNS (Domain Name System)** is often described as the **phonebook of the internet**.

At its core, DNS is a distributed, hierarchical naming system that translates **human-readable domain names** (like `google.com`) into **machine-readable IP addresses** (like `142.250.190.78`) that computers use to communicate.

```
Human types:   google.com
DNS resolves:  142.250.190.78
Browser uses:  142.250.190.78 to load the webpage
```

Without DNS, you'd have to memorize IP addresses to visit any website — an impossible task as the internet grows.

---

## 2. Why DNS Exists — The Problem It Solves

Computers communicate using **IP addresses** (e.g., `192.168.1.1` for IPv4, or `2001:db8::1` for IPv6). Humans, however, remember words, not numbers.

DNS bridges this gap by:

- Allowing users to type `amazon.com` instead of `205.251.242.103`
- Making websites reachable via **memorable names** that stay consistent even when their underlying IP addresses change
- Enabling the internet to **scale** — billions of domain names are resolved daily without any single point of failure

---

## 3. Key Players in DNS

The DNS system is made up of several different types of servers, each with a distinct role. Understanding them is essential to understanding how DNS works.

---

### 3.1 DNS Resolver

Also called a **Recursive Resolver** or **Recursive DNS Server**.

| Property | Detail |
|---|---|
| **Who provides it** | Your ISP, or public DNS services like Cloudflare (`1.1.1.1`) or Google (`8.8.8.8`) |
| **Role** | Receives your DNS query and does the legwork of finding the answer |
| **How it works** | Checks its own cache first; if no match, queries upstream DNS servers recursively |
| **Analogy** | A librarian who goes and finds the book for you, rather than you searching the shelves yourself |

The resolver is the **first stop** after your device's own cache. It acts as your DNS agent — querying root servers, TLD servers, and authoritative servers on your behalf.

---

### 3.2 Root Name Servers

The **top of the DNS hierarchy**.

| Property | Detail |
|---|---|
| **Number of logical servers** | 13 (labeled A through M) |
| **Physical servers** | Hundreds of physical machines worldwide backing those 13 logical IPs |
| **Role** | Store the IP addresses of all **TLD name servers** |
| **Routing method** | Uses **Anycast** to route queries to the nearest physical server |
| **Operated by** | Various organizations: ICANN, Verisign, NASA, US Army, etc. |

> ❓ **Why only 13?**  
> It's a technical constraint from the original DNS protocol — DNS responses had to fit within a single 512-byte UDP packet. 13 root server IP addresses fit perfectly. This constraint has since been relaxed with EDNS (Extension Mechanisms for DNS), but the 13 logical addresses remain for compatibility.

Root servers **do not know** the final IP of your domain. They only know **where the TLD servers are**.

---

### 3.3 TLD Name Servers (Top Level Domain)

The **second level** of the DNS hierarchy.

| Property | Detail |
|---|---|
| **Role** | Store IP addresses of authoritative nameservers for each domain under their TLD |
| **Examples of TLDs** | `.com`, `.org`, `.net`, `.edu`, `.gov`, `.io` |
| **Country-code TLDs** | `.de` (Germany), `.uk` (United Kingdom), `.in` (India), `.jp` (Japan) |
| **Managed by** | Verisign manages `.com` and `.net`; various country-level registries manage ccTLDs |

When you ask for `google.com`, the `.com` TLD server tells your resolver: *"Here's the authoritative nameserver for google.com."*

---

### 3.4 Authoritative Nameservers

The **final authority** — the server that holds the actual DNS records for a domain.

| Property | Detail |
|---|---|
| **Role** | Stores the definitive DNS records for a specific domain |
| **Who runs them** | Domain registrars, cloud providers (AWS Route 53, Cloudflare, Google Cloud DNS) |
| **Configurable?** | Yes — when you register a domain, default nameservers are assigned but can be changed |
| **Analogy** | The original book on the shelf — all other caches are photocopies |

When you update a DNS record (e.g., change where your domain points), you update it **here**, on the authoritative nameserver.

---

## 4. DNS Hierarchy — The Big Picture

DNS is organized as a **tree-like hierarchy**, which is central to its scalability and fault tolerance.

```
                        [ Root Name Servers ]
                       /          |          \
              [.com TLD]       [.org TLD]   [.net TLD] ...
             /         \
   [google.com NS]  [amazon.com NS]
         |
  [ google.com IP: 142.250.190.78 ]
```

Each level only knows about the level directly below it:
- Root servers know **TLD servers**
- TLD servers know **authoritative nameservers for domains under them**
- Authoritative nameservers know **the actual IP addresses (and other records)**

This design means:
- **No single server** needs to know every domain in existence
- **Failure at any one node** doesn't bring down the whole system
- The system can **scale infinitely** by adding more nodes at any level

---

## 5. How a DNS Query Works — Step by Step

Here's a detailed walkthrough of what happens when you type `google.com` into your browser.

```
Browser → OS Cache → DNS Resolver → Root Server → TLD Server → Authoritative NS → IP!
```

### Step-by-Step Breakdown

```
Step 1: Browser Cache Check
  └─ Browser asks: "Do I already know the IP for google.com?"
     ✅ Cache hit → use cached IP (done!)
     ❌ Cache miss → go to Step 2

Step 2: OS DNS Cache Check
  └─ OS asks its local DNS cache
     ✅ Cache hit → return IP to browser (done!)
     ❌ Cache miss → go to Step 3

Step 3: Query DNS Resolver (e.g., 8.8.8.8)
  └─ Resolver checks its own cache
     ✅ Cache hit → return IP to OS → browser (done!)
     ❌ Cache miss → go to Step 4

Step 4: Resolver Queries Root Name Server
  └─ "Who handles .com domains?"
     ← Root returns: IP addresses of .com TLD servers

Step 5: Resolver Queries .com TLD Server
  └─ "Who is authoritative for google.com?"
     ← TLD returns: IP of Google's authoritative nameservers (ns1.google.com, etc.)

Step 6: Resolver Queries Google's Authoritative Nameserver
  └─ "What is the IP for google.com?"
     ← Authoritative NS returns: 142.250.190.78 (example)

Step 7: Resolver Returns IP to OS
  └─ OS passes IP to browser
     Browser connects to 142.250.190.78 → Page loads! 🎉
```

> 💡 **Real-World Optimization:** Because `.com` is queried billions of times daily, DNS resolvers almost always have TLD server IPs cached. This means steps 4–5 are often skipped entirely, making resolution faster.

---

## 6. DNS Caching — Multiple Layers

DNS uses caching at multiple levels to drastically reduce query time and network load.

| Cache Location | Where it lives | Controlled by |
|---|---|---|
| **Browser Cache** | Inside the browser (Chrome, Firefox, etc.) | Browser settings / TTL |
| **OS DNS Cache** | Local machine's operating system | OS + TTL |
| **Resolver Cache** | At your ISP or public DNS service | TTL (sometimes overridden) |
| **TLD / Root Cache** | Resolver caches TLD & root server addresses | Long TTLs (days/weeks) |

### Why Caching Matters

- **Speed:** Cached responses are returned in microseconds vs. the full resolution chain taking tens to hundreds of milliseconds
- **Reduced Load:** Without caching, root servers would receive billions of queries per second — impossible to handle
- **Trade-off:** Caches introduce **staleness** — cached data may not reflect the latest DNS changes

---

## 7. DNS Record Types

DNS stores different types of records for different purposes. Here are the most important ones:

| Record Type | Purpose | Example |
|---|---|---|
| **A** | Maps domain → IPv4 address | `google.com → 142.250.190.78` |
| **AAAA** | Maps domain → IPv6 address | `google.com → 2607:f8b0:4004:c09::65` |
| **CNAME** | Alias — maps domain → another domain | `www.example.com → example.com` |
| **MX** | Mail exchange — specifies email servers | `example.com → mail.example.com` |
| **NS** | Specifies authoritative nameservers for a domain | `google.com → ns1.google.com` |
| **TXT** | Stores arbitrary text (used for verification, SPF, DKIM) | `"v=spf1 include:_spf.google.com ~all"` |
| **PTR** | Reverse lookup — IP → domain | `142.250.190.78 → google.com` |
| **SOA** | Start of Authority — metadata about the zone | Serial number, refresh interval, etc. |
| **SRV** | Service location — specifies host and port | Used by SIP, XMPP, etc. |

---

## 8. TTL — Time To Live

**TTL (Time To Live)** is a value (in seconds) set on every DNS record. It tells resolvers and caches how long they should store the record before considering it expired and querying again.

```
DNS Record Example:
  google.com   A   142.250.190.78   TTL: 300
                                         ↑
                                   Cache for 300 seconds (5 minutes)
                                   After that, re-query
```

### TTL Trade-offs

| Short TTL (e.g., 60 seconds) | Long TTL (e.g., 86400 = 24 hours) |
|---|---|
| Changes propagate quickly | Faster queries (cache hit more likely) |
| More DNS queries (higher load) | Changes propagate slowly |
| Better for dynamic environments | Better for stable, unchanging records |

### Who Sets TTL?

TTL is set by the **domain owner** on their authoritative nameserver. However, DNS resolvers can (and sometimes do) **ignore TTL values** and cache records longer than specified — this is a known compliance issue with some public resolvers.

---

## 9. DNS Propagation — Challenges and Best Practices

**DNS Propagation** is the time it takes for changes made to DNS records to be reflected across all DNS resolvers worldwide.

### Why Propagation is Slow

1. **Cached records** at resolvers, OS, and browsers all need to expire before the new record is fetched
2. **TTL values** can be set to hours or days by default
3. **Non-compliant resolvers** may ignore TTL and cache records indefinitely

### The Problem in Practice

```
You change your server's IP:
  Old IP: 1.2.3.4  →  New IP: 5.6.7.8

User A (fresh resolver): Gets 5.6.7.8 ✅
User B (cached resolver): Still gets 1.2.3.4 ❌ (until TTL expires)
User C (non-compliant resolver): Gets 1.2.3.4 indefinitely ❌
```

This causes **split-brain DNS** — different users see different versions of your DNS during the transition window.

---

### ✅ Best Practices for DNS Changes

**Before you make the change:**

> **Step 1 — Lower your TTL well in advance**  
> Change your TTL from the default (e.g., 3600 seconds = 1 hour) to a very short value like **60 seconds**, ideally 24–48 hours before the planned update.  
> This ensures caches expire quickly once you make the actual change.

```
Timeline:
Day 1:   Reduce TTL to 60s  ← caches start expiring in 60s
Day 2:   Make the DNS change ← propagation is now rapid
Day 3+:  (optionally) restore TTL to longer value
```

**After you make the change:**

> **Step 2 — Keep the old server running temporarily**  
> Even after pointing DNS to the new IP, some resolvers that ignore TTL will still send traffic to the old IP.  
> Keep the old server alive for at least a few hours to a day after the switch to avoid serving errors to those users.

---

## 10. Anycast Routing in DNS

**Anycast** is a network addressing and routing methodology where **multiple servers share a single IP address**. Incoming traffic is routed to the topologically nearest server.

### How it Works

```
Single IP: 198.41.0.4  (one of root server A's IPs)

Client in New York  → routed to → Server in Virginia, USA
Client in Mumbai    → routed to → Server in Mumbai, India
Client in Frankfurt → routed to → Server in Frankfurt, Germany
```

All those clients used the same IP, but each reached a geographically close physical server.

### Why DNS Uses Anycast

| Benefit | Explanation |
|---|---|
| **Low latency** | Queries reach the nearest node, reducing round-trip time |
| **High availability** | If one node fails, traffic automatically reroutes to the next nearest |
| **Load distribution** | Traffic is naturally spread across nodes globally |
| **DDoS resilience** | Attack traffic is absorbed/diluted across many nodes |

All 13 **root name server** logical addresses use anycast. This is why despite there being only 13 IPs, hundreds of physical servers back them worldwide.

---

## 11. Why DNS is Robust and Decentralized

DNS's design choices collectively create an extremely resilient system:

| Design Choice | Why it Contributes to Robustness |
|---|---|
| **Hierarchical structure** | No single point of failure; different levels are independently managed |
| **Decentralized authority** | Thousands of authoritative nameservers worldwide, not one central registry |
| **Anycast on root/TLD** | Geographically distributed with automatic failover |
| **Caching at every level** | Even if upstream servers are unreachable, cached responses keep things working |
| **Multiple root server operators** | 12 different organizations operate root servers, preventing monopolistic failure |

> This is why DNS rarely "goes down" globally — it would require a coordinated failure of many independent, geographically distributed systems simultaneously.

---

## 12. Public DNS Resolvers — Cloudflare vs Google

Rather than relying solely on your ISP's resolver, many users and companies use public DNS resolvers.

| Property | Cloudflare `1.1.1.1` | Google `8.8.8.8` |
|---|---|---|
| **Privacy** | Claims not to log user IP data; audited by KPMG | Logs queries; tied to Google's ad ecosystem |
| **Speed** | Consistently fastest in benchmarks | Very fast; second to Cloudflare in most tests |
| **TTL Compliance** | Generally respects TTL | Generally respects TTL |
| **Reliability** | Excellent (Cloudflare's global network) | Excellent (Google's global infrastructure) |
| **Supports DNS-over-HTTPS** | ✅ Yes | ✅ Yes |
| **Supports DNS-over-TLS** | ✅ Yes | ✅ Yes |

> ⚠️ **Important for DNS migrations:** Neither resolver is guaranteed to always respect TTL. Some deployments and ISP resolvers have been known to cache records well beyond their TTL — which is why the **"keep old server running"** best practice matters.

---

## 13. Common DNS Pitfalls

### ❌ Not Lowering TTL Before a Migration
Making a DNS change with a 24-hour TTL means you might have inconsistent traffic for an entire day.

### ❌ Decommissioning Old Servers Immediately After a DNS Change
Non-compliant resolvers or late-expiring caches will send traffic to the old IP. If that server is gone, users get errors.

### ❌ Misunderstanding CNAME Limitations
A CNAME record **cannot coexist** with other records on the same name. You cannot have both a CNAME and an MX record for `example.com` — use an A record at the root.

### ❌ Forgetting DNS Cache on Your Local Machine
During testing after a DNS change, you might still see the old IP due to your OS or browser cache. Use `ipconfig /flushdns` (Windows), `sudo dscacheutil -flushcache` (macOS), or `systemd-resolve --flush-caches` (Linux) to clear it.

### ❌ Expecting Instant Global Propagation
Even with a 60-second TTL, some resolvers don't comply. Always plan for a propagation window of at least 1–2 hours, and ideally keep old infrastructure running for 24+ hours.

---

## 14. Quick Reference — Summary Tables

### DNS Server Types

| Server Type | Role | Quantity | Operated By |
|---|---|---|---|
| **Root Name Servers** | Point to TLD servers | 13 logical IPs (hundreds of physical) | ICANN, Verisign, NASA, US Army, etc. |
| **TLD Name Servers** | Point to authoritative NS for domains | One per TLD | Verisign (.com/.net), various ccTLD registries |
| **Authoritative Nameservers** | Hold actual DNS records | One per domain (typically multiple for redundancy) | Registrars, AWS Route 53, Cloudflare, GCP |
| **DNS Resolver** | Recursive lookup on behalf of client | Varies | ISP, Cloudflare (1.1.1.1), Google (8.8.8.8) |

---

### DNS Query Caching Layers

| Layer | Location | Who controls expiry |
|---|---|---|
| Browser cache | Inside browser | TTL / browser policy |
| OS DNS cache | Operating system | TTL |
| Resolver cache | ISP / public resolver | TTL (may override) |
| TLD / root records cached by resolver | Resolver | TTL (usually days/weeks) |

---

### Key Terms Glossary

| Term | Definition |
|---|---|
| **DNS** | Domain Name System — translates domain names to IP addresses |
| **DNS Resolver** | Recursive server that fetches DNS answers on behalf of a client |
| **Authoritative Nameserver** | The definitive source for DNS records of a domain |
| **Root Name Server** | Top of the DNS hierarchy; directs queries to TLD servers |
| **TLD** | Top Level Domain — the last segment of a domain (`.com`, `.org`, etc.) |
| **TTL** | Time To Live — how long a DNS record should be cached (in seconds) |
| **Anycast** | Routing method where multiple servers share one IP; users reach the nearest |
| **DNS Propagation** | The delay for DNS record changes to be seen globally |
| **A Record** | DNS record mapping a domain to an IPv4 address |
| **CNAME** | Canonical Name — an alias that points one domain to another |
| **DNS over HTTPS (DoH)** | Encrypts DNS queries over HTTPS to prevent snooping |
| **DNS over TLS (DoT)** | Encrypts DNS queries over TLS protocol |

---

## 15. Key Takeaways

1. **DNS is the backbone of the internet** — without it, we'd navigate by IP addresses alone.

2. **DNS is hierarchical**: Root → TLD → Authoritative Nameserver → IP address. Each level serves a narrow but critical role.

3. **DNS resolvers do the heavy lifting** — they recursively query the hierarchy on your behalf so your device doesn't have to.

4. **Caching is everywhere** — browser, OS, resolver, and beyond. It makes DNS fast but introduces propagation delays when things change.

5. **TTL controls cache lifetime** — shorter TTL means faster propagation, but more load on DNS infrastructure.

6. **Anycast makes DNS resilient** — 13 logical root servers are backed by hundreds of physical machines using anycast, enabling low-latency, high-availability operation globally.

7. **DNS changes require careful planning** — reduce TTL early, keep old infrastructure running post-migration, and expect a propagation window.

8. **The decentralized design** is intentional and powerful — it means no single government, company, or failure can bring down DNS globally.

---

> 📚 **Continue Learning:**  
> - [ByteByteGo Newsletter](https://blog.bytebytego.com) — System Design deep dives  
> - [RFC 1034](https://www.rfc-editor.org/rfc/rfc1034) — DNS Concepts and Facilities (original spec)  
> - [RFC 1035](https://www.rfc-editor.org/rfc/rfc1035) — DNS Implementation and Specification  
> - [Cloudflare's DNS Learning Center](https://www.cloudflare.com/learning/dns/what-is-dns/)

---

*Guide based on ByteByteGo's "Everything You Need to Know About DNS: Crash Course System Design #4"*
