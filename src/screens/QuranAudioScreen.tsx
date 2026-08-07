import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUITranslation } from '../hooks/useUITranslation';
import { SurahMeta } from '../types';
import { fetchSurah } from '../services/api';
import { translateText } from '../services/contentTranslator';
import { getQuranTranslation } from '../services/quranTranslations';
import {
  playAudio,
  stopAudio,
  pauseAudio,
  resumeAudio,
  setPlayStateCallback,
  isSoundPlaying,
  getCurrentOwner,
} from '../services/ruqyahAudio';

interface QuranAudioScreenProps {
  onBack: () => void;
  surahs: SurahMeta[];
  onSelectSurah: (number: number) => void;
}

// Full surah audio from Islamic Network CDN (free, no API key)
// Format: https://cdn.islamic.network/quran/audio-surah/{reciter}/{surah_number}.mp3
const RECITERS = [
  { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy', ar: 'مشاري العفاسي' },
  { id: 'ar.abdulbasitmurattal', name: 'Abdul Basit (Murattal)', ar: 'عبد الباسط (مرتل)' },
  { id: 'ar.husary', name: 'Mahmoud Al-Hussary', ar: 'محمود الحصري' },
  { id: 'ar.minshaimurattal', name: 'Al-Minshawi (Murattal)', ar: 'المنشاوي (مرتل)' },
  { id: 'ar.abdullahbasfar', name: 'Abdullah Basfar', ar: 'عبدالله بصفر' },
  { id: 'ar.hanirifai', name: 'Hani Ar-Rifai', ar: 'هاني الرفاعي' },
  { id: 'ar.saoodshuraym', name: 'Saud Ash-Shuraim', ar: 'سعود الشريم' },
];

function getSurahAudioUrl(reciterId: string, surahNumber: number): string {
  return `https://cdn.islamic.network/quran/audio-surah/${reciterId}/${surahNumber}.mp3`;
}

const QuranAudioScreen: React.FC<QuranAudioScreenProps> = ({ onBack, surahs }) => {
  const { theme } = useTheme();
  const { t, appLanguage } = useLanguage();
  const c = colors[theme];
  const isArabicUI = appLanguage === 'ar';
  const { ui, translateUI, needsTranslation } = useUITranslation(appLanguage);
  const [translatedReciters, setTranslatedReciters] = useState<Record<string, string>>({});
  const [translatedSurahNames, setTranslatedSurahNames] = useState<Record<number, string>>({});
  const [translatedSurahDetails, setTranslatedSurahDetails] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!needsTranslation) return;
    let cancelled = false;
    (async () => {
      const map: Record<string, string> = {};
      for (const reciter of RECITERS) {
        if (cancelled) return;
        map[reciter.id] = await translateText(reciter.name, appLanguage);
      }
      if (!cancelled) setTranslatedReciters(map);
    })();
    return () => { cancelled = true; };
  }, [appLanguage, needsTranslation]);

  useEffect(() => {
    if (!needsTranslation) return;
    let cancelled = false;
    (async () => {
      const nameMap: Record<number, string> = {};
      const detailMap: Record<number, string> = {};
      for (const surah of surahs) {
        if (cancelled) return;
        nameMap[surah.number] = await translateText(surah.englishName, appLanguage);
        detailMap[surah.number] = await translateText(surah.englishNameTranslation, appLanguage);
      }
      if (!cancelled) {
        setTranslatedSurahNames(nameMap);
        setTranslatedSurahDetails(detailMap);
      }
    })();
    return () => { cancelled = true; };
  }, [appLanguage, needsTranslation, surahs]);

  useEffect(() => {
    if (!needsTranslation) return;
    translateUI([
      'Quran Recitations',
      'Select Reciter',
      'Playback Error',
      'Could not play audio. Check your internet connection.',
      'Error',
      'Could not load surah',
      'Surah',
      'Ayah',
      'of',
      'ayahs',
    ]);
  }, [appLanguage, needsTranslation]);

  const [selectedReciter, setSelectedReciter] = useState(0);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ayahs, setAyahs] = useState<any[]>([]);
  const [englishAyahs, setEnglishAyahs] = useState<any[]>([]);
  const [translatedAyahs, setTranslatedAyahs] = useState<Record<number, string>>({});
  const [translatingAyahs, setTranslatingAyahs] = useState(false);
  const reciterRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    reciterRef.current = selectedReciter;
  }, [selectedReciter]);

  useEffect(() => {
    const callback = (playing: boolean) => {
      if (!isMountedRef.current) return;
      setIsPlaying(playing);
      if (!playing) setIsLoading(false);
    };
    setPlayStateCallback(callback);
    setIsPlaying(isSoundPlaying() && getCurrentOwner() === 'quran');
    return () => {
      setPlayStateCallback(() => {});
    };
  }, []);

  const handlePlaySurah = useCallback(async (surahNumber: number) => {
    try {
      if (selectedSurah === surahNumber && isPlaying) {
        await stopAudio();
        if (isMountedRef.current) {
          setIsPlaying(false);
          setSelectedSurah(null);
        }
        return;
      }

      const reciter = RECITERS[reciterRef.current];
      const url = getSurahAudioUrl(reciter.id, surahNumber);

      if (isMountedRef.current) {
        setIsLoading(true);
        setSelectedSurah(surahNumber);
      }

      await playAudio(url, 'quran', false);

      if (isMountedRef.current) {
        setIsPlaying(true);
        setIsLoading(false);
      }

      // Fetch ayahs for display (text only, audio is full surah)
      fetchSurah(surahNumber).then((surahData) => {
        if (!isMountedRef.current) return;
        setAyahs(surahData.arabic);
        setEnglishAyahs(surahData.english);
      }).catch(() => {});
    } catch (error) {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsPlaying(false);
        Alert.alert(
          isArabicUI ? 'خطأ في التشغيل' : ui('Playback Error'),
          isArabicUI
            ? 'تعذر تشغيل الصوت. تأكد من اتصالك بالإنترنت.'
            : ui('Could not play audio. Check your internet connection.')
        );
      }
    }
  }, [selectedSurah, isPlaying, isArabicUI, ui]);

  const handleStop = useCallback(async () => {
    await stopAudio();
    if (isMountedRef.current) {
      setIsPlaying(false);
      setSelectedSurah(null);
    }
  }, []);

  const handleBackFromPlayer = useCallback(() => {
    if (isMountedRef.current) {
      setSelectedSurah(null);
    }
  }, []);

  const handlePauseResume = useCallback(async () => {
    if (isPlaying) {
      await pauseAudio();
      if (isMountedRef.current) setIsPlaying(false);
    } else {
      await resumeAudio();
      if (isMountedRef.current) setIsPlaying(true);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!needsTranslation || englishAyahs.length === 0 || selectedSurah === null) return;
    let cancelled = false;
    setTranslatingAyahs(true);
    (async () => {
      const map: Record<number, string> = {};
      try {
        const quranTranslations = await getQuranTranslation(appLanguage, selectedSurah);
        if (cancelled) return;
        if (quranTranslations && quranTranslations.length > 0) {
          for (let i = 0; i < englishAyahs.length; i++) {
            map[englishAyahs[i].numberInSurah] = quranTranslations[i] || englishAyahs[i].text;
          }
        } else {
          for (const ayah of englishAyahs) {
            if (cancelled) return;
            try {
              map[ayah.numberInSurah] = await translateText(ayah.text, appLanguage);
            } catch (e) {
              map[ayah.numberInSurah] = ayah.text;
            }
          }
        }
      } catch (e) {
        for (const ayah of englishAyahs) {
          if (cancelled) return;
          try {
            map[ayah.numberInSurah] = await translateText(ayah.text, appLanguage);
          } catch (e2) {
            map[ayah.numberInSurah] = ayah.text;
          }
        }
      }
      if (!cancelled) {
        setTranslatedAyahs(map);
        setTranslatingAyahs(false);
      }
    })();
    return () => { cancelled = true; };
  }, [appLanguage, needsTranslation, englishAyahs, selectedSurah]);

  if (selectedSurah !== null) {
    const surahMeta = surahs.find((s) => s.number === selectedSurah);
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={c.headerBg} />
        <View style={[styles.header, { backgroundColor: c.headerBg }]}>
          <TouchableOpacity onPress={handleBackFromPlayer} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isArabicUI
              ? surahMeta?.name || `سورة ${selectedSurah}`
              : surahMeta?.englishName || ui(`Surah ${selectedSurah}`)}
          </Text>
          <TouchableOpacity onPress={handleStop} style={styles.backBtn}>
            <Ionicons name="stop-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Player Controls */}
        <View style={[styles.playerBar, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
          <TouchableOpacity onPress={handlePauseResume} style={[styles.playBtn, { backgroundColor: c.primary }]}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#fff" />
            )}
          </TouchableOpacity>
          <View style={styles.playerInfo}>
            <Text style={[styles.playerReciter, { color: c.text }]}>
              {isArabicUI ? RECITERS[selectedReciter].ar : (needsTranslation ? (translatedReciters[RECITERS[selectedReciter].id] || RECITERS[selectedReciter].name) : RECITERS[selectedReciter].name)}
            </Text>
            <Text style={[styles.playerAyah, { color: c.textSecondary }]}>
              {isArabicUI
                ? `${surahMeta?.numberOfAyahs || ''} آية`
                : `${surahMeta?.numberOfAyahs || ''} ${ui('ayahs')}`}
            </Text>
          </View>
          <TouchableOpacity onPress={handleStop} style={styles.stopBtn}>
            <Ionicons name="stop-outline" size={22} color={c.primary} />
          </TouchableOpacity>
        </View>

        {/* Ayah List with current highlight */}
        <FlatList
          data={ayahs}
          keyExtractor={(item) => String(item.numberInSurah)}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          renderItem={({ item, index }) => (
            <View
              style={[
                styles.ayahItem,
                {
                  backgroundColor: c.surface,
                  borderBottomColor: c.border,
                },
              ]}
            >
              <View style={[styles.ayahNumber, { backgroundColor: c.primary }]}>
                <Text style={styles.ayahNumberText}>{item.numberInSurah}</Text>
              </View>
              <View style={styles.ayahTextContainer}>
                {isArabicUI ? (
                  <Text style={[styles.arabicTextBig, { color: c.text }]}>{item.text}</Text>
                ) : (
                  <>
                    <Text style={[styles.translationTextBig, { color: c.text }]}>
                      {needsTranslation
                        ? (translatedAyahs[item.numberInSurah] || (translatingAyahs ? '...' : (englishAyahs.find(e => e.numberInSurah === item.numberInSurah)?.text || '')))
                        : (englishAyahs.find(e => e.numberInSurah === item.numberInSurah)?.text || '')}
                    </Text>
                    <Text style={[styles.arabicTextSmall, { color: c.textSecondary }]}>{item.text}</Text>
                  </>
                )}
              </View>
            </View>
          )}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={c.headerBg} />
      <View style={[styles.header, { backgroundColor: c.headerBg }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isArabicUI ? 'تلاوات القرآن' : ui(t('quranAudio'))}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Reciter Selection */}
      <View style={[styles.reciterSection, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <Text style={[styles.reciterLabel, { color: c.textSecondary }]}>
          {isArabicUI ? 'اختر القارئ' : ui('Select Reciter')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reciterScroll}>
          {RECITERS.map((reciter, index) => (
            <TouchableOpacity
              key={reciter.id}
              style={[
                styles.reciterChip,
                {
                  backgroundColor: selectedReciter === index ? c.primary : c.ayahBg,
                },
              ]}
              onPress={() => setSelectedReciter(index)}
            >
              <Text
                style={[
                  styles.reciterChipText,
                  { color: selectedReciter === index ? '#fff' : c.text },
                ]}
              >
                {isArabicUI ? reciter.ar : (needsTranslation ? (translatedReciters[reciter.id] || reciter.name) : reciter.name)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Surah List */}
      <FlatList
        data={surahs}
        keyExtractor={(item) => String(item.number)}
        contentContainerStyle={styles.listContent}
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={10}
        removeClippedSubviews={true}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.surahItem, { backgroundColor: c.surface, borderBottomColor: c.border }]}
            onPress={() => handlePlaySurah(item.number)}
            activeOpacity={0.7}
          >
            <View style={[styles.surahNumber, { backgroundColor: c.ayahBg }]}>
              <Text style={[styles.surahNumberText, { color: c.primary }]}>{item.number}</Text>
            </View>
            <View style={styles.surahInfo}>
              <Text style={[styles.surahName, { color: c.text }]}>
                {isArabicUI ? item.name : (needsTranslation ? (translatedSurahNames[item.number] || item.englishName) : item.englishName)}
              </Text>
              <Text style={[styles.surahDetail, { color: c.textSecondary }]}>
                {isArabicUI ? item.englishNameTranslation : (needsTranslation ? (translatedSurahDetails[item.number] || item.englishNameTranslation) : item.englishNameTranslation)} • {item.numberOfAyahs} {isArabicUI ? 'آية' : ui('ayahs')}
              </Text>
            </View>
            <View style={styles.playIcon}>
              {isLoading && selectedSurah === item.number ? (
                <ActivityIndicator size="small" color={c.primary} />
              ) : (
                <Ionicons name="play-circle-outline" size={28} color={c.primary} />
              )}
            </View>
          </TouchableOpacity>
        )}
      />
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
  reciterSection: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reciterLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  reciterScroll: { flexGrow: 0 },
  reciterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  reciterChipText: { fontSize: 13, fontWeight: '600' },
  listContent: { padding: 16 },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  surahNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  surahNumberText: { fontSize: 14, fontWeight: 'bold' },
  surahInfo: { flex: 1 },
  surahName: { fontSize: 16, fontWeight: '600', marginBottom: 3 },
  surahDetail: { fontSize: 12 },
  playIcon: { padding: 4 },
  playerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  playerInfo: { flex: 1 },
  playerReciter: { fontSize: 15, fontWeight: '600' },
  playerAyah: { fontSize: 13, marginTop: 2 },
  stopBtn: { padding: 4 },
  ayahItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ayahNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  ayahNumberText: { fontSize: 12, fontWeight: 'bold', color: '#fff' },
  ayahTextContainer: {
    flex: 1,
  },
  arabicTextBig: {
    fontSize: 22,
    lineHeight: 40,
    textAlign: 'right',
  },
  arabicTextSmall: {
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'right',
    marginTop: 8,
  },
  translationTextBig: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'left',
  },
});

export default QuranAudioScreen;
