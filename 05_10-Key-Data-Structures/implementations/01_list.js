/**
 * ============================================================
 *  Data Structure #1 — LIST
 *  File: 01_list.js
 * ============================================================
 *
 *  Implementations:
 *    1. DoublyLinkedList  — manual pointer-based list
 *    2. DynamicArray      — resizable array-based list
 *
 *  Sample Use Case:
 *    Task Manager — add, remove, reorder, and display tasks
 *    (like a simplified Trello card list)
 *
 *  Run: node 01_list.js
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────
//  PART 1: Doubly Linked List Implementation
// ─────────────────────────────────────────────────────────────

class ListNode {
  constructor(data) {
    this.data = data;
    this.prev = null;
    this.next = null;
  }
}

class DoublyLinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }

  // Add to the end — O(1) because we maintain a tail pointer
  append(data) {
    const node = new ListNode(data);
    if (!this.tail) {
      this.head = this.tail = node;
    } else {
      node.prev = this.tail;
      this.tail.next = node;
      this.tail = node;
    }
    this.size++;
    return this;
  }

  // Add to the front — O(1)
  prepend(data) {
    const node = new ListNode(data);
    if (!this.head) {
      this.head = this.tail = node;
    } else {
      node.next = this.head;
      this.head.prev = node;
      this.head = node;
    }
    this.size++;
    return this;
  }

  // Find a node by value — O(n)
  find(data) {
    let current = this.head;
    while (current) {
      if (current.data === data) return current;
      current = current.next;
    }
    return null;
  }

  // Remove a specific node — O(1) given the node, O(n) to find it
  remove(data) {
    const node = this.find(data);
    if (!node) return false;

    if (node.prev) node.prev.next = node.next;
    else this.head = node.next; // removing head

    if (node.next) node.next.prev = node.prev;
    else this.tail = node.prev; // removing tail

    this.size--;
    return true;
  }

  // Insert after a specific node — O(n) to find, O(1) to insert
  insertAfter(existingData, newData) {
    const existing = this.find(existingData);
    if (!existing) return false;

    const newNode = new ListNode(newData);
    newNode.prev = existing;
    newNode.next = existing.next;

    if (existing.next) existing.next.prev = newNode;
    else this.tail = newNode;

    existing.next = newNode;
    this.size++;
    return true;
  }

  // Convert to array for display — O(n)
  toArray() {
    const result = [];
    let current = this.head;
    while (current) {
      result.push(current.data);
      current = current.next;
    }
    return result;
  }

  // Traverse in reverse — O(n) — advantage over singly linked list
  toArrayReverse() {
    const result = [];
    let current = this.tail;
    while (current) {
      result.push(current.data);
      current = current.prev;
    }
    return result;
  }

  toString() {
    return this.toArray().join(" ↔ ");
  }
}

// ─────────────────────────────────────────────────────────────
//  PART 2: Dynamic Array (ArrayList) Implementation
// ─────────────────────────────────────────────────────────────

class DynamicArray {
  constructor(initialCapacity = 4) {
    this._data = new Array(initialCapacity);
    this._capacity = initialCapacity;
    this._size = 0;
  }

  get size() { return this._size; }

  // Resize the internal array when full — O(n) but amortized O(1) per insert
  _resize() {
    this._capacity *= 2;
    const newData = new Array(this._capacity);
    for (let i = 0; i < this._size; i++) newData[i] = this._data[i];
    this._data = newData;
    console.log(`  [DynamicArray] Resized to capacity ${this._capacity}`);
  }

  // Add to end — O(1) amortized
  push(item) {
    if (this._size === this._capacity) this._resize();
    this._data[this._size++] = item;
    return this;
  }

  // Random access by index — O(1)
  get(index) {
    if (index < 0 || index >= this._size) throw new RangeError("Index out of bounds");
    return this._data[index];
  }

  // Update by index — O(1)
  set(index, item) {
    if (index < 0 || index >= this._size) throw new RangeError("Index out of bounds");
    this._data[index] = item;
  }

  // Remove last element — O(1)
  pop() {
    if (this._size === 0) return undefined;
    const item = this._data[--this._size];
    this._data[this._size] = undefined;
    return item;
  }

  // Insert at index — O(n) due to shifting
  insertAt(index, item) {
    if (index < 0 || index > this._size) throw new RangeError("Index out of bounds");
    if (this._size === this._capacity) this._resize();
    for (let i = this._size; i > index; i--) this._data[i] = this._data[i - 1];
    this._data[index] = item;
    this._size++;
  }

  // Remove at index — O(n) due to shifting
  removeAt(index) {
    if (index < 0 || index >= this._size) throw new RangeError("Index out of bounds");
    const removed = this._data[index];
    for (let i = index; i < this._size - 1; i++) this._data[i] = this._data[i + 1];
    this._data[--this._size] = undefined;
    return removed;
  }

  // Linear search — O(n)
  indexOf(item) {
    for (let i = 0; i < this._size; i++) {
      if (this._data[i] === item) return i;
    }
    return -1;
  }

  toArray() {
    return Array.from({ length: this._size }, (_, i) => this._data[i]);
  }

  toString() {
    return `[${this.toArray().join(", ")}]  (size: ${this._size}, capacity: ${this._capacity})`;
  }
}

// ─────────────────────────────────────────────────────────────
//  SAMPLE USE CASE: Task Manager
//  Real-world scenario: a Kanban board column (like Trello)
//  Tasks can be added, removed, reordered, and displayed.
// ─────────────────────────────────────────────────────────────

class TaskManager {
  constructor(columnName) {
    this.columnName = columnName;
    this.tasks = new DoublyLinkedList(); // ordered, supports O(1) reorder at known position
  }

  addTask(task) {
    this.tasks.append(task);
    console.log(`  ✅ Added task: "${task}"`);
  }

  addUrgentTask(task) {
    this.tasks.prepend(task); // urgent tasks go to front — O(1)
    console.log(`  🚨 Added URGENT task to front: "${task}"`);
  }

  insertAfterTask(existingTask, newTask) {
    const ok = this.tasks.insertAfter(existingTask, newTask);
    if (ok) console.log(`  ➕ Inserted "${newTask}" after "${existingTask}"`);
    else console.log(`  ❌ Task "${existingTask}" not found`);
  }

  completeTask(task) {
    const ok = this.tasks.remove(task);
    if (ok) console.log(`  ✔️  Completed and removed: "${task}"`);
    else console.log(`  ❌ Task "${task}" not found`);
  }

  display() {
    console.log(`\n  📋 ${this.columnName} (${this.tasks.size} tasks):`);
    const arr = this.tasks.toArray();
    arr.forEach((t, i) => console.log(`     ${i + 1}. ${t}`));
  }
}

// ─────────────────────────────────────────────────────────────
//  DEMO
// ─────────────────────────────────────────────────────────────

console.log("═══════════════════════════════════════════════════");
console.log("  DATA STRUCTURE: LIST");
console.log("═══════════════════════════════════════════════════\n");

// --- Doubly Linked List Demo ---
console.log("── Doubly Linked List ──────────────────────────────");
const dll = new DoublyLinkedList();
dll.append("A").append("B").append("C").append("D");
console.log("After appending A,B,C,D:", dll.toString());

dll.prepend("Z");
console.log("After prepending Z:     ", dll.toString());

dll.insertAfter("B", "X");
console.log("After inserting X after B:", dll.toString());

dll.remove("C");
console.log("After removing C:        ", dll.toString());

console.log("Reverse traversal:       ", dll.toArrayReverse().join(" ↔ "));
console.log("Size:", dll.size);

// --- Dynamic Array Demo ---
console.log("\n── Dynamic Array ───────────────────────────────────");
const da = new DynamicArray(2); // start with capacity 2 to show resizing
da.push("Task1").push("Task2");
console.log("After 2 pushes:", da.toString());
da.push("Task3"); // triggers resize
console.log("After 3rd push:", da.toString());
da.insertAt(1, "URGENT");
console.log("After insertAt(1):", da.toString());
console.log("Get index 2:", da.get(2));
da.removeAt(3);
console.log("After removeAt(3):", da.toString());

// --- Task Manager Use Case Demo ---
console.log("\n── Use Case: Task Manager (Trello-style column) ────");
const board = new TaskManager("To Do");
board.addTask("Write unit tests");
board.addTask("Review PR #42");
board.addTask("Update documentation");
board.addUrgentTask("Fix production bug");
board.insertAfterTask("Fix production bug", "Hotfix deploy to staging");
board.display();
board.completeTask("Fix production bug");
board.display();
