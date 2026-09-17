import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import { Eye, EyeOff } from 'lucide-react-native';

interface TacticalInputProps extends TextInputProps {
  label?: string;
  badgeText?: string;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
  error?: string | null;
  containerStyle?: ViewStyle;
}

export function TacticalInput({
  label,
  badgeText,
  leftIcon,
  isPassword = false,
  error,
  containerStyle,
  ...inputProps
}: TacticalInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {(label || badgeText) && (
        <View style={styles.labelRow}>
          {label && <Text style={styles.label}>{label}</Text>}
          {badgeText && <Text style={styles.badge}>{badgeText}</Text>}
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          error ? styles.inputError : null,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={styles.textInput}
          placeholderTextColor="#8A92A0"
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize="none"
          {...inputProps}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((prev) => !prev)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword ? (
              <EyeOff size={18} color={Theme.colors.secondary} />
            ) : (
              <Eye size={18} color={Theme.colors.secondary} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    ...globalStyles.labelCaps,
    color: Theme.colors.onSurfaceVariant,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  badge: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.secondary,
    backgroundColor: Theme.colors.secondaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Theme.roundness.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.md,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: Theme.colors.error,
    backgroundColor: '#FFF4F4',
  },
  leftIcon: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: Theme.colors.onSurface,
    paddingVertical: 0,
  },
  eyeButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...globalStyles.bodySm,
    color: Theme.colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default TacticalInput;
