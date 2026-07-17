# Betynz v5.9.2 — Verified Live-Board Recovery

- Fixes GitHub Pages validation failures caused by packaged demo fixtures being mistaken for a healthy board.
- `ensure-live-data.js` now rejects explicit demo boards and the reserved fixture IDs 900001–900020.
- Git-history recovery skips demo/synthetic revisions and restores only verified non-demo fixtures.
- Mixed boards keep genuine API fixtures while removing packaged demo rows.
- Static deployment still refuses to publish an empty or demo board.
- The main Smart Global Coverage workflow may continue from demo/empty data and replace it from the live APIs.
- Adds regression tests for demo-history skipping and mixed-board cleanup.
