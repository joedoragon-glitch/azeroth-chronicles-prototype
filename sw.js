/* Each published release prepares an atomic offline cache; the game controls activation. */
const CACHE_VERSION = "azeroth-app-v0.9.1+snapshot.dev.250";
/* Shared sprite/variant/clip resource contract: runtime, packaging and offline caching. */
(function (root) {
  'use strict';
  const LIMITS = Object.freeze({
    decodedBytes: 1024 * 1024 * 1024,
    concurrent: 2,
    resourcePixels: 1024 * 1024,
  });
  const local = (src) =>
    typeof src === 'string' &&
    /^\.\/assets\/sprites\/[a-zA-Z0-9_/-]+\.(png|webp)$/.test(src) &&
    !src.includes('..');
  const positive = (n) => Number.isFinite(n) && n > 0;
  function resource(value) {
    const item = typeof value === 'string' ? { src: value } : value;
    if (!item || !local(item.src)) throw Error('Missing or invalid sprite resource');
    if (
      (item.width !== undefined || item.height !== undefined) &&
      (![item.width, item.height].every((n) => Number.isInteger(n) && n > 0) ||
        item.width * item.height > LIMITS.resourcePixels)
    )
      throw Error('Invalid sprite resource dimensions');
    if (item.hash !== undefined && !/^[a-f0-9]{64}$/.test(item.hash))
      throw Error('Invalid sprite content hash');
    return { ...item };
  }
  function entry(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw Error('Invalid sprite entry');
    const out = {
      ...value,
      ...resource({ src: value.src, width: value.width, height: value.height, hash: value.hash }),
    };
    for (const field of ['displayWidth', 'displayHeight', 'scale', 'labelHeight', 'overlayScale'])
      if (out[field] !== undefined && !positive(out[field])) throw Error('Invalid sprite ' + field);
    for (const field of ['anchorX', 'anchorY'])
      if (
        out[field] !== undefined &&
        !(Number.isFinite(out[field]) && out[field] >= 0 && out[field] <= 1)
      )
        throw Error('Invalid sprite anchor');
    if (out.variants !== undefined) {
      if (!Array.isArray(out.variants) || !out.variants.length || out.variants.length > 64)
        throw Error('Invalid sprite variants');
      out.variants = out.variants.map(resource);
      if (
        out.variants.some((v) => !/^[a-z0-9][a-z0-9-]*$/.test(v.id || '')) ||
        new Set(out.variants.map((v) => v.id)).size !== out.variants.length
      )
        throw Error('Invalid stable variant IDs');
      if (new Set(out.variants.map((v) => v.src)).size !== out.variants.length)
        throw Error('Duplicate sprite variant');
    }
    if (out.variantSelector !== undefined) {
      const selector = out.variantSelector;
      if (
        !selector ||
        selector.kind !== 'procedural-modulo' ||
        !Number.isInteger(selector.modulo) ||
        selector.modulo < 1 ||
        selector.modulo > 64 ||
        !Array.isArray(selector.slots) ||
        selector.slots.length !== selector.modulo ||
        !out.variants ||
        selector.slots.some((id) => !out.variants.some((v) => v.id === id))
      )
        throw Error('Invalid procedural variant selector');
      out.variantSelector = { ...selector, slots: [...selector.slots] };
    }
    if (out.clips !== undefined) {
      if (!out.clips || typeof out.clips !== 'object' || Array.isArray(out.clips))
        throw Error('Invalid sprite clips');
      out.clips = Object.fromEntries(
        Object.entries(out.clips).map(([name, clip]) => {
          if (
            !/^[a-z][a-z0-9-]*(?::[a-z-]+)?$/.test(name) ||
            !clip ||
            typeof clip.loop !== 'boolean' ||
            !Array.isArray(clip.frames) ||
            !clip.frames.length ||
            clip.frames.length > 120
          )
            throw Error('Invalid sprite clip');
          const frames = clip.frames.map((frame) => {
            const f = { ...frame, ...resource(frame) };
            if (
              !Array.isArray(f.rect) ||
              f.rect.length !== 4 ||
              !f.rect.every(Number.isInteger) ||
              f.rect[0] < 0 ||
              f.rect[1] < 0 ||
              f.rect[2] <= 0 ||
              f.rect[3] <= 0 ||
              !f.width ||
              !f.height ||
              f.rect[0] + f.rect[2] > f.width ||
              f.rect[1] + f.rect[3] > f.height
            )
              throw Error('Invalid sprite frame rectangle');
            if (
              !positive(f.durationMs) ||
              f.durationMs > 10000 ||
              !Array.isArray(f.pivot) ||
              f.pivot.length !== 2 ||
              !f.pivot.every(Number.isFinite) ||
              f.pivot[0] < 0 ||
              f.pivot[0] > f.rect[2] ||
              f.pivot[1] < 0 ||
              f.pivot[1] > f.rect[3]
            )
              throw Error('Invalid sprite frame timing/pivot');
            return { ...f, rect: [...f.rect], pivot: [...f.pivot] };
          });
          return [name, { loop: clip.loop, frames }];
        }),
      );
    }
    return out;
  }
  function entries(manifest) {
    if (
      !manifest ||
      !manifest.sprites ||
      typeof manifest.sprites !== 'object' ||
      Array.isArray(manifest.sprites)
    )
      throw Error('Invalid sprite manifest');
    return Object.fromEntries(
      Object.entries(manifest.sprites).map(([key, value]) => {
        if (!/^[a-z][a-z0-9-]*(?::[a-z0-9_-]+)+$/.test(key)) throw Error('Invalid sprite key');
        return [key, entry(value)];
      }),
    );
  }
  function resources(manifest) {
    const unique = new Map();
    for (const value of Object.values(entries(manifest))) {
      const items = [
        value,
        ...(value.variants || []),
        ...Object.values(value.clips || {}).flatMap((c) => c.frames),
      ];
      for (const item of items) {
        const r = resource(item),
          old = unique.get(r.src);
        if (old && (old.width !== r.width || old.height !== r.height || old.hash !== r.hash))
          throw Error('Conflicting sprite resource metadata');
        unique.set(r.src, r);
      }
    }
    return [...unique.values()];
  }
  const api = {
    LIMITS,
    local,
    entry,
    entries,
    resources,
    sources: (m) => resources(m).map((r) => r.src),
  };
  root.PrototypeSpriteFormat = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

const CACHE_PREFIX = 'azeroth-app-';
const APP_FILES = ["./","./index.html","./prototype.html","./phone.html","./styles/prototype.css","./styles/desktop.css","./styles/phone.css","./src/sprint.js","./src/prototype/highlands.js","./src/prototype/greenwood-landscape.js","./src/prototype/greenwood-interiors.js","./src/prototype/data.js","./src/prototype/rules.js","./src/prototype/world.js","./src/prototype/greenwood.js","./src/prototype/field-onboarding.js","./src/prototype/navigation.js","./src/prototype/fortifications.js","./src/prototype/progression.js","./src/prototype/save.js","./src/prototype/combat.js","./src/prototype/hero-combat.js","./src/prototype/boss-combat.js","./src/prototype/cindermaw-combat.js","./src/prototype/dreadmaw-combat.js","./src/prototype/party.js","./src/prototype/party-pets.js","./src/prototype/economy.js","./src/prototype/treasury.js","./src/prototype/expeditions.js","./src/prototype/narration.js","./src/prototype/rewards.js","./src/prototype/enemy-presentation.js","./src/prototype/enemy-vfx.js","./src/prototype/enemy-vfx-events.js","./src/prototype/engine.js","./src/prototype/critical-executions.js","./src/prototype/critical-levels.js","./src/prototype/critical-party-native.js","./src/prototype/critical-world-native.js","./src/prototype/audio-catalog.js","./src/prototype/audio-contract.js","./src/prototype/audio-library.js","./src/prototype/audio-assets.js","./src/prototype/audio-mixer.js","./src/prototype/audio-runtime.js","./src/prototype/audio-score.js","./src/prototype/audio-enemy.js","./src/prototype/audio-effects.js","./src/prototype/audio-hero.js","./src/prototype/audio-recordings.js","./src/prototype/audio-production.js","./src/prototype/audio-environment.js","./src/prototype/audio.js","./src/prototype/visuals.js","./src/prototype/combat-visuals.js","./src/prototype/hero-presentation.js","./src/prototype/enemy-vfx-art.js","./src/prototype/sprite-format.js","./src/prototype/sprites.js","./src/prototype/material-contract.js","./src/prototype/materials.js","./src/prototype/build-info.js","./src/prototype/persistence.js","./src/prototype/platform.js","./src/prototype/input.js","./src/prototype/runtime.js","./src/prototype/ground-cache.js","./src/prototype/renderer.js","./tools/webgl-pilot/native-webgl2-core.js","./tools/webgl-pilot/native-sprite-adapter.js","./tools/webgl-pilot/pixi-scene-bridge.js","./tools/webgl-pilot/renderer-switch-guard.js","./src/prototype/pixi-experimental.js","./src/prototype/archive.js","./src/prototype/archive-reading.js","./src/prototype/skill-reference.js","./src/prototype/menus.js","./src/prototype/app.js","./manifest.webmanifest","./icons/icon-192.png","./icons/icon-512.png","./assets/vendor/pixi-8.22.0.min.js","./assets/sprites/manifest.json","./assets/vfx/manifest.json","./assets/materials/manifest.json","./assets/materials/7985f36f485ad35a0b55907cbb099bd4656695f5b4377373bdeba23f727eb3b2.png","./assets/materials/e655205174d24f1f359916071fd764584953e3acaba4451f9d158e304fc87134.png","./assets/materials/15ad70f49d7ba8593468ebd9cd1dca34b9df8fc70975f8b757d0686bc0881f22.png","./tools/audio/index.html","./tools/audio/audition.css","./tools/audio/audition.js","./tools/audio/fixtures.js","./assets/audio/manifest.json","./assets/audio/music/place-vale.mp3","./assets/audio/music/action-vale.mp3","./assets/audio/music/peace-vale.mp3","./assets/audio/music/place-march.mp3","./assets/audio/music/action-march.mp3","./assets/audio/music/peace-march.mp3","./assets/audio/music/place-highlands.mp3","./assets/audio/music/action-highlands.mp3","./assets/audio/music/peace-highlands.mp3","./assets/audio/music/place-frontier.mp3","./assets/audio/music/action-frontier.mp3","./assets/audio/music/peace-frontier.mp3","./assets/audio/music/place-crown.mp3","./assets/audio/music/action-crown.mp3","./assets/audio/music/peace-crown.mp3","./assets/audio/music/place-crypt.mp3","./assets/audio/music/action-crypt.mp3","./assets/audio/music/peace-crypt.mp3","./assets/audio/music/place-archive.mp3","./assets/audio/music/action-archive.mp3","./assets/audio/music/peace-archive.mp3","./assets/audio/music/place-mine.mp3","./assets/audio/music/action-mine.mp3","./assets/audio/music/peace-mine.mp3","./assets/audio/music/place-abyss.mp3","./assets/audio/music/action-abyss.mp3","./assets/audio/music/peace-abyss.mp3","./assets/audio/music/place-citadel.mp3","./assets/audio/music/action-citadel.mp3","./assets/audio/music/peace-citadel.mp3","./assets/audio/music/interior-supply-vale.mp3","./assets/audio/music/interior-supply-march.mp3","./assets/audio/music/interior-supply-highlands.mp3","./assets/audio/music/interior-supply-crown.mp3","./assets/audio/music/interior-side-vale-cellars.mp3","./assets/audio/music/interior-side-march-watchhouse.mp3","./assets/audio/music/interior-side-highlands-signal.mp3","./assets/audio/music/interior-side-frontier-shrine.mp3","./assets/audio/music/interior-side-crown-foundry.mp3","./assets/audio/music/boss-thorn.mp3","./assets/audio/music/boss-thorn-true.mp3","./assets/audio/music/boss-crypt.mp3","./assets/audio/music/boss-crypt-true.mp3","./assets/audio/music/boss-mire.mp3","./assets/audio/music/boss-mire-true.mp3","./assets/audio/music/boss-archive.mp3","./assets/audio/music/boss-archive-true.mp3","./assets/audio/music/boss-ridge.mp3","./assets/audio/music/boss-ridge-true.mp3","./assets/audio/music/boss-mine.mp3","./assets/audio/music/boss-mine-true.mp3","./assets/audio/music/boss-warlord.mp3","./assets/audio/music/boss-warlord-true.mp3","./assets/audio/music/boss-abyss.mp3","./assets/audio/music/boss-abyss-true.mp3","./assets/audio/music/boss-citadel.mp3","./assets/audio/music/boss-citadel-true.mp3","./assets/audio/music/boss-cindermaw.mp3","./assets/audio/music/boss-cindermaw-true.mp3","./assets/audio/music/boss-darklord.mp3","./assets/audio/music/boss-darklord-true.mp3","./assets/audio/music/title.mp3","./assets/audio/music/finale.mp3","./assets/audio/music/defeat.mp3","./assets/audio/music/peace-interior-supply-vale.mp3","./assets/audio/music/peace-interior-supply-march.mp3","./assets/audio/music/peace-interior-supply-highlands.mp3","./assets/audio/music/peace-interior-supply-crown.mp3","./assets/audio/music/peace-interior-side-vale-cellars.mp3","./assets/audio/music/peace-interior-side-march-watchhouse.mp3","./assets/audio/music/peace-interior-side-highlands-signal.mp3","./assets/audio/music/peace-interior-side-frontier-shrine.mp3","./assets/audio/music/peace-interior-side-crown-foundry.mp3","./assets/audio/music/settlement-vale.mp3","./assets/audio/music/night-vale.mp3","./assets/audio/music/settlement-march.mp3","./assets/audio/music/night-march.mp3","./assets/audio/music/settlement-highlands.mp3","./assets/audio/music/night-highlands.mp3","./assets/audio/music/settlement-frontier.mp3","./assets/audio/music/night-frontier.mp3","./assets/audio/music/settlement-crown.mp3","./assets/audio/music/night-crown.mp3","./assets/audio/ambience/env-woodland-day.mp3","./assets/audio/ambience/env-woodland-night.mp3","./assets/audio/ambience/env-marsh-day.mp3","./assets/audio/ambience/env-marsh-night.mp3","./assets/audio/ambience/env-highland-wind.mp3","./assets/audio/ambience/env-frontier-air.mp3","./assets/audio/ambience/env-crown-courtyard.mp3","./assets/audio/ambience/env-home.mp3","./assets/audio/ambience/env-retreat.mp3","./assets/audio/ambience/env-archive.mp3","./assets/audio/ambience/env-mine.mp3","./assets/audio/ambience/env-dragon-hall.mp3","./assets/audio/ambience/env-citadel.mp3","./assets/audio/ambience/env-cellar.mp3","./assets/audio/effects/sfx-steel-release.wav","./assets/audio/effects/sfx-steel-impact.wav","./assets/audio/effects/sfx-claw-release.wav","./assets/audio/effects/sfx-claw-impact.wav","./assets/audio/effects/sfx-bone-release.wav","./assets/audio/effects/sfx-bone-impact.wav","./assets/audio/effects/sfx-stone-release.wav","./assets/audio/effects/sfx-stone-impact.wav","./assets/audio/effects/sfx-wet-release.wav","./assets/audio/effects/sfx-wet-impact.wav","./assets/audio/effects/sfx-arrow-release.wav","./assets/audio/effects/sfx-arrow-impact.wav","./assets/audio/effects/sfx-spectral-release.wav","./assets/audio/effects/sfx-spectral-impact.wav","./assets/audio/effects/sfx-ash-release.wav","./assets/audio/effects/sfx-ash-impact.wav","./assets/audio/effects/sfx-holy-release.wav","./assets/audio/effects/sfx-holy-impact.wav","./assets/audio/effects/sfx-arcane-release.wav","./assets/audio/effects/sfx-arcane-impact.wav","./assets/audio/effects/sfx-root-release.wav","./assets/audio/effects/sfx-root-impact.wav","./assets/audio/effects/sfx-dust-release.wav","./assets/audio/effects/sfx-dust-impact.wav","./assets/audio/effects/sfx-critical-warning.wav","./assets/audio/effects/sfx-hero-steel-swing.wav","./assets/audio/effects/sfx-hero-steel-impact.wav","./assets/audio/effects/sfx-power-strike.wav","./assets/audio/effects/sfx-holy-cleave.wav","./assets/audio/effects/sfx-piercing-volley.wav","./assets/audio/ambience/env-highlands-autumn.mp3","./assets/audio/ambience/env-frontier-recovery.mp3","./assets/audio/ambience/env-signal-occupied.mp3","./assets/audio/ambience/env-shrine-occupied.mp3","./assets/audio/ambience/study-vale-day-727.mp3","./assets/audio/ambience/study-march-day-727.mp3","./assets/audio/ambience/study-vale-night-727.mp3","./assets/audio/ambience/study-march-night-727.mp3","./assets/audio/ambience/study-crown-open-727.mp3","./assets/audio/ambience/study-crown-enclosed-727.mp3","./assets/audio/ambience/studio-crypt-winter-estate-727.mp3","./assets/audio/ambience/studio-archive-restoration-727.mp3","./assets/audio/ambience/studio-colossus-mine-727.mp3","./assets/audio/ambience/studio-abyss-flight-hall-727.mp3","./assets/audio/ambience/studio-citadel-command-727.mp3","./assets/audio/ambience/studio-orchard-cellars-727.mp3","./assets/audio/ambience/studio-drowned-watchhouse-727.mp3","./assets/audio/ambience/studio-ruined-foundry-727.mp3","./assets/audio/ambience/studio-mirejaw-guarded-wet-store-727.mp3","./assets/audio/ambience/studio-cindermaw-roost-vault-727.mp3"];
const APP_FINGERPRINTS = {"./":"3e0864e2df59bf1b01c57fe488f7bc43d041ab02","./index.html":"3e0864e2df59bf1b01c57fe488f7bc43d041ab02","./prototype.html":"3e0864e2df59bf1b01c57fe488f7bc43d041ab02","./phone.html":"1bfb7393bea6303d233302679b9810c3904e0308","./styles/prototype.css":"aa41f852151c07cfa1c79b98e5075a2abf3e87e5","./styles/desktop.css":"cc6038d3c67269c90197fc41357072a2ee5a218b","./styles/phone.css":"f07efd65ff8cca3bd34d51f664d71fb178a4ac63","./src/sprint.js":"eb429dd9ce26911cbdce893cfd4689ee0caa6966","./src/prototype/highlands.js":"daca001496c9fc6bdeb9ea3accf125337c38fded","./src/prototype/greenwood-landscape.js":"0ed585d172f5f092585919728baed27901d74d4a","./src/prototype/greenwood-interiors.js":"3b1e83492fb2e612e6cacab80fed3aa23005abe8","./src/prototype/data.js":"60a166273aab80fd3c608994475b5ef9841029f1","./src/prototype/rules.js":"d84c88dcf9932485837a4b333878f1ddd7b49e11","./src/prototype/world.js":"74c0ed47de8c8093ecaf1ca229468108e19cbe48","./src/prototype/greenwood.js":"91032a26d78775e4b2f7f3a890c9498a499d6bd9","./src/prototype/field-onboarding.js":"0794fff7125c51ca414f80e9c8affef0877d76f6","./src/prototype/navigation.js":"a3a428176958a917badbc493c6923e15e349b7e6","./src/prototype/fortifications.js":"e40cb46d2aa4db75766c4be9907a4e9fee2bfdec","./src/prototype/progression.js":"6be6db755169a6cad1312739236c01978be88aa0","./src/prototype/save.js":"8681a81ddebe42cd1f832bf4a8144745eb68dde5","./src/prototype/combat.js":"0b0568eabaa78d91950bb7a343381882aa4b4354","./src/prototype/hero-combat.js":"7b9625552d670e1d328e796a648b5aa1a505010d","./src/prototype/boss-combat.js":"435c2a31108318a0f1addefbff05738462deb4a9","./src/prototype/cindermaw-combat.js":"28a517e521fbe76828789406eebffe6ba79eda3d","./src/prototype/dreadmaw-combat.js":"97a3560f5c5ee653e0a84709b80479e41e2e47a8","./src/prototype/party.js":"e053bfe3692a76df26767f1cc3a49604ea21276e","./src/prototype/party-pets.js":"b0f4d82a5c998501063430be7b585d9e1216a2a4","./src/prototype/economy.js":"1016a4faba3e52656ca2279dd4e460d0113af229","./src/prototype/treasury.js":"21e5a4e86e7cf96bc9b3013325ca0b7f8e6db559","./src/prototype/expeditions.js":"2252b9d703d5494a161d3ba3027a62cacf7ae4b5","./src/prototype/narration.js":"28827e749f25c6dea1e16ccf4495e20f9633b1e4","./src/prototype/rewards.js":"a11a756b17710afa8b63837ab5b09323babc0ded","./src/prototype/enemy-presentation.js":"2e273fab6de073105ada5d4accdd31b998d22dd6","./src/prototype/enemy-vfx.js":"d5b34b76b88aae1d795a4544bee082ad541a9706","./src/prototype/enemy-vfx-events.js":"90f6f7af6a03088fd69630482c2f3c065c730169","./src/prototype/engine.js":"1dc6d5b5be2b300ff1fa5878ab47cf44908067b3","./src/prototype/critical-executions.js":"1efd3f16ca1f126f3e6f9aa8c2253cea0102e6ab","./src/prototype/critical-levels.js":"61142f48b8eabbe8ad9a43763c484cfed86ef3e1","./src/prototype/critical-party-native.js":"c5b94b4a9444cdc8986573cd7869b5a6552ce7a5","./src/prototype/critical-world-native.js":"98b5a3243b2982c061c7b9c1cc364d44be73ebbd","./src/prototype/audio-catalog.js":"991b5bababa3916d1283556180185ce0dcbe6df3","./src/prototype/audio-contract.js":"499869a085b3fa517b2545854808480f4cac8174","./src/prototype/audio-library.js":"9b9134109c123813f3f7e7a122b2bdfc20e7a92e","./src/prototype/audio-assets.js":"3b22bacc44753bb079a631a63eda9194adad0182","./src/prototype/audio-mixer.js":"5c6af7ac460a8f5761d99bddec5f4ce36de889a1","./src/prototype/audio-runtime.js":"a0e4017dd7983b0aa864412087ec8a113302f3f4","./src/prototype/audio-score.js":"cef17919d8c3363b201cbf2172bf70b705daf299","./src/prototype/audio-enemy.js":"e8066cd95e234b28a4009d5c80ca8c0d46e6dfc0","./src/prototype/audio-effects.js":"4a4db2ce7c3b03982718d1b182b5d915e9f8503a","./src/prototype/audio-hero.js":"6d118c4c6932aa85a8b4f2d4736695fd94fb452e","./src/prototype/audio-recordings.js":"425ae503b0840409a7e5138f64887778b38c0b3c","./src/prototype/audio-production.js":"dd93bff673d67a43ec16366648399babc8e4bfef","./src/prototype/audio-environment.js":"516a87d5770204db19610aa6fedb70ecc525293f","./src/prototype/audio.js":"b3be522a9715b572fa3b12b612df5f08d690d396","./src/prototype/visuals.js":"019b3ee0782cca8f0891cc682269a135f73796c2","./src/prototype/combat-visuals.js":"74935e974ba2398218694f5d5faa4dbb1f2dc631","./src/prototype/hero-presentation.js":"203b74f26971c4b9910834b2a644091329fbce9c","./src/prototype/enemy-vfx-art.js":"5264b08fb0dfc87bec104398a7c99536d4499c8e","./src/prototype/sprite-format.js":"4f23c1e8762d22aca9bb1b93b49e6eea2a39ad94","./src/prototype/sprites.js":"e28c15e8cac7ca2f87fae1387ef4e318c3567825","./src/prototype/material-contract.js":"851ec5160f1822504cf77c7bfe42acd2b069be58","./src/prototype/materials.js":"06094306065848f1530bb11b05f241d045f379d0","./src/prototype/build-info.js":"38bb103e1fc462d0d587f8cb2bf257ce7fb47458","./src/prototype/persistence.js":"23c7e26432b720cba7ec396dd754d5f0b8f7b93e","./src/prototype/platform.js":"3b7b01226a8ccaac6ddce5b9db69cea8e7bff692","./src/prototype/input.js":"6343439cbcb70a0df825fe4a5297bde6ce21b5ff","./src/prototype/runtime.js":"dfcd412ab631956150fc0495cb7df305180d420f","./src/prototype/ground-cache.js":"e452bd2c91ca58d32b7d8117b4893dd0c8a968af","./src/prototype/renderer.js":"c5a6467e821d4fbc8a9545802d52821e5aec7dc4","./tools/webgl-pilot/native-webgl2-core.js":"8e8661d856b14c73b5e8e78cd6f8677c0f75bfdb","./tools/webgl-pilot/native-sprite-adapter.js":"20ef12ac500ca3f99562a02d44c8405d7c6b8760","./tools/webgl-pilot/pixi-scene-bridge.js":"c5ce6745558ed3b4297695cbedada148ceca68f2","./tools/webgl-pilot/renderer-switch-guard.js":"ef3faeecc96c36b4e798aaf3162d150dd2ed34fc","./src/prototype/pixi-experimental.js":"1879eeb1b1094d94a49590d8d14bb43d8ed538bb","./src/prototype/archive.js":"2d2f3ac02d707672bea68e086720f766f07b3dd6","./src/prototype/archive-reading.js":"017245c79d41a48dd6179e26f3904728681e5273","./src/prototype/skill-reference.js":"10c60d93f0b1ff31a5a4a43b9a79b8b7e8cf3041","./src/prototype/menus.js":"dbbd60ba5cbe0ee6e367734112c48c0bd85447ca","./src/prototype/app.js":"b7b10f55bf75c5f6121a931a3cac9f6cde2be6aa","./manifest.webmanifest":"794aafc6160f7e817e4ed7ef9224edf5c99deb1e","./icons/icon-192.png":"676e15d0e85128581bbe007b421ec0cd5bbfc57a","./icons/icon-512.png":"890b9b89980fb47ee83198223f409b86ed18145b","./assets/vendor/pixi-8.22.0.min.js":"sha256:06d9ef9823e743518793083c296d801e752db128cb1f519fbabe37e1259567ea","./assets/vfx/manifest.json":"d81d4f32f657a156c1569776bb664d6de8539753","./assets/materials/manifest.json":"f07cd9e936679ce0b6525df09a43d60996078d9e","./assets/materials/7985f36f485ad35a0b55907cbb099bd4656695f5b4377373bdeba23f727eb3b2.png":"52a256b2fa0d6493dbc49ff4577c7e9332a787a5","./assets/materials/e655205174d24f1f359916071fd764584953e3acaba4451f9d158e304fc87134.png":"50592979a9b886918df93c656d1c76d2e97f151a","./assets/materials/15ad70f49d7ba8593468ebd9cd1dca34b9df8fc70975f8b757d0686bc0881f22.png":"38ace6039ab10d4500294bde3daf137a231a7220","./tools/audio/index.html":"63b3510754b5ae87c7625761a6bb2936ea9af5b1","./tools/audio/audition.css":"7b640e44a6470dde485a2fa0219c042abfb66462","./tools/audio/audition.js":"0d1ce6b1e661e8dd805e3c2ecc8da66676d52d6c","./tools/audio/fixtures.js":"0b74fb4fc760da5f2fca763399a2b59f849c76df","./assets/audio/music/place-vale.mp3":"6765e4c670eba17b62972aabd827af0220933c64","./assets/audio/music/action-vale.mp3":"87196d3d67740905006b3645693ce0440f0d15a5","./assets/audio/music/peace-vale.mp3":"83d9d8692e6865e3f941c2d50b941f413ea01aec","./assets/audio/music/place-march.mp3":"0e75b0632f58cb3942306ba1aa87b69228f9faec","./assets/audio/music/action-march.mp3":"dd0448e997348f557d6e460b2c585e947bb38fb4","./assets/audio/music/peace-march.mp3":"614cd5b34a0c8351ceb19d10d6376628627212d6","./assets/audio/music/place-highlands.mp3":"92b80ce153c1bda910cb7434f8c8ec450b8ae53d","./assets/audio/music/action-highlands.mp3":"0db21db7250008a27b296ff58d9f07a3b890adf7","./assets/audio/music/peace-highlands.mp3":"c479bda4737c2c046b386d286e71644d21f817bb","./assets/audio/music/place-frontier.mp3":"452dff7f9f16af3e50174364b09d40ad834d28ef","./assets/audio/music/action-frontier.mp3":"0175fa55dab027aedee7a329761642e6f2966261","./assets/audio/music/peace-frontier.mp3":"dd66b11c0c99e08ae2aa746ad485aefdb9f7e54d","./assets/audio/music/place-crown.mp3":"0bf142c53873cd29dbbd580ee03e8a7a87c918f4","./assets/audio/music/action-crown.mp3":"2f23dfad5b8ca38be2c316572f13b1870b0c29f6","./assets/audio/music/peace-crown.mp3":"7875cd3ea2ea24001be0434aeac99224b2d1e632","./assets/audio/music/place-crypt.mp3":"849d6cd72542f8583b135b746bd06f38d32f166f","./assets/audio/music/action-crypt.mp3":"748dedb66b8dee5fd5b39c1adce4f6cea862a775","./assets/audio/music/peace-crypt.mp3":"938fb85df670d9d4b1ca8c63601e13df3fe91567","./assets/audio/music/place-archive.mp3":"956f649245857bb8304c9389d618b22c79b47513","./assets/audio/music/action-archive.mp3":"79334b44c0c5383aad75277671f59dd6970796f7","./assets/audio/music/peace-archive.mp3":"3fe8660b6d40d3573497d24011cd5f9639c0ea24","./assets/audio/music/place-mine.mp3":"95c77b5b85ec89f11fe3fc9ad76514d2c2898422","./assets/audio/music/action-mine.mp3":"8fe0118b1ba6448b398c316252f81e3b39609ead","./assets/audio/music/peace-mine.mp3":"dd1ed9fe3d5d22cb18d4ce4518ecf855301d9138","./assets/audio/music/place-abyss.mp3":"e609a2351df33c7c041e8f482735c7abe20c8c2f","./assets/audio/music/action-abyss.mp3":"ae7d0954e19d22c153ef9df52e62f6c8dbf69dea","./assets/audio/music/peace-abyss.mp3":"285112370a785a2f18fca7d46916210b2f6c6bbb","./assets/audio/music/place-citadel.mp3":"bca939a2aeadbc2bb788728f5a9cee6d972070ff","./assets/audio/music/action-citadel.mp3":"865f31b259d96be7c77abb8581dcdefdef5f855a","./assets/audio/music/peace-citadel.mp3":"7e7bf30a24e0c3225af7309777636e15f16621b0","./assets/audio/music/interior-supply-vale.mp3":"0d02e3539ef5def4c219e035a8d7d9a521f3d371","./assets/audio/music/interior-supply-march.mp3":"e646bdeddbe08b982edb2605d73dd604f12c1496","./assets/audio/music/interior-supply-highlands.mp3":"77eae2a7f04fa988efd82ad10d0fcb1801868663","./assets/audio/music/interior-supply-crown.mp3":"17b75e057fd6b8a31c0bb4ac9cb684499e07e76f","./assets/audio/music/interior-side-vale-cellars.mp3":"552eb43388c864f4dfd1459111b442c38c3fb51b","./assets/audio/music/interior-side-march-watchhouse.mp3":"5827591e23c5f58834b60ac815e384ecbe41ab2e","./assets/audio/music/interior-side-highlands-signal.mp3":"c4371a0af888dfbaa70d309f5444b4a0c0ba244a","./assets/audio/music/interior-side-frontier-shrine.mp3":"1b51df311ea7cf4185c41b819f99e7f8bc213a55","./assets/audio/music/interior-side-crown-foundry.mp3":"4c142949cc039fc6b943866415e17be3dec5c22d","./assets/audio/music/boss-thorn.mp3":"188fb4d2ac3d33cd44e99b40a91adc2733836a49","./assets/audio/music/boss-thorn-true.mp3":"65eaa32c2c5fdeb0f62de902803c910be4db40f4","./assets/audio/music/boss-crypt.mp3":"afcb5f4ed03a7e4d3b7097e9488cba8f5deb9c32","./assets/audio/music/boss-crypt-true.mp3":"7f7fb07a46f282e839616c7b7cf469175227e4f7","./assets/audio/music/boss-mire.mp3":"45ee562a8e5e8bc3ae47d5b2dc03b009cedd8aa8","./assets/audio/music/boss-mire-true.mp3":"daae2957c05c43d75f77b7ad3c3c4c1eee68d65b","./assets/audio/music/boss-archive.mp3":"035021f471d239a41bd1e41bf9b5065dcd2b9722","./assets/audio/music/boss-archive-true.mp3":"c8e0d52a60c44ad184c2f28f0bda3eada7853cdc","./assets/audio/music/boss-ridge.mp3":"3ca8013271c55f9d4b1de4751a4e68329c147228","./assets/audio/music/boss-ridge-true.mp3":"5f13269c31ea61fc3abf49360ff4129f9fb9917e","./assets/audio/music/boss-mine.mp3":"7d71adbbbc58d87a5610a1b0b9149999ba5ad4f8","./assets/audio/music/boss-mine-true.mp3":"76071b486cff6e31173ee3a758e8411b3da97c6b","./assets/audio/music/boss-warlord.mp3":"a7c94e74938255441c25c0025aa577417e43f728","./assets/audio/music/boss-warlord-true.mp3":"c32269a2b4e9667125f2653014a5c07ebf53b2de","./assets/audio/music/boss-abyss.mp3":"6ffe6915d4e35b25657334a45114c8608ceabcaf","./assets/audio/music/boss-abyss-true.mp3":"b14d2831da26e147c6912a2974c7813240d55187","./assets/audio/music/boss-citadel.mp3":"99839312c6d004e87026b408d6a2523325129128","./assets/audio/music/boss-citadel-true.mp3":"8701444b13701bf374d0b00f08d8e272369fcad7","./assets/audio/music/boss-cindermaw.mp3":"a135ade9763cddb3096209a0a325e85cf60a376e","./assets/audio/music/boss-cindermaw-true.mp3":"1797e45763b4651f76321c1f4af1b8f0b66f5817","./assets/audio/music/boss-darklord.mp3":"2c41b235049acf9c6c33066769afdf8a3d5c43ca","./assets/audio/music/boss-darklord-true.mp3":"efa544657aeaf08b16c1694506192a9e63bfdcd9","./assets/audio/music/title.mp3":"66923bba1ba712e0196a200f0c75a38a4befd4df","./assets/audio/music/finale.mp3":"52392d0cc1969725dfd29169e25ade7c5c3ea546","./assets/audio/music/defeat.mp3":"4e86e4076fc85aa531ec1a8f5b50357de2098f0b","./assets/audio/music/peace-interior-supply-vale.mp3":"1c8481fced2018d38d3c5e1b2f17485f523f8a2a","./assets/audio/music/peace-interior-supply-march.mp3":"bfdcf67e7cd30bd68b43b30ac55d8e6a84123a9c","./assets/audio/music/peace-interior-supply-highlands.mp3":"a6e58934c99c05a1a643dee708839845fc81c9a1","./assets/audio/music/peace-interior-supply-crown.mp3":"cf611c802861ece5d8c65c6f5f8218a60cb31cb8","./assets/audio/music/peace-interior-side-vale-cellars.mp3":"b86b3ded99862b8770d4a294b80c5a1e05c801ea","./assets/audio/music/peace-interior-side-march-watchhouse.mp3":"e26063b9bbc8a9269dad2180940026f27b71caaf","./assets/audio/music/peace-interior-side-highlands-signal.mp3":"53922e5c299b367cef330e3ca5639477be86a258","./assets/audio/music/peace-interior-side-frontier-shrine.mp3":"27522b69839bc03f6589d70244eb116bc2d87734","./assets/audio/music/peace-interior-side-crown-foundry.mp3":"83c383651cd7efb5fd24b92c5c03e8a3bf9c6c74","./assets/audio/music/settlement-vale.mp3":"5f939da1e0fc4cdee76728592f5332f09a510504","./assets/audio/music/night-vale.mp3":"9943a953abe9884c42e833d2d315c2c936dacfb5","./assets/audio/music/settlement-march.mp3":"6a76b884a53e1cf0a9b45b8f95faa640ff6ca812","./assets/audio/music/night-march.mp3":"040f1a0a6b1c092ce6337e4ff8ffcdd1094d5671","./assets/audio/music/settlement-highlands.mp3":"7e5515071320b418b71031721e4663096c00e5f2","./assets/audio/music/night-highlands.mp3":"d527bcb3e54c0b15abf883db53f2ddc5900fed06","./assets/audio/music/settlement-frontier.mp3":"5d69c90b48616bdbf72f7d828f146344026e196e","./assets/audio/music/night-frontier.mp3":"02fcef4edff8f87bf0b0d16f10f029a6c4f66d0d","./assets/audio/music/settlement-crown.mp3":"24691f02ab95820792794821d1a58b1bce24d1f6","./assets/audio/music/night-crown.mp3":"88ff3fd9307c3e9c80c2116d5a0e01857820b489","./assets/audio/ambience/env-woodland-day.mp3":"d937667a32f4b3529fd66329897b17069cd885a2","./assets/audio/ambience/env-woodland-night.mp3":"6f904aa7f57f18c881dc4949b0260e76dc5fd534","./assets/audio/ambience/env-marsh-day.mp3":"bf98fd412fd7a2fafa3eb6f11ac5dc76852d3f6e","./assets/audio/ambience/env-marsh-night.mp3":"e4b7f367b27b3b1c550a52c73c36ab1cd5819e64","./assets/audio/ambience/env-highland-wind.mp3":"a05bebfb6457ebddd9784ac58c5da21b2f4bfd2c","./assets/audio/ambience/env-frontier-air.mp3":"6274e1887df0555da992d3e34e246c5211773583","./assets/audio/ambience/env-crown-courtyard.mp3":"ab2da9c6d0e3f6ea078c8be1498fa30eb534956c","./assets/audio/ambience/env-home.mp3":"3293cfe2c793f74f6246d3385d1fe0bc9bbdbb49","./assets/audio/ambience/env-retreat.mp3":"fa1a744f5ac1a2f23b6fa78dbb7b90a7489f150a","./assets/audio/ambience/env-archive.mp3":"599a2745c8b942a0640592faf379227db9a13f8b","./assets/audio/ambience/env-mine.mp3":"000b5ac7d2f4cd6b7c7093500dfb3b86fbb01425","./assets/audio/ambience/env-dragon-hall.mp3":"3f2b6007423b2961fb59ee2cd64c55d943c0484d","./assets/audio/ambience/env-citadel.mp3":"0f92ec05b842995a016a39bd1286ac97c5019790","./assets/audio/ambience/env-cellar.mp3":"67a01437893cfff36627a13f555c51303cc51e2a","./assets/audio/effects/sfx-steel-release.wav":"4f80b4a708e354a6cd579abbb4a15ae34986f1e6","./assets/audio/effects/sfx-steel-impact.wav":"4d057372de3c6797c6fa4a2a9f70c20465dbeb86","./assets/audio/effects/sfx-claw-release.wav":"6ca45d37a087bcef0c7aa18841ae2a464a1fe971","./assets/audio/effects/sfx-claw-impact.wav":"83ece95576bd2aa5f16a47192473726695548835","./assets/audio/effects/sfx-bone-release.wav":"1fcd17bf43a5443fd7f00e286b96590fbe823181","./assets/audio/effects/sfx-bone-impact.wav":"3aa79b004ba82d28cdcf96f8acad79aef9b600db","./assets/audio/effects/sfx-stone-release.wav":"4a645c4dd49d9dc8a5e19a789c564f8f855f637d","./assets/audio/effects/sfx-stone-impact.wav":"4c292eb51b1705e488b2df8e03f083745235d214","./assets/audio/effects/sfx-wet-release.wav":"c95db92d5413a5e588287e38d5ea8cafd5b8544b","./assets/audio/effects/sfx-wet-impact.wav":"0d5e312832ea61c8f2fbdb0cf24bca2807d1993c","./assets/audio/effects/sfx-arrow-release.wav":"8595318bbe89f2c98a7e797c5be31f310a6f96f2","./assets/audio/effects/sfx-arrow-impact.wav":"6f735f079c7e8a769b0ea28ed9d86d22df3178a3","./assets/audio/effects/sfx-spectral-release.wav":"49bbfcf9d320d3a3d8d849c0b4ae0c2fb0c94ba0","./assets/audio/effects/sfx-spectral-impact.wav":"3309d90bbd5060f532b1f5f51533b7d266b6de05","./assets/audio/effects/sfx-ash-release.wav":"2eb268f6248c9358b6b26da49b4571f757dbc5ff","./assets/audio/effects/sfx-ash-impact.wav":"6f344e602d6d794b8d9210dcca5440ca288c176e","./assets/audio/effects/sfx-holy-release.wav":"390a12a2f3bed26940a00bf14b31b8674aed28b9","./assets/audio/effects/sfx-holy-impact.wav":"59be2a601601f922448af7970d30495fac4d1f75","./assets/audio/effects/sfx-arcane-release.wav":"3e307e0ab3dd8cb7f8d231801344c47dbd6e3430","./assets/audio/effects/sfx-arcane-impact.wav":"cb9268ebe2ebd6a48b1792d75406cb7088c8ab00","./assets/audio/effects/sfx-root-release.wav":"1f896a8a816feaf51b642ca7fe736d98d1b580c1","./assets/audio/effects/sfx-root-impact.wav":"082941ddedff07bd228d8001061bebcf9f68822c","./assets/audio/effects/sfx-dust-release.wav":"03730f751bdc48076d2f0e351bf853574045bf3d","./assets/audio/effects/sfx-dust-impact.wav":"c79932d7646538233594f469006dda82d57f13d8","./assets/audio/effects/sfx-critical-warning.wav":"893c8cb023c2f5924a2e8623887297d370b60cb6","./assets/audio/effects/sfx-hero-steel-swing.wav":"0c10ee8196391211608190fb039eae4bfa3456f1","./assets/audio/effects/sfx-hero-steel-impact.wav":"cdc64b8c4954a1a23682b54be75e3cf31da10bb0","./assets/audio/effects/sfx-power-strike.wav":"d2262dd2e858d6890629134ad721b32887a72770","./assets/audio/effects/sfx-holy-cleave.wav":"3a68f18bfa3249459fa1ba4e07f6b05a4d707ee6","./assets/audio/effects/sfx-piercing-volley.wav":"50babb289b5f2f352eee8d8a2080970260ba5d1d","./assets/audio/ambience/env-highlands-autumn.mp3":"6e19298d545725c9121b8d2f5b45a9957dfe32ff","./assets/audio/ambience/env-frontier-recovery.mp3":"f1d390482c8de189bfb3235af88f69b61009e102","./assets/audio/ambience/env-signal-occupied.mp3":"addf68988d1dd83ffeac51fff61d019daa6a6e82","./assets/audio/ambience/env-shrine-occupied.mp3":"7691cd35f3c8705bbbf9327e5d916107085ed919","./assets/audio/ambience/study-vale-day-727.mp3":"63537f1654ff488ab365d935285922cdd236c96c","./assets/audio/ambience/study-march-day-727.mp3":"ef46a3227f329c04c299691c3f6a92cfd13b036c","./assets/audio/ambience/study-vale-night-727.mp3":"1651d07f7f6b775a79eca7ff14f5e9f129a660dc","./assets/audio/ambience/study-march-night-727.mp3":"749abb6e910db1ba35d2bdbf003fa615182e60ee","./assets/audio/ambience/study-crown-open-727.mp3":"caf8cb6d006a6193118a7682dcb835544ef90c42","./assets/audio/ambience/study-crown-enclosed-727.mp3":"26285a5ad21ce74df1e86d5fab2477f074331229","./assets/audio/ambience/studio-crypt-winter-estate-727.mp3":"e8376ad2d09b220c6c1ca69b59814db8262d4fe3","./assets/audio/ambience/studio-archive-restoration-727.mp3":"7ecf317b9d12b80b0e70aa7fab0780cf8664fba3","./assets/audio/ambience/studio-colossus-mine-727.mp3":"19018c3d307f24e30c07237f11ce8a2f458daffd","./assets/audio/ambience/studio-abyss-flight-hall-727.mp3":"a85bee7d0a263a11e058361d4ba5c5f2c847e4e2","./assets/audio/ambience/studio-citadel-command-727.mp3":"d1ab77b51c76770f9daf95bb560c850f57259b4a","./assets/audio/ambience/studio-orchard-cellars-727.mp3":"dcba8533d2b5c025dea51e380cdf9ee8a7c619b3","./assets/audio/ambience/studio-drowned-watchhouse-727.mp3":"7becb5df11e6d9acb865427a7e9ab2813f0c07d1","./assets/audio/ambience/studio-ruined-foundry-727.mp3":"b07e807a81d52fec141a349c643f61dc3b5e8bfc","./assets/audio/ambience/studio-mirejaw-guarded-wet-store-727.mp3":"1db4dda379e3e5aa2ce59f91d72b5da00fcfe618","./assets/audio/ambience/studio-cindermaw-roost-vault-727.mp3":"6ffcc2d146b63c2607afca6e45ea587b7cd4ef19"};
const LEGACY_FILES = ["./legacy.html","./rts.html","./styles/rts.css","./styles/game.css","./styles/app.css","./styles/keyboard.css","./src/rts-engine.js","./src/rts.js","./src/controls.js","./src/classes.js","./src/world.js","./src/squad.js","./src/game.js","./src/app.js"];
const appURL = path => new URL(path, self.registration.scope).href;
const appFiles = new Set(APP_FILES.map(appURL));
const legacyFiles = new Set(LEGACY_FILES.map(appURL));
const spriteBase = appURL('./assets/sprites/');
// Registration scope and public entry URLs are immutable for this worker.
const scope = new URL(self.registration.scope);
const navigationURLs = {
    phone: appURL('./phone.html'),
    legacy: appURL('./legacy.html'),
    prototype: appURL('./prototype.html'),
    rts: appURL('./rts.html'),
    index: appURL('./index.html')
};
const rtsPath = new URL(navigationURLs.rts).pathname;
// A content fingerprint is scoped to an asset's actual bytes, not its URL or release number.
// A new release gets its own complete offline cache, but unchanged assets are copied locally.
const fingerprintURL = appURL('./__offline-fingerprints-v1__');
async function cachedFingerprints(cache) {
    try {
        const response = await cache.match(fingerprintURL);
        const value = response && await response.json();
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (_) { return {}; }
}
async function matchesFingerprint(response, fingerprint) {
    if (!response?.ok || typeof fingerprint !== 'string' || !self.crypto?.subtle) return false;
    const vendor = /^sha256:[a-f0-9]{64}$/.test(fingerprint);
    if (!vendor && !/^[a-f0-9]{40}$/.test(fingerprint)) return false;
    try {
        const bytes = new Uint8Array(await response.arrayBuffer());
        // Regular assets use Git's blob SHA-1 (length-prefixed content identity).
        // Pinned PixiJS is a generated vendor file and uses its verified SHA-256.
        const prefix = vendor ? null : new TextEncoder().encode('blob ' + bytes.length + '\0');
        const input = vendor ? bytes : new Uint8Array(prefix.length + bytes.length);
        if (prefix) { input.set(prefix); input.set(bytes, prefix.length); }
        const digest = await self.crypto.subtle.digest(vendor ? 'SHA-256' : 'SHA-1', input);
        const hex = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
        return (vendor ? 'sha256:' + hex : hex) === fingerprint;
    } catch (_) { return false; }
}
async function spriteHashes(cache) {
    try {
        const response = await cache.match(appURL('./assets/sprites/manifest.json'));
        if (!response) return new Map();
        return new Map(PrototypeSpriteFormat.resources(await response.json())
            .map(resource => [appURL(resource.src), resource.hash || null]));
    } catch (_) { return new Map(); }
}
// The audio manifest supplies SHA-256 fingerprints for recordings and variants.
async function audioHashes(cache) {
    try {
        const response = await cache.match(appURL('./assets/audio/manifest.json'));
        const manifest = response && await response.json();
        const hashes = new Map();
        for (const entry of Object.values(manifest?.assets || {})) {
            for (const resource of [entry, ...(entry.variants || [])]) {
                if (/^\.\/assets\/audio\/[a-zA-Z0-9/_-]+\.(mp3|ogg|wav)$/.test(resource.src) &&
                    /^[a-f0-9]{64}$/.test(resource.sha256 || ''))
                    hashes.set(appURL(resource.src), resource.sha256);
            }
        }
        return hashes;
    } catch (_) { return new Map(); }
}
// The recorded soundtrack increases the initial cache's media count. Large
// atomic addAll bursts can exhaust a browser's simultaneous fetch resources.
// Install the complete release in bounded groups; the worker still cannot
// activate until every group and its hash manifest have succeeded.
async function addCacheInBatches(cache, requests) {
    for (let i = 0; i < requests.length; i += 12)
        await cache.addAll(requests.slice(i, i + 12));
}
self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_VERSION);
        // Fresh manifests are mandatory: never infer that a manifest is unchanged from its path.
        const audioManifest = appURL('./assets/audio/manifest.json');
        await cache.addAll([new Request(audioManifest, { cache: 'reload' })]);
        const wantedAudio = await audioHashes(cache);
        const previous = [];
        for (const name of await caches.keys()) {
            if (name.startsWith(CACHE_PREFIX) && name !== CACHE_VERSION) {
                const old = await caches.open(name);
                previous.push({
                    cache: old,
                    audio: await audioHashes(old),
                    sprites: await spriteHashes(old),
                    fingerprints: await cachedFingerprints(old)
                });
            }
        }
        const downloads = [];
        for (const path of APP_FILES) {
            const url = appURL(path);
            if (url === audioManifest) continue;
            const recordingHash = wantedAudio.get(url);
            const fingerprint = APP_FINGERPRINTS[path];
            let reused = false;
            for (const old of previous) {
                const response = await old.cache.match(url);
                if (!response?.ok) continue;
                const trustedFingerprint = fingerprint && old.fingerprints[path] === fingerprint;
                // Existing installed versions have no fingerprint index. During migration,
                // hash those cached bytes once instead of forcing a whole-game download.
                const oldBytesMatch = fingerprint && !old.fingerprints[path] &&
                    await matchesFingerprint(response.clone(), fingerprint);
                if ((recordingHash && old.audio.get(url) === recordingHash) ||
                    trustedFingerprint || oldBytesMatch) {
                    await cache.put(url, response);
                    reused = true;
                    break;
                }
            }
            if (!reused) downloads.push(new Request(url, { cache: 'reload' }));
        }
        if (downloads.length) await addCacheInBatches(cache, downloads);
        const spriteDownloads = [];
        for (const [url, hash] of await spriteHashes(cache)) {
            let reused = false;
            if (hash && /^[a-f0-9]{64}$/.test(hash)) {
                for (const old of previous) {
                    if (old.sprites.get(url) !== hash) continue;
                    const response = await old.cache.match(url);
                    if (!response?.ok) continue;
                    await cache.put(url, response);
                    reused = true;
                    break;
                }
            }
            if (!reused) spriteDownloads.push(new Request(url, { cache: 'reload' }));
        }
        if (spriteDownloads.length) await addCacheInBatches(cache, spriteDownloads);
        // Persist the release's trusted fingerprints for fast reuse on its next update.
        await cache.put(fingerprintURL, new Response(JSON.stringify(APP_FINGERPRINTS),
            { headers: { 'Content-Type': 'application/json' } }));
        // The game activates waiting updates automatically only before title-screen entry.
        // An update discovered during gameplay still waits for the player's explicit action.
    })());
});
self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
    const request = event.request, url = new URL(request.url);
    if (request.method !== 'GET' || url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
    // The optional graphics demo is a separate real webpage, not a game route.
    // Do not turn its navigation into the cached campaign homepage.
    // The standalone demo's HTML navigation must not route to the RPG home page.
    // Four scripts in this directory are also core RPG scripts and MUST remain
    // cache-controlled, including offline and incremental updates.
    if (request.mode === 'navigate' &&
        url.pathname.startsWith(appURL('./tools/webgl-pilot/').replace(scope.origin, ''))) return;
    const key = url; key.search = ''; key.hash = '';
    const isNavigation = request.mode === 'navigate';
    const navigationKey = isNavigation ? appFiles.has(key.href) && key.pathname.endsWith('.html') ? key.href : key.pathname.endsWith('/phone.html') ? navigationURLs.phone : key.pathname.endsWith('/legacy.html') ? navigationURLs.legacy : key.pathname.endsWith('/prototype.html') ? navigationURLs.prototype : key.pathname === rtsPath ? navigationURLs.rts : navigationURLs.index : null;
    const isSprite = key.href.startsWith(spriteBase);
    if (!isNavigation && !appFiles.has(key.href) && !legacyFiles.has(key.href) && !isSprite) return;
    event.respondWith(caches.open(CACHE_VERSION).then(async cache => {
        const cached = await cache.match(isNavigation ? navigationKey : key.href);
        if (cached) return cached;
        try {
            // Historical games are independent and are downloaded only when opened.
            if(isNavigation && legacyFiles.has(navigationKey)) {
                await cache.addAll([...legacyFiles].map(url => new Request(url, { cache: 'reload' })));
                return await cache.match(navigationKey);
            }
            const response=await fetch(request);
            if(response.ok)await cache.put(key.href,response.clone());
            return response;
        }
        catch (_) { return new Response('Open this game online once to prepare it for offline play.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }); }
    }));
});
