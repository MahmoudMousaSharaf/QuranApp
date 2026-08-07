import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StatusBar, View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';

import { ThemeProvider, useTheme, colors } from './src/context/ThemeContext';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import { SurahMeta } from './src/types';
import { fetchAllSurahs } from './src/services/api';
import {
  getLastSurah,
} from './src/services/storage';
import LanguagePickerModal from './src/components/LanguagePickerModal';
import {
  initPrayerAlarms,
  playAdhanSound,
  stopAdhanSound,
  getStopAdhanResponseId,
  rescheduleAlarmsFromCache,
  setActiveNotificationId,
} from './src/services/prayerAlarm';

import HomeScreen from './src/screens/HomeScreen';
import SurahListScreen from './src/screens/SurahListScreen';
import SurahReaderScreen from './src/screens/SurahReaderScreen';
import BookmarksScreen from './src/screens/BookmarksScreen';
import AzkarScreen from './src/screens/AzkarScreen';
import ScientificMiraclesScreen from './src/screens/ScientificMiraclesScreen';
import QAScreen from './src/screens/QAScreen';
import SunnahScreen from './src/screens/SunnahScreen';
import IslamicMonthsScreen from './src/screens/IslamicMonthsScreen';
import AboutUsScreen from './src/screens/AboutUsScreen';
import SupportUsScreen from './src/screens/SupportUsScreen';
import PrayerTimesScreen from './src/screens/PrayerTimesScreen';
import QiblaScreen from './src/screens/QiblaScreen';
import HadithScreen from './src/screens/HadithScreen';
import TasbihScreen from './src/screens/TasbihScreen';
import QuranAudioScreen from './src/screens/QuranAudioScreen';
import DhikrCirclesScreen from './src/screens/DhikrCirclesScreen';
import QuizScreen from './src/screens/QuizScreen';
import ProgressTrackingScreen from './src/screens/ProgressTrackingScreen';
import DreamInterpretationScreen from './src/screens/DreamInterpretationScreen';
import RuqyahShariaScreen from './src/screens/RuqyahShariaScreen';

type Screen =
  | 'home'
  | 'quran'
  | 'reader'
  | 'bookmarks'
  | 'azkar'
  | 'miracles'
  | 'qa'
  | 'sunnah'
  | 'months'
  | 'about'
  | 'support'
  | 'prayer'
  | 'qibla'
  | 'hadith'
  | 'tasbih'
  | 'quranAudio'
  | 'dhikrCircles'
  | 'quiz'
  | 'progress'
  | 'dream'
  | 'ruqyah';

const AppContent: React.FC = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { t, appLanguage } = useLanguage();
  const c = colors[theme];

  const [screen, setScreen] = useState<Screen>('home');
  const [surahs, setSurahs] = useState<SurahMeta[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [scrollToAyah, setScrollToAyah] = useState<number | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const stopResponseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    initPrayerAlarms();

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      if (notification.request.content.data?.isPrayerAlarm) {
        const prayer = notification.request.content.data?.prayer;
        setActiveNotificationId(notification.request.identifier);
        playAdhanSound(prayer as any);
      }
    });

    stopResponseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.actionIdentifier === getStopAdhanResponseId()) {
        stopAdhanSound();
      }
    });

    // Reschedule prayer alarms from cached location on app startup
    // This ensures alarms fire even if the app was killed, by scheduling 7 days in advance
    rescheduleAlarmsFromCache(appLanguage).catch((e) => console.error('Failed to reschedule alarms:', e));

    return () => {
      notificationListener.current?.remove();
      stopResponseListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [surahList, lastSurah] = await Promise.all([
          fetchAllSurahs(),
          getLastSurah(),
        ]);
        setSurahs(surahList);
        setSelectedSurah(lastSurah);
      } catch (err) {
        console.error('Init error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleNavigate = useCallback((target: string) => {
    if (target === 'quran') setScreen('quran');
    else if (target === 'bookmarks') setScreen('bookmarks');
    else if (target === 'azkar') setScreen('azkar');
    else if (target === 'miracles') setScreen('miracles');
    else if (target === 'qa') setScreen('qa');
    else if (target === 'sunnah') setScreen('sunnah');
    else if (target === 'months') setScreen('months');
    else if (target === 'about') setScreen('about');
    else if (target === 'support') setScreen('support');
    else if (target === 'prayer') setScreen('prayer');
    else if (target === 'qibla') setScreen('qibla');
    else if (target === 'hadith') setScreen('hadith');
    else if (target === 'tasbih') setScreen('tasbih');
    else if (target === 'quranAudio') setScreen('quranAudio');
    else if (target === 'dhikrCircles') setScreen('dhikrCircles');
    else if (target === 'quiz') setScreen('quiz');
    else if (target === 'progress') setScreen('progress');
    else if (target === 'dream') setScreen('dream');
    else if (target === 'ruqyah') setScreen('ruqyah');
  }, []);

  const handleSelectSurah = useCallback((number: number, ayahNumber?: number) => {
    setSelectedSurah(number);
    setScrollToAyah(ayahNumber ?? null);
    setScreen('reader');
  }, []);

  const handleBackToHome = useCallback(() => {
    setScreen('home');
  }, []);

  const handleBackToQuran = useCallback(() => {
    setScreen('quran');
  }, []);

  const handlePrevSurah = useCallback(() => {
    if (selectedSurah > 1) {
      setSelectedSurah(selectedSurah - 1);
    }
  }, [selectedSurah]);

  const handleNextSurah = useCallback(() => {
    if (selectedSurah < 114) {
      setSelectedSurah(selectedSurah + 1);
    }
  }, [selectedSurah]);

  const currentSurahMeta = surahs.find((s) => s.number === selectedSurah) || null;

  if (loading) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: c.headerBg }]}>
        <StatusBar barStyle="light-content" backgroundColor={c.headerBg} />
        <Text style={styles.loadingAppTitle}>{t('appTitle')}</Text>
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 20 }} />
        <Text style={styles.loadingAppText}>{t('loadingQuran')}</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={c.headerBg}
      />
      {screen === 'home' && (
        <HomeScreen
          onNavigate={handleNavigate}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onOpenLanguagePicker={() => setShowLangPicker(true)}
        />
      )}
      {screen === 'quran' && (
        <SurahListScreen
          surahs={surahs}
          onSelectSurah={handleSelectSurah}
          onOpenBookmarks={() => setScreen('bookmarks')}
          loading={loading}
          onBackToHome={handleBackToHome}
        />
      )}
      {screen === 'reader' && (
        <SurahReaderScreen
          surahNumber={selectedSurah}
          surahMeta={currentSurahMeta}
          onBack={handleBackToQuran}
          onPrevSurah={handlePrevSurah}
          onNextSurah={handleNextSurah}
          hasPrev={selectedSurah > 1}
          hasNext={selectedSurah < 114}
          scrollToAyah={scrollToAyah}
          onScrolledToAyah={() => setScrollToAyah(null)}
        />
      )}
      {screen === 'bookmarks' && (
        <BookmarksScreen
          onBack={handleBackToHome}
          onSelectSurah={handleSelectSurah}
        />
      )}
      {screen === 'azkar' && (
        <AzkarScreen onBack={handleBackToHome} />
      )}
      {screen === 'miracles' && (
        <ScientificMiraclesScreen onBack={handleBackToHome} />
      )}
      {screen === 'qa' && (
        <QAScreen onBack={handleBackToHome} />
      )}
      {screen === 'sunnah' && (
        <SunnahScreen onBack={handleBackToHome} />
      )}
      {screen === 'months' && (
        <IslamicMonthsScreen onBack={handleBackToHome} />
      )}
      {screen === 'about' && (
        <AboutUsScreen onBack={handleBackToHome} />
      )}
      {screen === 'support' && (
        <SupportUsScreen onBack={handleBackToHome} />
      )}
      {screen === 'prayer' && (
        <PrayerTimesScreen onBack={handleBackToHome} />
      )}
      {screen === 'qibla' && (
        <QiblaScreen onBack={handleBackToHome} />
      )}
      {screen === 'hadith' && (
        <HadithScreen onBack={handleBackToHome} />
      )}
      {screen === 'tasbih' && (
        <TasbihScreen onBack={handleBackToHome} />
      )}
      {screen === 'quranAudio' && (
        <QuranAudioScreen
          onBack={handleBackToHome}
          surahs={surahs}
          onSelectSurah={handleSelectSurah}
        />
      )}
      {screen === 'dhikrCircles' && (
        <DhikrCirclesScreen onBack={handleBackToHome} />
      )}
      {screen === 'quiz' && (
        <QuizScreen onBack={handleBackToHome} />
      )}
      {screen === 'progress' && (
        <ProgressTrackingScreen onBack={handleBackToHome} />
      )}
      {screen === 'dream' && (
        <DreamInterpretationScreen onBack={handleBackToHome} />
      )}
      {screen === 'ruqyah' && (
        <RuqyahShariaScreen onBack={handleBackToHome} />
      )}
      <LanguagePickerModal
        visible={showLangPicker}
        onClose={() => setShowLangPicker(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingAppTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingAppText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 12,
  },
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AppContent />
          </LanguageProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
