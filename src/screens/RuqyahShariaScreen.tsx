import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUITranslation } from '../hooks/useUITranslation';
import ruqyahData from '../data/ruqyah_sharia.json';

interface RuqyahShariaScreenProps {
  onBack: () => void;
}

const RuqyahShariaScreen: React.FC<RuqyahShariaScreenProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const { t, appLanguage } = useLanguage();
  const c = colors[theme];
  const { ui, translateUI } = useUITranslation(appLanguage);
  const isArabicUI = appLanguage === 'ar';

  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSheikh, setSelectedSheikh] = useState(0);
  const [activeTab, setActiveTab] = useState<'verses' | 'supplications'>('verses');

  useEffect(() => {
    translateUI([
      t('ruqyahSharia'),
      t('ruqyahIntro'),
      t('ruqyahSelectSheikh'),
      t('ruqyahPlay'),
      t('ruqyahStop'),
      t('ruqyahNowPlaying'),
      t('ruqyahQuranVerses'),
      t('ruqyahSupplications'),
      t('ruqyahBackgroundPlay'),
    ]);
  }, [appLanguage]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const setupAudioMode = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (e) {
      console.log('Audio mode setup error:', e);
    }
  };

  const handlePlay = async () => {
    if (isPlaying) {
      await handleStop();
      return;
    }

    setIsLoading(true);
    try {
      await setupAudioMode();

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const sheikh = ruqyahData.audio_sources[selectedSheikh];
      const { sound } = await Audio.Sound.createAsync(
        { uri: sheikh.url },
        { shouldPlay: true, isLooping: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      setIsPlaying(true);
    } catch (error) {
      Alert.alert(
        isArabicUI ? 'خطأ' : 'Error',
        isArabicUI
          ? 'تعذر تشغيل الصوت. تحقق من اتصالك بالإنترنت.'
          : 'Could not play audio. Check your internet connection.'
      );
      console.log('Audio playback error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      } catch (e) {
        console.log('Stop error:', e);
      }
    }
    setIsPlaying(false);
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        console.log('Playback error:', status.error);
        setIsPlaying(false);
      }
    }
  };

  const sheikh = ruqyahData.audio_sources[selectedSheikh];

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0d9488" />

      <LinearGradient
        colors={['#0d9488', '#0f766e', '#115e59']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerBubble1} />
        <View style={styles.headerBubble2} />

        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {ui(t('ruqyahSharia'))}
          </Text>
          <View style={{ width: 28 }} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro card */}
        <View style={[styles.introCard, { backgroundColor: c.surface }]}>
          <View style={styles.introIconRow}>
            <LinearGradient
              colors={['#0d9488', '#14b8a6']}
              style={styles.introIcon}
            >
              <Ionicons name="shield-checkmark" size={28} color="#fff" />
            </LinearGradient>
          </View>
          <Text style={[styles.introText, { color: c.text }]}>
            {ui(t('ruqyahIntro'))}
          </Text>
        </View>

        {/* Sheikh selector */}
        <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
          {ui(t('ruqyahSelectSheikh'))}
        </Text>
        <View style={styles.sheikhRow}>
          {ruqyahData.audio_sources.map((src, idx) => (
            <TouchableOpacity
              key={src.id}
              onPress={() => {
                if (isPlaying) handleStop();
                setSelectedSheikh(idx);
              }}
              style={[
                styles.sheikhCard,
                {
                  backgroundColor: selectedSheikh === idx ? '#0d9488' : c.surface,
                  borderColor: selectedSheikh === idx ? '#0d9488' : c.border,
                },
              ]}
            >
              <Ionicons
                name="person-circle"
                size={32}
                color={selectedSheikh === idx ? '#fff' : c.textSecondary}
              />
              <Text
                style={[
                  styles.sheikhName,
                  { color: selectedSheikh === idx ? '#fff' : c.text },
                ]}
                numberOfLines={2}
              >
                {isArabicUI ? src.name_ar : src.name_en}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Play/Stop button */}
        <View style={styles.playContainer}>
          <TouchableOpacity
            onPress={handlePlay}
            disabled={isLoading}
            activeOpacity={0.8}
            style={styles.playBtn}
          >
            <LinearGradient
              colors={isPlaying ? ['#ef4444', '#f87171'] : ['#0d9488', '#14b8a6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.playBtnGradient}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={isPlaying ? 'stop-circle' : 'play-circle'}
                    size={28}
                    color="#fff"
                  />
                  <Text style={styles.playBtnText}>
                    {isPlaying
                      ? ui(t('ruqyahStop'))
                      : ui(t('ruqyahPlay'))}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {isPlaying && (
            <View style={[styles.nowPlayingBadge, { backgroundColor: c.surface }]}>
              <View style={styles.nowPlayingRow}>
                <View style={styles.liveDot} />
                <Text style={[styles.nowPlayingText, { color: c.text }]}>
                  {ui(t('ruqyahNowPlaying'))}: {isArabicUI ? sheikh.name_ar : sheikh.name_en}
                </Text>
              </View>
              <Text style={[styles.backgroundHint, { color: c.textSecondary }]}>
                {ui(t('ruqyahBackgroundPlay'))}
              </Text>
            </View>
          )}
        </View>

        {/* Tab switcher */}
        <View style={[styles.tabSwitcher, { backgroundColor: c.surface }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('verses')}
            style={[
              styles.tabBtn,
              activeTab === 'verses' && { backgroundColor: '#0d9488' },
            ]}
          >
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'verses' ? '#fff' : c.textSecondary },
              ]}
            >
              {ui(t('ruqyahQuranVerses'))}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('supplications')}
            style={[
              styles.tabBtn,
              activeTab === 'supplications' && { backgroundColor: '#0d9488' },
            ]}
          >
            <Text
              style={[
                styles.tabBtnText,
                { color: activeTab === 'supplications' ? '#fff' : c.textSecondary },
              ]}
            >
              {ui(t('ruqyahSupplications'))}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content list */}
        {activeTab === 'verses'
          ? ruqyahData.verses.map((verse) => (
              <View key={verse.id} style={[styles.verseCard, { backgroundColor: c.surface }]}>
                <View style={styles.verseHeader}>
                  <View style={styles.verseRefBadge}>
                    <Text style={styles.verseRefText}>{verse.reference}</Text>
                  </View>
                  {verse.repetition > 1 && (
                    <View style={[styles.repBadge, { backgroundColor: c.ayahBg }]}>
                      <Text style={[styles.repText, { color: c.textSecondary }]}>
                        x{verse.repetition}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.verseArabic, { color: c.text }]}>
                  {verse.text_ar}
                </Text>
                {!isArabicUI && (
                  <Text style={[styles.verseTranslation, { color: c.textSecondary }]}>
                    {verse.text_en}
                  </Text>
                )}
              </View>
            ))
          : ruqyahData.supplications.map((dua) => (
              <View key={dua.id} style={[styles.verseCard, { backgroundColor: c.surface }]}>
                <View style={styles.verseHeader}>
                  <View style={styles.verseRefBadge}>
                    <Text style={styles.verseRefText}>{dua.reference}</Text>
                  </View>
                  {dua.repetition > 1 && (
                    <View style={[styles.repBadge, { backgroundColor: c.ayahBg }]}>
                      <Text style={[styles.repText, { color: c.textSecondary }]}>
                        x{dua.repetition}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.verseArabic, { color: c.text }]}>
                  {dua.text_ar}
                </Text>
                {!isArabicUI && (
                  <Text style={[styles.verseTranslation, { color: c.textSecondary }]}>
                    {dua.text_en}
                  </Text>
                )}
              </View>
            ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 50,
    paddingHorizontal: 12,
    paddingBottom: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  headerBubble1: {
    position: 'absolute',
    top: -20,
    right: -10,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerBubble2: {
    position: 'absolute',
    bottom: -15,
    left: -10,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#fff' },
  content: { padding: 16, paddingBottom: 40 },
  introCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  introIconRow: { marginBottom: 12 },
  introIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  introText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
    marginLeft: 4,
  },
  sheikhRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  sheikhCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 2,
    gap: 6,
  },
  sheikhName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  playContainer: {
    marginBottom: 16,
  },
  playBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  playBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
  },
  playBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  nowPlayingBadge: {
    marginTop: 10,
    borderRadius: 12,
    padding: 14,
  },
  nowPlayingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  nowPlayingText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  backgroundHint: {
    fontSize: 11,
  },
  tabSwitcher: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  verseCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  verseRefBadge: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verseRefText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  repBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  repText: {
    fontSize: 11,
    fontWeight: '600',
  },
  verseArabic: {
    fontSize: 20,
    lineHeight: 36,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'GeezaPro' : 'sans-serif',
    marginBottom: 8,
  },
  verseTranslation: {
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default RuqyahShariaScreen;
