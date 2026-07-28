import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { THEMES, ThemeKey } from '../constants/themes';
import { useTheme, useThemeStore } from '../store/useTheme';

interface ThemePickerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ThemePickerModal = ({ visible, onClose }: ThemePickerModalProps) => {
  const theme = useTheme();
  const currentKey = useThemeStore((s) => s.themeKey);
  const setTheme = useThemeStore((s) => s.setTheme);

  const handleSelect = async (key: ThemeKey) => {
    await setTheme(key);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            { backgroundColor: theme.tealMid, borderColor: theme.glassBdr },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.goldLt }]}>
              🎨 Choose Your Palette
            </Text>
            <Text style={[styles.subtitle, { color: theme.cream }]}>
              Your sanctuary, your aesthetic
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {(Object.keys(THEMES) as ThemeKey[]).map((key) => {
              const t = THEMES[key];
              const isSelected = currentKey === key;
              return (
                <TouchableOpacity
                  key={key}
                  testID={`theme-option-${key}`}
                  onPress={() => handleSelect(key)}
                  activeOpacity={0.7}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: t.teal,
                      borderColor: isSelected ? t.gold : t.glassBdr,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                >
                  <View style={styles.themeCardContent}>
                    <View style={styles.themeCardHeader}>
                      <Text style={styles.themeEmoji}>{t.emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.themeName, { color: t.goldLt }]}>
                          {t.name}
                        </Text>
                        <Text
                          style={[styles.themeDesc, { color: t.cream, opacity: 0.7 }]}
                        >
                          {t.description}
                        </Text>
                      </View>
                      {isSelected && (
                        <View
                          style={[
                            styles.checkBadge,
                            { backgroundColor: t.gold },
                          ]}
                        >
                          <Text style={{ color: t.teal, fontSize: 14, fontWeight: '700' }}>
                            ✓
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Color palette preview */}
                    <View style={styles.paletteRow}>
                      <View style={[styles.swatch, { backgroundColor: t.terraDk }]} />
                      <View style={[styles.swatch, { backgroundColor: t.terra }]} />
                      <View style={[styles.swatch, { backgroundColor: t.terraLt }]} />
                      <View style={[styles.swatch, { backgroundColor: t.gold }]} />
                      <View style={[styles.swatch, { backgroundColor: t.goldLt }]} />
                      <View style={[styles.swatch, { backgroundColor: t.cream }]} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            testID="theme-picker-close-btn"
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: theme.gold }]}
          >
            <Text style={[styles.closeButtonText, { color: theme.teal }]}>
              Done ✦
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  themeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  themeCardContent: {
    gap: 12,
  },
  themeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeEmoji: {
    fontSize: 28,
  },
  themeName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  themeDesc: {
    fontSize: 12,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paletteRow: {
    flexDirection: 'row',
    gap: 4,
  },
  swatch: {
    flex: 1,
    height: 24,
    borderRadius: 6,
  },
  closeButton: {
    borderRadius: 30,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
