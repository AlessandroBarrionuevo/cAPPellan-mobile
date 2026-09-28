import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  MessageCircle,
  Heart,
  Send,
  ShieldCheck,
} from 'lucide-react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import { useAuthStore } from '../../lib/stores/auth';
import type { ContentItem } from '../../types/api';
import { formatRelativeTime } from './ContentCard';

export interface ContentCommentItem {
  id: number;
  contentId: number;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

const SEED_COMMENTS: Record<number, ContentCommentItem[]> = {
  201: [
    {
      id: 101,
      contentId: 201,
      authorName: 'Cap. Mayor Morales',
      authorRole: 'Capellán',
      content: 'Un mensaje muy oportuno para estos tiempos. La resiliencia espiritual es el pilar de toda vocación de servicio.',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
    {
      id: 102,
      contentId: 201,
      authorName: 'Sargento Primero R. Torres',
      authorRole: 'Ejército',
      content: 'Excelente audio, lo escuchamos junto a la patrulla en la base durante el relevo. Nos dio mucha templanza.',
      createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    },
  ],
  202: [
    {
      id: 201,
      contentId: 202,
      authorName: 'Suboficial M. Albarracín',
      authorRole: 'Gendarmería',
      content: 'Muy emotiva la bendición y palabras de aliento. Gracias por acompañar a nuestras familias que siempre esperan nuestro regreso.',
      createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    {
      id: 202,
      contentId: 202,
      authorName: 'Cap. Álvarez',
      authorRole: 'Capellán',
      content: 'La paz de Dios custodie a cada efectivo en guardia. Cuentan siempre con nuestra oración.',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
  ],
  203: [
    {
      id: 301,
      contentId: 203,
      authorName: 'Cabo Primero E. Benítez',
      authorRole: 'Prefectura',
      content: 'Hermoso versículo para meditar durante la guardia nocturna. Dios nos guarda y acompaña siempre.',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ],
};

const GENERIC_COMMENTS: ContentCommentItem[] = [
  {
    id: 901,
    contentId: 0,
    authorName: 'Capellán de Turno',
    authorRole: 'Capellanía',
    content: 'Que este contenido sea de bendición y edificación para tu vida y tu familia en el servicio.',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 902,
    contentId: 0,
    authorName: 'Camarada en Servicio',
    authorRole: 'Fuerzas',
    content: 'Amén, fortaleza y templanza para todos.',
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

interface ContentCommentsModalProps {
  visible: boolean;
  content: ContentItem | null;
  onClose: () => void;
  onCommentAdded?: (contentId: number, newCount: number) => void;
}

export function ContentCommentsModal({
  visible,
  content,
  onClose,
  onCommentAdded,
}: ContentCommentsModalProps) {
  const user = useAuthStore((state) => state.user);
  const [commentText, setCommentText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [commentsMap, setCommentsMap] = useState<Record<number, ContentCommentItem[]>>(SEED_COMMENTS);

  useEffect(() => {
    if (!visible) {
      setCommentText('');
    }
  }, [visible]);

  if (!visible || !content) return null;

  const currentComments =
    commentsMap[content.id] ||
    GENERIC_COMMENTS.map((gc) => ({ ...gc, contentId: content.id }));

  const handleSendComment = () => {
    const text = commentText.trim();
    if (!text || isPosting) return;

    setIsPosting(true);
    const newComment: ContentCommentItem = {
      id: Date.now(),
      contentId: content.id,
      authorName: user?.username || 'Camarada en Servicio',
      authorRole: user?.role === 'SUPERUSER' ? 'Oficial' : 'Camarada',
      content: text,
      createdAt: new Date().toISOString(),
    };

    const updatedList = [newComment, ...currentComments];
    setCommentsMap((prev) => ({
      ...prev,
      [content.id]: updatedList,
    }));

    setCommentText('');
    setIsPosting(false);

    if (onCommentAdded) {
      onCommentAdded(content.id, updatedList.length);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}
      >
        <View style={styles.modalSheet}>
          {/* Top Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleCol}>
              <View style={styles.badgeRow}>
                <MessageCircle size={13} color="#0c7ae0" />
                <Text style={styles.badgeText}>COMUNIDAD INSTITUCIONAL</Text>
              </View>
              <Text style={styles.headerTitle}>Comentarios & Reflexiones</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {content.title}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={20} color={Theme.colors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Counts & Interaction Stats Pill Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statPill}>
              <Heart
                size={14}
                color={content.isLikedByMe ? '#EF4444' : '#64748B'}
                fill={content.isLikedByMe ? '#EF4444' : 'transparent'}
              />
              <Text style={styles.statPillText}>
                {content.likesCount || 0} Me gusta
              </Text>
            </View>

            <View style={styles.statPill}>
              <MessageCircle size={14} color="#0c7ae0" />
              <Text style={styles.statPillText}>
                {currentComments.length} Comentarios
              </Text>
            </View>
          </View>

          {/* Comments List */}
          <ScrollView
            style={styles.commentsList}
            contentContainerStyle={styles.commentsListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {currentComments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MessageCircle size={36} color="#94A3B8" />
                <Text style={styles.emptyTitle}>Aún no hay comentarios</Text>
                <Text style={styles.emptyText}>
                  Sé el primero en dejar palabras de aliento o reflexión para esta publicación.
                </Text>
              </View>
            ) : (
              currentComments.map((comment) => (
                <View key={comment.id} style={styles.commentCard}>
                  <View style={styles.commentHeader}>
                    <View style={styles.commentAuthorLeft}>
                      <View style={styles.commentAvatarCircle}>
                        <Text style={styles.commentAvatarInitial}>
                          {(comment.authorName || 'C')[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.commentAuthorTextCol}>
                        <View style={styles.authorBadgeRow}>
                          <Text style={styles.authorNameText} numberOfLines={1}>
                            {comment.authorName}
                          </Text>
                          <View style={styles.roleBadge}>
                            <Text style={styles.roleBadgeText}>
                              {comment.authorRole}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.commentDateText}>
                          {formatRelativeTime(comment.createdAt)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={styles.commentBodyText}>{comment.content}</Text>
                </View>
              ))
            )}
          </ScrollView>

          {/* Post Comment Input Bar */}
          <View style={styles.inputContainer}>
            <View style={styles.inputAvatar}>
              <Text style={styles.inputAvatarText}>
                {(user?.username || 'U')[0].toUpperCase()}
              </Text>
            </View>

            <TextInput
              style={styles.textInput}
              placeholder="Escribí un comentario..."
              placeholderTextColor="#94A3B8"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={400}
            />

            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!commentText.trim() || isPosting) && styles.sendBtnDisabled,
              ]}
              onPress={handleSendComment}
              disabled={!commentText.trim() || isPosting}
              activeOpacity={0.8}
            >
              {isPosting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={16} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
    minHeight: '55%',
    paddingTop: 18,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    ...globalStyles.shadowMd,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  headerTitleCol: {
    flex: 1,
    paddingRight: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  badgeText: {
    ...globalStyles.labelCaps,
    fontSize: 10,
    fontWeight: '700',
    color: '#0c7ae0',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 18,
    color: '#0F2438',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats Pill Bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 14,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statPillText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 12,
    color: '#334155',
  },

  // Comments List
  commentsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  commentsListContent: {
    paddingBottom: 16,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 15,
    color: '#334155',
  },
  emptyText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },

  // Comment Card
  commentCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentAuthorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  commentAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0c7ae0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarInitial: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  commentAuthorTextCol: {
    flex: 1,
  },
  authorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorNameText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 13,
    color: '#0F2438',
  },
  roleBadge: {
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 9.5,
    color: '#0c7ae0',
  },
  commentDateText: {
    fontFamily: Theme.fonts.body,
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 1,
  },
  commentBodyText: {
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18,
  },

  // Input Bar
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputAvatarText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 12,
    color: '#475569',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontFamily: Theme.fonts.body,
    fontSize: 13,
    color: '#0F2438',
    maxHeight: 80,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0c7ae0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
});

export default ContentCommentsModal;
