// Copyright 2026 Siyi Xia
// SPDX-License-Identifier: Apache-2.0

import { ProximityCategory } from '../models/ProximityCategory.ts';
import type { SoundFamily } from './types.ts';

export type QuartetLayerLevel = 0 | 1 | 2 | 3;

const QUARTET_REQUIRED_PROXIMITY = ProximityCategory.Intimate;

export interface QuartetEncounterDecision {
  shouldTriggerEncounter: boolean;
  shouldChangeAudio: boolean;
  peerCode: string;
  peerFamily: SoundFamily;
  encounterCountForPeerProposed: number;
  previousLayerLevel: QuartetLayerLevel;
  nextLayerLevel: QuartetLayerLevel;
  nowMs: number;
  reason?: string;
}

interface PeerRuntimeState {
  peerFamily: SoundFamily;
  validEncounterCount: number;
  currentLayerLevel: QuartetLayerLevel;
  lastValidEncounterAtMs?: number;
  recentQualifyingDetectionsMs: number[];
}

export interface QuartetCommittedPeerSnapshot {
  peerCode: string;
  peerFamily: SoundFamily;
  layerLevel: QuartetLayerLevel;
  validEncounterCount: number;
  lastValidEncounterAtMs?: number;
}

export class QuartetEncounterState {
  private peers = new Map<string, PeerRuntimeState>();

  constructor(
    private readonly config: {
      cooldownMs: number;
      stabilityWindowMs: number;
      stabilityRequiredCount: number;
    },
  ) {}

  reset(): void {
    this.peers.clear();
  }

  getCommittedPeerSnapshots(): ReadonlyArray<QuartetCommittedPeerSnapshot> {
    return Object.freeze(
      Array.from(this.peers.entries())
        .map(([peerCode, state]) => ({
          peerCode,
          peerFamily: state.peerFamily,
          layerLevel: state.currentLayerLevel,
          validEncounterCount: state.validEncounterCount,
          lastValidEncounterAtMs: state.lastValidEncounterAtMs,
        }))
        .sort((a, b) => a.peerCode.localeCompare(b.peerCode)),
    );
  }

  recordDetection(input: {
    peerCode: string;
    peerFamily: SoundFamily;
    detectedAtIso: string;
    proximityCategory: ProximityCategory;
  }): QuartetEncounterDecision {
    const peerCode = input.peerCode.trim().toUpperCase();
    const nowMs = this.parseTimestampMs(input.detectedAtIso);

    const peerState = this.getOrCreatePeer(peerCode, input.peerFamily);

    if (peerState.peerFamily !== input.peerFamily) {
      return {
        shouldTriggerEncounter: false,
        shouldChangeAudio: false,
        peerCode,
        peerFamily: peerState.peerFamily,
        encounterCountForPeerProposed: peerState.validEncounterCount,
        previousLayerLevel: peerState.currentLayerLevel,
        nextLayerLevel: peerState.currentLayerLevel,
        nowMs,
        reason: 'peer_family_mismatch',
      };
    }

    const isQualifying = input.proximityCategory === QUARTET_REQUIRED_PROXIMITY;

    if (!isQualifying) {
      peerState.recentQualifyingDetectionsMs = [];
      return {
        shouldTriggerEncounter: false,
        shouldChangeAudio: false,
        peerCode,
        peerFamily: peerState.peerFamily,
        encounterCountForPeerProposed: peerState.validEncounterCount,
        previousLayerLevel: peerState.currentLayerLevel,
        nextLayerLevel: peerState.currentLayerLevel,
        nowMs,
        reason: 'proximity_not_qualifying',
      };
    }

    peerState.recentQualifyingDetectionsMs.push(nowMs);
    peerState.recentQualifyingDetectionsMs = peerState.recentQualifyingDetectionsMs.filter(
      (timestamp) => nowMs - timestamp <= this.config.stabilityWindowMs,
    );

    const isStable =
      peerState.recentQualifyingDetectionsMs.length >= this.config.stabilityRequiredCount;

    if (!isStable) {
      return {
        shouldTriggerEncounter: false,
        shouldChangeAudio: false,
        peerCode,
        peerFamily: peerState.peerFamily,
        encounterCountForPeerProposed: peerState.validEncounterCount,
        previousLayerLevel: peerState.currentLayerLevel,
        nextLayerLevel: peerState.currentLayerLevel,
        nowMs,
        reason: 'stability_guard_not_met',
      };
    }

    const cooldownOk =
      peerState.lastValidEncounterAtMs === undefined ||
      nowMs - peerState.lastValidEncounterAtMs >= this.config.cooldownMs;

    if (!cooldownOk) {
      return {
        shouldTriggerEncounter: false,
        shouldChangeAudio: false,
        peerCode,
        peerFamily: peerState.peerFamily,
        encounterCountForPeerProposed: peerState.validEncounterCount,
        previousLayerLevel: peerState.currentLayerLevel,
        nextLayerLevel: peerState.currentLayerLevel,
        nowMs,
        reason: 'cooldown_not_elapsed',
      };
    }

    const previousLayerLevel = peerState.currentLayerLevel;
    const encounterCountForPeerProposed = peerState.validEncounterCount + 1;
    const nextLayerLevel = this.computeNextLayerLevel(previousLayerLevel);
    const shouldChangeAudio = nextLayerLevel > previousLayerLevel;

    return {
      shouldTriggerEncounter: true,
      shouldChangeAudio,
      peerCode,
      peerFamily: peerState.peerFamily,
      encounterCountForPeerProposed,
      previousLayerLevel,
      nextLayerLevel,
      nowMs,
    };
  }

  commitAfterAudioSuccess(input: {
    peerCode: string;
    nowMs: number;
    nextLayerLevel: 1 | 2 | 3;
    encounterCountForPeerProposed: number;
  }): void {
    const peerCode = input.peerCode.trim().toUpperCase();
    const peerState = this.peers.get(peerCode);

    if (!peerState) {
      return;
    }

    peerState.validEncounterCount = input.encounterCountForPeerProposed;
    peerState.currentLayerLevel = input.nextLayerLevel;
    peerState.lastValidEncounterAtMs = input.nowMs;
  }

  commitNoAudioChange(input: { peerCode: string; nowMs: number; encounterCountForPeerProposed: number }): void {
    const peerCode = input.peerCode.trim().toUpperCase();
    const peerState = this.peers.get(peerCode);

    if (!peerState) {
      return;
    }

    peerState.validEncounterCount = input.encounterCountForPeerProposed;
    peerState.lastValidEncounterAtMs = input.nowMs;
  }

  private getOrCreatePeer(peerCode: string, peerFamily: SoundFamily): PeerRuntimeState {
    const existing = this.peers.get(peerCode);
    if (existing) {
      return existing;
    }

    const created: PeerRuntimeState = {
      peerFamily,
      validEncounterCount: 0,
      currentLayerLevel: 0,
      lastValidEncounterAtMs: undefined,
      recentQualifyingDetectionsMs: [],
    };
    this.peers.set(peerCode, created);
    return created;
  }

  private computeNextLayerLevel(previous: QuartetLayerLevel): QuartetLayerLevel {
    if (previous >= 3) {
      return 3;
    }

    return (previous + 1) as 1 | 2 | 3;
  }

  private parseTimestampMs(timestampIso: string): number {
    const parsed = Date.parse(timestampIso);
    return Number.isFinite(parsed) ? parsed : Date.now();
  }
}
