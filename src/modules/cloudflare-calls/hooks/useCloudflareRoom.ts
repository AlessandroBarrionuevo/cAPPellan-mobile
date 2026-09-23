/**
 * React Hook for Cloudflare Calls Room
 * Manages media streams, call timers, audio/video toggles, and peer lifecycle.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { CloudflarePeerManager } from '../webrtc/peerManager';
import type { MediaStream } from '../webrtc/webrtcDriver';
import type { CloudflareCallsConfig, CallsConnectionState } from '../types';

export interface UseCloudflareRoomOptions {
  config: CloudflareCallsConfig;
  initialVideo?: boolean;
  onCallEnded?: () => void;
}

export function useCloudflareRoom({
  config,
  initialVideo = false,
  onCallEnded,
}: UseCloudflareRoomOptions) {
  const [connectionState, setConnectionState] = useState<CallsConnectionState>('idle');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(initialVideo);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const managerRef = useRef<CloudflarePeerManager | null>(null);
  const isEndingRef = useRef(false);

  // Call duration counter when connected
  useEffect(() => {
    let timer: any = null;
    if (connectionState === 'connected') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [connectionState]);

  // Initialize CloudflarePeerManager
  useEffect(() => {
    const manager = new CloudflarePeerManager(config, {
      onConnectionStateChange: (state) => {
        setConnectionState(state);
        if (state === 'disconnected' && !isEndingRef.current) {
          isEndingRef.current = true;
          onCallEnded?.();
        }
      },
      onLocalStream: (stream) => {
        setLocalStream(stream);
      },
      onRemoteStream: (stream) => {
        setRemoteStream(stream);
      },
      onError: (err) => {
        console.warn('[Cloudflare Calls] Room error:', err);
        setError(err.message || 'Error en la conexión con Cloudflare Calls');
      },
      onRemoteSpeakingChange: (speaking) => {
        setIsRemoteSpeaking(speaking);
      },
    });

    managerRef.current = manager;
    manager.start(initialVideo);

    return () => {
      manager.close();
      managerRef.current = null;
    };
  }, [config.appId, config.token, config.apiUrl]);

  const toggleMicrophone = useCallback(async () => {
    if (!managerRef.current) return;
    const nextState = !isMicrophoneEnabled;
    await managerRef.current.setMicrophoneEnabled(nextState);
    setIsMicrophoneEnabled(nextState);
  }, [isMicrophoneEnabled]);

  const toggleCamera = useCallback(async () => {
    if (!managerRef.current) return;
    const nextState = !isCameraEnabled;
    const result = await managerRef.current.setCameraEnabled(nextState);
    setIsCameraEnabled(result);
  }, [isCameraEnabled]);

  const flipCamera = useCallback(async () => {
    if (!managerRef.current) return;
    const newFacing = await managerRef.current.flipCamera();
    setFacingMode(newFacing);
  }, []);

  const endCall = useCallback(() => {
    if (isEndingRef.current) return;
    isEndingRef.current = true;

    if (managerRef.current) {
      managerRef.current.close();
    }

    onCallEnded?.();
  }, [onCallEnded]);

  const hasRemoteVideo = useMemo(() => {
    if (!remoteStream) return false;
    const videoTracks = remoteStream.getVideoTracks();
    return videoTracks.length > 0 && videoTracks[0].enabled;
  }, [remoteStream]);

  const hasLocalVideo = useMemo(() => {
    if (!localStream) return false;
    const videoTracks = localStream.getVideoTracks();
    return isCameraEnabled && videoTracks.length > 0 && videoTracks[0].enabled;
  }, [localStream, isCameraEnabled]);

  return {
    connectionState,
    localStream,
    remoteStream,
    hasRemoteVideo,
    hasLocalVideo,
    isMicrophoneEnabled,
    isCameraEnabled,
    facingMode,
    isRemoteSpeaking,
    callDuration,
    error,
    toggleMicrophone,
    toggleCamera,
    flipCamera,
    endCall,
  };
}
