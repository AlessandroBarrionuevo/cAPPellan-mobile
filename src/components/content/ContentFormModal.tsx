import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import {
  X,
  Headphones,
  Tv,
  Image as ImageIcon,
  Video as VideoIcon,
  Sparkles,
  Save,
} from 'lucide-react-native';
import { createContent, updateContent } from '../../lib/api/content';
import type { ContentItem, ContentType, ContentRequestPayload } from '../../types/api';

interface ContentFormModalProps {
  visible: boolean;
  initialContent?: ContentItem | null;
  onClose: () => void;
  onSuccess: (savedItem: ContentItem) => void;
}

const TYPE_OPTIONS: Array<{
  value: ContentType;
  label: string;
  icon: any;
  placeholder: string;
}> = [
  {
    value: 'SPOTIFY',
    label: 'Spotify',
    icon: Headphones,
    placeholder: 'https://open.spotify.com/episode/...',
  },
  {
    value: 'YOUTUBE',
    label: 'YouTube',
    icon: Tv,
    placeholder: 'https://www.youtube.com/watch?v=... o https://youtu.be/...',
  },
  {
    value: 'IMAGE',
    label: 'Imagen',
    icon: ImageIcon,
    placeholder: 'https://images.unsplash.com/... o enlace a imagen',
  },
  {
    value: 'VIDEO',
    label: 'Video',
    icon: VideoIcon,
    placeholder: 'https://servidor.com/video.mp4',
  },
];

export function ContentFormModal({
  visible,
  initialContent,
  onClose,
  onSuccess,
}: ContentFormModalProps) {
  const isEditing = Boolean(initialContent);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ContentType>('SPOTIFY');
  const [mediaUrl, setMediaUrl] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialContent) {
        setTitle(initialContent.title);
        setType(initialContent.type);
        setMediaUrl(initialContent.mediaUrl);
        setDescription(initialContent.description);
      } else {
        setTitle('');
        setType('SPOTIFY');
        setMediaUrl('');
        setDescription('');
      }
    }
  }, [visible, initialContent]);

  const selectedOption = TYPE_OPTIONS.find((o) => o.value === type) || TYPE_OPTIONS[0];

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Campo Requerido', 'Ingresá el título del contenido.');
      return;
    }
    if (!mediaUrl.trim()) {
      Alert.alert('Campo Requerido', 'Ingresá el enlace multimedia (URL).');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Campo Requerido', 'Ingresá la descripción o reflexión pastoral.');
      return;
    }

    const payload: ContentRequestPayload = {
      title: title.trim(),
      type,
      mediaUrl: mediaUrl.trim(),
      description: description.trim(),
    };

    setIsSubmitting(true);
    try {
      let result: ContentItem;
      if (isEditing && initialContent) {
        result = await updateContent(initialContent.id, payload);
      } else {
        result = await createContent(payload);
      }
      onSuccess(result);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo guardar el contenido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleCol}>
              <View style={styles.badgeRow}>
                <Sparkles size={12} color={Theme.colors.primary} />
                <Text style={styles.badgeText}>
                  {isEditing ? 'MODIFICAR CONTENIDO' : 'NUEVA PUBLICACIÓN'}
                </Text>
              </View>
              <Text style={styles.headerTitle}>
                {isEditing ? 'Editar Recurso Editorial' : 'Publicar Nuevo Contenido'}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <X size={20} color={Theme.colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formBody}
          >
            {/* 1. Type Selector */}
            <Text style={styles.label}>TIPO DE CONTENIDO</Text>
            <View style={styles.typeGrid}>
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = opt.value === type;
                return (
                  <Pressable
                    key={opt.value}
                    style={[
                      styles.typePill,
                      isSelected && styles.typePillActive,
                    ]}
                    onPress={() => setType(opt.value)}
                  >
                    <Icon
                      size={16}
                      color={isSelected ? '#FFFFFF' : Theme.colors.secondary}
                    />
                    <Text
                      style={[
                        styles.typePillText,
                        isSelected && styles.typePillTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 2. Title Input */}
            <Text style={styles.label}>TÍTULO DE LA REFLEXIÓN</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Paz en la Tormenta: Manejo del Estrés"
              placeholderTextColor="#8A92A0"
              value={title}
              onChangeText={setTitle}
            />

            {/* 3. Media URL */}
            <Text style={styles.label}>ENLACE MULTIMEDIA (URL)</Text>
            <TextInput
              style={styles.input}
              placeholder={selectedOption.placeholder}
              placeholderTextColor="#8A92A0"
              value={mediaUrl}
              onChangeText={setMediaUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            {/* 4. Description */}
            <Text style={styles.label}>DESCRIPCIÓN Y REFLEXIÓN PASTORAL</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Escribí una reflexión, pasaje bíblico o contexto para la comunidad..."
              placeholderTextColor="#8A92A0"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </Pressable>

            <Pressable
              style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Save size={16} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>
                    {isEditing ? 'Guardar Cambios' : 'Publicar'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(14, 28, 44, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    paddingTop: 16,
    ...globalStyles.shadowMd,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8ECF2',
  },
  headerTitleCol: {
    flex: 1,
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  badgeText: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.primary,
  },
  headerTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 18,
    color: Theme.colors.onSurface,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Theme.roundness.full,
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  formBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  label: {
    ...globalStyles.labelCaps,
    fontSize: 10,
    color: Theme.colors.secondary,
    marginBottom: 6,
    marginTop: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.roundness.full,
    backgroundColor: Theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  typePillActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  typePillText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
  },
  typePillTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F3F6FA',
    borderRadius: Theme.roundness.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: Theme.fonts.body,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: Theme.colors.onSurface,
  },
  textArea: {
    height: 100,
    paddingTop: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8ECF2',
    backgroundColor: Theme.colors.surfaceContainerLowest,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Theme.roundness.lg,
  },
  cancelBtnText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.secondary,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Theme.roundness.lg,
  },
  submitBtnText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
});
