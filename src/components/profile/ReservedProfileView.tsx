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
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Theme, globalStyles } from '../../theme/Theme';
import { useAuthStore } from '../../lib/stores/auth';
import { useCallStore } from '../../lib/stores/call';
import { useAppInsets } from '../../lib/safeArea';
import {
  TacticalCard,
  TacticalButton,
  InstitutionalEmblem,
} from '../common';
import {
  ShieldCheck,
  Lock,
  Key,
  Trash2,
  BellOff,
  SlidersHorizontal,
  Power,
  ChevronRight,
  ChevronDown,
  Gavel,
  CheckCircle2,
  User,
  MapPin,
  Phone,
  EyeOff,
  Eye,
  Award,
  Save,
  X,
  Camera,
} from 'lucide-react-native';
import {
  getMyBasicProfile,
  updateMyBasicProfile,
  getChaplainProfile,
  updateChaplainProfile,
  uploadAvatarFile,
} from '../../lib/api/profiles';
import { request } from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';
import type { AuthUser, BasicProfile, ChaplainProfile, MilitaryForce, MessageResponse } from '../../types/api';

export const MILITARY_FORCES: { value: MilitaryForce; label: string; code: string }[] = [
  { value: 'EJERCITO', label: 'Ejército Argentino', code: 'EA' },
  { value: 'ARMADA', label: 'Armada Argentina', code: 'ARA' },
  { value: 'FUERZA_AEREA', label: 'Fuerza Aérea Argentina', code: 'FAA' },
  { value: 'GENDARMERIA', label: 'Gendarmería Nacional', code: 'GNA' },
  { value: 'PREFECTURA', label: 'Prefectura Naval Argentina', code: 'PNA' },
  { value: 'POLICIA_FEDERAL', label: 'Policía Federal Argentina', code: 'PFA' },
  { value: 'POLICIA_DE_LA_CIUDAD', label: 'Policía de la Ciudad', code: 'PCABA' },
  { value: 'POLICIA_PROVINCIAL', label: 'Policía Provincial', code: 'PP' },
  { value: 'SERVICIO_PENITENCIARIO', label: 'Servicio Penitenciario', code: 'SPF' },
  { value: 'OTRA', label: 'Otra Fuerza / Institución', code: 'OTRA' },
];

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
  const [militaryForce, setMilitaryForce] = useState<MilitaryForce | ''>('');
  const [yearsOfService, setYearsOfService] = useState('');
  const [isActiveInForce, setIsActiveInForce] = useState<boolean>(true);
  const [bio, setBio] = useState('');
  const [showForcePicker, setShowForcePicker] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<{
    current?: string;
    newPass?: string;
    confirm?: string;
  }>({});

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
          setMilitaryForce((data.militaryForce as MilitaryForce) || '');
          setYearsOfService(
            data.yearsOfService !== undefined && data.yearsOfService !== null
              ? String(data.yearsOfService)
              : ''
          );
          setIsActiveInForce(data.isActiveInForce ?? true);
          setBio(data.bio || '');
          setAvatarUrl(data.avatarUrl || '');
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
          useCallStore.getState().setIsAnonymous(Boolean(data.isAnonymous));
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

  const handleSelectAvatarSource = () => {
    if (!isChaplain) return;

    const options: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[] = [
      {
        text: 'Elegir de la galería',
        onPress: () => handlePickFromGallery(),
      },
      {
        text: 'Tomar fotografía',
        onPress: () => handleTakePhoto(),
      },
    ];

    if (avatarUrl) {
      options.push({
        text: 'Eliminar foto actual',
        style: 'destructive',
        onPress: () => handleRemoveAvatar(),
      });
    }

    options.push({ text: 'Cancelar', style: 'cancel' });

    Alert.alert('Foto de Perfil Ministerial', 'Seleccioná el origen de tu fotografía institucional:', options);
  };

  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permiso Denegado',
          'Se requiere acceso a la galería para poder subir una foto de perfil ministerial.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processAndUploadAvatar(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo seleccionar la imagen.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permiso Denegado',
          'Se requiere acceso a la cámara para tomar una foto de perfil ministerial.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processAndUploadAvatar(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo capturar la fotografía.');
    }
  };

  const processAndUploadAvatar = async (localUri: string) => {
    setIsUploadingAvatar(true);
    try {
      const uploadedUrl = await uploadAvatarFile(localUri);
      setAvatarUrl(uploadedUrl);

      if (chaplainProfile) {
        const updated = await updateChaplainProfile({
          fullName: fullName.trim() || chaplainProfile.fullName,
          militaryForce: (militaryForce as MilitaryForce) || (chaplainProfile.militaryForce as MilitaryForce),
          militaryRank: militaryRank.trim() || chaplainProfile.militaryRank || undefined,
          yearsOfService: parseInt(yearsOfService, 10) || chaplainProfile.yearsOfService || 0,
          isActiveInForce: isActiveInForce,
          bio: bio.trim() || chaplainProfile.bio || undefined,
          avatarUrl: uploadedUrl,
        });
        setChaplainProfile(updated);
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.getState().setUser({
            ...currentUser,
            avatarUrl: updated.avatarUrl || null,
            fullName: updated.fullName || currentUser.fullName,
          });
        }
      }

      Alert.alert('Foto Actualizada', 'Tu foto de perfil ministerial ha sido guardada exitosamente.');
    } catch (err: any) {
      Alert.alert('Error al Subir', err?.message || 'No se pudo procesar o subir la foto de perfil al servidor.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    Alert.alert(
      'Eliminar Foto',
      '¿Deseás remover tu foto de perfil ministerial y volver al emblema institucional?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setIsUploadingAvatar(true);
            try {
              setAvatarUrl('');
              if (chaplainProfile) {
                const updated = await updateChaplainProfile({
                  fullName: fullName.trim() || chaplainProfile.fullName,
                  militaryForce: (militaryForce as MilitaryForce) || (chaplainProfile.militaryForce as MilitaryForce),
                  militaryRank: militaryRank.trim() || chaplainProfile.militaryRank || undefined,
                  yearsOfService: parseInt(yearsOfService, 10) || chaplainProfile.yearsOfService || 0,
                  isActiveInForce: isActiveInForce,
                  bio: bio.trim() || chaplainProfile.bio || undefined,
                  avatarUrl: '',
                });
                setChaplainProfile(updated);
                const currentUser = useAuthStore.getState().user;
                if (currentUser) {
                  useAuthStore.getState().setUser({
                    ...currentUser,
                    avatarUrl: null,
                    fullName: updated.fullName || currentUser.fullName,
                  });
                }
              }
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'No se pudo remover la foto de perfil.');
            } finally {
              setIsUploadingAvatar(false);
            }
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      if (isChaplain) {
        const trimmedName = fullName.trim();
        if (!trimmedName) {
          Alert.alert('Campo Requerido', 'El nombre completo es obligatorio.');
          setIsSaving(false);
          return;
        }

        if (!militaryForce) {
          Alert.alert(
            'Campo Requerido',
            'Debés seleccionar la Fuerza Militar o de Seguridad en la que prestás o prestaste servicio.'
          );
          setIsSaving(false);
          return;
        }

        const parsedYears =
          yearsOfService.trim() !== '' ? parseInt(yearsOfService.trim(), 10) : NaN;
        if (isNaN(parsedYears) || parsedYears < 0) {
          Alert.alert(
            'Años de Servicio Inválidos',
            'Por favor ingresá un número válido para los años de servicio (0 o mayor).'
          );
          setIsSaving(false);
          return;
        }

        const updated = await updateChaplainProfile({
          fullName: trimmedName,
          militaryForce: militaryForce as MilitaryForce,
          militaryRank: militaryRank.trim() || undefined,
          yearsOfService: parsedYears,
          isActiveInForce: isActiveInForce,
          bio: bio.trim() || undefined,
          avatarUrl: avatarUrl.trim() || undefined,
        });
        setChaplainProfile(updated);
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.getState().setUser({
            ...currentUser,
            avatarUrl: updated.avatarUrl || null,
            fullName: updated.fullName || currentUser.fullName,
          });
        }
        Alert.alert('Perfil Actualizado', 'Tus datos de servicio ministerial han sido guardados.');
      } else {
        const updated = await updateMyBasicProfile({
          fullName: fullName.trim() || undefined,
          phone: phone.trim() || undefined,
          location: location.trim() || undefined,
          isAnonymous,
          anonymous: isAnonymous,
        });
        setBasicProfile(updated);
        useCallStore.getState().setIsAnonymous(Boolean(updated?.isAnonymous ?? isAnonymous));
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
    useCallStore.getState().setIsAnonymous(nextVal);
    if (!isChaplain) {
      try {
        await updateMyBasicProfile({ isAnonymous: nextVal, anonymous: nextVal });
      } catch (e) {
        // Ignored
      }
    }
  };

  const handleChangePasswordSubmit = async () => {
    const nextFieldErrors: { current?: string; newPass?: string; confirm?: string } = {};

    if (!currentPassword) {
      nextFieldErrors.current = 'Ingresá tu contraseña actual.';
    }
    if (!newPassword) {
      nextFieldErrors.newPass = 'Ingresá tu nueva contraseña.';
    } else if (newPassword.length < 6) {
      nextFieldErrors.newPass = 'La nueva contraseña debe tener al menos 6 caracteres.';
    }
    if (!confirmNewPassword) {
      nextFieldErrors.confirm = 'Confirmá tu nueva contraseña.';
    } else if (newPassword && newPassword !== confirmNewPassword) {
      nextFieldErrors.confirm = 'Las nuevas contraseñas no coinciden.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setPasswordFieldErrors(nextFieldErrors);
      setPasswordError('Revisá los campos indicados para actualizar tu contraseña.');
      return;
    }

    setPasswordFieldErrors({});
    setPasswordError(null);
    setIsChangingPassword(true);

    try {
      await request<MessageResponse>(ENDPOINTS.AUTH_CHANGE_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmNewPassword(false);

      Alert.alert(
        'Contraseña Actualizada',
        'Tu contraseña ha sido modificada exitosamente bajo protocolo seguro.'
      );
    } catch (err: any) {
      setPasswordError(err.message || 'Error al cambiar la contraseña.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Cerrar sesión',
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
    <>
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
          {isChaplain ? (
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleSelectAvatarSource}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Cambiar foto de perfil ministerial"
            >
              <View style={styles.avatarInner}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
                ) : (
                  <InstitutionalEmblem size={52} />
                )}
                {isUploadingAvatar && (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}
              </View>
              <View style={styles.cameraBadge}>
                <Camera size={11} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.avatarContainer}>
              <View style={styles.avatarInner}>
                <InstitutionalEmblem size={52} />
              </View>
              <View style={styles.onlineBadge}>
                <View style={styles.onlineInnerDot} />
              </View>
            </View>
          )}

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
            {/* 1. Military Force Select */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>FUERZA MILITAR / DE SEGURIDAD</Text>
              <TouchableOpacity
                style={styles.selectWrapper}
                onPress={() => setShowForcePicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.selectLeft}>
                  <Award size={16} color={Theme.colors.onSurfaceVariant} />
                  <Text
                    style={[
                      styles.selectText,
                      !militaryForce && styles.selectPlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {MILITARY_FORCES.find((f) => f.value === militaryForce)?.label ||
                      'Seleccionar Fuerza Militar / De Seguridad'}
                  </Text>
                </View>
                <ChevronDown size={16} color={Theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* 2. Active in Force Status */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>SITUACIÓN DE REVISTA / ESTADO EN LA FUERZA</Text>
              <View style={styles.statusToggleContainer}>
                <TouchableOpacity
                  style={[
                    styles.statusToggleOption,
                    isActiveInForce && styles.statusToggleOptionActive,
                  ]}
                  onPress={() => setIsActiveInForce(true)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.statusToggleText,
                      isActiveInForce && styles.statusToggleTextActive,
                    ]}
                  >
                    Servicio Activo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusToggleOption,
                    !isActiveInForce && styles.statusToggleOptionActive,
                  ]}
                  onPress={() => setIsActiveInForce(false)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.statusToggleText,
                      !isActiveInForce && styles.statusToggleTextActive,
                    ]}
                  >
                    Retirado / Reserva
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 3. Military Rank */}
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

            {/* 4. Years of Service */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>AÑOS DE SERVICIO EN LA FUERZA</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={yearsOfService}
                  onChangeText={setYearsOfService}
                  placeholder="Ej. 16"
                  keyboardType="numeric"
                  placeholderTextColor={Theme.colors.onSurfaceVariant}
                />
              </View>
            </View>

            {/* 5. Pastoral Bio & Specialty */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>RESEÑA PASTORAL Y ESPECIALIDAD</Text>
              <View style={[styles.inputWrapper, { height: 74, alignItems: 'flex-start' }]}>
                <TextInput
                  style={[styles.textInput, { height: 64, textAlignVertical: 'top' }]}
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
        {/* <View style={styles.prefItem}>
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
        </View> */}

        <View style={styles.prefDivider} />

        {/* Option 3: Silent Notifications */}
        {/* <View style={styles.prefItem}>
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
        </View> */}

        <View style={styles.prefDivider} />

        {/* Option 4: Tactical Emergency Mode */}
        {/* <TouchableOpacity
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
        </TouchableOpacity> */}

        <View style={styles.prefDivider} />

        {/* Option 5: Cambiar Contraseña */}
        <TouchableOpacity
          style={styles.prefItem}
          activeOpacity={0.8}
          onPress={() => {
            setPasswordError(null);
            setPasswordFieldErrors({});
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmNewPassword(false);
            setShowPasswordModal(true);
          }}
        >
          <View style={styles.prefItemLeft}>
            <View style={styles.prefIconWrapper}>
              <Lock size={18} color={Theme.colors.secondary} />
            </View>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefItemTitle}>Cambiar Contraseña</Text>
              <Text style={styles.prefItemSub}>Actualizar clave segura de acceso</Text>
            </View>
          </View>
          <ChevronRight size={18} color={Theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </TacticalCard>

      {/* 5. Quick Logout / Cierre Inmediato Seguro */}
      <TacticalButton
        title="Cerrar la sesión"
        onPress={handleLogoutPress}
        variant="primary"
        size="lg"
        leftIcon={<Power size={18} color="#FFFFFF" />}
        style={styles.logoutButton}
      />
    </ScrollView>

      {/* Force Selection Modal */}
      <Modal
        visible={showForcePicker}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowForcePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isTablet && styles.tabletModalCard]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Award size={18} color={Theme.colors.tacticalNavy} />
                <Text style={styles.modalHeaderTitle}>Fuerza Militar o de Seguridad</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowForcePicker(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={Theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Seleccioná la institución a la que pertenecés para registrar en tu legajo ministerial:
            </Text>

            <ScrollView style={styles.forceList} showsVerticalScrollIndicator={false}>
              {MILITARY_FORCES.map((force) => {
                const isSelected = militaryForce === force.value;
                return (
                  <TouchableOpacity
                    key={force.value}
                    style={[
                      styles.forceOptionItem,
                      isSelected && styles.forceOptionItemSelected,
                    ]}
                    onPress={() => {
                      setMilitaryForce(force.value);
                      setShowForcePicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.forceOptionLeft}>
                      <View
                        style={[
                          styles.forceCodeBadge,
                          isSelected && styles.forceCodeBadgeSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.forceCodeBadgeText,
                            isSelected && styles.forceCodeBadgeTextSelected,
                          ]}
                        >
                          {force.code}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.forceOptionText,
                          isSelected && styles.forceOptionTextSelected,
                        ]}
                      >
                        {force.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <CheckCircle2 size={18} color={Theme.colors.tacticalNavy} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!isChangingPassword) setShowPasswordModal(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, isTablet && styles.tabletModalCard]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Lock size={18} color={Theme.colors.tacticalNavy} />
                <Text style={styles.modalHeaderTitle}>Actualizar Contraseña</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowPasswordModal(false)}
                disabled={isChangingPassword}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={Theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Ingresá tu contraseña actual y definí tu nueva clave de acceso seguro (mínimo 6 caracteres).
            </Text>

            {passwordError ? (
              <View style={styles.passwordErrorBox}>
                <Text style={styles.passwordErrorText}>{passwordError}</Text>
              </View>
            ) : null}

            <Text style={[styles.fieldLabel, passwordFieldErrors.current && styles.fieldLabelError]}>
              CONTRASEÑA ACTUAL
            </Text>
            <View style={[styles.inputWrapper, passwordFieldErrors.current && styles.inputWrapperError]}>
              <Lock
                size={16}
                color={passwordFieldErrors.current ? Theme.colors.error : Theme.colors.onSurfaceVariant}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Tu contraseña actual"
                placeholderTextColor={Theme.colors.onSurfaceVariant}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                value={currentPassword}
                onChangeText={(text) => {
                  setCurrentPassword(text);
                  if (passwordFieldErrors.current) {
                    setPasswordFieldErrors((prev) => ({ ...prev, current: undefined }));
                  }
                  if (passwordError) setPasswordError(null);
                }}
              />
              <TouchableOpacity
                style={styles.eyeToggleBtn}
                onPress={() => setShowCurrentPassword((prev) => !prev)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showCurrentPassword ? (
                  <EyeOff size={18} color={Theme.colors.secondary} />
                ) : (
                  <Eye size={18} color={Theme.colors.secondary} />
                )}
              </TouchableOpacity>
            </View>
            {passwordFieldErrors.current ? (
              <Text style={styles.fieldErrorText}>{passwordFieldErrors.current}</Text>
            ) : null}

            <Text style={[styles.fieldLabel, passwordFieldErrors.newPass && styles.fieldLabelError]}>
              NUEVA CONTRASEÑA
            </Text>
            <View style={[styles.inputWrapper, passwordFieldErrors.newPass && styles.inputWrapperError]}>
              <Key
                size={16}
                color={passwordFieldErrors.newPass ? Theme.colors.error : Theme.colors.onSurfaceVariant}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Nueva contraseña (min 6 caracteres)"
                placeholderTextColor={Theme.colors.onSurfaceVariant}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  if (passwordFieldErrors.newPass) {
                    setPasswordFieldErrors((prev) => ({ ...prev, newPass: undefined }));
                  }
                  if (confirmNewPassword && text === confirmNewPassword && passwordFieldErrors.confirm) {
                    setPasswordFieldErrors((prev) => ({ ...prev, confirm: undefined }));
                  }
                  if (passwordError) setPasswordError(null);
                }}
              />
              <TouchableOpacity
                style={styles.eyeToggleBtn}
                onPress={() => setShowNewPassword((prev) => !prev)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showNewPassword ? (
                  <EyeOff size={18} color={Theme.colors.secondary} />
                ) : (
                  <Eye size={18} color={Theme.colors.secondary} />
                )}
              </TouchableOpacity>
            </View>
            {passwordFieldErrors.newPass ? (
              <Text style={styles.fieldErrorText}>{passwordFieldErrors.newPass}</Text>
            ) : null}

            <Text style={[styles.fieldLabel, passwordFieldErrors.confirm && styles.fieldLabelError]}>
              CONFIRMAR NUEVA CONTRASEÑA
            </Text>
            <View style={[styles.inputWrapper, passwordFieldErrors.confirm && styles.inputWrapperError]}>
              <Key
                size={16}
                color={passwordFieldErrors.confirm ? Theme.colors.error : Theme.colors.onSurfaceVariant}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Reingrese la nueva contraseña"
                placeholderTextColor={Theme.colors.onSurfaceVariant}
                secureTextEntry={!showConfirmNewPassword}
                autoCapitalize="none"
                value={confirmNewPassword}
                onChangeText={(text) => {
                  setConfirmNewPassword(text);
                  if (newPassword && text && newPassword !== text) {
                    setPasswordFieldErrors((prev) => ({
                      ...prev,
                      confirm: 'Las contraseñas no coinciden aún.',
                    }));
                  } else if (passwordFieldErrors.confirm) {
                    setPasswordFieldErrors((prev) => ({ ...prev, confirm: undefined }));
                  }
                  if (passwordError) setPasswordError(null);
                }}
              />
              <TouchableOpacity
                style={styles.eyeToggleBtn}
                onPress={() => setShowConfirmNewPassword((prev) => !prev)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showConfirmNewPassword ? (
                  <EyeOff size={18} color={Theme.colors.secondary} />
                ) : (
                  <Eye size={18} color={Theme.colors.secondary} />
                )}
              </TouchableOpacity>
            </View>
            {passwordFieldErrors.confirm ? (
              <Text style={styles.fieldErrorText}>{passwordFieldErrors.confirm}</Text>
            ) : null}

            <TacticalButton
              title="Guardar Nueva Contraseña"
              variant="secondary"
              size="md"
              loading={isChangingPassword}
              onPress={handleChangePasswordSubmit}
              style={{ marginTop: 14 }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
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
    overflow: 'hidden',
    ...globalStyles.shadowSm,
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Theme.colors.tacticalNavy,
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
  selectWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderRadius: Theme.roundness.md,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 6,
  },
  selectText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  selectPlaceholder: {
    color: Theme.colors.onSurfaceVariant,
  },
  statusToggleContainer: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 2,
  },
  statusToggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Theme.roundness.md,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusToggleOptionActive: {
    backgroundColor: Theme.colors.tacticalNavy,
    borderColor: Theme.colors.tacticalNavy,
  },
  statusToggleText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
  },
  statusToggleTextActive: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.lg,
    padding: 18,
    ...globalStyles.shadowMd,
  },
  tabletModalCard: {
    maxWidth: 460,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalHeaderTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 16,
    color: Theme.colors.onSurface,
  },
  modalCloseBtn: {
    padding: 4,
    borderRadius: Theme.roundness.full,
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  modalSubtitle: {
    ...globalStyles.bodySm,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: 12,
  },
  forceList: {
    maxHeight: 360,
  },
  forceOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: Theme.roundness.md,
    marginBottom: 6,
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  forceOptionItemSelected: {
    backgroundColor: `${Theme.colors.tacticalNavy}14`,
    borderWidth: 1,
    borderColor: Theme.colors.tacticalNavy,
  },
  forceOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  forceCodeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Theme.roundness.xs,
    backgroundColor: Theme.colors.surfaceContainerHigh,
    minWidth: 44,
    alignItems: 'center',
  },
  forceCodeBadgeSelected: {
    backgroundColor: Theme.colors.tacticalNavy,
  },
  forceCodeBadgeText: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.onSurfaceVariant,
  },
  forceCodeBadgeTextSelected: {
    color: '#FFFFFF',
  },
  forceOptionText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: Theme.colors.onSurface,
    flex: 1,
  },
  forceOptionTextSelected: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.tacticalNavy,
  },
  passwordErrorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: Theme.roundness.sm,
    padding: 10,
    marginBottom: 12,
  },
  passwordErrorText: {
    ...globalStyles.bodySm,
    color: Theme.colors.error,
    fontSize: 12,
  },
  fieldLabelError: {
    color: Theme.colors.error,
  },
  inputWrapperError: {
    borderColor: Theme.colors.error,
    backgroundColor: '#FFF5F5',
  },
  eyeToggleBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldErrorText: {
    ...globalStyles.bodySm,
    color: Theme.colors.error,
    fontSize: 11,
    marginTop: -6,
    marginBottom: 8,
    marginLeft: 4,
  },
});
