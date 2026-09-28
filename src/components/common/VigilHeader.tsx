import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import { InstitutionalEmblem } from './InstitutionalEmblem';
import { ArrowLeft, Menu, Lock } from 'lucide-react-native';

interface VigilHeaderProps {
  title?: string;
  subtitle?: string;
  sectionBadge?: string;
  onBack?: () => void;
  onMenu?: () => void;
  rightAction?: React.ReactNode;
  showBack?: boolean;
  style?: ViewStyle;
}

export function VigilHeader({
  title = 'cAPPellan',
  subtitle = 'Servicio de Capellanía',
  sectionBadge,
  onBack,
  onMenu,
  rightAction,
  showBack = false,
  style,
}: VigilHeaderProps) {
  return (
    <View style={[styles.headerContainer, style]}>
      <View style={styles.leftGroup}>
        {showBack ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onBack}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={22} color={Theme.colors.onSurface} />
          </TouchableOpacity>
        ) : (
          <View style={styles.emblemWrapper}>
            <InstitutionalEmblem size={34} />
          </View>
        )}

        <View style={styles.titleColumn}>
          <View style={styles.titleRow}>
            <Text style={styles.mainTitle}>{title}</Text>
            {sectionBadge ? (
              <>
                <Text style={styles.badgeText}></Text>
              </>
            ) : null}
          </View>
          <Text style={styles.subtitleText}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.rightGroup}>
        {rightAction ? (
          rightAction
        ) : onMenu ? (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onMenu}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Menu size={22} color={Theme.colors.onSurface} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    height: 64,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(248, 249, 251, 0.96)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
    zIndex: 50,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emblemWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#FFFFFF',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: Theme.roundness.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  titleColumn: {
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 17,
    lineHeight: 22,
    color: Theme.colors.onSurface,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.secondary,
    marginHorizontal: 6,
  },
  badgeText: {
    ...globalStyles.labelMd,
    color: Theme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  subtitleText: {
    ...globalStyles.labelCaps,
    color: Theme.colors.secondary,
    fontSize: 9,
    letterSpacing: 0.8,
    marginTop: 1,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default VigilHeader;
