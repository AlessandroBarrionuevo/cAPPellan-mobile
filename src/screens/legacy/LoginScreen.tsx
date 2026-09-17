import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import { useAuthStore } from '../../lib/stores/auth';
import { Lock, User, Sparkles, AlertCircle } from 'lucide-react-native';

interface LoginScreenProps {
  onSuccess?: () => void;
}

export default function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Por favor ingresá tu usuario y contraseña');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await login(username.trim(), password.trim());
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Visual Emblem */}
        <View style={styles.headerArea}>
          <View style={styles.emblemWrapper}>
            <Sparkles size={28} color={Theme.colors.primary} />
          </View>
          <Text style={styles.title}>
            Capellan<Text style={{ color: Theme.colors.secondary }}>APP</Text>
          </Text>
          <Text style={styles.subtitle}>Servicio de Acompañamiento Espiritual</Text>
        </View>

        {/* Card Form */}
        <View style={[styles.card, globalStyles.shadowSoft]}>
          <Text style={styles.cardTitle}>Iniciar Sesión</Text>
          <Text style={styles.cardSubtitle}>
            Ingresá tus credenciales para acceder al servicio
          </Text>

          {error && (
            <View style={styles.errorBanner}>
              <AlertCircle size={18} color={Theme.colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Username Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Usuario</Text>
            <View style={styles.inputContainer}>
              <User size={18} color={Theme.colors.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ingresá tu usuario"
                placeholderTextColor="#A0A5AF"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <View style={styles.inputContainer}>
              <Lock size={18} color={Theme.colors.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ingresá tu contraseña"
                placeholderTextColor="#A0A5AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Theme.colors.onPrimary} />
            ) : (
              <Text style={styles.loginButtonText}>Ingresar</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footerNote}>
          Espacio seguro, confidencial y disponible
        </Text>
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
    justifyContent: 'center',
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingVertical: 32,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emblemWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    ...globalStyles.displayLg,
    fontSize: 32,
    lineHeight: 38,
    textAlign: 'center',
  },
  subtitle: {
    ...globalStyles.bodySm,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.roundness.xl,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E7EEFF',
  },
  cardTitle: {
    ...globalStyles.headlineMd,
    fontSize: 20,
    lineHeight: 26,
    color: Theme.colors.primary,
  },
  cardSubtitle: {
    ...globalStyles.bodySm,
    marginTop: 4,
    marginBottom: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEAEA',
    borderRadius: Theme.roundness.lg,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    ...globalStyles.bodySm,
    color: Theme.colors.error,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    ...globalStyles.labelCaps,
    color: Theme.colors.primary,
    marginBottom: 6,
    fontSize: 11,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F6FA',
    borderRadius: Theme.roundness.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontFamily: Theme.fonts.body,
    fontSize: 15,
    color: Theme.colors.onSurface,
  },
  loginButton: {
    backgroundColor: Theme.colors.primary,
    height: 50,
    borderRadius: Theme.roundness.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.onPrimary,
    fontSize: 16,
  },
  footerNote: {
    ...globalStyles.bodySm,
    textAlign: 'center',
    marginTop: 24,
    color: '#8A92A0',
  },
});
