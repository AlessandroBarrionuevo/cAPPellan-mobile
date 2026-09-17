import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';

export type ButtonVariant = 'primary' | 'secondary' | 'surface' | 'outline' | 'danger';

interface TacticalButtonProps {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function TacticalButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  size = 'md',
  fullWidth = true,
}: TacticalButtonProps) {
  const getButtonStyles = () => {
    switch (variant) {
      case 'secondary':
        return [styles.secondaryButton, globalStyles.shadowSm];
      case 'surface':
        return [styles.surfaceButton];
      case 'outline':
        return [styles.outlineButton];
      case 'danger':
        return [styles.dangerButton, globalStyles.shadowSm];
      case 'primary':
      default:
        return [styles.primaryButton, globalStyles.shadowSm];
    }
  };

  const getTextStyles = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondaryText;
      case 'surface':
        return styles.surfaceText;
      case 'outline':
        return styles.outlineText;
      case 'danger':
        return styles.dangerText;
      case 'primary':
      default:
        return styles.primaryText;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return styles.sizeSm;
      case 'lg':
        return styles.sizeLg;
      case 'md':
      default:
        return styles.sizeMd;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.88}
      style={[
        styles.base,
        getSizeStyle(),
        getButtonStyles(),
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'surface' || variant === 'outline' ? Theme.colors.primary : '#FFFFFF'}
        />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon && <View style={styles.leftIconWrapper}>{leftIcon}</View>}
          <Text style={[styles.baseText, getTextStyles(), textStyle]}>
            {title}
          </Text>
          {rightIcon && <View style={styles.rightIconWrapper}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Theme.roundness.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  sizeSm: {
    height: 38,
    paddingHorizontal: 12,
  },
  sizeMd: {
    height: 48,
    paddingHorizontal: 16,
  },
  sizeLg: {
    height: 54,
    paddingHorizontal: 20,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIconWrapper: {
    marginRight: 8,
  },
  rightIconWrapper: {
    marginLeft: 8,
  },
  baseText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  primaryButton: {
    backgroundColor: Theme.colors.tacticalNavy,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: Theme.colors.secondary,
  },
  secondaryText: {
    color: '#FFFFFF',
  },
  surfaceButton: {
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  surfaceText: {
    color: Theme.colors.onSurface,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
  },
  outlineText: {
    color: Theme.colors.onSurface,
  },
  dangerButton: {
    backgroundColor: Theme.colors.error,
  },
  dangerText: {
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.6,
  },
});

export default TacticalButton;
