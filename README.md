# Gem Loop

Gem Loop is a browser mini-game inspired by edge-loop arcade timing games.
You place bets on gem tiles around a square frame, start the spin, and win if the selector lands on a tile you bet on.

## What the game is about

- Square outer-frame board with gem tiles on all 4 sides
- Click tiles to place bets (multiple clicks on the same tile stack bet count)
- Spinner moves clockwise, slows down, and lands on one tile
- You win if landed tile has at least 1 bet
- Score system rewards wins, time played, and win streaks

## Core rules

- Initial coins: `300`
- Each click on a tile costs: `10` coins
- If you click one tile 3 times, that tile bet is `30` coins
- Total round bet = `(all tile clicks) * 10`
- Win payout:
  - `landedTileClicks * 10 * effectiveMultiplier`
  - base multiplier is `10x`
  - consecutive wins multiply payout by `2x` each streak step (`10x`, `20x`, `40x`, ...)
- Lose condition: landed tile has no bet
- Game over: balance reaches `0`

## Score and high score

- `Score` increases on wins only
- Score gain includes:
  - base win points
  - time-play bonus
  - win streak bonus
- `High Score` is stored in `localStorage` and persists across refresh
- New high score is announced in win message

## Controls

- Mouse/touch:
  - Click tile = add one more bet on that tile
  - `START` = spin
  - `Clear Bets` = remove all bets + clear previous landed highlight
- Keyboard:
  - `Space` or `Enter` = start spin
  - `Backspace` or `Delete` = clear bets
- Mobile portrait is blocked with a rotate prompt (landscape required)

## Tech stack

- HTML5
- CSS3 (responsive layout and mobile breakpoints)
- Vanilla JavaScript (no framework)
- Canvas 2D rendering for board, tiles, effects, and spinner
- Web Audio API for start/spin/stop/click sounds
- `localStorage` for persistent high score

## Run locally

From project root:

```bash
npx http-server -p 4173
```

Then open:

- [http://127.0.0.1:4173/](http://127.0.0.1:4173/)

## Notes

- Game is optimized for landscape play
- Designed to run as a static site (easy deploy to Cloudflare Pages, GitHub Pages, S3 + CloudFront, etc.)

## License

See `LICENSE` for license details.
