import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';

interface TacticalCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'lowest' | 'low' | 'high' | 'accentBorder';
  padding?: number;
}

export function TacticalCard({
  children,
  style,
  variant = 'lowest',
  padding = 16,
}: TacticalCardProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'low':
        return styles.cardLow;
      case 'high':
        return styles.cardHigh;
      case 'accentBorder':
        return styles.cardAccent;
      case 'lowest':
      default:
        return styles.cardLowest;
    }
  };

  return (
    <View
      style={[
        styles.base,
        globalStyles.shadowSm,
        getVariantStyle(),
        { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Theme.roundness.xl,
    width: '100%',
    overflow: 'hidden',
  },
  cardLowest: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
  },
  cardLow: {
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  cardHigh: {
    backgroundColor: Theme.colors.surfaceContainerHigh,
  },
  cardAccent: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderLeftWidth: 4,
    borderLeftColor: Theme.colors.tacticalNavy,
  },
});

export default TacticalCard;
