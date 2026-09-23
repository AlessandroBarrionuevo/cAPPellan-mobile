/**
 * Cloudflare Video Viewport Component
 * Renders WebRTC MediaStream using native RTCView.
 */

import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { RTCView, MediaStream } from '../webrtc/webrtcDriver';

export interface CloudflareVideoViewProps {
  stream: MediaStream | null;
  mirror?: boolean;
  objectFit?: 'contain' | 'cover';
  zOrder?: number;
  style?: StyleProp<ViewStyle>;
}

export const CloudflareVideoView: React.FC<CloudflareVideoViewProps> = ({
  stream,
  mirror = false,
  objectFit = 'cover',
  zOrder = 0,
  style,
}) => {
  if (!stream) {
    return <View style={[styles.fallback, style]} />;
  }

  const streamURL = stream.toURL();

  return (
    <RTCView
      streamURL={streamURL}
      mirror={mirror}
      objectFit={objectFit}
      zOrder={zOrder}
      style={[styles.video, style]}
    />
  );
};

const styles = StyleSheet.create({
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  fallback: {
    backgroundColor: '#0F172A',
  },
});
