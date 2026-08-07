import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUITranslation } from '../hooks/useUITranslation';
import { translateText } from '../services/contentTranslator';

interface DreamInterpretationScreenProps {
  onBack: () => void;
}

const TELEGRAM_USERNAME = 'Tafsirkom';

const DreamInterpretationScreen: React.FC<DreamInterpretationScreenProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const { t, appLanguage } = useLanguage();
  const c = colors[theme];
  const { ui, translateUI } = useUITranslation(appLanguage);
  const [translatedHadith, setTranslatedHadith] = useState<string>('');

  const HADITH_EN = 'The Prophet (peace be upon him) said: "When the time draws near, the dream of a believer will hardly be false, and the truest of you in speech are the truest in dreams." (Sahih Bukhari)';

  useEffect(() => {
    translateUI([
      t('dreamInterpretation'),
      t('dreamIntro'),
      t('dreamContact'),
      t('dreamButton'),
      t('dreamNote'),
    ]);
  }, [appLanguage]);

  useEffect(() => {
    if (appLanguage === 'ar' || appLanguage === 'ur' || appLanguage === 'en') {
      setTranslatedHadith('');
      return;
    }
    let cancelled = false;
    (async () => {
      const translated = await translateText(HADITH_EN, appLanguage);
      if (!cancelled) setTranslatedHadith(translated);
    })();
    return () => { cancelled = true; };
  }, [appLanguage]);

  const openTelegram = async () => {
    const appUrl = `tg://resolve?domain=${TELEGRAM_USERNAME}`;
    const webUrl = `https://t.me/${TELEGRAM_USERNAME}`;

    try {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      try {
        await Linking.openURL(webUrl);
      } catch {
        Alert.alert('Error', 'Unable to open Telegram');
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="#7c3aed" />

      <LinearGradient
        colors={['#7c3aed', '#6d28d9', '#5b21b6']}
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
            {ui(t('dreamInterpretation'))}
          </Text>
          <View style={{ width: 28 }} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Moon icon card */}
        <View style={[styles.iconCard, { backgroundColor: c.surface }]}>
          <LinearGradient
            colors={['#7c3aed', '#a78bfa']}
            style={styles.iconBubble}
          >
            <Ionicons name="cloudy-night" size={48} color="#fff" />
          </LinearGradient>
        </View>

        {/* Intro text */}
        <View style={[styles.introCard, { backgroundColor: c.surface }]}>
          <Text style={[styles.introText, { color: c.text }]}>
            {ui(t('dreamIntro'))}
          </Text>
        </View>

        {/* Contact card */}
        <View style={[styles.contactCard, { backgroundColor: c.surface }]}>
          <View style={styles.contactHeader}>
            <Ionicons name="send" size={28} color="#7c3aed" />
            <Text style={[styles.contactTitle, { color: c.text }]}>
              @{TELEGRAM_USERNAME}
            </Text>
          </View>
          <Text style={[styles.contactDesc, { color: c.textSecondary }]}>
            {ui(t('dreamContact'))}
          </Text>

          <TouchableOpacity
            onPress={openTelegram}
            activeOpacity={0.8}
            style={styles.telegramBtn}
          >
            <LinearGradient
              colors={['#7c3aed', '#a78bfa']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.telegramBtnGradient}
            >
              <Ionicons name="paper-plane" size={20} color="#fff" />
              <Text style={styles.telegramBtnText}>
                {ui(t('dreamButton'))}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Note card */}
        <View style={[styles.noteCard, { backgroundColor: c.ayahBg }]}>
          <View style={styles.noteHeader}>
            <Ionicons name="information-circle" size={18} color="#7c3aed" />
            <Text style={[styles.noteLabel, { color: '#7c3aed' }]}>
              {ui(t('dreamNote'))}
            </Text>
          </View>
        </View>

        {/* Decorative hadith quote */}
        <View style={[styles.quoteCard, { backgroundColor: c.surface }]}>
          <Ionicons name="quote" size={32} color={c.primary} style={styles.quoteIcon} />
          <Text style={[styles.quoteText, { color: c.textSecondary }]}>
            {appLanguage === 'ar'
              ? 'عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللَّهُ عَنْهُ قَالَ: قَالَ رَسُولُ اللَّهِ ﷺ: «إِذَا اقْتَرَبَ الزَّمَانُ لَمْ تَكَدْ تَكْذِبْ رُؤْيَا الْمُؤْمِنِ، وَأَصْدَقُكُمْ رُؤْيَا أَصْدَقُكُمْ حَدِيثًا»'
              : appLanguage === 'ur'
              ? 'حضرت ابو ہریرہ رضی اللہ عنہ سے روایت ہے کہ رسول اللہ ﷺ نے فرمایا: «جب قیامت قریب ہوگا تو مومن کا خواب جھوٹا نہ ہوگا، اور سب سے سچی خواب وہ ہے جو سب سے سچا بولنے والا ہے»'
              : translatedHadith || HADITH_EN}
          </Text>
        </View>
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
  content: {
    padding: 16,
  },
  iconCard: {
    alignItems: 'center',
    paddingVertical: 30,
    borderRadius: 20,
    marginBottom: 14,
  },
  iconBubble: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  introCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
  },
  introText: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    fontWeight: '500',
  },
  contactCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 14,
    alignItems: 'center',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  contactDesc: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  telegramBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  telegramBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  telegramBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  noteCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteLabel: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  quoteCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  quoteIcon: {
    marginBottom: 10,
  },
  quoteText: {
    fontSize: 14,
    lineHeight: 24,
    fontStyle: 'italic',
  },
});

export default DreamInterpretationScreen;
