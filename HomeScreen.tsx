import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Theme, globalStyles } from './src/theme/Theme';
import { Video, AlertCircle } from 'lucide-react-native';
import { useCallStore } from './src/lib/stores/call';

export default function HomeScreen({
  onNavigateToBible,
  onNavigateToContent,
  onRequestCall,
}: {
  onNavigateToBible: () => void;
  onNavigateToContent: () => void;
  onRequestCall?: () => void;
}) {
  const callStatus = useCallStore((state) => state.callStatus);
  const error = useCallStore((state) => state.error);
  const requestCall = useCallStore((state) => state.requestCall);

  const handlePressCall = async () => {
    if (onRequestCall) {
      onRequestCall();
    } else {
      await requestCall();
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Abstract serene background visualization */}
      <View style={styles.heroBackground}>
        <View style={[styles.gradientBubble, { backgroundColor: '#e2f0fd', top: -50, left: -50 }]} />
        <View style={[styles.gradientBubble, { backgroundColor: '#e6fffa', bottom: -50, right: -50 }]} />
      </View>

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Peace be with you.</Text>
        <Text style={styles.heroSubtitle}>
          You are in a safe space. A chaplain is ready to listen and support you whenever you need.
        </Text>

        {error && (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color={Theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.primaryButton, globalStyles.shadowSoft, callStatus === 'REQUESTING' && { opacity: 0.7 }]} 
          activeOpacity={0.8}
          onPress={handlePressCall}
          disabled={callStatus === 'REQUESTING'}
        >
          {callStatus === 'REQUESTING' ? (
            <ActivityIndicator color={Theme.colors.onPrimary} style={styles.buttonIcon} />
          ) : (
            <Video stroke={Theme.colors.secondary} strokeWidth={2.5} size={24} style={styles.buttonIcon} />
          )}
          <Text style={styles.primaryButtonText}>
            {callStatus === 'REQUESTING' ? 'Connecting...' : 'Talk to a Chaplain Now'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Availability Card */}
      <View style={[styles.availabilityCard, globalStyles.shadowSoft]}>
        <View style={styles.pulseContainer}>
          <View style={styles.pulseDot} />
        </View>
        <View style={styles.availabilityTextContainer}>
          <Text style={styles.availabilityTitle}>Chaplains Available</Text>
          <Text style={styles.availabilitySubtitle}>Estimated wait time: &lt; 2 mins</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  contentContainer: {
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingTop: Theme.spacing.stackLg,
    paddingBottom: 100,
    minHeight: '100%',
    justifyContent: 'center',
  },
  heroBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
    overflow: 'hidden',
  },
  gradientBubble: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.7,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Theme.spacing.sectionGap,
    zIndex: 10,
  },
  heroTitle: {
    ...globalStyles.displayLg,
    textAlign: 'center',
    marginBottom: Theme.spacing.stackSm,
  },
  heroSubtitle: {
    ...globalStyles.bodyLg,
    textAlign: 'center',
    marginBottom: Theme.spacing.stackLg,
    color: Theme.colors.onSurfaceVariant,
    paddingHorizontal: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEAEA',
    borderRadius: Theme.roundness.lg,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    maxWidth: 400,
  },
  errorText: {
    ...globalStyles.bodySm,
    color: Theme.colors.error,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: Theme.roundness.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 12,
  },
  primaryButtonText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 18,
    color: Theme.colors.onPrimary,
  },
  availabilityCard: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.roundness.xl,
    borderWidth: 1,
    borderColor: '#E7EEFF',
    padding: Theme.spacing.stackMd,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 400,
    zIndex: 10,
  },
  pulseContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.colors.secondary,
  },
  availabilityTextContainer: {
    marginLeft: 12,
  },
  availabilityTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    lineHeight: 24,
    color: Theme.colors.primary,
  },
  availabilitySubtitle: {
    ...globalStyles.bodySm,
    color: Theme.colors.onSurfaceVariant,
  },
});
