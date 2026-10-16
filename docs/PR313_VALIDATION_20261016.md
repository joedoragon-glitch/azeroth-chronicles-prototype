# PR #313 authorized validation · 16 October 2026

Joel explicitly authorized all necessary testing, workflow, repairs and proper audit followed by merge once the evidence supports it. Historical source-only restrictions and the separate merge permission are superseded. This is the single continuing workstream.

Starting source: 5ba83325ed399f18ff726b57496ba9df9c04a88d. Main remains 6bc27be31792b1c38147d61e98ceed6acf3e2560.

## Initial execution findings and repairs

- Build failed because templates/game.html omitted party-pets.js despite the asset inventory including it. Added the owner after party.js so all generated entries actually load pet behavior.
- Syntax checking rejected a duplicate hero/zone/deaths declaration in Cindermaw retaliation. Reused the already captured lifecycle guards, preserving fatal-hit protection.
- Formatting failed on twenty source/tool/test files. Applied the locked formatter; no numerical tuning was requested or introduced.
- Native Chromium acceptance caught unknown pet families drawing a generic ally footer. Reject unknown families before any painting.
- Fatal aerial regression caught ordinary crowd blocking interrupting authored flight/charge endpoints. Scripted motions retain terrain checks and their authoritative contact owner while normal walking retains body blocking. All 24 fatal aerial class/mode/Succession cases and 24 unforced scheduler pilots pass after this repair.
- PT-001 acceptance fixture assumed TRUE engagement starts without its opening summons. Explicitly deplete that authored pack before testing empty-pack eligibility; actual unforced Developer refill remains required. Focused PT312 combat suite passes, including both automatic refill forms, cargo range evasion and court/ground placements.

## Execution status at first recovery checkpoint

Build and JavaScript syntax pass: 204 campaign assets, 14 historical assets. Full Node run remains in progress with retained failures; it is not green. Full check stops at stale sprite canonical references. Community browser run progressed to native art but detected a state mutation; diagnosis pending. All failures must be resolved and applicable evidence rerun before merge.

Pinned Playwright browser download returns invalid/truncated archives locally. An existing Chromium 153 binary is available for local native checks; hosted pinned Chromium/WebKit gates remain required. No physical-device or human listening certificate is claimed.

No merge or release has occurred. Next: finish failure triage, native state-mutation repair, sprite canon reconciliation, matched balance and all full hosted gates. All original source/provenance receipts and accepted sprite bytes remain retained.

## Director adjustments during validation

- Rogue actor cast bars now display the actual committed skill name, with viewport clamping for long names; concealed anonymous Broodscreen preparation retains its established hidden identity. The existing native Rogue browser fixture now checks the actual name and viewport bounds rather than the retired generic label.
- Greenwood quest-5 Chronicle now states that Thornfang and his wolf packs patrol the approaches to the Dark Lord's unfinished estate, replacing the obsolete suggestion that the wolves disregard his ownership. Source checked against Thornfang's Crown wilderness-scout/K9 and estate-patrol history in data.js. No quest identity, trigger or reward changed.
- Native body fixtures now finalize factory legacy migrations before asserting draw purity; the diagnostic retains exact field diffs if rendering mutates initialized state. Garun's browser construction pilot uses a legal interior vantage that admits actual previewed support sites under the new full-footprint marks; the original location legitimately admits none.
- Legacy tests now exercise the named branch of the approved alternating species/named Rogue basic policy, expect the approved Scornfang 120 radius, and accept reconstruction of missing historical victory maps while retaining invalid equipment/pending rejection. TRUE pet save fixtures now carry the established Awakening phase for a defeated TRUE Dark Lord.
- Jet displacement retains terrain and trap safety while bypassing ordinary body avoidance as forced movement. Diagnostic attack-placement failures have an explicit silent audio disposition.
- Cooldown audit telemetry now counts actual gradual support-heal HP ticks; the support start's announced budget is not actual healing. The prior instant-heal observer falsely reported an accounting gap.

## Additional owner scope, dev.68 candidate

The owner explicitly requested optional personal names, medieval women’s clothing for Mira, Sela, Neri, Dara, Lyss (dictated “Liz”) and Vera, female Marshal Veyra, a learned-only Skill journal, and a transparent TRUE boss aura. These are integrated in the existing owners, with no new combat statistics or second inventory system.

Hero naming is optional at class selection; deferred naming is reachable through Inventory → Character and identity. Each companion/pet can receive one permanent custom name from Company → Name companions; skipping consumes nothing. Original unit IDs and pet family names remain authoritative. Recovery/rest/reserve/save preserve the custom label. Rescued smiths offer free cosmetic weapon/armor labels directly and through the barracks specialist hub; upgrades and Succession preserve those equipment labels. Claiming the real throne offers a separate optional regnal name; deferred choice stays available under Character.

The six named specialists now share profession-appropriate gowns/kirtles/work dresses and aprons across captive/rescued states, with braids/coifs and existing tools. Veyra has an open-faced crested helmet, pinned pale braid and plated surcoat, retaining her imposing shield/polearm silhouette. Existing handoffs retain their original records and append the dated owner revision and reproducible CPU Canvas references. No new generated sprite was registered or accepted.

TRUE bosses now use one shared aura behind the body: hollow translucent corona, fine tapering threads, open wisps and slow motes. Reduced motion freezes it. The old filled body ellipse and duplicate boss floor rings are removed from procedural and registered-sprite overlays; authored regalia remain. Transparent-centre/state-purity/reduced-motion checks pass. Native review remains a separate required gate.

PT-013 native/world acceptance found a Highlands bridge blocked by a settlement house: bridge road reservation must consider terrain before street props are cleared. The road corridor cleanup now includes houses when a new bridge approach is added; environment migration version 2 preserves existing actor/tribute facts. PT-016 arrival review additionally found the first Crypt/Archive sentry within immediate perception; move that individual receiving post to (350,450), retaining every native guardian/trap, with interior migration version 3. Focused world/interior acceptance passes.

### Reported unexplained return to town

The owner reported a possible living return to town while retreating from a boss. Source tracing found that automatic outdoor recovery belongs to fatal damage; ordinary disengagement does not relocate the hero. Eighteen live Thornfang retreat pilots (three classes × three modes × normal/TRUE, 60 seconds each) pass without a living relocation. Fatal damage now emits a source/damage/pre-hit-HP receipt and a prominent six-second “Defeated · Recovered…” warning; Developer immortality remains in place and emits no false defeat. This does **not** claim reproduction of the reported event. The owner explicitly accepted this limited improvement and asked to continue without spending further time on the unresolved observation; further owner playtesting may provide a reproduction.

Focused personalization lifecycle, 11 pet families, invalid imports, historical unnamed saves, Succession equipment inheritance, TRUE aura raster properties, and menu shell tests pass. Native personalization browser tests are being completed across the five desktop/phone profiles in both engines; new coverage is wired into both strict existing Community Snapshot steps. Full candidate certification is still pending.

### Regional map/navigation audit

The owner also requested that all regional maps reflect the latest world changes. Maps already read the current zone’s roads, entrances, buildings and actor coordinates; these remain authoritative, with Thornfang’s tracking clues preserved instead of a live patrol marker. The audit found two integration gaps: the overview painted solid houses/trees as if they were water, and route/nearby-interaction lookup ignored a rest site’s migrated service frontage. Terrain and solid scenery now have distinct overview treatments. Map and quest navigation share one engine route resolver that prefers the actual service point; nearby interaction uses the same frontage. Travel/entrance rows explain that navigation walks to the service rather than purchasing travel or entering automatically. New acceptance checks cover all five current regions, historical migration, real approach routes and state purity; Chromium/WebKit native captures cover each map at each profile.

### Chronicle detail contrast

Owner screenshot shows the Trail witness “Last sighting…” detail nearly invisible. Root cause: the generic amber-card detail color `#4c3a1b` also applied to dark Chronicle cards, and the 0.75em size became nine pixels on phone. Chronicle details now use opaque pale silver `#dce5e0` at the body text size. The shared native notice test reproduces this exact report, verifies at least 4.5:1 text contrast and 12px size with wrapping, and saves a screenshot in Chromium and WebKit. This is an explicitly authorized readability correction; the generic amber milestone style remains distinct.

### Roaming interception and further browser audit findings

Owner reports that intercepting a moving boss sometimes receives no reaction, even without damage. Reproduced source path: an invalid pre-engagement charge is deflected before engagement, so the patrol continues. Deflection now provokes combat without awarding its damage. A same-zone patrol receipt preserves the interrupted itinerary; ordinary reset physically returns to that point and resumes the old destination. Valid casts can interrupt a returning patrol; permanent homes and stationary reset protection remain. Death/travel/reload retain the historical physical home-return fallback. Thirty-six focused Thornfang/Cindermaw class/mode/form cases pass, and all 54 charged-opener protections still pass. The existing Thornfang historical-return test now distinguishes ordinary route resumption from a restored active encounter.

Native map selection revealed an existing HTMLCollection `.forEach` error: it enabled the action but failed before repainting the route. Convert the live collection explicitly; native map tests collect all page errors. Native TRUE scenes also exposed own-name/TRUE-badge overlap with attack captions; captions now use the actual sprite label height and reserve vertical space above the badge. The aura's radial stops are normalized to valid browser [0,1] offsets; CPU Canvas had accepted out-of-range offsets that native browsers correctly rejected. Final alpha limits retain a transparent centre and at least 84% transparency in the faint floor falloff.

Hosted WebKit run 38865112002 on fc445 retained three gate failures. The charge-range oracle still assumed no movement after release, whereas approved PR #311 explicitly queues an approach. This also exposed a real resolver bug: an explicit out-of-range target could fall back to a nearby foe instead of entering the approach branch. Explicit selections now retain their identity, with no cooldown until actual casting; changing manual target cancels its prior approach. The native test freezes movement only long enough to inspect the queued order, then requires actual approach/cast completion against the same foe. Historical targeting fixtures are moved to legal terrain and assert the revised queue/cost/identity behavior.

The Treasury body fixture erased every guard except the captain, triggering repeated historical population repairs during drawing. It now retains the authored native guard roster before asserting pure rendering. The hero AV fixture stood on newly authored terrain: it now uses a verified clear arena and requires an actual cast receipt before profiling. The sound fixture assumed every material had a registered recording: the added wood texture intentionally uses procedural release/impact, while warning recordings remain explicit. Warm/cold tests now require the real registered route where present and forbid borrowing unrelated recordings where absent. Non-contact ground payoff is checked as a quieter distinct `enemyGroundImpact`; it is not incorrectly required to be silent under the updated approved audio policy. Every material and mix comparison remains exercised.

### Candidate dev.69 freeze

Actual native approach testing additionally caught passive movement Skill 1 replacing the queued charged approach. The frame now delegates that single dispatch to `hero-combat.castMovementBasic`, which refuses to replace a pending skill approach. Manual casts remain unchanged. The protected-frame receipt retains the original hash and proves the entire frame body is byte-identical after normalizing this one call; no update order, clock, audio, save or HUD change is waived. A nearer distractor stays off the test's approach lane so intentional hostile body blocking does not masquerade as retargeting. Native diagnostic now verifies the queue, no early cost and actual same-target completion. Full input matrix remains a required final gate.

Completed additional scoped checks: native Chromium desktop identity/reload + all five maps + all eleven TRUE aura scenes + both roaming interceptions; all six hero-AV entry/motion runs (144 rank/class/tap/charged forms each); desktop and phone audio including all 13 materials, warm/cold comparisons, explicit procedural wood fallback, distinct ground/miss routes, voice bounds and finite unclipped score; Chronicle contrast at desktop and three phone profiles. The final fifth Chronicle profile is added to the consolidated gate. These source-scoped results precede final exact-head CI and do not transfer an old certificate.

Final candidate version is 0.9.1+snapshot.dev.69. The earlier full local/hosted runs retain their failures. The full study started at fc445 remains pinned to that historical tree; a final candidate study must use the unchanged authored cases/policy against the final engine, with baseline observations retained and matched by exact configuration. No failed or incomplete observation is silently discarded.


### Full dev.69 regression and observation follow-up

The immutable dev.69 full Node run retained a real F78 targeting regression: treating every explicit target ID as a lock prevented the established Blinding Dust automatic fallback. The corrected lock applies only while the explicit enemy remains eligible; valid out-of-range identities still queue an approach. All 79 audit regressions and the targeting suite pass together after this repair.

Cindermaw delegation's former shared mechanical fixture at (900,1100) admits only three approaches after the authored river update. The verified clear arena at (600,900) restores all four physical directions; actual roost geometry remains separately tested. All four mode/form ministry passes and 120 fatal boundaries pass with no terrain or combat-rule relaxation.

The historical fc445 balance streams also retained an actual TypeError in Cindermaw's delegate update after Mage interruption removed its warning but left the delegated order alive. Reproduced against exact #308 with Mage/Normal/Crown/trained/seed113/solo/TRUE field boss. The new guard cancels that interrupted sequence and prevents an unwarned rush; the focused ministry test uses an actual Mage interrupt. The same unchanged authored trial now completes on the repaired candidate (loss at 6.6 seconds), rather than concealing or tuning away the loss. Baseline engine remains untouched. Final observations must retain any baseline exceptions as failed observations with stack/configuration; only successful matched pairs support numerical deltas.

The dev.69 native personalization suite passes all five profiles, all five maps, eleven desktop/portrait TRUE scenes and both roaming interceptions. Portrait aura review exposed a capture framing weakness (boss partly outside the camera); the fixture now stages its boss on the camera centreline so the complete body and aura are inspectable. This changes no runtime camera or combat geometry. Native procedural-fallback audio review renders all thirteen material sequences through the production facade at desktop and phone mix profiles; clipping/finite-sample and registered-playback gates remain separate.


### Remaining regression fixture reconciliation

The full dev.69 run additionally retained failures in Garun scheduler, Paladin rush-wall and Ironroot forced migration fixtures. Garun's prior vantage admits no construction; at (1290,1200) the warning is visible, and removing unintended default companions from this isolated boss probe prevents them occupying its reserved site. The unforced active-tick selector/combo now completes actual bounded supports in both modes; occupied-site cancellation remains independently required. The rush-wall fixture now requires the approved queued approach, no early movement/damage/cooldown, a clear terrain segment at every real tick, and an eventual paid hit. Highlands checks normal current-version access preserves the completed world layout, then verifies repeated forced migrations against the settled road/clearance geometry. All three suites pass without a runtime change.

A local executor reset interrupted the long Node/art/balance processes. Completed observations and failure logs remain preserved. Final balance resumes only unique completed rows with identical source hashes; all 6,912 final configurations must still be accounted for. The local Node continuation starts at the interrupted local-sites suite and records explicit START/END statuses. A separately labelled partial native art recovery skips the already captured current images; it is not substituted for the complete hosted five-profile matrix. Merge remains blocked until the applicable complete evidence passes.
