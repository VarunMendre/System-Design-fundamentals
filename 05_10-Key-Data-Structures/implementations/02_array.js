/**
 * ============================================================
 *  Data Structure #2 — ARRAY
 *  File: 02_array.js
 * ============================================================
 *
 *  Implementations:
 *    1. Fixed-size 1D array operations
 *    2. 2D array (matrix) for image-like data
 *
 *  Sample Use Cases:
 *    A. Weather station — store/query temperature readings
 *    B. Image processing — grayscale filter on a pixel grid
 *
 *  Run: node 02_array.js
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────
//  PART 1: 1D Array Utilities
// ─────────────────────────────────────────────────────────────

class Array1D {
  constructor(size, fillValue = 0) {
    this.data = new Array(size).fill(fillValue);
    this.size = size;
  }

  // O(1) — direct index calculation
  get(index) {
    if (index < 0 || index >= this.size) throw new RangeError("Index out of bounds");
    return this.data[index];
  }

  set(index, value) {
    if (index < 0 || index >= this.size) throw new RangeError("Index out of bounds");
    this.data[index] = value;
  }

  // Binary search (requires sorted array) — O(log n)
  binarySearch(target) {
    let low = 0, high = this.size - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.data[mid] === target) return mid;
      if (this.data[mid] < target) low = mid + 1;
      else high = mid - 1;
    }
    return -1;
  }

  // Linear search (unsorted array) — O(n)
  linearSearch(target) {
    for (let i = 0; i < this.size; i++) {
      if (this.data[i] === target) return i;
    }
    return -1;
  }

  // Prefix sum array — enables O(1) range sum queries after O(n) build
  buildPrefixSum() {
    const prefix = new Array(this.size + 1).fill(0);
    for (let i = 0; i < this.size; i++) {
      prefix[i + 1] = prefix[i] + this.data[i];
    }
    return prefix;
  }

  // Range sum using prefix array — O(1)
  static rangeSum(prefix, left, right) {
    return prefix[right + 1] - prefix[left];
  }

  // Sliding window maximum — O(n) overall
  slidingWindowMax(k) {
    const result = [];
    for (let i = 0; i <= this.size - k; i++) {
      let max = this.data[i];
      for (let j = i + 1; j < i + k; j++) {
        if (this.data[j] > max) max = this.data[j];
      }
      result.push(max);
    }
    return result;
  }

  stats() {
    const sum = this.data.reduce((a, b) => a + b, 0);
    const avg = sum / this.size;
    const min = Math.min(...this.data);
    const max = Math.max(...this.data);
    return { sum: +sum.toFixed(2), avg: +avg.toFixed(2), min, max };
  }

  toString() {
    return `[${this.data.map(v => String(v).padStart(5)).join(",")} ]`;
  }
}

// ─────────────────────────────────────────────────────────────
//  PART 2: 2D Array (Matrix)
// ─────────────────────────────────────────────────────────────

class Matrix2D {
  constructor(rows, cols, fillValue = 0) {
    this.rows = rows;
    this.cols = cols;
    // Row-major layout: data[row][col]
    this.data = Array.from({ length: rows }, () => new Array(cols).fill(fillValue));
  }

  get(row, col) {
    this._boundsCheck(row, col);
    return this.data[row][col];
  }

  set(row, col, value) {
    this._boundsCheck(row, col);
    this.data[row][col] = value;
  }

  _boundsCheck(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols)
      throw new RangeError(`(${row}, ${col}) is out of bounds`);
  }

  // Apply a function to every element — O(n*m)
  map(fn) {
    const result = new Matrix2D(this.rows, this.cols);
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        result.data[r][c] = fn(this.data[r][c], r, c);
    return result;
  }

  // Matrix transpose — O(n*m)
  transpose() {
    const result = new Matrix2D(this.cols, this.rows);
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        result.data[c][r] = this.data[r][c];
    return result;
  }

  // Matrix multiplication — O(n³)
  multiply(other) {
    if (this.cols !== other.rows) throw new Error("Incompatible dimensions");
    const result = new Matrix2D(this.rows, other.cols);
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < other.cols; c++)
        for (let k = 0; k < this.cols; k++)
          result.data[r][c] += this.data[r][k] * other.data[k][c];
    return result;
  }

  print(label = "") {
    if (label) console.log(`  ${label}:`);
    for (const row of this.data) {
      console.log("    " + row.map(v => String(v).padStart(4)).join(" "));
    }
  }
}

// ─────────────────────────────────────────────────────────────
//  USE CASE A: Weather Station — Temperature Log
// ─────────────────────────────────────────────────────────────

class WeatherStation {
  constructor(stationName, days) {
    this.name = stationName;
    this.temps = new Array1D(days);
    this.days = days;
  }

  recordTemperature(day, temp) {
    this.temps.set(day, temp);
  }

  // Find hottest day — O(n)
  hottestDay() {
    let maxTemp = -Infinity, maxDay = -1;
    for (let i = 0; i < this.days; i++) {
      if (this.temps.get(i) > maxTemp) {
        maxTemp = this.temps.get(i);
        maxDay = i;
      }
    }
    return { day: maxDay, temp: maxTemp };
  }

  // Average temperature over a range using prefix sum — O(1) per query after O(n) build
  setupRangeQuery() {
    this.prefix = this.temps.buildPrefixSum();
  }

  avgTempRange(startDay, endDay) {
    const sum = Array1D.rangeSum(this.prefix, startDay, endDay);
    return +(sum / (endDay - startDay + 1)).toFixed(2);
  }

  // 3-day moving max temperature
  movingMax(window = 3) {
    return this.temps.slidingWindowMax(window);
  }

  report() {
    const { sum, avg, min, max } = this.temps.stats();
    console.log(`\n  📊 Weather Report — ${this.name}`);
    console.log(`     Temperatures: ${this.temps.toString()}`);
    console.log(`     Total days: ${this.days} | Sum: ${sum}°C | Avg: ${avg}°C`);
    console.log(`     Min: ${min}°C | Max: ${max}°C`);
    const hottest = this.hottestDay();
    console.log(`     Hottest day: Day ${hottest.day} at ${hottest.temp}°C`);
    console.log(`     3-day rolling max: [${this.movingMax(3).join(", ")}]`);
    this.setupRangeQuery();
    console.log(`     Avg temp days 1–4: ${this.avgTempRange(1, 4)}°C`);
  }
}

// ─────────────────────────────────────────────────────────────
//  USE CASE B: Image Processing — Grayscale + Brightness
// ─────────────────────────────────────────────────────────────

class ImageProcessor {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    // Each cell represents a grayscale pixel value 0–255
    this.pixels = new Matrix2D(height, width);
  }

  loadImage(pixelData) {
    for (let r = 0; r < this.height; r++)
      for (let c = 0; c < this.width; c++)
        this.pixels.set(r, c, pixelData[r][c]);
  }

  // Invert colors (negative effect)
  invert() {
    return this.pixels.map(v => 255 - v);
  }

  // Increase brightness by delta, clamp to [0, 255]
  brighten(delta) {
    return this.pixels.map(v => Math.min(255, Math.max(0, v + delta)));
  }

  // Threshold — convert to pure black & white
  threshold(cutoff = 128) {
    return this.pixels.map(v => v >= cutoff ? 255 : 0);
  }

  // Simple box blur (3x3 kernel) — O(n*m)
  boxBlur() {
    const result = new Matrix2D(this.height, this.width);
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        let sum = 0, count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < this.height && nc >= 0 && nc < this.width) {
              sum += this.pixels.get(nr, nc);
              count++;
            }
          }
        }
        result.set(r, c, Math.round(sum / count));
      }
    }
    return result;
  }
}

// ─────────────────────────────────────────────────────────────
//  DEMO
// ─────────────────────────────────────────────────────────────

console.log("═══════════════════════════════════════════════════");
console.log("  DATA STRUCTURE: ARRAY");
console.log("═══════════════════════════════════════════════════\n");

// --- Weather Station ---
console.log("── Use Case A: Weather Station ─────────────────────");
const station = new WeatherStation("Mumbai", 7);
[28.5, 31.2, 35.0, 33.8, 29.1, 27.4, 30.6].forEach((t, i) => station.recordTemperature(i, t));
station.report();

// --- Image Processing ---
console.log("\n── Use Case B: Image Processing ────────────────────");
const img = new ImageProcessor(5, 4);
img.loadImage([
  [100, 120, 140, 160, 180],
  [90,  110, 130, 150, 170],
  [80,  100, 120, 140, 160],
  [70,   90, 110, 130, 150],
]);
img.pixels.print("Original pixels");

const brightened = img.brighten(50);
brightened.print("\n  Brightened (+50)");

const inverted = img.invert();
inverted.print("\n  Inverted");

const bw = img.threshold(120);
bw.print("\n  Threshold (cutoff=120) → black & white");

const blurred = img.boxBlur();
blurred.print("\n  Box Blur (3×3)");

// --- Matrix Operations ---
console.log("\n── Matrix Multiplication ───────────────────────────");
const A = new Matrix2D(2, 3);
const B = new Matrix2D(3, 2);
[[1,2,3],[4,5,6]].forEach((r,i) => r.forEach((v,j) => A.set(i,j,v)));
[[7,8],[9,10],[11,12]].forEach((r,i) => r.forEach((v,j) => B.set(i,j,v)));
A.print("Matrix A (2×3)");
B.print("Matrix B (3×2)");
A.multiply(B).print("A × B (2×2)");

// --- Binary Search ---
console.log("\n── Binary Search ───────────────────────────────────");
const sorted = new Array1D(8);
[10, 20, 30, 40, 50, 60, 70, 80].forEach((v, i) => sorted.set(i, v));
console.log("  Sorted array:", sorted.toString());
console.log("  Binary search for 50: index", sorted.binarySearch(50));
console.log("  Binary search for 35: index", sorted.binarySearch(35), "(not found)");
