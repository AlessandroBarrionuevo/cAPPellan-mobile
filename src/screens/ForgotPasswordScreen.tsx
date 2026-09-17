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
import {
  TacticalInput,
  TacticalButton,
  TacticalCard,
  InstitutionalEmblem,
} from '../components/common';
import {
  ArrowLeft,
  ShieldCheck,
  Key,
  Mail,
  Send,
  Headphones,
  CheckCircle2,
} from 'lucide-react-native';

interface ForgotPasswordScreenProps {
  onNavigateToLogin: () => void;
}

export default function ForgotPasswordScreen({
  onNavigateToLogin,
}: ForgotPasswordScreenProps) {
  const { width } = useWindowDimensions();
  const [identifier, setIdentifier] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Prepared statically without logic as requested
  const handleStaticSubmit = () => {
    if (identifier.trim()) {
      setSubmitted(true);
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
        {/* Top Bar Navigation */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onNavigateToLogin}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={Theme.colors.onSurface} />
          </TouchableOpacity>

          <View style={styles.topCenterTitle}>
            <View style={styles.smallEmblem}>
              <InstitutionalEmblem size={24} />
            </View>
            <Text style={styles.topTitleText}>cAPPellan</Text>
          </View>

          <View style={styles.topRightIcon}>
            <ShieldCheck size={20} color={Theme.colors.secondary} />
          </View>
        </View>

        {/* Big Icon Shield Key Badge */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconOuter}>
            <View style={styles.heroIconInner}>
              <ShieldCheck size={38} color={Theme.colors.tacticalNavy} />
            </View>
            <View style={styles.keyBadge}>
              <Key size={16} color="#FFFFFF" />
            </View>
          </View>

          <View style={styles.protocolBadge}>
            <Text style={styles.protocolText}>
              PROTOCOLO DE SEGURIDAD INSTITUCIONAL
            </Text>
          </View>

          <Text style={styles.mainTitle}>Recuperar Acceso</Text>
          <Text style={styles.mainSubtitle}>
            No te preocupes. Ingresa tu correo y te enviaremos un código seguro de verificación para restablecer tu contraseña con total discreción.
          </Text>
        </View>

        {/* Input Card Container */}
        <TacticalCard style={styles.formCard} padding={20}>
          <TacticalInput
            label="IDENTIFICACIÓN DE SERVICIO O CORREO"
            placeholder="ejemplo@email.com o legajo institucional"
            value={identifier}
            onChangeText={setIdentifier}
            leftIcon={<Mail size={18} color={Theme.colors.secondary} />}
            autoCapitalize="none"
          />

          <View style={styles.encryptedNotice}>
            <ShieldCheck size={14} color={Theme.colors.secondary} />
            <Text style={styles.encryptedText}>
              Canal cifrado de extremo a extremo sin registro de rastreo.
            </Text>
          </View>

          <TacticalButton
            title="Enviar Código de Recuperación"
            onPress={handleStaticSubmit}
            variant="secondary"
            size="lg"
            leftIcon={<Send size={18} color="#FFFFFF" />}
            style={styles.sendButton}
          />
        </TacticalCard>

        {/* Success Feedback Simulated Panel */}
        {submitted && (
          <View style={styles.feedbackPanel}>
            <CheckCircle2 size={24} color={Theme.colors.tacticalNavy} />
            <Text style={styles.feedbackTitle}>Instrucciones Despachadas</Text>
            <Text style={styles.feedbackDesc}>
              Si el identificador corresponde a un legajo activo, el código llegará en menos de 60 segundos.
            </Text>
          </View>
        )}

        {/* Auxiliary Chaplain Support Card */}
        <TacticalCard style={styles.helpCard} variant="low" padding={16}>
          <View style={styles.helpHeader}>
            <View style={styles.helpIconWrapper}>
              <Headphones size={20} color={Theme.colors.tacticalNavy} />
            </View>
            <View style={styles.helpTextWrapper}>
              <Text style={styles.helpTitle}>¿Problemas con tu cuenta?</Text>
              <Text style={styles.helpDesc}>
                Podes de igual forma acceder al servicio de llamada o mensajería de texto de forma anónima.
              </Text>
            </View>
          </View>

          <TacticalButton
            title="Contactar Capellanía de Guardia 24/7"
            variant="surface"
            size="sm"
            style={styles.helpAction}
          />
        </TacticalCard>

        {/* Back to Login link */}
        <TouchableOpacity
          style={styles.backLink}
          onPress={onNavigateToLogin}
          activeOpacity={0.7}
        >
          <ArrowLeft size={16} color={Theme.colors.secondary} />
          <Text style={styles.backLinkText}>Volver a Iniciar Sesión</Text>
        </TouchableOpacity>
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
    paddingTop: Platform.OS === 'ios' ? 16 : 10,
    paddingBottom: 36,
  },
  tabletContainer: {
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: Theme.roundness.md,
    backgroundColor: Theme.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenterTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallEmblem: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
  },
  topTitleText: {
    fontFamily: Theme.fonts.headline,
    fontSize: 16,
    color: Theme.colors.onSurface,
  },
  topRightIcon: {
    width: 38,
    alignItems: 'flex-end',
  },
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    marginVertical: 12,
  },
  heroIconOuter: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: Theme.colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  heroIconInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    ...globalStyles.shadowSm,
  },
  keyBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.tacticalNavy,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  protocolBadge: {
    backgroundColor: '#E7EEF8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Theme.roundness.full,
    marginBottom: 8,
  },
  protocolText: {
    ...globalStyles.labelCaps,
    color: Theme.colors.secondary,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  mainTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 24,
    color: Theme.colors.onSurface,
    marginBottom: 6,
  },
  mainSubtitle: {
    ...globalStyles.bodySm,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
  },
  formCard: {
    marginVertical: 14,
  },
  encryptedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -4,
    marginBottom: 16,
  },
  encryptedText: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
  },
  sendButton: {
    marginTop: 4,
  },
  feedbackPanel: {
    backgroundColor: Theme.colors.secondaryContainer,
    borderRadius: Theme.roundness.lg,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
    gap: 4,
  },
  feedbackTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 16,
    color: Theme.colors.onSecondaryFixed,
    marginTop: 4,
  },
  feedbackDesc: {
    ...globalStyles.bodySm,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  helpCard: {
    marginBottom: 16,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  helpIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Theme.roundness.md,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    ...globalStyles.shadowSm,
  },
  helpTextWrapper: {
    flex: 1,
  },
  helpTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  helpDesc: {
    ...globalStyles.bodySm,
    fontSize: 11,
    lineHeight: 16,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  helpAction: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  backLinkText: {
    ...globalStyles.bodySm,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.secondary,
  },
});
