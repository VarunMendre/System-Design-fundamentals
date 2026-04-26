/**
 * ============================================================
 *  Data Structure #3 — STACK
 *  File: 03_stack.js
 * ============================================================
 *
 *  Implementation: Array-backed Stack
 *
 *  Sample Use Cases:
 *    A. Text Editor — Undo / Redo system
 *    B. Expression Evaluator — balanced parentheses checker
 *    C. Postfix (RPN) Calculator
 *
 *  Run: node 03_stack.js
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────
//  Stack Implementation
// ─────────────────────────────────────────────────────────────

class Stack {
  constructor() {
    this._data = [];
  }

  // Add to top — O(1) amortized
  push(item) {
    this._data.push(item);
    return this;
  }

  // Remove from top — O(1)
  pop() {
    if (this.isEmpty()) throw new Error("Stack underflow: cannot pop from empty stack");
    return this._data.pop();
  }

  // View top without removing — O(1)
  peek() {
    if (this.isEmpty()) return undefined;
    return this._data[this._data.length - 1];
  }

  isEmpty() {
    return this._data.length === 0;
  }

  get size() {
    return this._data.length;
  }

  // Clear the stack
  clear() {
    this._data = [];
  }

  toString() {
    return `[${this._data.join(", ")}] ← top`;
  }
}

// ─────────────────────────────────────────────────────────────
//  USE CASE A: Text Editor — Undo / Redo
//  Every action is pushed onto the undo stack.
//  Undo: pop from undo stack, push onto redo stack.
//  Redo: pop from redo stack, push back onto undo stack.
// ─────────────────────────────────────────────────────────────

class TextEditor {
  constructor() {
    this.content = "";
    this.undoStack = new Stack();
    this.redoStack = new Stack();
  }

  _applyAction(action) {
    switch (action.type) {
      case "INSERT":
        this.content = this.content.slice(0, action.pos) + action.text + this.content.slice(action.pos);
        break;
      case "DELETE":
        this.content = this.content.slice(0, action.pos) + this.content.slice(action.pos + action.length);
        break;
    }
  }

  _reverseAction(action) {
    switch (action.type) {
      case "INSERT":
        // Reverse of insert = delete
        this.content = this.content.slice(0, action.pos) + this.content.slice(action.pos + action.text.length);
        break;
      case "DELETE":
        // Reverse of delete = insert
        this.content = this.content.slice(0, action.pos) + action.text + this.content.slice(action.pos);
        break;
    }
  }

  insert(pos, text) {
    const action = { type: "INSERT", pos, text };
    this._applyAction(action);
    this.undoStack.push(action);
    this.redoStack.clear(); // any new action clears redo history
    console.log(`  ✏️  Insert "${text}" at pos ${pos} → "${this.content}"`);
  }

  delete(pos, length) {
    const text = this.content.slice(pos, pos + length);
    const action = { type: "DELETE", pos, length, text };
    this._applyAction(action);
    this.undoStack.push(action);
    this.redoStack.clear();
    console.log(`  🗑️  Delete ${length} chars at pos ${pos} → "${this.content}"`);
  }

  undo() {
    if (this.undoStack.isEmpty()) {
      console.log("  ↩️  Nothing to undo");
      return;
    }
    const action = this.undoStack.pop();
    this._reverseAction(action);
    this.redoStack.push(action);
    console.log(`  ↩️  Undo ${action.type} → "${this.content}"`);
  }

  redo() {
    if (this.redoStack.isEmpty()) {
      console.log("  ↪️  Nothing to redo");
      return;
    }
    const action = this.redoStack.pop();
    this._applyAction(action);
    this.undoStack.push(action);
    console.log(`  ↪️  Redo ${action.type} → "${this.content}"`);
  }

  status() {
    console.log(`  📄 Content: "${this.content}"  |  Undo: ${this.undoStack.size}  |  Redo: ${this.redoStack.size}`);
  }
}

// ─────────────────────────────────────────────────────────────
//  USE CASE B: Balanced Parentheses Checker
//  Used in compilers, linters, and IDEs
// ─────────────────────────────────────────────────────────────

function isBalanced(expression) {
  const stack = new Stack();
  const pairs = { ")": "(", "]": "[", "}": "{" };
  const opens = new Set(["(", "[", "{"]);
  const closes = new Set([")", "]", "}"]);

  for (const char of expression) {
    if (opens.has(char)) {
      stack.push(char);
    } else if (closes.has(char)) {
      if (stack.isEmpty() || stack.pop() !== pairs[char]) {
        return { balanced: false, error: `Unexpected '${char}'` };
      }
    }
  }

  if (!stack.isEmpty()) {
    return { balanced: false, error: `Unclosed '${stack.peek()}'` };
  }
  return { balanced: true };
}

// ─────────────────────────────────────────────────────────────
//  USE CASE C: Postfix (Reverse Polish Notation) Calculator
//  Used in compilers and calculators to evaluate expressions
//  without needing parentheses.
//
//  Infix:   3 + 4 * 2     →  Postfix: 3 4 2 * +
//  Steps:   push 3, push 4, push 2, pop 4 & 2 → 4*2=8 push 8,
//           pop 3 & 8 → 3+8=11
// ─────────────────────────────────────────────────────────────

function evaluatePostfix(expression) {
  const stack = new Stack();
  const tokens = expression.trim().split(/\s+/);

  for (const token of tokens) {
    if (!isNaN(token)) {
      stack.push(parseFloat(token));
    } else {
      if (stack.size < 2) throw new Error("Invalid postfix expression");
      const b = stack.pop();
      const a = stack.pop();
      switch (token) {
        case "+": stack.push(a + b); break;
        case "-": stack.push(a - b); break;
        case "*": stack.push(a * b); break;
        case "/":
          if (b === 0) throw new Error("Division by zero");
          stack.push(a / b); break;
        case "^": stack.push(Math.pow(a, b)); break;
        default: throw new Error(`Unknown operator: ${token}`);
      }
    }
  }

  if (stack.size !== 1) throw new Error("Invalid postfix expression");
  return stack.pop();
}

// ─────────────────────────────────────────────────────────────
//  DEMO
// ─────────────────────────────────────────────────────────────

console.log("═══════════════════════════════════════════════════");
console.log("  DATA STRUCTURE: STACK");
console.log("═══════════════════════════════════════════════════\n");

// --- Core Stack Operations ---
console.log("── Core Stack Operations ───────────────────────────");
const stack = new Stack();
stack.push(10).push(20).push(30);
console.log("  After pushing 10,20,30:", stack.toString());
console.log("  Peek (top):", stack.peek());
console.log("  Pop:", stack.pop(), "→", stack.toString());
console.log("  Size:", stack.size);

// --- Text Editor Undo/Redo ---
console.log("\n── Use Case A: Text Editor Undo/Redo ───────────────");
const editor = new TextEditor();
editor.insert(0, "Hello");
editor.insert(5, " World");
editor.insert(11, "!");
editor.status();

editor.undo();   // undo "!"
editor.undo();   // undo " World"
editor.status();

editor.redo();   // redo " World"
editor.status();

editor.insert(11, "???");   // new action clears redo
editor.status();
editor.redo();   // nothing to redo now

editor.undo();
editor.undo();
editor.undo();
editor.status(); // back to empty

// --- Balanced Parentheses ---
console.log("\n── Use Case B: Balanced Parentheses Checker ────────");
const testCases = [
  "({[]})",
  "function foo() { return (a + b) * [c - d]; }",
  "(((",
  "({[}])",
  "",
];

for (const expr of testCases) {
  const result = isBalanced(expr);
  const label = expr.length > 40 ? expr.slice(0, 40) + "..." : `"${expr}"`;
  if (result.balanced) {
    console.log(`  ✅ Balanced:   ${label}`);
  } else {
    console.log(`  ❌ Unbalanced: ${label}  →  ${result.error}`);
  }
}

// --- Postfix Calculator ---
console.log("\n── Use Case C: Postfix (RPN) Calculator ─────────────");
const expressions = [
  { expr: "3 4 +",          expected: 7    },  // 3 + 4
  { expr: "5 1 2 + 4 * + 3 -", expected: 14 },  // 5 + (1+2)*4 - 3
  { expr: "2 3 ^ 1 -",      expected: 7    },  // 2^3 - 1
  { expr: "15 7 1 1 + - / 3 * 2 1 1 + + -", expected: 5 },
];

for (const { expr, expected } of expressions) {
  const result = evaluatePostfix(expr);
  const ok = Math.abs(result - expected) < 0.0001 ? "✅" : "❌";
  console.log(`  ${ok} "${expr}" = ${result}  (expected: ${expected})`);
}
