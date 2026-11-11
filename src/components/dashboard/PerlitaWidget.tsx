import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import {
  Sparkles,
  RefreshCw,
  Share2,
  BookOpen,
  Smartphone,
  Lock,
} from 'lucide-react-native';
import type { Perlita } from '../../types/bible';
import { DEFAULT_FALLBACK_PERLITA } from '../../data/perlitasData';
import {
  syncPerlitaToAndroidWidget,
  pinPerlitaWidgetToHomeScreen,
  isLockScreenPerlitaEnabled,
  toggleLockScreenPerlita,
} from '../../widgets/widgetTaskHandler';

interface PerlitaWidgetProps {
  perlita: Perlita | null;
  isLoading: boolean;
  isRandom: boolean;
  onRandomPerlita: () => void;
  onSharePerlita: () => void;
  onNavigateToBible?: () => void;
}

const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function formatWidgetDate(dateStr?: string): string {
  if (dateStr && dateStr.trim().length > 0) {
    return dateStr;
  }
  const now = new Date();
  return `${MONTHS_ES[now.getMonth()]}, ${now.getDate()}`;
}

export function PerlitaWidget({
  perlita,
  isLoading,
  isRandom,
  onRandomPerlita,
  onSharePerlita,
  onNavigateToBible,
}: PerlitaWidgetProps) {
  const [lockScreenEnabled, setLockScreenEnabled] = useState(false);

  // Sync to native Android home screen widget & lockscreen
  useEffect(() => {
    if (Platform.OS === 'android') {
      isLockScreenPerlitaEnabled().then(setLockScreenEnabled);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android' && perlita) {
      syncPerlitaToAndroidWidget(perlita, isRandom);
    }
  }, [perlita, isRandom]);

  const handlePinHomeWidget = async () => {
    const pinned = await pinPerlitaWidgetToHomeScreen(perlita);
    if (!pinned) {
      Alert.alert(
        'Widget de Pantalla Principal',
        'Mantené presionado un espacio vacío en la pantalla principal de tu celular, tocá "Widgets" y seleccioná "Perlita del Día" de CapellanAPP.'
      );
    }
  };

  const handleToggleLockScreen = async () => {
    const nextState = await toggleLockScreenPerlita(perlita);
    setLockScreenEnabled(nextState);
    if (nextState) {
      Alert.alert(
        'Fijada en Pantalla de Bloqueo',
        'La Perlita del Día ahora se muestra de forma silenciosa en tu pantalla de bloqueo y se renovará automáticamente cada mañana.'
      );
    }
  };

  const fullText = perlita?.text || DEFAULT_FALLBACK_PERLITA.text;
  const referenceText = perlita?.reference || DEFAULT_FALLBACK_PERLITA.reference;
  const translationText =
    perlita?.translation || DEFAULT_FALLBACK_PERLITA.translation;
  const displayDate = formatWidgetDate(perlita?.date);

  // --- Typewriter Text Effect (Faithfully ported from Frontend AnimatedQuoteBlock) ---
  const [displayedText, setDisplayedText] = useState(fullText);
  const [isTyping, setIsTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!fullText) return;

    // Reset and start typewriter typing animation
    setDisplayedText('');
    setIsTyping(true);
    setShowCursor(true);

    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
    }

    let currentIndex = 0;
    typingTimerRef.current = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        setShowCursor(false);
        if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      }
    }, 18);

    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, [fullText]);

  // Cursor blink effect while typing
  useEffect(() => {
    if (!isTyping) {
      setShowCursor(false);
      return;
    }
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 450);
    return () => clearInterval(cursorInterval);
  }, [isTyping]);

  return (
    <View style={styles.cardContainer}>
      {/* 1. Top Header Banner: Tactical Blue (#0c7ae0) */}
      <View style={styles.topHeaderBanner}>
        <View style={styles.bannerLeftRow}>
         
          <View style={styles.bannerTitleCol}>
            <Text style={styles.bannerTitleText}>
              {isRandom ? 'PERLITA DE GUARDIA' : 'PERLITA DEL DÍA'}
            </Text>
             <Text style={styles.bannerDateText}>{displayDate}</Text>
          </View>
        </View>

        <View style={styles.bannerRightRow}>
          <View style={styles.translationBadge}>
            <Text style={styles.translationBadgeText}>{translationText}</Text>
          </View>
         
        </View>
      </View>

      {/* 2. Main Devotional Body with Typewriter Text Animation */}
      <View style={styles.quoteCardBody}>
        {isLoading ? (
          <View style={styles.widgetLoading}>
            <ActivityIndicator size="small" color="#0c7ae0" />
            <Text style={styles.widgetLoadingText}>Cargando versículo de guardia...</Text>
          </View>
        ) : (
          <>
            {/* Big Decorative Quotation Mark from Frontend */}
            <Text style={styles.bigQuoteMark}>“</Text>

            {/* Typewritten Quote Text with Blinking Cursor */}
            <Text style={styles.quoteText}>
              {displayedText}
              {showCursor && <Text style={styles.cursorText}>|</Text>}
              {!isTyping && <Text style={styles.closingQuoteMark}>”</Text>}
            </Text>

            {/* Right-aligned Scripture Reference & Attribution */}
            <View style={styles.referenceContainer}>
              <Text style={styles.referenceText}>
                — {referenceText}
                {translationText ? ` (${translationText})` : ''}
              </Text>
             
            </View>
          </>
        )}
      </View>

      {/* 3. Footer Action Buttons: Refresh, Share, Bible Reader */}
      <View style={styles.footerRow}>
        

        <View style={styles.footerActionsGroup}>
          {/* Refresh Action (Triggers random perlita & restarts typewriter effect) */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onRandomPerlita}
            activeOpacity={0.8}
            accessibilityLabel="Obtener otra perlita"
          >
            <RefreshCw size={13} color="#0c7ae0" />
            <Text style={styles.actionButtonText}>Otro</Text>
          </TouchableOpacity>

          {/* Share Action */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onSharePerlita}
            activeOpacity={0.8}
            accessibilityLabel="Compartir versículo"
          >
            <Share2 size={13} color="#0c7ae0" />
            <Text style={styles.actionButtonText}>Compartir</Text>
          </TouchableOpacity>

          {/* Read in Bible */}
          {onNavigateToBible && (
            <TouchableOpacity
              style={styles.actionButtonPrimary}
              onPress={onNavigateToBible}
              activeOpacity={0.8}
              accessibilityLabel="Leer en la Biblia"
            >
              <BookOpen size={13} color="#FFFFFF" />
              <Text style={styles.actionButtonPrimaryText}>Leer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 4. Native Android Home Screen & Lock Screen Controls */}
      {Platform.OS === 'android' && (
        <View style={styles.androidControlsRow}>
          <TouchableOpacity
            style={styles.androidActionChip}
            onPress={handlePinHomeWidget}
            activeOpacity={0.8}
            accessibilityLabel="Anclar widget en pantalla principal"
          >
            <Smartphone size={12} color="#0c7ae0" />
            <Text style={styles.androidActionChipText}>Widget en Inicio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.androidActionChip,
              lockScreenEnabled && styles.androidActionChipActive,
            ]}
            onPress={handleToggleLockScreen}
            activeOpacity={0.8}
            accessibilityLabel="Fijar perlita en pantalla de bloqueo"
          >
            <Lock
              size={12}
              color={lockScreenEnabled ? '#FFFFFF' : '#0c7ae0'}
            />
            <Text
              style={[
                styles.androidActionChipText,
                lockScreenEnabled && styles.androidActionChipTextActive,
              ]}
            >
              {lockScreenEnabled ? 'Activa en Bloqueo' : 'Fijar en Bloqueo'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#102B52',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 14,
  },
  topHeaderBanner: {
    backgroundColor: '#0c7ae0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitleCol: {
    flexDirection: 'column',
  },
  bannerTitleText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  bannerSubtitleText: {
    fontFamily: Theme.fonts.body,
    fontSize: 10,
    color: '#E0F2FE',
  },
  bannerRightRow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  translationBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  translationBadgeText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bannerDateText: {
    fontFamily: Theme.fonts.body,
    fontSize: 10.5,
    color: '#E0F2FE',
  },
  quoteCardBody: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  bigQuoteMark: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 32,
    lineHeight: 32,
    color: '#0c7ae0',
    opacity: 0.5,
    marginBottom: -8,
  },
  quoteText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 15,
    lineHeight: 23,
    color: '#0F2438',
    fontStyle: 'italic',
  },
  closingQuoteMark: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 16,
    color: '#0c7ae0',
  },
  cursorText: {
    color: '#0c7ae0',
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 2,
  },
  referenceContainer: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  referenceText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0c7ae0',
  },
  attributionText: {
    fontFamily: Theme.fonts.body,
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  footerInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  footerReferenceNotice: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    color: '#64748B',
  },
  footerActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionButtonText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    color: '#0c7ae0',
    fontWeight: '600',
  },
  actionButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0c7ae0',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionButtonPrimaryText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  androidControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 10,
    paddingTop: 6,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  androidActionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  androidActionChipActive: {
    backgroundColor: '#0c7ae0',
    borderColor: '#0c7ae0',
  },
  androidActionChipText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 10.5,
    color: '#0c7ae0',
  },
  androidActionChipTextActive: {
    color: '#FFFFFF',
  },
  widgetLoading: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  widgetLoadingText: {
    ...globalStyles.bodySm,
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
  },
});
