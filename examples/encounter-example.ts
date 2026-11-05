// Copyright 2026 Siyi Xia
// SPDX-License-Identifier: Apache-2.0

import { ProximityCategory } from '../src/models/ProximityCategory.ts';
import { QuartetEncounterState } from '../src/quartet/QuartetEncounterState.ts';

// Synthetic data only. No Bluetooth, audio playback, or real participant data.
const state = new QuartetEncounterState({
  cooldownMs: 30_000,
  stabilityWindowMs: 2_000,
  stabilityRequiredCount: 2,
});
const epoch = Date.parse('2026-01-01T00:00:00Z');

function detect(offsetMs: number, proximity = ProximityCategory.Intimate) {
  return state.recordDetection({
    peerCode: 'DEMO-PEER',
    peerFamily: 'S2',
    detectedAtIso: new Date(epoch + offsetMs).toISOString(),
    proximityCategory: proximity,
  });
}

function expect(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

expect(detect(0).reason === 'stability_guard_not_met', 'One detection must not trigger.');
const first = detect(1_000);
expect(first.shouldChangeAudio && first.nextLayerLevel === 1, 'First encounter must propose L1.');
expect(state.getCommittedPeerSnapshots()[0].layerLevel === 0, 'A proposal must not commit playback success.');

// The application calls this only AFTER successful playback. Here success is simulated.
state.commitAfterAudioSuccess({
  peerCode: first.peerCode,
  nowMs: first.nowMs,
  nextLayerLevel: 1,
  encounterCountForPeerProposed: first.encounterCountForPeerProposed,
});
console.log('First encounter: L1 (simulated audio success)');
expect(detect(2_000).reason === 'cooldown_not_elapsed', 'Cooldown must block rapid repeat encounters.');
expect(detect(3_000, ProximityCategory.Far).reason === 'proximity_not_qualifying', 'Far must not trigger.');

// Each later pair satisfies the stability window and waits for the cooldown.
for (const [startMs, level] of [[31_000, 2], [62_000, 3]] as const) {
  expect(!detect(startMs).shouldTriggerEncounter, 'A fresh pair needs two detections.');
  const decision = detect(startMs + 1_000);
  expect(decision.shouldChangeAudio && decision.nextLayerLevel === level, `Expected L${level}.`);
  state.commitAfterAudioSuccess({
    peerCode: decision.peerCode,
    nowMs: decision.nowMs,
    nextLayerLevel: level,
    encounterCountForPeerProposed: decision.encounterCountForPeerProposed,
  });
  console.log(`Later encounter: L${level} (simulated audio success)`);
}

detect(93_000);
const capped = detect(94_000);
expect(capped.shouldTriggerEncounter && !capped.shouldChangeAudio && capped.nextLayerLevel === 3,
  'Further encounters at L3 must not increase the audio level.');
state.commitNoAudioChange({
  peerCode: capped.peerCode,
  nowMs: capped.nowMs,
  encounterCountForPeerProposed: capped.encounterCountForPeerProposed,
});
expect(state.getCommittedPeerSnapshots()[0].validEncounterCount === 4, 'Expected four committed encounters.');
console.log('Further encounter: remains L3; encounter count updated');
state.reset();
expect(state.getCommittedPeerSnapshots().length === 0, 'Reset must clear peer state.');
console.log('All example checks passed.');
