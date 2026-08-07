import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getPrayerNames, getHijriMonthName, getHijriSuffix } from '../services/contentTranslations';
import { useUITranslation } from '../hooks/useUITranslation';
import {
  initPrayerAlarms,
  getAlarmSettings,
  setPrayerAlarmEnabled,
  enableAllPrayerAlarms,
  disableAllPrayerAlarms,
  rescheduleAllAlarms,
  playAdhanSound,
  stopAdhanSound,
  isAdhanPlaying,
  setOnPlaybackStatusUpdate,
  cacheLocation,
  getCachedLocation,
  CachedLocation,
  PrayerAlarmSettings,
} from '../services/prayerAlarm';

interface PrayerTimesScreenProps {
  onBack: () => void;
}

interface PrayerTime {
  key: keyof PrayerAlarmSettings;
  name_ar: string;
  name_en: string;
  icon: string;
  time: string | null;
  date: Date | null;
}

const PrayerTimesScreen: React.FC<PrayerTimesScreenProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const { t, appLanguage } = useLanguage();
  const c = colors[theme];
  const isArabicUI = appLanguage === 'ar';
  const { ui, translateUI, needsTranslation } = useUITranslation(appLanguage);

  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [locationName, setLocationName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [hijriDate, setHijriDate] = useState<string>('');
  const [alarmSettings, setAlarmSettings] = useState<PrayerAlarmSettings>({
    fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false,
  });
  const [isDetecting, setIsDetecting] = useState(false);
  const [adhanPlaying, setAdhanPlaying] = useState(false);

  useEffect(() => {
    if (!needsTranslation) return;
    translateUI([
      'Alarm for your prayers',
      'Prayer times are calculated accurately for every country based on your location. Calculation methods may vary slightly. Enable the alarm for each prayer you want to be notified about. If not enabled, no sound will be played.',
      'Enable All Alarms',
      'Disable All Alarms',
      'Detect Location',
      'Test Adhan',
      'Test Fajr Adhan',
      'Stop',
      'Stop Azan',
    ]);
  }, [appLanguage, needsTranslation]);

  useEffect(() => {
    initPrayerAlarms();
    loadAlarmSettings();
    loadPrayerTimes();
    setAdhanPlaying(isAdhanPlaying());

    setOnPlaybackStatusUpdate((status: any) => {
      if (status.didJustFinish || (status.isLoaded === false)) {
        setAdhanPlaying(false);
      } else if (status.isPlaying) {
        setAdhanPlaying(true);
      }
    });

    return () => {
      setOnPlaybackStatusUpdate(null);
    };
  }, []);

  const loadAlarmSettings = async () => {
    const settings = await getAlarmSettings();
    setAlarmSettings(settings);
  };

  const loadPrayerTimes = async () => {
    const cached = await getCachedLocation();
    if (cached) {
      setLocationName(`${cached.city}, ${cached.country}`);
      calculatePrayerTimes(cached.latitude, cached.longitude);
    } else {
      await detectLocation();
    }
  };

  const detectLocation = async () => {
    setIsDetecting(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          isArabicUI ? 'إذن الموقع مطلوب' : t('locationPermissionTitle'),
          isArabicUI
            ? 'يرجى السماح بالوصول إلى الموقع لحساب أوقات الصلاة'
            : t('locationPermissionMsg')
        );
        setLoading(false);
        setIsDetecting(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const reverseGeo = await Location.reverseGeocodeAsync({ latitude, longitude });
      let city = '';
      let country = '';
      if (reverseGeo.length > 0) {
        const place = reverseGeo[0];
        city = place.city || place.region || '';
        country = place.country || '';
        setLocationName(`${city}, ${country}`);
      }

      const cachedLoc: CachedLocation = {
        latitude,
        longitude,
        city,
        country,
        timestamp: Date.now(),
      };
      await cacheLocation(cachedLoc);

      calculatePrayerTimes(latitude, longitude);
    } catch (error) {
      console.error('Location error:', error);
      setLoading(false);
    }
    setIsDetecting(false);
  };

  const calculatePrayerTimes = (lat: number, lng: number) => {
    try {
      const adhan = require('adhan');
      const date = new Date();
      const coordinates = new adhan.Coordinates(lat, lng);

      let params;
      if (lat > 23 && lat < 32 && lng > 35 && lng < 52) {
        params = adhan.CalculationMethod.UmmAlQura();
      } else if (lat > 22 && lat < 27 && lng > 50 && lng < 57) {
        params = adhan.CalculationMethod.Dubai();
      } else if (lat > 24 && lat < 27 && lng > 50 && lng < 52) {
        params = adhan.CalculationMethod.Qatar();
      } else if (lat > 25 && lat < 40 && lng > 44 && lng < 64) {
        params = adhan.CalculationMethod.Tehran();
      } else if (lat > 15 && lat < 40 && lng > 60 && lng < 100) {
        params = adhan.CalculationMethod.Karachi();
      } else if (lat > 20 && lat < 32 && lng > 25 && lng < 35) {
        params = adhan.CalculationMethod.Egyptian();
      } else if (lat > 24 && lat < 70 && lng > -170 && lng < -50) {
        params = adhan.CalculationMethod.NorthAmerica();
      } else {
        params = adhan.CalculationMethod.MuslimWorldLeague();
      }

      const prayerTimesData = new adhan.PrayerTimes(coordinates, date, params);

      const formatTime = (d: Date | null) => {
        if (!d) return null;
        let h = d.getHours();
        const m = d.getMinutes().toString().padStart(2, '0');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${m} ${ampm}`;
      };

      const prayerNames = getPrayerNames(appLanguage);
      const times: PrayerTime[] = [
        { key: 'fajr', name_ar: prayerNames.fajr, name_en: prayerNames.fajr, icon: 'time-outline', time: formatTime(prayerTimesData.fajr), date: prayerTimesData.fajr },
        { key: 'dhuhr', name_ar: prayerNames.dhuhr, name_en: prayerNames.dhuhr, icon: 'sunny', time: formatTime(prayerTimesData.dhuhr), date: prayerTimesData.dhuhr },
        { key: 'asr', name_ar: prayerNames.asr, name_en: prayerNames.asr, icon: 'cloudy-outline', time: formatTime(prayerTimesData.asr), date: prayerTimesData.asr },
        { key: 'maghrib', name_ar: prayerNames.maghrib, name_en: prayerNames.maghrib, icon: 'moon-outline', time: formatTime(prayerTimesData.maghrib), date: prayerTimesData.maghrib },
        { key: 'isha', name_ar: prayerNames.isha, name_en: prayerNames.isha, icon: 'moon', time: formatTime(prayerTimesData.isha), date: prayerTimesData.isha },
      ];

      setPrayerTimes(times);

      const gy = date.getFullYear();
      const gm = date.getMonth() + 1;
      const gd = date.getDate();
      const jd = Math.floor((11 * gy + 3) / 30) + 354 * gy + 30 * gm - Math.floor((gm - 1) / 2) + gd + 1948345 - 1;
      const l = jd - 1948440 + 10632;
      const n = Math.floor((l - 1) / 10631);
      const l2 = l - 10631 * n + 354;
      const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) + Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
      const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
      const hm = Math.floor((24 * l3) / 709);
      const hd = l3 - Math.floor((709 * hm) / 24);

      const monthIdx = Math.max(0, Math.min(11, hm - 1));
      setHijriDate(
        `${hd} ${getHijriMonthName(appLanguage, monthIdx)} ${1391 + n} ${getHijriSuffix(appLanguage)}`
      );

      setLoading(false);

      const prayerDates = {
        fajr: prayerTimesData.fajr,
        dhuhr: prayerTimesData.dhuhr,
        asr: prayerTimesData.asr,
        maghrib: prayerTimesData.maghrib,
        isha: prayerTimesData.isha,
      };
      rescheduleAllAlarms(prayerDates, appLanguage);
    } catch (error) {
      console.error('Prayer calculation error:', error);
      setLoading(false);
    }
  };

  const handleToggleAlarm = async (prayer: keyof PrayerAlarmSettings) => {
    const prayerTime = prayerTimes.find(p => p.key === prayer);
    const newEnabled = !alarmSettings[prayer];
    const settings = await setPrayerAlarmEnabled(prayer, newEnabled, prayerTime?.date || null, appLanguage);
    setAlarmSettings(settings);
  };

  const handleEnableAll = async () => {
    const prayerDates: Record<string, Date | null> = {};
    prayerTimes.forEach(p => { prayerDates[p.key] = p.date; });
    const settings = await enableAllPrayerAlarms(prayerDates as any, appLanguage);
    setAlarmSettings(settings);
  };

  const handleDisableAll = async () => {
    const settings = await disableAllPrayerAlarms();
    setAlarmSettings(settings);
  };

  const handleTestAdhan = async (isFajr?: boolean) => {
    if (adhanPlaying) {
      setAdhanPlaying(false);
      await stopAdhanSound();
    } else {
      setAdhanPlaying(true);
      try {
        await playAdhanSound(isFajr ? 'fajr' : undefined);
      } catch {
        setAdhanPlaying(false);
      }
    }
  };

  const allEnabled = alarmSettings.fajr && alarmSettings.dhuhr && alarmSettings.asr && alarmSettings.maghrib && alarmSettings.isha;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={c.headerBg} />
      <View style={[styles.header, { backgroundColor: c.headerBg }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isArabicUI ? 'أوقات الصلاة' : ui(t('prayerTimes'))}
        </Text>
        <TouchableOpacity onPress={detectLocation} style={styles.refreshBtn} disabled={isDetecting}>
          <Ionicons name={isDetecting ? 'sync-circle' : 'locate'} size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: c.textSecondary }]}>
              {isArabicUI ? 'جارٍ حساب أوقات الصلاة...' : ui(t('calculatingPrayer'))}
            </Text>
          </View>
        ) : (
          <>
            {locationName ? (
              <View style={[styles.locationBox, { backgroundColor: c.surface }]}>
                <Ionicons name="location-outline" size={20} color={c.primary} />
                <Text style={[styles.locationText, { color: c.text }]}>{locationName}</Text>
                <TouchableOpacity
                  onPress={detectLocation}
                  disabled={isDetecting}
                  style={[styles.detectBtn, { backgroundColor: c.ayahBg }]}
                >
                  <Ionicons name="locate" size={16} color={c.primary} />
                  <Text style={[styles.detectBtnText, { color: c.primary }]}>
                    {isArabicUI ? 'تحديد الموقع' : ui('Detect Location')}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {hijriDate ? (
              <View style={[styles.hijriBox, { backgroundColor: c.ayahBg, borderLeftColor: c.primary }]}>
                <Ionicons name="calendar-outline" size={18} color={c.primary} />
                <Text style={[styles.hijriText, { color: c.text }]}>{hijriDate}</Text>
              </View>
            ) : null}

            <View style={[styles.alarmSection, { backgroundColor: c.surface }]}>
              <View style={styles.alarmSectionHeader}>
                <Ionicons name="notifications-outline" size={20} color={c.primary} />
                <Text style={[styles.alarmSectionTitle, { color: c.text }]}>
                  {isArabicUI ? 'منبه للصلوات' : ui('Alarm for your prayers')}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.enableAllBtn,
                  { backgroundColor: allEnabled ? '#ef4444' : c.primary }
                ]}
                onPress={allEnabled ? handleDisableAll : handleEnableAll}
              >
                <Ionicons
                  name={allEnabled ? 'notifications-off-outline' : 'notifications-outline'}
                  size={18}
                  color="#fff"
                />
                <Text style={styles.enableAllBtnText}>
                  {allEnabled
                    ? (isArabicUI ? 'تعطيل كل المنبهات' : ui('Disable All Alarms'))
                    : (isArabicUI ? 'تفعيل كل المنبهات' : ui('Enable All Alarms'))}
                </Text>
              </TouchableOpacity>

              <View style={styles.testAdhanRow}>
                <TouchableOpacity
                  style={[styles.testAdhanBtn, { borderColor: c.primary }]}
                  onPress={() => handleTestAdhan(false)}
                >
                  <Ionicons
                    name={adhanPlaying ? 'stop-circle-outline' : 'volume-high-outline'}
                    size={16}
                    color={c.primary}
                  />
                  <Text style={[styles.testAdhanBtnText, { color: c.primary }]}>
                    {adhanPlaying
                      ? (isArabicUI ? 'إيقاف' : ui('Stop'))
                      : (isArabicUI ? 'تجربة الأذان' : ui('Test Adhan'))}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.testAdhanBtn, { borderColor: c.primary, marginLeft: 8 }]}
                  onPress={() => handleTestAdhan(true)}
                >
                  <Ionicons
                    name={adhanPlaying ? 'stop-circle-outline' : 'sunny-outline'}
                    size={16}
                    color={c.primary}
                  />
                  <Text style={[styles.testAdhanBtnText, { color: c.primary }]}>
                    {adhanPlaying
                      ? (isArabicUI ? 'إيقاف' : ui('Stop'))
                      : (isArabicUI ? 'تجربة أذان الفجر' : ui('Test Fajr Adhan'))}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {prayerTimes.map((prayer) => (
              <View
                key={prayer.key}
                style={[styles.prayerItem, { backgroundColor: c.surface, borderBottomColor: c.border }]}
              >
                <View style={[styles.prayerIcon, { backgroundColor: c.ayahBg }]}>
                  <Ionicons name={prayer.icon as any} size={24} color={c.primary} />
                </View>
                <View style={styles.prayerInfo}>
                  <Text style={[styles.prayerName, { color: c.text }]}>
                    {prayer.name_en}
                  </Text>
                  <Text style={[styles.prayerTime, { color: c.primary }]}>
                    {prayer.time || '--:--'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.alarmToggle,
                    {
                      backgroundColor: alarmSettings[prayer.key] ? c.primary : c.ayahBg,
                      borderColor: alarmSettings[prayer.key] ? c.primary : c.border,
                    }
                  ]}
                  onPress={() => handleToggleAlarm(prayer.key)}
                >
                  <Ionicons
                    name={alarmSettings[prayer.key] ? 'notifications' : 'notifications-outline'}
                    size={20}
                    color={alarmSettings[prayer.key] ? '#fff' : c.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            ))}

            <View style={[styles.noteBox, { backgroundColor: c.ayahBg, borderLeftColor: c.primary }]}>
              <Text style={[styles.noteText, { color: c.textSecondary }]}>
                {isArabicUI
                  ? 'أوقات الصلاة تُحسب بدقة لكل دولة بناءً على موقعك. قد تختلف الحسابات قليلاً حسب طريقة الحساب المحلية. فعّل المنبه لكل صلاة تريد أن تُذكَّر بها. إذا لم يُفعّل المنبه، لن يُشغَّل أي صوت.'
                  : ui('Prayer times are calculated accurately for every country based on your location. Calculation methods may vary slightly. Enable the alarm for each prayer you want to be notified about. If not enabled, no sound will be played.')}
              </Text>
            </View>
          </>
        )}
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
  refreshBtn: { padding: 4 },
  content: { padding: 16, paddingBottom: 40 },
  loadingContainer: { alignItems: 'center', paddingTop: 60 },
  loadingText: { fontSize: 15 },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  locationText: { flex: 1, fontSize: 15, fontWeight: '600' },
  detectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  detectBtnText: { fontSize: 12, fontWeight: '600' },
  hijriBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    marginBottom: 16,
    gap: 8,
  },
  hijriText: { fontSize: 14, fontWeight: '600' },
  alarmSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  alarmSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alarmSectionTitle: { fontSize: 16, fontWeight: '700' },
  enableAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  enableAllBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  testAdhanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  testAdhanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
  },
  testAdhanBtnText: { fontSize: 13, fontWeight: '600' },
  prayerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  prayerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  prayerInfo: { flex: 1 },
  prayerName: { fontSize: 17, fontWeight: '600', marginBottom: 2 },
  prayerTime: { fontSize: 17, fontWeight: '700' },
  alarmToggle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  noteBox: {
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    marginTop: 16,
  },
  noteText: { fontSize: 13, lineHeight: 20 },
});

export default PrayerTimesScreen;
