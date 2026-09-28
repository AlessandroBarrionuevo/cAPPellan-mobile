import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import { useCallStore } from '../../lib/stores/call';
import { useAuthStore } from '../../lib/stores/auth';
import { request } from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';
import type { Session } from '../../types/api';
import {
  Video,
  AlertCircle,
  HeartHandshake,
  CheckCircle2,
  PhoneCall,
} from 'lucide-react-native';

interface BasicDashboardProps {
  onJoinCall: () => void;
  onNavigateToBible: () => void;
  onNavigateToContent: () => void;
}

export default function BasicDashboard({ onJoinCall }: BasicDashboardProps) {
  const currentSession = useCallStore((state) => state.currentSession);
  const callStatus = useCallStore((state) => state.callStatus);
  const error = useCallStore((state) => state.error);
  const requestCall = useCallStore((state) => state.requestCall);
  const resetCall = useCallStore((state) => state.resetCall);
  const user = useAuthStore((state) => state.user);

  // Poll call session status while WAITING
  useEffect(() => {
    if (callStatus !== 'WAITING' || !currentSession?.sessionId) return;

    const interval = setInterval(async () => {
      try {
        const sessionDetail = await request<Session>(
          ENDPOINTS.CALL_DETAIL(currentSession.sessionId)
        );

        if (sessionDetail.status === 'IN_PROGRESS') {
          useCallStore.getState().setCallStatus('IN_PROGRESS');
          onJoinCall();
        } else if (sessionDetail.status === 'ENDED') {
          useCallStore.getState().setCallStatus('ENDED');
        }
      } catch (e) {
        // Polling error
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [callStatus, currentSession, onJoinCall]);

  // 1. Waiting Room State
  if (callStatus === 'WAITING') {
    return (
      <View style={styles.centeredContainer}>
        <View style={[styles.waitingCard, globalStyles.shadowSoft]}>
          <View style={styles.spinnerWrapper}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
          </View>
          <Text style={styles.waitingTitle}>
            Estamos conectándote con un capellán...
          </Text>
          <Text style={styles.waitingSubtitle}>
            Por favor, aguardá un momento mientras te asignamos atención.
          </Text>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={resetCall}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Cancelar espera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 2. Thank You (Post-Call) State
  if (callStatus === 'ENDED') {
    return (
      <View style={styles.centeredContainer}>
        <View style={[styles.thankYouCard, globalStyles.shadowSoft]}>
          <View style={styles.successIconCircle}>
            <CheckCircle2 size={40} color={Theme.colors.secondary} />
          </View>
          <Text style={styles.thankYouTitle}>
            Gracias por comunicarte con nosotros
          </Text>
          <Text style={styles.thankYouSubtitle}>
            Esperamos que la conversación haya sido de bendición y ayuda.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={resetCall}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Volver al Inicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 3. Default Home State
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero Welcome Banner */}
      <View style={styles.heroSection}>
        <View style={styles.welcomeIconContainer}>
          <HeartHandshake size={32} color={Theme.colors.primary} />
        </View>
        <Text style={styles.heroTitle}>
          Paz a vos{user ? `, ${user.username}` : ''}.
        </Text>
        <Text style={styles.heroSubtitle}>
          Estás en un espacio seguro. Un capellán está disponible para
          escucharte y acompañarte en lo que necesites.
        </Text>

        {error && (
          <View style={styles.errorCard}>
            <AlertCircle size={20} color={Theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.primaryButton,
            globalStyles.shadowSoft,
            callStatus === 'REQUESTING' && { opacity: 0.7 },
          ]}
          onPress={() => requestCall()}
          disabled={callStatus === 'REQUESTING'}
          activeOpacity={0.85}
        >
          {callStatus === 'REQUESTING' ? (
            <ActivityIndicator color="#FFF" style={styles.buttonIcon} />
          ) : (
            <PhoneCall size={22} color="#FFF" style={styles.buttonIcon} />
          )}
          <Text style={styles.primaryButtonText}>
            {callStatus === 'REQUESTING'
              ? 'Conectando...'
              : 'Hablar con un Capellán Ahora'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Live Availability Status */}
      <View style={[styles.availabilityCard, globalStyles.shadowSoft]}>
        <View style={styles.pulseDot} />
        <View style={styles.availabilityTextContainer}>
          <Text style={styles.availabilityTitle}>Nuestros Capellanes</Text>
          <Text style={styles.availabilitySubtitle}>
            Atención personalizada y confidencial
          </Text>
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
    paddingBottom: 110,
    justifyContent: 'center',
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Theme.spacing.sectionGap,
  },
  welcomeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Theme.colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEAEA',
    borderRadius: Theme.roundness.lg,
    padding: 12,
    marginBottom: 20,
    gap: 8,
    width: '100%',
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
    width: '100%',
    maxWidth: 360,
  },
  buttonIcon: {
    marginRight: 10,
  },
  primaryButtonText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 16,
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
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Theme.colors.secondary,
  },
  availabilityTextContainer: {
    marginLeft: 12,
  },
  availabilityTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 17,
    color: Theme.colors.primary,
  },
  availabilitySubtitle: {
    ...globalStyles.bodySm,
    color: Theme.colors.onSurfaceVariant,
    fontSize: 13,
  },
  waitingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.xl,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#E7EEFF',
  },
  spinnerWrapper: {
    marginBottom: 20,
  },
  waitingTitle: {
    ...globalStyles.headlineMd,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  waitingSubtitle: {
    ...globalStyles.bodySm,
    textAlign: 'center',
    marginBottom: 24,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.error,
    fontSize: 14,
  },
  thankYouCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.xl,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#E7EEFF',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  thankYouTitle: {
    ...globalStyles.headlineMd,
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 8,
  },
  thankYouSubtitle: {
    ...globalStyles.bodySm,
    textAlign: 'center',
    marginBottom: 24,
  },
});
