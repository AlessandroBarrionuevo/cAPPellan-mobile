import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import Svg, { Path, Rect, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import {
  Phone,
  MessageCircle,
  Shield,
  Clock,
  X,
  ChevronRight,
  ExternalLink,
} from 'lucide-react-native';

const INSTAGRAM_GRADIENT = {
  id: 'instagramGrad',
  stops: [
    { offset: '0%', color: '#833AB4' },   // Purple
    { offset: '30%', color: '#C13584' },  // Deep Magenta
    { offset: '60%', color: '#E1306C' },  // Crimson Pink
    { offset: '85%', color: '#FD1D1D' },  // Vibrant Coral
    { offset: '100%', color: '#F77737' }, // Warm Orange
  ],
};

function InstagramIcon({ size = 18, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <Circle cx="12" cy="12" r="4" />
      <Line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </Svg>
  );
}

interface GradientConfig {
  id: string;
  stops: { offset: string; color: string }[];
}

interface ChannelPillProps {
  title: string;
  tag?: string;
  desc: string;
  icon: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress: () => void;
  accentColor?: string;
  gradient?: GradientConfig;
}

function ChannelPill({
  title,
  tag,
  desc,
  icon,
  rightIcon,
  onPress,
  accentColor = '#0C7AE0',
  gradient,
}: ChannelPillProps) {
  const [pillWidth, setPillWidth] = useState(300);

  return (
    <TouchableOpacity
      style={styles.pillContainer}
      onPress={onPress}
      activeOpacity={0.82}
    >
      {/* Left Icon Badge with Outer Arc & Elevated White Circle */}
      <View style={styles.badgeWrapper}>
        <Svg width={54} height={54} viewBox="0 0 54 54" style={styles.arcSvg}>
          {gradient && (
            <Defs>
              <LinearGradient id={`${gradient.id}-arc`} x1="0" y1="0" x2="0" y2="1">
                {gradient.stops.map((stop, i) => (
                  <Stop key={i} offset={stop.offset} stopColor={stop.color} />
                ))}
              </LinearGradient>
            </Defs>
          )}
          <Path
            d="M 27 3 A 24 24 0 0 0 27 51"
            stroke={gradient ? `url(#${gradient.id}-arc)` : accentColor}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
        <View style={styles.whiteDisc}>
          <View style={[styles.innerBlueCircle, !gradient && { backgroundColor: accentColor }]}>
            {gradient && (
              <Svg
                style={StyleSheet.absoluteFillObject}
                width={30}
                height={30}
                viewBox="0 0 30 30"
              >
                <Defs>
                  <LinearGradient id={`${gradient.id}-circle`} x1="0" y1="1" x2="1" y2="0">
                    {gradient.stops.map((stop, i) => (
                      <Stop key={i} offset={stop.offset} stopColor={stop.color} />
                    ))}
                  </LinearGradient>
                </Defs>
                <Circle cx={15} cy={15} r={15} fill={`url(#${gradient.id}-circle)`} />
              </Svg>
            )}
            {icon}
          </View>
        </View>
      </View>

      {/* Pill Capsule Body */}
      <View
        style={[
          styles.pillBody,
          !gradient && { backgroundColor: accentColor },
          gradient && styles.pillBodyGradient,
        ]}
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0) setPillWidth(w);
        }}
      >
        {gradient && (
          <Svg
            style={StyleSheet.absoluteFillObject}
            width={pillWidth}
            height={50}
          >
            <Defs>
              <LinearGradient id={`${gradient.id}-pill`} x1="0" y1="0" x2={pillWidth} y2="0" gradientUnits="userSpaceOnUse">
                {gradient.stops.map((stop, i) => (
                  <Stop key={i} offset={stop.offset} stopColor={stop.color} />
                ))}
              </LinearGradient>
            </Defs>
            <Rect
              x="0"
              y="0"
              width={pillWidth}
              height={50}
              rx={25}
              ry={25}
              fill={`url(#${gradient.id}-pill)`}
            />
          </Svg>
        )}

        <View style={styles.pillTextContent}>
          <View style={styles.pillTitleRow}>
            <Text style={styles.pillTitleText} numberOfLines={1}>
              {title}
            </Text>
            {tag && (
              <View style={styles.pillTag}>
                <Text style={styles.pillTagText}>{tag}</Text>
              </View>
            )}
          </View>
          <Text style={styles.pillDescText} numberOfLines={1}>
            {desc}
          </Text>
        </View>

        {rightIcon || <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.2} />}
      </View>
    </TouchableOpacity>
  );
}

export interface NoChaplainAvailableModalProps {
  visible: boolean;
  onClose: () => void;
  onRetry?: () => void;
}

export default function NoChaplainAvailableModal({
  visible,
  onClose,
  onRetry,
}: NoChaplainAvailableModalProps) {
  const { width } = useWindowDimensions();
  const isTablet = width > 500;

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch((err) => {
      console.warn('Could not launch dialer:', err);
    });
  };

  const handleWhatsApp = () => {
    // Configured or placeholder emergency WhatsApp line for Chaplaincy
    const phone = process.env.EXPO_PUBLIC_WHATSAPP_PHONE || '5491100000000';
    const message = encodeURIComponent(
      'Hola, me comunico desde la App de Capellanía solicitando contención o asistencia pastoral.'
    );
    Linking.openURL(`https://wa.me/${phone}?text=${message}`).catch((err) => {
      console.warn('Could not launch WhatsApp:', err);
    });
  };

  const handleInstagram = () => {
    const igUrl = 'https://www.instagram.com/capellaniaevangelica.ba?stkn=NXl1aWcxenFtcGx2';
    Linking.openURL(igUrl).catch((err) => {
      console.warn('Could not open Instagram:', err);
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, isTablet && styles.tabletCard]}>
          {/* Top Bar with Close Button */}
          <View style={styles.topBar}>
            <View style={styles.badgeIndicator}>
              <Clock size={14} color="#D97706" />
              <Text style={styles.badgeIndicatorText}>GUARDIA EN CURSO</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Main Visual Banner (Comforting, Non-aggressive) */}
          <View style={styles.bannerContainer}>
            <Text style={styles.title}>Capellanes en Atención Activa</Text>
            <Text style={styles.subtitle}>
              En este momento todos nuestros capellanes de turno se encuentran brindando contención en servicio operativo.
            </Text>
            <Text style={styles.subNote}>
              Tu bienestar y el de tus camaradas es prioridad. Si te encontrás en una situación crítica o urgente, podés comunicarte inmediatamente a través de las siguientes líneas de guardia:
            </Text>
          </View>

          {/* Contact / Emergency Channels */}
          <ScrollView
            style={styles.channelsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.channelsContent}
          >
            {/* 1. Línea 911 (Emergencias Policiales y Seguridad) */}
            <ChannelPill
              title="Línea 911"
              tag="24 HS"
              desc="Emergencias de seguridad, salud y apoyo operativo."
              icon={<Phone size={16} color="#FFFFFF" strokeWidth={2.4} />}
              onPress={() => handleCall('911')}
              accentColor="#0C7AE0"
            />

            {/* 2. Línea 147 (Asistencia y Contención Ciudadana) */}
            <ChannelPill
              title="Línea 147"
              tag="CIUDAD"
              desc="Orientación social, psicológica y asistencia CABA."
              icon={<Phone size={16} color="#FFFFFF" strokeWidth={2.4} />}
              onPress={() => handleCall('147')}
              accentColor="#FFA500"
            />

            {/* 3. WhatsApp de la Capellanía */}
            <ChannelPill
              title="WhatsApp Capellania"
              tag=""
              desc="Dejanos tu consulta y un capellán responderá a la brevedad."
              icon={<MessageCircle size={16} color="#FFFFFF" strokeWidth={2.4} />}
              
              onPress={handleWhatsApp}
              accentColor="#25d366"
            />

            {/* 4. Instagram Institucional */}
            <ChannelPill
              title="Instagram"
              desc="Novedades, reflexiones diarias y canal comunitario."
              icon={<InstagramIcon size={16} color="#FFFFFF" />}
              onPress={handleInstagram}
              gradient={INSTAGRAM_GRADIENT}
            />
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            {onRetry && (
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  onClose();
                  onRetry();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.retryButtonText}>Volver a intentar</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.dismissButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  modalCard: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    ...globalStyles.shadowLg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabletCard: {
    maxWidth: 480,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badgeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeIndicatorText: {
    ...globalStyles.labelCaps,
    color: '#B45309',
    fontSize: 9.5,
    letterSpacing: 0.6,
    fontFamily: Theme.fonts.headlineBold,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 4,
    borderColor: '#F8FAFC',
  },
  title: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 18,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  subNote: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
  },
  channelsList: {
    maxHeight: 290,
    marginBottom: 14,
  },
  channelsContent: {
    gap: 12,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  badgeWrapper: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginRight: -16,
  },
  arcSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  whiteDisc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  innerBlueCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#0C7AE0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBody: {
    flex: 1,
    height: 50,
    backgroundColor: '#0C7AE0',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 22,
    paddingRight: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0C7AE0',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.22,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pillBodyGradient: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#C13584',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.28,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  pillTextContent: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 8,
  },
  pillTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  pillTitleText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  pillTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  pillTagText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 9.5,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  pillDescText: {
    fontFamily: Theme.fonts.body,
    fontSize: 12,
    color: '#E0F2FE',
    lineHeight: 16,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 8,
  },
  retryButton: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  retryButtonText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 14,
    color: '#334155',
  },
  dismissButton: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    backgroundColor: Theme.colors.tacticalNavy,
    alignItems: 'center',
    justifyContent: 'center',
    ...globalStyles.shadowSm,
  },
  dismissButtonText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
