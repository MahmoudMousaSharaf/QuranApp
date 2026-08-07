import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
  Share,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { TranslationKey } from '../i18n/translations';
import { useUITranslation } from '../hooks/useUITranslation';

const USER_NAME_KEY = '@user_name';

const { width } = Dimensions.get('window');
const cardWidth = (width - 36) / 2;

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenLanguagePicker: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  isDark,
  onToggleTheme,
  onOpenLanguagePicker,
}) => {
  const { theme } = useTheme();
  const { t, appLanguage } = useLanguage();
  const c = colors[theme];
  const { ui, translateUI } = useUITranslation(appLanguage);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    AsyncStorage.getItem(USER_NAME_KEY).then((name) => {
      if (name) setUserName(name);
    });
  }, []);

  useEffect(() => {
    translateUI([
      t('appTitle'),
      t('appSubtitle'),
      t('holyQuran'), t('quranSubtitle'),
      t('quranAudio'), t('quranAudioSubtitle'),
      t('scientificMiracles'), t('miraclesSubtitle'),
      t('questionsAnswers'), t('qaSubtitle'),
      t('supportUs'), t('supportSubtitle'),
      t('prayerTimes'), t('prayerSubtitle'),
      t('qibla'), t('qiblaSubtitle'),
      t('islamicMonths'), t('monthsSubtitle'),
      t('hadith'), t('hadithSubtitle'),
      t('azkar'), t('azkarSubtitle'),
      t('dreamInterpretation'), t('dreamInterpretationSubtitle'),
      t('ruqyahSharia'), t('ruqyahSubtitle'),
      t('tasbih'), t('tasbihSubtitle'),
      t('dhikrCircles'), t('dhikrCirclesSubtitle'),
      t('prophetSunnah'), t('sunnahSubtitle'),
      t('bookmarks'), t('bookmarksSubtitle'),
      t('aboutUs'), t('aboutSubtitle'),
      t('quiz100'), t('quiz100Subtitle'),
      t('progressTracking'), t('progressTrackingSubtitle'),
    ]);
  }, [appLanguage]);

  const featureConfigs: { id: string; icon: string; titleKey: TranslationKey; subtitleKey: TranslationKey; color: string; gradient: [string, string] }[] = [
    { id: 'quran', icon: 'book', titleKey: 'holyQuran', subtitleKey: 'quranSubtitle', color: '#0d9488', gradient: ['#0d9488', '#14b8a6'] },
    { id: 'quranAudio', icon: 'musical-notes', titleKey: 'quranAudio' as TranslationKey, subtitleKey: 'quranAudioSubtitle' as TranslationKey, color: '#e11d48', gradient: ['#e11d48', '#f43f5e'] },
    { id: 'miracles', icon: 'flask', titleKey: 'scientificMiracles', subtitleKey: 'miraclesSubtitle', color: '#3b82f6', gradient: ['#3b82f6', '#60a5fa'] },
    { id: 'qa', icon: 'help-circle', titleKey: 'questionsAnswers', subtitleKey: 'qaSubtitle', color: '#14b8a6', gradient: ['#14b8a6', '#2dd4bf'] },
    { id: 'support', icon: 'heart-circle', titleKey: 'supportUs', subtitleKey: 'supportSubtitle', color: '#a855f7', gradient: ['#a855f7', '#c084fc'] },
    { id: 'prayer', icon: 'time', titleKey: 'prayerTimes', subtitleKey: 'prayerSubtitle', color: '#f59e0b', gradient: ['#f59e0b', '#fbbf24'] },
    { id: 'qibla', icon: 'compass', titleKey: 'qibla', subtitleKey: 'qiblaSubtitle', color: '#ec4899', gradient: ['#ec4899', '#f472b6'] },
    { id: 'months', icon: 'calendar', titleKey: 'islamicMonths', subtitleKey: 'monthsSubtitle', color: '#8b5cf6', gradient: ['#8b5cf6', '#a78bfa'] },
    { id: 'hadith', icon: 'library', titleKey: 'hadith', subtitleKey: 'hadithSubtitle', color: '#10b981', gradient: ['#10b981', '#34d399'] },
    { id: 'azkar', icon: 'moon', titleKey: 'azkar', subtitleKey: 'azkarSubtitle', color: '#6366f1', gradient: ['#6366f1', '#818cf8'] },
    { id: 'dream', icon: 'cloudy-night', titleKey: 'dreamInterpretation' as TranslationKey, subtitleKey: 'dreamInterpretationSubtitle' as TranslationKey, color: '#7c3aed', gradient: ['#7c3aed', '#a78bfa'] },
    { id: 'ruqyah', icon: 'shield-checkmark', titleKey: 'ruqyahSharia' as TranslationKey, subtitleKey: 'ruqyahSubtitle' as TranslationKey, color: '#0d9488', gradient: ['#0d9488', '#14b8a6'] },
    { id: 'tasbih', icon: 'hand-left', titleKey: 'tasbih' as TranslationKey, subtitleKey: 'tasbihSubtitle' as TranslationKey, color: '#0ea5e9', gradient: ['#0ea5e9', '#38bdf8'] },
    { id: 'dhikrCircles', icon: 'git-network', titleKey: 'dhikrCircles' as TranslationKey, subtitleKey: 'dhikrCirclesSubtitle' as TranslationKey, color: '#8b5cf6', gradient: ['#8b5cf6', '#a78bfa'] },
    { id: 'sunnah', icon: 'heart', titleKey: 'prophetSunnah', subtitleKey: 'sunnahSubtitle', color: '#ef4444', gradient: ['#ef4444', '#f87171'] },
    { id: 'bookmarks', icon: 'bookmark', titleKey: 'bookmarks', subtitleKey: 'bookmarksSubtitle', color: '#f97316', gradient: ['#f97316', '#fb923c'] },
    { id: 'quiz', icon: 'help-buoy', titleKey: 'quiz100' as TranslationKey, subtitleKey: 'quiz100Subtitle' as TranslationKey, color: '#0891b2', gradient: ['#0891b2', '#06b6d4'] },
    { id: 'progress', icon: 'analytics', titleKey: 'progressTracking' as TranslationKey, subtitleKey: 'progressTrackingSubtitle' as TranslationKey, color: '#7c3aed', gradient: ['#7c3aed', '#8b5cf6'] },
    { id: 'about', icon: 'information-circle', titleKey: 'aboutUs', subtitleKey: 'aboutSubtitle', color: '#64748b', gradient: ['#64748b', '#94a3b8'] },
  ];

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Gradient Header with Bubble Effect */}
      <LinearGradient
        colors={['#0d9488', '#0f766e', '#115e59']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Decorative bubbles */}
        <View style={styles.bubble1} />
        <View style={styles.bubble2} />
        <View style={styles.bubble3} />

        <View style={styles.headerContent}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{ui(t('appTitle'))}</Text>
            <Text style={styles.headerSubtitle}>{ui(t('appSubtitle'))}</Text>
            {userName ? (
              <Text style={styles.greetingText}>
                {ui(t('greetingHello'))}, {userName} 👋
              </Text>
            ) : null}
            {userName ? (
              <Text style={styles.blessingText}>{ui(t('greetingBlessing'))}</Text>
            ) : null}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={onOpenLanguagePicker}
              style={styles.langBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="globe" size={16} color="#fff" />
              <Text style={styles.langBtnText}>{appLanguage.toUpperCase()}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onToggleTheme}
              style={styles.themeBtn}
              activeOpacity={0.8}
            >
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Share.share({
                  message: appLanguage === 'ar'
                    ? 'تطبيق القرآن الكريم - اقرأ واستمع وشارك الخير\n\nتحميل: https://github.com/MahmoudMousaSharaf/QuranApp'
                    : appLanguage === 'ur'
                    ? 'قرآن کریم ایپ - پڑھیں، سنیں اور خیر شیئر کریں\n\nڈاؤن لوڈ: https://github.com/MahmoudMousaSharaf/QuranApp'
                    : 'Quran App - Read, Listen & Share the Goodness\n\nDownload: https://github.com/MahmoudMousaSharaf/QuranApp',
                  title: 'Quran App',
                });
              }}
              style={styles.themeBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Features Grid */}
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {featureConfigs.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={[
              styles.featureCard,
              { backgroundColor: c.surface },
              isDark && styles.featureCardDark,
            ]}
            onPress={() => onNavigate(feature.id)}
            activeOpacity={0.7}
          >
            {/* Gradient bubble icon */}
            <LinearGradient
              colors={feature.gradient}
              style={styles.featureIconBubble}
            >
              <Ionicons name={feature.icon as any} size={26} color="#fff" />
            </LinearGradient>

            <Text style={[styles.featureTitle, { color: c.text }]} numberOfLines={1}>
              {ui(t(feature.titleKey))}
            </Text>
            <Text style={[styles.featureSubtitle, { color: c.textSecondary }]} numberOfLines={2}>
              {ui(t(feature.subtitleKey))}
            </Text>

            {/* Color accent bar */}
            <View style={[styles.accentBar, { backgroundColor: feature.color }]} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  bubble1: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  bubble2: {
    position: 'absolute',
    bottom: -25,
    left: -15,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bubble3: {
    position: 'absolute',
    top: 20,
    right: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 1,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  greetingText: { fontSize: 14, color: '#fff', marginTop: 8, fontWeight: '600' },
  blessingText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  langBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  themeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-between',
  },
  featureCard: {
    width: cardWidth,
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  featureCardDark: {
    elevation: 5,
    shadowOpacity: 0.3,
  },
  featureIconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  accentBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
});

export default HomeScreen;
