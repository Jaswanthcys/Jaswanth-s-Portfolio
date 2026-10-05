# Design Brief — KM Personal Archive

## Direction

A premium cinematic personal archive that opens like a quiet, original samurai-duel film sequence and then becomes a precise, readable portfolio. The design uses no copyrighted characters, no external imagery, no WebGL, no generic developer cards, and no conventional pill navbar. It balances controlled drama with the usability and calm spacing of a professional portfolio rather than a game UI.

## Movement and principles

- Start in near-black silence; a deliberate click enters a short, timeline-driven duel. Let anticipation, stillness, flashes, and the blade-reflection transition create the reveal.
- Keep one fixed, persistent moonlit world behind the entire portfolio. Canvas silhouettes move slowly on the right so the left-side hero text stays clear; dark veils preserve contrast.
- Use a restrained sticky glass header, archive-style labels, thin borders, metallic lines, and generous editorial spacing. No pill navigation, white cards, or spinning/tilting cards.
- Motion is intentional and few-layered. Use Canvas/rAF and CSS transforms; honor reduced motion and touch input. Controls remain useful when audio is off.

## Color philosophy

- Ink black and charcoal form the base; brushed-silver and cool moonlit blue-white provide text, borders, and rim light.
- Warm orange/red is reserved exclusively for sword impacts, sparks, and their brief flashes.
- Maintain readable contrast with a dark translucent veil over moving scenery.

## Layout paradigm

A single anchored, long-form page: cinematic entrance, hero, skills loadout, mission archive, profile dossier, chronological journey, contact mission. Put key information in the central hero first; let each later section use a distinct editorial layout without breaking the shared archive language.

## Signature elements

- Original 2D Canvas duel silhouettes, moon, fog, dust, ground reflection, film grain, vignette, and minimal camera shake.
- Katana impact spark/flash; a final blade landing and bright reflective transition.
- A KM symbol and small archive/HUD micro-labels, Tokyo clock, target-reticle cursor on desktop, and a restrained contact katana silhouette.
- A local moonlit environment plate can support (never replace) the procedural scene; no third-party/remote media.

## Interaction and animation

- One explicit Enter gesture gates both audio initialization and intro playback. The progress is derived from the duel timeline and terminates at precisely 100% before portfolio reveal.
- Audio cues are synthesized by Web Audio API and can be silenced at any moment.
- Header links anchor to the requested sections; work/contact HUD buttons have visible focus, arrow travel, a small border-light sweep, and optional hover sound.
- Mission panels use small cursor-following parallax/light and subtle drift without rotation. A project surface navigates once to its repository, with any configured live URL an independent sibling.
- Timeline and section entrances reveal gently; reduced-motion mode uses a static background and simple fades.

## Typography system

Use locally available/system sans-serif and monospace stacks only—no remote fonts. Large, composed uppercase hero typography contrasts with small tracked HUD labels and readable body text. Preserve spacious line-height and mobile wrapping.

## Brand essence and voice

Brand: **KM // PERSONAL ARCHIVE** as an editable, replaceable placeholder until the owner supplies a final brand. The voice is direct, quiet, craft-focused, and confident; avoid theatrical game jargon outside small section labels.

## Logo / signature color

Create a distinct, flat KM icon for the header, project identity, and favicon: a simplified moon/blade mark with a strong small-size silhouette on a full-bleed charcoal square. Keep it minimal, opaque, and free of gradients, shadows, text artifacts, or tiny details. The signature non-impact colors are charcoal and cool silver; impact orange belongs only to combat sparks.
