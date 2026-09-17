import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import { ShieldCheck } from 'lucide-react-native';

interface ConfidentialityBannerProps {
  title?: string;
  description?: string;
  badge?: string;
  variant?: 'low' | 'highlight';
  style?: ViewStyle;
}

export function ConfidentialityBanner({
  title = 'Secreto Profesional & Pastoral',
  description = 'Canal cifrado de extremo a extremo y de estricta reserva pastoral, ética y confidencial para todo el personal.',
  badge,
  variant = 'low',
  style,
}: ConfidentialityBannerProps) {
  return (
    <View
      style={[
        styles.container,
        variant === 'highlight' ? styles.containerHighlight : styles.containerLow,
        style,
      ]}
    >
      <View style={styles.iconWrapper}>
        <ShieldCheck size={20} color={Theme.colors.secondary} />
      </View>
      <View style={styles.textWrapper}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{title}</Text>
          {badge ? <Text style={styles.badge}>{badge}</Text> : null}
        </View>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Theme.roundness.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  containerLow: {
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  containerHighlight: {
    backgroundColor: '#EBF1F7',
    borderWidth: 1,
    borderColor: '#D4E2F0',
  },
  iconWrapper: {
    marginRight: 10,
    marginTop: 2,
  },
  textWrapper: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  title: {
    ...globalStyles.labelCaps,
    color: Theme.colors.onSurface,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  badge: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.secondary,
  },
  description: {
    ...globalStyles.bodySm,
    fontSize: 12,
    lineHeight: 17,
    color: Theme.colors.onSurfaceVariant,
  },
});

export default ConfidentialityBanner;
