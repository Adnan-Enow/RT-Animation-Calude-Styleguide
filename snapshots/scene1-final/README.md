# Scene 1 — Final Snapshot

Frozen reference copy of Scene 1 (Proposal Development) at the moment it
was approved as canonical. **Do not edit these files.** They exist as a
recovery point in case Scene 1's behaviour drifts when adding more scenes.

> Also recoverable via git: `git checkout scene1-final` or
> `git diff scene1-final -- src/BannerStage.tsx`.

---

## What's here

| File | Source |
|---|---|
| `BannerStage.tsx` | copy of `src/BannerStage.tsx` at snapshot time |
| `Scene1PD.tsx` | copy of `src/scenes/Scene1PD.tsx` at snapshot time |

## Scene 1 — what it does

1. **0–6**: blank white background, soft blurred blue blob drifting
2. **6–30**: glass card lifts in (16px translate, opacity, slight scale)
3. **30–38**: card content (header band, white nav skeletons) fades in;
   footer divider + plus/send icons fade in; cursor `|` eases in below
   the divider
4. **38–56**: paper (F2F2F2 panel) fades in; first letters of headline
   "Best at Crafting Proposals" begin appearing letter-by-letter
5. **60–122**: 11 skeleton lines cascade in below the paper (uneven
   widths, paragraph indents); typing continues in parallel
6. **~138**: last letter of headline lands; shimmer cascade begins
7. **138–224**: blue shimmer band sweeps each line, geometry morphs
   uneven → even in lockstep
8. **228–250**: blue circular sparkle pops in (overshoot bezier)
9. **250–260**: hold final state

## Headline writing animation specs

- **Text**: `"Best at Crafting Proposals"` (26 characters)
- **Start frame**: 38 (paper begins fading in)
- **Duration**: 100 frames (≈3.85 frames/char ≈ 8 chars/sec)
- **Easing**: Material-standard `Easing.bezier(0.4, 0, 0.2, 1)`
- **Per-letter motion**: pure opacity fade 0 → 1 across the letter's
  arrival window — **no position change, no transforms**
- **Cursor**: sin-pulsed `0.4 + 0.5·|sin(0.25·frame)|` × trapezoidal
  envelope (4-frame ease-in pre-typing, 12-frame ease-out post-typing)

## Composition

| Property | Value |
|---|---|
| ID | `Scene1-PD` |
| Dimensions | 1452 × 709 |
| Frame rate | 30fps |
| Duration | 260 frames (≈8.7s) |

## Recover

```bash
# Inspect the snapshot:
diff src/BannerStage.tsx snapshots/scene1-final/BannerStage.tsx

# Restore Scene 1's exact files:
cp snapshots/scene1-final/BannerStage.tsx src/BannerStage.tsx
cp snapshots/scene1-final/Scene1PD.tsx src/scenes/Scene1PD.tsx

# Or via git:
git diff scene1-final -- src/
git checkout scene1-final -- src/BannerStage.tsx src/scenes/Scene1PD.tsx
```
