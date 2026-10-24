---
inclusion: fileMatch
fileMatchPattern: ["**/*.tsx", "**/*.jsx", "**/*.html", "**/*.css", "**/locales/**"]
---

# Accessible, plain-language UI

Judges weigh accessibility, equity and polish. Apply this whenever you touch UI code or user-facing copy.

- Target WCAG 2.2 AA: semantic HTML first, a label on every input, visible focus, everything reachable by keyboard, 4.5:1 contrast for body text, never color alone to carry meaning.
- Touch targets are at least 24×24 px. Layouts work at 320 px wide and at 200% zoom.
- Resident-facing copy is plain language at about a grade-8 reading level: short sentences, active voice, no jargon, acronyms spelled out on first use.
- Keep user-facing strings in locale files, not inside components, so adding a language is a data change.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.
- Error messages say what happened and what to do next.
