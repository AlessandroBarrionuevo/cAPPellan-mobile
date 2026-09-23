import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  useWindowDimensions,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import { useAuthStore } from '../../lib/stores/auth';
import { useAppInsets } from '../../lib/safeArea';
import {
  TacticalCard,
  TacticalButton,
  InstitutionalEmblem,
} from '../common';
import {
  ShieldCheck,
  Lock,
  Trash2,
  BellOff,
  SlidersHorizontal,
  Power,
  ChevronRight,
  Gavel,
  CheckCircle2,
  User,
  MapPin,
  Phone,
  EyeOff,
  Eye,
  Award,
  Save,
} from 'lucide-react-native';
import {
  getMyBasicProfile,
  updateMyBasicProfile,
  getChaplainProfile,
  updateChaplainProfile,
} from '../../lib/api/profiles';
import type { AuthUser, BasicProfile, ChaplainProfile } from '../../types/api';

export interface ReservedProfileViewProps {
  user?: AuthUser | null;
  onLogout?: () => void;
}

export default function ReservedProfileView({
  user: propUser,
  onLogout,
}: ReservedProfileViewProps) {
  const { width } = useWindowDimensions();
  const insets = useAppInsets();
  const authStoreUser = useAuthStore((state) => state.user);
  const storeLogout = useAuthStore((state) => state.logout);

  const user = propUser !== undefined ? propUser : authStoreUser;

  // Preferences toggles
  const [autoPurge, setAutoPurge] = useState(true);
  const [silentNotifs, setSilentNotifs] = useState(true);

  // Profile data from backend (Section 7.4 & 7.2)
  const [basicProfile, setBasicProfile] = useState<BasicProfile | null>(null);
  const [chaplainProfile, setChaplainProfile] = useState<ChaplainProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Chaplain specific fields
  const [militaryRank, setMilitaryRank] = useState('');
  const [militaryForce, setMilitaryForce] = useState('');
  const [yearsOfService, setYearsOfService] = useState('');
  const [bio, setBio] = useState('');

  const isChaplain =
    user?.role === 'CHAPLAIN' ||
    user?.role === 'CHAPLAIN_LEADER' ||
    user?.role === 'CHAPLAIN_CONTENT_LEADER';

  useEffect(() => {
    let isMounted = true;
    if (!user) return;
    setIsLoadingProfile(true);

    if (isChaplain && user.userId) {
      getChaplainProfile(user.userId)
        .then((data) => {
          if (!isMounted || !data) return;
          setChaplainProfile(data);
          setFullName(data.fullName || '');
          setMilitaryRank(data.militaryRank || '');
          setMilitaryForce(data.militaryForce || '');
          setYearsOfService(data.yearsOfService ? String(data.yearsOfService) : '');
          setBio(data.bio || '');
        })
        .catch(() => {
          // Fallback
        })
        .finally(() => {
          if (isMounted) setIsLoadingProfile(false);
        });
    } else {
      getMyBasicProfile()
        .then((data) => {
          if (!isMounted || !data) return;
          setBasicProfile(data);
          setFullName(data.fullName || '');
          setPhone(data.phone || '');
          setLocation(data.location || '');
          setIsAnonymous(Boolean(data.isAnonymous));
        })
        .catch(() => {
          // Fallback
        })
        .finally(() => {
          if (isMounted) setIsLoadingProfile(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [user, isChaplain]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      if (isChaplain) {
        const updated = await updateChaplainProfile({
          fullName: fullName.trim() || undefined,
          militaryForce: militaryForce.trim() || undefined,
          militaryRank: militaryRank.trim() || undefined,
          yearsOfService: yearsOfService ? parseInt(yearsOfService, 10) : undefined,
          bio: bio.trim() || undefined,
        });
        setChaplainProfile(updated);
        Alert.alert('Perfil Actualizado', 'Tus datos de servicio ministerial han sido guardados.');
      } else {
        const updated = await updateMyBasicProfile({
          fullName: fullName.trim() || undefined,
          phone: phone.trim() || undefined,
          location: location.trim() || undefined,
          isAnonymous,
        });
        setBasicProfile(updated);
        Alert.alert('Ficha Guardada', 'Tus datos confidenciales han sido actualizados con éxito.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudieron guardar los cambios.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAnonymity = async () => {
    const nextVal = !isAnonymous;
    setIsAnonymous(nextVal);
    if (!isChaplain) {
      try {
        await updateMyBasicProfile({ isAnonymous: nextVal });
      } catch (e) {
        // Ignored
      }
    }
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Cierre Inmediato Seguro',
      '¿Deseas cerrar la sesión activa y purgar las credenciales locales de este dispositivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: () => {
            if (onLogout) {
              onLogout();
            } else {
              storeLogout();
            }
          },
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
        { paddingBottom: Math.max(insets.bottom, 24) + 100 },
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
                {fullName || user?.username || 'Operativo Alfa-7'}
              </Text>
              <ShieldCheck size={17} color={Theme.colors.secondary} />
            </View>

            <Text style={styles.roleTag}>
              {user?.role ? `Escalafón: ${user.role}` : 'Identidad no vinculada a legajo personal'}
            </Text>

            <View style={styles.stealthPill}>
              <View style={[styles.stealthDot, isAnonymous && { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.stealthPillText}>
                {isAnonymous ? 'MODO ANÓNIMO ACTIVADO' : 'IDENTIDAD VISIBLE'}
              </Text>
            </View>
          </View>
        </View>
      </TacticalCard>

      {/* 2. Personal Profile Data & Privacy Settings (Section 7.4 & 7.5) */}
      <View style={styles.prefsHeader}>
        <Text style={styles.prefsTitle}>
          {isChaplain ? 'DATOS DE SERVICIO MINISTERIAL' : 'FICHA PERSONAL & ANONIMATO'}
        </Text>
        {isLoadingProfile && <ActivityIndicator size="small" color={Theme.colors.tacticalNavy} />}
      </View>

      <TacticalCard style={styles.profileEditCard} padding={16}>
        {/* Full Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>NOMBRE COMPLETO</Text>
          <View style={styles.inputWrapper}>
            <User size={16} color={Theme.colors.onSurfaceVariant} />
            <TextInput
              style={styles.textInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ej. Lucas Gómez"
              placeholderTextColor={Theme.colors.onSurfaceVariant}
            />
          </View>
        </View>

        {!isChaplain ? (
          <>
            {/* Phone */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>TELÉFONO DE CONTACTO</Text>
              <View style={styles.inputWrapper}>
                <Phone size={16} color={Theme.colors.onSurfaceVariant} />
                <TextInput
                  style={styles.textInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+54 9 11 2233-4455"
                  placeholderTextColor={Theme.colors.onSurfaceVariant}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Location / Base */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>DESTINO / BASE / PROVINCIA</Text>
              <View style={styles.inputWrapper}>
                <MapPin size={16} color={Theme.colors.onSurfaceVariant} />
                <TextInput
                  style={styles.textInput}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Ej. Córdoba, Argentina"
                  placeholderTextColor={Theme.colors.onSurfaceVariant}
                />
              </View>
            </View>

            {/* Anonymity Switch Row (Section 7.5) */}
            <TouchableOpacity
              style={styles.anonymityToggleRow}
              onPress={handleToggleAnonymity}
              activeOpacity={0.8}
            >
              <View style={styles.anonymityTextCol}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {isAnonymous ? (
                    <EyeOff size={16} color={Theme.colors.secondary} />
                  ) : (
                    <Eye size={16} color={Theme.colors.secondary} />
                  )}
                  <Text style={styles.anonymityTitle}>Reserva de Identidad (Anonimato)</Text>
                </View>
                <Text style={styles.anonymityDesc}>
                  Ocultar nombre y unidad en sesiones y oraciones
                </Text>
              </View>

              <View
                style={[
                  styles.switchTrack,
                  isAnonymous ? styles.switchOn : styles.switchOff,
                ]}
              >
                <View
                  style={[
                    styles.switchKnob,
                    isAnonymous ? styles.knobOn : styles.knobOff,
                  ]}
                />
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Chaplain Specific Fields (Section 7.3) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>FUERZA MILITAR / DE SEGURIDAD</Text>
              <View style={styles.inputWrapper}>
                <Award size={16} color={Theme.colors.onSurfaceVariant} />
                <TextInput
                  style={styles.textInput}
                  value={militaryForce}
                  onChangeText={setMilitaryForce}
                  placeholder="GENDARMERIA, EJERCITO, etc."
                  placeholderTextColor={Theme.colors.onSurfaceVariant}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>RANGO O JERARQUÍA</Text>
              <View style={styles.inputWrapper}>
                <ShieldCheck size={16} color={Theme.colors.onSurfaceVariant} />
                <TextInput
                  style={styles.textInput}
                  value={militaryRank}
                  onChangeText={setMilitaryRank}
                  placeholder="Comandante Principal, Mayor..."
                  placeholderTextColor={Theme.colors.onSurfaceVariant}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>AÑOS DE SERVICIO EN LA FUERZA</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={yearsOfService}
                  onChangeText={setYearsOfService}
                  placeholder="16"
                  keyboardType="numeric"
                  placeholderTextColor={Theme.colors.onSurfaceVariant}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>RESEÑA PASTORAL Y ESPECIALIDAD</Text>
              <View style={[styles.inputWrapper, { height: 70, alignItems: 'flex-start' }]}>
                <TextInput
                  style={[styles.textInput, { height: 60, textAlignVertical: 'top' }]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Acompañamiento en crisis, frontera y estrés post-traumático..."
                  placeholderTextColor={Theme.colors.onSurfaceVariant}
                  multiline
                />
              </View>
            </View>
          </>
        )}

        {/* Save Button */}
        <TacticalButton
          title={isSaving ? 'Guardando...' : 'Guardar Cambios'}
          onPress={handleSaveProfile}
          loading={isSaving}
          variant="primary"
          size="md"
          leftIcon={<Save size={16} color="#FFFFFF" />}
          style={{ marginTop: 14 }}
        />
      </TacticalCard>

      {/* 3. Confidentiality Legal & Pastoral Guarantee */}
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
          <Text style={styles.guaranteeStatute}>Estatuto Capellanía Art. 34-B</Text>
        </View>
      </TacticalCard>

      {/* 4. Tactical Preferences Section */}
      <View style={styles.prefsHeader}>
        <Text style={styles.prefsTitle}>PROTOCOLOS DE PRIVACIDAD</Text>
        <Text style={styles.prefsCount}>4 CONTROLES ACTIVOS</Text>
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
            <CheckCircle2 size={11} color={Theme.colors.secondary} style={{ marginRight: 4 }} />
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
            accessibilityRole="switch"
            accessibilityState={{ checked: autoPurge }}
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
            accessibilityRole="switch"
            accessibilityState={{ checked: silentNotifs }}
          >
            <View style={[styles.switchKnob, silentNotifs ? styles.knobOn : styles.knobOff]} />
          </TouchableOpacity>
        </View>

        <View style={styles.prefDivider} />

        {/* Option 4: Tactical Emergency Mode */}
        <TouchableOpacity
          style={styles.prefItem}
          activeOpacity={0.8}
          onPress={() => {
            Alert.alert(
              'Modo Pantalla Táctica',
              'Al activar este modo con cuatro toques rápidos en el marco institucional, la aplicación adoptará la apariencia de un manual de servicio no confidencial.'
            );
          }}
        >
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

      {/* 5. Quick Logout / Cierre Inmediato Seguro */}
      <TacticalButton
        title="Cierre Inmediato Seguro"
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
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
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
    marginBottom: 8,
  },
  stealthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.roundness.full,
    alignSelf: 'flex-start',
    gap: 6,
  },
  stealthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.secondary,
  },
  stealthPillText: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.onSurface,
    letterSpacing: 0.6,
  },
  profileEditCard: {
    marginBottom: 16,
    gap: 10,
  },
  fieldGroup: {
    gap: 4,
  },
  fieldLabel: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.secondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.md,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  anonymityToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.surfaceContainerLow,
    padding: 12,
    borderRadius: Theme.roundness.md,
    marginTop: 4,
  },
  anonymityTextCol: {
    flex: 1,
    paddingRight: 8,
    gap: 2,
  },
  anonymityTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: Theme.colors.onSurface,
  },
  anonymityDesc: {
    ...globalStyles.bodySm,
    fontSize: 10,
    color: Theme.colors.onSurfaceVariant,
  },
  guaranteeCard: {
    marginBottom: 16,
  },
  guaranteeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  guaranteeIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Theme.roundness.sm,
    backgroundColor: Theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guaranteeTextCol: {
    flex: 1,
  },
  guaranteeTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 14,
    color: Theme.colors.onSurface,
    marginBottom: 4,
  },
  guaranteeDesc: {
    ...globalStyles.bodySm,
    fontSize: 11,
    lineHeight: 16,
    color: Theme.colors.onSurfaceVariant,
  },
  guaranteeFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
  },
  guaranteeStatute: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.secondary,
  },
  prefsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  prefsTitle: {
    ...globalStyles.labelCaps,
    fontSize: 10,
    color: Theme.colors.secondary,
  },
  prefsCount: {
    ...globalStyles.labelCaps,
    fontSize: 10,
    color: Theme.colors.onSurfaceVariant,
  },
  prefsCard: {
    marginBottom: 20,
    overflow: 'hidden',
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
    paddingRight: 10,
  },
  prefIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: Theme.roundness.sm,
    backgroundColor: Theme.colors.surfaceContainerLow,
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
    marginTop: 2,
  },
  prefBadgeActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.roundness.full,
  },
  prefBadgeActiveText: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.secondary,
  },
  prefDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F0F2F5',
    marginLeft: 60,
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
    ...globalStyles.shadowSm,
  },
  knobOn: {
    alignSelf: 'flex-end',
  },
  knobOff: {
    alignSelf: 'flex-start',
  },
  logoutButton: {
    marginTop: 8,
  },
});
