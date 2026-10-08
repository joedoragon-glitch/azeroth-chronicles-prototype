# Contextual soundtrack and sound pass · v0.8.90

The game activates an original warm-fantasy score and extends the playback foundation. The 83 local MP3 cues total approximately 20 MiB. They use original deterministic virtual instruments: plucked strings, flute, piano, cello, horn, bells, bowed layers and restrained percussion. No third-party sample or composition is included. Source composition and rendering live in `tools/audio/score-book.json` and `render-score.py`; author/license credits and content hashes accompany every runtime asset.

## Place and encounter identity

| Place | Musical direction |
| --- | --- |
| Greenwood Vale | Orchard Roads: flute, harp, warm major harmony |
| Mirefen Marches | Reedwater: piano, bell and Dorian colors |
| Ironroot Highlands | Payday on the Ridge: horn and dulcimer |
| Ashen Frontier | Embers Still Warm: cello and guitar |
| Crown Province | Roads Beneath the Banner: restrained minor cello/piano |
| Forest Crypt | The Unfinished Retreat: the caretaker's unfinished seasonal residence |
| Sunken Archive | Restoration After Rain: delicate working restoration motif |
| Colossus Mine | Veins and Old Stone: steady haulage rhythm and deep resonance |
| Abyss Bastion | Purple Wings: the Dark Lord's personal dragon and flight project |
| Crown Citadel | Machinery of Rule: controlled formal pulse |

All four treasuries and five side interiors have their own quieter arrangements and peaceful alternatives. Five outdoor regions each have dedicated night and settlement arrangements. The five regions and five main dungeons each pair a main arrangement with a synchronized action stem. All eleven boss families have distinct themes and matching TRUE-form layers; title, defeat and finale have dedicated cues. The score book is the exact track/title/tempo/motif inventory.

## Sound behavior

Combat intensity rises quickly and releases slowly without restarting the tune. TRUE forms strengthen the second boss stem on the same clock. Scene changes crossfade; nearby refuges have a short exit hold to avoid threshold chatter. Menus soften music and ambience, silence world effects and retain interface feedback while the campaign remains frozen. Explicit pause, blur and hidden pages suspend the audio clock. A shared stereo reflection tail and conservative compressor bring layers together; phone and quiet profiles reduce masking.

Selection, confirmation, Back, denied choices and menu opening/closing have distinct short sounds. Footsteps count actual hero distance, including collision stops, with grass/wet/gravel/stone/wood treatments. Sparse birds, night insects, water, restoration drops and mine/foundry resonances use the ambience bus. Existing class, enemy, projectile, companion and warning effects retain their contextual event coverage and reserved voice capacity.

## Playback, offline and verification

Short mono 32 kHz / 96 kbps MP3 loops keep decoded memory within the existing 32 MiB pinned LRU policy. The shared runtime reflection tail creates stereo space. Each loop includes 150 ms codec guards outside its musical loop bounds. Runtime verifies hashes, decoded duration and loop bounds; synchronized stem lengths must match within one context sample. Files are precached after a connected install, while PCM is decoded only as needed. If a recording fails, original procedural music continues; failures are not retried every frame.

The renderer decodes each exported MP3 and rejects nonfinite, silent or clipping output. Node regressions cover exact location/variant/boss mapping, paired loop timing, intensity without restart and movement-only footsteps. Chromium and WebKit browser checks decode all 83 deliverables, check finite audible bounded PCM, verify gesture/background/menu lifecycle and cached production playback during a network outage. The full existing campaign, save, layout, phone gesture and packaging regressions remain release gates.

The independent audition room can switch between the original and new score, stage every boss form in an isolated campaign, play individual assets, compare mixes and export measurements. It never loads persistence or reads/writes campaign saves. Technical measures do not substitute for subjective musical listening; actual phone/headphone comfort and longer musical development can be refined from play feedback. The present cues are developed eight-bar loops, not a live orchestral recording or a claim of device-specific mastering.
