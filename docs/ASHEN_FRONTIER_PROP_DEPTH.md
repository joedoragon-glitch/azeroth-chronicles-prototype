# Ashen Frontier procedural prop-depth pass

This pass deepens the existing occupation/recovery presentation without changing Ashen Frontier's combat population, roads, quests, rewards or progression.

## Design target

Ashen Frontier should read as a damaged province being actively stabilized for exploitation. The visual language now distinguishes three overlapping histories:

- civilian life continuing under control;
- visible destruction and repair;
- standardized military/logistics infrastructure imposed over both.

The pass remains procedural. No sprite asset is introduced.

## Deterministic variation

The renderer already hashes stable entity IDs. Frontier-specific variants now use that same stable seed so repeated props do not all render identically while saves and screenshots remain deterministic.

Affected existing families include carts, supply stacks, field kitchens, command tents, watchposts, barricades, patched houses and workshops. Variation adds load state, damage/repair detail, occupation markings and work clutter without changing collision or gameplay identity.

## Recovery micro-scenes

Burned Hamlet now pairs evidence of damage with evidence of rebuilding instead of placing unrelated ruin and work props in the same general area:

- charred foundations;
- fresh repair braces;
- replacement fence stakes;
- broken carts awaiting work;
- stacked lumber and tools.

The roadworks yard similarly combines carts, wheels, timber, tools, supplies, road ruts and repaired road surfaces into one transport-maintenance scene.

## Occupation repetition

Inspection and checkpoint spaces intentionally repeat standardized visual markers. Civilian spaces vary more, while military bureaucracy repeats recognizable posts, standards and supply organization.

The Abyss Bastion cordon now uses saddle/harness preparation and purple royal flight standards to identify the Dark Lord’s air-superiority project. Chains elsewhere serve equipment and logistics, not a prisoner-dragon story.

## Road-surface safety

`road-ruts` and `road-patch` are the only Frontier occupation-layout props allowed directly on a generated travel lane. They are tagged `roadTrace`, have zero collision radius and remain decorative. Road regression tests continue to reject every other prop within the protected road edge.

## Save migration

`frontierLayoutVersion` advances from 1 to 2. Existing saves remove only the prior `frontier-layout-*` decorative layer and rebuild it from the new authored composition. Combat state, defeated enemies, quests, resources, buildings and progression are untouched.

## Regression coverage

The world-aesthetic suite verifies:

- all six Frontier districts still exist;
- recovery, roadworks, inspection, checkpoint and Bastion scenes contain their intended prop vocabulary;
- flat road traces exist and remain non-colliding;
- new recovery/occupation families have distinct renderer signatures;
- carts and patched houses use deterministic local visual variation.

The road suite ignores only tagged flat road traces when checking visual lane clearance; all ordinary props remain forbidden from the travel lane.
