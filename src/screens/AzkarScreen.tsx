import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  TextInput,
  Share,
  Vibration,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { translateText } from '../services/contentTranslator';
import { useUITranslation } from '../hooks/useUITranslation';
import azkarData from '../data/azkar.json';

const BISMILLAH_AR = 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ';
const TAAWWUDH_AR = 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ';
const COUNTERS_KEY = '@azkar_counters_v1';
const FAVORITES_KEY = '@azkar_favorites_v1';

interface AzkarScreenProps {
  onBack: () => void;
}

const CATEGORY_ICONS: Record<number, { icon: keyof typeof Ionicons.glyphMap; bg: string }> = {
  1: { icon: 'sunny-outline', bg: '#FF9500' },
  2: { icon: 'moon-outline', bg: '#5B7FFF' },
  3: { icon: 'checkmark-circle-outline', bg: '#34C759' },
  4: { icon: 'bed-outline', bg: '#5856D6' },
  5: { icon: 'alarm-outline', bg: '#FF2D55' },
  6: { icon: 'airplane-outline', bg: '#00C7BE' },
  7: { icon: 'restaurant-outline', bg: '#FF9500' },
  8: { icon: 'heart-outline', bg: '#FF3B30' },
  9: { icon: 'home-outline', bg: '#007AFF' },
  10: { icon: 'medkit-outline', bg: '#FF2D55' },
  11: { icon: 'star-outline', bg: '#AF52DE' },
  12: { icon: 'ellipsis-horizontal-circle-outline', bg: '#8E8E93' },
  13: { icon: 'volume-high-outline', bg: '#FF9500' },
  14: { icon: 'water-outline', bg: '#00C7BE' },
  15: { icon: 'business-outline', bg: '#34C759' },
  16: { icon: 'walk-outline', bg: '#8E8E93' },
  17: { icon: 'hand-left-outline', bg: '#AF52DE' },
};

const AzkarScreen: React.FC<AzkarScreenProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const { t, appLanguage, showArabic, showTranslation } = useLanguage();
  const c = colors[theme];
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const scaleAnims = useRef<Record<string, Animated.Value>>({});

  const isArabicUI = appLanguage === 'ar';
  const needsTranslation = appLanguage !== 'ar' && appLanguage !== 'en';
  const { ui, translateUI } = useUITranslation(appLanguage);

  const categories = azkarData.categories;

  useEffect(() => {
    if (!needsTranslation) return;
    translateUI([
      'Search azkar...',
      'No results found',
      'Share',
      'Copy',
      'Copied!',
      'Favorite',
      'Completed',
      'Reset',
      'supplications',
    ]);
  }, [appLanguage, needsTranslation]);

  // Load counters and favorites from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const countersData = await AsyncStorage.getItem(COUNTERS_KEY);
        if (countersData) setCounters(JSON.parse(countersData));
        const favData = await AsyncStorage.getItem(FAVORITES_KEY);
        if (favData) setFavorites(new Set(JSON.parse(favData)));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const getScaleAnim = (key: string): Animated.Value => {
    if (!scaleAnims.current[key]) {
      scaleAnims.current[key] = new Animated.Value(1);
    }
    return scaleAnims.current[key];
  };

  const handleCounterPress = useCallback((categoryKey: string, itemIndex: number, totalCount: number) => {
    const key = `${categoryKey}_${itemIndex}`;
    const current = counters[key] ?? totalCount;
    if (current <= 0) {
      // Reset
      Vibration.vibrate(100);
      setCounters(prev => {
        const updated = { ...prev, [key]: totalCount };
        AsyncStorage.setItem(COUNTERS_KEY, JSON.stringify(updated));
        return updated;
      });
      return;
    }
    const newVal = current - 1;
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Vibration.vibrate(newVal === 0 ? [0, 30, 50, 30] : 15);
    } else {
      Vibration.vibrate(newVal === 0 ? 50 : 10);
    }
    // Ripple animation
    const anim = getScaleAnim(key);
    Animated.sequence([
      Animated.timing(anim, { toValue: 1.15, duration: 100, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setCounters(prev => {
      const updated = { ...prev, [key]: newVal };
      AsyncStorage.setItem(COUNTERS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [counters]);

  const handleShare = useCallback(async (textAr: string, translatedText: string, textEn: string, source: string, sourceAr: string) => {
    let shareContent = `${textAr}\n\n${translatedText}`;
    if (textEn && textEn !== translatedText) shareContent += `\n\n"${textEn}"`;
    shareContent += `\n\n${source}`;
    if (sourceAr && sourceAr !== source) shareContent += `\n\n${sourceAr}`;
    try {
      await Share.share({ message: shareContent });
    } catch (e) {
      // ignore
    }
  }, []);

  const handleCopy = useCallback(async (key: string, textAr: string, translatedText: string, textEn: string) => {
    let copyContent = `${textAr}\n\n${translatedText}`;
    if (textEn && textEn !== translatedText) copyContent += `\n\n${textEn}`;
    try {
      await Clipboard.setStringAsync(copyContent);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (e) {
      // ignore
    }
  }, []);

  const handleFavorite = useCallback((key: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...newSet]));
      return newSet;
    });
  }, []);

  const extractBismillah = useCallback((text: string): { bismillah: string | null; taawwudh: string | null; rest: string } => {
    let taawwudh: string | null = null;
    let rest = text;
    // Extract Ta'awwudh first (comes before Bismillah)
    if (rest.startsWith(TAAWWUDH_AR)) {
      taawwudh = TAAWWUDH_AR;
      rest = rest.substring(TAAWWUDH_AR.length).replace(/^[.،\s]+/, '');
    }
    // Extract Bismillah
    let bismillah: string | null = null;
    if (rest.startsWith(BISMILLAH_AR)) {
      bismillah = BISMILLAH_AR;
      rest = rest.substring(BISMILLAH_AR.length).replace(/^[.،\s]+/, '');
    } else {
      const prefix = BISMILLAH_AR + '.';
      if (rest.startsWith(prefix)) {
        bismillah = BISMILLAH_AR;
        rest = rest.substring(prefix.length).replace(/^[.،\s]+/, '');
      }
    }
    return { bismillah, taawwudh, rest };
  }, []);

  // Translation state for non-AR/non-EN languages
  const [translatedCategories, setTranslatedCategories] = useState<Record<number, string>>({});
  const [translatedItems, setTranslatedItems] = useState<Record<string, { text: string; source: string; category: string }>>({});

  useEffect(() => {
    if (!needsTranslation) return;
    let cancelled = false;
    (async () => {
      const catMap: Record<number, string> = {};
      for (const cat of categories) {
        const translated = await translateText(cat.category_en, appLanguage);
        if (cancelled) return;
        catMap[cat.id] = translated;
      }
      if (!cancelled) setTranslatedCategories(catMap);
    })();
    return () => { cancelled = true; };
  }, [appLanguage, needsTranslation]);

  // Translate items when a category is selected
  useEffect(() => {
    if (!needsTranslation || selectedCategory === null) return;
    let cancelled = false;
    const category = categories.find(cat => cat.id === selectedCategory);
    if (!category) return;
    (async () => {
      const BATCH_SIZE = 10;
      for (let i = 0; i < category.items.length; i += BATCH_SIZE) {
        if (cancelled) return;
        const batch = category.items.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (item: typeof category.items[0], idx: number) => {
            const key = `${selectedCategory}_${i + idx}`;
            const [text, source] = await Promise.all([
              translateText(item.text_en, appLanguage),
              translateText(item.source_en, appLanguage),
            ]);
            return { key, data: { text, source, category: '' } };
          })
        );
        if (cancelled) return;
        setTranslatedItems(prev => {
          const updated = { ...prev };
          for (const r of batchResults) updated[r.key] = r.data;
          return updated;
        });
      }
    })();
    return () => { cancelled = true; };
  }, [selectedCategory, needsTranslation, appLanguage]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.category_ar.includes(searchQuery) ||
        cat.category_en.toLowerCase().includes(q) ||
        cat.items.some(
          (item) =>
            item.text_ar.includes(searchQuery) ||
            item.text_en.toLowerCase().includes(q)
        )
    );
  }, [categories, searchQuery]);

  const filteredItems = useMemo(() => {
    if (selectedCategory === null) return [];
    const category = categories.find((cat) => cat.id === selectedCategory);
    if (!category) return [];
    if (!searchQuery.trim()) return category.items;
    const q = searchQuery.toLowerCase();
    return category.items.filter(
      (item) =>
        item.text_ar.includes(searchQuery) ||
        item.text_en.toLowerCase().includes(q) ||
        item.source_ar.includes(searchQuery) ||
        item.source_en.toLowerCase().includes(q)
    );
  }, [categories, selectedCategory, searchQuery]);

  if (selectedCategory !== null) {
    const category = categories.find((cat) => cat.id === selectedCategory);
    if (!category) return null;

    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={c.headerBg} />
        <View style={[styles.header, { backgroundColor: c.headerBg }]}>
          <TouchableOpacity onPress={() => setSelectedCategory(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isArabicUI ? category.category_ar : (needsTranslation ? (translatedCategories[category.id] || category.category_en) : t('azkar'))}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={[styles.searchContainer, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
          <Ionicons name="search-outline" size={18} color={c.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            placeholder={isArabicUI ? 'بحث في الأذكار...' : ui('Search azkar...')}
            placeholderTextColor={c.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={c.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          key={`items_${selectedCategory}`}
          data={filteredItems}
          keyExtractor={(item, index) => `${selectedCategory}_${index}`}
          contentContainerStyle={styles.listContent}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={15}
          removeClippedSubviews={false}
          scrollEventThrottle={16}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 100,
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: c.textSecondary }]}>
                {isArabicUI ? 'لا توجد نتائج' : ui('No results found')}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const itemKey = `${selectedCategory}_${index}`;
            const counterKey = `${selectedCategory}_${index}`;
            const remaining = counters[counterKey] ?? item.count;
            const isCompleted = remaining <= 0;
            const isFav = favorites.has(counterKey);
            const { bismillah, taawwudh, rest: textRest } = extractBismillah(item.text_ar);
            const hasPrefix = bismillah || taawwudh;
            const scaleAnim = getScaleAnim(counterKey);
            const isTranslationPrimary = appLanguage !== 'ar';
            const translatedText = isArabicUI ? item.text_en : (needsTranslation ? (translatedItems[itemKey]?.text || item.text_en) : item.text_en);
            const translatedSource = isArabicUI ? item.source_ar : (needsTranslation ? (translatedItems[itemKey]?.source || item.source_en) : item.source_en);
            return (
            <View style={[styles.azkarCard, { backgroundColor: c.surface }]}>
              {/* Ta'awwudh & Bismillah on top */}
              {(taawwudh || bismillah) && showArabic && (
                <View style={styles.bismillahContainer}>
                  {taawwudh && (
                    <Text style={[styles.bismillahText, { color: c.primary }]}>{TAAWWUDH_AR}</Text>
                  )}
                  {taawwudh && bismillah && <View style={{ height: 6 }} />}
                  {bismillah && (
                    <Text style={[styles.bismillahText, { color: c.primary }]}>{BISMILLAH_AR}</Text>
                  )}
                </View>
              )}

              {/* Primary text (big) + Secondary text (small) — same pattern as SurahReaderScreen */}
              {isTranslationPrimary ? (
                <>
                  {/* Selected language translation — BIG/primary */}
                  {showTranslation && translatedText ? (
                    <Text style={[styles.primaryText, { color: c.text }]}>
                      {translatedText}
                    </Text>
                  ) : null}

                  {/* Arabic — smaller below */}
                  {showArabic && (
                    <Text style={[styles.arabicTextSecondary, { color: c.textSecondary }]}>
                      {hasPrefix ? textRest : item.text_ar}
                    </Text>
                  )}

                  {/* English translation — smaller below (only for non-EN, non-AR) */}
                  {appLanguage !== 'en' && showTranslation && item.text_en ? (
                    <Text style={[styles.englishTextSecondary, { color: c.textSecondary }]}>
                      {item.text_en}
                    </Text>
                  ) : null}
                </>
              ) : (
                <>
                  {/* Arabic — BIG/primary (for Arabic language mode) */}
                  {showArabic && (
                    <Text style={[styles.arabicText, { color: c.text }]}>
                      {hasPrefix ? textRest : item.text_ar}
                    </Text>
                  )}
                </>
              )}

              {/* Source */}
              <View style={[styles.sourceRow, { borderColor: c.border }]}>
                <Ionicons name="book-outline" size={13} color={c.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sourceText, { color: c.textSecondary }]}>
                    {translatedSource}
                  </Text>
                  {isTranslationPrimary && (
                    <Text style={[styles.sourceArabicText, { color: c.textSecondary }]}>
                      {item.source_ar}
                    </Text>
                  )}
                </View>
              </View>

              {/* Action buttons row */}
              <View style={[styles.actionsRow, { borderTopColor: c.border }]}>
                {/* Share */}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleShare(item.text_ar, translatedText, item.text_en, translatedSource, item.source_ar)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="share-outline" size={20} color={c.textSecondary} />
                  <Text style={[styles.actionLabel, { color: c.textSecondary }]}>
                    {isArabicUI ? 'مشاركة' : ui('Share')}
                  </Text>
                </TouchableOpacity>

                {/* Copy */}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleCopy(counterKey, item.text_ar, translatedText, item.text_en)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={copiedKey === counterKey ? 'checkmark-circle' : 'copy-outline'}
                    size={20}
                    color={copiedKey === counterKey ? '#34C759' : c.textSecondary}
                  />
                  <Text style={[styles.actionLabel, { color: copiedKey === counterKey ? '#34C759' : c.textSecondary }]}>
                    {copiedKey === counterKey
                      ? (isArabicUI ? 'تم النسخ' : ui('Copied!'))
                      : (isArabicUI ? 'نسخ' : ui('Copy'))}
                  </Text>
                </TouchableOpacity>

                {/* Favorite */}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleFavorite(counterKey)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={isFav ? 'heart' : 'heart-outline'}
                    size={20}
                    color={isFav ? '#FF3B30' : c.textSecondary}
                  />
                  <Text style={[styles.actionLabel, { color: isFav ? '#FF3B30' : c.textSecondary }]}>
                    {isArabicUI ? 'المفضلة' : ui('Favorite')}
                  </Text>
                </TouchableOpacity>

                {/* Counter button */}
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <TouchableOpacity
                    style={[
                      styles.counterBtn,
                      { backgroundColor: isCompleted ? '#34C759' : c.primary },
                    ]}
                    onPress={() => handleCounterPress(String(selectedCategory), index, item.count)}
                    activeOpacity={0.7}
                  >
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={26} color="#fff" />
                    ) : (
                      <Text style={styles.counterBtnText}>{remaining}</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>

              {/* Completed label */}
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>
                    {isArabicUI ? 'تم بحمد الله ✓' : ui('Completed') + ' ✓'}
                  </Text>
                </View>
              )}
            </View>
          );
          }}
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
        <Text style={styles.headerTitle}>{ui(t('azkar'))}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <Ionicons name="search-outline" size={18} color={c.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: c.text }]}
          placeholder={isArabicUI ? 'بحث في الأذكار...' : ui('Search azkar...')}
          placeholderTextColor={c.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={c.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: c.textSecondary }]}>
              {isArabicUI ? 'لا توجد نتائج' : ui('No results found')}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const iconData = CATEGORY_ICONS[item.id] || { icon: 'moon-outline' as keyof typeof Ionicons.glyphMap, bg: c.ayahBg };
          return (
          <TouchableOpacity
            style={[styles.categoryItem, { backgroundColor: c.surface, borderBottomColor: c.border }]}
            onPress={() => setSelectedCategory(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.categoryIcon, { backgroundColor: iconData.bg + '20' }]}>
              <Ionicons name={iconData.icon} size={24} color={iconData.bg} />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={[styles.categoryTitle, { color: c.text }]}>
                {isArabicUI ? item.category_ar : (needsTranslation ? (translatedCategories[item.id] || item.category_en) : item.category_en)}
              </Text>
              <Text style={[styles.categoryCount, { color: c.textSecondary }]}>
                {item.items.length} {ui(t('supplications'))}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.textSecondary} />
          </TouchableOpacity>
          );
        }}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 4,
  },
  listContent: { padding: 16 },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryInfo: { flex: 1 },
  categoryTitle: { fontSize: 17, fontWeight: '600', marginBottom: 3 },
  categoryCount: { fontSize: 13 },
  azkarCard: {
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bismillahContainer: {
    alignItems: 'center',
    paddingBottom: 10,
    marginBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  bismillahText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sourceText: { fontSize: 12, flex: 1 },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 4,
  },
  actionLabel: {
    fontSize: 11,
  },
  counterBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  counterBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  completedBadge: {
    alignItems: 'center',
    marginTop: 8,
  },
  completedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#34C759',
  },
  arabicText: {
    fontSize: 22,
    lineHeight: 40,
    textAlign: 'right',
    marginBottom: 8,
  },
  englishText: { fontSize: 15, lineHeight: 24 },
  primaryText: {
    fontSize: 22,
    lineHeight: 36,
    marginBottom: 10,
  },
  arabicTextSecondary: {
    fontSize: 20,
    lineHeight: 38,
    textAlign: 'right',
    marginBottom: 8,
  },
  englishTextSecondary: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  sourceArabicText: {
    fontSize: 11,
    lineHeight: 18,
    marginTop: 2,
    textAlign: 'right',
  },
});

export default AzkarScreen;
