"""Preserve imported/overridden sounds and routing when rendering score-book assets."""
from copy import deepcopy


def can_render(registry, cue_id):
    entry = registry.get("assets", {}).get(cue_id)
    return entry is None or entry.get("managedBy") == "score-book"


def merge_registry(registry, rendered, authored_ids, partial=False):
    result = deepcopy(registry)
    result.setdefault("schemaVersion", 1)
    assets = result.setdefault("assets", {})
    if not partial:
        for cue_id, entry in list(assets.items()):
            if entry.get("managedBy") == "score-book" and cue_id not in authored_ids:
                del assets[cue_id]
    for cue_id, entry in rendered.items():
        if not can_render(registry, cue_id):
            raise ValueError("Refusing to overwrite custom sound " + cue_id)
        assets[cue_id] = {**assets.get(cue_id, {}), **entry, "managedBy": "score-book"}
    return result
