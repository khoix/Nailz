# Nailz!

## Game Concept Proposal

### High Concept

**Nailz!** is a mobile-first 3D carnival game inspired by the Korean street game **못박기 (mot bakgi)**, where two people alternate hammer strikes on the same nail until one of them drives it flush into the wood.

The player faces a computer-controlled carnival operator. Each nail is a short head-to-head round built around precision, timing, and swipe strength. A full match consists of several nails, with the player and operator alternating single strikes on each shared nail until one of them lands the finishing blow.

The core fantasy is simple: **line it up, judge the strike, swing hard, and drive the nail home.**

---

## Design Goals

- Feel immediately understandable on a phone.
- Make every strike tactile and visually satisfying.
- Reward precision and strength without requiring complex controls.
- Make misses readable: the player should understand *why* a strike lost power or bent the nail.
- Keep rounds short enough to encourage repeated play.
- Use simple 3D geometry and animation rather than realistic simulation.
- Make the computer opponent visibly obey the same rules as the player.
- Preserve the carnival-game personality of a human operator challenging passersby.

---

## Match Structure

A default match contains **5 nails**.

For each nail:

1. The operator places a fresh nail into the wooden block and gives it a small setup tap.
2. Player and operator alternate one hammer strike at a time on the **same nail**.
3. The nail retains its current depth after every strike.
4. The first side to drive the nail fully flush with the wood wins that nail.
5. The board resets with a fresh nail for the next round.

The primary match score is simply:

**PLAYER 3 — OPERATOR 2**

Secondary scoring tracks precision and efficiency and can be used for rankings, personal bests, achievements, or tie-breaking.

---

# Core Player Turn

Each player strike is one continuous sequence with four stages:

**position → position → focus → swing → impact**

The stages should feel like one act of lining up and swinging a hammer, not four separate minigames.

---

## Stage 1 — Vertical Position

The camera moves into a near-top-down view centered on the nail head.

A faint targeting guide is permanently centered on the nail:

- faint horizontal goal line
- faint vertical goal line
- faint circular goal area at their intersection

A brighter **horizontal moving line** travels vertically up and down across the nail.

The player taps to stop it.

Its final position determines the hammer's **Y-axis impact point**.

The line should bounce smoothly between its limits until the player taps.

---

## Stage 2 — Horizontal Position

A brighter **vertical moving line** then travels horizontally across the nail.

The player taps to stop it.

Its final position determines the hammer's **X-axis impact point**.

Together, the stopped horizontal and vertical lines define exactly where the hammer face will contact the nail head.

The closer this intersection is to the center of the nail, the more efficiently the strike can transfer energy downward.

---

## Stage 3 — Strike Quality / Power Cap

A circular targeting reticle appears around the chosen X/Y impact point.

It begins large and **shrinks inward once** toward the target circle.

The player taps when the shrinking reticle most closely matches the ideal goal circle.

Unlike the first two targeting indicators, this reticle does **not** repeat or bounce. It is a one-time timing challenge.

This establishes the maximum usable power for the upcoming swing.

Conceptually:

- Perfect reticle timing: up to 100% usable power
- Slight miss: slightly reduced power ceiling
- Moderate miss: substantially reduced ceiling
- Large miss: severely limited power

Exact values should be tuned through playtesting rather than exposed directly to the player.

---

## Stage 4 — Hammer Swing

After targeting is complete:

1. Targeting graphics disappear.
2. The camera rapidly pulls back and tilts into an upright cinematic view.
3. The hammer is already raised over the nail.
4. A short **SWIPE!** prompt appears.
5. The player swipes downward to swing.

The swipe determines requested swing strength.

Useful input factors may include:

- swipe velocity
- swipe distance
- continuity / decisiveness of the motion

The resulting power is capped by the maximum established during Stage 3.

Conceptually:

**Actual Swing Power = min(Swipe Power, Precision Power Cap)**

A weak swipe remains weak even after perfect targeting. A maximum swipe only produces maximum force if the preceding targeting was also excellent.

---

# Impact Model

The game should use deterministic arcade physics rather than a full rigid-body simulation.

Each impact has two useful components:

- **downward force**, which drives the nail deeper
- **lateral force**, which bends or deflects the nail

A perfectly centered strike sends almost all usable energy downward.

As the impact location moves farther from center, progressively more of the strike's energy is diverted into lateral force instead of useful downward movement.

Conceptually:

**Effective Downward Force = Actual Swing Power × Accuracy Efficiency**

Accuracy efficiency decreases with distance from the nail-head center.

The player does not need to see this formula. The animation should make the result intuitive.

---

## Nail Depth

Each fresh nail begins at a fixed exposed height.

A theoretically perfect strike — centered X/Y position, perfect reticle, and maximum swipe — can drive a fresh nail completely flush in **one hit**.

Anything less leaves some portion exposed.

The nail itself should be the main progress indicator:

- fully exposed
- partially driven
- nearly flush
- flush

Avoid a conventional health bar unless testing shows one is necessary.

---

# Nail Bending

Off-center strikes bend the nail **away from the side that was hit**.

Examples:

- hammer lands left of center → nail bends right
- hammer lands right of center → nail bends left
- hammer lands above center → nail bends downward on screen
- hammer lands below center → nail bends upward on screen
- diagonal impact → combined bend direction

Bend severity depends on both:

**distance from center × applied swing power**

A weak near-center miss may barely bend the nail. A powerful edge hit may create a dramatic deflection.

Before the next strike, the operator automatically straightens the nail so neither side inherits an unfairly damaged target.

The bend still matters because it:

- wastes useful downward force
- triggers a score penalty
- creates visual feedback
- gives the operator an opportunity for a short reaction animation

The straightening animation should be brief enough that it never slows down repeated play.

---

# Shared-Nail Strategy

Player and operator always strike the **same nail**.

This creates the core tension of the game:

A strong strike may leave the nail barely protruding from the wood, giving the opponent an easy finishing opportunity.

Likewise, the operator may leave the player with a nail that only needs one clean finishing blow.

This makes every incomplete strike consequential and gives the game more tension than two players independently driving separate nails.

---

# Computer Opponent

The operator should not simply roll a random damage value.

Internally, the operator should use the same conceptual variables as the player:

- X accuracy
- Y accuracy
- strike-quality timing
- swing strength

Difficulty changes the probability distributions of those values.

### Easy

- noticeable aiming errors
- occasional weak swings
- occasional dramatic bends
- rarely lands perfect hits

### Normal

- generally competent
- still visibly imperfect
- capable of strong and centered hits
- occasional mistakes create comeback opportunities

### Hard

- consistently accurate
- strong swings
- relatively few major mistakes
- still human-like rather than mechanically perfect

### Champion / Expert

- near-perfect carnival operator
- extremely small error range
- can threaten one-hit nails
- should never cheat or ignore the same mechanics used for the player

Computer misses should be shown visibly. If the operator hits left of center, the hammer should visibly land left and the nail should bend right.

---

# Scoring

## Primary Score

The primary outcome is **nails won**.

Example:

**PLAYER 3 — OPERATOR 2**

This should determine the winner of the match.

## Secondary Performance Score

Award points for:

- centered strikes
- high usable power
- large amounts of useful nail depth
- efficient power transfer
- one-hit finishes
- winning a nail

Deduct points for:

- bending the nail
- severe off-center impacts
- wasted swing power
- excessive strikes required to finish a nail

The secondary score should support mastery, personal bests, achievements, and future leaderboard systems without obscuring the simple win/loss condition.

---

# Feedback Language

Most feedback should come from physical animation, sound, and camera behavior rather than numbers.

Optional short callouts include:

- **PERFECT!**
- **CENTERED**
- **OFF LEFT**
- **OFF RIGHT**
- **BENT!**
- **BIG HIT!**
- **ONE HIT!**
- **NAILED IT!**

Avoid flooding the screen with simultaneous statistics.

The player should be able to infer:

> I hit too far left, so the hammer clipped the left side, some force was wasted, and the nail bent right.

That cause-and-effect readability is a core success criterion.

---

# Camera Design

Use three main camera states.

## 1. Booth View

Shows:

- carnival operator
- wooden hammering block
- nail
- hammer
- booth environment

Used for setup, reactions, transitions, and round results.

## 2. Target View

Near-top-down, tightly centered on the nail head.

Used for the two moving axes and shrinking reticle.

The goal lines and circle should remain faint so they guide without overwhelming the scene.

## 3. Impact View

The camera pulls back and tilts toward a more upright angle showing the raised hammer, nail, and block.

Used for the player's swipe and impact.

Strong impacts may add:

- brief camera shake
- small hit-stop
- tiny pre-impact slow-down on exceptional swings
- wood dust / particles
- block vibration

Transitions should be fast and arcade-like rather than cinematic and slow.

---

# Art Direction

The game should feel like a colorful Korean-inspired street-festival or carnival booth rather than a realistic construction simulator.

Use simple stylized 3D geometry with strong silhouettes and exaggerated reactions.

Important visual elements:

- thick wooden hammering block
- oversized hammer
- shiny metal nail
- colorful booth counter
- fabric canopy or signage
- hanging prizes
- string lights
- operator character

The operator provides much of the game's personality through short animations and expressions:

- confidence before a swing
- smug reaction after a great hit
- surprise after a miss
- irritation while straightening a badly bent nail
- disappointment when the player wins
- celebration after taking a nail

Keep all reaction animations short and skippable through natural gameplay pacing.

---

# Audio and Haptics

Audio should strongly reinforce strike quality.

Use distinct layers for:

- hammer whoosh
- metal impact
- wood impact / resonance
- nail movement
- bend sound
- successful flush hit
- crowd / booth ambience
- operator reactions

On supported mobile devices, use haptics sparingly:

- subtle tap when targeting locks
- stronger pulse on hammer impact
- distinctive heavy pulse for a perfect finishing strike

---

# Mobile-First Controls

The entire game should be playable comfortably with one thumb.

Controls:

- tap to stop vertical targeting
- tap to stop horizontal targeting
- tap to lock shrinking reticle
- downward swipe to swing

No persistent virtual joystick is needed.

Prevent browser scrolling, pull-to-refresh, text selection, and overscroll from interfering with gameplay gestures.

Portrait orientation is the primary layout.

Desktop fallback:

- mouse click = tap
- mouse drag downward = hammer swipe

---

# Pacing

Target experienced-player timing per strike:

- first line: ~1–2 seconds
- second line: ~1–2 seconds
- shrinking reticle: ~1 second
- swipe and impact: ~1 second

A skilled player should complete a full strike in approximately **4–6 seconds**.

Operator turns should generally be slightly faster than player turns.

The full game should feel short enough to encourage immediate replay.

---

# Difficulty and Tuning Variables

Keep the following values data-driven so they can be tuned without rewriting gameplay code:

- line movement speed
- reticle shrink speed
- nail-head target radius
- perfect-hit radius
- accuracy-to-efficiency curve
- bend threshold
- bend severity curve
- swipe velocity normalization
- maximum nail depth per hit
- starting nail height
- operator aim distributions
- operator power distributions
- number of nails per match
- score multipliers and penalties

Difficulty should primarily change timing windows and opponent consistency, not alter fundamental rules.

---

# Suggested Game States

A clean implementation can use a finite-state flow such as:

1. `MATCH_INTRO`
2. `NAIL_SETUP`
3. `PLAYER_TARGET_Y`
4. `PLAYER_TARGET_X`
5. `PLAYER_RETICLE`
6. `PLAYER_READY_TO_SWING`
7. `PLAYER_IMPACT`
8. `IMPACT_RESOLUTION`
9. `NAIL_STRAIGHTEN`
10. `OPERATOR_AIM`
11. `OPERATOR_SWING`
12. `OPERATOR_IMPACT`
13. `ROUND_RESULT`
14. `NEXT_NAIL`
15. `MATCH_RESULT`

Exact naming is flexible, but gameplay state should be explicit rather than inferred from animation state.

---

# Physics / Gameplay Data Model

Each nail should track at minimum:

- current depth
- total length
- temporary bend vector
- whether it is flush
- strike count
- current round owner / winner state

Each strike should resolve from a compact result structure containing values such as:

- X offset from center
- Y offset from center
- radial accuracy error
- reticle quality
- swipe power
- capped usable power
- downward-force fraction
- lateral-force fraction
- resulting depth change
- resulting bend magnitude and direction
- perfect-hit flag
- finishing-hit flag

This keeps visual presentation separated from gameplay calculation and will make balancing easier.

---

# First Playable / Vertical Slice

Do **not** build the full carnival presentation first.

The first playable should contain only:

- one wood block
- one nail
- one hammer
- one player
- one simple computer opponent
- top-down targeting camera
- two-axis timing mechanic
- shrinking reticle
- swipe-to-swing input
- nail depth calculation
- off-center power loss
- visible nail bending
- operator alternating turn
- finishing condition

Primitive 3D geometry is acceptable.

The vertical slice should prove four things before expanding scope:

1. **Axis timing feels good.**
2. **The shrinking reticle creates useful tension.**
3. **Swipe strength feels connected to hammer power.**
4. **Impact animation clearly communicates useful force versus wasted/bending force.**

Only after that loop is fun should development expand into:

- multiple nails
- full match flow
- difficulty modes
- scoring
- operator personality
- polished booth environment
- sound and haptics
- achievements
- progression
- visual effects

---

# Core Design Rule

Every part of the game should reinforce one intuitive relationship:

**Where you hit determines how efficiently your strength becomes downward force.**

A perfect player should be able to line up dead center, maximize the reticle, deliver a full swipe, and drive a fresh nail completely flush in one spectacular strike.

A powerful but inaccurate player should visibly waste energy by glancing off-center and bending the nail.

If players can understand that relationship simply by watching what happens on screen, **Nailz!** has succeeded at its core mechanic.
