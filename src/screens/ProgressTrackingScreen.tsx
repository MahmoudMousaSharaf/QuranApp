import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const QUIZ_ANSWERED_KEY = '@quiz_answered';
const USER_NAME_KEY = '@user_name';
const BOOKMARKS_KEY = '@quran_bookmarks';
const LAST_SURAH_KEY = '@quran_last_surah';
const THEME_KEY = '@quran_theme';
const LANGUAGE_KEY = '@quran_language';
const APP_LANGUAGE_KEY = '@quran_app_language';
const QUIZ_PROGRESS_KEY = '@quiz_progress';
const COUNTERS_KEY = '@azkar_counters_v1';
const FAVORITES_KEY = '@azkar_favorites_v1';
const CIRCLES_KEY = '@dhikr_circles_v1';
const CIRCLES_PROGRESS_KEY = '@dhikr_circles_progress_v1';
const DAILY_GOAL_KEY = '@dhikr_daily_goal_v1';
const TASBIH_KEY = '@tasbih_counts';
const ALARM_SETTINGS_KEY = '@prayer_alarm_settings';
const CACHED_LOCATION_KEY = '@cached_prayer_location';
const AZKAR_REMINDER_IDS_KEY = '@azkar_reminder_ids';

const ALL_KEYS = [
  QUIZ_ANSWERED_KEY,
  QUIZ_PROGRESS_KEY,
  USER_NAME_KEY,
  BOOKMARKS_KEY,
  LAST_SURAH_KEY,
  THEME_KEY,
  LANGUAGE_KEY,
  APP_LANGUAGE_KEY,
  COUNTERS_KEY,
  FAVORITES_KEY,
  CIRCLES_KEY,
  CIRCLES_PROGRESS_KEY,
  DAILY_GOAL_KEY,
  TASBIH_KEY,
  ALARM_SETTINGS_KEY,
  CACHED_LOCATION_KEY,
  AZKAR_REMINDER_IDS_KEY,
];

interface ProgressTrackingScreenProps {
  onBack: () => void;
}

interface Tier {
  name: string;
  nameAr: string;
  min: number;
  max: number;
  icon: string;
  color: string;
}

const tiers: Tier[] = [
  { name: 'tierBeginner', nameAr: 'مبتدئ', min: 0, max: 9, icon: 'leaf', color: '#10b981' },
  { name: 'tierSeeker', nameAr: 'طالب علم', min: 10, max: 24, icon: 'book', color: '#3b82f6' },
  { name: 'tierStudent', nameAr: 'طالب', min: 25, max: 49, icon: 'school', color: '#8b5cf6' },
  { name: 'tierScholar', nameAr: 'عالم', min: 50, max: 74, icon: 'library', color: '#f59e0b' },
  { name: 'tierExpert', nameAr: 'خبير', min: 75, max: 89, icon: 'star', color: '#ef4444' },
  { name: 'tierHafiz', nameAr: 'حافظ', min: 90, max: 100, icon: 'trophy', color: '#0d9488' },
];

const ProgressTrackingScreen: React.FC<ProgressTrackingScreenProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const { t, appLanguage } = useLanguage();
  const c = colors[theme];

  const [userName, setUserName] = useState('');
  const [tempName, setTempName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [lastSurah, setLastSurah] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [name, answered, bookmarks, surah] = await Promise.all([
        AsyncStorage.getItem(USER_NAME_KEY),
        AsyncStorage.getItem(QUIZ_ANSWERED_KEY),
        AsyncStorage.getItem(BOOKMARKS_KEY),
        AsyncStorage.getItem(LAST_SURAH_KEY),
      ]);

      if (name) setUserName(name);
      if (answered) {
        const parsed = JSON.parse(answered);
        setAnsweredCount(Array.isArray(parsed) ? parsed.length : 0);
      }
      if (bookmarks) {
        const parsed = JSON.parse(bookmarks);
        setBookmarkCount(Array.isArray(parsed) ? parsed.length : 0);
      }
      if (surah) setLastSurah(parseInt(surah, 10) || 1);
    } catch (e) {
      console.error('Failed to load progress data:', e);
    }
  };

  const handleSaveName = async () => {
    if (tempName.trim().length === 0) {
      Alert.alert(
        t('notice'),
        t('pleaseEnterName')
      );
      return;
    }
    try {
      await AsyncStorage.setItem(USER_NAME_KEY, tempName.trim());
      setUserName(tempName.trim());
      setEditingName(false);
    } catch (e) {
      console.error('Failed to save name:', e);
    }
  };

  const getCurrentTier = (): Tier => {
    return tiers.find((t) => answeredCount >= t.min && answeredCount <= t.max) || tiers[0];
  };

  const getNextTier = (): Tier | null => {
    const current = getCurrentTier();
    const idx = tiers.indexOf(current);
    return idx < tiers.length - 1 ? tiers[idx + 1] : null;
  };

  const handleExportData = async () => {
    try {
      const data: Record<string, any> = {};
      for (const key of ALL_KEYS) {
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
          try {
            data[key] = JSON.parse(value);
          } catch {
            data[key] = value;
          }
        }
      }

      const exportData = {
        app: 'The Truth - Al Haq',
        exportDate: new Date().toISOString(),
        data,
      };

      const fileName = `al_haq_progress_${Date.now()}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(exportData, null, 2), {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: t('export'),
        });
      } else {
        Alert.alert(
          t('exported'),
          `${t('fileSavedTo')} ${fileUri}`
        );
      }
    } catch (e) {
      Alert.alert(
        t('error'),
        t('failedExport')
      );
      console.error('Export error:', e);
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const parsed = JSON.parse(content);

      if (!parsed.data || !parsed.app) {
        Alert.alert(
          t('error'),
          t('invalidFileFormat')
        );
        return;
      }

      Alert.alert(
        t('importData'),
        t('importConfirmMsg'),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('import'),
            onPress: async () => {
              try {
                for (const [key, value] of Object.entries(parsed.data)) {
                  const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
                  await AsyncStorage.setItem(key, stringValue);
                }
                Alert.alert(
                  t('success'),
                  t('dataImportedSuccess'),
                  [{ text: 'OK', onPress: () => loadData() }]
                );
              } catch (err) {
                Alert.alert(
                  t('error'),
                  t('failedImport')
                );
                console.error('Import write error:', err);
              }
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert(
        t('error'),
        t('failedReadFile')
      );
      console.error('Import error:', e);
    }
  };

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  const tierProgress = nextTier
    ? ((answeredCount - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100;

  const stats = [
    { label: t('questionsAnswered'), value: `${answeredCount}/100`, icon: 'help-circle' as const, color: '#14b8a6' },
    { label: t('bookmarksCount'), value: String(bookmarkCount), icon: 'bookmark' as const, color: '#f97316' },
    { label: t('lastSurahRead'), value: String(lastSurah), icon: 'book' as const, color: '#3b82f6' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={c.headerBg} />

      <View style={[styles.header, { backgroundColor: c.headerBg }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('progressTracking')}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Name Section */}
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle" size={24} color={c.primary} />
            <Text style={[styles.cardTitle, { color: c.text }]}>
              {t('userName')}
            </Text>
          </View>
          {editingName ? (
            <View style={styles.nameEditContainer}>
              <TextInput
                style={[styles.nameInput, { backgroundColor: c.surfaceAlt, color: c.text, borderColor: c.border }]}
                value={tempName}
                onChangeText={setTempName}
                placeholder={t('enterYourName')}
                placeholderTextColor={c.textSecondary}
                maxLength={30}
                autoFocus
              />
              <View style={styles.nameEditButtons}>
                <TouchableOpacity
                  style={[styles.nameBtn, { backgroundColor: c.primary }]}
                  onPress={handleSaveName}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.nameBtn, { backgroundColor: c.surfaceAlt, borderColor: c.border, borderWidth: 1 }]}
                  onPress={() => { setEditingName(false); setTempName(userName); }}
                >
                  <Ionicons name="close" size={18} color={c.text} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.nameDisplay}
              onPress={() => { setTempName(userName); setEditingName(true); }}
            >
              <Text style={[styles.nameText, { color: userName ? c.text : c.textSecondary }]}>
                {userName || t('tapToAddName')}
              </Text>
              <Ionicons name="create" size={18} color={c.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Tier / Level Section */}
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="trophy" size={24} color={c.primary} />
            <Text style={[styles.cardTitle, { color: c.text }]}>
              {t('yourLevel')}
            </Text>
          </View>
          <View style={styles.tierContainer}>
            <View style={[styles.tierIcon, { backgroundColor: currentTier.color }]}>
              <Ionicons name={currentTier.icon as any} size={32} color="#fff" />
            </View>
            <Text style={[styles.tierName, { color: c.text }]}>
              {appLanguage === 'ar' ? currentTier.nameAr : t(currentTier.name as any)}
            </Text>
            <Text style={[styles.tierRange, { color: c.textSecondary }]}>
              {currentTier.min} - {currentTier.max} {t('questions')}
            </Text>
          </View>

          {nextTier && (
            <View style={styles.tierProgressContainer}>
              <View style={styles.tierProgressInfo}>
                <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                  {`${nextTier.min - answeredCount} ${t('questionsToNext')} ${appLanguage === 'ar' ? nextTier.nameAr : t(nextTier.name as any)}`}
                </Text>
              </View>
              <View style={[styles.tierProgressBar, { backgroundColor: c.surfaceAlt }]}>
                <View style={[styles.tierProgressFill, { width: `${tierProgress}%`, backgroundColor: currentTier.color }]} />
              </View>
            </View>
          )}

          {/* All Tiers List */}
          <View style={styles.tiersList}>
            {tiers.map((tier) => {
              const isCurrent = tier === currentTier;
              const isPassed = answeredCount >= tier.min;
              return (
                <View
                  key={tier.name}
                  style={[
                    styles.tierItem,
                    {
                      backgroundColor: isCurrent ? c.ayahBg : 'transparent',
                      borderColor: isCurrent ? c.primary : 'transparent',
                    },
                  ]}
                >
                  <View style={[styles.tierItemIcon, { backgroundColor: isPassed ? tier.color : c.surfaceAlt }]}>
                    <Ionicons
                      name={isPassed ? (tier.icon as any) : 'lock-closed'}
                      size={16}
                      color={isPassed ? '#fff' : c.textSecondary}
                    />
                  </View>
                  <Text style={{ color: isCurrent ? c.primary : c.text, fontSize: 13, fontWeight: isCurrent ? '700' : '500', flex: 1 }}>
                    {appLanguage === 'ar' ? tier.nameAr : t(tier.name as any)}
                  </Text>
                  <Text style={{ color: c.textSecondary, fontSize: 11 }}>
                    {tier.min}-{tier.max}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Stats Section */}
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="stats-chart" size={24} color={c.primary} />
            <Text style={[styles.cardTitle, { color: c.text }]}>
              {t('statistics')}
            </Text>
          </View>
          {stats.map((stat, idx) => (
            <View key={idx} style={[styles.statItem, { borderBottomColor: c.border }, idx === stats.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
                <Ionicons name={stat.icon} size={18} color="#fff" />
              </View>
              <Text style={{ color: c.textSecondary, fontSize: 14, flex: 1 }}>
                {stat.label}
              </Text>
              <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>
                {stat.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Export / Import Section */}
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="cloud-download" size={24} color={c.primary} />
            <Text style={[styles.cardTitle, { color: c.text }]}>
              {t('backupRestore')}
            </Text>
          </View>
          <Text style={[styles.backupDesc, { color: c.textSecondary }]}>
            {t('backupDesc')}
          </Text>
          <View style={styles.backupButtons}>
            <TouchableOpacity
              style={[styles.backupBtn, { backgroundColor: c.primary }]}
              onPress={handleExportData}
              activeOpacity={0.7}
            >
              <Ionicons name="download" size={20} color="#fff" />
              <Text style={styles.backupBtnText}>
                {t('export')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.backupBtn, { backgroundColor: c.surfaceAlt, borderColor: c.border, borderWidth: 1 }]}
              onPress={handleImportData}
              activeOpacity={0.7}
            >
              <Ionicons name="cloud-upload" size={20} color={c.text} />
              <Text style={[styles.backupBtnText, { color: c.text }]}>
                {t('import')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    padding: 16,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  nameDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nameEditContainer: {
    gap: 10,
  },
  nameInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
  },
  nameEditButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  nameBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tierContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  tierIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  tierName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tierRange: {
    fontSize: 13,
    marginTop: 4,
  },
  tierProgressContainer: {
    marginTop: 12,
  },
  tierProgressInfo: {
    marginBottom: 6,
  },
  tierProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tierProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  tiersList: {
    marginTop: 16,
    gap: 4,
  },
  tierItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  tierItemIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backupDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  backupButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  backupBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backupBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});

export default ProgressTrackingScreen;
