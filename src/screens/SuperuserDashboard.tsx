import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Theme, globalStyles } from '../theme/Theme';
import { request } from '../lib/api/client';
import { ENDPOINTS } from '../lib/api/endpoints';
import type { AuthUser, AppRole } from '../../types/api';
import {
  UserPlus,
  Shield,
  User,
  X,
  Check,
  RefreshCw,
} from 'lucide-react-native';

export default function SuperuserDashboard() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New user form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AppRole>('CHAPLAIN');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await request<AuthUser[]>(ENDPOINTS.USERS);
      setUsers(data || []);
    } catch (err: any) {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Completá usuario y contraseña');
      return;
    }

    setIsCreating(true);
    try {
      await request(ENDPOINTS.USERS, {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          role,
        }),
      });

      Alert.alert('Éxito', `Usuario ${username} creado`);
      setShowCreateModal(false);
      setUsername('');
      setPassword('');
      loadUsers();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo crear el usuario');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.headerCard, globalStyles.shadowSoft]}>
        <View style={styles.headerInfo}>
          <Text style={styles.roleTag}>Panel de Administración</Text>
          <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
          <Text style={styles.headerSubtitle}>
            Control global de accesos y roles del sistema
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.85}
          >
            <UserPlus size={18} color="#FFFFFF" />
            <Text style={styles.createBtnText}>Nuevo Usuario</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={loadUsers}
            activeOpacity={0.8}
          >
            <RefreshCw size={18} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Users List */}
      <Text style={styles.sectionTitle}>
        Usuarios Registrados ({users.length})
      </Text>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={Theme.colors.primary}
          style={{ marginTop: 30 }}
        />
      ) : (
        users.map((item) => (
          <View
            key={item.userId}
            style={[styles.userCard, globalStyles.shadowSoft]}
          >
            <View style={styles.userAvatar}>
              <User size={20} color={Theme.colors.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.username}</Text>
              <Text style={styles.userRole}>ID #{item.userId}</Text>
            </View>
            <View
              style={[
                styles.roleBadge,
                item.role === 'SUPERUSER' && { backgroundColor: '#FCE8E6' },
              ]}
            >
              <Text
                style={[
                  styles.roleBadgeText,
                  item.role === 'SUPERUSER' && { color: '#C5221F' },
                ]}
              >
                {item.role}
              </Text>
            </View>
          </View>
        ))
      )}

      {/* Create User Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, globalStyles.shadowSoft]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear Nuevo Usuario</Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.closeBtn}
              >
                <X size={20} color={Theme.colors.outline} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Nombre de Usuario</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: capellan_carlos"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />

              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 4 caracteres"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <Text style={styles.label}>Rol en la Plataforma</Text>
              <View style={styles.roleOptions}>
                {(
                  [
                    'BASIC',
                    'CHAPLAIN',
                    'CHAPLAIN_LEADER',
                    'SUPERUSER',
                  ] as AppRole[]
                ).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.roleOptionPill,
                      role === r && styles.roleOptionPillActive,
                    ]}
                    onPress={() => setRole(r)}
                  >
                    <Text
                      style={[
                        styles.roleOptionPillText,
                        role === r && styles.roleOptionPillTextActive,
                      ]}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, isCreating && { opacity: 0.6 }]}
                onPress={handleCreateUser}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Crear Usuario</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingTop: Theme.spacing.stackMd,
    paddingBottom: 110,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E7EEFF',
    marginBottom: 20,
  },
  headerInfo: {
    marginBottom: 16,
  },
  roleTag: {
    ...globalStyles.labelCaps,
    color: Theme.colors.primary,
    marginBottom: 4,
  },
  headerTitle: {
    ...globalStyles.headlineMd,
    fontSize: 22,
    color: Theme.colors.primary,
  },
  headerSubtitle: {
    ...globalStyles.bodySm,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createBtn: {
    flex: 1,
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Theme.roundness.lg,
    gap: 8,
  },
  createBtnText: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 14,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: Theme.roundness.lg,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...globalStyles.headlineMd,
    fontSize: 18,
    color: Theme.colors.primary,
    marginBottom: 12,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.xl,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E7EEFF',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 15,
    color: Theme.colors.onSurface,
  },
  userRole: {
    ...globalStyles.bodySm,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
  },
  roleBadge: {
    backgroundColor: '#E8F0FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.roundness.sm,
  },
  roleBadgeText: {
    ...globalStyles.labelCaps,
    color: Theme.colors.primary,
    fontSize: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    ...globalStyles.headlineMd,
    fontSize: 20,
    color: Theme.colors.primary,
  },
  closeBtn: {
    padding: 4,
  },
  label: {
    ...globalStyles.labelCaps,
    color: Theme.colors.primary,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F3F6FA',
    borderRadius: Theme.roundness.lg,
    padding: 12,
    fontSize: 15,
    fontFamily: Theme.fonts.body,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  roleOptionPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.roundness.full,
    backgroundColor: '#F0F4F8',
  },
  roleOptionPillActive: {
    backgroundColor: Theme.colors.primary,
  },
  roleOptionPillText: {
    ...globalStyles.bodySm,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
  },
  roleOptionPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: Theme.colors.primary,
    height: 48,
    borderRadius: Theme.roundness.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  submitBtnText: {
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
});
