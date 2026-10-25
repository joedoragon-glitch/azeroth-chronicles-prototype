'use strict';
const assert = require('node:assert/strict');
const Integration = require('../src/prototype/critical-party-integration.js');
let reads = 0;
const Crit = require('../src/prototype/critical-executions.js');
class Campaign {
  constructor() {
    this.hero = { class: 'paladin' };
    this.s = { projectiles: [], recallActive: false, party: [], zone: 'vale' };
    this.effects = []; this._heroSkillEffects = [];
    this.zoneId = 'vale'; this.available = [];
  }
  event(type, payload = {}) { this.effects.push({ type, ...payload }); }
  cast(slot, _, charged = false, __ = null, automatic = false) {
    if (slot === 9) return false;
    this.event('heroSkillCast', { class: this.hero.class, slot, charged });
    if (slot === 1 && charged) this._heroSkillEffects.push({ kind: 'cross', admitted: [] });
    else if (this.hero.class === 'ranger' && slot === 1 && !automatic)
      for (let i = 0; i < 3; i++) this.s.projectiles.push({ source: 'hero', shot: i });
    else this.s.projectiles.push({ source: 'hero' });
    return true;
  }
  companionUseFirstSkill(u) {
    if (u.type === 'pet') return this.usePetSkill(u, {}, 1);
    if (u.invalid) return false;
    if (u.type === 'archer') for (let i = 0; i < 3; i++) this.s.projectiles.push({ source: u.id, shot: i });
    this.event('companionSkill', { source: u.id });
    u.cd = 0.5; return true;
  }
  resolveCompanionSecondSkill(u) {
    if (u.type === 'pet') return this.usePetSkill(u, {}, 2);
    if (u.invalid) return false;
    this.event('chargedArea', { source: u.id }); u.cd = 0.5; return true;
  }
  usePetSkill(u, _target, slot) {
    if (u.invalid) return false;
    if (u.ranged) this.s.projectiles.push({ source: u.id, slot });
    this.event('petSkill', { source: u.id, stage: 'release' }); u.cd = .5; return true;
  }
  availableRangers() { return this.available; }
  mageSilenceActive(u) { return Boolean(u.silenced); }
  rangerSupport() { if (!this.available.length) return false; this.event('heal', {target:'hero'}); return true; }
  petDefensiveCounter(u) { if (u.invalid) return false; this.s.projectiles.push({ source: u.id }); u.cd = .5; return true; }
  companionFight(u) {
    if (u.invalid) return;
    if (u.special) this.companionUseFirstSkill(u);
    else if (u.type === 'pet') {
      if (u.petSpecial) this.usePetSkill(u, {}, 1);
      else { u.cd = .85; this.s.projectiles.push({ source: u.id }); }
    } else { u.cd = .85; this.s.projectiles.push({ source: u.id }); }
  }
  updateParty() {
    if (this.s.recallActive) for (const u of this.s.party) {
      if (u.type === 'archer') this.s.projectiles.push({ source: u.id });
      if (u.type === 'soldier') this.event('melee', { actor: 'companion', source: u.id });
    }
  }
}
const originalCast = Campaign.prototype.cast;
const off = Integration.install(Campaign, Crit, { enabled: false });
assert.equal(off.installed, false);
assert.equal(Campaign.prototype.cast, originalCast);
assert.equal(reads, 0);
const engine = Integration.install(Campaign, Crit, { enabled: true, stream: { next() { reads++; return .05; } } });
assert.equal(engine.installed, true);
assert.equal(engine.criticalLevels().hero, 1);
assert.equal(engine.criticalLevels().companion, 1);
assert.equal(engine.criticalLevels().world, 1);
assert.throws(() => Integration.install(Campaign, Crit, {enabled:true,stream:{next:()=>.4}}), /already installed/);
const g = new Campaign();
assert.equal(g.cast(9), false); assert.equal(reads, 0);
assert.equal(g.cast(1, null, true), true); assert.equal(reads, 1);
assert.equal(g._heroSkillEffects[0].criticalExecution.key, 'hero/paladin/1-charged');
assert.equal(g._heroSkillEffects[0].criticalExecution.intensity, 1);
assert.equal(g._heroSkillEffects[0].criticalExecution.effect.lever, 'damage');
assert.equal(g.cast(2), true); assert.equal(reads, 2);
assert.equal(g.s.projectiles.at(-1).criticalExecution.key, 'hero/paladin/2-tap');
engine.setCriticalLevel('hero', 3);
engine.setCriticalLevel('companion', 2);
engine.setCriticalLevel('world', 3, 'nightmare');
assert.equal(engine.criticalLevels().modes.nightmare.world, 3);
assert.equal(engine.criticalLevels().world, 1, 'nightmare does not change normal world setting');
assert.equal(g._heroSkillEffects[0].criticalExecution.intensity, 1, 'in-flight cross freezes original level');
g.hero.class = 'ranger'; const before = g.s.projectiles.length;
assert.equal(g.cast(1), true); assert.equal(reads, 3);
const burst = g.s.projectiles.slice(before);
assert.equal(burst.length, 3); assert(burst.every(p=>p.criticalExecution === burst[0].criticalExecution));
assert.equal(burst[0].criticalExecution.key, 'hero/ranger/1-tap');
assert.equal(burst[0].criticalExecution.intensity, 3);
assert.equal(burst[0].criticalExecution.effect.lever, 'damage');
const archer={type:'archer',id:'a'};
let start=g.s.projectiles.length;
assert(g.companionUseFirstSkill(archer)); assert.equal(reads, 4);
assert(g.s.projectiles.slice(start).every(p=>p.criticalExecution.key==='troop/archer/first'));
assert.equal(g.s.projectiles[start].criticalExecution.intensity, 2);
assert.equal(g.s.projectiles[start].criticalExecution.effect.lever, 'slowDuration');
assert(g.resolveCompanionSecondSkill(archer)); assert.equal(reads,5);
const pet={type:'pet',id:'p',petFamily:'crypt',ranged:true}; start=g.s.projectiles.length;
assert(g.companionUseFirstSkill(pet)); assert.equal(reads,6,'delegated pet skill is one release, not two');
assert.equal(g.s.projectiles[start].criticalExecution.key,'pet/crypt/1');
assert(g.resolveCompanionSecondSkill(pet)); assert.equal(reads,7);
assert.equal(engine.releases(g).at(-1).key,'pet/crypt/2');
g.available=[archer]; assert(g.rangerSupport('health')); assert.equal(reads,8);
assert.equal(engine.releases(g).at(-1).key,'troop/archer/heal');
const melee={type:'soldier',id:'s',cd:0};g.companionFight(melee);
assert.equal(reads,9);assert.equal(engine.releases(g).at(-1).key,'troop/soldier/basic');
archer.cd=0; archer.special=true;g.companionFight(archer);
assert.equal(reads,10,'special not also ordinary basic');
assert.equal(engine.releases(g).at(-1).key,'troop/archer/first');
pet.cd=0;pet.petSpecial=false;g.companionFight(pet);
assert.equal(reads,11);assert.equal(engine.releases(g).at(-1).key,'pet/crypt/basic');
assert(g.petDefensiveCounter(pet));assert.equal(reads,12);
g.s.party=[{type:'archer',id:'r'}, {type:'soldier',id:'s2'}];g.s.recallActive=true;
g.updateParty();assert.equal(reads,14);
assert.equal(engine.releases(g).at(-2).key,'troop/archer/basic');
assert.equal(engine.releases(g).at(-1).key,'troop/soldier/basic');
assert(engine.releases(g).every(o=>o.critical));
for(let i=0;i<85;i++)g.cast(2);
assert.equal(engine.releases(g).length,64, 'bounded observation history');
engine.uninstall(); assert.equal(Campaign.prototype.cast,originalCast);
console.log('Focused Stage 2 release/receipt integration fixtures passed.');
