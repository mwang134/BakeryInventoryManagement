// The only genuinely free-text field a manager types anywhere in this app
// is their initials at finalize time - it's stored, then rendered back in
// History. Wrap any such value in this before interpolating it into a
// template literal that becomes innerHTML, so typing something like
// "<img src=x onerror=...>" as initials can't execute in anyone else's
// browser when History renders it back.
export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
