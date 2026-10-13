'use strict';
// Frozen comparison exceptions for #298 choice 6A, not runtime content rules.
// Only these twelve identities may be excluded from old-content equivalence.
const approvedScenery = [
  ['vale', 'regional-handoff-3', 'fruit-tree', 'hamlet-orchard'],
  ['vale', 'regional-handoff-4', 'fruit-tree', 'hamlet-orchard'],
  ['vale', 'regional-handoff-5', 'fruit-tree', 'hamlet-orchard'],
  ['vale', 'regional-handoff-6', 'fruit-tree', 'hamlet-orchard'],
  ['vale', 'regional-handoff-7', 'crate', 'hamlet-orchard', 'harvest'],
  ['vale', 'regional-handoff-8', 'stacked-lumber', 'millhaven-carpentry'],
  ['vale', 'regional-handoff-9', 'tool-rack', 'millhaven-carpentry'],
  ['march', 'regional-handoff-5', 'crate', 'reedport-catch', 'sorting'],
  ['march', 'regional-handoff-6', 'cart', 'reedport-catch', 'delivery'],
  ['march', 'regional-handoff-7', 'tool-rack', 'camp-work', 'boat-maintenance'],
  ['frontier', 'regional-handoff-0', 'garden', 'burned-hamlet-home'],
  ['frontier', 'regional-handoff-1', 'laundry', 'burned-hamlet-home'],
];
function isAddedScenery(p, region) {
  return (
    p.decorative === true &&
    p.r === 0 &&
    approvedScenery.some(
      ([zone, id, structure, district, role]) =>
        zone === region &&
        p.id === id &&
        p.structure === structure &&
        p.regionalDistrict === district &&
        p.sceneRole === role,
    )
  );
}
function removeApprovedScenery(props, region) {
  const seen = new Set();
  return props.filter((p) => {
    if (!isAddedScenery(p, region)) return true;
    if (seen.has(p.id))
      throw new Error('Duplicate approved scenery identity: ' + region + '/' + p.id);
    seen.add(p.id);
    return false;
  });
}
module.exports = { approvedScenery, isAddedScenery, removeApprovedScenery };
