# E3 balance checkpoint

Reproduce with `npm run balance`. The checked-in `balance.json` uses seed 20261004, 20,000 fresh-nail input samples and 2,000 five-nail matches per preset. First starters are split equally and alternate across nails. Each simulated human uses a fixed Normal input distribution. These are model comparisons, not measured human skill or fun.

| Operator | Mean radial error | Fresh one-hit | Mean strikes / match | Operator match wins |
| --- | ---: | ---: | ---: | ---: |
| Easy | 0.934 | 0.10% | 24.53 | 17.05% |
| Normal | 0.490 | 0.62% | 18.02 | 49.45% |
| Hard | 0.253 | 2.54% | 13.60 | 64.35% |
| Champion | 0.089 | 21.81% | 10.15 | 70.70% |

All inputs use the shared resolver. Difficulty never reads depth, score, or the opponent. Non-perfect aim uses symmetric triangular X/Y error; focus and requested power use uniform bounded samples. Perfect samples occupy the same reachable aim/focus/full-swipe window as human one-hit strikes. Preset parameters live in `src/game/ai.ts`.

## Findings and limits

- Accuracy, fresh-nail force, and simulated match success increase across presets. Easy misses entirely about 6.13% of the time; the other error envelopes stay within contact range.
- Normal's nail starter wins 52.07% of nails. Against Hard, starters win 58.74%; against Champion, only 24.47%. The latter is a genuine shared-nail effect: a strong partial hit often presents an easy finishing strike. Champion wins 81.2% when the proxy human starts the match versus 60.2% when the operator starts. Do not hide this with adaptive damage or score-dependent rolls.
- An initial Champion perfect-sample rate of 8% produced only 58.65% match wins, below Hard. Raising that input-only rate to 22% gives useful preset separation, but its one-hit frequency and short matches need human playtesting. Alternating starters and swapping local rematch starters preserve transparent opportunity sharing; they do not erase every matchup's starter effect.
- Match length is measured in strikes, excluding handoff, decision, and pause time. It is not a wall-clock duration estimate. Real humans can improve aim and focus independently of this fixed proxy.
- Local mode never samples AI. Both players use identical timing, power normalization, and strike rules. No simulation establishes physical-phone handoff comfort or gameplay enjoyment.

## Secondary points

Each applied strike awards rounded inserted depth × 100, plus 100 for finishing, plus 50 for a one-hit nail. A complete miss costs that striker 10; a contact bend above 0.08 radians costs that striker 5. Points can go negative. Awards and penalties apply exactly once at contact, independently for each actor. The finisher wins the nail; the most nails wins the match, regardless of performance points. All five nails are played.
