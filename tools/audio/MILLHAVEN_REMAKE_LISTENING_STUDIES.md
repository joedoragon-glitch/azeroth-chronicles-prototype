# Millhaven remake — initial listening candidates (3 November 2026)

This is a **review manifest**, not an approval or production-integrated music asset. Owner-directed development for **So I Became the Dark Lord's Problem**; current original source remains `src/prototype/audio-catalog.js` and `audio-score.js`, transcribed by `millhaven-legacy-transcription.cjs`.

## Prepared listenable audio (ChatGPT conversation attachments, NOT published game URLs)

| Study | Name | SHA-256 |
| --- | --- | --- |
| Source reference | `Millhaven_Original_Score_Reference.mp3` | `9dc8e6c3b40bbdb6c057f4661dd65c85e8da25455c25a0e55a132f7edff07080` |
| A — Restored Millhaven | `Millhaven_Candidate_A_Restored.mp3` | `c4c3fb86e7280bbcf45657dd5dab92226fbc86aff7cdf2ef403c85b59eec0bdd` |
| B — Millhaven Chamber | `Millhaven_Candidate_B_Chamber.mp3` | `11a6aeb67001e5d1deb2b4aa0c04af39f6a922d5ce104c0edf88990d73e3373d` |

Three complete **192 kb/s MP3**, **44.1kHz stereo**, **85.63 seconds each including release tail**. Musical form is original **C natural minor, 92 BPM, 32 bars, loop 83.478 seconds**. All three pass `ffprobe` 44.1 kHz/stereo/duration checks and local `ffmpeg` decoding, non-silence and clipping checks; **no real-device/browser listening is claimed**.

- **A:** source melody with its original triangle-oscillator timbre prominent, added soft synthesized flute, cello, harp and subtle strings. No added drums.
- **B:** exact same source melody and chord progression with a more prominent synthesized flute, harp figures, cello/string support, restrained rest-space woodwind responses. No full orchestration.
- **Reference:** convenience *offline approximation*, not a literal capture of the existing in-game Web Audio oscillator. The authoritative original remains available at [the Sound Library's original procedural score](https://joedoragon-glitch.github.io/azeroth-chronicles-prototype/tools/audio/index.html?legacy=vale).
- No external sample instruments or third-party music files were used for these preliminary synthesizer mockups; they do **not** yet evaluate the project's pinned recorded CC0 instrument bank.
- Reproducibility: the original offline Python render generator and manifest are included in the conversation's optional `millhaven_comparison_packet.zip`; the ZIP and MP3s are **not** checked into this draft PR. The Python renderer needs `numpy`, `scipy`, `soundfile`, and `ffmpeg`.
- The user can **open the audio directly using the individual MP3 links in the ChatGPT response**. That is the initial delivery path; **do not claim the Game Sound Library candidate preview URLs are live**.

## Status and gates

**Prepared:** isolated source-derived A/B render studies and downloadable files, reference recording and reproducibility packet. **Tested:** FFmpeg decodes three files successfully; basic level/duration/channel metadata and source-score arithmetic checked. **Not yet tested:** aesthetic listening acceptance, iPhone playback, public Game Sound Library candidate playback. **Not implemented:** any new live-game cue, new location routing, soundtrack replacement or caching. **Not merged/deployed/device-verified:** unchanged.

**Next:** solicit the owner's feedback on the three playable recordings and revise arrangement/recorded timbres as directed. The draft PR must remain unmerged, with no game deployment, until explicit owner authorization; rendering and automated tests never imply artistic approval.
