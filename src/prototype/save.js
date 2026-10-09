/* Version-4 serialization, validation/repair and version-2 imports. Storage belongs to persistence.js. */
(function (root) {
  'use strict';
  function install(
    Campaign,
    { D, R, classes, talentProfiles, talentMaxRanks, expeditionCeilings, dungeonIds },
  ) {
    const clone = (x) => JSON.parse(JSON.stringify(x)),
      clamp = (n, a, b) => Math.max(a, Math.min(b, n)),
      dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    class Save {
      snapshot() {
        const out = clone(this.s);
        out.recallActive = false;
        out.squadDoctrine = this.squadDefaultDoctrine();
        out.squadEngagement = null;
        out.squadBoss = false;
        out.heroTarget = null;
        delete out.holdFire;
        out.projectiles = [];
        out.hazards = [];
        out.party.forEach((u) => {
          delete u.path;
          u.order = null;
        });
        for (const z of Object.values(out.zones))
          for (const e of z.enemies) {
            e.telegraph = null;
            e.motion = null;
            e.sequence = [];
            e.rangedAim = null;
            e.aggro = false;
            e.frenzy = false;
            delete e.path;
            delete e.idleWanderTarget;
            delete e.idleWanderWait;
            delete e.rogueDustCoverUntil;
            e.returning = 0;
            if (e.hp > 0 && !e.neutral) {
              Object.assign(e, e.home);
              e.hp = e.maxHp;
              e.heroParticipated = false;
              e.mercyProvoked = false;
            }
          }
        return out;
      }
      static validate(data) {
        const s = clone(data);
        if (
          !s ||
          s.version !== 4 ||
          !['normal', 'nightmare'].includes(s.mode) ||
          !['adventure', 'awakening', 'peace'].includes(s.phase) ||
          !classes[s.hero?.class]
        )
          throw Error('Invalid save');
        if (s.talentBalanceVersion === undefined) {
          const rank = Array.isArray(s.hero?.talents) ? s.hero.talents[2] || 0 : 0,
            p = talentProfiles[s.hero.class],
            delta = rank * (p.hp - 30);
          if (Number.isFinite(s.hero.maxHp) && Number.isFinite(s.hero.hp) && delta) {
            const missing = Math.max(0, s.hero.maxHp - s.hero.hp),
              alive = s.hero.hp > 0;
            s.hero.maxHp = Math.max(1, s.hero.maxHp + delta);
            s.hero.hp = alive ? Math.max(1, s.hero.maxHp - missing) : 0;
          }
          s.talentBalanceVersion = 1;
        }
        if (s.talentBalanceVersion !== 1) throw Error('Invalid talent balance version');
        if (s.hero.freeTalentResets === undefined) s.hero.freeTalentResets = 2;
        if (Array.isArray(s.party))
          for (const u of s.party) if (u.active === undefined) u.active = true;
        if (s.mercyTime === undefined) s.mercyTime = 0;
        if (s.expeditionRank === undefined) {
          let inferred = 1;
          for (const [id, cap] of Object.entries(expeditionCeilings))
            if (s.rescued?.[id]) inferred = Math.max(inferred, cap);
          const active = Array.isArray(s.party)
            ? s.party.filter((u) => u.active !== false).length
            : 0;
          inferred = Math.max(
            inferred,
            active >= 6 ? 6 : active === 5 ? 5 : active === 4 ? 4 : active === 3 ? 2 : 1,
          );
          s.expeditionRank = inferred;
        }
        if (s.expeditionSkills === undefined)
          s.expeditionSkills = { sharedTraining: 0, sharedStrength: 0 };
        if (s.expeditionSupportVersion === undefined) {
          if (s.expeditionSkills.sharedTraining === 4) s.expeditionSkills.sharedTraining = 5;
          s.expeditionSupportVersion = 2;
        }
        if (s.expeditionSupportVersion !== 2) throw Error('Invalid Expedition support version');
        if (s.companionVitalityRank === undefined) s.companionVitalityRank = 0;
        if (s.companionCombatTraining === undefined)
          s.companionCombatTraining = (s.hero?.skills?.[1] || 0) > 0 ? 2 : 1;
        if (s.rangerSupport === undefined) s.rangerSupport = { heal: 1, mana: 1 };
        if (
          !Number.isInteger(s.companionVitalityRank) ||
          s.companionVitalityRank < 0 ||
          s.companionVitalityRank > 1000000
        )
          throw Error('Invalid Companion Vitality rank');
        if (
          !Number.isInteger(s.companionCombatTraining) ||
          s.companionCombatTraining < 1 ||
          s.companionCombatTraining > 2
        )
          throw Error('Invalid companion combat training');
        if (
          !s.rangerSupport ||
          !Number.isInteger(s.rangerSupport.heal) ||
          !Number.isInteger(s.rangerSupport.mana) ||
          s.rangerSupport.heal < 1 ||
          s.rangerSupport.heal > 2 ||
          s.rangerSupport.mana < 1 ||
          s.rangerSupport.mana > 2
        )
          throw Error('Invalid Ranger support training');
        const finite = (v, min, max) => {
          if (!Number.isFinite(v) || v < min || v > max) throw Error('Invalid save number');
        };
        for (const field of [
          'level',
          'gold',
          'xp',
          'hp',
          'maxHp',
          'mp',
          'maxMp',
          'power',
          'armor',
          'speed',
          'x',
          'y',
        ])
          finite(s.hero[field], field === 'level' ? 1 : 0, field === 'level' ? 10000 : 1e9);
        if (
          s.hero.hp > s.hero.maxHp ||
          s.hero.mp > s.hero.maxMp ||
          !Array.isArray(s.hero.skills) ||
          s.hero.skills.length !== 8 ||
          s.hero.skills.some((v) => !Number.isInteger(v) || v < 0 || v > 8) ||
          s.hero.skills[0] < 1
        )
          throw Error('Invalid hero');
        finite(s.mercyTime, 0, 10);
        if (s.restCooldown !== undefined) finite(s.restCooldown, 0, 90);
        if (s.manaBalanceVersion !== undefined && s.manaBalanceVersion !== 1)
          throw Error('Invalid mana balance version');
        if (s.squadDoctrine !== undefined && !['focus', 'guard'].includes(s.squadDoctrine))
          throw Error('Invalid squad doctrine');
        if (
          s.squadEngagement !== undefined &&
          s.squadEngagement !== null &&
          !['field', 'boss'].includes(s.squadEngagement)
        )
          throw Error('Invalid squad engagement');
        if (s.squadBoss !== undefined && typeof s.squadBoss !== 'boolean')
          throw Error('Invalid squad boss context');
        if (s.heroTarget !== undefined && s.heroTarget !== null && typeof s.heroTarget !== 'string')
          throw Error('Invalid hero target');
        if (
          !Array.isArray(s.hero.cd) ||
          s.hero.cd.length !== 8 ||
          s.hero.cd.some((v) => !Number.isFinite(v) || v < 0 || v > 60)
        )
          throw Error('Invalid cooldown');
        if (!Number.isInteger(s.expeditionRank) || s.expeditionRank < 1 || s.expeditionRank > 6)
          throw Error('Invalid Expedition rank');
        if (
          !s.expeditionSkills ||
          typeof s.expeditionSkills !== 'object' ||
          Array.isArray(s.expeditionSkills) ||
          Object.keys(s.expeditionSkills).some((k) => !R.expeditionSupportSkills[k]) ||
          Object.keys(R.expeditionSupportSkills).some(
            (k) =>
              !Number.isInteger(s.expeditionSkills[k]) ||
              s.expeditionSkills[k] < 0 ||
              s.expeditionSkills[k] > R.expeditionSupportSkills[k].maxRank,
          )
        )
          throw Error('Invalid Expedition support skills');
        if (
          !Array.isArray(s.party) ||
          s.party.length > 200 ||
          s.party.filter((u) => u.active !== false).length > [0, 2, 3, 3, 4, 5, 6][s.expeditionRank]
        )
          throw Error('Invalid party');
        const ids = new Set(D.bosses.map((b) => b.id));
        if (s.fieldBossKills !== undefined) {
          if (
            !s.fieldBossKills ||
            typeof s.fieldBossKills !== 'object' ||
            Array.isArray(s.fieldBossKills)
          )
            throw Error('Invalid field boss counters');
          for (const [id, v] of Object.entries(s.fieldBossKills))
            if (
              !ids.has(id) ||
              !(D.bosses.find((b) => b.id === id)?.kind === 'field' || id === 'darklord') ||
              !Number.isInteger(v) ||
              v < 0 ||
              v > 2
            )
              throw Error('Invalid field boss counter');
        }
        for (const field of ['normal', 'true', 'rescued', 'keys', 'late']) {
          if (!s[field] || typeof s[field] !== 'object') throw Error('Missing facts');
          for (const [id, v] of Object.entries(s[field]))
            if (!ids.has(id) || v !== true) throw Error('Invalid boss identity');
        }
        for (const [key, v] of Object.entries(s.victories || {}))
          if (
            !/^(.*):(normal|true)$/.test(key) ||
            !ids.has(key.split(':')[0]) ||
            v !== true ||
            !s[key.endsWith(':normal') ? 'normal' : 'true'][key.split(':')[0]]
          )
            throw Error('Invalid victory identity');
        for (const id of Object.keys(s.true))
          if (!s.normal[id]) throw Error('TRUE victory without normal victory');
        if (s.phase !== 'adventure' && !s.true.darklord) throw Error('Invalid awakening');
        if (s.phase === 'peace' && !dungeonIds.every((id) => s.true[id]))
          throw Error('Invalid peace');
        if (s.phase === 'adventure' && s.true.darklord) throw Error('Missing awakening');
        finite(s.clock, 0, 720);
        finite(s.time, 0, 1e12);
        finite(s.nextId, 1, 1e9);
        const zones = new Set([
          ...D.regions.map((r) => r.id),
          ...dungeonIds,
          ...R.supplyRooms.map((r) => r.id),
          ...(R.sideDungeons || []).map((r) => r.id),
        ]);
        if (
          !zones.has(s.zone) ||
          !D.regions.some((r) => r.id === s.refuge) ||
          !s.zones ||
          Object.keys(s.zones).length > 20
        )
          throw Error('Invalid zone');
        for (const [id, z] of Object.entries(s.zones)) {
          if (
            !zones.has(id) ||
            !Array.isArray(z.enemies) ||
            z.enemies.length > 2000 ||
            !Array.isArray(z.npcs) ||
            z.npcs.length > 100
          )
            throw Error('Invalid population');
          const seen = new Set();
          for (const e of z.enemies) {
            delete e.rogueDustCoverUntil;
            if (seen.has(e.id) || (e.family && !ids.has(e.family))) throw Error('Invalid enemy');
            seen.add(e.id);
            for (const f of ['x', 'y', 'hp', 'maxHp', 'baseHp', 'baseDamage', 'gold', 'xp'])
              finite(e[f], 0, 1e9);
            if (e.hp > e.maxHp || !e.home) throw Error('Invalid enemy health');
            if (
              s.phase === 'peace' &&
              (!e.neutral || e.summon || e.guard || e.family === 'darklord')
            )
              throw Error('Invalid peaceful habitat');
          }
        }
        if (!s.challenge)
          s.challenge = { succession: false, fallen: [], pending: false, gameOver: false };
        const ch = s.challenge;
        if (
          typeof ch.succession !== 'boolean' ||
          typeof ch.pending !== 'boolean' ||
          typeof ch.gameOver !== 'boolean' ||
          !Array.isArray(ch.fallen) ||
          ch.fallen.length > 3 ||
          new Set(ch.fallen).size !== ch.fallen.length ||
          ch.fallen.some((id) => !classes[id])
        )
          throw Error('Invalid succession');
        if (
          (!ch.succession && (ch.fallen.length || ch.pending || ch.gameOver)) ||
          (ch.pending &&
            (!ch.fallen.includes(s.hero.class) || ch.fallen.length !== 1 || s.hero.hp !== 0)) ||
          (ch.gameOver && (ch.fallen.length !== 3 || ch.pending || s.hero.hp !== 0)) ||
          (ch.succession && !ch.pending && !ch.gameOver && ch.fallen.includes(s.hero.class))
        )
          throw Error('Invalid succession state');
        for (const f of ['immune', 'haste', 'potionCd', 'talentPoints', 'weapon', 'armorTier'])
          finite(s.hero[f], 0, f === 'weapon' || f === 'armorTier' ? 4 : 1e9);
        finite(s.hero.freeTalentResets, 0, 2);
        if (!Number.isInteger(s.hero.freeTalentResets))
          throw Error('Invalid free talent reset count');
        if (
          !Array.isArray(s.hero.talents) ||
          s.hero.talents.length !== 4 ||
          s.hero.talents.some((v, i) => !Number.isInteger(v) || v < 0 || v > (i === 3 ? 3 : 5))
        )
          throw Error('Invalid talents');
        for (const [k, v] of Object.entries(s.hero.potions || {})) {
          if (!['health', 'mana', 'greater_health', 'greater_mana'].includes(k))
            throw Error('Invalid legacy potion');
          finite(v, 0, 1e6);
          if (!Number.isInteger(v)) throw Error('Invalid potion count');
        }
        if (s.hero.potionEffect !== undefined) {
          delete s.hero.potionEffect;
        }
        if (s.hero.supportEffects === undefined) s.hero.supportEffects = [];
        if (!Array.isArray(s.hero.supportEffects) || s.hero.supportEffects.length > 20)
          throw Error('Invalid hero recovery effects');
        for (const e of s.hero.supportEffects) {
          if (!e || !['health', 'mana'].includes(e.type))
            throw Error('Invalid hero recovery effect');
          finite(e.remaining, 0, 1000);
          finite(e.seconds, 0, 5);
        }
        for (const u of s.party) {
          if (
            !['worker', 'soldier', 'archer'].includes(u.type) ||
            typeof u.id !== 'string' ||
            typeof u.active !== 'boolean'
          )
            throw Error('Invalid companion');
          if (u.skill1Cd === undefined) u.skill1Cd = 0;
          if (u.skill2Cd === undefined) u.skill2Cd = 0;
          if (u.skillGlobalCd === undefined) u.skillGlobalCd = 0;
          if (u.healCd === undefined) u.healCd = 0;
          if (u.manaCd === undefined) u.manaCd = 0;
          if (u.survivalCd === undefined) u.survivalCd = 0;
          if (u.immune === undefined) u.immune = 0;
          if (u.supportEffects === undefined) u.supportEffects = [];
          for (const f of [
            'x',
            'y',
            'hp',
            'maxHp',
            'damage',
            'cd',
            'skill1Cd',
            'skill2Cd',
            'skillGlobalCd',
            'healCd',
            'manaCd',
            'survivalCd',
            'immune',
            'carry',
          ])
            finite(u[f], 0, 1e9);
          if (u.hp > u.maxHp || !Array.isArray(u.supportEffects) || u.supportEffects.length > 20)
            throw Error('Invalid companion health');
          for (const e of u.supportEffects) {
            if (!e || e.type !== 'health') throw Error('Invalid companion recovery effect');
            finite(e.remaining, 0, 1000);
            finite(e.seconds, 0, 5);
          }
        }
        for (const [id, v] of Object.entries(s.earlyRoll || {}))
          if (!dungeonIds.includes(id) || typeof v !== 'boolean' || !s.normal[id])
            throw Error('Invalid TRUE roll');
        for (const [id, p] of Object.entries(s.pending || {})) {
          if (
            !p ||
            !['field', 'dungeon', 'mob'].includes(p.kind) ||
            ![1, 2].includes(p.count) ||
            (p.kind === 'dungeon' && !dungeonIds.includes(id)) ||
            (p.kind === 'field' && (!ids.has(id) || p.count !== 1)) ||
            (p.kind !== 'dungeon' && (!zones.has(p.zone) || !p.base || !Number.isFinite(p.delay)))
          )
            throw Error('Invalid pending elite');
        }
        for (const [id, q] of Object.entries(s.quests || {}))
          if (
            !/^(?:quest-(?:[0-9]|[12][0-9])|quest-barracks)$/.test(id) ||
            !q ||
            typeof q.active !== 'boolean' ||
            typeof q.done !== 'boolean' ||
            typeof q.paid !== 'boolean' ||
            (q.paid && !q.done) ||
            !Number.isFinite(q.count) ||
            q.count < 0
          )
            throw Error('Invalid quest');
        for (const [id, z] of Object.entries(s.zones)) {
          if (z.minis !== undefined) {
            if (
              !Array.isArray(z.minis) ||
              z.minis.length < 1 ||
              z.minis.length > 2 ||
              new Set(z.minis.map((m) => m.id)).size !== z.minis.length
            )
              throw Error('Invalid field dungeons');
            for (const m of z.minis) {
              const regionIndex = D.regions.findIndex((r) => r.id === id),
                family = D.bosses.find((b) => b.region === id && b.kind === 'field')?.id;
              if (
                regionIndex < 0 ||
                !['field', 'resource'].includes(m.type) ||
                m.id !== (m.type === 'field' ? 'field-' + family : 'resource-' + id) ||
                typeof m.cleared !== 'boolean' ||
                !Array.isArray(m.trapPosts) ||
                m.trapPosts.length > 2
              )
                throw Error('Invalid field dungeon identity');
              finite(m.x, 0, 5000);
              finite(m.y, 0, 5000);
              for (const t of m.trapPosts) {
                finite(t.x, 0, 5000);
                finite(t.y, 0, 5000);
                finite(t.index, 100, 200);
                if (!['spikes', 'jet', 'seal'].includes(t.kind)) throw Error('Invalid field trap');
              }
            }
          }
          if (!Array.isArray(z.props) || z.props.length > 400) throw Error('Invalid zone assets');
          for (const f of ['nodes', 'buildings'])
            if (!Array.isArray(z[f]) || z[f].length > 300) throw Error('Invalid zone assets');
          if (!z.packTimers || typeof z.packTimers !== 'object') throw Error('Invalid pack timers');
          finite(z.clock, 0, 1e12);
          for (const n of z.nodes) {
            if (n.legacyCapacity !== undefined) finite(n.legacyCapacity, 0, 900);
            finite(
              n.amount,
              0,
              Math.max(
                R.tributeTotal || 640,
                R.legacyResourceTotals?.[id] || 0,
                D.regions[D.regions.findIndex((r) => r.id === id)]?.resource || 0,
                n.legacyCapacity || 0,
              ),
            );
          }
          for (const e of z.enemies) {
            finite(e.home.x, 0, 5000);
            finite(e.home.y, 0, 5000);
            for (const f of ['level', 'damage', 'respawn', 'cd', 'noProgress', 'attackIndex'])
              finite(e[f], 0, 1e9);
            if (
              !['normal', 'true', 'ringleader'].includes(e.form) ||
              !['mob', 'boss'].includes(e.type) ||
              (e.type === 'boss' && !ids.has(e.family))
            )
              throw Error('Invalid enemy role');
          }
        }
        if (
          !s.statistics ||
          !Array.isArray(s.statistics.events) ||
          s.statistics.events.length > 400 ||
          !s.statistics.bossSeconds
        )
          throw Error('Invalid report');
        if (
          !s.hero.reforges ||
          typeof s.hero.reforges !== 'object' ||
          !s.hero.potions ||
          s.hero.maxHp < 1 ||
          s.hero.maxMp < 1 ||
          !Number.isInteger(s.hero.level) ||
          s.hero.xp >= 120 * s.hero.level
        )
          throw Error('Invalid hero progression');
        for (const f of [
          'victories',
          'pending',
          'quests',
          'earlyRoll',
          'paid',
          'tickets',
          'recovery',
          'origins',
          'gathered',
          'discovered',
          'fountains',
        ])
          if (!s[f] || typeof s[f] !== 'object' || Array.isArray(s[f]))
            throw Error('Missing campaign facts');
        if (
          !s.streak ||
          ![0, 1].includes(s.streak.count) ||
          (s.streak.key !== null && typeof s.streak.key !== 'string') ||
          !Array.isArray(s.loot) ||
          s.loot.length > 5000
        )
          throw Error('Invalid reward state');
        for (const l of s.loot) {
          if (!zones.has(l.zone)) throw Error('Invalid loot location');
          for (const f of ['x', 'y', 'gold']) finite(l[f], 0, 1e9);
        }
        for (const p of Object.values(s.pending))
          if (p.kind !== 'dungeon') {
            for (const f of ['level', 'baseHp', 'baseDamage', 'gold', 'xp'])
              finite(p.base[f], 0, 1e9);
            if (!p.base.home) throw Error('Invalid elite home');
            finite(p.base.home.x, 0, 5000);
            finite(p.base.home.y, 0, 5000);
            if (p.nightBonus !== undefined) {
              if (!p.base.nightOnly || !p.nightBonus || typeof p.nightBonus !== 'object')
                throw Error('Invalid night elite');
              for (const f of ['hp', 'damage']) finite(p.nightBonus[f], 0.1, 1000);
            }
          }
        for (const f of ['weapon', 'armorTier', 'talentPoints', 'nextId'])
          if (!Number.isInteger(f === 'nextId' ? s[f] : s.hero[f]))
            throw Error('Invalid integer progression');
        if (s.awakeningAck !== undefined && typeof s.awakeningAck !== 'boolean')
          throw Error('Invalid awakening acknowledgement');
        if (
          s.awakeningLevel !== undefined &&
          (!Number.isInteger(s.awakeningLevel) ||
            s.awakeningLevel < 3 ||
            s.awakeningLevel > 10002 ||
            !s.true.darklord)
        )
          throw Error('Invalid awakening level');
        for (const z of Object.values(s.zones))
          if (z.awakenedGuardWave !== undefined && z.awakenedGuardWave !== s.awakeningLevel)
            throw Error('Invalid guardian return level');
        if (s.hero.slow !== undefined) finite(s.hero.slow, 0, 60);
        if (s.refugeSite) {
          if (
            !D.regions.some((r) => r.id === s.refugeSite.zone) ||
            !['rest', 'minor'].includes(s.refugeSite.id)
          )
            throw Error('Invalid refuge');
          finite(s.refugeSite.x, 0, 5000);
          finite(s.refugeSite.y, 0, 5000);
        }
        const allIds = new Set();
        for (const u of s.party) {
          if (allIds.has(u.id)) throw Error('Duplicate companion');
          allIds.add(u.id);
        }
        let reservations = s.party.length;
        for (const z of Object.values(s.zones)) {
          for (const b of z.buildings) {
            if (b.full === undefined) b.full = true;
            if (b.upgradeProgress === undefined) b.upgradeProgress = b.full ? 4 : 0;
            if (b.upgradePaid === undefined) b.upgradePaid = !!b.full;
            finite(b.x, 0, 5000);
            finite(b.y, 0, 5000);
            finite(b.progress, 0, 4);
            finite(b.queue, 0, 4);
            finite(b.upgradeProgress, 0, 4);
            if (typeof b.full !== 'boolean' || typeof b.upgradePaid !== 'boolean')
              throw Error('Invalid barracks state');
            if (b.queue > 0) reservations++;
          }
          for (const n of z.npcs) {
            finite(n.x, 0, 5000);
            finite(n.y, 0, 5000);
          }
          for (const v of Object.values(z.packTimers)) finite(v, 0, 1e9);
        }
        if (reservations > 200) throw Error('Recruitment reservations exceed save capacity');
        if (s.hero.legacyPotions) {
          if (!Array.isArray(s.hero.legacyPotions) || s.hero.legacyPotions.length > 10000)
            throw Error('Invalid legacy supplies');
          for (const p of s.hero.legacyPotions) {
            if (!['health', 'mana'].includes(p.type)) throw Error('Invalid supply type');
            finite(p.value, 1, 1000);
          }
        }
        return s;
      }
      static restore(data, random = Math.random) {
        const s = Campaign.validate(data),
          c = new Campaign(s.mode, s.hero.class, random);
        c.s = s;
        c.hero.potions = { health: 0, mana: 0, greater_health: 0, greater_mana: 0 };
        delete c.hero.legacyPotions;
        for (const u of c.s.party)
          if (u.type === 'worker') {
            const ratio = u.maxHp ? clamp(u.hp / u.maxHp, 0, 1) : 0;
            u.type = 'soldier';
            u.maxHp = c.companionMaxHp('soldier');
            u.hp = Math.round(u.maxHp * ratio);
            u.damage = 12;
            u.icon = '⚔️';
            u.order = null;
          }
        c.s.squadDoctrine = c.squadDefaultDoctrine();
        c.s.squadEngagement = null;
        c.s.squadBoss = false;
        c.s.heroTarget = null;
        delete c.s.holdFire;
        c.normalizeManaProgression();
        c.s.clock %= 600;
        c.s.fieldBossKills = c.s.fieldBossKills || {};
        if (c.s.rescued.darklord && !c.s.rescued.cindermaw) {
          c.s.rescued.cindermaw = true;
          c.s.normal.cindermaw = true;
          c.s.keys.cindermaw = true;
          c.s.victories['cindermaw:normal'] = true;
          c.s.fieldBossKills.cindermaw = Math.max(1, c.s.fieldBossKills.cindermaw || 0);
          delete c.s.rescued.darklord;
        }
        for (const b of D.bosses.filter((b) => b.kind === 'field' || b.id === 'darklord')) {
          const required = b.id === 'darklord' ? 1 : 2,
            logged = (c.s.statistics?.events || []).filter(
              (ev) => ev.type === 'bossDefeat' && ev.family === b.id && ev.form === 'normal',
            ).length,
            known = c.s.normal[b.id] ? 1 : 0,
            done = c.s.true[b.id] ? required : 0,
            reconstructed = Math.min(
              required,
              Math.max(c.s.fieldBossKills[b.id] || 0, logged, known, done),
            );
          if (reconstructed > 0) c.s.fieldBossKills[b.id] = reconstructed;
          else delete c.s.fieldBossKills[b.id];
          if (reconstructed >= required && !c.s.true[b.id] && !c.s.pending[b.id]) {
            const ri = D.regions.findIndex((r) => r.id === b.region),
              home =
                c.s.zones[b.region]?.enemies.find((e) => e.family === b.id)?.home ||
                c.fieldCenter(ri);
            c.s.pending[b.id] = {
              kind: 'field',
              count: 1,
              zone: b.region,
              base: {
                family: b.id,
                form: 'normal',
                type: 'boss',
                home: { ...home },
                x: home.x,
                y: home.y,
              },
              delay: 5,
            };
            if (c.s.zone === b.region)
              c.notice(b.name + ' TRUE encounter restored from your saved boss defeats', 6.5);
          }
        }
        if (c.s.awakeningAck === undefined) c.s.awakeningAck = c.s.phase !== 'awakening';
        c.repairLegacyRescues();
        if (c.s.phase === 'awakening' && !c.s.awakeningLevel) c.s.awakeningLevel = c.hero.level + 2;
        c.s.projectiles = [];
        c.s.hazards = [];
        c.messages = [];
        c.effects = [];
        for (const z of Object.values(c.s.zones)) {
          z.props = z.props.filter((p) => !c.blocked(p.x, p.y, z.id, p.r || 0, true));
          c.roadNetwork(z);
          for (const e of z.enemies) {
            if (e.family === 'thorn' && e.type === 'boss') {
              const base = c.boss('thorn').hp * (e.form === 'true' ? 1.8 : 1),
                fraction = e.hp / e.maxHp,
                m = e.maxHp / e.baseHp;
              e.baseHp = base;
              e.maxHp = base * m;
              e.hp = e.maxHp * fraction;
            }
            const authoredResident = !!(e.mini || e.strongholdResident || e.sideDungeon);
            if (c.blocked(e.home.x, e.home.y, z.id, 15, authoredResident))
              e.home = c.safe(e.home.x, e.home.y, z.id);
            if (c.blocked(e.x, e.y, z.id, 15, authoredResident))
              Object.assign(e, c.safe(e.x, e.y, z.id));
          }
          for (const n of [...z.npcs, ...z.nodes, ...z.buildings])
            if (c.blocked(n.x, n.y, z.id)) Object.assign(n, c.safe(n.x, n.y, z.id));
          c.authoredPlaces(z);
          const families = new Set();
          z.enemies = z.enemies.filter((e) => {
            if (
              e.type !== 'boss' ||
              e.hp <= 0 ||
              !(c.boss(e.family).kind === 'field' || e.family === 'darklord')
            )
              return true;
            if (families.has(e.family)) return false;
            families.add(e.family);
            return true;
          });
        }
        c.zone();
        c.refreshNPCs();
        c.initializeQuests();
        c.checkQuests();
        c.autoEquipBestWeapon();
        c.syncCompanionLevelStats();
        for (const u of [c.hero, ...c.s.party])
          if (c.blocked(u.x, u.y)) Object.assign(u, c.safe(u.x, u.y));
        if (c.s.phase === 'awakening') c.activatePending();
        return c;
      }
      repairLegacyRescues() {
        // Earlier v2 imports granted nine service unlocks without checking campaign progress.
        if (!Array.isArray(this.s.legacyInventory) || this.s.legacyRescueAuditVersion === 1) return;
        for (const id of [
          'thorn',
          'mire',
          'ridge',
          'warlord',
          'citadel',
          'crypt',
          'mine',
          'abyss',
          'cindermaw',
        ])
          if (
            this.s.rescued[id] &&
            !this.s.normal[id] &&
            !this.s.keys[id] &&
            !this.s.statistics.events.some((e) => e.type === 'rescue' && e.family === id)
          )
            delete this.s.rescued[id];
        this.s.legacyRescueAuditVersion = 1;
      }
      static migrate(old, random = Math.random) {
        if (old?.version !== 2 || !old.player || !classes[old.player.heroClass || 'paladin'])
          throw Error('Unknown legacy save');
        const c = new Campaign('normal', old.player.heroClass || 'paladin', random),
          p = old.player,
          h = c.hero;
        c.s.mercyTime = 0;
        for (const [a, b] of [
          ['level', 'level'],
          ['gold', 'gold'],
          ['maxHp', 'maxHp'],
          ['maxMp', 'maxMp'],
          ['hp', 'hp'],
          ['mp', 'mp'],
          ['power', 'spellPower'],
          ['armor', 'armor'],
          ['speed', 'maxSpeed'],
        ])
          if (Number.isFinite(p[b]) && p[b] >= 0) h[a] = p[b];
        h.xp = clamp(p.xp || 0, 0, 120 * h.level - 1);
        h.skills = Array.from({ length: 8 }, (_, i) => clamp(p.spellLevels?.[i + 1] || 1, 1, 8));
        h.talents = (old.talents || [0, 0, 0, 0]).map((v, i) => clamp(v, 0, talentMaxRanks[i]));
        h.talentPoints = p.talentPoints || 0;
        {
          const delta = (h.talents[2] || 0) * (c.talentProfile().hp - 30);
          if (delta) {
            const missing = Math.max(0, h.maxHp - h.hp),
              alive = h.hp > 0;
            h.maxHp = Math.max(1, h.maxHp + delta);
            h.hp = alive ? Math.max(1, h.maxHp - missing) : 0;
          }
        }
        c.s.legacyRescueAuditVersion = 1;
        for (const id of ['crypt', 'mine', 'abyss', 'citadel'])
          if (old.dungeonCleared?.[id] === true) {
            c.victory(id, 'normal');
            c.s.keys[id] = true;
            c.s.paid['clear:' + id] = true;
            c.s.earlyRoll[id] = random() < 1 / 3;
            if (c.s.earlyRoll[id]) c.s.pending[id] = { kind: 'dungeon', count: 1 };
          }
        if (old.bossDefeated === true) {
          c.victory('darklord', 'normal');
          c.s.keys.darklord = true;
        }
        if (old.squad?.units) {
          c.s.party = old.squad.units.slice(0, 100).map((u) => {
            const type = u.type === 'archer' ? 'archer' : 'soldier',
              v = c.unit(type, 300, 400),
              oldMax = Math.max(1, u.maxHp || v.maxHp),
              ratio = clamp((u.hp || 0) / oldMax, 0, 1);
            v.hp = Math.round(v.maxHp * ratio);
            v.carry = u.carry || 0;
            return v;
          });
          const active = Math.min(6, c.s.party.length);
          c.s.expeditionRank =
            active >= 6 ? 6 : active === 5 ? 5 : active === 4 ? 4 : active === 3 ? 2 : 1;
          c.s.party.forEach((u, i) => (u.active = i < active));
        }
        const equipped = old.inventory?.[old.equipped],
          weaponPower =
            {
              'Espada de Cruzado': 10,
              'Bastón de Escarcha': 10,
              'Arco de Exploradora': 10,
              'Martillo del Juicio': 18,
              'Arma de la Frontera': 40,
              'Arma de las Cumbres': 70,
            }[equipped] || 0;
        h.legacyWeaponPower = weaponPower;
        h.legacyWeaponName = equipped || '';
        h.power = Math.max(0, h.power - h.talents[0] * 8 - weaponPower);
        h.speed = Math.max(50, h.speed - h.talents[3] * 40);
        h.potions = { health: 0, mana: 0, greater_health: 0, greater_mana: 0 };
        h.legacyPotions = [];
        const legacyRegion = (region, x = 0) =>
          dungeonIds.includes(region)
            ? region
            : x >= 2800
              ? 'crown'
              : x >= 1800
                ? 'frontier'
                : 'vale';
        for (const b of old.squad?.buildings || []) {
          const region = legacyRegion(b.region, b.wx),
            previous = c.s.zone;
          c.s.zone = region;
          const z = c.zone(),
            i = c.regionIndex(),
            point = c.safe(
              D.towns[i][0] + 200 + (z.buildings.length % 3) * 90,
              D.towns[i][1] + 200,
            );
          z.buildings.push({
            id: 'legacy-barracks-' + c.s.nextId++,
            ...point,
            progress: clamp(b.progress || 0, 0, 4),
            queue: clamp(b.queue || 0, 0, 4),
            queueType: null,
            kind: 'barracks',
            name: 'Barracks',
            theme: region,
            icon: '🏗️',
            full: true,
            upgradeProgress: 4,
            upgradePaid: true,
          });
          c.s.zone = previous;
        }
        if (old.squad) {
          for (const [region, nodeId] of [
            ['vale', 'wood'],
            ['highlands', 'ore'],
            ['crown', 'crystal'],
          ]) {
            c.s.zone = region;
            const zone = c.zone(),
              savedNode = old.squad.nodes?.find((n) => n.id === nodeId);
            zone.nodes[0].legacyCapacity = Math.min(900, Math.max(0, savedNode?.amount || 0));
            zone.nodes[0].amount = zone.nodes[0].legacyCapacity;
          }
          c.s.zone = 'vale';
        }
        const origin = legacyRegion(old.activeRegion, p.wx);
        c.normalizeManaProgression(true);
        c.enter(origin);
        c.s.legacyInventory = clone(old.inventory || []);
        c.autoEquipBestWeapon();
        c.s.legacyQuests = clone(old.quest || {});
        c.refreshNPCs();
        c.say('Legacy progression preserved. New regions and quests await.');
        Campaign.validate(c.snapshot());
        return c;
      }
    }
    for (const name of Object.getOwnPropertyNames(Save.prototype))
      if (name !== 'constructor')
        Object.defineProperty(
          Campaign.prototype,
          name,
          Object.getOwnPropertyDescriptor(Save.prototype, name),
        );
    for (const name of ['validate', 'restore', 'migrate'])
      Object.defineProperty(Campaign, name, Object.getOwnPropertyDescriptor(Save, name));
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeSave = api;
})(typeof window !== 'undefined' ? window : globalThis);
