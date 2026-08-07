import React, { useState, Component, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Linking,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUITranslation } from '../hooks/useUITranslation';

// AdMob configuration with real ad unit IDs
const ADMOB_BANNER_ID = 'ca-app-pub-7095033876130680/7610704737';
const ADMOB_APP_ID = 'ca-app-pub-7095033876130680~2642429023';

// Lazy-load AdMob module — check if native module is actually available
// In Expo Go, the JS package loads but native code isn't linked, so BannerAd crashes at render
let BannerAd: any = null;
let BannerAdSize: any = null;
let admobAvailable = false;
try {
  const admob = require('react-native-google-mobile-ads');
  // Check if the native module is actually linked (not just JS package)
  const NativeModules = require('react-native').NativeModules;
  if (NativeModules.RNGoogleMobileAds || NativeModules.RNGoogleMobileAdsModule) {
    BannerAd = admob.BannerAd;
    BannerAdSize = admob.BannerAdSize;
    admobAvailable = true;
  }
} catch {
  // Module not available (Expo Go or not installed)
}

// Error boundary to gracefully handle cases where native module isn't available (e.g. Expo Go)
class AdErrorBoundary extends Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('AdMob banner error:', error.message);
  }

  render() {
    if (this.state.hasError) return <>{this.props.fallback}</>;
    return <>{this.props.children}</>;
  }
}

interface SupportUsScreenProps {
  onBack: () => void;
}

const SupportUsScreen: React.FC<SupportUsScreenProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const { t, appLanguage } = useLanguage();
  const c = colors[theme];
  const isArabicUI = appLanguage === 'ar';
  const { ui, translateUI, needsTranslation } = useUITranslation(appLanguage);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!needsTranslation) return;
    translateUI([
      'If you would like to support this app and help us continue providing Islamic content, you can donate via the links below or watch ads. Your support means a lot to us.',
      'Direct Donation',
      'Watch Ads to Support Us',
      'Ad Space',
      'Google AdMob ads appear in the full build of the app',
      'Our Projects',
      'Copied',
      'Copy',
      'Error',
      'Could not open Skrill. Email copied.',
      'Could not open PayPal. Link copied.',
    ]);
  }, [appLanguage, needsTranslation]);

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openSkrill = () => {
    // Open Skrill send money page - user can send to modymezo95@yahoo.com
    Linking.openURL('https://www.skrill.com/en/send-money/').catch(() => {
      Alert.alert(
        isArabicUI ? 'خطأ' : ui('Error'),
        isArabicUI ? 'تعذر فتح Skrill. تم نسخ البريد الإلكتروني.' : ui('Could not open Skrill. Email copied.')
      );
      copyToClipboard('modymezo95@yahoo.com', 'skrill');
    });
  };

  const openPayPal = () => {
    Linking.openURL('https://paypal.me/cash4477').catch(() => {
      Alert.alert(
        isArabicUI ? 'خطأ' : ui('Error'),
        isArabicUI ? 'تعذر فتح PayPal. تم نسخ الرابط.' : ui('Could not open PayPal. Link copied.')
      );
      copyToClipboard('https://paypal.me/cash4477', 'paypal');
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={c.headerBg} />
      <View style={[styles.header, { backgroundColor: c.headerBg }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isArabicUI ? 'ادعمنا' : ui(t('supportUs'))}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Heart icon */}
        <View style={styles.heartContainer}>
          <View style={[styles.heartCircle, { backgroundColor: c.headerBg }]}>
            <Ionicons name="heart" size={48} color="#fff" />
          </View>
        </View>

        {/* Message */}
        <View style={[styles.messageBox, { backgroundColor: c.surface }]}>
          <Text style={[styles.messageTitle, { color: c.primary }]}>
            {isArabicUI
              ? 'ادعمنا للاستمرار في تقديم المحتوى الإسلامي'
              : ui(t('supportTitle'))}
          </Text>
          <Text style={[styles.messageText, { color: c.textSecondary }]}>
            {isArabicUI
              ? 'إذا أردت دعم التطبيق ومساعدتنا على الاستمرار في تقديم المحتوى الإسلامي، يمكنك التبرع عبر الروابط أدناه أو مشاهدة الإعلانات. دعمك يعني الكثير لنا.'
              : ui('If you would like to support this app and help us continue providing Islamic content, you can donate via the links below or watch ads. Your support means a lot to us.')}
          </Text>
        </View>

        {/* Donation Section */}
        <Text style={[styles.sectionLabel, { color: c.primary }]}>
          {isArabicUI ? 'التبرع المباشر' : ui('Direct Donation')}
        </Text>

        {/* Skrill Donation */}
        <View style={[styles.donationCard, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
          <TouchableOpacity style={styles.donationMain} onPress={openSkrill} activeOpacity={0.7}>
            <View style={[styles.donationIcon, { backgroundColor: '#7B27FF' }]}>
              <Ionicons name="wallet" size={28} color="#fff" />
            </View>
            <View style={styles.donationInfo}>
              <Text style={[styles.donationTitle, { color: c.text }]}>Skrill</Text>
              <Text style={[styles.donationDetail, { color: c.textSecondary }]}>modymezo95@yahoo.com</Text>
            </View>
            <Ionicons name="open-outline" size={22} color={c.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.copyBtn, { backgroundColor: c.ayahBg }]}
            onPress={() => copyToClipboard('modymezo95@yahoo.com', 'skrill')}
          >
            <Ionicons name={copiedField === 'skrill' ? 'checkmark' : 'copy-outline'} size={16} color={c.primary} />
            <Text style={[styles.copyText, { color: c.primary }]}>
              {copiedField === 'skrill'
                ? (isArabicUI ? 'تم النسخ' : ui('Copied'))
                : (isArabicUI ? 'نسخ' : ui('Copy'))}
            </Text>
          </TouchableOpacity>
        </View>

        {/* PayPal Donation */}
        <View style={[styles.donationCard, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
          <TouchableOpacity style={styles.donationMain} onPress={openPayPal} activeOpacity={0.7}>
            <View style={[styles.donationIcon, { backgroundColor: '#003087' }]}>
              <Ionicons name="cash-outline" size={28} color="#fff" />
            </View>
            <View style={styles.donationInfo}>
              <Text style={[styles.donationTitle, { color: c.text }]}>PayPal</Text>
              <Text style={[styles.donationDetail, { color: c.textSecondary }]}>paypal.me/cash4477</Text>
            </View>
            <Ionicons name="open-outline" size={22} color={c.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.copyBtn, { backgroundColor: c.ayahBg }]}
            onPress={() => copyToClipboard('https://paypal.me/cash4477', 'paypal')}
          >
            <Ionicons name={copiedField === 'paypal' ? 'checkmark' : 'copy-outline'} size={16} color={c.primary} />
            <Text style={[styles.copyText, { color: c.primary }]}>
              {copiedField === 'paypal'
                ? (isArabicUI ? 'تم النسخ' : ui('Copied'))
                : (isArabicUI ? 'نسخ' : ui('Copy'))}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Ads Section */}
        <Text style={[styles.sectionLabel, { color: c.primary }]}>
          {isArabicUI ? 'شاهد إعلانات لدعم التطبيق' : ui('Watch Ads to Support Us')}
        </Text>

        <View style={[styles.adContainer, { backgroundColor: c.surface, borderColor: c.border }]}>
          {admobAvailable && BannerAd && BannerAdSize ? (
            <AdErrorBoundary
              fallback={
                <View style={[styles.adPlaceholderBox, { backgroundColor: c.ayahBg }]}>
                  <Ionicons name="megaphone-outline" size={32} color={c.primary} />
                  <Text style={[styles.adPlaceholderTitle, { color: c.text }]}>
                    {isArabicUI ? 'مساحة الإعلان' : ui('Ad Space')}
                  </Text>
                  <Text style={[styles.adPlaceholderText, { color: c.textSecondary }]}>
                    {isArabicUI
                      ? 'سيظهر هنا إعلان من Google AdMob عند تفعيله'
                      : ui('Google AdMob banner will appear here when configured')}
                  </Text>
                </View>
              }
            >
              <BannerAd
                unitId={ADMOB_BANNER_ID}
                size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                onAdFailedToLoad={() => {}}
              />
            </AdErrorBoundary>
          ) : (
            <View style={[styles.adPlaceholderBox, { backgroundColor: c.ayahBg }]}>
              <Ionicons name="megaphone-outline" size={32} color={c.primary} />
              <Text style={[styles.adPlaceholderTitle, { color: c.text }]}>
                {isArabicUI ? 'مساحة الإعلان' : ui('Ad Space')}
              </Text>
              <Text style={[styles.adPlaceholderText, { color: c.textSecondary }]}>
                {isArabicUI
                  ? 'إعلانات Google AdMob تظهر في النسخة الكاملة من التطبيق\nمعرّف التطبيق: ' + ADMOB_APP_ID
                  : ui('Google AdMob ads appear in the full build of the app') + '\nApp ID: ' + ADMOB_APP_ID}
              </Text>
            </View>
          )}
        </View>

        {/* Thank you */}
        <Text style={[styles.thankYou, { color: c.textSecondary }]}>
          {isArabicUI ? 'جزاكم الله خيراً 🤲' : ui(t('jazakumAllahuKhairan'))}
        </Text>

        {/* Our Projects */}
        <View style={[styles.projectsBox, { backgroundColor: c.ayahBg, borderLeftColor: c.primary }]}>
          <Text style={[styles.projectsTitle, { color: c.primary }]}>
            {isArabicUI ? 'مشاريعنا' : ui('Our Projects')}
          </Text>
          <TouchableOpacity onPress={() => openLink('https://shegoz.top')} style={styles.projectLink}>
            <Ionicons name="globe-outline" size={16} color={c.primary} />
            <Text style={[styles.projectText, { color: c.text }]}>shegoz.top</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openLink('https://guidano.us')} style={styles.projectLink}>
            <Ionicons name="globe-outline" size={16} color={c.primary} />
            <Text style={[styles.projectText, { color: c.text }]}>guidano.us</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openLink('https://learnvexo.com')} style={styles.projectLink}>
            <Ionicons name="globe-outline" size={16} color={c.primary} />
            <Text style={[styles.projectText, { color: c.text }]}>learnvexo.com</Text>
          </TouchableOpacity>
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
  content: { padding: 16, paddingBottom: 40 },
  heartContainer: { alignItems: 'center', marginVertical: 20 },
  heartCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  messageTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  messageText: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 8,
  },
  donationCard: {
    borderRadius: 12,
    marginBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  donationMain: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  donationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  donationInfo: { flex: 1 },
  donationTitle: { fontSize: 16, fontWeight: '600', marginBottom: 3 },
  donationDetail: { fontSize: 13 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  copyText: { fontSize: 13, fontWeight: '600' },
  adContainer: {
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 16,
  },
  adPlaceholderBox: {
    alignItems: 'center',
    paddingVertical: 24,
    borderRadius: 8,
  },
  adPlaceholderTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  adPlaceholderText: { fontSize: 12, marginTop: 4, textAlign: 'center' },
  adPlaceholder: { fontSize: 14, textAlign: 'center' },
  thankYou: { fontSize: 16, textAlign: 'center', marginVertical: 20, fontWeight: '600' },
  projectsBox: {
    padding: 16,
    borderRadius: 10,
    borderLeftWidth: 4,
  },
  projectsTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 10 },
  projectLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  projectText: { fontSize: 14 },
});

export default SupportUsScreen;
