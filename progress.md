Original prompt: there is a lot of gap or margin in top and bottom of the portrait mobile view. it's like 20 % margin on top and bottom of canvas on the page. can you make the canvas take full screen on mobile portrait

2026-02-15
- Updated portrait-mobile CSS to use true viewport fill (`100dvh`) with fixed full-screen `main`.
- Removed portrait constraints that could leave letterboxing (`max-height`/viewport-centered splash transform).
- Bumped CSS/JS query versions in `index.html` to avoid stale-cache behavior.
- Verified via Playwright screenshot at `375x667` (`output/portrait-mobile.png`): canvas fills full portrait viewport with no large top/bottom page margins.
