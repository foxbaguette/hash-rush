# Device testing (BrowserStack Live)

Open this on each device:

    https://foxbaguette.github.io/hash-rush/play.html?diag

Wait about 15 seconds. The coloured line at the top of the green box is the result:

- **GRAPHICS OK · full look** (green): everything runs.
- **GRAPHICS REDUCED · …** (amber): the game runs, but this device refused some effects, and the line says which ones.
  The planet and ships must still be visible. Note the line.
  "sdf off (drew nothing)" means the smooth look was accepted but drew nothing, so the game switched to blocks
  by itself.
- **OK, but no planet or odd ships**: the self-check missed something. Screenshot it.
- **GRAPHICS FAILED** (red): the 3D view did not start. Screenshot the whole box.

The box also names the GPU, so you don't need to know which chip a phone has.

## What to check on each device

1. The diag headline (OK / REDUCED / FAILED).
2. The planet is visible and turning, and the sky has stars.
3. Upright: the phone layout (scoreboard battle log under your name, Attack bottom right).
4. Turned sideways: nothing overlaps.
5. Tap the Menu line: the speed dial opens and closes.

## Devices (one per GPU family, high and low end)

| Device | GPU | Browser | Result |
|---|---|---|---|
| Samsung Galaxy S22 | Adreno 730 or Xclipse 920 | Chrome | |
| Samsung Galaxy S23 | Adreno 740 | Chrome, Samsung Internet | |
| Samsung Galaxy S24 | Xclipse 940 or Adreno 750 | Chrome | |
| Samsung Galaxy A54 / A35 | Mali-G68 | Chrome | |
| Samsung Galaxy A14 / A15 | Mali-G52 / G57 (low end) | Chrome | |
| Google Pixel 8 or 9 | Mali-G715 / Immortalis | Chrome | |
| Google Pixel 6 | Mali-G78 | Chrome | |
| OnePlus 11 or 12 | Adreno 740 / 750 | Chrome | |
| Xiaomi Redmi Note 12 / 13 | Adreno 610 / 710 (low end) | Chrome | |
| Motorola Moto G (any recent) | Adreno 610 (low end) | Chrome, Firefox | |
| iPhone 12 | Apple A14 | Safari | |
| iPhone 15 or 16 | Apple A16+ | Safari, Chrome | |
| iPad (any recent) | Apple M / A | Safari | |

## Forcing the fallbacks yourself

`?glfail=` pretends parts of the graphics fail, to see each fallback without the device that needs it,
for example:

    play.html?diag&glfail=sdf
    play.html?diag&glfail=sdf,planet:full,planet:highp
    play.html?diag&glfail=sdf,sky,glow,smoke,air

Names: `sdf` (the smooth look; blocks instead), `sdfdraw` (the smooth look links but draws nothing; the
self-check switches to blocks after 20 frames), `planet` and `blocks` (block planet and block ships; each
also takes `:full`, `:highp`, and the planet `:16 slots` / `:no chunks`), `sky`, `glow`, `smoke`, `air`.
