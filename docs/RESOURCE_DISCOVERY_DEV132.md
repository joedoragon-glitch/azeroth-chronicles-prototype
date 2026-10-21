# Resource menu discovery — dev.132

Owner request, 21 October 2026: resource gathering and expedition instructions must leave Little Treasurer’s resource ability for the player to discover.

Generic gatherer/companion wording replaces the explicit pet references in Resources & labor, its disabled options, gathering failure announcements, the expedition companion description and expedition worker denial. Spanish gathering strings and expedition description follow the same rule. Actual owned companion names remain in worker selection and departure/return reports. Eligibility, gathering, mission duration, payouts, saves and pet skills are unchanged.

Audit: inspected every Little Treasurer reference in runtime sources; only its authored name in rules remains. Reviewed the diff for text-only gameplay changes; generated version/cache updated together. Build/generated files, JavaScript syntax, existing menu check and existing resource-expedition check pass (including Treasurer eligibility/return). Heavy GitHub/game/browser suites deferred to the end of the owner’s playtest batch.

Workflow: implement requested issue, focused review/checks as needed, publish for Joel’s phone playthrough; reserve broad CI for an explicitly requested end-of-batch pass.

Publication pending.
