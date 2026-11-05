# Accumulation — core interaction logic

Accumulation is an artistic research prototype in which encounters between participants change a sound composition. This repository shares a small reference implementation of its Quartet encounter rules.

This is a source excerpt, not the complete mobile app. It does not scan Bluetooth devices, play sounds, provide a user interface, or build an APK/iOS app. Audio, images, fonts, native modules, participant records, and the original private repository history are excluded.

## Read and try

- Read [DESIGN.md](DESIGN.md) for the interaction rules and their limits.
- Read `src/quartet/QuartetEncounterState.ts` for the decision and commit algorithm.
- Run the deterministic, synthetic example with Node.js 22.22.2 (the verified runtime):

```sh
node --experimental-transform-types examples/encounter-example.ts
```

No package installation, phone, Bluetooth device, or audio file is needed. Node may print an experimental-feature warning. The example prints L1 → L2 → L3, a further encounter staying at L3, and `All example checks passed.` It simulates successful audio playback; it does not test a real audio engine.

## Scope and provenance

The three source files are taken from the private Accumulation prototype. Only the two import paths in `QuartetEncounterState.ts` have been given explicit `.ts` extensions for this example; algorithm behavior is unchanged. The types file retains supporting definitions from the prototype, including some not used by this excerpt.

Implementation was written by the project author with AI assistance, as declared by the author. The example and documentation were prepared for this public excerpt. Third-party mobile app dependencies and their assets are not distributed here.

## Experience the work

Try the mobile prototype:

- **iOS:** [Join the TestFlight beta](https://testflight.apple.com/join/4NZw1UPb).
- **Android:** [Download the APK from Google Drive](https://drive.google.com/file/d/1Dav3vamu5X2OLE72KiKN_pz9kDp2KJCR/view?usp=sharing).

The mobile builds are distributed separately from this core-code repository. The Apache-2.0 license here covers only the files in this repository; it does not grant rights to the app recordings or other assets.

## License

Copyright 2026 Siyi Xia.

The source code, example, and documentation in this repository are licensed under the [Apache License, Version 2.0](LICENSE).

The full mobile app and all recordings, images, and fonts are outside this repository's scope. This license applies only to the files distributed here.
