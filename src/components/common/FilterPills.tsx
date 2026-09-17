import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  View,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';

export interface FilterItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface FilterPillsProps {
  items: FilterItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  style?: ViewStyle;
}

export function FilterPills({
  items,
  selectedId,
  onSelect,
  style,
}: FilterPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
    >
      {items.map((item) => {
        const isSelected = item.id === selectedId;
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onSelect(item.id)}
            activeOpacity={0.8}
            style={[
              styles.pill,
              isSelected ? styles.pillSelected : styles.pillDefault,
            ]}
          >
            {item.icon && <View style={styles.iconWrapper}>{item.icon}</View>}
            <Text
              style={[
                styles.pillText,
                isSelected ? styles.pillTextSelected : styles.pillTextDefault,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Theme.roundness.full,
  },
  pillDefault: {
    backgroundColor: Theme.colors.surfaceContainerLow,
  },
  pillSelected: {
    backgroundColor: Theme.colors.tacticalNavy,
    ...globalStyles.shadowSm,
  },
  iconWrapper: {
    marginRight: 6,
  },
  pillText: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 12,
  },
  pillTextDefault: {
    color: Theme.colors.onSurfaceVariant,
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
});

export default FilterPills;
