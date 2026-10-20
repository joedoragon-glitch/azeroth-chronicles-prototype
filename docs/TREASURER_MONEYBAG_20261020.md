# Treasurer silver-Crown money bag — dev.118

Joel reopened the formerly deferred coin hand: the currency is silver, and both Treasurer and Little Treasurer should hold a money bag bearing the Crown emblem. This explicit request supersedes the earlier deferral; no acceptance of an unseen generated image is claimed. No raster generation is involved.

A shared tied leather pouch hangs from the existing left grip, stamped with a silver Crown. Boss normal/TRUE and miniature reuse the same design at their established scale. Arms and grips stay in place; exact hammer, face, body and pose remain. The pet’s gold coin is removed. The boss’s previously empty left hand gains the same pouch.

[Before/after](../tools/visual-review/treasurer-moneybag-dev118/comparison.png), [audit](../tools/visual-review/treasurer-moneybag-dev118/audit.json), [reproduction](../tools/visual-review/treasurer-moneybag-dev118/check.cjs). Nine Treasurer cases change only around the existing left hand; ninety other pet/boss cases remain pixel identical. Rendering is state-pure, shared arms/body and boss hammer source unchanged. Current decision overlay and all three Treasurer handoffs carry this correction for future sprite work.

Published in PR [#352](https://github.com/joedoragon-glitch/azeroth-chronicles-prototype/pull/352), merge `31f44279585ca8400d395024417a4f12431bfd2c`; package-only run 39516901245 succeeded. [Eight exact relevant live files match](evidence/TREASURER_MONEYBAG_DEV118_PUBLICATION_20261020.json). Build/generated, sprite/material/scope/audio inventories, current continuity and changed-source format checks pass. Normal workflow restored and temporary publisher removed. No whole-game CI ran for this bounded drawing correction.
