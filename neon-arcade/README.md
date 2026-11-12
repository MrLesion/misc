# NEON ARCADE intro

Animated NEON ARCADE logo assets:

| File | What it is |
|---|---|
| `neon-arcade-intro.js` | Drop-in JS component — renders the animated intro into any element, with a dynamic byline |
| `index.html` | Demo page: type a game name and replay the intro |
| `neon_arcade.svg` | Standalone animated SVG (static byline "By lesion.dk") |
| `neon_arcade.gif` | 1024w GIF version (plays once) |

## Component usage

```html
<div id="intro"></div>
<script src="neon-arcade-intro.js"></script>
<script>
  NeonArcadeIntro.mount('#intro', { gameName: 'Tetris' });
</script>
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `gameName` | `string` | `'YOUR GAME'` | Game shown in the byline |
| `byline` | `string` \| `(gameName) => string` | `` (g) => `presents ${g}` `` | Custom byline text |

`mount()` resolves to `{ el, replay }` — call `replay()` to run the animation again
(e.g. after changing the game name).

### Animation sequence

1. Star fades in (0.9s)
2. Letters of "NEON ARCADE" blink in randomly, like neon tubes (staggered flicker)
3. Byline — `presents {gameName}` — fades in below
4. Light-sweep shimmer glides across the title, continuously

The Orbitron font is loaded from Google Fonts automatically (with a graceful
fallback if offline). All animation is pure CSS; honors `prefers-reduced-motion`.

The star is a vector trace of the original artwork (14-vertex polygon, 0.967 IoU
against the source bitmap) filled with the original pink/plum gradient.
