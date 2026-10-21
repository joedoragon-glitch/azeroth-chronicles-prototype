/* Full Barracks recovery of finite tribute from previously cleared regions. */
(function (root) {
  'use strict';
  function install(Campaign, { D, R }) {
    class Expeditions {
      resourceExpeditionDuration() {
        return R.dayCycle.seconds * R.resourceExpeditions.durationCycles;
      }
      resourceExpeditionRegions() {
        return D.regions.slice(0, this.regionIndex()).map((region) => {
          const specialists = D.bosses.filter((b) => b.region === region.id && b.captive),
            missing = specialists.filter((b) => !this.s.rescued[b.id]),
            remaining = (this.s.zones[region.id]?.nodes || []).reduce(
              (sum, n) => sum + Math.max(0, n.amount),
              0,
            ),
            mission = (this.s.resourceExpeditions || []).find((e) => e.region === region.id);
          return { region, missing, remaining, mission };
        });
      }
      resourceExpeditionWorkerReason(u) {
        if (!u || !this.s.party.includes(u)) return 'This companion is no longer in your company.';
        if (!this.canGatherTribute(u))
          return 'Resource expeditions need a Soldier, Ranger or Little Treasurer.';
        if (u.hp <= 0) return 'Recover this fallen companion first.';
        if (u.expeditionId) return 'This companion is already away on an expedition.';
        if (u.order || u.keeperHeld || u.deathRollHeld || this._companionCharges?.has(u.id))
          return 'This companion is busy. Recall or finish the current assignment first.';
        return '';
      }
      resourceExpeditionReason(barracksId, region, workerId = null) {
        const b = this.zone().buildings.find(
          (b) => b.id === barracksId && b.kind === 'barracks' && b.progress >= 4 && b.full,
        );
        if (!b) return 'Resource expeditions require a completed Full Barracks.';
        if (Math.hypot(b.x - this.hero.x, b.y - this.hero.y) > 160)
          return 'Visit this Full Barracks to send an expedition.';
        if (this.refugeThreat()) return 'End nearby combat before sending an expedition.';
        const destination = this.resourceExpeditionRegions().find((e) => e.region.id === region);
        if (!destination) return 'Choose an earlier region.';
        if (destination.missing.length) return 'Rescue every specialist in that region first.';
        if (destination.mission)
          return 'An expedition is already recovering tribute from that region.';
        if (destination.remaining < 1e-7) return 'No tribute remains in that region.';
        if (workerId !== null)
          return this.resourceExpeditionWorkerReason(this.s.party.find((u) => u.id === workerId));
        return '';
      }
      startResourceExpedition(barracksId, region, workerId) {
        const reason = this.resourceExpeditionReason(barracksId, region, workerId);
        if (reason) {
          this.say(reason);
          return false;
        }
        const worker = this.s.party.find((u) => u.id === workerId),
          mission = {
            id: 'resource-expedition-' + this.s.nextId++,
            region,
            workerId,
            startedAt: this.s.time,
            finishAt: this.s.time + this.resourceExpeditionDuration(),
            wasActive: worker.active !== false,
          };
        this.clearGatheringIntent(worker);
        this.clearCompanionJudgment(worker);
        this.clearPartyCharge(worker);
        this._companionCharges?.delete(worker.id);
        worker.active = false;
        worker.expeditionId = mission.id;
        worker.order = null;
        (this.s.resourceExpeditions ||= []).push(mission);
        this.say(
          this.companionDisplayName(worker) +
            ' sets out on a recovery adventure to ' +
            D.regions.find((r) => r.id === region).name +
            '. Tribute will be delivered automatically on return.',
        );
        this.event('resourceExpeditionStarted', { region, workerId });
        return true;
      }
      advanceResourceExpeditions() {
        const missions = this.s.resourceExpeditions || [];
        for (const mission of missions.slice()) {
          if (this.s.time + 1e-7 < mission.finishAt) continue;
          const worker = this.s.party.find((u) => u.id === mission.workerId),
            zone = this.s.zones[mission.region];
          let amount = 0;
          for (const n of zone?.nodes || []) {
            amount += Math.max(0, n.amount);
            n.amount = 0;
          }
          this.s.gathered[mission.region] = (this.s.gathered[mission.region] || 0) + amount;
          if (this.s.gatheringTarget?.zone === mission.region) this.s.gatheringTarget = null;
          const payout = this.creditRecoveredTribute(amount);
          this.s.resourceExpeditions = this.s.resourceExpeditions.filter(
            (e) => e.id !== mission.id,
          );
          if (worker) {
            delete worker.expeditionId;
            worker.active =
              mission.wasActive &&
              worker.hp > 0 &&
              this.activeParty().length < this.expeditionPartyCap();
            if (worker.active) Object.assign(worker, this.safe(this.hero.x + 40, this.hero.y + 30));
          }
          const region = D.regions.find((r) => r.id === mission.region),
            message = 'Expedition returned · ' + payout + ' crowns';
          this.say(
            message +
              ' recovered from ' +
              region.name +
              '. ' +
              (worker?.active
                ? 'Your companion rejoins the active group.'
                : 'Your companion is back in reserve.'),
          );
          this.notice(
            message,
            6,
            (worker ? this.companionDisplayName(worker) + ' · ' : '') +
              region.name +
              ' · remaining tribute recovered automatically.',
            'milestone',
          );
          this.event('resourceExpeditionReturned', {
            region: mission.region,
            workerId: mission.workerId,
            crowns: payout,
          });
        }
      }
    }
    for (const name of Object.getOwnPropertyNames(Expeditions.prototype))
      if (name !== 'constructor')
        Object.defineProperty(
          Campaign.prototype,
          name,
          Object.getOwnPropertyDescriptor(Expeditions.prototype, name),
        );
  }
  const api = { install };
  if (typeof module !== 'undefined') module.exports = api;
  else root.PrototypeExpeditions = api;
})(typeof window !== 'undefined' ? window : globalThis);
