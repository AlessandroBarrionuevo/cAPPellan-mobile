import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import { useAuthStore } from '../../lib/stores/auth';
import {
  TacticalCard,
  TacticalButton,
  InstitutionalEmblem,
} from '../../components/common';
import {
  ShieldCheck,
  Lock,
  Trash2,
  BellOff,
  SlidersHorizontal,
  Power,
  ChevronRight,
  Gavel,
} from 'lucide-react-native';

export default function LegacyProfileScreen() {
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // Preference switches
  const [autoPurge, setAutoPurge] = useState(true);
  const [silentNotifs, setSilentNotifs] = useState(true);

  const handleLogoutPress = () => {
    Alert.alert(
      'Cierre Inmediato Seguro',
      '¿Deseas cerrar la sesión activa y purgar las credenciales locales de este dispositivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => logout(),
        },
      ]
    );
  };

  const isTablet = width > 500;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        isTablet && styles.tabletContent,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Discreet Identity Header Card */}
      <TacticalCard style={styles.identityCard} padding={18}>
        <View style={styles.identityRow}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarInner}>
              <InstitutionalEmblem size={52} />
            </View>
            <View style={styles.onlineBadge}>
              <View style={styles.onlineInnerDot} />
            </View>
          </View>

          <View style={styles.identityInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.username || 'Operativo Alfa-7'}
              </Text>
              <ShieldCheck size={16} color={Theme.colors.secondary} />
            </View>

            <Text style={styles.roleTag}>
              {user?.role ? `Escalafón: ${user.role}` : 'Identidad no vinculada a legajo personal'}
            </Text>

            <View style={styles.stealthPill}>
              <View style={styles.stealthDot} />
              <Text style={styles.stealthPillText}>MODO DISCRETO ACTIVO</Text>
            </View>
          </View>
        </View>
      </TacticalCard>

      {/* 2. Confidentiality Legal & Pastoral Guarantee */}
      <TacticalCard style={styles.guaranteeCard} variant="low" padding={16}>
        <View style={styles.guaranteeHeader}>
          <View style={styles.guaranteeIconWrapper}>
            <Gavel size={18} color={Theme.colors.secondary} />
          </View>
          <View style={styles.guaranteeTextCol}>
            <Text style={styles.guaranteeTitle}>Garantía Canónica e Institucional</Text>
            <Text style={styles.guaranteeDesc}>
              Secreto de Confesión y Reserva Pastoral Garantizada por Estatuto Institucional. Ningún dato ni videollamada es registrado en servidores de mando.
            </Text>
          </View>
        </View>

        <View style={styles.guaranteeFooter}>
          <Text style={styles.guaranteeStatute}>Estatuto Capellanía Art. 3-B</Text>
        </View>
      </TacticalCard>

      {/* 3. Tactical Preferences Section */}
      <View style={styles.prefsHeader}>
        <Text style={styles.prefsTitle}>PROTOCOLOS DE PRIVACIDAD</Text>
      </View>

      <TacticalCard style={styles.prefsCard} padding={0}>
        {/* Option 1: P2P Encryption */}
        <View style={styles.prefItem}>
          <View style={styles.prefItemLeft}>
            <View style={styles.prefIconWrapper}>
              <Lock size={18} color={Theme.colors.secondary} />
            </View>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefItemTitle}>Cifrado Punto a Punto</Text>
              <Text style={styles.prefItemSub}>Túnel estricto terminal a capellán</Text>
            </View>
          </View>
          <View style={styles.prefBadgeActive}>
            <Text style={styles.prefBadgeActiveText}>ACTIVADO</Text>
          </View>
        </View>

        <View style={styles.prefDivider} />

        {/* Option 2: Auto Purge History */}
        <View style={styles.prefItem}>
          <View style={styles.prefItemLeft}>
            <View style={styles.prefIconWrapper}>
              <Trash2 size={18} color={Theme.colors.secondary} />
            </View>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefItemTitle}>Borrado automático de historial</Text>
              <Text style={styles.prefItemSub}>Purga total de notas al cerrar sesión</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.switchTrack, autoPurge ? styles.switchOn : styles.switchOff]}
            onPress={() => setAutoPurge((p) => !p)}
            activeOpacity={0.8}
          >
            <View style={[styles.switchKnob, autoPurge ? styles.knobOn : styles.knobOff]} />
          </TouchableOpacity>
        </View>

        <View style={styles.prefDivider} />

        {/* Option 3: Silent Notifications */}
        <View style={styles.prefItem}>
          <View style={styles.prefItemLeft}>
            <View style={styles.prefIconWrapper}>
              <BellOff size={18} color={Theme.colors.secondary} />
            </View>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefItemTitle}>Notificaciones Silenciosas</Text>
              <Text style={styles.prefItemSub}>Alertas de capellán en código discreto</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.switchTrack, silentNotifs ? styles.switchOn : styles.switchOff]}
            onPress={() => setSilentNotifs((p) => !p)}
            activeOpacity={0.8}
          >
            <View style={[styles.switchKnob, silentNotifs ? styles.knobOn : styles.knobOff]} />
          </TouchableOpacity>
        </View>

        <View style={styles.prefDivider} />

        {/* Option 4: Tactical Emergency Mode */}
        <TouchableOpacity style={styles.prefItem} activeOpacity={0.8}>
          <View style={styles.prefItemLeft}>
            <View style={styles.prefIconWrapper}>
              <SlidersHorizontal size={18} color={Theme.colors.secondary} />
            </View>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefItemTitle}>Modo Pantalla Táctica</Text>
              <Text style={styles.prefItemSub}>Acceso de emergencia con toque cuádruple</Text>
            </View>
          </View>
          <ChevronRight size={18} color={Theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </TacticalCard>

      {/* 4. Quick Logout / Cierre Inmediato Seguro */}
      <TacticalButton
        title="Cerrar Sesión"
        onPress={handleLogoutPress}
        variant="primary"
        size="lg"
        leftIcon={<Power size={18} color="#FFFFFF" />}
        style={styles.logoutButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingTop: 16,
    paddingBottom: 120,
  },
  tabletContent: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  identityCard: {
    marginBottom: 16,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatarInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    ...globalStyles.shadowSm,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  onlineInnerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  identityInfo: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    color: Theme.colors.onSurface,
  },
  roleTag: {
    ...globalStyles.bodySm,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  stealthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
    gap: 5,
  },
  stealthDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Theme.colors.secondary,
  },
  stealthPillText: {
    ...globalStyles.labelCaps,
    fontSize: 8,
    color: Theme.colors.secondary,
  },
  guaranteeCard: {
    marginBottom: 16,
  },
  guaranteeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  guaranteeIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: Theme.roundness.sm,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  guaranteeTextCol: {
    flex: 1,
  },
  guaranteeTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  guaranteeDesc: {
    ...globalStyles.bodySm,
    fontSize: 11,
    lineHeight: 16,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 3,
  },
  guaranteeFooter: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  guaranteeStatute: {
    ...globalStyles.labelCaps,
    color: Theme.colors.secondary,
    fontSize: 9,
  },
  prefsHeader: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  prefsTitle: {
    ...globalStyles.labelCaps,
    color: Theme.colors.secondary,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  prefsCount: {
    ...globalStyles.labelCaps,
    color: Theme.colors.onSurfaceVariant,
    fontSize: 9,
  },
  prefsCard: {
    marginBottom: 20,
  },
  prefItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  prefItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  prefIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Theme.roundness.md,
    backgroundColor: Theme.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  prefTextCol: {
    flex: 1,
  },
  prefItemTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  prefItemSub: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 1,
  },
  prefBadgeActive: {
    backgroundColor: Theme.colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.roundness.sm,
  },
  prefBadgeActiveText: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.secondary,
  },
  prefDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F0F2F5',
    marginLeft: 62,
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  switchOn: {
    backgroundColor: Theme.colors.tacticalNavy,
  },
  switchOff: {
    backgroundColor: Theme.colors.surfaceContainerHigh,
  },
  switchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  knobOn: {
    alignSelf: 'flex-end',
  },
  knobOff: {
    alignSelf: 'flex-start',
  },
  logoutButton: {
    marginTop: 4,
  },
});
