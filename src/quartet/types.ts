// Copyright 2026 Siyi Xia
// SPDX-License-Identifier: Apache-2.0

export type PrototypeMode = 'legacy' | 'quartet';

export type SoundFamily = 'S1' | 'S2' | 'S3' | 'S4';

export type LayerLevel = 0 | 1 | 2 | 3;

export type QuartetAssetId =
  | 'S1-L1'
  | 'S1-L2'
  | 'S1-L3'
  | 'S2-L1'
  | 'S2-L2'
  | 'S2-L3'
  | 'S3-L1'
  | 'S3-L2'
  | 'S3-L3'
  | 'S4-L1'
  | 'S4-L2'
  | 'S4-L3';

export type QuartetSoundId =
  | 'S1_L1'
  | 'S1_L2'
  | 'S1_L3'
  | 'S2_L1'
  | 'S2_L2'
  | 'S2_L3'
  | 'S3_L1'
  | 'S3_L2'
  | 'S3_L3'
  | 'S4_L1'
  | 'S4_L2'
  | 'S4_L3';

export type QuartetSoundState = Record<SoundFamily, LayerLevel>;

export type QuartetLogEventType =
  | 'BASE_LAYER_INITIALIZED'
  | 'REMOTE_LAYER_ADDED'
  | 'REMOTE_LAYER_UPGRADED'
  | 'REMOTE_REENCOUNTER_NO_AUDIO_CHANGE';

export interface QuartetLogEventBase {
  eventType: QuartetLogEventType;
  timestampMs: number;
  timestampIso: string;
  localParticipantCode: string;
  localDisplayName?: string | null;
  soundStateAfter: QuartetSoundState;
  activeAssetsAfter: QuartetAssetId[];
}

export interface QuartetBaseLayerInitializedEvent extends QuartetLogEventBase {
  eventType: 'BASE_LAYER_INITIALIZED';
  soundFamily: SoundFamily;
  layerLevel: 3;
  assetId: QuartetAssetId;
  soundId: QuartetSoundId;
}

export interface QuartetRemoteLayerAddedEvent extends QuartetLogEventBase {
  eventType: 'REMOTE_LAYER_ADDED';
  peerParticipantCode: string;
  peerSoundFamily: SoundFamily;
  encounterCountForPeer: number;
  layerLevel: 1;
  assetId: QuartetAssetId;
  soundId: QuartetSoundId;
}

export interface QuartetRemoteLayerUpgradedEvent extends QuartetLogEventBase {
  eventType: 'REMOTE_LAYER_UPGRADED';
  peerParticipantCode: string;
  peerSoundFamily: SoundFamily;
  encounterCountForPeer: number;
  previousLayerLevel: 1 | 2;
  layerLevel: 2 | 3;
  previousAssetId: QuartetAssetId;
  assetId: QuartetAssetId;
  soundId: QuartetSoundId;
}

export interface QuartetRemoteReencounterNoAudioChangeEvent extends QuartetLogEventBase {
  eventType: 'REMOTE_REENCOUNTER_NO_AUDIO_CHANGE';
  peerParticipantCode: string;
  peerSoundFamily: SoundFamily;
  encounterCountForPeer: number;
  layerLevel: 3;
  assetId: QuartetAssetId;
  soundId: QuartetSoundId;
}

export type QuartetLogEvent =
  | QuartetBaseLayerInitializedEvent
  | QuartetRemoteLayerAddedEvent
  | QuartetRemoteLayerUpgradedEvent
  | QuartetRemoteReencounterNoAudioChangeEvent;

export interface SoundStateTimelineEntry {
  timestampMs: number;
  timestampIso: string;
  reason: QuartetLogEventType;
  soundState: QuartetSoundState;
  activeAssets: QuartetAssetId[];
}

export interface PeerQuartetState {
  peerCode: string;
  peerSoundFamily: SoundFamily;
  lastSeenAtMs?: number;
  lastValidEncounterAtMs?: number;
  validEncounterCount: number;
  currentLayerLevel: LayerLevel;
  isCurrentlyNearby: boolean;
}
