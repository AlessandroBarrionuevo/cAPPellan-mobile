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
} from 'react-native';
import { Theme, globalStyles } from '../theme/Theme';
import { useAuthStore } from '../lib/stores/auth';
import {
  InstitutionalEmblem,
  TacticalInput,
  TacticalButton,
  TacticalCard,
  ConfidentialityBanner,
} from '../components/common';
import { Mail, Lock, ShieldCheck, Check, AlertCircle } from 'lucide-react-native';

interface LoginScreenProps {
  onSuccess?: () => void;
  onNavigateToRegister?: () => void;
  onNavigateToForgotPassword?: () => void;
}

interface LoginFieldErrors {
  username?: string;
  password?: string;
}

export default function LoginScreen({
  onSuccess,
  onNavigateToRegister,
  onNavigateToForgotPassword,
}: LoginScreenProps) {
  const { width } = useWindowDimensions();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    const nextFieldErrors: LoginFieldErrors = {};
    if (!username.trim()) {
      nextFieldErrors.username = 'Ingresá tu correo o credencial institucional.';
    }
    if (!password.trim()) {
      nextFieldErrors.password = 'Ingresá tu contraseña de seguridad.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setAuthError(null);
      return;
    }

    setFieldErrors({});
    setAuthError(null);
    setLoading(true);
    try {
      await login(username.trim(), password.trim());
      onSuccess?.();
    } catch (err: any) {
      setAuthError(
        err.message ||
          'El usuario o la contraseña ingresados son incorrectos. Verificá tus datos e intentá nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isTablet = width > 500;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          isTablet && styles.tabletContainer,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Emblem & Institutional Branding */}
        <View style={styles.headerArea}>
          <View style={[styles.emblemWrapper, globalStyles.shadowSm]}>
            <InstitutionalEmblem size={68} />
          </View>
          <View style={styles.secondTitleRow}>
            <Text style={styles.titlePrefix}>powered by </Text>
            <Text style={styles.titlePrefix}>c</Text>
            <Text style={styles.titleAux}>APP</Text>
            <Text style={styles.titleSuffix}>ellan</Text>
          </View>
          <View style={styles.titleRow}>
            <Text style={styles.titleApp}>Capellania Evangelica</Text>
          </View>
          
          <Text style={styles.subtitle}>
            Servicio y Contención Espiritual para Fuerzas Armadas y de Seguridad
          </Text>
        </View>

        {/* Main Login Card */}
        <TacticalCard style={styles.loginCard} padding={22}>
          <Text style={styles.cardTitle}>Bienvenido de nuevo</Text>
          <Text style={styles.cardSubtitle}>
            Ingresá tus credenciales seguras para acceder a tu espacio de acompañamiento y contención.
          </Text>

          {/* Input: Correo o Credencial */}
          <TacticalInput
            label="CORREO ELECTRÓNICO O CREDENCIAL"
            placeholder="Ej. nombre@gmail.com o legajo"
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (fieldErrors.username) {
                setFieldErrors((prev) => ({ ...prev, username: undefined }));
              }
              if (authError) setAuthError(null);
            }}
            leftIcon={
              <Mail
                size={18}
                color={fieldErrors.username || authError ? Theme.colors.error : Theme.colors.secondary}
              />
            }
            error={fieldErrors.username}
            hasErrorBorder={Boolean(authError)}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Input: Contraseña */}
          <TacticalInput
            label="CONTRASEÑA DE SEGURIDAD"
            placeholder="••••••••••••"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (fieldErrors.password) {
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }
              if (authError) setAuthError(null);
            }}
            isPassword
            leftIcon={
              <Lock
                size={18}
                color={fieldErrors.password || authError ? Theme.colors.error : Theme.colors.secondary}
              />
            }
            error={fieldErrors.password}
            hasErrorBorder={Boolean(authError)}
          />

          {/* Form-level Authentication / Server Error Banner */}
          {authError ? (
            <View style={styles.errorBanner}>
              <View style={styles.errorBannerIconWrap}>
                <AlertCircle size={18} color="#DC2626" />
              </View>
              <View style={styles.errorBannerContent}>
                <Text style={styles.errorBannerTitle}>No se pudo iniciar sesión</Text>
                <Text style={styles.errorBannerText}>{authError}</Text>
              </View>
            </View>
          ) : null}

          {/* Utilities: Remember Device & Forgot Password */}
          <View style={styles.utilsRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberDevice((prev) => !prev)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, rememberDevice && styles.checkboxActive]}>
                {rememberDevice && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <Text style={styles.rememberText}>Recordar dispositivo seguro</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onNavigateToForgotPassword}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          </View>

          {/* Primary Action Button */}
          <TacticalButton
            title="Iniciar Sesión"
            onPress={handleLogin}
            loading={loading}
            variant="secondary"
            size="lg"
            
            style={styles.submitButton}
          />
        </TacticalCard>

        {/* Registration Link */}
        <View style={styles.registerPrompt}>
          <Text style={styles.registerPromptText}>
            ¿No tienes cuenta institucional?{' '}
          </Text>
          <TouchableOpacity onPress={onNavigateToRegister} activeOpacity={0.7}>
            <Text style={styles.registerLink}>Regístrate aquí</Text>
          </TouchableOpacity>
        </View>

        {/* Confidentiality Banner */}
        <ConfidentialityBanner
          title="Secreto Profesional & Pastoral"
          description="Canal cifrado de extremo a extremo y de estricta reserva pastoral, ética y confidencial para todo el personal."
          style={styles.banner}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingTop: Platform.OS === 'ios' ? 24 : 16,
    paddingBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabletContainer: {
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  emblemWrapper: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 0,
  },
  secondTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  titlePrefix: {
    fontFamily: Theme.fonts.headline,
    fontSize: 10,
    color: Theme.colors.onSurface,
  },
  titleApp: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 32,
    color: Theme.colors.tacticalNavy,
    letterSpacing: -0.5,
  },
  titleAux: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 14,
    color: Theme.colors.tacticalNavy,
    letterSpacing: -0.5,
  },
  titleSuffix: {
    fontFamily: Theme.fonts.headline,
    fontSize: 10,
    color: Theme.colors.onSurface,
  },
  subtitle: {
    color:"#000000",
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 320,
    lineHeight: 18,
  },
  loginCard: {
    width: '100%',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 20,
    lineHeight: 26,
    color: Theme.colors.onSurface,
  },
  cardSubtitle: {
    ...globalStyles.bodySm,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 4,
    marginBottom: 18,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  errorBannerIconWrap: {
    marginRight: 9,
    marginTop: 1,
  },
  errorBannerContent: {
    flex: 1,
  },
  errorBannerTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: '#991B1B',
    marginBottom: 2,
  },
  errorBannerText: {
    ...globalStyles.bodySm,
    fontSize: 12,
    lineHeight: 16,
    color: '#B91C1C',
  },
  utilsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxActive: {
    backgroundColor: "#2f93ef",
  },
  rememberText: {
    ...globalStyles.bodySm,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
  },
  forgotText: {
    ...globalStyles.bodySm,
    fontSize: 12,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.secondary,
  },
  submitButton: {
    marginTop: 12,
    backgroundColor: '#0c7ae0'
  },
  registerPrompt: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  registerPromptText: {
    ...globalStyles.bodySm,
    color: Theme.colors.onSurfaceVariant,
  },
  registerLink: {
    ...globalStyles.bodySm,
    fontFamily: Theme.fonts.bodySemiBold,
    color: "#2f93ef",
    textDecorationLine: 'underline',
  },
  banner: {
    marginTop: 12,
  },
});
