# Termipets Local QA Report

**Date:** 2026-04-12  
**Scope:** Finish and verify the in-progress mini-game / pay-to-play changes locally

---

## What was fixed in this pass

### Source correctness

- Fixed **Simon Says** score accounting so final score tracks **completed rounds** reliably
  - This avoids mismatches between the UI message and the `onComplete` callback

### Build correctness

- Updated the build script to **clean `dist/` before compiling**
  - This matters because deleting `source/components/games/flappy-bird.tsx` alone does **not** remove stale built artifacts from `dist/`
  - Without a clean build, old Flappy Bird files could accidentally survive into a publish

### Usability / completion consistency

- Added quit support to:
  - `pong.tsx`
  - `snake.tsx`
  - `tetris.tsx`

This makes the remaining game set more consistent with the newer “return cleanly to main” behavior.

---

## Verified locally

### Build / compile

- `tsc --noEmit` ✅
- `npm run build` ✅

### Artifact checks

- No Flappy Bird references remain in rebuilt output (`dist/`) ✅
- Basic Kibble removal is present in source ✅
- Pay-to-play metadata is present in the game registry ✅

### Source audit of game completion hooks

Confirmed every remaining game component has an `onComplete(...)` path:

- bug-catcher
- catch
- fetch
- frogger
- 2048
- hide-and-seek
- maze-runner
- minesweeper
- pong
- simon-says
- snake
- tetris
- typing-race
- whack-a-mole

### Source audit of exit handling

Quit / escape handling confirmed in source for:

- bug-catcher
- catch
- fetch
- frogger
- 2048
- hide-and-seek
- maze-runner
- minesweeper
- pong
- simon-says
- snake
- tetris

Escape-only quit confirmed for:

- typing-race
- whack-a-mole

---

## End-to-end interaction note

I performed local CLI interaction with a temp HOME / temp save to avoid touching real user state.

The Ink UI runs correctly, the game selection screen opens, and the rebuilt game loop returns to main after completion.

However, **bulk automated traversal of every game via the sandboxed PTY bridge was unreliable**:

- menu input occasionally arrived late
- some keystrokes were dropped or applied out of order by the bridge

Because of that, the strongest fully reliable verification in this environment was:

1. real local build validation
2. real CLI launch validation
3. source-level completion / quit-path audit for all games

This is enough for a strong local confidence pass, but the ideal final step before publish is still:

- one quick human smoke run in a normal terminal
- then commit / push / publish

---

## Remaining external steps

These were **not** completed in this pass:

- `git push`
- `npm publish`

Reason:

- they leave the machine / require network
- they should happen only after final confirmation

---

## Recommended next commands

From `termipets/`:

```bash
npm run build
node dist/cli.js
git add .
git commit -m "fix: finish pay-to-play mini-game update"
git push
npm publish
```

---

## Bottom line

The local source work is now in much better shape:

- Flappy Bird is removed cleanly
- pay-to-play economy is wired in
- Simon Says scoring is fixed
- build output is cleaned properly
- all remaining games have audited completion paths
