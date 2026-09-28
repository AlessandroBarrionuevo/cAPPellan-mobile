import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import { Mail, Lock, Shield, ShieldCheck, Check, Eye, EyeOff, UserPlus } from 'lucide-react-native';
import { Theme, globalStyles } from '../theme/Theme';
import { useAuthStore } from '../lib/stores/auth';

interface LoginScreenPreviewProps {
  onSuccess?: () => void;
  onNavigateToRegister?: () => void;
  onNavigateToForgotPassword?: () => void;
}

export default function LoginScreenPreview({
  onSuccess,
  onNavigateToRegister,
  onNavigateToForgotPassword,
}: LoginScreenPreviewProps) {
  const { width } = useWindowDimensions();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Por favor ingresá tu correo o credencial y contraseña.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await login(username.trim(), password.trim());
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Credenciales inválidas o error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  const isTablet = width > 500;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          isTablet && styles.tabletContainer,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Soft Sky Background Glow */}
        <View style={styles.topBackdrop}>
          <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
            <Defs>
              <LinearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#E0EDFB" stopOpacity="0.85" />
                <Stop offset="55%" stopColor="#F0F7FF" stopOpacity="0.6" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#skyGrad)" />
          </Svg>
        </View>

        {/* Brand Tag */}
        <View style={styles.brandRow}>
          <Text style={styles.brandPowered}>powered by </Text>
          <Text style={styles.brandPowered}>c</Text>
          <Text style={styles.brandAccent}>APP</Text>
          <Text style={styles.brandPowered}>ellan</Text>
        </View>

        {/* Hero Airplane-Window Capsule with App Logo and Floating Pills */}
        <View style={styles.heroVisualArea}>
          <View style={styles.capsuleWrapper}>
            {/* Window Outer Bezel & Interior */}
            <View style={styles.windowFrame}>
              <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
                <Defs>
                  <LinearGradient id="windowBg" x1="0%" y1="0%" x2="0%" y2="100%">
                    <Stop offset="0%" stopColor="#CFE2FE" stopOpacity="0.95" />
                    <Stop offset="45%" stopColor="#E0EBFB" stopOpacity="0.9" />
                    <Stop offset="100%" stopColor="#F8FAFC" stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" rx={74} fill="url(#windowBg)" />
                <Circle cx="72" cy="60" r="48" fill="#FFFFFF" fillOpacity="0.35" />
                <Circle cx="108" cy="95" r="32" fill="#FFFFFF" fillOpacity="0.25" />
              </Svg>

              {/* Institutional Logo */}
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* Floating Badge 1 (Top Left): Fuerzas Armadas & de Seguridad */}
            <View style={[styles.floatingPill, styles.pillTopLeft]}>
              <View style={styles.pillIconBadge}>
                <Shield size={12} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <View style={styles.pillTextCol}>
                <Text style={styles.pillTitle}>Fuerzas Armadas</Text>
                <Text style={styles.pillSubtitle}>y de Seguridad</Text>
              </View>
            </View>

            {/* Floating Badge 2 (Bottom Right): Secreto Pastoral & Confidencial */}
            <View style={[styles.floatingPill, styles.pillBottomRight]}>
              <View style={styles.pillIconBadge}>
                <ShieldCheck size={13} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <View style={styles.pillTextCol}>
                <Text style={styles.pillTitle}>Secreto Pastoral</Text>
                <Text style={styles.pillSubtitle}>100% Confidencial</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Central Titles (Styled after Travel Planning Simplified) */}
        <View style={styles.headlineArea}>
          <Text style={styles.kickerText}>CAPELLANÍA EVANGÉLICA</Text>
          <Text style={styles.mainTitle}>Bienvenido{'\n'}de nuevo</Text>
          <Text style={styles.subtitle}>
            Servicio y contención espiritual para Fuerzas Armadas y de Seguridad. Ingresá tus credenciales seguras.
          </Text>
        </View>

        {/* Form Inputs (Replacing social login buttons) */}
        <View style={styles.formArea}>
          {/* Email / Credential Input */}
          <View
            style={[
              styles.inputPill,
              isUsernameFocused && styles.inputPillFocused,
              Boolean(error) && !username && styles.inputPillError,
            ]}
          >
            <View style={styles.inputIconWrapper}>
              <Mail
                size={18}
                color={isUsernameFocused ? Theme.colors.tacticalNavy : '#94A3B8'}
              />
            </View>
            <TextInput
              style={styles.textInputField}
              placeholder="Correo o credencial institucional"
              placeholderTextColor="#94A3B8"
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (error) setError(null);
              }}
              onFocus={() => setIsUsernameFocused(true)}
              onBlur={() => setIsUsernameFocused(false)}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>

          {/* Password Input */}
          <View
            style={[
              styles.inputPill,
              isPasswordFocused && styles.inputPillFocused,
              Boolean(error) && !password && styles.inputPillError,
            ]}
          >
            <View style={styles.inputIconWrapper}>
              <Lock
                size={18}
                color={isPasswordFocused ? Theme.colors.tacticalNavy : '#94A3B8'}
              />
            </View>
            <TextInput
              style={styles.textInputField}
              placeholder="Contraseña de seguridad"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError(null);
              }}
              onFocus={() => setIsPasswordFocused(true)}
              onBlur={() => setIsPasswordFocused(false)}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.eyeToggle}
              onPress={() => setShowPassword((prev) => !prev)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showPassword ? (
                <EyeOff size={18} color="#64748B" />
              ) : (
                <Eye size={18} color="#64748B" />
              )}
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Utilities: Remember & Forgot Password */}
          <View style={styles.utilsRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberDevice((prev) => !prev)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, rememberDevice && styles.checkboxActive]}>
                {rememberDevice && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <Text style={styles.rememberText}>Recordar dispositivo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onNavigateToForgotPassword}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          {/* Primary Action Button (Sleek Dark Pill) */}
          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          {/* Register Action Button (Sleek White Pill with Border) */}
          <TouchableOpacity
            style={styles.secondaryPillButton}
            onPress={onNavigateToRegister}
            activeOpacity={0.75}
          >
            <UserPlus size={16} color="#0F172A" style={styles.secondaryButtonIcon} />
            <Text style={styles.secondaryButtonText}>
              Regístrate aquí
            </Text>
          </TouchableOpacity>
        </View>

        {/* Confidentiality & Legal Footer */}
        <View style={styles.footerArea}>
          <Text style={styles.footerNote}>
            Canal cifrado de extremo a extremo y de estricta reserva pastoral.{'\n'}
            <Text style={styles.footerHighlight}>Secreto Profesional & Pastoral</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 28,
    alignItems: 'center',
  },
  tabletContainer: {
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  topBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 310,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    marginBottom: 10,
  },
  brandPowered: {
    fontFamily: Theme.fonts.headline,
    fontSize: 11,
    color: '#64748B',
    letterSpacing: 0.2,
  },
  brandAccent: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13,
    color: Theme.colors.tacticalNavy,
    letterSpacing: -0.3,
  },
  heroVisualArea: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  capsuleWrapper: {
    width: 270,
    height: 195,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  windowFrame: {
    width: 148,
    height: 184,
    borderRadius: 74,
    backgroundColor: '#EAF3FC',
    borderWidth: 5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    // Realistic smooth drop shadow
    ...Platform.select({
      ios: {
        shadowColor: '#1E293B',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.16,
        shadowRadius: 18,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  logoImage: {
    width: 82,
    height: 82,
  },
  floatingPill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 22,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  pillTopLeft: {
    top: 18,
    left: 2,
  },
  pillBottomRight: {
    bottom: 18,
    right: 2,
  },
  pillIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  pillTextCol: {
    flexDirection: 'column',
  },
  pillTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 10.5,
    color: '#0F172A',
    lineHeight: 13,
  },
  pillSubtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 9.5,
    color: '#64748B',
    lineHeight: 12,
  },
  headlineArea: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  kickerText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 11,
    color: Theme.colors.tacticalNavy,
    letterSpacing: 1.2,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  mainTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 30,
    lineHeight: 34,
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 19,
    maxWidth: 310,
  },
  formArea: {
    width: '100%',
    marginTop: 4,
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  inputPillFocused: {
    borderColor: Theme.colors.tacticalNavy,
    backgroundColor: '#FFFFFF',
  },
  inputPillError: {
    borderColor: Theme.colors.error,
    backgroundColor: '#FFF8F8',
  },
  inputIconWrapper: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInputField: {
    flex: 1,
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  eyeToggle: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  errorText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
  },
  utilsRow: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 17,
    height: 17,
    borderRadius: 4,
    borderWidth: 1.2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  checkboxActive: {
    backgroundColor: Theme.colors.tacticalNavy,
    borderColor: Theme.colors.tacticalNavy,
  },
  rememberText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#64748B',
  },
  forgotText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: Theme.colors.tacticalNavy,
  },
  primaryButton: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  secondaryPillButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  secondaryButtonIcon: {
    marginRight: 8,
  },
  secondaryButtonText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13.5,
    color: '#0F172A',
  },
  footerArea: {
    marginTop: 8,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  footerNote: {
    fontFamily: Theme.fonts.body,
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
  },
  footerHighlight: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#475569',
  },
});
