# All Scenes v1 — Day-1 Checkpoint

Frozen reference copy of every source file at the end of day 1's
build, after Scenes 1, 2, 3, and 4 are all wired into a single
continuous banner. **Do not edit these files.** They exist as a
recovery point if subsequent fine-tuning drifts the banner.

> Snapshot taken on **2026-05-09**.

---

## What's here

| File | Source |
|---|---|
| `BannerStage.tsx` | `src/BannerStage.tsx` — chrome (blob, glass card, footer with staged text transitions) |
| `BannerAnimation.tsx` | `src/BannerAnimation.tsx` — master orchestrator weaving 4 scenes |
| `Root.tsx` | `src/Root.tsx` — Remotion composition registry |
| `Scene1PD.tsx` | `src/scenes/Scene1PD.tsx` — Scene 1 (Proposal Development) |
| `Scene2SD.tsx` | `src/scenes/Scene2SD.tsx` — Scene 2 (Software Development, 3 frames) |
| `Scene3Staffing.tsx` | `src/scenes/Scene3Staffing.tsx` — Scene 3 (Staffing, 3 frames) |
| `Scene4IT.tsx` | `src/scenes/Scene4IT.tsx` — Scene 4 (IT Support, 4 frames) |

(Note: `snapshots/scene1-final/` from earlier still exists as the
narrower checkpoint for just Scene 1's source files.)

---

## Banner state at this snapshot

**Total composition duration**: 1880 frames @ 30fps ≈ **62.7s**

### Scene timeline

| Frames | Phase |
|---|---|
| 0–260 | Scene 1 plays (existing, untouched) |
| 260–410 | Scene 1 → 2 bridge ("Crafting Proposals" → "Delivering Software Solutions") |
| 390–700 | Scene 2 (code icon → editor → kanban) |
| 700–830 | Scene 2 → 3 bridge ("Delivering..." → "Precision Hiring") |
| 770–1115 | Scene 3 (search → 4 candidates → success) |
| 1115–1240 | Scene 3 → 4 bridge ("Precision Hiring" → "Providing IT Support") |
| 1280–1450 | Scene 4 Frame 1 (ticket card — single fade-in, no sub-stagger) |
| 1430–1525 | Scene 4 Frame 2 (3 dots, fully clear before Frame 3) |
| 1535–1730 | Scene 4 Frame 3 (IT logo + chat bubbles) |
| 1710–1880 | Scene 4 Frame 4 (resolved ticket, holds to end — no checkmark inside card, just green badge) |

### Footer-text staged transitions (5 stages)

```
Stage 1 (frame 38)    : type → "Best at Crafting Proposals"
Stage 2 (frame 295)   : backspace → "Best at "
Stage 3 (frame 340)   : type → "Best at Delivering Software Solutions"
Stage 4 (frame 720)   : backspace → "Best at "
Stage 5 (frame 790)   : type → "Best at Precision Hiring"
Stage 6 (frame 1210)  : backspace → "Best at "
Stage 7 (frame 1265)  : type → "Best at Providing IT Support"
```

---

## Compositions registered (Root.tsx)

| ID | Description |
|---|---|
| `Banner` | Full continuous banner with the soft blue background blob |
| `Banner-Clean` | Same animation but with `showBackground: false` — no blob, plain white background. Use this for the "white frame only" render. |
| `Scene1-PD` | Just Scene 1 in isolation — the original 260-frame composition for snapshot verification |

---

## Recover

```bash
# Inspect what changed since this snapshot:
diff src/BannerStage.tsx       snapshots/all-scenes-v1/BannerStage.tsx
diff src/BannerAnimation.tsx   snapshots/all-scenes-v1/BannerAnimation.tsx
diff src/scenes/Scene4IT.tsx   snapshots/all-scenes-v1/Scene4IT.tsx

# Restore the entire snapshot:
cp snapshots/all-scenes-v1/BannerStage.tsx       src/BannerStage.tsx
cp snapshots/all-scenes-v1/BannerAnimation.tsx   src/BannerAnimation.tsx
cp snapshots/all-scenes-v1/Root.tsx              src/Root.tsx
cp snapshots/all-scenes-v1/Scene1PD.tsx          src/scenes/Scene1PD.tsx
cp snapshots/all-scenes-v1/Scene2SD.tsx          src/scenes/Scene2SD.tsx
cp snapshots/all-scenes-v1/Scene3Staffing.tsx    src/scenes/Scene3Staffing.tsx
cp snapshots/all-scenes-v1/Scene4IT.tsx          src/scenes/Scene4IT.tsx
```

---

## What's next (continuing tomorrow)

The user noted the whole banner needs fine-tuning, scene by scene.
Likely candidates:

- **Scene 1 — pacing**: typewriter speed, shimmer cascade timing
- **Scene 2 — Frame 1 bracket slide** distance and timing
- **Scene 2 — code-line cascade**: per-line stagger
- **Scene 2 — kanban dashboard polish**: bar stagger, donut sweep
- **Scene 3 — candidate cards cascade pacing** + selection cues
- **Scene 3 → 4 bridge** smoothness
- **Scene 4 — Frame 1 ticket fade-in pace** (currently 25 frames, very quick)
- **Scene 4 — Frame 3 → 4 transition** smoothness
