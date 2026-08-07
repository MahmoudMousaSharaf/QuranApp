import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Linking,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUITranslation } from '../hooks/useUITranslation';

interface AboutUsScreenProps {
  onBack: () => void;
}

const AboutUsScreen: React.FC<AboutUsScreenProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const { t, appLanguage } = useLanguage();
  const c = colors[theme];
  const isArabicUI = appLanguage === 'ar';
  const { ui, translateUI, needsTranslation } = useUITranslation(appLanguage);

  useEffect(() => {
    if (!needsTranslation) return;
    translateUI([
      'Our mission is to provide a comprehensive Quran app for every Muslim in the world. The app includes the complete Quran in Arabic and English, Azkar, prayer times, Qibla direction, Hadith, scientific miracles, Prophet\'s Sunnah, and answers to common questions about Islam.',
      'Our Third Project',
    ]);
  }, [appLanguage, needsTranslation]);

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={c.headerBg} />
      <View style={[styles.header, { backgroundColor: c.headerBg }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isArabicUI ? 'من نحن' : ui(t('aboutUs'))}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Logo / Title */}
        <View style={[styles.logoBox, { backgroundColor: c.headerBg }]}>
          <Ionicons name="book" size={48} color="#fff" />
          <Text style={styles.logoTitle}>The Truth - Al Haq</Text>
          <Text style={styles.logoSubtitle}>
            {isArabicUI ? 'تطبيق القرآن الكريم الشامل' : ui(t('completeQuranApp'))}
          </Text>
        </View>

        {/* Description */}
        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <Text style={[styles.sectionTitle, { color: c.primary }]}>
            {isArabicUI ? 'مهمتنا' : ui(t('ourMission'))}
          </Text>
          <Text style={[styles.sectionText, { color: c.textSecondary }]}>
            {isArabicUI
              ? 'مهمتنا توفير تطبيق قرآني شامل لكل مسلم في العالم. يحتوي التطبيق على القرآن الكريم بالكامل بالعربية والإنجليزية، الأذكار، أوقات الصلاة، القبلة، الأحاديث النبوية، الإعجاز العلمي، سنن النبي ﷺ، وأجوبة للأسئلة الشائعة عن الإسلام.'
              : ui('Our mission is to provide a comprehensive Quran app for every Muslim in the world. The app includes the complete Quran in Arabic and English, Azkar, prayer times, Qibla direction, Hadith, scientific miracles, Prophet\'s Sunnah, and answers to common questions about Islam.')}
          </Text>
        </View>

        {/* YouTube Channel */}
        <TouchableOpacity
          style={[styles.linkCard, { backgroundColor: c.surface, borderBottomColor: c.border }]}
          onPress={() => openLink('https://youtube.com/@waytoallah2')}
          activeOpacity={0.7}
        >
          <View style={[styles.linkIcon, { backgroundColor: '#FF0000' }]}>
            <Ionicons name="logo-youtube" size={28} color="#fff" />
          </View>
          <View style={styles.linkInfo}>
            <Text style={[styles.linkTitle, { color: c.text }]}>
              {isArabicUI ? 'قناة اليوتيوب' : ui(t('youtubeChannel'))}
            </Text>
            <Text style={[styles.linkUrl, { color: c.textSecondary }]}>youtube.com/@waytoallah2</Text>
          </View>
          <Ionicons name="open-outline" size={20} color={c.primary} />
        </TouchableOpacity>

        {/* Project 1 */}
        <TouchableOpacity
          style={[styles.linkCard, { backgroundColor: c.surface, borderBottomColor: c.border }]}
          onPress={() => openLink('https://shegoz.top')}
          activeOpacity={0.7}
        >
          <View style={[styles.linkIcon, { backgroundColor: c.primary }]}>
            <Ionicons name="globe-outline" size={28} color="#fff" />
          </View>
          <View style={styles.linkInfo}>
            <Text style={[styles.linkTitle, { color: c.text }]}>
              {isArabicUI ? 'مشروعنا الأول' : ui(t('ourFirstProject'))}
            </Text>
            <Text style={[styles.linkUrl, { color: c.textSecondary }]}>shegoz.top</Text>
          </View>
          <Ionicons name="open-outline" size={20} color={c.primary} />
        </TouchableOpacity>

        {/* Project 2 */}
        <TouchableOpacity
          style={[styles.linkCard, { backgroundColor: c.surface, borderBottomColor: c.border }]}
          onPress={() => openLink('https://guidano.us')}
          activeOpacity={0.7}
        >
          <View style={[styles.linkIcon, { backgroundColor: c.primary }]}>
            <Ionicons name="globe-outline" size={28} color="#fff" />
          </View>
          <View style={styles.linkInfo}>
            <Text style={[styles.linkTitle, { color: c.text }]}>
              {isArabicUI ? 'مشروعنا الثاني' : ui(t('ourSecondProject'))}
            </Text>
            <Text style={[styles.linkUrl, { color: c.textSecondary }]}>guidano.us</Text>
          </View>
          <Ionicons name="open-outline" size={20} color={c.primary} />
        </TouchableOpacity>

        {/* Project 3 */}
        <TouchableOpacity
          style={[styles.linkCard, { backgroundColor: c.surface, borderBottomColor: c.border }]}
          onPress={() => openLink('https://learnvexo.com')}
          activeOpacity={0.7}
        >
          <View style={[styles.linkIcon, { backgroundColor: c.primary }]}>
            <Ionicons name="globe-outline" size={28} color="#fff" />
          </View>
          <View style={styles.linkInfo}>
            <Text style={[styles.linkTitle, { color: c.text }]}>
              {isArabicUI ? 'مشروعنا الثالث' : ui('Our Third Project')}
            </Text>
            <Text style={[styles.linkUrl, { color: c.textSecondary }]}>learnvexo.com</Text>
          </View>
          <Ionicons name="open-outline" size={20} color={c.primary} />
        </TouchableOpacity>

        {/* Version */}
        <Text style={[styles.version, { color: c.textSecondary }]}>{ui(t('versionLabel'))}</Text>
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
  logoBox: {
    alignItems: 'center',
    paddingVertical: 32,
    borderRadius: 16,
    marginBottom: 16,
  },
  logoTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 12 },
  logoSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  sectionText: { fontSize: 14, lineHeight: 22 },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  linkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  linkInfo: { flex: 1 },
  linkTitle: { fontSize: 16, fontWeight: '600', marginBottom: 3 },
  linkUrl: { fontSize: 13 },
  version: { fontSize: 12, textAlign: 'center', marginTop: 16 },
});

export default AboutUsScreen;
