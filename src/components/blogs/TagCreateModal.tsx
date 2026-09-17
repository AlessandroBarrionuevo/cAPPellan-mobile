import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import { X, Tag, Plus } from 'lucide-react-native';
import { createBlogTag } from '../../lib/api/blogs';
import type { BlogTag } from '../../types/blog';

interface TagCreateModalProps {
  visible: boolean;
  onClose: () => void;
  onTagCreated: (tag: BlogTag) => void;
}

export function TagCreateModal({ visible, onClose, onTagCreated }: TagCreateModalProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Campo Requerido', 'Ingresá el nombre de la etiqueta.');
      return;
    }

    try {
      setIsSubmitting(true);
      const newTag = await createBlogTag(trimmed);
      setName('');
      onTagCreated(newTag);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudo crear la etiqueta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Tag size={18} color={Theme.colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.title}>Nueva Etiqueta</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={Theme.colors.secondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Las etiquetas organizan las reflexiones y testimonios del cuerpo de capellanía y camaradas.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>NOMBRE DE LA ETIQUETA</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Misión de paz, Guardia nocturna..."
              placeholderTextColor="#8A92A0"
              value={name}
              onChangeText={setName}
              maxLength={40}
              autoFocus
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Plus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.submitText}>Crear Etiqueta</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.roundness.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: Theme.fonts.headlineBold,
    color: Theme.colors.primaryDark,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.secondary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Theme.colors.outlineVariant,
    borderRadius: Theme.roundness.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.onSurface,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Theme.roundness.md,
  },
  cancelText: {
    fontSize: 13,
    fontFamily: Theme.fonts.bodySemiBold,
    color: Theme.colors.secondary,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: Theme.roundness.md,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    fontSize: 13,
    fontFamily: Theme.fonts.bodySemiBold,
    color: '#FFFFFF',
  },
});
