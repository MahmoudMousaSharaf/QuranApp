import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Vibration,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translateText } from '../services/contentTranslator';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUITranslation } from '../hooks/useUITranslation';

interface TasbihScreenProps {
  onBack: () => void;
}

const TASBIH_PRESETS = [
  { id: 'subhanallah', ar: 'سُبْحَانَ اللَّهِ', en: 'Subhanallah', target: 33 },
  { id: 'alhamdulillah', ar: 'الْحَمْدُ لِلَّهِ', en: 'Alhamdulillah', target: 33 },
  { id: 'allahuakbar', ar: 'اللَّهُ أَكْبَرُ', en: 'Allahu Akbar', target: 34 },
  { id: 'istighfar', ar: 'أَسْتَغْفِرُ اللَّهَ', en: 'Astaghfirullah', target: 100 },
  { id: 'salawat', ar: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', en: 'Salawat upon Prophet', target: 100 },
  { id: 'tahlil', ar: 'لَا إِلَهَ إِلَّا اللَّهُ', en: 'La ilaha illallah', target: 100 },
  { id: 'takbir', ar: 'اللَّهُ أَكْبَرُ', en: 'Allahu Akbar (100x)', target: 100 },
  { id: 'tasbeeh', ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', en: 'Subhanallahi wa bihamdih', target: 100 },
];

const STORAGE_KEY = '@tasbih_counts';

const TasbihScreen: React.FC<TasbihScreenProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const { t, appLanguage } = useLanguage();
  const c = colors[theme];
  const isArabicUI = appLanguage === 'ar';
  const { ui, translateUI, needsTranslation } = useUITranslation(appLanguage);

  const [selectedPreset, setSelectedPreset] = useState(0);
  const [count, setCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [cycles, setCycles] = useState(0);
  const [savedCounts, setSavedCounts] = useState<Record<string, number>>({});
  const [translatedPresets, setTranslatedPresets] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!needsTranslation) return;
    let cancelled = false;
    (async () => {
      const map: Record<string, string> = {};
      for (const preset of TASBIH_PRESETS) {
        if (cancelled) return;
        map[preset.id] = await translateText(preset.en, appLanguage);
      }
      if (!cancelled) setTranslatedPresets(map);
    })();
    return () => { cancelled = true; };
  }, [appLanguage, needsTranslation]);

  useEffect(() => {
    if (!needsTranslation) return;
    translateUI([
      'Target:',
      'Tap to count',
      'Cycles',
      'Total',
      'Saved',
      'Reset Counter',
    ]);
  }, [appLanguage, needsTranslation]);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSavedCounts(parsed);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const currentPreset = TASBIH_PRESETS[selectedPreset];
  const target = currentPreset.target;

  const handleTap = useCallback(() => {
    setCount((prev) => {
      const next = prev + 1;
      if (next >= target) {
        Vibration.vibrate(200);
        setCycles((c2) => c2 + 1);
        setTotalCount((t2) => t2 + next);
        const newSaved = { ...savedCounts, [currentPreset.id]: (savedCounts[currentPreset.id] || 0) + next };
        setSavedCounts(newSaved);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSaved)).catch(() => {});
        return 0;
      }
      if (next % 10 === 0) {
        Vibration.vibrate(30);
      }
      return next;
    });
  }, [target, currentPreset, savedCounts]);

  const handleReset = useCallback(() => {
    setCount(0);
    setCycles(0);
  }, []);

  const handleSelectPreset = useCallback((index: number) => {
    setSelectedPreset(index);
    setCount(0);
    setCycles(0);
  }, []);

  const progress = count / target;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={c.headerBg} />
      <View style={[styles.header, { backgroundColor: c.headerBg }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isArabicUI ? 'المسبحة الإلكترونية' : ui(t('tasbih'))}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Preset Selection */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
          {TASBIH_PRESETS.map((preset, index) => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.presetChip,
                {
                  backgroundColor: selectedPreset === index ? c.primary : c.surface,
                  borderColor: c.border,
                },
              ]}
              onPress={() => handleSelectPreset(index)}
            >
              <Text
                style={[
                  styles.presetText,
                  { color: selectedPreset === index ? '#fff' : c.text },
                ]}
              >
                {isArabicUI ? preset.ar : (needsTranslation ? (translatedPresets[preset.id] || preset.en) : preset.en)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Current Dhikr Display */}
        <View style={[styles.dhikrCard, { backgroundColor: c.surface }]}>
          <Text style={[styles.dhikrText, { color: c.text }]}>
            {isArabicUI ? currentPreset.ar : (needsTranslation ? (translatedPresets[currentPreset.id] || currentPreset.en) : currentPreset.en)}
          </Text>
          <Text style={[styles.dhikrTarget, { color: c.textSecondary }]}>
            {isArabicUI ? `الهدف: ${target}` : ui(`Target: ${target}`)}
          </Text>
        </View>

        {/* Counter Circle */}
        <TouchableOpacity
          style={[styles.counterCircle, { backgroundColor: c.surface, borderColor: c.primary }]}
          onPress={handleTap}
          activeOpacity={0.7}
        >
          <View style={[styles.progressRing, { borderColor: c.primary }]}>
            <Text style={[styles.countNumber, { color: c.primary }]}>{count}</Text>
            <Text style={[styles.countLabel, { color: c.textSecondary }]}>
              {isArabicUI ? 'اضغط للعد' : ui('Tap to count')}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={[styles.progressBar, { backgroundColor: c.ayahBg }]}>
          <View
            style={[
              styles.progressFill,
              { backgroundColor: c.primary, width: `${Math.min(progress * 100, 100)}%` },
            ]}
          />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: c.surface }]}>
            <Text style={[styles.statNumber, { color: c.primary }]}>{cycles}</Text>
            <Text style={[styles.statLabel, { color: c.textSecondary }]}>
              {isArabicUI ? 'الدورات' : ui('Cycles')}
            </Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: c.surface }]}>
            <Text style={[styles.statNumber, { color: c.primary }]}>{totalCount + count}</Text>
            <Text style={[styles.statLabel, { color: c.textSecondary }]}>
              {isArabicUI ? 'الإجمالي' : ui('Total')}
            </Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: c.surface }]}>
            <Text style={[styles.statNumber, { color: c.primary }]}>
              {savedCounts[currentPreset.id] || 0}
            </Text>
            <Text style={[styles.statLabel, { color: c.textSecondary }]}>
              {isArabicUI ? 'محفوظ' : ui('Saved')}
            </Text>
          </View>
        </View>

        {/* Reset Button */}
        <TouchableOpacity
          style={[styles.resetBtn, { backgroundColor: c.surface, borderColor: c.border }]}
          onPress={handleReset}
        >
          <Ionicons name="refresh-outline" size={20} color={c.primary} />
          <Text style={[styles.resetText, { color: c.primary }]}>
            {isArabicUI ? 'إعادة تعيين' : ui('Reset Counter')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 12,
    paddingBottom: 14,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  presetScroll: { marginBottom: 16, flexGrow: 0 },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  presetText: { fontSize: 13, fontWeight: '600' },
  dhikrCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  dhikrText: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  dhikrTarget: { fontSize: 14 },
  counterCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  progressRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countNumber: { fontSize: 64, fontWeight: 'bold' },
  countLabel: { fontSize: 13, marginTop: 4 },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  resetText: { fontSize: 15, fontWeight: '600' },
});

export default TasbihScreen;
