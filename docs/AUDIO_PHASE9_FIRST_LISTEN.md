# Phase 9 — first soundtrack listening and owner creative review

**Owner listening update (31 October 2026):** The owner initially deferred listening to permit technical integration of all 65 recordings in PR #740. Later that day the owner **began listening in the live game around Millhaven** and reported that the title theme was inaudible on opening and on Return to Main Menu, and that the Greenwood/Millhaven soundtrack sounded like cheerful and ominous songs competing. The owner selected default sliders (Master 33%; Music, Ambience, Effects and Interface 100%) and approved an adaptive combat mix where the peaceful music recedes as encounter music rises. These source fixes are grouped in [draft patch #751](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/751), with the separate title report [#750](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/750). **This is a genuine first listening observation, not a Keep/Revise/Replace verdict on each recording or confirmation that the patched game has been heard.** Further owner playtesting is optional at the owner's convenience; no complete 65-track rating is required.

**Stage:** SOUNDTRACK MERGED AND PUBLISHED (PR #740) / INITIAL OWNER GAMEPLAY LISTENING BEGUN / CREATIVE AND INSTALLED-DEVICE ACCEPTANCE STILL OPEN (31 October 2026). The release satisfied its original technical gates; the newly reported playback/mixing patch #751 is independent of that original music integration and is not yet a confirmed device fix.

**Published soundtrack:** The 65 newly authored recordings now replace their original 65 music IDs on [main@63b432e](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/63b432e02e81f1087c66f0f161a180d368e46e65), as [PR #740](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/740) merged and [Pages CI #41242493774](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41242493774) published version `0.9.1+snapshot.dev.248`. All 18 original Crown recordings remain available. The dev.248 soundtrack release originally had 18 environmental beds and 30 recorded effects; separately merged environmental PR #744 increased the current dev.250 environmental inventory to 34 beds (147 total assets). The older draft #737 and source branches are preserved as historical engineering provenance. [Full library](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/audio/index.html) is now the published candidate with the new scores, verified in single Chromium desktop/phone emulation and offline; actual owner iPhone playback remains unverified.

## Owner-friendly first listening

**Verified source inventory (31 October 2026):** Independently compared the pre-merge `main` baseline with the exact soundtrack integration candidate Git object IDs: exactly **65** MP3s changed and they match the 65 `authored-recorded-source-score` manifest IDs; all **18** original Dark Crown MP3 Git blobs match `main`, as do all **18** ambient MP3s and **30** recorded effect files. Manifest IDs are unchanged, with 83 music + 18 ambient + 30 effects. This is **source/asset verification, not streamed-browser or acoustic certification**. The direct MP3 links below are pinned to the previously verified music commit `39047aba3421c398335fbfb22e98740ab9ef4e7e`, so advancing PR documentation cannot silently redirect a first-listening link to a different recording. Safari and other browsers may play the remote MP3 directly or offer Download; that behavior is **not yet device-verified**. The published game scene mixer and TRUE layering are accessible in the [tested live game sound library](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/audio/index.html); isolated MP3 links cannot demonstrate the combined game mix.

**Confirmed test repair:** `tests/audio-audition-browser.test.cjs` previously asserted the retired `Soundtrack listening room` title during offline reload, while the actual HTML is titled `Game sound library`. Corrected in commit `e4d825af21469a59036a79d8befb3e1585db344d`; the full updated room subsequently **passed** [exact-head browser/offline QA #41242212837](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41242212837). The corrected listening room and fresh offline worker subsequently **passed** [full Chromium QA #41242212837](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41242212837). Any remaining real-device observations are tracked separately.

**The live published sound library now includes all 65 new songs.** Open [the game sound library](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/audio/index.html) to hear music, environmental audio, recorded effects and synthesized cues, including synchronous normal/TRUE layers and scene mixes. It was tested in Chromium desktop and phone-emulated contexts, including offline reload, but your installed device has not yet been personally verified. The direct candidate source links below remain pinned to the exact original approved-for-integration file bytes for provenance; they are not a separate release.

The intended first session is a **musical exploration**, not a requirement to rate every file. Start with the narrative arc, then explore character and place identities, then compare one or two action/TRUE arrangements in the already published and browser-tested sound library whenever convenient. The owner can freely stop, skip or revisit tracks. Suggested opening path:

1. **Narrative character:** `title` (*The Unfinished Road*) → `defeat` (*The Road Remains*) → `finale` (*A Road Still Open*). Let the Finale run through its approximately 48-second phrase; listen for continuity rather than a forced numerical motif score.
2. **World identities:** `place-vale` (*Orchard Roads*), `place-march` (*Reedwater*), `place-highlands` (*Payday on the Ridge*), `place-frontier` (*Embers Still Warm*); choose more if curious, particularly Crypt, Archive, Mine and Abyss.
3. **Scene movement:** pair `place-vale` with `action-vale`, then compare `night-vale` and `peace-vale`. Listen for a believable location identity surviving combat and liberation. Use the room's Scene Mixer rather than playing additive stems separately to judge the final blend.
4. **Characters:** compare `boss-thorn` and `boss-thorn-true`, then `boss-crypt` and `boss-crypt-true` using the paired TRUE preview. TRUE files are **additive layers**, not standalone replacements.
5. **Game-world mix:** hear representative registered environment beds separately and in the room's mixed scene preview, with a warning effect at a safe listening volume. The separate environmental studio studies in [#727](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/727) are not part of these integrated recordings or this soundtrack acceptance.

**Useful natural feedback:** What stands out as memorable? Which sound fits its people or place? Does a repeated loop become tiring? Does the action/TRUE part strengthen the original, or drown it out? Are any instruments harsh, unnatural, too similar across regions, or buried? Specific timestamps and track IDs are helpful when something needs work, but a casual reaction in plain language is sufficient.

**Decision vocabulary:** *Keep* (creative approval), *Revise* (concrete unwanted aspect), *Replace* (major identity mismatch), *Unsure* (listen again). A group can be approved while a few members remain unresolved. **Silence or absence of feedback is not an approval.** No score is accepted automatically because its technical checks passed.

## Published music index — 65 authored replacements

These **65 direct MP3 links** are pinned to the exact authored recording bytes now **published in dev.248** (not an alternate unfinished version). They may open a native player or download depending on the browser; physical-device streaming remains unverified. For actual synchronized in-game layering use the [published, browser-tested sound library](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/audio/index.html). An unreviewed song remains **no creative decision**, never automatically Keep.

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
| [Roads Beneath the Banner](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/assets/audio/music/place-crown.mp3) | `place-crown` | Exploration |
| [Roads Beneath the Banner — encounter](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/assets/audio/music/action-crown.mp3) | `action-crown` | Combat additive layer — audition alongside the matching place |
| [Roads Beneath the Banner — after liberation](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/assets/audio/music/peace-crown.mp3) | `peace-crown` | After liberation |
| [The Machinery of Rule](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/assets/audio/music/place-citadel.mp3) | `place-citadel` | Exploration |
| [The Machinery of Rule — encounter](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/assets/audio/music/action-citadel.mp3) | `action-citadel` | Combat additive layer — audition alongside the matching place |
| [The Machinery of Rule — after liberation](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/assets/audio/music/peace-citadel.mp3) | `peace-citadel` | After liberation |
| [Cindermaw's Treasury](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/assets/audio/music/interior-supply-crown.mp3) | `interior-supply-crown` | Interior |
| [Ruined Foundry](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/assets/audio/music/interior-side-crown-foundry.mp3) | `interior-side-crown-foundry` | Interior |
| [The Last Watch](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/assets/audio/music/boss-citadel.mp3) | `boss-citadel` | Boss base |
| [The Last Watch — TRUE](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/assets/audio/music/boss-citadel-true.mp3) | `boss-citadel-true` | TRUE additive layer — audition with its boss base |
| [The Ember Maw](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/assets/audio/music/boss-cindermaw.mp3) | `boss-cindermaw` | Boss base |
| [The Ember Maw — TRUE](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/assets/audio/music/boss-cindermaw-true.mp3) | `boss-cindermaw-true` | TRUE additive layer — audition with its boss base |
| [Crown Without Horizon](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/assets/audio/music/boss-darklord.mp3) | `boss-darklord` | Boss base |
| [Crown Without Horizon — TRUE](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/assets/audio/music/boss-darklord-true.mp3) | `boss-darklord-true` | TRUE additive layer — audition with its boss base |
| [Cindermaw's Treasury — after liberation](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/assets/audio/music/peace-interior-supply-crown.mp3) | `peace-interior-supply-crown` | After liberation |
| [Ruined Foundry — after liberation](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/assets/audio/music/peace-interior-side-crown-foundry.mp3) | `peace-interior-side-crown-foundry` | After liberation |
| [Roads Beneath the Banner — hearths and neighbors](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/assets/audio/music/settlement-crown.mp3) | `settlement-crown` | Settlement |
| [Roads Beneath the Banner — nightfall](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/blob/main/assets/audio/music/night-crown.mp3) | `night-crown` | Night |


## Final integration and optional future listening

- **Implemented and published:** [PR #740](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/740) merged all **65 new music recordings** into the existing IDs, with all **18 original Crown cues** and separate environment/effects unchanged. Exact merged code: [main@63b432e](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/commit/63b432e02e81f1087c66f0f161a180d368e46e65), published as **dev.248** in [Pages workflow #41242493774](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41242493774).
- **Technical tests passed:** [focused audio and 131-file cache/real browser #41242212837](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41242212837), [full impacted source/game tests #41242217799](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41242217799), [Chromium PWA upgrade #41242217802](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/actions/runs/41242217802), and merged-main Pages publication. The verified interactive sound library is now live; former Phase 8 browser and [offline-cache issue #699](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/699) technical blockers are resolved.
- **Title/menu lifecycle:** First browser-authorized gesture starts `title`; returning to the Main Menu restores the title score. In-game Adventure/Settings/pause retain the current area score while gameplay simulation stops; New Game/Continue prepare the location score before character control when possible. The browser cannot promise unmuted playback before any user interaction.
- **Preserved boundaries:** By-ear listening, aesthetic Keep/Revise/Replace decisions, installed iPhone/Chromebook cache refresh and physical-device comfort remain **unverified or deferred**. The owner may listen at any later time without reopening completed technical implementation. Independent environmental redesign [#727](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/727) is not silently included.
- **Historical provenance:** Previous source Phase 3–8 draft branches and their QA remain available in GitHub; they were superseded by the integrated PR. Track-specific feedback may be recorded on the [soundtrack master #673](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/issues/673) after the owner actually listens; silence is not approval.

**Exit:** technical integration, merge, release and documentation are **complete**. Optional creative review and physical-device verification are not claimed and are not blockers to this completed release.
