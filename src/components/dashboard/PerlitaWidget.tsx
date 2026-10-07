import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import { TacticalCard } from '../common';
import { Sparkles, RefreshCw, Share2, BookOpen } from 'lucide-react-native';
import type { Perlita } from '../../types/bible';

interface PerlitaWidgetProps {
  perlita: Perlita | null;
  isLoading: boolean;
  isRandom: boolean;
  onRandomPerlita: () => void;
  onSharePerlita: () => void;
  onNavigateToBible?: () => void;
}

export function PerlitaWidget({
  perlita,
  isLoading,
  isRandom,
  onRandomPerlita,
  onSharePerlita,
  onNavigateToBible,
}: PerlitaWidgetProps) {
  return (
    <TacticalCard style={styles.reflectionCard} padding={16}>
      <View style={styles.reflectionHeader}>
        <View style={styles.reflectionBadgeRow}>
          <View style={styles.reflectionTitleRow}>
            <Sparkles size={14} color="#0c7ae0" />
            <Text style={styles.reflectionBadge}>
              {isRandom ? 'PERLITA DEVOCIONAL ALEATORIA' : 'PERLITA DEL DÍA'}
            </Text>
          </View>

          <View style={styles.headerRightCol}>
            {perlita?.date && (
              <Text style={styles.reflectionToday}>{perlita.date}</Text>
            )}
          </View>
        </View>
        <View style={styles.headerRightCol}>
          {perlita?.theme && (
            <View style={styles.themeBadge}>
              <Text style={styles.themeBadgeText}>{perlita.theme}</Text>
            </View>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.widgetLoading}>
          <ActivityIndicator size="small" color={Theme.colors.tacticalNavy} />
          <Text style={styles.widgetLoadingText}>Cargando versículo del día...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.quoteText}>
            “{perlita?.text || 'Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque el Señor tu Dios estará contigo en cada servicio, patrulla y misión.'}”
          </Text>

          <View style={styles.reflectionFooter}>
            <View style={styles.widgetFooterTextCol}>
              <Text style={styles.scriptureRef}>
                {perlita?.reference || 'Josué 1:9'}
                {/* {perlita?.translation ? ` • ${perlita.translation}` : ''} */}
              </Text>
              {perlita?.attribution && (
                <Text style={styles.attributionText} numberOfLines={1}>
                  {perlita.attribution}
                </Text>
              )}
            </View>

            <View style={styles.widgetActionButtons}>
              <TouchableOpacity
                style={styles.widgetIconBtn}
                onPress={onRandomPerlita}
                activeOpacity={0.8}
                accessibilityLabel="Generar perlita aleatoria"
              >
                <RefreshCw size={14} color={Theme.colors.tacticalNavy} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.widgetIconBtn}
                onPress={onSharePerlita}
                activeOpacity={0.8}
                accessibilityLabel="Compartir versículo"
              >
                <Share2 size={14} color={Theme.colors.tacticalNavy} />
              </TouchableOpacity>

              {onNavigateToBible && (
                <TouchableOpacity
                  style={styles.widgetBibleBtn}
                  onPress={onNavigateToBible}
                  activeOpacity={0.8}
                >
                  <BookOpen size={13} color="#FFFFFF" />
                  <Text style={styles.widgetBibleBtnText}>Leer</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </>
      )}
    </TacticalCard>
  );
}

const styles = StyleSheet.create({
  reflectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  reflectionHeader: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerRightCol: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  themeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  themeBadgeText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 9.5,
    color: '#0c7ae0',
    letterSpacing: 0.2,
  },
  reflectionBadgeRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  reflectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  reflectionBadge: {
    ...globalStyles.labelCaps,
    color: Theme.colors.secondary,
    fontSize: 10,
    fontWeight: '700',
  },
  reflectionToday: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
  },
  quoteText: {
    fontFamily: Theme.fonts.headlineBold,
    fontSize: 15,
    lineHeight: 22,
    color: '#0F2438',
    marginBottom: 12,
  },
  reflectionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  widgetFooterTextCol: {
    flex: 1,
  },
  scriptureRef: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
    color: Theme.colors.tacticalNavy,
  },
  attributionText: {
    fontFamily: Theme.fonts.body,
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  widgetActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  widgetIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  widgetBibleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Theme.colors.tacticalNavy,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  widgetBibleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: Theme.fonts.bodySemiBold,
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
