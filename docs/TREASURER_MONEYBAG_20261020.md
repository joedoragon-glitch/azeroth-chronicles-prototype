# Treasurer silver-Crown money bag — dev.118

Joel reopened the formerly deferred coin hand: the currency is silver, and both Treasurer and Little Treasurer should hold a money bag bearing the Crown emblem. This explicit request supersedes the earlier deferral; no acceptance of an unseen generated image is claimed. No raster generation is involved.

A shared tied leather pouch hangs from the existing left grip, stamped with a silver Crown. Boss normal/TRUE and miniature reuse the same design at their established scale. Arms and grips stay in place; exact hammer, face, body and pose remain. The pet’s gold coin is removed. The boss’s previously empty left hand gains the same pouch.

[Before/after](../tools/visual-review/treasurer-moneybag-dev118/comparison.png), [audit](../tools/visual-review/treasurer-moneybag-dev118/audit.json), [reproduction](../tools/visual-review/treasurer-moneybag-dev118/check.cjs). Nine Treasurer cases change only around the existing left hand; ninety other pet/boss cases remain pixel identical. Rendering is state-pure, shared arms/body and boss hammer source unchanged. Current decision overlay and all three Treasurer handoffs carry this correction for future sprite work.

Prepared and audited; scoped build/inventory/format checks and package-only publication next. No whole-game CI is needed for this bounded drawing correction.
