import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import { MessageCircle, BookOpen, PhoneCall } from 'lucide-react-native';
import { Theme } from '../../theme/Theme';

/**
 * Toggle this flag to `false` to bypass the startup preloader at any time.
 */
export const ENABLE_APP_PRELOADER = true;

interface AppPreloaderProps {
  /** Whether app or dashboard resources are ready */
  isAppReady: boolean;
  /** Whether custom fonts have finished loading (defaults to true for post-boot screens) */
  fontsLoaded?: boolean;
  /** Optional subtitle below the cAPPellan brand mark */
  subtitle?: string;
  /** Called after the exit fade animation completes */
  onFinish: () => void;
}

const MORPH_STAGES = [
  {
    key: 'chat',
    label: 'Acompañamiento por Chat',
    Icon: MessageCircle,
    accent: '#0C7AE0',
    glow: 'rgba(12, 122, 224, 0.16)',
  },
  {
    key: 'bible',
    label: 'Palabra y Reflexión',
    Icon: BookOpen,
    accent: '#1E40AF',
    glow: 'rgba(30, 64, 175, 0.16)',
  },
  {
    key: 'call',
    label: 'Llamada de Contención 24h',
    Icon: PhoneCall,
    accent: '#0284C7',
    glow: 'rgba(2, 132, 199, 0.16)',
  },
] as const;

const STAGE_DURATION_MS = 720;

export function AppPreloader({
  isAppReady,
  fontsLoaded = true,
  subtitle = 'CAPELLANÍA EVANGÉLICA',
  onFinish,
}: AppPreloaderProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const [minCycleCompleted, setMinCycleCompleted] = useState(false);

  useEffect(() => {
    if (!ENABLE_APP_PRELOADER) {
      onFinish();
    }
  }, [onFinish]);

  // Morph animations for the active icon & capsule
  const iconScale = useRef(new Animated.Value(0.5)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const capsuleMorph = useRef(new Animated.Value(0)).current;

  // Expanding pulse wave on each morph
  const rippleScale = useRef(new Animated.Value(0.85)).current;
  const rippleOpacity = useRef(new Animated.Value(0.6)).current;

  // Continuous orbital ring rotation
  const orbitRotation = useRef(new Animated.Value(0)).current;

  // Overall screen fade out when ready
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenScale = useRef(new Animated.Value(1)).current;
  const hasStartedExit = useRef(false);

  // Run continuous orbital ring animation
  useEffect(() => {
    const orbitLoop = Animated.loop(
      Animated.timing(orbitRotation, {
        toValue: 1,
        duration: 4200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    orbitLoop.start();
    return () => orbitLoop.stop();
  }, [orbitRotation]);

  // Animate each icon morph stage (Chat -> Biblia -> Llamada)
  useEffect(() => {
    iconScale.setValue(0.42);
    iconRotate.setValue(-1);
    iconOpacity.setValue(0);
    rippleScale.setValue(0.85);
    rippleOpacity.setValue(0.55);

    Animated.parallel([
      Animated.spring(iconScale, {
        toValue: 1,
        friction: 6,
        tension: 95,
        useNativeDriver: true,
      }),
      Animated.timing(iconRotate, {
        toValue: 0,
        duration: 340,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(capsuleMorph, {
        toValue: stageIndex,
        duration: 360,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rippleScale, {
        toValue: 1.48,
        duration: STAGE_DURATION_MS - 60,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: STAGE_DURATION_MS - 60,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [stageIndex, iconScale, iconRotate, iconOpacity, capsuleMorph, rippleScale, rippleOpacity]);

  // Cycle through stages and track when all 3 icons (Chat, Biblia, Llamada) have been shown
  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => {
        const next = (prev + 1) % MORPH_STAGES.length;
        if (prev === MORPH_STAGES.length - 1) {
          setMinCycleCompleted(true);
        }
        return next;
      });
    }, STAGE_DURATION_MS);

    return () => clearInterval(interval);
  }, []);

  // Smooth exit once app resources are loaded AND at least one full morph cycle finished
  useEffect(() => {
    if (isAppReady && minCycleCompleted && !hasStartedExit.current) {
      hasStartedExit.current = true;
      Animated.parallel([
        Animated.timing(screenOpacity, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(screenScale, {
          toValue: 1.04,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        onFinish();
      });
    }
  }, [isAppReady, minCycleCompleted, screenOpacity, screenScale, onFinish]);

  const currentStage = MORPH_STAGES[stageIndex];
  const ActiveIcon = currentStage.Icon;

  const rotateInterpolate = iconRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-28deg', '0deg', '28deg'],
  });

  const orbitRotateInterpolate = orbitRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const capsuleRotateInterpolate = capsuleMorph.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '45deg', '90deg'],
  });

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          opacity: screenOpacity,
          transform: [{ scale: screenScale }],
        },
      ]}
    >
      {/* Soft Sky Gradient Background */}
      <View style={StyleSheet.absoluteFill}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="preloaderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#E0EDFB" stopOpacity="0.95" />
              <Stop offset="50%" stopColor="#F5F9FF" stopOpacity="0.98" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#preloaderGrad)" />
        </Svg>
      </View>

      <View style={styles.centerContent}>
        {/* Morphing Icon Stage Area */}
        <View style={styles.morphStageWrapper}>
          {/* Expanding Ripple Ring */}
          <Animated.View
            style={[
              styles.rippleRing,
              {
                borderColor: currentStage.accent,
                opacity: rippleOpacity,
                transform: [{ scale: rippleScale }],
              },
            ]}
          />

          {/* Continuous Orbital SVG Ring */}
          <Animated.View
            style={[
              styles.orbitRing,
              { transform: [{ rotate: orbitRotateInterpolate }] },
            ]}
          >
            <Svg width={124} height={124} viewBox="0 0 124 124">
              <Circle
                cx="62"
                cy="62"
                r="56"
                stroke={currentStage.accent}
                strokeWidth="2"
                strokeDasharray="18 12"
                strokeLinecap="round"
                fill="none"
                opacity={0.35}
              />
            </Svg>
          </Animated.View>

          {/* Morphing Squircle Backdrop */}
          <Animated.View
            style={[
              styles.morphSquircle,
              {
                backgroundColor: currentStage.glow,
                transform: [{ rotate: capsuleRotateInterpolate }],
              },
            ]}
          />

          {/* Main Elevated Icon Capsule */}
          <View style={[styles.iconCapsule, { borderColor: currentStage.glow }]}>
            <Animated.View
              style={{
                opacity: iconOpacity,
                transform: [
                  { scale: iconScale },
                  { rotate: rotateInterpolate },
                ],
              }}
            >
              <ActiveIcon size={38} color={currentStage.accent} strokeWidth={2.2} />
            </Animated.View>
          </View>
        </View>

        {/* Stage Step Indicators (Chat -> Biblia -> Llamada) */}
        <View style={styles.dotsRow}>
          {MORPH_STAGES.map((stage, idx) => {
            const isActive = idx === stageIndex;
            return (
              <View
                key={stage.key}
                style={[
                  styles.stageDot,
                  isActive && [
                    styles.stageDotActive,
                    { backgroundColor: currentStage.accent },
                  ],
                ]}
              />
            );
          })}
        </View>

        {/* Dynamic Stage Label */}
        <Text
          style={[
            styles.stageLabel,
            fontsLoaded && { fontFamily: Theme.fonts.bodySemiBold },
            { color: currentStage.accent },
          ]}
        >
          {currentStage.label}
        </Text>

        {/* Institutional Branding */}
        <View style={styles.brandBlock}>
          <View style={styles.brandWordRow}>
            <Text
              style={[
                styles.brandPrefix,
                fontsLoaded && { fontFamily: Theme.fonts.headline },
              ]}
            >
              c
            </Text>
            <Text
              style={[
                styles.brandAccent,
                fontsLoaded && { fontFamily: Theme.fonts.headlineBold },
              ]}
            >
              APP
            </Text>
            <Text
              style={[
                styles.brandPrefix,
                fontsLoaded && { fontFamily: Theme.fonts.headline },
              ]}
            >
              ellan
            </Text>
          </View>
          <Text
            style={[
              styles.brandSub,
              fontsLoaded && { fontFamily: Theme.fonts.body },
            ]}
          >
            {subtitle}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  morphStageWrapper: {
    width: 132,
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  rippleRing: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
  },
  orbitRing: {
    position: 'absolute',
    width: 124,
    height: 124,
    alignItems: 'center',
    justifyContent: 'center',
  },
  morphSquircle: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 28,
  },
  iconCapsule: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 10,
  },
  stageDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#CBD5E1',
  },
  stageDotActive: {
    width: 22,
  },
  stageLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 28,
    textAlign: 'center',
  },
  brandBlock: {
    alignItems: 'center',
  },
  brandWordRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandPrefix: {
    fontSize: 22,
    fontWeight: '600',
    color: '#0F172A',
  },
  brandAccent: {
    fontSize: 25,
    fontWeight: '800',
    color: '#0C7AE0',
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.8,
    color: '#64748B',
    marginTop: 4,
  },
});

export default AppPreloader;
