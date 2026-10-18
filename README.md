# The Hash Rush

A planet-mining game on WAX. Crews fly ships built from their Alien Worlds crew cards, fire
Alien Worlds weapons at a shared voxel planet, and race each other to the one block that holds
the hash. The game state lives on the `planetmining` contract (source is kept separately).

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Landing page: live hero scene, wallet login (Anchor, WAX Cloud Wallet) and sign-up |
| `play.html` + `play.js` | The game: the current planet, crews active in the last 30 minutes, the attack log replayed live, kill feed, hangar (crew, weapon, playertag) and the Attack button with its cooldown |

## Shared code

- `chain.js`: WAX reads (players, track, log, config) and wallet actions (signup, settag, setequip, attack)
- `vendor/wharfkit.js`: WharfKit session, web renderer, Anchor and Cloud Wallet plugins, bundled into one ES module
- `planets-data.js`: the 20 planets and how they are built in layers
- `aw-data.js`: Alien Worlds crew and weapon templates (cards, shines, attack, defense, art)
- `aw-designs.js`: a ship design per crew card and an animation per weapon, scaled by rarity and shine
- `weapons-lib.js`: the effects engine the weapons run on
- `hero-gl.js`: WebGL renderer for the landing page hero
- `space.js`: the space backdrop
- `ui.css`: shared styles (buttons and labels)

## Run locally

Any static file server works, for example:

```
npx serve .
```

`play.html?as=<account>` shows the game as that player, read-only (for testing).
