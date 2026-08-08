import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Switch,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUITranslation } from '../hooks/useUITranslation';
import {
  ALL_RECITERS,
  RUQYAH_SHEIKHS,
  getWifiOnlySetting,
  setWifiOnlySetting,
  getAutoDownloadSetting,
  setAutoDownloadSetting,
  getSelectedReciters,
  setSelectedReciters,
  getDownloadRuqyahSetting,
  setDownloadRuqyahSetting,
  estimateDownloadSizeMB,
  isOnWifi,
} from '../services/audioDownloadSettings';
import {
  preloadAllAudio,
  cancelPreload,
  isPreloading,
  getPreloadProgress,
  isPreloadComplete,
  clearAudioCache,
  getCacheSize,
  PreloadProgress,
} from '../services/audioCache';

interface AudioDownloadSettingsScreenProps {
  onBack: () => void;
}

const AudioDownloadSettingsScreen: React.FC<AudioDownloadSettingsScreenProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const { t, appLanguage } = useLanguage();
  const c = colors[theme];
  const isArabic = appLanguage === 'ar';
  const { ui, translateUI, needsTranslation } = useUITranslation(appLanguage);

  const [wifiOnly, setWifiOnly] = useState(true);
  const [autoDownload, setAutoDownload] = useState(false);
  const [selectedReciters, setSelectedRecitersState] = useState<string[]>([]);
  const [downloadRuqyah, setDownloadRuqyahState] = useState(false);
  const [cacheSizeMB, setCacheSizeMB] = useState(0);
  const [preloadProgress, setPreloadProgress] = useState<PreloadProgress | null>(null);
  const [preloadDone, setPreloadDone] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const [w, a, r, rq, done, size, progress] = await Promise.all([
      getWifiOnlySetting(),
      getAutoDownloadSetting(),
      getSelectedReciters(),
      getDownloadRuqyahSetting(),
      isPreloadComplete(),
      getCacheSize(),
      getPreloadProgress(),
    ]);
    setWifiOnly(w);
    setAutoDownload(a);
    setSelectedRecitersState(r);
    setDownloadRuqyahState(rq);
    setPreloadDone(done);
    setCacheSizeMB(Math.round(size / (1024 * 1024)));
    if (!done && progress.total > 0) {
      setPreloadProgress({ downloaded: progress.downloaded, total: progress.total, percentage: Math.round((progress.downloaded / progress.total) * 100), currentFile: '' });
    }
    setIsDownloading(isPreloading());
  };

  const tt = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      downloadSettings: { en: 'Audio Download Settings', ar: 'إعدادات تحميل الصوت' },
      autoDownload: { en: 'Auto-download on app start', ar: 'تحميل تلقائي عند فتح التطبيق' },
      autoDownloadDesc: { en: 'Automatically download selected audio in background', ar: 'تحميل الصوت المحدد تلقائياً في الخلفية' },
      wifiOnly: { en: 'Wi-Fi only', ar: 'عبر واي فاي فقط' },
      wifiOnlyDesc: { en: 'Only download when connected to Wi-Fi', ar: 'تحميل فقط عند الاتصال بالواي فاي' },
      selectReciters: { en: 'Select Reciters to Download', ar: 'اختر القراء للتحميل' },
      selectRecitersDesc: { en: 'Choose which reciters to store offline', ar: 'اختر القراء للتخزين دون اتصال' },
      ruqyahAudio: { en: 'Ruqyah Sharia Audio', ar: 'صوت الرقية الشرعية' },
      ruqyahAudioDesc: { en: 'Download all 3 sheikhs for offline', ar: 'تحميل جميع المشايخ الثلاثة' },
      estimatedSize: { en: 'Estimated size', ar: 'الحجم المقدر' },
      startDownload: { en: 'Start Download Now', ar: 'ابدأ التحميل الآن' },
      stopDownload: { en: 'Stop Download', ar: 'إيقاف التحميل' },
      downloading: { en: 'Downloading...', ar: 'جاري التحميل...' },
      downloadComplete: { en: 'Download Complete!', ar: 'اكتمل التحميل!' },
      clearCache: { en: 'Clear All Downloaded Audio', ar: 'مسح جميع الصوت المحمل' },
      clearCacheConfirm: { en: 'Are you sure? This will delete all downloaded audio files.', ar: 'هل أنت متأكد؟ سيتم حذف جميع الملفات الصوتية المحملة.' },
      cacheSize: { en: 'Downloaded size', ar: 'الحجم المحمل' },
      cellularWarning: { en: 'You are not on Wi-Fi. This may use mobile data. Continue?', ar: 'أنت لست على واي فاي. قد يستخدم هذا بيانات الهاتف. هل تريد المتابعة؟' },
      noRecitersSelected: { en: 'Please select at least one reciter', ar: 'يرجى اختيار قارئ واحد على الأقل' },
      mb: { en: 'MB', ar: 'ميجابايت' },
      filesDownloaded: { en: 'files downloaded', ar: 'ملفات محملة' },
      reciter: { en: 'Reciter', ar: 'قارئ' },
      sheikh: { en: 'Sheikh', ar: 'شيخ' },
    };
    return translations[key]?.[isArabic ? 'ar' : 'en'] || key;
  };

  const toggleReciter = async (reciterId: string) => {
    let newSelected: string[];
    if (selectedReciters.includes(reciterId)) {
      newSelected = selectedReciters.filter((r) => r !== reciterId);
    } else {
      newSelected = [...selectedReciters, reciterId];
    }
    setSelectedRecitersState(newSelected);
    await setSelectedReciters(newSelected);
  };

  const toggleWifiOnly = async (enabled: boolean) => {
    setWifiOnly(enabled);
    await setWifiOnlySetting(enabled);
  };

  const toggleAutoDownload = async (enabled: boolean) => {
    setAutoDownload(enabled);
    await setAutoDownloadSetting(enabled);
  };

  const toggleRuqyah = async (enabled: boolean) => {
    setDownloadRuqyahState(enabled);
    await setDownloadRuqyahSetting(enabled);
  };

  const handleStartDownload = async () => {
    if (selectedReciters.length === 0 && !downloadRuqyah) {
      Alert.alert(tt('noRecitersSelected'));
      return;
    }

    const wifi = await isOnWifi();
    if (wifiOnly && !wifi) {
      Alert.alert(
        tt('cellularWarning'),
        '',
        [
          { text: t('cancel') || 'Cancel', style: 'cancel' },
          { text: t('ok') || 'OK', onPress: () => startDownload() },
        ]
      );
      return;
    }
    startDownload();
  };

  const startDownload = async () => {
    setIsDownloading(true);
    setPreloadDone(false);
    setPreloadProgress({ downloaded: 0, total: 0, percentage: 0, currentFile: '' });

    preloadAllAudio((progress) => {
      setPreloadProgress(progress);
      if (progress.percentage >= 100) {
        setPreloadDone(true);
        setIsDownloading(false);
        loadSettings();
      }
    }).catch((e) => {
      console.error('Download error:', e);
      setIsDownloading(false);
    });
  };

  const handleStopDownload = () => {
    cancelPreload();
    setIsDownloading(false);
  };

  const handleClearCache = () => {
    Alert.alert(
      tt('clearCache'),
      tt('clearCacheConfirm'),
      [
        { text: t('cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('ok') || 'OK',
          style: 'destructive',
          onPress: async () => {
            await clearAudioCache();
            setCacheSizeMB(0);
            setPreloadDone(false);
            setPreloadProgress(null);
          },
        },
      ]
    );
  };

  const estimatedSize = estimateDownloadSizeMB(selectedReciters, downloadRuqyah);

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
          <Text style={styles.headerTitle}>{tt('downloadSettings')}</Text>
          <View style={{ width: 28 }} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Auto-download toggle */}
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          <View style={styles.cardRow}>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: c.text }]}>{tt('autoDownload')}</Text>
              <Text style={[styles.cardDesc, { color: c.textSecondary }]}>{tt('autoDownloadDesc')}</Text>
            </View>
            <Switch
              value={autoDownload}
              onValueChange={toggleAutoDownload}
              trackColor={{ false: '#767577', true: '#0d9488' }}
              thumbColor={autoDownload ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* WiFi-only toggle */}
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          <View style={styles.cardRow}>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: c.text }]}>{tt('wifiOnly')}</Text>
              <Text style={[styles.cardDesc, { color: c.textSecondary }]}>{tt('wifiOnlyDesc')}</Text>
            </View>
            <Switch
              value={wifiOnly}
              onValueChange={toggleWifiOnly}
              trackColor={{ false: '#767577', true: '#0d9488' }}
              thumbColor={wifiOnly ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Reciter selection */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>{tt('selectReciters')}</Text>
        <Text style={[styles.sectionDesc, { color: c.textSecondary }]}>{tt('selectRecitersDesc')}</Text>

        {ALL_RECITERS.map((reciter) => {
          const isSelected = selectedReciters.includes(reciter.id);
          return (
            <TouchableOpacity
              key={reciter.id}
              onPress={() => toggleReciter(reciter.id)}
              style={[
                styles.reciterItem,
                {
                  backgroundColor: isSelected ? c.ayahBg : c.surface,
                  borderColor: isSelected ? '#0d9488' : c.border,
                },
              ]}
            >
              <View style={[styles.checkbox, { borderColor: isSelected ? '#0d9488' : c.textSecondary, backgroundColor: isSelected ? '#0d9488' : 'transparent' }]}>
                {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <View style={styles.reciterInfo}>
                <Text style={[styles.reciterName, { color: c.text }]}>
                  {isArabic ? reciter.ar : reciter.name}
                </Text>
                <Text style={[styles.reciterSub, { color: c.textSecondary }]}>
                  114 {isArabic ? 'سورة' : 'surahs'} · ~171 {tt('mb')}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Ruqyah toggle */}
        <View style={[styles.card, { backgroundColor: c.surface, marginTop: 16 }]}>
          <View style={styles.cardRow}>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: c.text }]}>{tt('ruqyahAudio')}</Text>
              <Text style={[styles.cardDesc, { color: c.textSecondary }]}>{tt('ruqyahAudioDesc')}</Text>
            </View>
            <Switch
              value={downloadRuqyah}
              onValueChange={toggleRuqyah}
              trackColor={{ false: '#767577', true: '#0d9488' }}
              thumbColor={downloadRuqyah ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Estimated size */}
        <View style={[styles.sizeCard, { backgroundColor: c.surface }]}>
          <Ionicons name="cloud-download" size={24} color="#0d9488" />
          <Text style={[styles.sizeText, { color: c.text }]}>
            {tt('estimatedSize')}: <Text style={styles.sizeBold}>{estimatedSize} {tt('mb')}</Text>
          </Text>
        </View>

        {/* Download progress */}
        {(isDownloading || preloadProgress) && !preloadDone && (
          <View style={[styles.progressContainer, { backgroundColor: c.surface }]}>
            <Text style={[styles.progressTitle, { color: c.text }]}>
              {isDownloading ? tt('downloading') : `${preloadProgress?.downloaded || 0}/${preloadProgress?.total || 0} ${tt('filesDownloaded')}`}
            </Text>
            <View style={[styles.progressBar, { backgroundColor: c.surfaceAlt }]}>
              <LinearGradient
                colors={['#0d9488', '#14b8a6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${preloadProgress?.percentage || 0}%` }]}
              />
            </View>
            <Text style={[styles.progressPct, { color: c.textSecondary }]}>{preloadProgress?.percentage || 0}%</Text>
          </View>
        )}

        {preloadDone && (
          <View style={[styles.doneCard, { backgroundColor: c.surface }]}>
            <Ionicons name="checkmark-circle" size={28} color="#10b981" />
            <Text style={[styles.doneText, { color: c.text }]}>{tt('downloadComplete')}</Text>
          </View>
        )}

        {/* Start/Stop download button */}
        {!isDownloading ? (
          <TouchableOpacity onPress={handleStartDownload} activeOpacity={0.8} style={styles.downloadBtn}>
            <LinearGradient colors={['#0d9488', '#14b8a6']} style={styles.gradientBtn}>
              <Ionicons name="download" size={22} color="#fff" />
              <Text style={styles.btnText}>{tt('startDownload')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleStopDownload} activeOpacity={0.8} style={styles.stopBtn}>
            <View style={[styles.gradientBtn, { backgroundColor: '#ef4444' }]}>
              <Ionicons name="stop" size={22} color="#fff" />
              <Text style={styles.btnText}>{tt('stopDownload')}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Cache info + clear */}
        {cacheSizeMB > 0 && (
          <View style={[styles.cacheInfo, { backgroundColor: c.surface }]}>
            <Text style={[styles.cacheText, { color: c.textSecondary }]}>
              {tt('cacheSize')}: {cacheSizeMB} {tt('mb')}
            </Text>
            <TouchableOpacity onPress={handleClearCache}>
              <Text style={styles.clearBtn}>{tt('clearCache')}</Text>
            </TouchableOpacity>
          </View>
        )}
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
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardText: { flex: 1, marginRight: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600' },
  cardDesc: { fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 4 },
  sectionDesc: { fontSize: 12, marginBottom: 12 },
  reciterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1.5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  reciterInfo: { flex: 1 },
  reciterName: { fontSize: 14, fontWeight: '600' },
  reciterSub: { fontSize: 11, marginTop: 3 },
  sizeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  sizeText: { fontSize: 14 },
  sizeBold: { fontWeight: '700', color: '#0d9488' },
  progressContainer: {
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
  },
  progressTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPct: { fontSize: 12, textAlign: 'center', marginTop: 6 },
  doneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
  },
  doneText: { fontSize: 14, fontWeight: '600', color: '#10b981' },
  downloadBtn: {
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  stopBtn: {
    marginTop: 20,
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cacheInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  cacheText: { fontSize: 13 },
  clearBtn: { fontSize: 13, color: '#ef4444', fontWeight: '600' },
});

export default AudioDownloadSettingsScreen;
