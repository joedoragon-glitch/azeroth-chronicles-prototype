> **Historical checkpoint:** [PR #439](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/439) merged on 25 October 2026. The draft, implementation and next-step directions below describe that earlier candidate; they are not an instruction to resume or re-merge it. Consult [Development state](DEVELOPMENT_STATE.md) and current source for present behavior and acceptance.

# PR #439 — Area 3 implementation

At this checkpoint the work was a development candidate; PR #439 later merged.

- `input.js` owns a transient, insertion-ordered queue with stable request IDs,
  16 pending entries across all slots, no deduplication and no silent eviction.
  Rejected additions show **Queue full (16). Input rejected.** / **Cola llena
  (16). Entrada rechazada.** No queue state enters campaign saves.
- Each slot dispatches only its oldest pending request. Other slots retain
  independent readiness; one charge preparation runs at a time. Normal requests
  do not wait for charged-only recovery or charge-interruption recovery.
- Every new keyboard/pointer/touch contact classifies a new request. Under 0.20s
  is Normal; 0.20–0.25s cancels that ambiguous new input; 0.25s accepts Charged,
  followed by genuine 0.65s preparation once both timers permit. Identical forms
  append too. A contact cancellation removes only that contact's request.
- Successful/failed releases or interrupted preparation consume only that entry.
  Target loss gives existing feedback and removes the failed head, so impossible
  casts cannot block the backlog forever. There is no automatic chase.
- Menu, pause, focus loss, background and Recall deliberately clear pending
  input. The HUD states Menu/Recall clears the queue; lifecycle clearing reports
  cancellation. Zone, campaign, death, held/scatter, peace or lost-rank changes
  invalidate transient requests. Reload starts empty. These are intentional input
  safety boundaries, not save changes.
- Paladin's short tap to lower an active Shield Stance acts immediately and
  preserves an older queued Charged Shield Bash. Raising stance retains native
  expiry/cooldown behavior.
- Skill buttons expose every entry's order/form in English/Spanish accessible
  labels and titles, plus compact numbered C/N order. World markers show slot
  and C/N in gold/blue and wrap after eight entries; preparation cues remain tied
  to actual charging.

## Hawk retreat audit

Optional Rogue regroup/escape, authored withdrawal movement, and ranged
backpedal (including eligible bosses/captains) retain family-specific cancellation
and 4.0–4.6s suppression. Committed offensive warnings remain committed; blocking
movement does not delete damage or alter warning clocks. Returning/leash/reset,
Thornfang's protected introductory retreat, offensive aerial flights, and boss
healing phases are excluded. Abyss Go-Around is a heal earned by completing its
flight, not a free tactical withdrawal: it keeps its native path/heal requirements
and cannot be converted into an interrupted/no-cost heal. There is no blanket
boss immunity to interruption of optional tactical retreats.

## Verification checkpoint

`hero-skill1-area3-input` passes through the production shell in English/Spanish:
owner's exact Charged→Normal sequence, four alternating entries, normal-ready
non-overtaking, other-slot dispatch, stable identities, duplicate forms,
ambiguous release, touch cancellation, keyboard, blur, menu, capacity feedback,
and stance lowering. `hero-skill1-stage1` and `hero-skill1-area2` pass locally.
Dedicated retreat tests and the integrated code review now pass; see the Area 4 final review for current CI and browser/play limitations.

The original CI blockers have been reproduced and repaired: the audio fixture now
makes a legal hero contact on Thornfang and refreshes earned throne availability;
the reference test checks both form timers and resolves hawk contact before damage
comparison. This exposed a real pre-existing reference mismatch: shared landed
Slow duration adds 0.25s in `combat.js`; the Journal now includes that bonus,
without changing gameplay. `audio-scheduler` and all 192 `skill-reference` cases
pass locally. Final CI evidence will be recorded after integration.
