import test from "node:test";
import assert from "node:assert/strict";

import { escapeHtml } from "../src/escape-html.js";

test("a script tag in stored managerInitials is neutralized, not executed", () => {
  const malicious = '<script>alert(1)</script>';
  const escaped = escapeHtml(malicious);
  assert.ok(!escaped.includes("<script>"));
  assert.equal(escaped, "&lt;script&gt;alert(1)&lt;/script&gt;");
});

test("an onerror image-tag injection is neutralized", () => {
  const malicious = '<img src=x onerror="alert(1)">';
  const escaped = escapeHtml(malicious);
  assert.ok(!escaped.includes("<img"));
});

test("an attribute-breakout attempt using quotes is neutralized", () => {
  const malicious = `MW"><script>alert(1)</script>`;
  const escaped = escapeHtml(malicious);
  assert.ok(!escaped.includes('"'));
  assert.ok(!escaped.includes("<script>"));
});

test("plain normal initials pass through unchanged", () => {
  assert.equal(escapeHtml("MW"), "MW");
});

test("non-string input is coerced to a string first", () => {
  assert.equal(escapeHtml(42), "42");
});
