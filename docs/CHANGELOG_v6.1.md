# Betynz v6.1 — Zeus Experience + Fast Start

## Restored
- Zeus-branded launch experience using the clean Zeus artwork.
- Bold Betynz B mark, Betynz.com and “Let the Gods Decide.”
- Automatic first-user guided tour.
- Replay Quick Tour button in Methodology.

## Performance protections
- The Zeus launch layer never captures taps and removes itself after 850 ms.
- The launch screen appears only once per browser session.
- The tour is created only after the dashboard is ready and only for a first-time visitor.
- `data.js` and `app.js` begin downloading from the document head.
- Cached verified fixtures are returned immediately while a fresh board downloads in the background.
- A new installation stops waiting for `data.js` after 3.5 seconds instead of hanging indefinitely.
- Cached navigation is used immediately while the latest shell refreshes in the background.
- The core app starts after a 650 ms maximum data wait.

## Preserved
- All Olympian and Rebel rules.
- Live scores and settlement.
- Match explanations.
- Core desktop, mobile, tablet and Z Fold navigation.
- Existing live-data workflows.
