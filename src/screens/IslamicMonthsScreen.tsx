import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import countriesData from '../data/countries.json';
import { gregorianToHijri, getUpcomingEvents, hijriMonths, hijriMonthsAr, islamicEvents } from '../utils/hijri';
import { HIJRI_MONTHS, getHijriMonthName, getHijriSuffix } from '../services/contentTranslations';
import { useUITranslation } from '../hooks/useUITranslation';
import { translateText } from '../services/contentTranslator';

interface IslamicMonthsScreenProps {
  onBack: () => void;
}

const IslamicMonthsScreen: React.FC<IslamicMonthsScreenProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const { t, appLanguage } = useLanguage();
  const c = colors[theme];
  const isArabicUI = appLanguage === 'ar';
  const { ui, translateUI, needsTranslation } = useUITranslation(appLanguage);

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'calendar' | 'events'>('calendar');
  const [translatedEvents, setTranslatedEvents] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!needsTranslation) return;
    let cancelled = false;
    (async () => {
      const map: Record<string, string> = {};
      for (const event of islamicEvents) {
        if (cancelled) return;
        const key = `${event.month}_${event.day}`;
        map[key] = await translateText(event.name_en, appLanguage);
      }
      if (!cancelled) setTranslatedEvents(map);
    })();
    return () => { cancelled = true; };
  }, [appLanguage, needsTranslation]);

  useEffect(() => {
    if (!needsTranslation) return;
    translateUI([
      'Note: The Hijri calendar is estimated. Dates may differ by one day depending on moon sighting in your country. Please verify with your local moon sighting announcement.',
    ]);
  }, [appLanguage, needsTranslation]);

  const today = new Date();
  const todayHijri = gregorianToHijri(today);
  const upcomingEvents = useMemo(() => getUpcomingEvents(today, 20), []);

  const filteredCountries = countriesData.countries.filter(country => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return country.name_en.toLowerCase().includes(q) || country.name_ar.includes(search);
  });

  const months = hijriMonths.map((name_en, idx) => ({
    number: idx + 1,
    name_en: getHijriMonthName(appLanguage, idx),
    name_ar: hijriMonthsAr[idx],
    events: islamicEvents.filter(e => e.month === idx + 1),
  }));

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={c.headerBg} />
      <View style={[styles.header, { backgroundColor: c.headerBg }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isArabicUI ? 'التقويم الإسلامي' : ui(t('islamicMonths'))}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Today's Hijri Date */}
      <View style={[styles.todayBox, { backgroundColor: c.headerBg }]}>
        <Ionicons name="calendar-outline" size={24} color="#fff" />
        <View style={styles.todayInfo}>
          <Text style={styles.todayLabel}>
            {isArabicUI ? 'اليوم' : ui(t('today'))}
          </Text>
          <Text style={styles.todayDate}>
            {todayHijri.day} {getHijriMonthName(appLanguage, todayHijri.month - 1)} {todayHijri.year} {getHijriSuffix(appLanguage)}
          </Text>
        </View>
      </View>

      {/* View Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'calendar' && { backgroundColor: c.primary }]}
          onPress={() => setViewMode('calendar')}
        >
          <Text style={[styles.toggleText, viewMode === 'calendar' && { color: '#fff' }]}>
            {isArabicUI ? 'الأشهر' : ui(t('monthsTab'))}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'events' && { backgroundColor: c.primary }]}
          onPress={() => setViewMode('events')}
        >
          <Text style={[styles.toggleText, viewMode === 'events' && { color: '#fff' }]}>
            {isArabicUI ? 'المناسبات القادمة' : ui(t('upcomingEventsTab'))}
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'calendar' ? (
        <FlatList
          data={months}
          keyExtractor={(item) => String(item.number)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={[styles.disclaimer, { backgroundColor: c.ayahBg, borderLeftColor: c.primary }]}>
              <Ionicons name="information-circle-outline" size={18} color={c.primary} />
              <Text style={[styles.disclaimerText, { color: c.textSecondary }]}>
                {isArabicUI
                  ? 'ملاحظة: التقويم الهجري تقديري. قد تختلف التواريخ بيوم واحد حسب رؤية الهلال في بلدك. يرجى التحقق من إعلان رؤية الهلال المحلي.'
                  : ui('Note: The Hijri calendar is estimated. Dates may differ by one day depending on moon sighting in your country. Please verify with your local moon sighting announcement.')}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.monthItem, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
              <View style={[styles.monthNumber, { backgroundColor: c.primary }]}>
                <Text style={styles.monthNumberText}>{item.number}</Text>
              </View>
              <View style={styles.monthInfo}>
                <View style={styles.monthNameRow}>
                  <Text style={[styles.monthEnglish, { color: c.text }]}>{item.name_en}</Text>
                </View>
                {item.events.length > 0 && (
                  <View style={styles.eventsList}>
                    {item.events.map((event, eidx) => (
                      <View key={eidx} style={[styles.eventTag, { backgroundColor: c.ayahBg }]}>
                        <Text style={[styles.eventDay, { color: c.primary }]}>{event.day}</Text>
                        <Text style={[styles.eventName, { color: c.textSecondary }]}>
                          {isArabicUI ? event.name_ar : (needsTranslation ? (translatedEvents[`${event.month}_${event.day}`] || event.name_en) : event.name_en)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={upcomingEvents}
          keyExtractor={(item, idx) => String(idx)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.eventItem, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
              <View style={[styles.eventDateBox, { backgroundColor: c.ayahBg }]}>
                <Ionicons name="calendar-outline" size={20} color={c.primary} />
              </View>
              <View style={styles.eventInfo}>
                <Text style={[styles.eventTitle, { color: c.text }]}>
                  {isArabicUI ? item.name_ar : (needsTranslation ? (translatedEvents[`${item.month}_${item.day}`] || item.name_en) : item.name_en)}
                </Text>
                <Text style={[styles.eventHijri, { color: c.primary }]}>{item.hijri}</Text>
                <Text style={[styles.eventGregorian, { color: c.textSecondary }]}>{item.gregorian}</Text>
              </View>
            </View>
          )}
        />
      )}

      {/* Country Picker Modal */}
      <Modal visible={showCountryPicker} animationType="slide">
        <View style={[styles.modalContainer, { backgroundColor: c.background }]}>
          <StatusBar barStyle="light-content" backgroundColor={c.headerBg} />
          <View style={[styles.modalHeader, { backgroundColor: c.headerBg }]}>
            <TouchableOpacity onPress={() => setShowCountryPicker(false)} style={styles.backBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isArabicUI ? 'اختر الدولة' : ui(t('selectCountry'))}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={[styles.searchContainer, { backgroundColor: c.surface }]}>
            <Ionicons name="search-outline" size={18} color={c.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: c.text }]}
              placeholder={isArabicUI ? 'ابحث عن دولة...' : ui(t('searchCountry'))}
              placeholderTextColor={c.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.countryItem, { backgroundColor: c.surface, borderBottomColor: c.border }]}
                onPress={() => {
                  setSelectedCountry(item);
                  setShowCountryPicker(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.countryName, { color: c.text }]}>
                  {isArabicUI ? item.name_ar : item.name_en}
                </Text>
                {selectedCountry?.code === item.code && (
                  <Ionicons name="checkmark" size={20} color={c.primary} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
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
  todayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    gap: 12,
  },
  todayInfo: { flex: 1 },
  todayLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  todayDate: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  toggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  toggleText: { fontSize: 14, fontWeight: '600' },
  listContent: { padding: 16 },
  disclaimer: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    marginBottom: 16,
    gap: 8,
    alignItems: 'flex-start',
  },
  disclaimerText: { fontSize: 12, lineHeight: 18, flex: 1 },
  monthItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  monthNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  monthNumberText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  monthInfo: { flex: 1 },
  monthNameRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  monthArabic: { fontSize: 18, fontWeight: '600' },
  monthEnglish: { fontSize: 16, fontWeight: '600' },
  eventsList: { gap: 4 },
  eventTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  eventDay: { fontSize: 12, fontWeight: '700' },
  eventName: { fontSize: 12 },
  eventItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  eventDateBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  eventHijri: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  eventGregorian: { fontSize: 13 },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 12,
    paddingBottom: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 4 },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  countryName: { fontSize: 16, fontWeight: '500' },
});

export default IslamicMonthsScreen;
