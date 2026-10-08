/* Deterministic campaign rules, independent of the browser and renderer. */
(function (root) {
  'use strict';
  const R = typeof PrototypeRules !== 'undefined' ? PrototypeRules : require('./rules.js');
  const D = typeof PrototypeData !== 'undefined' ? PrototypeData : require('./data.js');
  const clone = (x) => JSON.parse(JSON.stringify(x)),
    clamp = (n, a, b) => Math.max(a, Math.min(b, n)),
    dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const classes = R.balance.classes;
  const talentMaxRanks = R.balance.disciplines.maxRanks;
  // Rounded from the level-1 class stat ratios: talent growth reinforces each class's natural strengths while keeping the old average power budget.
  const talentProfiles = R.balance.disciplines.profiles;
  const legacyWeapons = {
    'Espada de Cruzado': 10,
    'Bastón de Escarcha': 10,
    'Arco de Exploradora': 10,
    'Martillo del Juicio': 18,
    'Arma de la Frontera': 40,
    'Arma de las Cumbres': 70,
  };
  const ceilings = R.balance.instructors.skillCeilings;
  const expeditionCeilings = R.balance.instructors.expeditionCeilings;
  const dungeonIds = D.bosses.filter((b) => b.kind === 'dungeon').map((b) => b.id);

  const pursuitBurstSeconds = R.balance.pursuit.burstSeconds,
    pursuitBurstMultiplier = R.balance.pursuit.burstMultiplier,
    mercyStartRadius = R.balance.pursuit.mercyStartRadius;
  class Campaign {
    constructor(mode = 'normal', heroClass = 'paladin', random = Math.random, options = {}) {
      if (!['normal', 'nightmare'].includes(mode) || !classes[heroClass])
        throw Error('Unknown mode or class');
      this.random = random;
      this.formationHeading = { x: 0, y: 1 };
      this.messages = [];
      this.effects = [];
      this.notices = [];
      this.noticeId = 0;
      this.basicComboStep = 0;
      this.basicComboAt = -1e9;
      this.basicComboClass = heroClass;
      this.basicComboTargetId = null;
      this.s = {
        version: 4,
        mode,
        phase: 'adventure',
        clock: 0,
        time: 0,
        mercyTime: 10,
        restCooldown: 0,
        zone: 'vale',
        refuge: 'vale',
        nextId: 1,
        manaBalanceVersion: 1,
        talentBalanceVersion: 1,
        normal: {},
        true: {},
        fieldBossKills: {},
        earlyRoll: {},
        pending: {},
        origins: {},
        late: {},
        victories: {},
        rescued: {},
        keys: {},
        paid: {},
        tickets: {},
        recovery: {},
        quests: {},
        discovered: {},
        gathered: {},
        fountains: {},
        zones: {},
        loot: [],
        projectiles: [],
        hazards: [],
        streak: { key: null, count: 0 },
        endingAck: false,
        awakeningAck: false,
        expeditionRank: 1,
        expeditionSkills: { sharedTraining: 0, sharedStrength: 0 },
        expeditionSupportVersion: 2,
        companionVitalityRank: 0,
        companionCombatTraining: 1,
        rangerSupport: { heal: 1, mana: 1 },
        squadDoctrine: heroClass === 'paladin' ? 'focus' : 'guard',
        squadEngagement: null,
        squadBoss: false,
        heroTarget: null,
        statistics: {
          kills: 0,
          deaths: 0,
          goldEarned: 0,
          suppliesUsed: 0,
          bossSeconds: {},
          events: [],
        },
      };
      const c = classes[heroClass];
      this.s.hero = {
        class: heroClass,
        x: 300,
        y: 350,
        hp: c.hp,
        maxHp: c.hp,
        mp: c.mp,
        maxMp: c.mp,
        level: 1,
        xp: 0,
        gold: R.balance.economy.startingCrowns,
        power: c.power,
        armor: c.armor,
        speed: c.speed,
        skills: [1, 0, 0, 0, 0, 0, 0, 0],
        cd: Array(8).fill(0),
        immune: 0,
        haste: 0,
        weapon: 0,
        armorTier: 0,
        reforges: {},
        potions: { health: 0, mana: 0, greater_health: 0, greater_mana: 0 },
        tonic: false,
        potionCd: 0,
        slow: 0,
        supportEffects: [],
        talents: [0, 0, 0, 0],
        talentPoints: 0,
        freeTalentResets: 2,
      };
      this.s.challenge = {
        succession: options.succession === true,
        fallen: [],
        pending: false,
        gameOver: false,
      };
      this.initializeQuests();
      this.s.party = [this.unit('soldier', 260, 390), this.unit('archer', 350, 380)];
      this.zone();
    }
    get hero() {
      return this.s.hero;
    }
    get zoneId() {
      return this.s.zone;
    }
    get peace() {
      return this.s.phase === 'peace';
    }
    regionIndex(id = this.s.zone) {
      const boss = D.bosses.find((b) => b.id === id),
        room = R.supplyRooms.find((r) => r.id === id),
        side = R.sideDungeons?.find((r) => r.id === id);
      return D.regions.findIndex(
        (r) => r.id === (boss?.region || room?.region || side?.region || id),
      );
    }
    definition() {
      return D.regions[this.regionIndex()];
    }
    fieldCenter(index = this.regionIndex()) {
      const p = R.fieldBossCenters?.[index] || D.fields[index];
      return { x: p[0], y: p[1] };
    }
    supplyRoom(id = this.s.zone) {
      return R.supplyRooms.find((r) => r.id === id);
    }
    sideDungeon(id = this.s.zone) {
      return R.sideDungeons?.find((r) => r.id === id);
    }
    zoneSize(id = this.s.zone) {
      const room = this.supplyRoom(id),
        side = this.sideDungeon(id);
      return room
        ? 900
        : side
          ? side.size || 1100
          : dungeonIds.includes(id)
            ? 1500
            : D.regions[this.regionIndex(id)]?.size;
    }
    isDungeon() {
      return dungeonIds.includes(this.s.zone) || !!this.supplyRoom() || !!this.sideDungeon();
    }
    night() {
      return (!this.peace && this.s.mode === 'nightmare') || this.s.clock % 600 >= 360;
    }
    nightPoints() {
      const count = (obj) =>
        Object.keys(obj || {}).filter(
          (key) => key.split(':')[0] !== 'darklord' && key !== 'darklord',
        ).length;
      return this.s.mode === 'nightmare'
        ? count(this.s.victories)
        : Math.min(15, count(this.s.normal) + count(this.s.late));
    }
    multipliers() {
      const n = this.nightPoints();
      return this.night() && !this.peace
        ? { hp: 1.1 + 0.03 * n, damage: 1.15 + 0.02 * n }
        : { hp: 1, damage: 1 };
    }
    event(type, data = {}) {
      this.s.statistics.events.push({ time: Math.round(this.s.time), type, ...data });
      if (this.s.statistics.events.length > 400) this.s.statistics.events.shift();
      this.effects.push({ type, ...data });
    }

    say(text) {
      this.messages.push(text);
      if (this.messages.length > 7) this.messages.shift();
    }
    notice(text, duration = 5.5) {
      this.notices.push({ id: ++this.noticeId, text, duration });
      if (this.notices.length > 6) this.notices.shift();
    }
    boss(id) {
      return D.bosses.find((b) => b.id === id);
    }

    idOrder(a, b) {
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    }

    setRefuge(zone, id) {
      const n = this.s.zones[zone]?.npcs.find((n) => n.id === id && n.kind === 'rest');
      if (n) {
        this.s.refuge = zone;
        this.s.refugeSite = { zone, id, x: n.x, y: n.y };
      }
    }
    arriveRefuge(site) {
      const n = this.zone().npcs.find((n) => n.id === site.id && n.kind === 'rest');
      if (!n) return;
      Object.assign(this.hero, this.safe(n.x, n.y));
      for (const u of this.activeParty()) Object.assign(u, this.safe(n.x + 40, n.y + 30));
    }
    miniCleared(id, region = this.s.zone) {
      return !!this.s.zones[region]?.minis?.find((m) => m.id === id)?.cleared;
    }
    miniStatus(id) {
      const z = this.zone(),
        m = z.minis?.find((m) => m.id === id);
      if (!m) return 'Unknown encounter';
      const guards = z.enemies.filter((e) => e.mini === id && e.hp > 0 && !e.neutral).length,
        pending = Object.values(this.s.pending).some(
          (p) => p.kind === 'mob' && p.zone === z.id && p.base.mini === id,
        );
      return (
        m.name +
        ' · ' +
        (this.peace
          ? 'Peaceful'
          : m.cleared
            ? 'Cleared'
            : guards +
              ' guardians' +
              (pending ? ' + incoming ringleaders' : '') +
              (m.type === 'field' && !this.s.normal[m.family]
                ? ' + ' + this.boss(m.family).name
                : '')) +
        ' · ' +
        (m.type === 'resource'
          ? 'Clear to unlock expedition resources and marked supplies.'
          : 'Clear the guardians, defeat the boss and free the captive for the local quest reward.') +
        ' Two open approaches and cover allow retreat. Guardians give reduced crowns and EXP.'
      );
    }
    checkMinis() {
      if (this.isDungeon() || this.peace) return;
      const z = this.s.zones[this.s.zone];
      for (const m of z?.minis || []) {
        if (m.cleared || (m.type === 'field' && !this.s.normal[m.family])) continue;
        if (
          z.enemies.some((e) => e.mini === m.id && e.hp > 0 && !e.neutral) ||
          Object.values(this.s.pending).some(
            (p) => p.kind === 'mob' && p.zone === z.id && p.base.mini === m.id,
          )
        )
          continue;
        m.cleared = true;
        this.say(
          m.name +
            ' cleared. ' +
            (m.type === 'resource'
              ? 'Troops can gather and supplies can be recovered.'
              : 'Any completed quest reward is delivered automatically.'),
        );
        this.event('miniClear', { id: m.id });
        this.checkQuests();
      }
    }
    bundleCollected(n) {
      return (
        n.kind === 'bundle' && !!this.s.discovered[this.definition().id + ':bundle-' + n.index]
      );
    }
    visibleNPCs() {
      return this.zone().npcs.filter((n) => !n.internalSite && !this.bundleCollected(n));
    }
    siteDescription(n) {
      const z = this.zone(),
        guards = z.enemies.filter((e) => e.site === n.id && e.hp > 0 && !e.neutral).length,
        parts = [];
      if (z.id === 'highlands' && R.ironrootLore?.[n.id]) parts.push(R.ironrootLore[n.id]);
      if (n.id.startsWith('bridge-'))
        parts.push(
          'A crossing through the regional terrain. Walk across the connected road; no separate entrance.',
        );
      const quests = this.questDefs().filter((q) => q.region === z.id && q.sites?.includes(n.id));
      if (quests.length)
        parts.push('Survey objective: ' + quests.map((q) => q.name).join(', ') + '.');
      const caches = z.npcs.filter(
        (b) => b.kind === 'bundle' && b.site === n.id && !this.bundleCollected(b),
      );
      if (caches.length) parts.push('Recover the marked supplies here with Interact.');
      const room = R.supplyRooms.find((r) => r.region === z.id && r.site === n.id);
      if (room)
        parts.push(
          'The quest supplies are secured inside ' +
            room.name +
            ' nearby. Recover all ' +
            room.count +
            ' caches there after clearing its guards.',
        );
      const node = z.nodes.find((a) => a.site === n.id && this.tributeKnown(a));
      if (node)
        parts.push(
          node.amount > 0
            ? 'Dark Lord Tribute has been located here. Assign idle troops from Barracks Operations to recover it; exact value is tracked there.'
            : 'The recovered tribute at this site is exhausted.',
        );
      if (n.id === 'convoy')
        parts.push(
          'Escort the supplier back to Emberwatch. Stay close so the convoy keeps moving.',
        );
      if (n.id === 'checkpoint')
        parts.push(
          "This is the Ashen Warlord's occupied checkpoint; Lyss is held inside the compound.",
        );
      if (n.id === 'fortress-gate')
        parts.push(
          this.s.rescued.cindermaw && this.s.rescued.citadel
            ? 'Both Crown specialists are free. The fortress approach now leads to the Dark Lord.'
            : 'The Dark Lord remains beyond the fortress, but first free Vera from Cindermaw and Tovan from the Citadel.',
        );
      if (n.id === 'night-site')
        parts.push('Visit after dark and defeat two Lantern wraiths for Lanterns after dark.');
      if (n.id === 'goblin-camp')
        parts.push(
          'A working goblin roadside camp: bedding, cookfire and stolen goods show a raiding community that lives here between attacks.',
        );
      if (n.id === 'mire-nests')
        parts.push(
          'Mire creatures nest, feed and wallow along this bank; the territory is habitat first and a danger to travelers second.',
        );
      if (n.id === 'wolf-den')
        parts.push(
          'Tracks, bedding and old kills mark a real hunting ground used by the highland wolf packs.',
        );
      if (n.id === 'ogre-hearth')
        parts.push(
          'A rough ogre home camp with a communal hearth, stone seats and scavenged quarry gear.',
        );
      if (n.id === 'orc-bivouac')
        parts.push(
          'A long-term occupation bivouac: soldiers cook, sleep, drill and repair equipment here between patrol quotas.',
        );
      if (n.id === 'ash-roost')
        parts.push(
          'Ash beasts roost and feed here among warm stone and old bones instead of simply wandering the volcanic road.',
        );
      if (n.id === 'crown-barracks')
        parts.push(
          "A permanent Crown field barracks with bunks, meals, stores and training space for troops enforcing the Dark Lord's order.",
        );
      const hold = (R.creatureStrongholds || []).find((s) => s.region === z.id && s.site === n.id);
      if (hold)
        parts.push(
          hold.night
            ? 'This site becomes a defended center of power for ' +
                (hold.nightSpecies === 'wraith' ? 'wraiths' : 'Ash stalkers') +
                ' after dark.'
            : 'Ordinary ' +
                hold.species +
                's have made this a defended personal stronghold with sleeping, food, storage and social space of their own.',
        );
      if (n.sideDungeon)
        parts.push(
          'This named site has an occupied interior. Regional enemies have adapted the old structure into living space, traps and defensible rooms.',
        );
      const mini = z.minis?.find(
        (m) => m.site === n.id || (m.type === 'field' && dist(m, n) < 260),
      );
      if (mini) parts.push(this.miniStatus(mini.id));
      if (!parts.length) parts.push('An outdoor patrol site. It has no separate dungeon interior.');
      if (!this.peace)
        parts.push(
          guards
            ? 'Local patrol: ' +
                guards +
                ' guards alive. Patrols return after the whole party leaves.'
            : 'No local guards remain.',
        );
      else parts.push('The war is over; this place is safe.');
      return n.name + '. ' + parts.join(' ');
    }
    questProgress(q) {
      const p = this.s.quests[q.id],
        seen = (id) => !!this.s.discovered[q.region + ':' + id];
      if (p?.paid)
        return q.kind === 'barracks'
          ? 'Complete · field base established'
          : 'Complete · reward delivered';
      if (p?.closedByPeace) return 'Resolved by peace';
      if (p?.done) return 'Complete';
      if (q.kind === 'barracks')
        return this.hasAnyBarracks()
          ? 'Construction in progress · keep one companion assigned until complete'
          : 'Open Adventure menu while in the field → Establish Basic Barracks · first one FREE';
      if (q.kind === 'bundles')
        return (
          Array.from({ length: q.target }, (_, j) => j).filter((j) => seen('bundle-' + j)).length +
          '/' +
          q.target +
          ' supplies recovered'
        );
      if (q.kind === 'patrol') return (p?.count || 0) + '/' + q.target + ' outdoor enemies';
      if (q.kind === 'night')
        return (
          (p?.count || 0) +
          '/' +
          q.target +
          ' night wraiths; ' +
          (seen('night-site') ? 'shore observed' : 'observe Lantern shore after dark')
        );
      if (q.kind === 'sites') {
        const missing = q.sites
            .filter((id) => !seen(id))
            .map((id) =>
              id === 'port'
                ? 'transport stand'
                : id === 'minor'
                  ? D.regions.find((r) => r.id === q.region).minor
                  : R.sites[D.regions.findIndex((r) => r.id === q.region)].find(
                      (s) => s[0] === id,
                    )?.[1] || id,
            ),
          rescues = (q.requiresRescues || [])
            .filter((id) => !this.s.rescued[id])
            .map((id) => this.boss(id).captive);
        return [...missing, ...rescues].join(', ') + ' still required';
      }
      if (q.kind === 'rescue')
        return (
          (this.s.rescued[q.target]
            ? 'Captive freed'
            : this.boss(q.target).captive + ' still captive') +
          (q.clear && !this.miniCleared(q.clear, q.region)
            ? ' · clear the field dungeon guardians'
            : '')
        );
      return 'Meet the supplier at Supply convoy; stay within escort range on the return road';
    }

    upgradeRingleader(e) {
      if (e.form !== 'ringleader' || e.ringleaderHealthVersion === 3) return;
      const alive = e.hp > 0,
        fraction = e.maxHp ? e.hp / e.maxHp : 0,
        hpState = e.baseHp ? e.maxHp / e.baseHp : 1,
        damageState = e.baseDamage ? e.damage / e.baseDamage : 1;
      if (!e.ringleaderHealthVersion) {
        e.baseHp = Math.round(e.baseHp * 1.25);
        e.ringleaderHealthVersion = 2;
      }
      if (e.ringleaderHealthVersion === 2) {
        e.baseHp = Math.round(e.baseHp * 1.25);
        e.baseDamage = Math.round(e.baseDamage * 1.2);
      }
      e.maxHp = e.baseHp * hpState;
      e.hp = alive ? e.maxHp * fraction : 0;
      e.damage = e.baseDamage * damageState;
      e.ringleaderHealthVersion = 3;
    }
    guardianPopulation(z) {
      const ri = this.regionIndex(z.id),
        cfg = R.guardianScaling[ri],
        legacy = R.guardianLegacyScaling[ri],
        melee = R.ordinaryMeleeScaling[ri],
        outdoor = !dungeonIds.includes(z.id) && !this.supplyRoom(z.id);
      if (!cfg) return;
      const scale = (e) => {
        if (!e?.guard || e.neutral || e.guardianBalanceVersion === 2) return;
        const alive = e.hp > 0,
          fraction = e.maxHp ? e.hp / e.maxHp : 0,
          hpState = e.baseHp ? e.maxHp / e.baseHp : 1,
          damageState = e.baseDamage ? e.damage / e.baseDamage : 1;
        if (e.guardianBalanceVersion === 1 && legacy) {
          e.baseHp = Math.round(e.baseHp / legacy.hp);
          e.baseDamage = Math.round(e.baseDamage / legacy.damage);
        } else if (outdoor && e.meleeBalanceVersion) {
          e.baseHp = Math.round(e.baseHp / melee.hp);
          e.baseDamage = Math.round(e.baseDamage / melee.damage);
          delete e.meleeBalanceVersion;
        }
        e.baseHp = Math.round(e.baseHp * cfg.hp);
        e.baseDamage = Math.round(e.baseDamage * cfg.damage);
        e.maxHp = e.baseHp * hpState;
        e.hp = alive ? e.maxHp * fraction : 0;
        e.damage = e.baseDamage * damageState;
        e.guardianBalanceVersion = 2;
      };
      for (const e of z.enemies) scale(e);
      for (const p of Object.values(this.s.pending))
        if (p.kind === 'mob' && p.zone === z.id && p.base.guard) scale(p.base);
      z.guardianBalanceVersion = 2;
    }
    summonPopulation(z) {
      const cfg = R.summonScaling[this.regionIndex(z.id)];
      if (!cfg) return;
      for (const e of z.enemies.filter((e) => e.summon && !e.summonBalanceVersion)) {
        const alive = e.hp > 0,
          fraction = e.maxHp ? e.hp / e.maxHp : 0,
          hpState = e.baseHp ? e.maxHp / e.baseHp : 1,
          damageState = e.baseDamage ? e.damage / e.baseDamage : 1;
        e.baseHp = Math.round(e.baseHp * cfg.hp);
        e.baseDamage = Math.round(e.baseDamage * cfg.damage);
        e.maxHp = e.baseHp * hpState;
        e.hp = alive ? e.maxHp * fraction : 0;
        e.damage = e.baseDamage * damageState;
        e.summonBalanceVersion = 1;
      }
    }
    nightEnemyPopulation(z) {
      for (const e of z.enemies.filter((e) => e.nightOnly && !e.nightBalanceVersion)) {
        const cfg = R.nightEnemyCombat[e.species];
        if (!cfg) continue;
        const alive = e.hp > 0,
          fraction = e.maxHp ? e.hp / e.maxHp : 0,
          hpState = e.baseHp ? e.maxHp / e.baseHp : 1,
          damageState = e.baseDamage ? e.damage / e.baseDamage : 1;
        e.baseHp = Math.round(e.baseHp * cfg.hp);
        e.baseDamage = Math.round(e.baseDamage * cfg.damage);
        e.maxHp = e.baseHp * hpState;
        e.hp = alive ? e.maxHp * fraction : 0;
        e.damage = e.baseDamage * damageState;
        e.nightBalanceVersion = 1;
        e.specialCd = Math.min(e.specialCd ?? 1.5, 1.5);
      }
      for (const p of Object.values(this.s.pending))
        if (
          p.kind === 'mob' &&
          p.zone === z.id &&
          p.base.nightOnly &&
          !p.base.nightBalanceVersion
        ) {
          const cfg = R.nightEnemyCombat[p.base.species];
          if (cfg) {
            p.base.baseHp = Math.round(p.base.baseHp * cfg.hp);
            p.base.maxHp = Math.round(p.base.maxHp * cfg.hp);
            p.base.baseDamage = Math.round(p.base.baseDamage * cfg.damage);
            p.base.damage = Math.round(p.base.damage * cfg.damage);
            p.base.nightBalanceVersion = 1;
          }
        }
    }
    treasuryInterior(z) {
      const room = this.supplyRoom(z.id),
        layout = room && R.treasuryDecor?.[room.id],
        targetVersion = ['supply-crown', 'supply-highlands'].includes(room?.id) ? 4 : 3;
      if (!room || !layout || z.treasuryVersion === targetVersion) return;
      z.room = true;
      z.treasury = room.boss;
      z.props = z.props.filter(
        (p) =>
          !/^room-(pillar|crate)-/.test(String(p.id || '')) &&
          !/^treasury-/.test(String(p.id || '')),
      );
      for (const [j, [x, y, structure, radius, sceneRole]] of layout.entries()) {
        const p = this.safe(x, y, z.id);
        z.props.push({
          id: 'treasury-' + j,
          ...p,
          r: radius || 0,
          decorative: !radius,
          structure,
          treasuryBoss: room.boss,
          ...(sceneRole ? { sceneRole } : {}),
        });
      }
      const exit = z.npcs.find((n) => n.id === 'exit');
      if (exit) {
        exit.name = 'Leave ' + room.name;
        Object.assign(exit, this.safe(exit.x, exit.y, z.id));
      }
      const collected = Math.min(
          room.count,
          [0, 1, 2].filter((j) => this.s.discovered[room.region + ':bundle-' + j]).length,
        ),
        cacheSpots = R.treasuryCacheSpots?.[room.id] || [
          [650, 365],
          [720, 690],
          [545, 760],
        ];
      z.npcs = z.npcs.filter((n) => n.kind !== 'bundle');
      for (let j = 0; j < room.count; j++) {
        const p = this.safe(cacheSpots[j][0], cacheSpots[j][1], z.id);
        z.npcs.push({
          id: 'bundle-' + j,
          name: room.name + ' cache ' + (j + 1),
          kind: 'bundle',
          index: j,
          ...p,
          icon: '📦',
        });
      }
      if (room.id !== 'supply-highlands') {
        for (let j = 0; j < 3; j++) delete this.s.discovered[room.region + ':bundle-' + j];
        for (let j = 0; j < collected; j++) this.s.discovered[room.region + ':bundle-' + j] = true;
      }
      if (R.treasuryGuardFormations?.[room.id]) {
        const fallback = this.safe(150, 180, z.id),
          formation = R.treasuryGuardFormations?.[room.id] || [],
          guards = z.enemies.filter((e) => e.roomGuard).sort((a, b) => this.idOrder(a, b));
        for (const [j, e] of guards.entries()) {
          const slot = formation[j];
          if (slot) {
            const p = this.safe(slot.x, slot.y, z.id);
            e.home = { ...p };
            e.pack = z.id + '-' + (slot.group || 'guard-' + j);
            if (slot.role) e.forcedRole = slot.role;
            if (!e.roomCaptain && slot.name) e.name = slot.name;
            if (e.hp > 0 && !e.aggro) Object.assign(e, p);
            this.configureEnemy(e, j);
          } else {
            const p = this.blocked(e.home?.x, e.home?.y, z.id, 12)
              ? this.safe(e.home?.x || fallback.x, e.home?.y || fallback.y, z.id)
              : e.home;
            e.home = { ...p };
            if (e.hp > 0 && !e.aggro && this.blocked(e.x, e.y, z.id, 12)) Object.assign(e, p);
          }
        }
        for (const e of z.enemies.filter((e) => !e.roomGuard)) {
          if (e.home && this.blocked(e.home.x, e.home.y, z.id, 12))
            e.home = this.safe(e.home.x, e.home.y, z.id);
          if (e.hp > 0 && !e.aggro && this.blocked(e.x, e.y, z.id, 12))
            Object.assign(e, this.safe(e.x, e.y, z.id));
        }
        if (this.s.zone === z.id) {
          if (this.blocked(this.hero.x, this.hero.y, z.id, 12)) Object.assign(this.hero, fallback);
          for (const [j, u] of this.activeParty().entries())
            if (this.blocked(u.x, u.y, z.id, 12))
              Object.assign(
                u,
                this.safe(
                  fallback.x + 35 + (j % 3) * 25,
                  fallback.y + 35 + Math.floor(j / 3) * 25,
                  z.id,
                ),
              );
        }
      }
      for (const e of z.enemies.filter(
        (e) => e.roomGuard && !e.roomCaptain && / store guard/i.test(e.name),
      ))
        e.name = e.name.replace(/ store guard/i, ' treasury guard');
      z.treasuryVersion = targetVersion;
    }
    roomCaptainPopulation(z) {
      const profile = R.roomCaptains?.[z.id];
      if (!profile) return;
      let captain = z.enemies.find((e) => e.roomCaptain);
      if (!captain) captain = z.enemies.find((e) => e.roomGuard && / captain$/i.test(e.name));
      if (!captain) return;
      captain.captain = true;
      captain.roomCaptain = true;
      captain.captainProfile = z.id;
      captain.captainMentor = profile.mentor;
      captain.captainVisualIdol = profile.visualIdol || profile.mentor;
      captain.visualScale = profile.visualScale || 1.16;
      captain.specialCd = Math.min(captain.specialCd ?? 1.25, 1.25);
      captain.roomCaptainVersion = 1;
      if (captain.name !== profile.name) captain.name = profile.name;
    }
    fieldCaptainPopulation(z) {
      if (z.id !== 'frontier' || this.peace) return;
      const key = 'frontier-overseer',
        profile = R.roomCaptains?.[key];
      if (!profile) return;
      let captain = z.enemies.find((e) => e.fieldCaptain);
      if (!captain) {
        const i = this.regionIndex(z.id),
          r = D.regions[i],
          scale = R.ordinaryMeleeScaling[i],
          sp = D.species[i][0],
          raw = profile.patrol?.[0] || [1200, 950],
          p = this.safe(raw[0], raw[1], z.id),
          hp = Math.round((65 + i * 105) * scale.hp * 2),
          damage = Math.round((7 + i * 8) * scale.damage * 1.25),
          { gold, xp } = this.regionalEnemyRewards(i, 'fieldCaptain');
        captain = this.makeEnemy(
          {
            species: sp[0],
            name: profile.name,
            icon: sp[2],
            level: i * 3 + 2,
            hp,
            damage,
            gold,
            xp,
          },
          p,
        );
        captain.pack = 'frontier-overseer';
        z.enemies.push(captain);
      }
      captain.captain = true;
      captain.fieldCaptain = true;
      captain.meleeBalanceVersion = 1;
      captain.captainProfile = key;
      captain.captainMentor = profile.mentor;
      captain.captainVisualIdol = profile.visualIdol || profile.mentor;
      captain.visualScale = profile.visualScale || 1.18;
      captain.specialCd = Math.min(captain.specialCd ?? 1.25, 1.25);
      captain.captainPatrolIndex = Number.isInteger(captain.captainPatrolIndex)
        ? captain.captainPatrolIndex
        : 0;
      captain.captainPatrolWait = Math.max(0, captain.captainPatrolWait || 0);
      captain.fieldCaptainVersion = 1;
      if (captain.name !== profile.name) captain.name = profile.name;
      z.fieldCaptainVersion = 1;
    }
    finalBossPopulation(z) {
      if (
        z.id !== 'crown' ||
        this.peace ||
        !this.s.rescued.cindermaw ||
        !this.s.rescued.citadel ||
        this.s.normal.darklord ||
        this.s.true.darklord ||
        this.s.pending.darklord
      )
        return;
      let e = z.enemies.find((e) => e.family === 'darklord' && e.hp > 0);
      if (e) return;
      const b = this.boss('darklord'),
        p = this.safe(D.fields[4][0], D.fields[4][1], z.id);
      e = this.bossEnemy(b, 'normal', p);
      z.enemies.push(e);
      this.say(
        'With both Crown specialists free, the Dark Lord now waits beyond the fortress gate.',
      );
    }

    dungeonGuardCount(zone = this.s.zone) {
      const formation = R.dungeonGuardFormations?.[zone];
      return formation?.length || D.regions[this.regionIndex(zone)]?.guards || 0;
    }
    dungeonGuardBlueprint(zone, index) {
      const i = this.regionIndex(zone),
        formation = R.dungeonGuardFormations?.[zone];
      if (formation?.length) {
        const spec = formation[index % formation.length],
          defaultSpecies = zone === 'citadel' ? 'crownguard' : D.species[i][0][0],
          sp =
            D.species[i].find((s) => s[0] === (spec.species || defaultSpecies)) || D.species[i][0],
          defaultName =
            zone === 'citadel'
              ? spec.role === 'ranged'
                ? 'Crown marksman guardian'
                : 'Crown shield guardian'
              : sp[1] + ' guardian';
        return {
          ...spec,
          sp,
          pack: zone + '-' + (spec.group || 'formation-' + Math.floor(index / 4)),
          name: spec.name || defaultName,
        };
      }
      const pack = Math.floor(index / 2),
        sp = D.species[i][pack % D.species[i].length],
        [x, y] = R.guardPosts[pack % R.guardPosts.length];
      return {
        x: x + (index % 2) * 44,
        y: y + (index % 2) * 50,
        sp,
        pack: zone + '-pack-' + pack,
        name: sp[1] + ' guardian',
      };
    }
    configureEnemy(e, index) {
      if (e.type !== 'mob' || e.summon || e.neutral) return;
      if (e.forcedRole === 'melee') {
        e.ranged = false;
        delete e.hybrid;
        delete e.shotRange;
        delete e.shotSpeed;
        delete e.projectileStyle;
        return;
      }
      if (e.forcedRole === 'ranged') {
        e.ranged = true;
        e.shotRange = 280;
        e.shotSpeed = 260;
        e.projectileStyle = e.species === 'wraith' ? 'spectral' : 'arrow';
        return;
      }
      const profile = R.rangedProfiles[e.species];
      if (
        profile &&
        (index % 3 === 2 ||
          (e.guard && index % 2 === 1) ||
          (e.species === 'reedbeast' && index % 2 === 0))
      ) {
        Object.assign(e, profile, { ranged: true });
        if (!e.name.includes(profile.variant)) e.name += ' ' + profile.variant;
      } else if (['archer', 'crownguard', 'wraith'].includes(e.species)) {
        e.ranged = true;
        e.shotRange = 280;
        e.shotSpeed = 260;
        e.projectileStyle = e.species === 'wraith' ? 'spectral' : 'arrow';
      }
    }
    combatPopulation(z) {
      if (z.combatVersion === 1) return;
      z.combatVersion = 1;
      z.enemies.forEach((e, j) => this.configureEnemy(e, j));
    }
    ordinaryMeleePopulation(z) {
      if (dungeonIds.includes(z.id) || this.supplyRoom(z.id)) return;
      const cfg = R.ordinaryMeleeScaling[this.regionIndex(z.id)];
      if (!cfg) return;
      const eligible = (e) =>
        e &&
        e.type === 'mob' &&
        e.form !== 'true' &&
        !e.guard &&
        !e.summon &&
        !e.neutral &&
        !e.nightOnly &&
        !e.ranged &&
        !e.meleeBalanceVersion;
      const scale = (e) => {
        if (!eligible(e)) return;
        const alive = e.hp > 0,
          fraction = e.maxHp ? e.hp / e.maxHp : 0,
          hpState = e.baseHp ? e.maxHp / e.baseHp : 1,
          damageState = e.baseDamage ? e.damage / e.baseDamage : 1;
        e.baseHp = Math.round(e.baseHp * cfg.hp);
        e.maxHp = e.baseHp * hpState;
        e.hp = alive ? e.maxHp * fraction : 0;
        e.baseDamage = Math.round(e.baseDamage * cfg.damage);
        e.damage = e.baseDamage * damageState;
        e.meleeBalanceVersion = 1;
      };
      for (const e of z.enemies) scale(e);
      for (const p of Object.values(this.s.pending))
        if (p.kind === 'mob' && p.zone === z.id) scale(p.base);
      z.meleeBalanceVersion = 1;
    }
    ordinaryRangedPopulation(z) {
      if (dungeonIds.includes(z.id) || this.supplyRoom(z.id)) return;
      const cfg = R.ordinaryRangedScaling[this.regionIndex(z.id)];
      if (!cfg) return;
      const eligible = (e) =>
        e &&
        e.type === 'mob' &&
        e.form === 'normal' &&
        !e.guard &&
        !e.summon &&
        !e.neutral &&
        !e.nightOnly &&
        e.ranged &&
        !e.rangedBalanceVersion;
      const scale = (e) => {
        if (!eligible(e)) return;
        const alive = e.hp > 0,
          fraction = e.maxHp ? e.hp / e.maxHp : 0,
          hpState = e.baseHp ? e.maxHp / e.baseHp : 1,
          damageState = e.baseDamage ? e.damage / e.baseDamage : 1;
        e.baseHp = Math.round(e.baseHp * cfg.hp);
        e.maxHp = e.baseHp * hpState;
        e.hp = alive ? e.maxHp * fraction : 0;
        e.baseDamage = Math.round(e.baseDamage * cfg.damage);
        e.damage = e.baseDamage * damageState;
        e.rangedBalanceVersion = 1;
      };
      for (const e of z.enemies) scale(e);
      for (const p of Object.values(this.s.pending))
        if (p.kind === 'mob' && p.zone === z.id) scale(p.base);
      z.rangedBalanceVersion = 1;
    }
    decorateDungeon(z) {
      const targetVersion = R.dungeonWorkstations?.[z.id]
        ? 3
        : z.id === 'abyss'
          ? 4
          : z.id === 'citadel'
            ? 3
            : 2;
      if (z.dungeonVersion === targetVersion) return;
      z.props = z.props.filter((p) => !p.decorative || !String(p.id).startsWith('decor-'));
      z.dungeonVersion = targetVersion;
      const i = this.regionIndex(z.id),
        region = D.regions[i];
      for (const [j, [x, y, kind, district, sceneRole]] of R.dungeonDecor[z.id].entries()) {
        const p = this.safe(x, y, z.id);
        z.props.push({
          id: 'decor-' + j,
          ...p,
          r: 0,
          decorative: true,
          structure: kind,
          icon: '🕯️',
          ...(district ? { dungeonDistrict: district } : {}),
          ...(sceneRole ? { sceneRole } : {}),
        });
      }
      const architecture = R.dungeonArchitecture?.[z.id],
        formation = R.dungeonGuardFormations?.[z.id];
      if (architecture) {
        const fallback = this.safe(180, 240, z.id),
          nearest = (p, alt = fallback) => {
            if (!p || !this.blocked(p.x, p.y, z.id, 12)) return p;
            try {
              return this.safe(p.x, p.y, z.id);
            } catch (_) {
              return { ...alt };
            }
          };
        for (const n of z.npcs) {
          const p = nearest(n);
          if (p) Object.assign(n, p);
        }
        for (const e of z.enemies) {
          const h = nearest(e.home, e.type === 'boss' ? this.safe(1160, 1110, z.id) : fallback);
          if (h) e.home = { ...h };
          if (e.hp > 0 && !e.aggro) {
            const p = nearest(e, h || fallback);
            if (p) Object.assign(e, p);
          }
        }
        if (this.s.zone === z.id) {
          const p = nearest(this.hero);
          if (p) Object.assign(this.hero, p);
          for (const [j, u] of this.activeParty().entries()) {
            const q = nearest(
              u,
              this.safe(p.x + 40 + (j % 3) * 28, p.y + 35 + Math.floor(j / 3) * 28, z.id),
            );
            if (q) Object.assign(u, q);
          }
        }
      }
      if (this.peace || this.s.paid['clear:' + z.id] || this.s.normal[z.id]) return;
      const target = this.dungeonGuardCount(z.id),
        existing = z.enemies
          .filter((e) => e.guard && e.form === 'normal' && !e.reinforcement)
          .sort((a, b) => this.idOrder(a, b));
      if (formation?.length) {
        for (let j = 0; j < Math.min(existing.length, target); j++) {
          const e = existing[j],
            g = this.dungeonGuardBlueprint(z.id, j),
            p = this.safe(g.x, g.y, z.id);
          e.species = g.sp[0];
          e.icon = g.sp[2];
          e.name = g.name;
          e.forcedRole = g.role;
          e.pack = g.pack;
          e.home = { ...p };
          if (e.hp > 0 && !e.aggro) Object.assign(e, p);
          this.configureEnemy(e, j);
        }
      }
      for (let j = existing.length; j < target; j++) {
        const g = this.dungeonGuardBlueprint(z.id, j),
          p = this.safe(g.x, g.y, z.id),
          e = this.makeEnemy(
            {
              species: g.sp[0],
              name: g.name,
              icon: g.sp[2],
              level: Math.max(1, i * 3 + (Math.floor(j / 2) % 2) + 1),
              hp: 65 + i * 105,
              damage: 7 + i * 8,
              gold: 0,
              xp: 0,
            },
            p,
          );
        e.guard = true;
        e.pack = g.pack;
        if (g.role) e.forcedRole = g.role;
        this.configureEnemy(e, j);
        z.enemies.push(e);
      }
      this.guardianPopulation(z);
    }
    makeEnemy(def, p) {
      return {
        id: 'enemy-' + this.s.nextId++,
        family: def.family || null,
        species: def.species || def.family,
        name: def.name,
        icon: def.icon || '👿',
        form: def.form || 'normal',
        type: def.type || 'mob',
        level: def.level,
        baseHp: def.hp,
        baseDamage: def.damage,
        hp: def.hp,
        maxHp: def.hp,
        damage: def.damage,
        gold: def.gold,
        xp: def.xp,
        x: p.x,
        y: p.y,
        home: { ...p },
        cd: 0,
        aggro: false,
        heroParticipated: false,
        noProgress: 0,
        attackIndex: 0,
        respawn: 0,
        neutral: false,
        open: 0,
        deathPaid: false,
      };
    }
    bossEnemy(b, form, p) {
      let hp = b.hp,
        damage = b.damage,
        { gold, xp } = this.bossRewards(b, form),
        level = b.level;
      if (form === 'true') {
        hp *= 1.8;
        damage *= 1.25;
        level += 2;
        if (b.kind === 'dungeon' && this.s.phase !== 'adventure') {
          const i = dungeonIds.indexOf(b.id);
          level = this.s.awakeningLevel || this.hero.level + 2;
          const scale = Math.max(1, level / 18);
          hp = Math.round((13000 + i * 1000) * scale);
          damage = Math.round((70 + i * 2) * scale);
          level = this.s.awakeningLevel || this.hero.level + 2;
        }
      }
      return this.makeEnemy(
        {
          family: b.id,
          name: b.name + (form === 'true' ? ' TRUE' : ''),
          icon: b.id === 'darklord' ? '😈' : b.kind === 'field' ? '👹' : '💀',
          form,
          type: 'boss',
          level,
          hp,
          damage,
          gold,
          xp,
        },
        p,
      );
    }
    refreshNPCs() {
      for (const [id, z] of Object.entries(this.s.zones)) {
        if (dungeonIds.includes(id) || this.supplyRoom(id) || this.sideDungeon(id)) continue;
        const i = this.regionIndex(id),
          [x, y] = D.towns[i];
        z.npcs = z.npcs.filter(
          (n) =>
            !['teacher', 'smith', 'alchemist'].includes(n.kind) && !n.id.startsWith('service-'),
        );
        for (const b of D.bosses.filter((b) => b.region === id && b.captive)) {
          const kind = ceilings[b.id] ? 'teacher' : b.id === 'archive' ? 'alchemist' : 'smith',
            offset = R.serviceOffsets[kind] || [-120, -120],
            exists = z.npcs.some((n) => n.id === 'service-' + b.id);
          if (this.s.rescued[b.id] && !exists) {
            const p = this.safe(x + offset[0], y + offset[1], id);
            z.npcs.push({
              id: 'service-' + b.id,
              name: b.captive,
              kind,
              family: b.id,
              ...p,
              icon: kind === 'teacher' ? '🧙' : kind === 'alchemist' ? '⚗️' : '⚒️',
            });
          }
        }
      }
    }
    clearTonic() {
      if (this.hero.tonic) {
        this.hero.maxHp -= this.hero.tonicBonus || 0;
        this.hero.hp = Math.min(this.hero.hp, this.hero.maxHp);
        this.hero.tonic = false;
        this.hero.tonicBonus = 0;
        this.syncCompanionLevelStats();
      }
    }
    refugeThreat() {
      return (
        !this.peace &&
        this.zone().enemies.some(
          (e) => e.hp > 0 && !e.neutral && e.aggro && dist(e, this.hero) < 700,
        )
      );
    }
    rest() {
      const site = this.zone()
        .npcs.filter((n) => n.kind === 'rest' && dist(n, this.hero) <= 115)
        .sort((a, b) => dist(a, this.hero) - dist(b, this.hero))[0];
      if (!site) return false;
      if (this.refugeThreat()) {
        this.say('Cannot rest while nearby enemies are engaged. Retreat and end the fight first.');
        return false;
      }
      if (this.s.restCooldown > 0) {
        this.say('Refuge restoration ready in ' + Math.ceil(this.s.restCooldown) + ' seconds.');
        return false;
      }
      this.clearTonic();
      this.hero.supportEffects = [];
      this.hero.hp = this.hero.maxHp;
      this.hero.mp = this.hero.maxMp;
      for (const u of this.activeParty())
        if (u.hp > 0) {
          u.hp = u.maxHp;
          u.supportEffects = [];
        }
      this.s.restCooldown = 90;
      this.setRefuge(this.s.zone, site.id);
      this.say(
        'Rested at the refuge. Hero and all living companions restored. Fallen companions require recovery through the Captain or a barracks.',
      );
      this.event('rest');
      return true;
    }

    rescue(family) {
      if (!this.boss(family)?.captive) return false;
      if (this.s.rescued[family]) return false;
      if (!this.s.keys[family] && !this.peace) {
        this.say('Defeat ' + this.boss(family).name + ' to obtain the key.');
        return false;
      }
      this.s.rescued[family] = true;
      this.refreshNPCs();
      this.say(this.boss(family).captive + ' is free and returning to town.');
      this.notice(this.boss(family).captive + ' rescued · new services unlocked', 5.5);
      this.event('rescue', { family });
      this.checkQuests();
      return true;
    }

    barracksSpecialists() {
      const teacherOrder = ['thorn', 'mire', 'ridge', 'warlord', 'citadel'],
        rescuedTeachers = teacherOrder.filter((id) => this.s.rescued[id]),
        highestTeacher = rescuedTeachers.at(-1),
        keep = new Set();
      for (const id of rescuedTeachers) {
        const catalog = this.teacherCatalog(id);
        if (id === highestTeacher || catalog.learn.some((slot) => !this.hero.skills[slot - 1]))
          keep.add(id);
      }
      const smithOrder = ['crypt', 'mine', 'abyss', 'cindermaw'],
        highestSmith = smithOrder.filter((id) => this.s.rescued[id]).at(-1);
      if (highestSmith) keep.add(highestSmith);
      for (const [key, def] of Object.entries(R.expeditionSupportSkills || {})) {
        const rank = this.expeditionSupportRank(key);
        if (rank >= def.maxRank) continue;
        const capable = Object.entries(def.trainers || {})
          .filter(([id, cap]) => this.s.rescued[id] && cap > rank)
          .sort((a, b) => a[1] - b[1]);
        if (capable.length) keep.add(capable.at(-1)[0]);
      }
      if (this.s.rescued.archive) keep.add('archive');
      return D.bosses
        .filter((b) => keep.has(b.id))
        .map((b) => ({
          family: b.id,
          name: b.captive,
          kind: R.teachers[b.id] ? 'teacher' : b.id === 'archive' ? 'alchemist' : 'smith',
        }));
    }

    buyPotion(type, advanced = false) {
      if (type === 'tonic') {
        if (!advanced || !this.s.rescued.archive) return false;
        if (this.hero.tonic) {
          this.say('Preparation tonic already active.');
          return false;
        }
        if (!this.spend(this.preparationTonicCost())) {
          this.say('Not enough crowns for a Preparation tonic.');
          return false;
        }
        this.hero.tonic = true;
        this.hero.tonicBonus = Math.ceil(this.hero.maxHp * 0.1);
        this.hero.maxHp += this.hero.tonicBonus;
        this.hero.hp += this.hero.tonicBonus;
        this.syncCompanionLevelStats();
        this.say('Preparation tonic applied · maximum health +10%.');
        this.notice('PREPARATION TONIC · ACTIVE', 4.5);
        return true;
      }
      this.say(
        'Combat potions are no longer used. Rangers provide Heal and Mana Recovery in the field.',
      );
      return false;
    }

    hasAnyBarracks() {
      return Object.values(this.s.zones).some((z) =>
        z?.buildings?.some((b) => b.kind === 'barracks'),
      );
    }
    hasCompletedBarracks() {
      return Object.values(this.s.zones).some((z) =>
        z?.buildings?.some((b) => b.kind === 'barracks' && b.progress >= 4),
      );
    }

    build() {
      if (this.isDungeon()) return false;
      const builder = this.availableLabor()[0],
        cost = this.barracksBuildCost();
      if (!builder || !this.spend(cost)) return false;
      this.s.recallActive = false;
      const p = this.safe(this.hero.x + 130, this.hero.y),
        b = {
          id: 'barracks-' + this.s.nextId++,
          ...p,
          progress: 0,
          queue: 0,
          queueType: null,
          kind: 'barracks',
          name: 'Barracks',
          theme: this.zoneId,
          icon: '🏗️',
          full: false,
          upgradeProgress: 0,
          upgradePaid: false,
        };
      this.zone().buildings.push(b);
      builder.order = { type: 'build', id: b.id };
      this.say(
        (builder.type === 'archer' ? 'Ranger' : 'Soldier') +
          ' assigned to build the basic barracks.',
      );
      return true;
    }
    assignBuilder(id) {
      const b = this.zone().buildings.find((b) => b.id === id && b.progress < 4),
        already = this.activeLivingParty().some(
          (u) => u.order?.type === 'build' && u.order.id === id,
        ),
        builder = this.availableLabor()[0];
      if (!b || already || !builder) return false;
      this.s.recallActive = false;
      builder.order = { type: 'build', id: b.id };
      this.say(
        (builder.type === 'archer' ? 'Ranger' : 'Soldier') + ' assigned to resume construction.',
      );
      return true;
    }
    upgradeBarracks(id) {
      const b = this.zone().buildings.find((b) => b.id === id && b.progress >= 4 && !b.full),
        already = this.activeLivingParty().some(
          (u) => u.order?.type === 'upgrade' && u.order.id === id,
        ),
        builder = this.availableLabor()[0];
      if (!b || (this.s.expeditionRank || 1) < 4 || already || !builder) return false;
      if (!b.upgradePaid) {
        if (!this.spend(this.barracksUpgradeCost())) return false;
        b.upgradePaid = true;
        b.upgradeProgress = b.upgradeProgress || 0;
      }
      this.s.recallActive = false;
      builder.order = { type: 'upgrade', id: b.id };
      this.say(
        (builder.type === 'archer' ? 'Ranger' : 'Soldier') + ' assigned to upgrade the barracks.',
      );
      return true;
    }
    train(id, type = 'soldier') {
      const b = this.zone().buildings.find((b) => b.id === id),
        price = this.barracksRecruitPrice(type);
      if ((this.s.expeditionRank || 1) < 2) {
        this.say('Recruitment unlocks at Expedition 2.');
        return false;
      }
      if (
        !b ||
        b.progress < 4 ||
        b.queue > 0 ||
        !price ||
        this.rosterCount() + this.queuedCompanions() >= 200 ||
        !this.spend(price)
      )
        return false;
      b.queue = 4;
      b.queueType = type;
      return true;
    }
    tributeKnown(n, region = this.definition().id) {
      return !n?.tribute || !n.hidden || !!this.s.discovered[region + ':tribute:' + n.tributeId];
    }
    visibleResourceNodes() {
      return this.zone().nodes.filter((n) => n.amount > 0 && this.tributeKnown(n));
    }
    hiddenTributeNodes() {
      return this.zone().nodes.filter(
        (n) => n.tribute && n.hidden && n.amount > 0 && !this.tributeKnown(n),
      );
    }
    scoutTribute() {
      if ((this.s.expeditionRank || 1) < 2 || this.isDungeon()) return false;
      const hidden = this.hiddenTributeNodes();
      if (!hidden.length) {
        this.say('No undiscovered Dark Lord Tribute remains in this region.');
        return false;
      }
      const n = hidden[0];
      this.s.discovered[this.definition().id + ':tribute:' + n.tributeId] = true;
      this.say('Scouts located Dark Lord Tribute at ' + n.siteName + '. ' + n.context + '.');
      this.event('tributeDiscovery', {
        region: this.definition().id,
        tributeId: n.tributeId,
        site: n.site,
      });
      return true;
    }
    gather(nodeId) {
      if ((this.s.expeditionRank || 1) < 2) {
        this.say(
          'Resource gathering unlocks at Expedition 2. Rescue Mira and train the Expedition Skill.',
        );
        return false;
      }
      this.checkMinis();
      const n = this.zone().nodes.find((n) => n.id === nodeId),
        labor = this.availableLabor();
      if (n?.tribute && !this.tributeKnown(n)) {
        this.say('That tribute cache has not been located by your expedition yet.');
        return false;
      }
      if (n?.mini && !this.peace && !this.miniCleared(n.mini)) {
        this.say(this.miniStatus(n.mini));
        return false;
      }
      if (!n || n.amount <= 0 || !labor.length) {
        this.say('At least one idle living troop and an unexhausted deposit are required.');
        return false;
      }
      this.s.recallActive = false;
      for (const u of labor) u.order = { type: 'gather', id: nodeId, group: n.resourceGroup };
      this.say(
        labor.length +
          ' troop' +
          (labor.length === 1 ? '' : 's') +
          ' assigned to recover Dark Lord Tribute at ' +
          (n.siteName || n.name) +
          '. They will deposit it and continue through other known tribute sites.',
      );
      return true;
    }

    enter(zone, arrival = null) {
      if (
        !D.regions.some((r) => r.id === zone) &&
        !dungeonIds.includes(zone) &&
        !this.supplyRoom(zone) &&
        !this.sideDungeon(zone)
      )
        return false;
      const i = this.regionIndex(zone),
        p =
          arrival ||
          (this.supplyRoom(zone)
            ? { x: 125, y: 155 }
            : this.sideDungeon(zone)
              ? { x: 120, y: 150 }
              : dungeonIds.includes(zone)
                ? { x: 160, y: 240 }
                : { x: D.towns[i][0], y: D.towns[i][1] });
      this.s.zone = zone;
      this.zone();
      this.s.recallActive = false;
      this.s.squadEngagement = null;
      this.s.squadBoss = false;
      this.s.squadDoctrine = this.squadDefaultDoctrine();
      this.s.heroTarget = null;
      const q = this.safe(p.x, p.y);
      Object.assign(this.hero, q);
      for (const u of this.activeParty()) {
        Object.assign(u, this.safe(q.x + 40, q.y + 30));
        u.order = null;
        u.path = [];
      }
      this.hero.order = null;
      this.s.projectiles = [];
      this.s.hazards = [];
      for (const z of Object.values(this.s.zones))
        for (const e of z.enemies) {
          e.aggro = false;
          e.telegraph = null;
          e.sequence = [];
          e.motion = null;
          e.rangedAim = null;
          e.frozen = false;
          if (e.hp > 0) {
            Object.assign(e, e.home);
            e.hp = e.baseHp;
            e.maxHp = e.baseHp;
            e.damage = e.baseDamage;
          }
        }
      this.activatePending();
      this.discover('arrival');
      const dungeonLore = R.dungeonLore?.[zone],
        loreKey = this.definition().id + ':dungeon-lore:' + zone;
      if (dungeonLore && !this.s.discovered[loreKey]) {
        this.s.discovered[loreKey] = true;
        this.say(dungeonLore);
      }
      const side = this.sideDungeon();
      if (side && !this.s.discovered[side.region + ':side-lore:' + side.id]) {
        this.s.discovered[side.region + ':side-lore:' + side.id] = true;
        if (side.lore) this.say(side.lore);
        this.event('sideInteriorDiscovery', { id: side.id, region: side.region });
      }
      return true;
    }
    travel(direction) {
      if (this.isDungeon() || ![1, -1].includes(direction)) return false;
      const i = this.regionIndex(),
        j = i + direction;
      if (j < 0 || j >= D.regions.length) return false;
      const edge = direction === 1 ? D.regions[i].id : D.regions[j].id;
      if (direction < 0 && !this.s.tickets[edge]) return false;
      const fare = this.travelFare(i, direction);
      if (this.hero.gold < fare) {
        this.say('Not enough crowns.');
        return false;
      }
      const before = clone(this.s),
        messageCount = this.messages.length,
        effectCount = this.effects.length,
        from = D.regions[i].id,
        to = D.regions[j].id,
        arrival = R.travelArrivals?.[from + '>' + to] || null;
      try {
        if (!this.enter(to, arrival)) throw Error('Invalid destination');
        this.payTravelFare(fare);
        if (direction === 1) {
          delete this.s.recovery[edge];
          this.s.tickets[edge] = true;
          this.s.lastEdge = edge;
        }
        this.event('travel', { from: before.zone, to: this.s.zone });
        return true;
      } catch (_) {
        this.s = before;
        this.messages.length = messageCount;
        this.effects.length = effectCount;
        this.say('Travel could not complete. Your fare and progress were kept.');
        return false;
      }
    }
    hubDestinations() {
      if (this.isDungeon() || this.zoneId !== 'crown') return [];
      return D.regions.filter((r) => r.id !== this.zoneId && this.s.zones[r.id]);
    }
    travelHub(regionId) {
      if (this.isDungeon() || this.zoneId !== 'crown') return false;
      const targetIndex = D.regions.findIndex((r) => r.id === regionId);
      if (targetIndex < 0 || !this.hubDestinations().some((r) => r.id === regionId)) return false;
      const before = clone(this.s),
        messageCount = this.messages.length,
        effectCount = this.effects.length,
        [x, y] = D.towns[targetIndex];
      try {
        if (!this.enter(regionId, { x, y })) throw Error('Invalid destination');
        this.event('travel', { from: before.zone, to: this.s.zone, hub: true });
        return true;
      } catch (_) {
        this.s = before;
        this.messages.length = messageCount;
        this.effects.length = effectCount;
        this.say('Travel could not complete. Your progress was kept.');
        return false;
      }
    }

    discover(key) {
      if (key === 'night-site' && !this.night()) return;
      const region = this.definition().id;
      this.s.discovered[region + ':' + key] = true;
      for (const n of this.zone().nodes.filter((n) => n.tribute && !n.hidden && n.site === key))
        this.s.discovered[region + ':tribute:' + n.tributeId] = true;
      this.checkQuests();
    }
    interact(npc) {
      if (!npc || dist(npc, this.hero) > 115) return false;
      switch (npc.kind) {
        case 'cage':
          if (
            (npc.lore || npc.context) &&
            !this.s.keys[npc.family] &&
            !this.s.rescued[npc.family] &&
            !this.peace
          ) {
            this.say(
              npc.lore ||
                npc.context +
                  ' Defeat ' +
                  this.boss(npc.family).name +
                  ' to free ' +
                  npc.name +
                  '.',
            );
            return false;
          }
          return this.rescue(npc.family);
        case 'rest':
          return this.rest();
        case 'mini':
          this.checkMinis();
          this.say(this.miniStatus(npc.mini));
          return true;
        case 'bundle':
          this.checkMinis();
          if (
            this.supplyRoom() &&
            !this.peace &&
            (this.zone().enemies.some((e) => e.guard && e.hp > 0) ||
              Object.values(this.s.pending).some(
                (p) => p.kind === 'mob' && p.zone === this.s.zone && p.base.guard,
              ))
          ) {
            this.say('Clear the Treasury guards before recovering the caches.');
            return false;
          }
          if (npc.mini && !this.peace && !this.miniCleared(npc.mini)) {
            this.say(this.miniStatus(npc.mini));
            return false;
          }
          if (this.bundleCollected(npc)) return false;
          this.s.discovered[this.definition().id + ':bundle-' + npc.index] = true;
          this.say(npc.name + ' recovered.');
          this.event('supplies');
          this.checkQuests();
          return true;
        case 'resource':
          return this.gather(npc.id);
        case 'landmark':
          this.discover(npc.id);
          this.say(this.siteDescription(npc));
          return true;
        case 'exit': {
          const room = this.supplyRoom(),
            side = this.sideDungeon();
          if (side) {
            const entrance = this.s.zones[side.region]?.npcs.find(
              (n) => n.family === side.id || n.id === side.site,
            );
            return this.enter(side.region, entrance && { x: entrance.x + 45, y: entrance.y + 35 });
          }
          if (!room) return this.enter(this.definition().id);
          const entrance = this.s.zones[room.region]?.npcs.find((n) => n.id === 'supply-entrance');
          return this.enter(room.region, entrance && { x: entrance.x + 35, y: entrance.y + 40 });
        }
        case 'dungeon':
          if (npc.sideDungeon) this.discover(npc.id);
          return this.enter(npc.family);
        case 'fountain':
          if (this.refugeThreat()) {
            this.say('Cannot use the preparation fountain during nearby combat.');
            return false;
          }
          if (
            this.s.fountains[this.s.zone] ||
            this.zone().enemies.some((e) => e.guard && e.hp > 0) ||
            Object.values(this.s.pending).some(
              (p) => p.kind === 'mob' && p.zone === this.s.zone && p.base.guard,
            )
          )
            return false;
          this.s.fountains[this.s.zone] = true;
          this.hero.hp = Math.min(this.hero.maxHp, this.hero.hp + 0.6 * this.hero.maxHp);
          this.hero.mp = Math.min(this.hero.maxMp, this.hero.mp + 0.6 * this.hero.maxMp);
          this.activeParty().forEach((u) => {
            if (u.hp > 0) u.hp = Math.min(u.maxHp, u.hp + 0.6 * u.maxHp);
          });
          return true;
        default:
          return false;
      }
    }
    questId(i) {
      return 'quest-' + i;
    }
    questDefs() {
      const onboarding = {
        id: 'quest-barracks',
        region: 'vale',
        name: 'Build your first Barracks',
        objective:
          'Build your first Barracks in the field. A barracks gives companions a nearby recovery base and reduces long return trips. While out in the field, open the Adventure menu (Esc/Menu) and choose Establish Basic Barracks — your first one is free.',
        gold: 0,
        xp: 0,
        index: -1,
        kind: 'barracks',
        target: 1,
        tutorial: true,
      };
      return [
        onboarding,
        ...D.quests.map((q, i) => {
          const rule = R.quests[i],
            room = rule.kind === 'bundles' ? R.supplyRooms.find((r) => r.region === q[0]) : null;
          return {
            id: this.questId(i),
            region: q[0],
            name: q[1],
            objective: q[2],
            gold: q[3],
            xp: q[4],
            index: i % 6,
            ...rule,
            target: room ? room.count : rule.target,
            objective:
              (room ? room.objective : q[2]) +
              (rule.clear ? ' and clear the field dungeon guardians' : ''),
          };
        }),
      ];
    }
    initializeQuests() {
      for (const q of this.questDefs()) {
        if (!this.s.quests[q.id]) {
          const alreadyBuilt = q.kind === 'barracks' && this.hasCompletedBarracks();
          this.s.quests[q.id] = {
            active: !alreadyBuilt,
            count: alreadyBuilt ? 1 : 0,
            done: alreadyBuilt,
            paid: alreadyBuilt,
          };
        }
        const p = this.s.quests[q.id];
        if (!p.closedByPeace && !p.paid) p.active = true;
      }
    }
    accept(id) {
      const q = this.questDefs().find((q) => q.id === id);
      if (!q) return false;
      this.initializeQuests();
      this.checkQuests();
      return true;
    }

    checkQuests() {
      this.initializeQuests();
      for (const q of this.questDefs()) {
        const p = this.s.quests[q.id];
        if (p.closedByPeace) continue;
        if (!p.done) {
          const seen = (id) => this.s.discovered[q.region + ':' + id];
          p.done =
            q.kind === 'barracks'
              ? this.hasCompletedBarracks()
              : q.kind === 'rescue'
                ? !!this.s.rescued[q.target] && (!q.clear || this.miniCleared(q.clear, q.region))
                : q.kind === 'patrol'
                  ? p.count >= q.target
                  : q.kind === 'bundles'
                    ? Array.from({ length: q.target }, (_, j) => j).every((j) =>
                        seen('bundle-' + j),
                      )
                    : q.kind === 'escort'
                      ? !!seen('escort')
                      : q.kind === 'night'
                        ? p.count >= q.target && q.sites.every(seen)
                        : q.kind === 'sites'
                          ? q.sites.every(seen) &&
                            (!q.requiresRescues ||
                              q.requiresRescues.every((id) => this.s.rescued[id]))
                          : false;
        }
        if (p.done) this.payQuest(q, p);
      }
    }
    claim(id) {
      const q = this.questDefs().find((q) => q.id === id),
        p = this.s.quests[id];
      return this.payQuest(q, p);
    }

    engage(e, forced = true) {
      if (e.aggro || e.neutral) return false;
      if ((this.s.mercyTime || 0) > 0 && !forced && !e.mercyProvoked) return false;
      e.aggro = true;
      e.frozen = true;
      delete e.idleWanderTarget;
      e.idleWanderWait = 0;
      const m = e.eliteNightBonus || this.multipliers(),
        ratio = e.hp / e.maxHp;
      e.maxHp = e.baseHp * m.hp;
      e.hp = e.maxHp * ratio;
      e.damage = e.baseDamage * m.damage;
      e.fightStart = this.s.time;
      e.heroParticipated = false;
      e.noProgress = 0;
      if (e.type === 'boss' && e.form === 'true') {
        const first = !e.trueEntourageSpawned;
        e.trueEntourageSpawned = true;
        this.summonBossAdds(e, this.trueSummonPlan(e), this.bossSummonCap(e));
        if (first) this.say(e.name + ' calls a TRUE warband.');
      }
      for (const ally of this.zone().enemies)
        if (ally.pack && ally.pack === e.pack && ally.hp > 0 && !ally.aggro)
          this.engage(ally, false);
    }

    die() {
      this.clearTonic();
      this.hero.supportEffects = [];
      for (const u of this.s.party) u.supportEffects = [];
      const goldLost = this.applyDeathPenalty();
      this.s.statistics.deaths++;
      this.s.streak = { key: null, count: 0 };
      this.s.projectiles = [];
      this.s.hazards = [];
      this.event('death', { goldLost });
      if (goldLost) this.say('Defeat penalty: lost ' + goldLost + ' crowns.');
      if (this.s.lastEdge) this.s.recovery[this.s.lastEdge] = true;
      for (const z of Object.values(this.s.zones))
        for (const e of z.enemies) {
          e.telegraph = null;
          e.sequence = [];
          e.motion = null;
          e.rangedAim = null;
          e.aggro = false;
        }
      if (this.s.challenge.succession) {
        const challenge = this.s.challenge;
        if (!challenge.fallen.includes(this.hero.class)) challenge.fallen.push(this.hero.class);
        this.hero.hp = 0;
        challenge.pending = true;
        const remaining = Object.keys(classes).filter((id) => !challenge.fallen.includes(id));
        if (!remaining.length) {
          challenge.pending = false;
          challenge.gameOver = true;
          this.say('Your last successor has fallen. Game over.');
          this.event('gameOver');
        } else if (remaining.length === 1) this.successor(remaining[0]);
        else
          this.say(
            'Choose a successor from the remaining classes. Crowns and world progress are preserved.',
          );
        return;
      }
      this.hero.hp = this.hero.maxHp;
      this.hero.mp = this.hero.maxMp;
      this.hero.tonic = false;
      this.hero.immune = 0;
      this.hero.slow = 0;
      this.hero.haste = 0;
      const refuge = clone(this.s.refugeSite || { zone: this.s.refuge, id: 'rest' });
      this.enter(refuge.zone);
      this.arriveRefuge(refuge);
      this.say('Returned to your refuge. Learning and rescue progress are safe.');
    }
    successor(heroClass) {
      if (
        !this.s.challenge.succession ||
        !this.s.challenge.pending ||
        this.s.challenge.fallen.includes(heroClass) ||
        !classes[heroClass]
      )
        return false;
      const old = this.hero,
        fresh = new Campaign(this.s.mode, heroClass, this.random, { succession: true }).hero;
      for (const key of ['gold', 'weapon', 'armorTier', 'reforges', 'potions'])
        fresh[key] = clone(old[key]);
      for (const key of [
        'legacyWeaponPower',
        'legacyWeaponName',
        'legacyPotions',
        'legacyEquipped',
      ])
        if (old[key] !== undefined) fresh[key] = clone(old[key]);
      this.s.hero = fresh;
      this.resetBasicCombo();
      this.syncCompanionLevelStats();
      this.s.challenge.pending = false;
      this.s.refuge = 'vale';
      this.s.refugeSite = { zone: 'vale', id: 'rest', x: 300, y: 350 };
      this.s.party.forEach((u) => {
        u.cd = 1;
        u.order = null;
      });
      this.enter('vale');
      this.event('successor', { class: heroClass });
      this.say(
        'Your ' + heroClass + ' successor begins at level 1. The world remembers your progress.',
      );
      return true;
    }

    victory(family, form) {
      const key = family + ':' + form;
      if (this.s.victories[key]) return false;
      this.s.victories[key] = true;
      if (form === 'normal') this.s.normal[family] = true;
      else this.s.true[family] = true;
      if (form === 'true' && this.s.phase === 'awakening' && dungeonIds.includes(family))
        this.s.late[family] = true;
      return true;
    }
    kill(e) {
      if (e.deathPaid) return;
      const victoryLevel = this.hero.level;
      e.deathPaid = true;
      e.aggro = false;
      e.telegraph = null;
      e.motion = null;
      e.rangedAim = null;
      e.sequence = [];
      if (e.summon) {
        return;
      }
      this.s.statistics.kills++;
      this.awardEnemyReward(e);
      for (const q of this.questDefs().filter((q) => q.region === this.definition().id)) {
        const p = this.s.quests[q.id];
        if (
          p &&
          !p.closedByPeace &&
          !p.done &&
          ((q.kind === 'patrol' && e.type === 'mob' && !e.guard && !this.isDungeon()) ||
            (q.kind === 'night' && e.species === 'wraith' && e.nightOnly && this.night()))
        )
          p.count++;
      }
      this.checkQuests();
      if ((e.captain || e.roomCaptain) && !e.summon)
        this.zone().enemies.forEach((a) => {
          if (a.summon && a.owner === e.id) a.hp = 0;
        });
      if (e.type === 'boss') {
        const b = this.boss(e.family);
        this.victory(e.family, e.form);
        this.s.statistics.bossSeconds[e.family + ':' + e.form] = Math.round(
          this.s.time - (e.fightStart || this.s.time),
        );
        if (e.form === 'normal') this.s.keys[e.family] = true;
        if (b.kind === 'dungeon') {
          if (e.form === 'normal' && !(e.family in this.s.earlyRoll)) {
            this.s.earlyRoll[e.family] = this.random() < 1 / 3;
            if (this.s.earlyRoll[e.family] || this.s.phase === 'awakening')
              this.s.pending[e.family] = { kind: 'dungeon', count: 1 };
          }
          if (e.form === 'true') delete this.s.pending[e.family];
        } else if (e.family === 'darklord' && e.form === 'true') {
          delete this.s.pending.darklord;
          this.awaken(victoryLevel);
        }
        this.zone().enemies.forEach((a) => {
          if (a.summon && a.owner === e.id) a.hp = 0;
        });
        this.say(e.name + ' defeated.');
        this.event('bossDefeat', { family: e.family, form: e.form });
      }
      if (e.captain || e.roomCaptain) this.s.streak = { key: null, count: 0 };
      else if (e.heroParticipated) {
        if (
          e.type === 'boss' &&
          e.form === 'normal' &&
          (this.boss(e.family)?.kind === 'field' || e.family === 'darklord')
        )
          this.fieldBossStreak(e);
        else this.streak(e);
      }
      if (
        !this.peace &&
        e.type === 'boss' &&
        this.boss(e.family).kind === 'field' &&
        e.form === 'normal'
      )
        e.respawn = 120;
      else if (
        !this.peace &&
        e.type === 'boss' &&
        this.boss(e.family).kind === 'field' &&
        e.family !== 'darklord' &&
        e.form === 'true'
      )
        e.respawn = 120;
      if (e.type === 'boss' && this.boss(e.family).kind === 'field') {
        for (const other of this.zone().enemies)
          if (other !== e && other.family === e.family) other.respawn = 0;
        if (e.form === 'true') delete this.s.pending[e.family];
        else if (this.s.pending[e.family]) e.respawn = 0;
      }
      this.checkClear();
      this.checkMinis();
      this.checkEnding();
    }
    fieldBossStreak(e) {
      if (
        this.peace ||
        e.type !== 'boss' ||
        e.form !== 'normal' ||
        (this.boss(e.family)?.kind !== 'field' && e.family !== 'darklord')
      )
        return;
      const key = e.family,
        required = key === 'darklord' ? 1 : 2,
        current = this.s.fieldBossKills?.[key] || 0,
        count = Math.min(required, current + 1);
      this.s.fieldBossKills = this.s.fieldBossKills || {};
      this.s.fieldBossKills[key] = count;
      if (count < required || this.s.true[key] || this.s.pending[key]) return;
      this.s.pending[key] = {
        kind: 'field',
        count: 1,
        zone: this.s.zone,
        base: clone(e),
        delay: 5,
      };
      this.event('eliteWarning', { family: key });
      this.say(this.boss(key).name + ' has revealed its TRUE presence.');
      this.notice(this.boss(key).name + ' TRUE will emerge in 5 seconds', 5.5);
    }
    streak(e) {
      if (this.peace || e.summon || e.type === 'boss' || e.captain || e.roomCaptain) {
        this.s.streak = { key: null, count: 0 };
        return;
      }
      if (e.form !== 'normal') {
        this.s.streak = { key: null, count: 0 };
        return;
      }
      const key = e.family || e.species;
      if (this.s.streak.key !== key) this.s.streak = { key, count: 1 };
      else this.s.streak.count++;
      if (this.s.streak.count < 2) return;
      this.s.streak = { key: null, count: 0 };
      if (this.s.pending[key]) return;
      if (e.type === 'boss' && this.boss(e.family).kind !== 'field') return;
      if (e.family === 'darklord' && this.s.true.darklord) return;
      this.s.pending[key] = {
        kind: e.type === 'boss' ? 'field' : 'mob',
        count: e.type === 'boss' ? 1 : this.random() < 0.5 ? 2 : 1,
        zone: this.s.zone,
        base: clone(e),
        delay: e.type === 'boss' ? 5 : 2,
        ...(e.nightOnly ? { nightBonus: this.multipliers() } : {}),
      };
      this.event('eliteWarning', { family: key });
    }
    returnGuardians(id) {
      const z = this.zone();
      if (z.awakenedGuardWave === this.s.awakeningLevel) return;
      z.awakenedGuardWave = this.s.awakeningLevel;
      z.enemies = z.enemies.filter((e) => !e.guard && !e.summon);
      for (const [key, p] of Object.entries(this.s.pending))
        if (p.kind === 'mob' && p.zone === id && p.base.guard) delete this.s.pending[key];
      const i = this.regionIndex(),
        aw = R.awakenedGuardianScaling,
        count = this.dungeonGuardCount(id);
      for (let j = 0; j < count; j++) {
        const g = this.dungeonGuardBlueprint(id, j),
          sp = g.sp,
          p = this.safe(g.x, g.y, id),
          e = this.makeEnemy(
            {
              species: sp[0],
              name: 'Awakened ' + g.name,
              icon: sp[2],
              level: this.s.awakeningLevel,
              hp: Math.round((120 + 35 * this.s.awakeningLevel) * aw.hp),
              damage: Math.round((12 + this.s.awakeningLevel) * aw.damage),
              gold: 0,
              xp: 0,
            },
            p,
          );
        e.guard = true;
        e.awakenedGuard = true;
        e.pack = id + '-awakened-' + g.pack;
        if (g.role) e.forcedRole = g.role;
        this.configureEnemy(e, j);
        z.enemies.push(e);
      }
      z.guardianBalanceVersion = 0;
      this.guardianPopulation(z);
      z.guardRewardsVersion = 0;
      this.guardianRewards(z);
      this.say('The guardians have returned at level ' + this.s.awakeningLevel + '.');
    }
    activatePending() {
      if (this.peace) return;
      const p = this.s.pending[this.s.zone];
      if (this.isDungeon() && p && !this.s.true[this.s.zone]) {
        if (this.s.phase === 'awakening' && !this.s.awakeningLevel)
          this.s.awakeningLevel = this.hero.level + 2;
        let e = this.zone().enemies.find((e) => e.type === 'boss' && e.form === 'true' && e.hp > 0);
        if (!e) {
          e = this.bossEnemy(this.boss(this.s.zone), 'true', { x: 1160, y: 1110 });
          this.zone().enemies.push(e);
        }
        if (this.s.phase === 'awakening') {
          e.level = this.s.awakeningLevel;
          if (e.awakeningStatsLevel !== e.level) {
            const def = this.bossEnemy(this.boss(this.s.zone), 'true', e.home),
              fraction = e.hp / e.maxHp,
              hpMultiplier = e.maxHp / e.baseHp,
              damageMultiplier = e.damage / e.baseDamage;
            e.baseHp = def.baseHp;
            e.maxHp = def.baseHp * hpMultiplier;
            e.hp = e.maxHp * fraction;
            e.baseDamage = def.baseDamage;
            e.damage = def.baseDamage * damageMultiplier;
            e.awakeningStatsLevel = e.level;
          }
          this.returnGuardians(this.s.zone);
        }
        p.active = true;
        this.s.origins[this.s.zone] = this.s.phase === 'adventure' ? 'early' : 'awakening';
        this.say(this.boss(this.s.zone).name + ' TRUE waits in the chamber.');
      }
    }
    awaken(victoryLevel = this.hero.level) {
      if (this.s.phase === 'peace') return;
      this.s.awakeningLevel = this.s.awakeningLevel || victoryLevel + 2;
      this.s.phase = 'awakening';
      this.s.awakeningAck = false;
      this.s.streak = { key: null, count: 0 };
      for (const z of Object.values(this.s.zones))
        for (const e of z.enemies) if (e.family === 'darklord') e.hp = 0;
      for (const id of dungeonIds) {
        if (this.s.true[id]) continue;
        if (this.s.normal[id]) this.s.pending[id] = { kind: 'dungeon', count: 1 };
        const z = this.s.zones[id];
        if (z)
          for (const e of z.enemies)
            if (e.form === 'true' && e.hp > 0) {
              const upgraded = this.bossEnemy(this.boss(id), 'true', e.home);
              upgraded.id = e.id;
              Object.assign(e, upgraded);
            }
      }
      this.say(
        'The TRUE Dark Lord is gone forever. Returning dungeon bosses and guardians are fixed at level ' +
          this.s.awakeningLevel +
          '.',
      );
      this.notice('AWAKENING · The five TRUE dungeon guardians have risen', 6.5);
      this.event('awakening', { level: this.s.awakeningLevel });
      this.checkEnding();
    }
    checkClear() {
      if (!this.isDungeon()) return;
      const z = this.zone(),
        id = this.s.zone;
      if (
        !this.s.paid['clear:' + id] &&
        this.s.normal[id] &&
        !z.enemies.some((e) => e.guard && e.hp > 0) &&
        !Object.values(this.s.pending).some(
          (p) => p.kind === 'mob' && p.zone === id && p.base.guard,
        )
      ) {
        this.s.paid['clear:' + id] = true;
        this.grant(this.dungeonClearReward(id), 0);
        this.say('Dungeon first clear reward earned.');
      }
    }
    checkEnding() {
      if (this.s.true.darklord && dungeonIds.every((id) => this.s.true[id])) {
        if (this.peace) return;
        this.s.phase = 'peace';
        this.s.endingAck = false;
        this.s.streak = { key: null, count: 0 };
        this.s.pending = {};
        this.s.projectiles = [];
        this.s.hazards = [];
        this.hero.order = null;
        this.s.party.forEach((u) => (u.order = null));
        if (this.s.mode === 'nightmare') this.s.clock = 360;
        for (const z of Object.values(this.s.zones)) this.makeHabitat(z);
        for (const q of this.questDefs()) {
          const p = this.s.quests[q.id];
          if (
            p &&
            !p.done &&
            (['patrol', 'night', 'escort'].includes(q.kind) ||
              (q.clear && !this.miniCleared(q.clear, q.region)))
          ) {
            p.closedByPeace = true;
            p.active = false;
          }
        }
        this.say('The war is over for people and creatures alike. Nightmare Mode is unlocked.');
        this.event('peace');
      }
    }
    makeHabitat(z) {
      if (z.habitat) return;
      z.habitat = true;
      z.enemies = [];
      if (this.supplyRoom(z.id)) return;
      const i = this.regionIndex(z.id),
        side = this.sideDungeon(z.id),
        dungeon = dungeonIds.includes(z.id),
        count = side ? 5 : dungeon ? 4 : [8, 10, 12, 14, 16][i];
      for (let j = 0; j < count; j++) {
        const sp = D.species[i][Math.floor(j / 2) % 2],
          size = side ? side.size || 1100 : dungeon ? 1500 : D.regions[i].size,
          p = this.safe(
            350 + ((Math.floor(j / 2) * 337) % (size - 600)) + (j % 2) * 55,
            400 + ((Math.floor(j / 2) * 277) % (size - 650)),
            z.id,
          );
        const e = this.makeEnemy(
          {
            species: sp[0],
            name: sp[1] + ' resident',
            icon: sp[2],
            level: 1,
            hp: 1,
            damage: 0,
            gold: 0,
            xp: 0,
          },
          p,
        );
        e.neutral = true;
        z.enemies.push(e);
      }
      if (!dungeon && !side) {
        const b = D.bosses.find((b) => b.region === z.id && b.kind === 'field');
        if (b) {
          const p = this.fieldCenter(i),
            e = this.bossEnemy(b, 'normal', p);
          e.neutral = true;
          z.enemies.push(e);
        }
      }
    }
    tick(dt, input = { x: 0, y: 0 }) {
      if (
        !Number.isFinite(dt) ||
        dt <= 0 ||
        this.s.challenge?.pending ||
        this.s.challenge?.gameOver
      )
        return;
      dt = Math.min(dt, 0.1);
      this.s.time += dt;
      this.s.mercyTime = Math.max(0, (this.s.mercyTime || 0) - dt);
      if (this.s.mercyTime < 1e-9) this.s.mercyTime = 0;
      this.s.restCooldown = Math.max(0, (this.s.restCooldown || 0) - dt);
      if (this.peace || this.s.mode === 'normal') this.s.clock = (this.s.clock + dt) % 600;
      const h = this.hero,
        z = this.zone(),
        formationStart = { x: h.x, y: h.y };
      z.clock += dt;
      h.cd = h.cd.map((c) => Math.max(0, c - dt));
      for (const f of ['immune', 'haste', 'potionCd', 'slow']) h[f] = Math.max(0, h[f] - dt);
      for (const u of this.s.party) {
        u.healCd = Math.max(0, (u.healCd || 0) - dt);
        u.manaCd = Math.max(0, (u.manaCd || 0) - dt);
        u.survivalCd = Math.max(0, (u.survivalCd || 0) - dt);
        u.immune = Math.max(0, (u.immune || 0) - dt);
      }
      this.syncCompanionLevelStats();
      if (input.x || input.y) {
        h.order = null;
        const n = Math.hypot(input.x, input.y),
          speed =
            (h.speed + this.heroTalentSpeedBonus()) *
            (h.haste > 0 ? 1.25 : 1) *
            (h.slow > 0 ? 0.65 : 1) *
            clamp(input.speedFactor || 1, 1, 1.35);
        this.move(h, { x: h.x + (input.x / n) * speed, y: h.y + (input.y / n) * speed }, speed, dt);
      } else if (h.order) {
        const target =
          h.order.type === 'attack' ? z.enemies.find((e) => e.id === h.order.id) : h.order;
        if (target && !target.neutral) {
          if (
            dist(h, target) > (h.order.type === 'attack' ? (h.class === 'paladin' ? 105 : 350) : 25)
          )
            this.follow(
              h,
              target,
              (h.speed + this.heroTalentSpeedBonus()) * (h.slow > 0 ? 0.65 : 1),
              dt,
              20,
            );
          else if (h.order.type === 'attack') this.cast(1, target.id);
          else h.order = null;
        } else h.order = null;
      }
      const formationDx = h.x - formationStart.x,
        formationDy = h.y - formationStart.y,
        formationDistance = Math.hypot(formationDx, formationDy);
      if (formationDistance > 0.5)
        this.formationHeading = {
          x: formationDx / formationDistance,
          y: formationDy / formationDistance,
        };
      if (this.s.mercyTime > 0) {
        const [mx, my] = D.towns[0];
        if (this.s.zone !== 'vale' || dist(h, { x: mx, y: my }) > mercyStartRadius)
          this.s.mercyTime = 0;
      }
      if (!this.isDungeon()) {
        const [tx, ty] = D.towns[this.regionIndex()];
        if (dist(h, { x: tx, y: ty }) < 170) {
          this.setRefuge(this.s.zone, 'rest');
          if (!this.refugeThreat()) h.hp = Math.min(h.maxHp, h.hp + 8 * dt);
        }
        for (const n of z.npcs.filter((n) => n.kind === 'landmark' || n.sideDungeon))
          if (dist(h, n) < 120) {
            const first = !this.s.discovered[this.definition().id + ':' + n.id];
            this.discover(n.id);
            if (first) this.say(this.siteDescription(n));
          }
        const [px, py] = D.ports[this.regionIndex()];
        if (dist(h, { x: px, y: py }) < 140) this.discover('port');
        const minor = D.minors[this.regionIndex()];
        if (dist(h, { x: minor[0], y: minor[1] }) < 180) {
          this.discover('minor');
          this.setRefuge(this.s.zone, 'minor');
        }
      }
      this.updateParty(dt);
      this.updateEnemies(dt);
      if (
        h !== this.hero ||
        z !== this.zone() ||
        this.s.challenge.pending ||
        this.s.challenge.gameOver
      )
        return;
      this.updateProjectiles(dt);
      if (
        h !== this.hero ||
        z !== this.zone() ||
        this.s.challenge.pending ||
        this.s.challenge.gameOver
      )
        return;
      this.updateElites(dt);
      this.updatePacks(dt);
      this.updateGuardianReinforcements(dt);
      this.updateTraps(dt);
      if (
        h !== this.hero ||
        z !== this.zone() ||
        this.s.challenge.pending ||
        this.s.challenge.gameOver
      )
        return;
      this.updateRangerSupport(dt);
      this.autoRangerSupport();
      h.mp = Math.min(h.maxMp, h.mp + this.manaRegenRate() * dt);
      this.updateNight();
      this.updateEscort(dt);
      this.checkClear();
      this.checkMinis();
      for (const l of [...this.s.loot])
        if (l.zone === this.s.zone && dist(l, h) < 65) {
          this.grant(l.gold, 0);
          this.s.loot.splice(this.s.loot.indexOf(l), 1);
          this.event('gold');
        }
    }

    captainProfile(e) {
      return e?.captainProfile && (e.captain || e.roomCaptain)
        ? R.roomCaptains?.[e.captainProfile]
        : null;
    }
    updateCaptainPatrol(e, dt) {
      if (!e?.fieldCaptain || e.aggro || e.returning) return false;
      const profile = this.captainProfile(e),
        patrol = profile?.patrol || [];
      if (!patrol.length) return false;
      e.captainPatrolWait = Math.max(0, (e.captainPatrolWait || 0) - dt);
      if (e.captainPatrolWait > 0) return true;
      const index = (e.captainPatrolIndex || 0) % patrol.length,
        [x, y] = patrol[index],
        target = { x, y };
      if (dist(e, target) < 30) {
        e.home = { x: e.x, y: e.y };
        e.captainPatrolIndex = (index + 1) % patrol.length;
        e.captainPatrolWait = profile.inspectionPause || 2.4;
        return true;
      }
      if (!this.follow(e, target, profile.patrolSpeed || 82, dt, 20)) {
        e.captainPatrolIndex = (index + 1) % patrol.length;
        e.captainPatrolWait = 0.5;
      }
      return true;
    }
    idleWanderProfile(e) {
      if (e?.fieldCaptain) return null;
      if (e?.type === 'boss') return R.idleWander.boss;
      if (e?.captain || e?.roomCaptain) return R.idleWander.captain;
      if (e?.form === 'ringleader') return R.idleWander.ringleader;
      if (e?.nightOnly) return R.idleWander.night;
      if (e?.summon) return R.idleWander.summon;
      if (e?.guard) return R.idleWander.guardian;
      if (e?.ranged) return R.idleWander.ranged;
      return R.idleWander.ordinary;
    }
    updateIdleWander(e, dt) {
      if (!e || e.aggro || e.returning || e.neutral || e.hp <= 0 || e.fieldCaptain) return false;
      const cfg = this.idleWanderProfile(e);
      if (!cfg || !e.home) return false;
      e.idleWanderWait = Math.max(
        0,
        (e.idleWanderWait ?? ((Number(e.id?.split('-').at(-1)) || 1) % 5) * 0.55 + 1.2) - dt,
      );
      if (e.idleWanderTarget) {
        if (dist(e, e.idleWanderTarget) < 8) {
          delete e.idleWanderTarget;
          e.idleWanderWait = cfg.minPause + this.random() * (cfg.maxPause - cfg.minPause);
          return true;
        }
        if (!this.follow(e, e.idleWanderTarget, cfg.speed, dt, 4)) {
          delete e.idleWanderTarget;
          e.idleWanderWait = 0.8;
        }
        return true;
      }
      if (e.idleWanderWait > 0) return true;
      for (let n = 0; n < 8; n++) {
        const angle = this.random() * Math.PI * 2,
          radius = cfg.radius * (0.35 + this.random() * 0.65),
          candidate = {
            x: e.home.x + Math.cos(angle) * radius,
            y: e.home.y + Math.sin(angle) * radius,
          };
        if (
          this.blocked(candidate.x, candidate.y, this.s.zone, 12) ||
          !this.clearSegment(e, candidate, 12)
        )
          continue;
        e.idleWanderTarget = candidate;
        return true;
      }
      e.idleWanderWait = 1.2;
      return true;
    }
    triggerCaptainPhase(e) {
      const profile = this.captainProfile(e),
        phase = profile?.phase;
      if (!phase || e.captainPhase || e.hp > e.maxHp * phase.threshold) return false;
      e.captainPhase = true;
      e.captainPhaseMove = 1;
      e.captainAttackRate = 1;
      if (phase.kind === 'scramble') {
        e.captainPhaseMove = 1.28;
        e.captainAttackRate = 0.8;
        e.pursuitBurst = Math.max(e.pursuitBurst || 0, 2.4);
        e.cd = Math.min(e.cd, 0.15);
        e.specialCd = 0;
      } else if (phase.kind === 'molt') {
        e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.12);
        e.captainPhaseMove = 1.12;
        e.specialCd = 0;
      } else if (phase.kind === 'howl') {
        e.captainPhaseMove = 1.22;
        e.captainAttackRate = 0.75;
        e.cd = Math.min(e.cd, 0.15);
        e.specialCd = 0;
      } else if (phase.kind === 'carapace') {
        e.captainGuard = 6;
        e.captainAttackRate = 0.85;
        e.specialCd = 0;
        if (profile.summon) this.summonCaptainAdds(e, profile.summon);
      } else if (phase.kind === 'overtime') {
        e.captainPhaseMove = 1.15;
        e.captainAttackRate = 0.8;
        e.specialCd = 0;
        const candidates = this.zone()
            .enemies.filter(
              (u) =>
                u !== e &&
                u.hp > 0 &&
                !u.neutral &&
                !u.captain &&
                !u.roomCaptain &&
                !u.summon &&
                u.type === 'mob' &&
                dist(u, e) < 900,
            )
            .sort((a, b) => dist(a, e) - dist(b, e)),
          workers =
            candidates.length <= 7
              ? candidates
              : [...candidates.slice(0, 3), ...candidates.slice(-4)];
        for (const u of workers) {
          u.quotaOvertime = Math.max(u.quotaOvertime || 0, 9);
          u.quotaTarget = { x: this.hero.x, y: this.hero.y };
          u.pursuitBurst = Math.max(u.pursuitBurst || 0, 4);
          u.cd = Math.min(u.cd || 0, 0.2);
          this.engage(u);
        }
      }
      this.say(e.name + ' uses ' + phase.name + '.');
      this.event('captainPhase', { profile: e.captainProfile, name: phase.name });
      return true;
    }
    captainOwnedSummons(e) {
      return this.zone().enemies.filter((u) => u.summon && u.owner === e.id && u.hp > 0);
    }
    summonCaptainAdds(e, plan = this.captainProfile(e)?.summon) {
      if (!e || !plan) return 0;
      const z = this.zone(),
        cap = plan.cap || 3,
        live = this.captainOwnedSummons(e);
      if (live.length >= cap) return 0;
      const composition = (plan.composition || Array(cap).fill('melee')).slice(0, cap),
        missing = [...composition],
        sc = R.summonScaling[this.regionIndex()],
        baseHp = Math.round((40 + e.level * 15) * sc.hp),
        baseDamage = Math.round((5 + e.level) * sc.damage),
        spawnPoint = (slot) => {
          for (let n = 0; n < 30; n++) {
            const a = ((slot + n) * Math.PI) / 3,
              r = 105 + Math.floor(n / 6) * 45,
              p = { x: e.x + Math.cos(a) * r, y: e.y + Math.sin(a) * r };
            if (
              this.blocked(p.x, p.y, this.s.zone, 12) ||
              dist(p, this.hero) < 70 ||
              z.enemies.some((u) => u !== e && u.hp > 0 && dist(p, u) < 36)
            )
              continue;
            return p;
          }
          return this.safe(e.x + 90, e.y + 90);
        };
      for (const u of live) {
        const role = u.forcedRole === 'ranged' || u.ranged ? 'ranged' : 'melee',
          at = missing.indexOf(role);
        if (at >= 0) missing.splice(at, 1);
      }
      let made = 0;
      for (const role of missing.slice(0, cap - live.length)) {
        const p = spawnPoint(live.length + made),
          ranged = role === 'ranged',
          s = this.makeEnemy(
            {
              species: plan.species || 'ashbeast',
              name: ranged ? 'Cinder broodling' : 'Ash broodling',
              icon: '👻',
              level: e.level,
              hp: baseHp,
              damage: baseDamage,
              gold: 0,
              xp: 0,
            },
            p,
          );
        s.summon = true;
        s.summonBalanceVersion = 1;
        s.owner = e.id;
        s.treasurySummon = true;
        s.pack = e.id + '-brood';
        s.forcedRole = ranged ? 'ranged' : 'melee';
        this.summonCombatProfile(s, { species: plan.species || 'ashbeast', ranged });
        z.enemies.push(s);
        made++;
        if (e.aggro) this.engage(s);
      }
      if (made) {
        e.summonCd = plan.cooldown || 12;
        this.say(
          e.name + ' calls ' + made + ' Ash-beast broodling' + (made === 1 ? '' : 's') + '.',
        );
        this.event('captainSummon', { captain: e.captainProfile, count: made });
      }
      return made;
    }
    startCaptainAttack(e, target) {
      const profile = this.captainProfile(e),
        plans = profile?.attacks || [];
      if (!plans.length) return false;
      const summonCfg = profile.summon,
        owned = this.captainOwnedSummons(e).length,
        eligible = plans
          .map((plan, index) => ({ plan, index }))
          .filter(
            (x) =>
              x.plan.kind !== 'summon' ||
              (summonCfg && owned < (summonCfg.cap || 3) && (e.summonCd || 0) <= 0),
          ),
        available = eligible.filter((x) => x.index !== e.lastCaptainAttack),
        d = dist(e, target),
        weighted = [];
      let chosen = null;
      if (summonCfg?.opening && !e.captainOpeningSummon && owned === 0 && (e.summonCd || 0) <= 0) {
        const opening = eligible.find((x) => x.plan.kind === 'summon');
        if (opening) {
          chosen = opening;
          e.captainOpeningSummon = true;
        }
      }
      if (!chosen) {
        for (const x of available.length ? available : eligible) {
          let weight = 1;
          if (x.plan.kind === 'summon') weight += 1.5 + (summonCfg.cap || 3) - owned;
          if (x.plan.kind === 'cone' && d < 170) weight += 1.4;
          if (x.plan.kind === 'line' && d > 140) weight += 1.2;
          if (x.plan.kind === 'circle' && d > 180) weight += 1;
          weighted.push({ ...x, weight });
        }
        if (!weighted.length) return false;
        let roll = this.random() * weighted.reduce((n, x) => n + x.weight, 0);
        chosen = weighted[0];
        for (const x of weighted) {
          roll -= x.weight;
          if (roll <= 0) {
            chosen = x;
            break;
          }
        }
      }
      const plan = chosen.plan,
        index = chosen.index,
        angle = Math.atan2(target.y - e.y, target.x - e.x),
        center = ['cone', 'sector', 'ring'].includes(plan.kind)
          ? { x: e.x, y: e.y }
          : { x: target.x, y: target.y },
        a = {
          ...plan,
          captainSkill: true,
          index,
          timer: plan.warning,
          total: plan.warning,
          coefficient: plan.coefficient ?? 1,
          fromX: e.x,
          fromY: e.y,
          angle,
          ...center,
          radius: plan.radius || (plan.kind === 'cone' ? 145 : 85),
          sequence: [],
        };
      if (plan.sequential && plan.kind === 'circle') {
        const patches = this.attackPatches(a);
        Object.assign(a, patches[0], { count: 1 });
        a.sequence = patches.slice(1).map((p) => ({
          ...a,
          ...p,
          count: 1,
          timer: plan.warning * 0.72,
          total: plan.warning * 0.72,
          name: plan.name + ' follow-up',
        }));
      }
      e.lastCaptainAttack = index;
      e.sequence = [...(a.sequence || [])];
      delete a.sequence;
      e.telegraph = a;
      e.specialCd = profile.specialCooldown * (e.captainPhase ? 0.82 : 1);
      this.event('warning', { captain: e.captainProfile, index });
      return true;
    }
    startNightSkill(e, target) {
      const cfg = R.nightEnemyCombat[e.species];
      if (!cfg) return false;
      if (e.species === 'wraith') {
        e.telegraph = {
          nightSkill: 'drain',
          kind: 'circle',
          name: 'Soul Drain',
          x: e.x,
          y: e.y,
          radius: cfg.radius,
          coefficient: cfg.coefficient,
          slowDuration: cfg.slow,
          heal: cfg.heal,
          manaDrain: cfg.manaDrain || 0,
          timer: cfg.warning,
          total: cfg.warning,
          recovery: 0.55,
        };
      } else if (e.species === 'stalker') {
        e.telegraph = {
          nightSkill: 'pounce',
          kind: 'circle',
          name: 'Shadow Pounce',
          x: target.x,
          y: target.y,
          radius: cfg.radius,
          coefficient: cfg.coefficient,
          slowDuration: cfg.slow,
          pounceSpeed: cfg.pounceSpeed,
          landing: true,
          timer: cfg.warning,
          total: cfg.warning,
          recovery: 0.6,
        };
      } else return false;
      e.specialCd = cfg.skillCooldown * (e.frenzy ? 0.7 : 1);
      this.event('warning', { family: e.species });
      return true;
    }
    updateEnemies(dt) {
      const z = this.zone(),
        deaths = this.s.statistics.deaths;
      for (const e of [...z.enemies]) {
        if (e.hp <= 0) {
          if (e.respawn > 0 && !this.peace) {
            e.respawn -= dt;
            if (
              e.respawn <= 0 &&
              !this.s.pending[e.family] &&
              !z.enemies.some((a) => a !== e && a.family === e.family && a.hp > 0) &&
              !(e.family === 'darklord' && this.s.true.darklord)
            ) {
              Object.assign(e, this.bossEnemy(this.boss(e.family), 'normal', e.home));
              this.say(this.boss(e.family).name + ' has returned.');
            }
          }
          continue;
        }
        if (e.neutral) {
          const t = this.s.time * 0.1 + Number(e.id.split('-')[1]);
          this.move(e, { x: e.home.x + Math.cos(t) * 35, y: e.home.y + Math.sin(t) * 35 }, 12, dt);
          continue;
        }
        e.slow = Math.max(0, (e.slow || 0) - dt);
        if (!e.aggro && !e.eliteNightBonus) {
          const m = this.multipliers(),
            ratio = e.hp / e.maxHp;
          e.maxHp = e.baseHp * m.hp;
          e.hp = e.maxHp * ratio;
          e.damage = e.baseDamage * m.damage;
        }
        e.cd = Math.max(0, e.cd - dt);
        e.specialCd = Math.max(0, (e.specialCd || 0) - dt);
        e.summonCd = Math.max(0, (e.summonCd || 0) - dt);
        e.pursuitBurst = Math.max(0, (e.pursuitBurst || 0) - dt);
        e.open = Math.max(0, (e.open || 0) - dt);
        e.captainGuard = Math.max(0, (e.captainGuard || 0) - dt);
        e.quotaOvertime = Math.max(0, (e.quotaOvertime || 0) - dt);
        if (!e.quotaOvertime) delete e.quotaTarget;
        if (e.captain || e.roomCaptain) this.triggerCaptainPhase(e);
        if (
          e.form === 'ringleader' &&
          !e.frenzy &&
          e.hp <= e.maxHp * R.ringleaderScaling.frenzyThreshold
        ) {
          e.frenzy = true;
          e.cd = Math.min(e.cd, 0.2);
          e.specialCd *= 0.65;
          if (e.rangedAim) e.rangedAim.timer *= R.ringleaderScaling.frenzyAim;
          this.event('eliteFrenzy', { species: e.species });
        }
        if (
          e.type === 'boss' &&
          e.form === 'true' &&
          e.hp <= e.maxHp * 0.5 &&
          !e.trueHalfSummonWave
        ) {
          e.trueHalfSummonWave = true;
          this.summonBossAdds(e, this.trueSummonPlan(e), this.bossSummonCap(e));
          e.summonCd = Math.max(e.summonCd || 0, R.bossSummoning.trueCooldown * 0.6);
          this.say(e.name + ' reinforces its TRUE warband.');
        }
        if (
          this.s.statistics.deaths !== deaths ||
          this.s.challenge.pending ||
          this.s.challenge.gameOver ||
          z !== this.zone()
        )
          return;
        const candidates = this.combatTargets();
        let target =
          e.quotaOvertime > 0 && this.hero.hp > 0
            ? this.hero
            : e.summon &&
                (e.ranged || e.trueSummonRole === 'captain') &&
                this.hero.hp > 0 &&
                dist(e, this.hero) < 700
              ? this.hero
              : candidates.sort((a, b) => dist(e, a) - dist(b, e))[0];
        if (!e.aggro && e.fieldCaptain) this.updateCaptainPatrol(e, dt);
        else if (!e.aggro) this.updateIdleWander(e, dt);
        if (e.guard && !e.ranged && this.hero.hp > 0) {
          const screenFor = z.enemies.find(
            (u) => u !== e && u.guard && u.pack === e.pack && u.ranged && u.hp > 0,
          );
          if (screenFor && dist(this.hero, screenFor) < R.rangedEnemyCombat.guardianScreenRange)
            target = this.hero;
        }
        if (
          !e.aggro &&
          this.line(e, target) &&
          dist(e, target) < 260 &&
          (!this.isDungeon() &&
          dist(target, { x: D.towns[this.regionIndex()][0], y: D.towns[this.regionIndex()][1] }) <
            170
            ? false
            : true)
        )
          this.engage(e, false);
        if (!e.aggro) continue;
        const territory =
          e.type === 'boss'
            ? this.isDungeon()
              ? 1800
              : 700
            : e.fieldCaptain
              ? 900
              : e.quotaOvertime > 0
                ? 1300
                : e.summon
                  ? 900
                  : 500;
        if (
          dist(target, e.home) > territory ||
          (!this.isDungeon() &&
            dist(target, { x: D.towns[this.regionIndex()][0], y: D.towns[this.regionIndex()][1] }) <
              160)
        ) {
          this.disengage(e, dt);
          continue;
        }
        if (e.returning) {
          this.disengage(e, dt);
          continue;
        }
        if (e.telegraph) {
          e.telegraph.timer -= dt;
          e.noProgress = 0;
          if (e.telegraph.timer <= 0) {
            const a = e.telegraph;
            this.resolveAttack(e);
            e.telegraph = e.motion ? null : e.sequence?.shift() || null;
            if (e.telegraph) this.event('warning', { family: e.family });
            if (!e.telegraph && !e.motion) {
              e.cd = a.recovery * (e.type === 'boss' ? R.bossCadence.specialRecoveryMultiplier : 1);
              e.basicDue = e.type === 'boss' && e.attackIndex % R.bossCadence.skillsPerBasic === 0;
              if (a.opening)
                e.open = e.form === 'true' && e.family === 'citadel' ? a.opening / 2 : a.opening;
            }
          }
          continue;
        }
        if (e.rangedAim) {
          e.rangedAim.timer -= dt;
          if (e.rangedAim.timer <= 0) {
            const a = e.rangedAim,
              angle = Math.atan2(a.y - e.y, a.x - e.x),
              pace = R.rangedEnemyCombat;
            if (this.line(e, a)) {
              const style = e.projectileStyle || 'arrow';
              this.s.projectiles.push({
                id: 'projectile-' + this.s.nextId++,
                x: e.x,
                y: e.y,
                dx: Math.cos(angle),
                dy: Math.sin(angle),
                speed: (e.shotSpeed || 260) * pace.projectileMultiplier,
                life: 2.5 / pace.projectileMultiplier,
                damage: e.damage * (e.hybrid ? 0.85 : 1),
                style,
                slow: e.projectileSlow || 0,
                manaDrain: R.manaBalance.rangedDrain[e.species] || 0,
                source: 'enemy',
                sourceId: e.id,
                species: e.species,
              });
              this.event('projectileLaunch', {
                actor: 'enemy',
                source: e.id,
                species: e.species,
                family: e.family,
                style,
                x: e.x,
                y: e.y,
              });
            }
            e.rangedAim = null;
            e.cd = pace.cooldown * (e.frenzy ? R.ringleaderScaling.frenzyCooldown : 1);
          }
          e.noProgress = 0;
          continue;
        }
        if (e.motion) {
          this.advanceMotion(e, dt);
          e.noProgress = 0;
          continue;
        }
        const d = dist(e, target),
          hybridMeleeRange =
            e.form === 'ringleader' ? R.rangedEnemyCombat.ringleaderHybridMeleeRange : 65,
          ranged =
            (e.ranged ?? ['archer', 'crownguard'].includes(e.species)) &&
            !(e.hybrid && d <= hybridMeleeRange),
          range = ranged ? e.shotRange || 280 : 65,
          retreatRange = ranged && !e.hybrid ? range * R.rangedEnemyCombat.retreatFraction : 0,
          before = { x: e.x, y: e.y },
          visible = this.line(e, target);
        let opportunity = false;
        if (
          (e.captain || e.roomCaptain) &&
          e.specialCd <= 0 &&
          visible &&
          d < (this.captainProfile(e)?.specialRange || 420) &&
          this.startCaptainAttack(e, target)
        ) {
          opportunity = true;
        } else if (
          e.type === 'boss' &&
          e.cd <= 0 &&
          d < R.bossCadence.specialRange &&
          visible &&
          (!e.basicDue || d > 200)
        ) {
          this.startAttack(e, target);
          opportunity = true;
        } else if (
          e.nightOnly &&
          e.specialCd <= 0 &&
          visible &&
          d < (e.species === 'wraith' ? R.nightEnemyCombat.wraith.radius : 360) &&
          this.startNightSkill(e, target)
        ) {
          opportunity = true;
        } else if (retreatRange && d < retreatRange && visible) {
          const away = {
              x: e.x + ((e.x - target.x) / Math.max(1, d)) * 95,
              y: e.y + ((e.y - target.y) / Math.max(1, d)) * 95,
            },
            speed =
              R.rangedEnemyCombat.retreatSpeed *
              (e.form === 'ringleader' ? R.rangedEnemyCombat.ringleaderRetreatMultiplier : 1) *
              (e.slow > 0 ? 0.5 : 1);
          if (dist(away, e.home) < territory && this.clearSegment(e, away)) {
            this.move(e, away, speed, dt);
            opportunity = true;
          }
        }
        if (!opportunity && d <= range && e.cd <= 0 && this.line(e, target)) {
          e.cd =
            (e.type === 'boss' ? R.bossCadence.basicCooldown : 1.4) *
            (e.frenzy ? R.ringleaderScaling.frenzyCooldown : 1) *
            (e.captainAttackRate || 1) *
            (e.quotaOvertime > 0 ? 0.75 : 1);
          if (ranged) {
            e.rangedAim = {
              x: target.x,
              y: target.y,
              timer:
                R.rangedEnemyCombat.aimTime *
                (e.frenzy ? R.ringleaderScaling.frenzyAim : 1) *
                (e.captainAttackRate || 1) *
                (e.quotaOvertime > 0 ? 0.8 : 1),
            };
          } else {
            if (this.hitParty(target, e.damage))
              this.event('melee', {
                actor: 'enemy',
                source: e.id,
                species: e.species,
                family: e.family,
                boss: e.type === 'boss',
                x: target.x,
                y: target.y,
                target: target === this.hero ? 'hero' : target.id,
              });
            if (e.form === 'ringleader') e.pursuitBurstUsed = false;
          }
          e.basicDue = false;
          opportunity = true;
        }
        if (!opportunity && (d > range || !visible)) {
          if (target === this.hero && visible && d > range && !e.pursuitBurstUsed) {
            e.pursuitBurst = pursuitBurstSeconds;
            e.pursuitBurstUsed = true;
          }
          this.follow(
            e,
            target,
            (e.type === 'boss' ? 145 : 175) *
              (e.form === 'ringleader' ? R.ringleaderScaling.pursuit : 1) *
              (e.captainPhaseMove || 1) *
              (e.quotaOvertime > 0 ? 1.15 : 1) *
              (e.slow > 0 ? 0.5 : 1) *
              (e.pursuitBurst > 0 ? pursuitBurstMultiplier : 1),
            dt,
            visible ? range - 8 : 0,
          );
        }
        const progress = dist(before, e) > Math.max(0.1, dt * 10);
        if (opportunity || progress) e.noProgress = 0;
        else e.noProgress += dt;
        if (e.noProgress >= 12) this.disengage(e, dt);
      }
    }
    disengage(e, dt) {
      if (!e.returning) {
        e.returning = 1;
        e.pursuitBurst = 0;
        this.say(e.name + ' disengages.');
        this.event('reset');
      }
      e.returning -= dt;
      if (e.returning <= 0) {
        Object.assign(e, e.home);
        e.aggro = false;
        e.telegraph = null;
        e.sequence = [];
        e.motion = null;
        e.rangedAim = null;
        e.hp = e.baseHp;
        e.maxHp = e.baseHp;
        e.damage = e.baseDamage;
        e.returning = 0;
        e.heroParticipated = false;
        e.mercyProvoked = false;
        e.noProgress = 0;
        e.pursuitBurstUsed = false;
        e.frozen = false;
        e.frenzy = false;
        e.captainPhase = false;
        e.captainPhaseMove = 1;
        e.captainAttackRate = 1;
        e.captainGuard = 0;
        e.quotaOvertime = 0;
        e.captainOpeningSummon = false;
        delete e.quotaTarget;
        delete e.idleWanderTarget;
        e.idleWanderWait = 1.5;
        e.specialCd = e.captain || e.roomCaptain ? 1.25 : e.nightOnly ? 1.5 : 0;
        e.summonCd = 0;
        if (e.captain || e.roomCaptain)
          this.zone().enemies = this.zone().enemies.filter((u) => !(u.summon && u.owner === e.id));
        if (e.type === 'boss' && e.form === 'true') {
          this.zone().enemies = this.zone().enemies.filter((u) => !(u.summon && u.owner === e.id));
          e.trueEntourageSpawned = false;
          e.trueHalfSummonWave = false;
        }
      }
    }

    fieldTrueSpawnPoint(base) {
      const size = this.definition().size,
        i = this.regionIndex(),
        town = { x: D.towns[i][0], y: D.towns[i][1] },
        minor = { x: D.minors[i][0], y: D.minors[i][1] },
        home = base.home || base,
        hero = this.hero,
        z = this.zone(),
        margin = 260;
      const raw = [
        [0.16, 0.18],
        [0.5, 0.14],
        [0.84, 0.18],
        [0.18, 0.5],
        [0.82, 0.5],
        [0.16, 0.82],
        [0.5, 0.86],
        [0.84, 0.82],
        [0.34, 0.32],
        [0.66, 0.68],
        [0.68, 0.32],
        [0.32, 0.68],
      ]
        .map(([rx, ry]) => ({ x: Math.round(size * rx), y: Math.round(size * ry) }))
        .sort((a, b) => dist(b, home) - dist(a, home));
      for (const candidate of raw) {
        let p;
        try {
          p = this.safe(candidate.x, candidate.y);
        } catch (_) {
          continue;
        }
        if (
          dist(p, home) < Math.max(650, size * 0.24) ||
          dist(p, hero) < 380 ||
          dist(p, town) < 320 ||
          dist(p, minor) < 260
        )
          continue;
        if (
          z.npcs.some((n) => dist(p, n) < 150) ||
          z.enemies.some((e) => e.hp > 0 && !e.neutral && dist(p, e) < 120)
        )
          continue;
        if (p.x < margin || p.y < margin || p.x > size - margin || p.y > size - margin) continue;
        if (!this.route(hero, p).length) continue;
        return p;
      }
      for (let r = Math.max(700, size * 0.28); r <= size * 0.6; r += 140)
        for (let n = 0; n < 16; n++) {
          const a = (n * Math.PI) / 8,
            p0 = { x: home.x + Math.cos(a) * r, y: home.y + Math.sin(a) * r };
          let p;
          try {
            p = this.safe(p0.x, p0.y);
          } catch (_) {
            continue;
          }
          if (
            dist(p, home) < 650 ||
            dist(p, hero) < 380 ||
            dist(p, town) < 320 ||
            dist(p, minor) < 260 ||
            z.npcs.some((npc) => dist(p, npc) < 150) ||
            z.enemies.some((e) => e.hp > 0 && !e.neutral && dist(p, e) < 120)
          )
            continue;
          if (this.route(hero, p).length) return p;
        }
      return null;
    }
    updateElites(dt) {
      for (const [key, p] of Object.entries(this.s.pending)) {
        if (p.kind === 'dungeon' || p.zone !== this.s.zone || p.active) continue;
        p.delay -= dt;
        if (p.delay > 0) continue;
        const points = [];
        if (p.kind === 'field') {
          const point = this.fieldTrueSpawnPoint(p.base);
          if (point) points.push(point);
        } else
          for (let i = 0; i < p.count; i++) {
            let point = null;
            for (let n = 0; n < 24; n++) {
              const a = (n * Math.PI) / 12,
                x = p.base.home.x + Math.cos(a) * (210 + i * 110),
                y = p.base.home.y + Math.sin(a) * (210 + i * 110);
              if (
                !this.blocked(x, y) &&
                dist({ x, y }, this.hero) > 200 &&
                (this.isDungeon() ||
                  [D.towns[this.regionIndex()], D.minors[this.regionIndex()]].every(
                    ([tx, ty]) => dist({ x, y }, { x: tx, y: ty }) > 220,
                  )) &&
                !points.some((q) => dist(q, { x, y }) < 100)
              ) {
                point = { x, y };
                break;
              }
            }
            if (!point) break;
            points.push(point);
          }
        if (points.length !== p.count) continue;
        for (const point of points) {
          const e =
            p.kind === 'field'
              ? this.bossEnemy(this.boss(key), 'true', point)
              : this.makeEnemy(
                  {
                    species: key,
                    name: p.base.name + ' Ringleader',
                    icon: p.base.icon,
                    form: 'ringleader',
                    hp: p.base.baseHp * R.ringleaderScaling.hp,
                    damage: p.base.baseDamage * R.ringleaderScaling.damage,
                    level: p.base.level + 2,
                    ...this.ringleaderRewards(p.base),
                  },
                  point,
                );
          e.eliteKey = key;
          if (e.form === 'ringleader') e.ringleaderHealthVersion = 3;
          if (p.base.guard) e.guard = true;
          if (p.base.mini) {
            e.mini = p.base.mini;
            e.site = p.base.site;
            e.miniRewardVersion = 1;
          }
          for (const f of [
            'ranged',
            'hybrid',
            'shotRange',
            'shotSpeed',
            'projectileStyle',
            'meleeBalanceVersion',
            'guardianBalanceVersion',
            'nightBalanceVersion',
            'reinforcement',
            'awakenedGuard',
            'trueSummon',
            'trueSummonRole',
          ])
            if (p.base[f] !== undefined) e[f] = p.base[f];
          if (p.base.nightOnly) {
            e.nightOnly = true;
            const bonus = p.nightBonus || {
              hp: p.base.maxHp / p.base.baseHp,
              damage: p.base.damage / p.base.baseDamage,
            };
            e.eliteNightBonus = bonus;
            e.maxHp = e.hp = e.baseHp * bonus.hp;
            e.damage = e.baseDamage * bonus.damage;
          }
          this.zone().enemies.push(e);
        }
        p.active = true;
        if (p.kind === 'field') {
          this.say('A TRUE boss has appeared.');
          this.notice(
            this.boss(key).name +
              ' TRUE has appeared elsewhere in ' +
              this.definition().name +
              ' · Map: Z',
            6.5,
          );
        } else this.say('Ringleaders have appeared.');
      }
      for (const [key, p] of Object.entries(this.s.pending))
        if (
          p.active &&
          p.kind !== 'dungeon' &&
          p.zone === this.s.zone &&
          !this.zone().enemies.some(
            (e) =>
              e.hp > 0 &&
              (e.eliteKey === key || (p.kind === 'field' && e.family === key && e.form === 'true')),
          )
        )
          delete this.s.pending[key];
    }
    updateGuardianReinforcements(dt) {
      if (this.peace || !dungeonIds.includes(this.s.zone)) return;
      const z = this.zone(),
        boss = z.enemies.find((e) => e.type === 'boss' && e.hp > 0 && !e.neutral),
        cfg = R.dungeonReinforcement;
      if (!boss) {
        z.guardianReinforcementTimer = 0;
        return;
      }
      const region = this.definition(),
        original = this.dungeonGuardCount(z.id),
        target = Math.ceil(original * cfg.targetFraction),
        formation = R.dungeonGuardFormations?.[z.id] || null,
        postCount = formation?.length || R.guardPosts.length,
        aliveGuards = () => z.enemies.filter((e) => e.guard && e.hp > 0 && !e.neutral);
      let alive = aliveGuards().length;
      if (alive >= target) {
        z.guardianReinforcementTimer = 0;
        return;
      }
      if (z.enemies.filter((e) => e.hp > 0 && !e.neutral && e.aggro).length >= cfg.engagedLimit)
        return;
      z.guardianReinforcementTimer = (z.guardianReinforcementTimer || 0) + dt;
      if (z.guardianReinforcementTimer < cfg.delay) return;
      const min = boss.aggro ? cfg.bossMinGroup : cfg.minGroup,
        max = boss.aggro ? cfg.bossMaxGroup : cfg.maxGroup,
        wanted = Math.min(
          target - alive,
          original - alive,
          min + Math.floor(this.random() * (max - min + 1)),
        ),
        points = [],
        targets = this.combatTargets(),
        start = (z.guardianReinforcementWave || 0) * 4;
      for (let j = 0; j < wanted; j++) {
        let chosen = null;
        for (let n = 0; n < postCount; n++) {
          const index = (start + j + n) % postCount,
            g = this.dungeonGuardBlueprint(z.id, index),
            p = this.safe(g.x, g.y, z.id);
          if (
            targets.some((u) => dist(p, u) < cfg.spawnDistance) ||
            dist(p, boss) < 180 ||
            aliveGuards().some((e) => dist(p, e) < 90) ||
            points.some((q) => dist(p, q.p) < 100)
          )
            continue;
          chosen = { p, index, g };
          break;
        }
        if (!chosen) break;
        points.push(chosen);
      }
      if (!points.length) return;
      const i = this.regionIndex(),
        awakened = boss.form === 'true' && this.s.phase === 'awakening' && this.s.awakeningLevel;
      for (const { p, index, g } of points) {
        const pack = Math.floor(index / 2),
          sp = g.sp,
          level = awakened ? this.s.awakeningLevel : Math.max(1, i * 3 + (pack % 2) + 1),
          hp = awakened
            ? Math.round((120 + 35 * this.s.awakeningLevel) * R.awakenedGuardianScaling.hp)
            : 65 + i * 105,
          damage = awakened
            ? Math.round((12 + this.s.awakeningLevel) * R.awakenedGuardianScaling.damage)
            : 7 + i * 8,
          e = this.makeEnemy(
            {
              species: sp[0],
              name: (awakened ? 'Awakened ' : '') + g.name + ' reinforcement',
              icon: sp[2],
              level,
              hp,
              damage,
              gold: 0,
              xp: 0,
            },
            p,
          );
        e.guard = true;
        e.reinforcement = true;
        e.pack = z.id + '-reinforcement-' + (z.guardianReinforcementWave || 0);
        if (g.role) e.forcedRole = g.role;
        if (awakened) e.awakenedGuard = true;
        this.configureEnemy(e, index);
        z.enemies.push(e);
      }
      this.guardianPopulation(z);
      z.guardianReinforcementWave = (z.guardianReinforcementWave || 0) + 1;
      z.guardianReinforcementTimer = 0;
      this.say('Dungeon guardians reinforce their posts.');
    }
    updatePacks(dt) {
      if (this.peace) return;
      const z = this.zone();
      for (const pack of new Set(z.enemies.filter((e) => e.pack && !e.guard).map((e) => e.pack))) {
        const members = z.enemies.filter((e) => e.pack === pack);
        if (
          members.some((e) => e.hp > 0) ||
          members.some((e) =>
            [this.hero, ...this.activeLivingParty()].some((u) => dist(e.home, u) < 350),
          )
        ) {
          delete z.packTimers[pack];
          continue;
        }
        z.packTimers[pack] = (z.packTimers[pack] || 0) + dt;
        if (z.packTimers[pack] >= 60) {
          for (const e of members) {
            Object.assign(e, e.home);
            e.hp = e.baseHp;
            e.maxHp = e.baseHp;
            e.deathPaid = false;
            e.heroParticipated = false;
            e.aggro = false;
            if (e.captain || e.roomCaptain) {
              e.captainPhase = false;
              e.captainPhaseMove = 1;
              e.captainAttackRate = 1;
              e.captainGuard = 0;
              e.specialCd = 1.25;
            }
          }
          delete z.packTimers[pack];
        }
      }
    }
    traps() {
      if (this.peace || this.supplyRoom()) return [];
      const z = this.zone(),
        side = this.sideDungeon(),
        dungeon = dungeonIds.includes(this.s.zone),
        tune = side
          ? R.sideDungeonTrapTuning
          : dungeon
            ? R.dungeonTrapTuning[this.s.zone]
            : R.outdoorMiniTrapTuning[this.s.zone],
        activeMinis = side || dungeon ? [] : (z.minis || []).filter((m) => !m.cleared),
        posts = side
          ? (side.traps || []).map(([x, y, kind], index) => ({ x, y, kind, index: 200 + index }))
          : dungeon
            ? R.dungeonTraps[this.s.zone].map(([x, y, kind], index) => ({ x, y, kind, index }))
            : activeMinis.flatMap((m, mi) => {
                const saved = (m.trapPosts || []).map((p) => ({ ...p, miniId: m.id }));
                if (saved.length) return saved;
                const kinds = R.outdoorMiniTrapKinds[this.s.zone] || ['spikes'],
                  returnOffsets = [[50, 65]];
                return returnOffsets.map(([dx, dy], j) => ({
                  x: m.x + dx,
                  y: m.y + dy,
                  kind: kinds[Math.min(j, kinds.length - 1)],
                  index: 100 + (mi + 1) * 10 + j,
                  miniId: m.id,
                }));
              });
      return posts.map(({ x, y, kind, index, miniId }) => {
        const p = this.safe(x, y),
          cycleLength = tune?.cycle || 8,
          warningTime = tune?.warning || 1.5,
          activeTime = tune?.active || 0.6,
          offset = tune?.offset || 1.35,
          elapsed = z.clock + index * offset,
          phase = elapsed % cycleLength;
        return {
          ...p,
          kind,
          miniId,
          radius: kind === 'seal' ? tune?.sealRadius || 58 : tune?.radius || 42,
          length: kind === 'jet' ? tune?.jetLength || 140 : 0,
          halfWidth: tune?.jetHalfWidth || 28,
          phase,
          warningTime,
          activeTime,
          cycleLength,
          damageFraction: tune?.damage || 0.08,
          slowSeconds: tune?.slow || 2,
          cycle: Math.floor(elapsed / cycleLength),
          index,
        };
      });
    }
    trapContains(t, u) {
      return t.kind === 'jet'
        ? this.distanceToSegment(
            u,
            { x: t.x - t.length / 2, y: t.y },
            { x: t.x + t.length / 2, y: t.y },
          ) < (t.halfWidth || 28)
        : dist(u, t) < t.radius;
    }
    updateTraps(dt) {
      const hero = this.hero,
        zone = this.zoneId;
      for (const t of this.traps())
        if (t.phase >= t.warningTime && t.phase < t.warningTime + t.activeTime)
          for (const u of [this.hero, ...this.activeLivingParty()]) {
            u.trapHits = u.trapHits || {};
            const key = this.s.zone + ':layout' + (this.zone().dungeonVersion || 2) + ':' + t.index;
            if (u.trapHits[key] !== t.cycle && this.trapContains(t, u)) {
              u.trapHits[key] = t.cycle;
              this.hitParty(u, u.maxHp * t.damageFraction);
              if (t.kind === 'seal') u.slow = t.slowSeconds;
              if (
                this.hero !== hero ||
                this.zoneId !== zone ||
                this.s.challenge.pending ||
                this.s.challenge.gameOver
              )
                return;
            }
          }
    }
    updateNight() {
      if (this.peace) return;
      const i = this.regionIndex();
      if (this.isDungeon() || ![1, 3].includes(i)) return;
      const z = this.zone();
      if (this.night()) {
        if (!z.enemies.some((e) => e.nightOnly && e.hp > 0) && !z.nightSpawned) {
          const species = i === 1 ? 'wraith' : 'stalker',
            cfg = R.nightEnemyCombat[species],
            hold = (R.creatureStrongholds || []).find(
              (s) => s.region === z.id && s.nightSpecies === species,
            ),
            center = hold ? this.creatureStrongholdCenter(z, hold) : { x: 1700, y: 900 },
            spots = [
              [-95, -20],
              [-25, -95],
              [80, -65],
              [100, 35],
            ];
          for (let j = 0; j < 4; j++) {
            const [dx, dy] = spots[j],
              p = this.safe(center.x + dx, center.y + dy, z.id),
              e = this.makeEnemy(
                {
                  species,
                  name: i === 1 ? 'Lantern wraith' : 'Ash stalker',
                  icon: '👻',
                  level: i * 3 + 2,
                  hp: Math.round((120 + i * 100) * cfg.hp),
                  damage: Math.round((12 + i * 7) * cfg.damage),
                  ...this.regionalEnemyRewards(i, 'night'),
                },
                p,
              );
            e.nightOnly = true;
            e.nightBalanceVersion = 1;
            e.specialCd = 1 + j * 0.35;
            e.stronghold = hold?.id || null;
            z.enemies.push(e);
          }
          z.nightSpawned = true;
        }
      } else {
        z.enemies = z.enemies.filter((e) => !e.nightOnly || e.aggro || e.form === 'ringleader');
        z.nightSpawned = false;
      }
    }
    updateEscort(dt) {
      const z = this.s.zones.frontier;
      if (z?.escort) delete z.escort;
    }
  }
  const World = typeof PrototypeWorld !== 'undefined' ? PrototypeWorld : require('./world.js');
  World.install(Campaign, { D, R, dungeonIds, classes });
  const Navigation =
    typeof PrototypeNavigation !== 'undefined' ? PrototypeNavigation : require('./navigation.js');
  Navigation.install(Campaign, D, R, dungeonIds);
  const Progression =
    typeof PrototypeProgression !== 'undefined'
      ? PrototypeProgression
      : require('./progression.js');
  Progression.install(Campaign, {
    D,
    R,
    classes,
    talentProfiles,
    talentMaxRanks,
    ceilings,
    expeditionCeilings,
    legacyWeapons,
  });
  const Save = typeof PrototypeSave !== 'undefined' ? PrototypeSave : require('./save.js');
  Save.install(Campaign, {
    D,
    R,
    classes,
    talentProfiles,
    talentMaxRanks,
    expeditionCeilings,
    dungeonIds,
  });
  const Combat = typeof PrototypeCombat !== 'undefined' ? PrototypeCombat : require('./combat.js');
  Combat.install(Campaign, { R });
  const HeroCombat =
    typeof PrototypeHeroCombat !== 'undefined' ? PrototypeHeroCombat : require('./hero-combat.js');
  HeroCombat.install(Campaign, { R });
  const BossCombat =
    typeof PrototypeBossCombat !== 'undefined' ? PrototypeBossCombat : require('./boss-combat.js');
  BossCombat.install(Campaign, { R });
  const Party = typeof PrototypeParty !== 'undefined' ? PrototypeParty : require('./party.js');
  Party.install(Campaign, { D, R });
  const Economy =
    typeof PrototypeEconomy !== 'undefined' ? PrototypeEconomy : require('./economy.js');
  Economy.install(Campaign, { D, R, dungeonIds });
  const Rewards =
    typeof PrototypeRewards !== 'undefined' ? PrototypeRewards : require('./rewards.js');
  Rewards.install(Campaign, { D, R, dungeonIds });
  Campaign.rules = R;
  Campaign.data = D;
  Campaign.classes = classes;
  Campaign.talentProfiles = talentProfiles;
  Campaign.talentMaxRanks = talentMaxRanks;
  Campaign.legacyWeapons = legacyWeapons;
  Campaign.dungeonIds = dungeonIds;
  Campaign.mercyStartRadius = mercyStartRadius;
  if (typeof module !== 'undefined') module.exports = Campaign;
  else root.Campaign = Campaign;
})(typeof window !== 'undefined' ? window : globalThis);
