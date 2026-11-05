# Accumulation — Quartet interaction rules

This document describes the inspected prototype. The public code implements the per-peer encounter decision and commit rules. Distance classification, session orchestration, audio playback, and transport remain in the private app and are described below only for context.

## From proximity to an encounter

The app classifies RSSI values at or above −60 as INTIMATE, at or above −75 as NEAR, and lower values as FAR. These are prototype signal thresholds, not measurements of physical distance. The public algorithm receives a category; it does not calculate RSSI or scan devices.

Quartet accepts only INTIMATE detections. It needs at least two qualifying detections within a rolling 2,000 ms window and a 30,000 ms cooldown since the last committed encounter with that peer. A nonqualifying detection clears that peer's recent qualifying samples. The peer's sound family must remain consistent.

These values are supplied by the private session manager and explicitly reproduced in the example. The legacy mode's three-second validation rule is not the Quartet rule.

A new encounter does not require an explicit leave-and-return transition: continued qualifying detections can produce another encounter after the cooldown. State is maintained per peer, not simply per sound family.

## Sound progression and commit

Each peer starts at level 0. Successful audio-changing encounters advance 0 → 1 → 2 → 3. Later qualifying encounters keep level 3 while updating the encounter count and cooldown.

`recordDetection` updates detection bookkeeping and proposes a decision. The host must perform the audio operation and call `commitAfterAudioSuccess` only when it succeeds. A failed or uncommitted audio operation must not advance the committed layer or cooldown. At level 3, the host uses `commitNoAudioChange` for an accepted encounter with no audio change.

The private host also prevents simultaneous processing for the same peer and blocks accumulation after the participant stops or ends. Those guards are not part of this standalone class. Inputs must be valid, chronologically ordered detections with stable peer identity and sound family; the class is not a complete input-validation or concurrency boundary.

## Session context outside this excerpt

The participant flow starts advertising and schedules scanning after 20 seconds. Stopping accumulation disables incoming encounter routing and scanning while retaining broadcasting and the accumulated sound. Stopping listening also stops playback. Ending the session cleans up transport and stops the session; manual/timer session stops request a ten-second audio fade. Session duration is configurable, with a ten-minute default.

Quartet does not use the legacy 'all sounds collected' completion branch after each encounter. Reaching level 3 for a peer is not itself the end of the session. Reset clears per-peer progression.

## Reading the example

`examples/encounter-example.ts` uses one synthetic peer in family S2. It checks stability, cooldown, rejection of FAR, proposal versus commit, progression through L1–L3, the L3 cap, encounter counting, and reset. Time is supplied as fixed timestamps, so there is no need to wait in real time. Audio success is simulated.

The excerpt does not include recordings or define an artistic choice of sounds. Experiencing the composition requires the separately distributed app.
