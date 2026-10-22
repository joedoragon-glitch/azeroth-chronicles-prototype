'use strict';
// STAGING CONTRACT ONLY. Not imported into the playable application.
// Defines the requirements for an eventual two-choice graphics preference.
const DEFAULT_RENDERER = 'canvas2d';
const OPTIONS = Object.freeze(['canvas2d', 'webgl2']);
const API_METHODS = Object.freeze([
  'draw', 'world', 'screen', 'tileBounds', 'setOptimizationMode',
  'labelVisible', 'queue', 'update', 'metrics',
  'setGroundReuse', 'setOutlineCompaction'
]);
// These capabilities must be implemented by the native GPU renderer, not
// simulated by uploading completed Canvas frames or skipping visual layers.
const GATES = Object.freeze([
  'nativeGpuDrawsFullScene',
  'allWorldAndDungeonLayers',
  'actorsMoveAndAnimate',
  'originalLightingAndLamps',
  'combatAndOcclusionEffects',
  'identicalCameraAndInputMapping',
  'zoomDprAndResolution',
  'allRegionsAndDungeonScenes',
  'textureMemoryAndInvalidation',
  'contextLossAndFallback',
  'productionParityOnMovingFrames',
  'fairTotalFramePerformance'
]);

function normalizedPreference(raw) {
  return raw === 'webgl2' ? 'webgl2' : DEFAULT_RENDERER;
}
function rendererApiComplete(backend) {
  return !!backend && API_METHODS.every((method) => typeof backend[method] === 'function');
}
function nativeWebglReady(evidence) {
  if (!evidence || evidence.renderer !== 'webgl2') return false;
  if (!evidence.nativeModule || typeof evidence.nativeModule !== 'string') return false;
  if (!evidence.testReceipt || typeof evidence.testReceipt !== 'string') return false;
  return GATES.every((name) => evidence.gates?.[name] === true);
}
function resolveRequestedRenderer(preference, evidence, canCreateContext = true) {
  const requested = normalizedPreference(preference);
  if (requested === DEFAULT_RENDERER) {
    return { requested, active: DEFAULT_RENDERER, reason: 'default' };
  }
  if (!nativeWebglReady(evidence)) {
    return { requested, active: DEFAULT_RENDERER, reason: 'webgl-not-certified' };
  }
  if (!canCreateContext) {
    return { requested, active: DEFAULT_RENDERER, reason: 'webgl-context-unavailable' };
  }
  return { requested, active: 'webgl2', reason: 'certified-and-supported' };
}
module.exports = Object.freeze({
  DEFAULT_RENDERER, OPTIONS, API_METHODS, GATES,
  normalizedPreference, rendererApiComplete, nativeWebglReady,
  resolveRequestedRenderer
});
