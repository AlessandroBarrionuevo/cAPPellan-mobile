import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Circle,
} from 'react-native-svg';
import { Theme } from '../../theme/Theme';
import type { AuthUser } from '../../types/api';

export interface ChaplainDutyCardBannerProps {
  isOnline: boolean;
  isToggling?: boolean;
  onToggle: (nextState: boolean) => void;
  user?: AuthUser | null;
}

export default function ChaplainDutyCardBanner({
  isOnline,
  isToggling = false,
  onToggle,
  user,
}: ChaplainDutyCardBannerProps) {
  const { width } = useWindowDimensions();
  const [cardWidth, setCardWidth] = useState(0);

  // Smooth sliding animation for the toggle knob
  const toggleAnim = useRef(new Animated.Value(isOnline ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(toggleAnim, {
      toValue: isOnline ? 1 : 0,
      friction: 7,
      tension: 55,
      useNativeDriver: true,
    }).start();
  }, [isOnline, toggleAnim]);

  const w = cardWidth || Math.min(width - 40, 420);
  const h = 205;
  const splitYLeft = 72;
  const splitYRight = 104;

  // Fluid S-curve dividing line between top gradient wave and bottom black face
  const wavePath = `M 0 0 L ${w} 0 L ${w} ${splitYRight} C ${w * 0.72} ${splitYRight} ${w * 0.56} ${splitYRight} ${w * 0.46} ${splitYLeft + 16} C ${w * 0.38} ${splitYLeft} ${w * 0.30} ${splitYLeft} 0 ${splitYLeft} Z`;

  // Knob moves across a 48px track (22px travel distance)
  const knobTranslate = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 22],
  });

  return (
    <View style={styles.wrapper}>
      {/* 3D Under-card Stacked Lip / Rim */}
      <View
        style={[
          styles.underCardRim,
          isOnline ? styles.underCardRimOnline : styles.underCardRimOffline,
        ]}
      />

      {/* Main Face Card */}
      <TouchableOpacity
        style={styles.cardContainer}
        onLayout={(e) => {
          const layoutWidth = e.nativeEvent.layout.width;
          if (layoutWidth > 0) setCardWidth(layoutWidth);
        }}
        onPress={() => !isToggling && onToggle(!isOnline)}
        activeOpacity={0.92}
        disabled={isToggling}
      >
        {/* Top Wave Svg with Satin Sheen Gradient */}
        {w > 0 && (
          <Svg
            style={styles.svgOverlay}
            width={w}
            height={h}
            viewBox={`0 0 ${w} ${h}`}
          >
            <Defs>
              {/* Online Green Satin Gradient */}
              <LinearGradient id="dutyGreenGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#A3E635" />
                <Stop offset="18%" stopColor="#D9F99D" />
                <Stop offset="42%" stopColor="#84CC16" />
                <Stop offset="72%" stopColor="#4ADE80" />
                <Stop offset="100%" stopColor="#15803D" />
              </LinearGradient>

              {/* Offline Gray Satin Gradient */}
              <LinearGradient id="dutyGrayGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0%" stopColor="#64748B" />
                <Stop offset="25%" stopColor="#94A3B8" />
                <Stop offset="50%" stopColor="#475569" />
                <Stop offset="82%" stopColor="#334155" />
                <Stop offset="100%" stopColor="#1E293B" />
              </LinearGradient>
            </Defs>

            {/* Stepped Wavy Section */}
            <Path
              d={wavePath}
              fill={isOnline ? 'url(#dutyGreenGrad)' : 'url(#dutyGrayGrad)'}
            />

            {/* Top-Left Overlapping Translucent Circles Emblem */}
            <Circle cx={36} cy={35} r={18} fill="rgba(255, 255, 255, 0.22)" />
            <Circle cx={52} cy={35} r={18} fill="rgba(255, 255, 255, 0.38)" />
          </Svg>
        )}

        {/* Top-Right Big Headline & Caption (Inside green / gray zone) */}
        <View style={styles.topRightContent}>
          <Text style={styles.topStatusMain} numberOfLines={1}>
            {isOnline ? 'EN GUARDIA' : 'OFFLINE'}
          </Text>
          <Text style={styles.topStatusSub} numberOfLines={1}>
            {isOnline ? 'ESTADO OPERATIVO' : 'FUERA DE TURNO'}
          </Text>
        </View>

        {/* Bottom Black Area */}
        <View style={styles.bottomRow}>
          <View style={styles.bottomTextCol}>
            <Text style={styles.bottomHeading}>
              {isOnline ? 'Guardia Pastoral' : 'Terminal Pastoral'}
            </Text>
            <Text style={styles.bottomSubheading}>
              {isOnline
                ? 'Disponible para contención y auxilio'
                : 'Tocar para iniciar guardia'}
            </Text>
          </View>

          {/* Toggle Switch matching the photo */}
          <View
            style={[
              styles.switchTrack,
              isOnline ? styles.switchTrackOnline : styles.switchTrackOffline,
            ]}
          >
            {isToggling ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Animated.View
                style={[
                  styles.switchKnob,
                  {
                    transform: [{ translateX: knobTranslate }],
                  },
                ]}
              />
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    width: '100%',
    marginTop: 14,
    marginBottom: 6,
  },
  underCardRim: {
    position: 'absolute',
    bottom: -6,
    left: 10,
    right: 10,
    height: 32,
    borderRadius: 26,
  },
  underCardRimOnline: {
    backgroundColor: '#84CC16',
    ...Platform.select({
      ios: {
        shadowColor: '#84CC16',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  underCardRimOffline: {
    backgroundColor: '#1E354D',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardContainer: {
    width: '100%',
    height: 205,
    backgroundColor: '#0F2438',
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 22,
    ...Platform.select({
      ios: {
        shadowColor: '#0F2438',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  svgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topRightContent: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    zIndex: 2,
    paddingTop: 4,
    paddingRight: 4,
  },
  topStatusMain: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 24,
    color: '#FFFFFF',
    letterSpacing: 0.6,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3,
  },
  topStatusSub: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.88)',
    letterSpacing: 1,
    marginTop: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  bottomTextCol: {
    flex: 1,
    paddingRight: 14,
  },
  bottomHeading: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  bottomSubheading: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 3,
    lineHeight: 17,
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: 'center',
  },
  switchTrackOnline: {
    backgroundColor: '#84CC16',
  },
  switchTrackOffline: {
    backgroundColor: '#1E354D',
  },
  switchKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.25,
        shadowRadius: 2.5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});
