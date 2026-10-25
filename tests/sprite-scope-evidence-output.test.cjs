'use strict';
const { audit } = require('../scripts/sprite-scope-audit.cjs');
const result = audit();
console.log('SPRITE_SCOPE_JSON_BEGIN');
console.log(JSON.stringify(result, null, 2));
console.log('SPRITE_SCOPE_JSON_END');
