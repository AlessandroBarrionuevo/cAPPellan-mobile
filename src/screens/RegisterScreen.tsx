import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Theme, globalStyles } from '../theme/Theme';
import {
  InstitutionalEmblem,
  TacticalInput,
  TacticalButton,
  TacticalCard,
  ConfidentialityBanner,
} from '../components/common';
import {
  BadgeCheck,
  Shield,
  Lock,
  Mail,
  ChevronDown,
  Check,
  UserPlus,
  ArrowLeft,
  X,
  AlertCircle,
} from 'lucide-react-native';
import { request, ApiError } from '../lib/api/client';
import { ENDPOINTS } from '../lib/api/endpoints';
import type { RegisterResponse } from '../types/api';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
}

interface RegisterFieldErrors {
  alias?: string;
  force?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
}

const FORCES = [
  { id: 'POLICIA_DE_LA_CIUDAD', label: 'Policía de la Ciudad' },
  // { id: 'pfa', label: 'Policía Federal Argentina' },
  // { id: 'ea', label: 'Ejército Argentino' },
  // { id: 'pna', label: 'Prefectura Naval Argentina' },
  // { id: 'gna', label: 'Gendarmería Nacional' },
  // { id: 'psa', label: 'Policía de Seguridad Aeroportuaria' },
  // { id: 'seg_privada', label: 'Seguridad Privada & Custodia' },
  // { id: 'retirado', label: 'Veterano / Cuadro en Retiro' },
  // { id: 'familiar', label: 'Familiar Directo en Contención' },
  // { id: 'prefiero_no_decir', label: 'Prefiero no decir' },
];

export default function RegisterScreen({ onNavigateToLogin }: RegisterScreenProps) {
  const { width } = useWindowDimensions();
  const [alias, setAlias] = useState('');
  const [selectedForce, setSelectedForce] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showForceModal, setShowForceModal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Dynamic password strength meter calculation
  const getPasswordStrength = () => {
    if (!password) {
      return { level: 0, label: 'Aguardando entrada', color: Theme.colors.secondary };
    }
    if (password.length < 6) {
      return { level: 1, label: 'Criptografía débil', color: Theme.colors.error };
    }
    if (password.length < 10) {
      return { level: 2, label: 'Protección operativa media', color: Theme.colors.secondary };
    }
    return { level: 3, label: 'Blindaje de alta confidencialidad', color: Theme.colors.tacticalNavy };
  };

  const strength = getPasswordStrength();

  const clearFieldError = (field: keyof RegisterFieldErrors) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
    if (formError) {
      setFormError(null);
    }
  };

  const handleRegisterSubmit = async () => {
    const nextErrors: RegisterFieldErrors = {};

    if (!alias.trim()) {
      nextErrors.alias = 'Ingresá tu nombre completo o alias operativo.';
    } else if (alias.trim().length < 3) {
      nextErrors.alias = 'El nombre o alias debe tener al menos 3 caracteres.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Ingresá tu correo electrónico o credencial.';
    } else if (email.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'El formato del correo electrónico no es válido.';
    }

    if (!password) {
      nextErrors.password = 'Ingresá una contraseña para proteger tu cuenta.';
    } else if (password.length < 6) {
      nextErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Repetí la contraseña elegida para confirmarla.';
    } else if (password && password !== confirmPassword) {
      nextErrors.confirmPassword = 'Las contraseñas ingresadas no coinciden.';
    }

    if (!termsAccepted) {
      nextErrors.terms = 'Debés aceptar los términos de confidencialidad y reserva pastoral.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError('Revisá los campos marcados en rojo para completar tu registro.');
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setLoading(true);

    try {
      await request<RegisterResponse>(ENDPOINTS.AUTH_REGISTER, {
        method: 'POST',
        body: JSON.stringify({
          username: alias.trim(),
          email: email.trim().toLowerCase(),
          password,
          alias: alias.trim(),
          force: selectedForce || undefined,
        }),
      });

      setSuccess(true);
      Alert.alert(
        'Cuenta Segura Creada',
        'Tu cuenta institucional ha sido registrada bajo protocolo de estricta reserva. Ya podés iniciar sesión.',
        [{ text: 'Iniciar Sesión', onPress: onNavigateToLogin }]
      );
    } catch (err: any) {
      const msg: string =
        err.message || 'No se pudo completar el registro. Verificá los datos e intentá nuevamente.';
      const lowerMsg = msg.toLowerCase();
      const serverFieldErrors: RegisterFieldErrors = {};

      if (lowerMsg.includes('email') || lowerMsg.includes('correo')) {
        serverFieldErrors.email = msg;
      } else if (
        lowerMsg.includes('username') ||
        lowerMsg.includes('usuario') ||
        lowerMsg.includes('alias')
      ) {
        serverFieldErrors.alias = msg;
      } else if (lowerMsg.includes('password') || lowerMsg.includes('contraseña')) {
        serverFieldErrors.password = msg;
      }

      if (Object.keys(serverFieldErrors).length > 0) {
        setFieldErrors(serverFieldErrors);
      }
      setFormError(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedForceLabel =
    FORCES.find((f) => f.id === selectedForce)?.label || 'Selecciona tu fuerza o condición...';

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
        {/* Header Area */}
        <View style={styles.headerArea}>
          <View style={[styles.emblemWrapper, globalStyles.shadowSm]}>
            <InstitutionalEmblem size={60} />
          </View>
          <Text style={styles.headerTitle}>cAPPellan</Text>
          <View style={styles.pillBadge}>
            <Shield size={12} color={Theme.colors.onSecondaryFixed} />
            <Text style={styles.pillBadgeText}>CREAR CUENTA SEGURA</Text>
          </View>
        </View>

        {/* Protection Intro Card */}
        <TacticalCard style={styles.introCard} variant="low" padding={14}>
          <View style={styles.introRow}>
            <View style={styles.introIcon}>
              <BadgeCheck size={18} color="#FFFFFF" />
            </View>
            <View style={styles.introTextWrapper}>
              <Text style={styles.introTitle}>Protección Institucional 24h</Text>
              <Text style={styles.introDesc}>
                Un espacio confidencial a tu servicio. Tu identidad y consultas están totalmente protegidas bajo estricto secreto pastoral y reserva profesional.
              </Text>
            </View>
          </View>
        </TacticalCard>

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* Nombre o Alias */}
          <TacticalInput
            label="NOMBRE COMPLETO O ALIAS OPERATIVO"
            badgeText="MODO SIGILO ADMITIDO"
            placeholder="Ej. Centurión-4 o Nombre Real"
            value={alias}
            onChangeText={(text) => {
              setAlias(text);
              clearFieldError('alias');
            }}
            leftIcon={
              <Shield
                size={18}
                color={fieldErrors.alias ? Theme.colors.error : Theme.colors.secondary}
              />
            }
            error={fieldErrors.alias}
          />

          {/* Selector de Fuerza o Institución */}
          <View style={styles.forceSelectorGroup}>
            <Text style={[styles.fieldLabel, fieldErrors.force && styles.fieldLabelError]}>
              FUERZA O INSTITUCIÓN PERTENECIENTE
            </Text>
            <TouchableOpacity
              style={[
                styles.forcePickerButton,
                fieldErrors.force ? styles.forcePickerButtonError : null,
              ]}
              onPress={() => {
                clearFieldError('force');
                setShowForceModal(true);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.forcePickerText,
                  !selectedForce && styles.forcePickerPlaceholder,
                ]}
                numberOfLines={1}
              >
                {selectedForceLabel}
              </Text>
              <ChevronDown
                size={18}
                color={fieldErrors.force ? Theme.colors.error : Theme.colors.secondary}
              />
            </TouchableOpacity>
            {fieldErrors.force ? (
              <View style={styles.inlineErrorRow}>
                <AlertCircle size={13} color={Theme.colors.error} style={styles.inlineErrorIcon} />
                <Text style={styles.inlineErrorText}>{fieldErrors.force}</Text>
              </View>
            ) : null}
          </View>

          {/* Correo o N° Credencial */}
          <TacticalInput
            label="CORREO ELECTRÓNICO O N° CREDENCIAL"
            placeholder="usuario@fuerza.gob.ar o legajo"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              clearFieldError('email');
            }}
            leftIcon={
              <Mail
                size={18}
                color={fieldErrors.email ? Theme.colors.error : Theme.colors.secondary}
              />
            }
            autoCapitalize="none"
            keyboardType="email-address"
            error={fieldErrors.email}
          />

          {/* Contraseña Blindada */}
          <TacticalInput
            label="CONTRASEÑA BLINDADA"
            placeholder="Mínimo 6 caracteres tácticos"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearFieldError('password');
              if (confirmPassword && text === confirmPassword) {
                clearFieldError('confirmPassword');
              }
            }}
            isPassword
            leftIcon={
              <Lock
                size={18}
                color={fieldErrors.password ? Theme.colors.error : Theme.colors.secondary}
              />
            }
            error={fieldErrors.password}
          />

          {/* Dynamic Strength Meter */}
          <View style={styles.strengthContainer}>
            <View style={styles.strengthLabelRow}>
              <Text style={styles.strengthText}>Nivel de Seguridad</Text>
              <Text style={[styles.strengthLevel, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
            <View style={styles.strengthBarsRow}>
              <View
                style={[
                  styles.strengthBar,
                  strength.level >= 1 && { backgroundColor: strength.color },
                ]}
              />
              <View
                style={[
                  styles.strengthBar,
                  strength.level >= 2 && { backgroundColor: strength.color },
                ]}
              />
              <View
                style={[
                  styles.strengthBar,
                  strength.level >= 3 && { backgroundColor: strength.color },
                ]}
              />
            </View>
          </View>

          {/* Confirmar Contraseña */}
          <TacticalInput
            label="CONFIRMAR CONTRASEÑA BLINDADA"
            placeholder="Reingrese la contraseña elegida"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (password && text && password !== text) {
                setFieldErrors((prev) => ({
                  ...prev,
                  confirmPassword: 'Las contraseñas no coinciden aún.',
                }));
              } else {
                clearFieldError('confirmPassword');
              }
            }}
            isPassword
            leftIcon={
              <Lock
                size={18}
                color={fieldErrors.confirmPassword ? Theme.colors.error : Theme.colors.secondary}
              />
            }
            error={fieldErrors.confirmPassword}
          />

          {/* Checkbox Términos */}
          <View style={styles.termsWrapper}>
            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => {
                setTermsAccepted((prev) => {
                  const next = !prev;
                  if (next) clearFieldError('terms');
                  return next;
                });
              }}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkbox,
                  termsAccepted && styles.checkboxActive,
                  fieldErrors.terms && !termsAccepted ? styles.checkboxError : null,
                ]}
              >
                {termsAccepted && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <Text style={styles.termsText}>
                Acepto los términos de{' '}
                <Text style={styles.termsUnderline}>confidencialidad inviolable</Text> y{' '}
                <Text style={styles.termsUnderline}>reserva pastoral</Text> de acuerdo con las normativas vigentes.
              </Text>
            </TouchableOpacity>
            {fieldErrors.terms ? (
              <View style={styles.inlineErrorRow}>
                <AlertCircle size={13} color={Theme.colors.error} style={styles.inlineErrorIcon} />
                <Text style={styles.inlineErrorText}>{fieldErrors.terms}</Text>
              </View>
            ) : null}
          </View>

          {/* Dedicated Bottom Form Error / Validation Banner */}
          {formError ? (
            <View style={styles.formErrorBanner}>
              <View style={styles.formErrorIconWrap}>
                <AlertCircle size={18} color="#DC2626" />
              </View>
              <View style={styles.formErrorContent}>
                <Text style={styles.formErrorTitle}>Atención en el formulario</Text>
                <Text style={styles.formErrorText}>{formError}</Text>
              </View>
            </View>
          ) : null}

          {/* Submit Button */}
          <TacticalButton
            title="CREAR MI CUENTA SEGURA"
            onPress={handleRegisterSubmit}
            loading={loading}
            variant="secondary"
            size="lg"
            leftIcon={<UserPlus size={18} color="#FFFFFF" />}
            style={styles.registerButton}
          />
        </View>

        {/* Back to Login link */}
        <View style={styles.loginRow}>
          <Text style={styles.loginRowText}>¿Ya tenes de cuenta? </Text>
          <TouchableOpacity onPress={onNavigateToLogin} activeOpacity={0.7}>
            <Text style={styles.loginLink}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Modal Selector de Fuerzas */}
        <Modal
          visible={showForceModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowForceModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, globalStyles.shadowMd]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Fuerza o Institución</Text>
                <TouchableOpacity onPress={() => setShowForceModal(false)}>
                  <X size={20} color={Theme.colors.onSurface} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalList}>
                {FORCES.map((force) => (
                  <TouchableOpacity
                    key={force.id}
                    style={[
                      styles.modalItem,
                      selectedForce === force.id && styles.modalItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedForce(force.id);
                      setShowForceModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalItemText,
                        selectedForce === force.id && styles.modalItemTextSelected,
                      ]}
                    >
                      {force.label}
                    </Text>
                    {selectedForce === force.id && (
                      <Check size={16} color={Theme.colors.tacticalNavy} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
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
    paddingBottom: 40,
  },
  tabletContainer: {
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 16,
  },
  emblemWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 26,
    color: Theme.colors.onSurface,
    letterSpacing: -0.4,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.roundness.full,
    marginTop: 6,
    gap: 4,
  },
  pillBadgeText: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.onSecondaryFixed,
  },
  introCard: {
    marginBottom: 16,
  },
  introRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  introIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  introTextWrapper: {
    flex: 1,
  },
  introTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  introDesc: {
    ...globalStyles.bodySm,
    fontSize: 11,
    lineHeight: 16,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  formContainer: {
    width: '100%',
  },
  fieldLabel: {
    ...globalStyles.labelCaps,
    color: Theme.colors.onSurfaceVariant,
    fontSize: 11,
    marginBottom: 6,
  },
  fieldLabelError: {
    color: Theme.colors.error,
  },
  forceSelectorGroup: {
    marginBottom: 14,
  },
  forcePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.md,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  forcePickerButtonError: {
    borderColor: Theme.colors.error,
    backgroundColor: '#FFF5F5',
  },
  inlineErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    paddingHorizontal: 2,
  },
  inlineErrorIcon: {
    marginRight: 5,
  },
  inlineErrorText: {
    ...globalStyles.bodySm,
    color: Theme.colors.error,
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  forcePickerText: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: Theme.colors.onSurface,
    flex: 1,
  },
  forcePickerPlaceholder: {
    color: '#8A92A0',
  },
  strengthContainer: {
    marginTop: -6,
    marginBottom: 14,
  },
  strengthLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  strengthText: {
    ...globalStyles.labelCaps,
    fontSize: 10,
    color: Theme.colors.onSurfaceVariant,
  },
  strengthLevel: {
    ...globalStyles.labelCaps,
    fontSize: 10,
  },
  strengthBarsRow: {
    flexDirection: 'row',
    height: 4,
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    borderRadius: 2,
    backgroundColor: Theme.colors.surfaceContainerHigh,
  },
  termsWrapper: {
    marginVertical: 10,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  checkboxActive: {
    backgroundColor: Theme.colors.secondary,
  },
  checkboxError: {
    borderColor: Theme.colors.error,
    backgroundColor: '#FFF5F5',
  },
  formErrorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginTop: 4,
    marginBottom: 6,
  },
  formErrorIconWrap: {
    marginRight: 9,
    marginTop: 1,
  },
  formErrorContent: {
    flex: 1,
  },
  formErrorTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: '#991B1B',
    marginBottom: 2,
  },
  formErrorText: {
    ...globalStyles.bodySm,
    fontSize: 12,
    lineHeight: 16,
    color: '#B91C1C',
  },
  termsText: {
    ...globalStyles.bodySm,
    fontSize: 12,
    lineHeight: 18,
    color: Theme.colors.onSurface,
    flex: 1,
  },
  termsUnderline: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.secondary,
    textDecorationLine: 'underline',
  },
  registerButton: {
    marginTop: 10,
  },
  loginRow: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginRowText: {
    ...globalStyles.bodySm,
    color: Theme.colors.onSurfaceVariant,
  },
  loginLink: {
    ...globalStyles.bodySm,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.secondary,
    textDecorationLine: 'underline',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '75%',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.roundness.xl,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 17,
    color: Theme.colors.onSurface,
  },
  modalList: {
    flexGrow: 0,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F2F5',
  },
  modalItemSelected: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.md,
  },
  modalItemText: {
    fontFamily: Theme.fonts.body,
    fontSize: 14,
    color: Theme.colors.onSurface,
  },
  modalItemTextSelected: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.tacticalNavy,
  },
});
