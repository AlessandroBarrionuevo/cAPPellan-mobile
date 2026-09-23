/**
 * Cloudflare Calls Peer Connection Manager
 * Manages WebRTC negotiation, local media devices, track publishing, and remote track reception.
 */

import {
  RTCPeerConnection,
  mediaDevices,
  MediaStream,
  RTCSessionDescription,
} from './webrtcDriver';
import { CallsApi } from '../api/callsApi';
import type {
  CloudflareCallsConfig,
  CallsConnectionState,
  TrackObject,
} from '../types';

export interface PeerManagerCallbacks {
  onConnectionStateChange: (state: CallsConnectionState) => void;
  onLocalStream: (stream: MediaStream) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onError: (error: Error) => void;
  onRemoteSpeakingChange?: (isSpeaking: boolean) => void;
}

export class CloudflarePeerManager {
  private config: CloudflareCallsConfig;
  private api: CallsApi;
  private callbacks: PeerManagerCallbacks;

  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private sessionId: string | null = null;

  private isMicEnabled = true;
  private isCamEnabled = false;
  private facingMode: 'user' | 'environment' = 'user';
  private isDestroyed = false;

  constructor(config: CloudflareCallsConfig, callbacks: PeerManagerCallbacks) {
    this.config = config;
    this.api = new CallsApi(config);
    this.callbacks = callbacks;
  }

  /**
   * Initializes local media and connects to Cloudflare Calls
   */
  async start(initialVideo = false): Promise<void> {
    try {
      this.callbacks.onConnectionStateChange('connecting');
      this.isCamEnabled = initialVideo;

      // 1. Acquire local audio (and optional video) stream
      const stream = (await mediaDevices.getUserMedia({
        audio: true,
        video: initialVideo
          ? {
              facingMode: this.facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 24 },
            }
          : false,
      })) as unknown as MediaStream;

      if (this.isDestroyed) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      this.localStream = stream;
      this.callbacks.onLocalStream(stream);

      // 2. Setup RTCPeerConnection with Cloudflare Anycast STUN
      const iceServers = this.config.iceServers || [
        { urls: 'stun:stun.cloudflare.com:3478' },
      ];

      this.pc = new RTCPeerConnection({
        iceServers,
        iceTransportPolicy: 'all',
      });

      this.remoteStream = new MediaStream();
      this.callbacks.onRemoteStream(this.remoteStream);

      // 3. Handle remote incoming tracks
      this.pc.ontrack = (event: any) => {
        if (event.streams && event.streams[0]) {
          const stream = event.streams[0] as MediaStream;
          this.remoteStream = stream;
          this.callbacks.onRemoteStream(stream);
        } else if (event.track) {
          if (!this.remoteStream) {
            this.remoteStream = new MediaStream();
          }
          this.remoteStream.addTrack(event.track);
          this.callbacks.onRemoteStream(this.remoteStream);
        }
      };

      // 4. Handle ICE and connection state changes
      this.pc.onconnectionstatechange = () => {
        if (!this.pc) return;
        const state = this.pc.connectionState;
        switch (state) {
          case 'connected':
            this.callbacks.onConnectionStateChange('connected');
            break;
          case 'connecting':
            this.callbacks.onConnectionStateChange('connecting');
            break;
          case 'disconnected':
            this.callbacks.onConnectionStateChange('reconnecting');
            break;
          case 'failed':
            this.callbacks.onConnectionStateChange('failed');
            break;
          case 'closed':
            this.callbacks.onConnectionStateChange('disconnected');
            break;
        }
      };

      // 5. Add local tracks to RTCPeerConnection
      stream.getTracks().forEach((track) => {
        if (this.pc && this.localStream) {
          this.pc.addTrack(track, this.localStream);
        }
      });

      // 6. Create initial Offer SDP
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await this.pc.setLocalDescription(offer);

      // Wait briefly for ICE gathering completion or proceed with current SDP
      await this.waitForIceGathering();

      const offerSdp = this.pc.localDescription?.sdp || offer.sdp;

      // 7. Negotiate session with Cloudflare Calls REST API
      const sessionResponse = await this.api.createSession(offerSdp);
      this.sessionId = sessionResponse.sessionId;

      const remoteDesc = new RTCSessionDescription({
        type: sessionResponse.sessionDescription.type,
        sdp: sessionResponse.sessionDescription.sdp,
      });
      await this.pc.setRemoteDescription(remoteDesc);

      // 8. Register published tracks on Cloudflare Calls
      const localTracksToRegister: TrackObject[] = [];
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        localTracksToRegister.push({
          location: 'local',
          trackName: 'audio',
        });
      }
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        localTracksToRegister.push({
          location: 'local',
          trackName: 'video',
        });
      }

      if (localTracksToRegister.length > 0 && this.sessionId) {
        try {
          await this.api.addTracks(this.sessionId, localTracksToRegister);
        } catch (err) {
          console.warn('[Cloudflare Calls] Initial track publish warning:', err);
        }
      }
    } catch (err: any) {
      if (!this.isDestroyed) {
        this.callbacks.onConnectionStateChange('failed');
        this.callbacks.onError(err);
      }
    }
  }

  /**
   * Waits for ICE gathering to reach completion or timeout (max 1000ms)
   */
  private waitForIceGathering(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.pc || this.pc.iceGatheringState === 'complete') {
        resolve();
        return;
      }

      const checkState = () => {
        if (!this.pc || this.pc.iceGatheringState === 'complete') {
          cleanup();
          resolve();
        }
      };

      const timer = setTimeout(() => {
        cleanup();
        resolve();
      }, 1200);

      const cleanup = () => {
        clearTimeout(timer);
        if (this.pc) {
          this.pc.onicegatheringstatechange = null;
        }
      };

      if (this.pc) {
        this.pc.onicegatheringstatechange = checkState;
      }
    });
  }

  /**
   * Toggles microphone mute/unmute
   */
  async setMicrophoneEnabled(enabled: boolean): Promise<boolean> {
    if (!this.localStream) return false;
    const audioTracks = this.localStream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = enabled;
    });
    this.isMicEnabled = enabled;
    return this.isMicEnabled;
  }

  /**
   * Toggles camera on/off
   */
  async setCameraEnabled(enabled: boolean): Promise<boolean> {
    if (!this.localStream || !this.pc) return false;

    if (!enabled) {
      // Disable existing video tracks
      const videoTracks = this.localStream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = false;
        track.stop();
        this.localStream?.removeTrack(track);
      });
      this.isCamEnabled = false;
      return false;
    }

    // Enable / acquire video track
    try {
      const videoStream = (await mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: this.facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 24 },
        },
      })) as unknown as MediaStream;

      const newVideoTrack = videoStream.getVideoTracks()[0];
      if (newVideoTrack && this.localStream) {
        this.localStream.addTrack(newVideoTrack);
        this.pc.addTrack(newVideoTrack, this.localStream);

        // Renegotiate track with Cloudflare Calls if session exists
        if (this.sessionId) {
          const offer = await this.pc.createOffer();
          await this.pc.setLocalDescription(offer);
          await this.waitForIceGathering();

          const offerSdp = this.pc.localDescription?.sdp || offer.sdp;
          const trackRes = await this.api.addTracks(
            this.sessionId,
            [{ location: 'local', trackName: 'video' }],
            offerSdp
          );

          if (trackRes.sessionDescription) {
            await this.pc.setRemoteDescription(
              new RTCSessionDescription({
                type: trackRes.sessionDescription.type,
                sdp: trackRes.sessionDescription.sdp,
              })
            );
          }
        }

        this.callbacks.onLocalStream(this.localStream);
        this.isCamEnabled = true;
        return true;
      }
    } catch (err: any) {
      console.warn('[Cloudflare Calls] Failed to enable camera:', err);
    }

    return this.isCamEnabled;
  }

  /**
   * Flips between front and back cameras
   */
  async flipCamera(): Promise<'user' | 'environment'> {
    const nextFacing = this.facingMode === 'user' ? 'environment' : 'user';

    const videoTrack = this.localStream?.getVideoTracks()[0];
    if (videoTrack && typeof (videoTrack as any)._switchCamera === 'function') {
      (videoTrack as any)._switchCamera();
      this.facingMode = nextFacing;
      return this.facingMode;
    }

    // Fallback: recreate track with next facing mode
    if (this.isCamEnabled) {
      this.facingMode = nextFacing;
      await this.setCameraEnabled(false);
      await this.setCameraEnabled(true);
    } else {
      this.facingMode = nextFacing;
    }

    return this.facingMode;
  }

  /**
   * Closes and cleans up all media streams and WebRTC connections
   */
  close(): void {
    this.isDestroyed = true;

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      this.remoteStream = null;
    }

    if (this.pc) {
      try {
        this.pc.close();
      } catch {
        // ignore
      }
      this.pc = null;
    }

    this.sessionId = null;
    this.callbacks.onConnectionStateChange('disconnected');
  }

  getMicrophoneEnabled(): boolean {
    return this.isMicEnabled;
  }

  getCameraEnabled(): boolean {
    return this.isCamEnabled;
  }

  getFacingMode(): 'user' | 'environment' {
    return this.facingMode;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }
}
