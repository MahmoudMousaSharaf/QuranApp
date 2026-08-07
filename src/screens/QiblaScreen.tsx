import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUITranslation } from '../hooks/useUITranslation';
import {
  getQiblaBearing,
  getMagneticDeclination,
  getDistanceKm,
  getCardinalDirection,
} from '../utils/qiblaCalc';

interface QiblaScreenProps {
  onBack: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const COMPASS_SIZE = Math.min(screenWidth - 60, 340);

const QiblaScreen: React.FC<QiblaScreenProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const { t, appLanguage } = useLanguage();
  const c = colors[theme];
  const isArabicUI = appLanguage === 'ar';
  const { ui, translateUI, needsTranslation } = useUITranslation(appLanguage);

  // Translate all hardcoded UI strings for non-AR/non-EN languages
  useEffect(() => {
    if (!needsTranslation) return;
    translateUI([
      'Facing Qibla',
      'Almost there! Turn left slightly',
      'Almost there! Turn right slightly',
      'Turn left',
      'Turn right',
      "Hold your phone flat with the top pointing forward. Rotate your body slowly until the Kaaba icon reaches the top and turns green.",
      "1. Open your phone's compass app",
      '2. Face North (N)',
      '3. Turn clockwise',
      '4. You are now facing Qibla',
      'Qibla direction is calculated using Vincenty formula on WGS84 ellipsoid from your GPS location. Compass works offline.',
      'Magnetic declination:',
      'Please allow location access to determine Qibla direction',
      'Retry',
    ]);
  }, [appLanguage, needsTranslation]);

  const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState<string>('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [heading, setHeading] = useState<number>(0);
  const [sensorAvailable, setSensorAvailable] = useState<boolean>(true);
  const [sensorActive, setSensorActive] = useState<boolean>(false);
  const [magneticDeclination, setMagneticDeclination] = useState<number>(0);
  const [needsCalibration, setNeedsCalibration] = useState<boolean>(false);
  const [usingLocationHeading, setUsingLocationHeading] = useState<boolean>(false);
  const subscriptionRef = useRef<any>(null);
  const locationHeadingRef = useRef<any>(null);
  const headingHistoryRef = useRef<number[]>([]);
  const declinationRef = useRef<number>(0);

  useEffect(() => {
    initQibla();
    return () => {
      stopCompass();
      stopLocationHeading();
    };
  }, []);

  const stopLocationHeading = () => {
    if (locationHeadingRef.current) {
      locationHeadingRef.current.remove();
      locationHeadingRef.current = null;
    }
  };

  const startLocationHeading = async () => {
    try {
      const hasHeading = await Location.hasServicesEnabledAsync();
      if (!hasHeading) return false;

      locationHeadingRef.current = await Location.watchHeadingAsync((headingData) => {
        if (headingData.trueHeading >= 0) {
          setUsingLocationHeading(true);
          applyHeading(headingData.trueHeading);
        } else if (headingData.magHeading >= 0) {
          const trueH = (headingData.magHeading + declinationRef.current + 360) % 360;
          applyHeading(trueH);
        }
      });
      return true;
    } catch {
      return false;
    }
  };

  const applyHeading = (rawHeading: number) => {
    const history = headingHistoryRef.current;
    history.push(rawHeading);
    if (history.length > 5) history.shift();

    const sorted = [...history].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    setHeading((prev) => {
      let diff = median - prev;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;
      return (prev + diff * 0.3 + 360) % 360;
    });
  };

  const startCompass = async () => {
    const locationHeadingStarted = await startLocationHeading();
    if (locationHeadingStarted) {
      setSensorAvailable(true);
      setSensorActive(true);
      return;
    }

    try {
      const available = await Magnetometer.isAvailableAsync();
      if (!available) {
        setSensorAvailable(false);
        return;
      }
      setSensorAvailable(true);
      Magnetometer.setUpdateInterval(50);
      subscriptionRef.current = Magnetometer.addListener(
        (data: { x: number; y: number; z: number }) => {
          let angle = Math.atan2(data.x, data.y) * (180 / Math.PI);
          angle = (angle + 360) % 360;

          const trueHeading = (angle + declinationRef.current + 360) % 360;

          const horizontalMag = Math.sqrt(data.x * data.x + data.y * data.y);
          const totalMag = Math.sqrt(
            horizontalMag * horizontalMag + data.z * data.z
          );
          if (totalMag > 0 && horizontalMag / totalMag < 0.5) {
            setNeedsCalibration(true);
          } else {
            setNeedsCalibration(false);
          }

          applyHeading(trueHeading);
        }
      );
      setSensorActive(true);
    } catch {
      setSensorAvailable(false);
    }
  };

  const stopCompass = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setSensorActive(false);
  };

  const fetchDeclinationFromAPI = async (lat: number, lng: number): Promise<number | null> => {
    try {
      const cacheKey = `@mag_declination_${lat.toFixed(0)}_${lng.toFixed(0)}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached !== null) {
        return parseFloat(cached);
      }

      const url = `https://www.ngdc.noaa.gov/geomag-web/calculators/calculateIgrf?lat1=${lat}&lon1=${lng}&model=IGRF&startYear=2025&endYear=2025&resultFormat=json`;
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) return null;
      const data = await response.json();

      if (data && data.result && data.result.length > 0) {
        const declination = data.result[0].declination;
        if (typeof declination === 'number') {
          await AsyncStorage.setItem(cacheKey, declination.toString());
          return declination;
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const initQibla = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          isArabicUI ? 'إذن الموقع مطلوب' : t('locationPermissionTitle'),
          isArabicUI
            ? 'يرجى السماح بالوصول إلى الموقع لتحديد اتجاه القبلة'
            : ui('Please allow location access to determine Qibla direction')
        );
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Platform.OS === 'ios' ? Location.Accuracy.Balanced : Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;
      setCoords({ lat: latitude, lng: longitude });

      // Use fast local calculation first, then try API in background
      let declination = getMagneticDeclination(latitude, longitude);
      setMagneticDeclination(declination);
      declinationRef.current = declination;

      const bearing = getQiblaBearing(latitude, longitude);
      setQiblaBearing(bearing);

      const dist = getDistanceKm(latitude, longitude, 21.4225, 39.8262);
      setDistance(dist);

      setLoading(false);
      startCompass();

      // Fetch more accurate declination from API in background (non-blocking)
      fetchDeclinationFromAPI(latitude, longitude).then((apiDecl) => {
        if (apiDecl !== null) {
          setMagneticDeclination(apiDecl);
          declinationRef.current = apiDecl;
        }
      }).catch(() => {});
      // Reverse geocode in background (non-blocking)
      Location.reverseGeocodeAsync({ latitude, longitude }).then((reverseGeo) => {
        if (reverseGeo.length > 0) {
          const place = reverseGeo[0];
          setLocationName(`${place.city || place.region || ''}, ${place.country || ''}`);
        }
      }).catch(() => {});
    } catch (error) {
      console.error('Qibla error:', error);
      setLoading(false);
    }
  }, [isArabicUI, t]);

  const relativeAngle =
    qiblaBearing !== null ? (qiblaBearing - heading + 360) % 360 : 0;
  const isAligned = relativeAngle < 4 || relativeAngle > 356;
  const isNearAligned = relativeAngle < 15 || relativeAngle > 345;
  const accentColor = isAligned ? '#4CAF50' : isNearAligned ? '#FF9800' : c.primary;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={c.headerBg} />
      <View style={[styles.header, { backgroundColor: c.headerBg }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isArabicUI ? 'اتجاه القبلة' : ui(t('qibla'))}
        </Text>
        <TouchableOpacity onPress={initQibla} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: c.textSecondary }]}>
              {isArabicUI ? 'جاري تحديد اتجاه القبلة...' : ui(t('determiningQibla'))}
            </Text>
          </View>
        ) : qiblaBearing !== null ? (
          <>
            {locationName ? (
              <View style={[styles.locationBox, { backgroundColor: c.surface }]}>
                <Ionicons name="location-outline" size={16} color={c.primary} />
                <Text style={[styles.locationText, { color: c.text }]}>
                  {locationName}
                </Text>
              </View>
            ) : null}

            {/* Compass */}
            <View style={styles.compassWrapper}>
              {/* Fixed top pointer */}
              <View style={styles.topPointer}>
                <View
                  style={[
                    styles.topPointerTriangle,
                    { borderTopColor: accentColor },
                  ]}
                />
              </View>

              {/* Rotating compass dial */}
              <View
                style={[
                  styles.compass,
                  {
                    borderColor: accentColor,
                    transform: [{ rotate: `${-heading}deg` }],
                  },
                ]}
              >
                {/* Inner decorative ring */}
                <View
                  style={[
                    styles.innerRing,
                    { borderColor: accentColor + '30' },
                  ]}
                />

                {/* Cardinal direction labels */}
                <Text style={[styles.cardinalLabel, styles.cardinalN, { color: accentColor }]}>N</Text>
                <Text style={[styles.cardinalLabel, styles.cardinalS, { color: c.textSecondary }]}>S</Text>
                <Text style={[styles.cardinalLabel, styles.cardinalE, { color: c.textSecondary }]}>E</Text>
                <Text style={[styles.cardinalLabel, styles.cardinalW, { color: c.textSecondary }]}>W</Text>

                {/* Degree tick marks every 30° */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
                  (angle) => (
                    <View
                      key={angle}
                      style={{
                        position: 'absolute',
                        width: angle % 90 === 0 ? 3 : 2,
                        height: angle % 90 === 0 ? 14 : 8,
                        backgroundColor:
                          angle % 90 === 0 ? accentColor : c.textSecondary + '50',
                        top: 2,
                        left: '50%',
                        marginLeft: angle % 90 === 0 ? -1.5 : -1,
                        transform: [
                          { rotate: `${angle}deg` },
                          { translateY: COMPASS_SIZE / 2 - 8 },
                        ],
                      }}
                    />
                  )
                )}

                {/* Qibla direction indicator (Kaaba icon at Qibla bearing) */}
                <View
                  style={[
                    styles.qiblaIndicator,
                    { transform: [{ rotate: `${qiblaBearing}deg` }] },
                  ]}
                >
                  <View
                    style={[
                      styles.kaabaBox,
                      {
                        backgroundColor: accentColor,
                        shadowColor: accentColor,
                        shadowOpacity: isAligned ? 0.6 : 0.3,
                      },
                    ]}
                  >
                    <Ionicons name="home" size={24} color="#fff" />
                  </View>
                </View>

                {/* Center dot */}
                <View style={[styles.centerDot, { backgroundColor: accentColor }]}>
                  <View style={styles.centerInner} />
                </View>
              </View>

              {/* Alignment status text below compass */}
              {sensorActive && (
                <View style={styles.alignmentStatus}>
                  {isAligned ? (
                    <View style={[styles.alignedBadge, { backgroundColor: '#4CAF50' }]}>
                      <Ionicons name="checkmark-circle" size={18} color="#fff" />
                      <Text style={styles.alignedBadgeText}>
                        {isArabicUI ? 'أنت تواجه القبلة' : ui('Facing Qibla')}
                      </Text>
                    </View>
                  ) : isNearAligned ? (
                    <Text style={[styles.statusText, { color: '#FF9800' }]}>
                      {isArabicUI
                        ? `اقترب! استدر ${relativeAngle < 180 ? 'يسار' : 'يمين'} قليلاً`
                        : ui(`Almost there! Turn ${relativeAngle < 180 ? 'left' : 'right'} slightly`)}
                    </Text>
                  ) : (
                    <Text style={[styles.statusText, { color: c.textSecondary }]}>
                      {isArabicUI
                        ? `استدر ${relativeAngle < 180 ? 'يسار' : 'يمين'}`
                        : ui(`Turn ${relativeAngle < 180 ? 'left' : 'right'}`)}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Calibration warning */}
            {needsCalibration && sensorActive && !usingLocationHeading && (
              <View style={[styles.warningBox, { backgroundColor: c.ayahBg, borderLeftColor: '#FF9800' }]}>
                <Ionicons name="phone-portrait-outline" size={16} color="#FF9800" />
                <Text style={[styles.warningText, { color: c.textSecondary }]}>
                  {isArabicUI ? 'حرّك الهاتف في حركة 8 لمعايرة البوصلة' : ui(t('calibrateCompass'))}
                </Text>
              </View>
            )}

            {/* No sensor available */}
            {!sensorAvailable && (
              <View style={[styles.warningBox, { backgroundColor: c.ayahBg, borderLeftColor: '#FF9800' }]}>
                <Ionicons name="warning-outline" size={16} color="#FF9800" />
                <Text style={[styles.warningText, { color: c.textSecondary }]}>
                  {isArabicUI ? 'البوصلة غير متاحة. استخدم زاوية القبلة أدناه مع بوصلة الهاتف.' : ui(t('compassNotAvailable'))}
                </Text>
              </View>
            )}

            {/* Info cards */}
            <View style={styles.infoSection}>
              <View style={[styles.infoCard, { backgroundColor: c.surface }]}>
                <View style={styles.infoCardHeader}>
                  <Ionicons name="navigate" size={18} color={c.primary} />
                  <Text style={[styles.infoCardLabel, { color: c.textSecondary }]}>
                    {isArabicUI ? 'زاوية القبلة من الشمال' : ui(t('qiblaAngleFromNorth'))}
                  </Text>
                </View>
                <Text style={[styles.infoCardValue, { color: c.primary }]}>
                  {qiblaBearing.toFixed(1)}° {getCardinalDirection(qiblaBearing)}
                </Text>
              </View>

              {sensorAvailable && sensorActive && (
                <View style={[styles.infoCard, { backgroundColor: c.surface }]}>
                  <View style={styles.infoCardHeader}>
                    <Ionicons name="compass-outline" size={18} color={c.primary} />
                    <Text style={[styles.infoCardLabel, { color: c.textSecondary }]}>
                      {isArabicUI ? 'اتجاهك الحالي' : ui(t('yourHeading'))}
                    </Text>
                  </View>
                  <Text style={[styles.infoCardValue, { color: c.text }]}>
                    {Math.round(heading)}° {getCardinalDirection(heading)}
                  </Text>
                </View>
              )}

              {distance !== null && (
                <View style={[styles.infoCard, { backgroundColor: c.surface }]}>
                  <View style={styles.infoCardHeader}>
                    <Ionicons name="airplane-outline" size={18} color={c.primary} />
                    <Text style={[styles.infoCardLabel, { color: c.textSecondary }]}>
                      {isArabicUI ? 'المسافة إلى الكعبة' : ui(t('distanceToKaaba'))}
                    </Text>
                  </View>
                  <Text style={[styles.infoCardValue, { color: c.text }]}>
                    {distance.toLocaleString()} {t('km')}
                  </Text>
                </View>
              )}

              {Math.abs(magneticDeclination) > 0.5 && !usingLocationHeading && (
                <Text style={[styles.declinationNote, { color: c.textSecondary }]}>
                  {isArabicUI
                    ? `الانحراف المغناطيسي: ${magneticDeclination > 0 ? '+' : ''}${magneticDeclination.toFixed(1)}°`
                    : ui(`Magnetic declination: ${magneticDeclination > 0 ? '+' : ''}${magneticDeclination.toFixed(1)}°`)}
                </Text>
              )}

              {coords && (
                <Text style={[styles.gpsText, { color: c.textSecondary }]}>
                  GPS: {coords.lat.toFixed(4)}°, {coords.lng.toFixed(4)}°
                </Text>
              )}

              {/* Instructions */}
              <View style={[styles.instructionsCard, { backgroundColor: c.ayahBg, borderLeftColor: c.primary }]}>
                <Text style={[styles.instructionsTitle, { color: c.primary }]}>
                  {isArabicUI ? 'كيفية الاستخدام' : ui(t('howToUse'))}
                </Text>
                {sensorActive ? (
                  <Text style={[styles.instructionsText, { color: c.textSecondary }]}>
                    {isArabicUI
                      ? 'أمسك الهاتف مسطحاً ووجّه أعلى الهاتف للأمام. أدر جسمك ببطء حتى يصبح أيقونة الكعبة في الأعلى وتتحول إلى اللون الأخضر.'
                      : ui('Hold your phone flat with the top pointing forward. Rotate your body slowly until the Kaaba icon reaches the top and turns green.')}
                  </Text>
                ) : (
                  <Text style={[styles.instructionsText, { color: c.textSecondary }]}>
                    {isArabicUI
                      ? `١. افتح بوصلة الهاتف\n٢. وجّه الهاتف نحو الشمال (N)\n٣. استدر ${Math.round(qiblaBearing)}° باتجاه عقارب الساعة\n٤. أنت الآن تواجه القبلة`
                      : ui(`1. Open your phone's compass app\n2. Face North (N)\n3. Turn ${Math.round(qiblaBearing)}° clockwise\n4. You are now facing Qibla`)}
                  </Text>
                )}
              </View>

              <Text style={[styles.noteText, { color: c.textSecondary }]}>
                {isArabicUI
                  ? 'يتم حساب اتجاه القبلة بدقة باستخدام موقعك عبر GPS وصيغة فنسنتي على نموذج WGS84. البوصلة تعمل بدون إنترنت.'
                  : ui('Qibla direction is calculated using Vincenty formula on WGS84 ellipsoid from your GPS location. Compass works offline.')}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: c.textSecondary }]}>
              {isArabicUI ? 'تعذر تحديد الموقع. يرجى المحاولة مرة أخرى.' : ui(t('couldNotDetermineLocation'))}
            </Text>
            <TouchableOpacity onPress={initQibla} style={[styles.retryBtn, { backgroundColor: c.primary }]}>
              <Text style={styles.retryBtnText}>
                {isArabicUI ? 'إعادة المحاولة' : ui('Retry')}
              </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 12,
    paddingBottom: 14,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#fff' },
  refreshBtn: { padding: 4 },
  content: { padding: 16, paddingBottom: 40, alignItems: 'center' },
  loadingContainer: { alignItems: 'center', paddingTop: 80 },
  loadingText: { fontSize: 15, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  retryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  locationText: { fontSize: 13, fontWeight: '600' },
  compassWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    position: 'relative',
  },
  topPointer: {
    position: 'absolute',
    top: -2,
    zIndex: 10,
    alignItems: 'center',
  },
  topPointerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  compass: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  innerRing: {
    position: 'absolute',
    width: COMPASS_SIZE - 40,
    height: COMPASS_SIZE - 40,
    borderRadius: (COMPASS_SIZE - 40) / 2,
    borderWidth: 1,
  },
  cardinalLabel: {
    position: 'absolute',
    fontSize: 13,
    fontWeight: '800',
  },
  cardinalN: { top: 6 },
  cardinalS: { bottom: 6 },
  cardinalE: { right: 6 },
  cardinalW: { left: 6 },
  qiblaIndicator: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
  },
  kaabaBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 8,
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  alignmentStatus: {
    marginTop: 16,
    alignItems: 'center',
    minHeight: 36,
    justifyContent: 'center',
  },
  alignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
  },
  alignedBadgeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statusText: { fontSize: 15, fontWeight: '600' },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderLeftWidth: 4,
    marginBottom: 12,
    gap: 8,
    width: '100%',
  },
  warningText: { fontSize: 12, flex: 1, lineHeight: 18 },
  infoSection: {
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
    width: '100%',
  },
  infoCard: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  infoCardLabel: { fontSize: 12 },
  infoCardValue: { fontSize: 24, fontWeight: 'bold' },
  declinationNote: { fontSize: 11, marginTop: 4, marginBottom: 8 },
  gpsText: { fontSize: 11, marginBottom: 16 },
  instructionsCard: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 16,
    width: '100%',
  },
  instructionsTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  instructionsText: { fontSize: 13, lineHeight: 22 },
  noteText: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
});

export default QiblaScreen;
