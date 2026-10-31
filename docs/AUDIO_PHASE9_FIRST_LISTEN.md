# Phase 9 — first soundtrack listening and owner creative review

**Owner decision update (31 October 2026):** First listening is voluntarily deferred until the solo developer has time. The owner authorizes technically verified soundtrack integration/merge without first rating 65 cues. This is **not** a Keep decision for any recording; the below index remains available for optional later feedback. See [audio playback](AUDIO_PLAYBACK.md) and Phase 9 PR #740 for current technical gates.

**Stage:** ACTIVE FOR PREPARATION / FIRST LISTENING NOT YET CONDUCTED (31 October 2026). The owner expressly chose to advance from Phase 8 to Phase 9. This is a **creative acceptance stage**, not another automated codec test or authority to merge/deploy.

**Exact candidate:** [Phase 9 draft branch](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/tree/audio/phase9-first-listening-20261031), stacked on [Phase 8 draft #737](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/737) at `53711b932b5ccb98b8426bbf54d5153651bc6ee0`. Includes Phase 7's 65 authored recorded-source music replacements, 18 original untouched Dark Crown recordings, total 83 music IDs, 18 currently registered environmental beds and 30 recorded SFX. Current candidate build `0.9.1+snapshot.dev.245`. No sound files or game routing are changed by this Phase 9 preparation.

## Owner-friendly first listening

**Verified source inventory (31 October 2026):** Independently compared the exact candidate and current `main` directory Git object IDs: exactly **65** MP3s changed and they match the 65 `authored-recorded-source-score` manifest IDs; all **18** original Dark Crown MP3 Git blobs match `main`, as do all **18** ambient MP3s and **30** recorded effect files. Manifest IDs are unchanged, with 83 music + 18 ambient + 30 effects. This is **source/asset verification, not streamed-browser or acoustic certification**. The direct MP3 links below are pinned to the previously verified music commit `39047aba3421c398335fbfb22e98740ab9ef4e7e`, so advancing PR documentation cannot silently redirect a first-listening link to a different recording. Safari and other browsers may play the remote MP3 directly or offer Download; that behavior is **not yet device-verified**. The unmerged full game scene mixer and TRUE layering require the separately tested listening room, not direct-file links.

**Confirmed test repair:** `tests/audio-audition-browser.test.cjs` previously asserted the retired `Soundtrack listening room` title during offline reload, while the actual HTML is titled `Game sound library`. Corrected on this Phase 9 draft in commit `e4d825af21469a59036a79d8befb3e1585db344d`; **no exact-head test execution claimed**. Parent #737 remains without a successful candidate browser audition and fresh offline #699 remains open.

**Do not accidentally review the published site's older music.** The [published standalone room](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/audio/index.html) is not the Phase 8/9 candidate. Its existing published recording versions must not be treated as these 65 new authored candidates. This branch's MP3 links below identify candidate assets, but a repository-file link has **not** been established as a verified in-browser listening room on iPhone. If a file view offers Raw/Download, it refers to the selected candidate file; the independent scene mixer requires a genuinely runnable branch-preview page. **No branch-specific playable Pages/preview deployment or installation has been verified.**

The intended first session is a **musical exploration**, not a requirement to rate every file. Start with the narrative arc, then explore character and place identities, then compare one or two action/TRUE arrangements in the real listening room once a validated candidate preview is available. The owner can freely stop, skip or revisit tracks. Suggested opening path:

1. **Narrative character:** `title` (*The Unfinished Road*) → `defeat` (*The Road Remains*) → `finale` (*A Road Still Open*). Let the Finale run through its approximately 48-second phrase; listen for continuity rather than a forced numerical motif score.
2. **World identities:** `place-vale` (*Orchard Roads*), `place-march` (*Reedwater*), `place-highlands` (*Payday on the Ridge*), `place-frontier` (*Embers Still Warm*); choose more if curious, particularly Crypt, Archive, Mine and Abyss.
3. **Scene movement:** pair `place-vale` with `action-vale`, then compare `night-vale` and `peace-vale`. Listen for a believable location identity surviving combat and liberation. Use the room's Scene Mixer rather than playing additive stems separately to judge the final blend.
4. **Characters:** compare `boss-thorn` and `boss-thorn-true`, then `boss-crypt` and `boss-crypt-true` using the paired TRUE preview. TRUE files are **additive layers**, not standalone replacements.
5. **Game-world mix:** hear representative registered environment beds separately and in the room's mixed scene preview, with a warning effect at a safe listening volume. The separate environmental studio studies in [#727](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/727) are not part of these integrated recordings or this soundtrack acceptance.

**Useful natural feedback:** What stands out as memorable? Which sound fits its people or place? Does a repeated loop become tiring? Does the action/TRUE part strengthen the original, or drown it out? Are any instruments harsh, unnatural, too similar across regions, or buried? Specific timestamps and track IDs are helpful when something needs work, but a casual reaction in plain language is sufficient.

**Decision vocabulary:** *Keep* (creative approval), *Revise* (concrete unwanted aspect), *Replace* (major identity mismatch), *Unsure* (listen again). A group can be approved while a few members remain unresolved. **Silence or absence of feedback is not an approval.** No score is accepted automatically because its technical checks passed.

## Full candidate index — 65 authored recordings

These **65 direct MP3 links** target the exactly pinned candidate recording files (the unmerged Phase 9 source revision), not the older public soundtrack. They may open a native audio player or prompt for a download depending on the browser; actual streaming and phone playback remain **unverified**. For exact additive gameplay layering, use the independently verified game sound library when available. Keep any unreviewed track at **no decision**, not automatically Keep.

### Primary places — Phase 3 (8)

| Recording | Stable ID | Role |
|---|---|---|
| [Orchard Roads](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/place-vale.mp3) | `place-vale` | Exploration |
| [Reedwater](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/place-march.mp3) | `place-march` | Exploration |
| [Payday on the Ridge](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/place-highlands.mp3) | `place-highlands` | Exploration |
| [Embers Still Warm](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/place-frontier.mp3) | `place-frontier` | Exploration |
| [The Unfinished Retreat](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/place-crypt.mp3) | `place-crypt` | Exploration |
| [Restoration After Rain](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/place-archive.mp3) | `place-archive` | Exploration |
| [Veins and Old Stone](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/place-mine.mp3) | `place-mine` | Exploration |
| [Purple Wings](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/place-abyss.mp3) | `place-abyss` | Exploration |

### Context and liberation variants — Phase 4 (31)

| Recording | Stable ID | Role |
|---|---|---|
| [Orchard Roads — encounter](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/action-vale.mp3) | `action-vale` | Combat additive layer — audition alongside the matching place |
| [Orchard Roads — after liberation](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/peace-vale.mp3) | `peace-vale` | After liberation |
| [Reedwater — encounter](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/action-march.mp3) | `action-march` | Combat additive layer — audition alongside the matching place |
| [Reedwater — after liberation](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/peace-march.mp3) | `peace-march` | After liberation |
| [Payday on the Ridge — encounter](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/action-highlands.mp3) | `action-highlands` | Combat additive layer — audition alongside the matching place |
| [Payday on the Ridge — after liberation](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/peace-highlands.mp3) | `peace-highlands` | After liberation |
| [Embers Still Warm — encounter](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/action-frontier.mp3) | `action-frontier` | Combat additive layer — audition alongside the matching place |
| [Embers Still Warm — after liberation](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/peace-frontier.mp3) | `peace-frontier` | After liberation |
| [The Unfinished Retreat — encounter](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/action-crypt.mp3) | `action-crypt` | Combat additive layer — audition alongside the matching place |
| [The Unfinished Retreat — after liberation](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/peace-crypt.mp3) | `peace-crypt` | After liberation |
| [Restoration After Rain — encounter](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/action-archive.mp3) | `action-archive` | Combat additive layer — audition alongside the matching place |
| [Restoration After Rain — after liberation](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/peace-archive.mp3) | `peace-archive` | After liberation |
| [Veins and Old Stone — encounter](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/action-mine.mp3) | `action-mine` | Combat additive layer — audition alongside the matching place |
| [Veins and Old Stone — after liberation](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/peace-mine.mp3) | `peace-mine` | After liberation |
| [Purple Wings — encounter](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/action-abyss.mp3) | `action-abyss` | Combat additive layer — audition alongside the matching place |
| [Purple Wings — after liberation](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/peace-abyss.mp3) | `peace-abyss` | After liberation |
| [Scornfang's Treasury — after liberation](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/peace-interior-supply-vale.mp3) | `peace-interior-supply-vale` | After liberation |
| [Mirejaw's Treasury — after liberation](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/peace-interior-supply-march.mp3) | `peace-interior-supply-march` | After liberation |
| [Ridge Tyrant's Treasury — after liberation](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/peace-interior-supply-highlands.mp3) | `peace-interior-supply-highlands` | After liberation |
| [Old Orchard Cellars — after liberation](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/peace-interior-side-vale-cellars.mp3) | `peace-interior-side-vale-cellars` | After liberation |
| [Drowned Watchhouse — after liberation](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/peace-interior-side-march-watchhouse.mp3) | `peace-interior-side-march-watchhouse` | After liberation |
| [Old Signal Keep — after liberation](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/peace-interior-side-highlands-signal.mp3) | `peace-interior-side-highlands-signal` | After liberation |
| [Ruined Shrine — after liberation](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/peace-interior-side-frontier-shrine.mp3) | `peace-interior-side-frontier-shrine` | After liberation |
| [Orchard Roads — hearths and neighbors](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/settlement-vale.mp3) | `settlement-vale` | Settlement |
| [Orchard Roads — nightfall](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/night-vale.mp3) | `night-vale` | Night |
| [Reedwater — hearths and neighbors](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/settlement-march.mp3) | `settlement-march` | Settlement |
| [Reedwater — nightfall](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/night-march.mp3) | `night-march` | Night |
| [Payday on the Ridge — hearths and neighbors](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/settlement-highlands.mp3) | `settlement-highlands` | Settlement |
| [Payday on the Ridge — nightfall](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/night-highlands.mp3) | `night-highlands` | Night |
| [Embers Still Warm — hearths and neighbors](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/settlement-frontier.mp3) | `settlement-frontier` | Settlement |
| [Embers Still Warm — nightfall](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/night-frontier.mp3) | `night-frontier` | Night |

### Treasuries and side interiors — Phase 4 (7)

| Recording | Stable ID | Role |
|---|---|---|
| [Scornfang's Treasury](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/interior-supply-vale.mp3) | `interior-supply-vale` | Interior |
| [Mirejaw's Treasury](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/interior-supply-march.mp3) | `interior-supply-march` | Interior |
| [Ridge Tyrant's Treasury](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/interior-supply-highlands.mp3) | `interior-supply-highlands` | Interior |
| [Old Orchard Cellars](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/interior-side-vale-cellars.mp3) | `interior-side-vale-cellars` | Interior |
| [Drowned Watchhouse](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/interior-side-march-watchhouse.mp3) | `interior-side-march-watchhouse` | Interior |
| [Old Signal Keep](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/interior-side-highlands-signal.mp3) | `interior-side-highlands-signal` | Interior |
| [Ruined Shrine](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/interior-side-frontier-shrine.mp3) | `interior-side-frontier-shrine` | Interior |

### Boss and TRUE layers — Phase 5 (16)

| Recording | Stable ID | Role |
|---|---|---|
| [Thorn Underfoot](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/boss-thorn.mp3) | `boss-thorn` | Boss base |
| [Thorn Underfoot — TRUE](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/boss-thorn-true.mp3) | `boss-thorn-true` | TRUE additive layer — audition with its boss base |
| [Keeper of the Winter Works](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/boss-crypt.mp3) | `boss-crypt` | Boss base |
| [Keeper of the Winter Works — TRUE](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/boss-crypt-true.mp3) | `boss-crypt-true` | TRUE additive layer — audition with its boss base |
| [Teeth Beneath the Reeds](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/boss-mire.mp3) | `boss-mire` | Boss base |
| [Teeth Beneath the Reeds — TRUE](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/boss-mire-true.mp3) | `boss-mire-true` | TRUE additive layer — audition with its boss base |
| [The Scholar's Hook](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/boss-archive.mp3) | `boss-archive` | Boss base |
| [The Scholar's Hook — TRUE](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/boss-archive-true.mp3) | `boss-archive-true` | TRUE additive layer — audition with its boss base |
| [Master of Coin](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/boss-ridge.mp3) | `boss-ridge` | Boss base |
| [Master of Coin — TRUE](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/boss-ridge-true.mp3) | `boss-ridge-true` | TRUE additive layer — audition with its boss base |
| [The Mountain Remembers](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/boss-mine.mp3) | `boss-mine` | Boss base |
| [The Mountain Remembers — TRUE](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/boss-mine-true.mp3) | `boss-mine-true` | TRUE additive layer — audition with its boss base |
| [Orders in the Ash](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/boss-warlord.mp3) | `boss-warlord` | Boss base |
| [Orders in the Ash — TRUE](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/boss-warlord-true.mp3) | `boss-warlord-true` | TRUE additive layer — audition with its boss base |
| [His Majesty's Wings](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/boss-abyss.mp3) | `boss-abyss` | Boss base |
| [His Majesty's Wings — TRUE](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/boss-abyss-true.mp3) | `boss-abyss-true` | TRUE additive layer — audition with its boss base |

### Three narrative cues — Phase 6 (3)

| Recording | Stable ID | Role |
|---|---|---|
| [The Unfinished Road](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/title.mp3) | `title` | Main title |
| [A Road Still Open](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/finale.mp3) | `finale` | Complete musical phrase, then peace transition |
| [The Road Remains](https://raw.githubusercontent.com/joedoragon-glitch/azeroth-chronicles-prototype/39047aba3421c398335fbfb22e98740ab9ef4e7e/assets/audio/music/defeat.mp3) | `defeat` | Succession loss |

## Protected reference — original Dark Crown (18)

These are **reference recordings**, not Phase 9 replacement candidates. They remain byte-preserved and cannot be marked for rebuild merely because the 65 new cues are under review. They can be heard for comparison in the Game Sound Library's preserved-original collection.

| Recording | Stable ID | Role |
|---|---|---|
| [Roads Beneath the Banner](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/audio/phase9-first-listening-20261031/assets/audio/music/place-crown.mp3) | `place-crown` | Exploration |
| [Roads Beneath the Banner — encounter](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/audio/phase9-first-listening-20261031/assets/audio/music/action-crown.mp3) | `action-crown` | Combat additive layer — audition alongside the matching place |
| [Roads Beneath the Banner — after liberation](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/audio/phase9-first-listening-20261031/assets/audio/music/peace-crown.mp3) | `peace-crown` | After liberation |
| [The Machinery of Rule](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/audio/phase9-first-listening-20261031/assets/audio/music/place-citadel.mp3) | `place-citadel` | Exploration |
| [The Machinery of Rule — encounter](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/audio/phase9-first-listening-20261031/assets/audio/music/action-citadel.mp3) | `action-citadel` | Combat additive layer — audition alongside the matching place |
| [The Machinery of Rule — after liberation](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/audio/phase9-first-listening-20261031/assets/audio/music/peace-citadel.mp3) | `peace-citadel` | After liberation |
| [Cindermaw's Treasury](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/audio/phase9-first-listening-20261031/assets/audio/music/interior-supply-crown.mp3) | `interior-supply-crown` | Interior |
| [Ruined Foundry](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/audio/phase9-first-listening-20261031/assets/audio/music/interior-side-crown-foundry.mp3) | `interior-side-crown-foundry` | Interior |
| [The Last Watch](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/audio/phase9-first-listening-20261031/assets/audio/music/boss-citadel.mp3) | `boss-citadel` | Boss base |
| [The Last Watch — TRUE](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/audio/phase9-first-listening-20261031/assets/audio/music/boss-citadel-true.mp3) | `boss-citadel-true` | TRUE additive layer — audition with its boss base |
| [The Ember Maw](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/audio/phase9-first-listening-20261031/assets/audio/music/boss-cindermaw.mp3) | `boss-cindermaw` | Boss base |
| [The Ember Maw — TRUE](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/audio/phase9-first-listening-20261031/assets/audio/music/boss-cindermaw-true.mp3) | `boss-cindermaw-true` | TRUE additive layer — audition with its boss base |
| [Crown Without Horizon](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/audio/phase9-first-listening-20261031/assets/audio/music/boss-darklord.mp3) | `boss-darklord` | Boss base |
| [Crown Without Horizon — TRUE](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/audio/phase9-first-listening-20261031/assets/audio/music/boss-darklord-true.mp3) | `boss-darklord-true` | TRUE additive layer — audition with its boss base |
| [Cindermaw's Treasury — after liberation](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/audio/phase9-first-listening-20261031/assets/audio/music/peace-interior-supply-crown.mp3) | `peace-interior-supply-crown` | After liberation |
| [Ruined Foundry — after liberation](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/audio/phase9-first-listening-20261031/assets/audio/music/peace-interior-side-crown-foundry.mp3) | `peace-interior-side-crown-foundry` | After liberation |
| [Roads Beneath the Banner — hearths and neighbors](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/audio/phase9-first-listening-20261031/assets/audio/music/settlement-crown.mp3) | `settlement-crown` | Settlement |
| [Roads Beneath the Banner — nightfall](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/audio/phase9-first-listening-20261031/assets/audio/music/night-crown.mp3) | `night-crown` | Night |


## Technical boundaries, launch and handoff

- **Implemented on stacked draft:** 65 integrated candidate music files from Phase 7 and the Phase 8 library UI; this Phase 9 branch changes only this review guide and maintained documentation. No additional music production, engine behavior or publication work is implied.
- **Previously tested on Phase 7:** physical MP3 render/codec/source integrity, several real online Chromium soundtrack route/mix cases, and decoded audio budget on Phase 7's own branch. Those tests **do not** establish Phase 8/9 standalone-room playback correctness.
- **Still not tested:** Phase 8/9 exact-head real Chromium standalone library, phone interaction, visual/perceptual listening, full offline install; Phase 7's fresh PWA installation blocker [#699](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/699) remains open. The previous attempt reached 73 cached resources without an installed service worker. Owner-approved transition to Phase 9 is **sequencing permission**, not a technical regression waiver or certification.
- **Not authorized/achieved:** merging draft branches, publishing the candidate, broad browser/device matrix, installing on the owner's devices, first owner listening, creative acceptance, or inclusion of the 11 still-unmerged environmental #727 studio previews.
- **Next useful engineering prerequisite for first listening:** demonstrate a reliable, version-identifiable way for the owner to hear *these exact candidate assets* through the designed library. Use the smallest relevant focused room check; avoid repeating the known full-cache CI stall. Any release/deployment still needs separate owner authorization. Once the listening setup is genuinely accessible, invite feedback without presenting an 83-track homework assignment.
- **Feedback landing:** [soundtrack master #673](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/673) and the Phase 9 draft PR. Record decisions for individual IDs only when the owner actually expresses them; preserve all undecided songs and their original physical hashes.

**Exit:** Creative GO/REVISE/HOLD based on the owner's actual hearing, with specific approved/unresolved IDs and actionable changes. Technical quality, merge, live publication, and installed-device confirmation remain separate statuses.
