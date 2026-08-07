import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useUITranslation } from '../hooks/useUITranslation';
import { SurahMeta } from '../types';

interface SurahListScreenProps {
  surahs: SurahMeta[];
  onSelectSurah: (number: number) => void;
  onOpenBookmarks: () => void;
  loading: boolean;
  onBackToHome?: () => void;
}

const SurahListScreen: React.FC<SurahListScreenProps> = ({
  surahs,
  onSelectSurah,
  onOpenBookmarks,
  loading,
  onBackToHome,
}) => {
  const { theme } = useTheme();
  const { t, appLanguage } = useLanguage();
  const c = colors[theme];
  const { ui, translateUI } = useUITranslation(appLanguage);
  const [search, setSearch] = useState('');

  useEffect(() => {
    translateUI([
      t('holyQuranSubtitle2'),
      t('searchSurah'),
      t('ayahs'),
      t('loadingSurahs'),
      t('noSurahFound'),
    ]);
  }, [appLanguage]);

  const filteredSurahs = useMemo(() => {
    if (!search.trim()) return surahs;
    const q = search.toLowerCase().trim();
    return surahs.filter(
      (s) =>
        s.englishName.toLowerCase().includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        s.name.includes(search.trim()) ||
        String(s.number) === q
    );
  }, [surahs, search]);

  const renderItem = useCallback(
    ({ item }: { item: SurahMeta }) => (
      <TouchableOpacity
        style={[styles.surahItem, { backgroundColor: c.surface, borderBottomColor: c.border }]}
        onPress={() => onSelectSurah(item.number)}
        activeOpacity={0.7}
      >
        <View style={[styles.surahNumber, { borderColor: c.primary }]}>
          <Text style={[styles.surahNumberText, { color: c.primary }]}>
            {item.number}
          </Text>
        </View>
        <View style={styles.surahInfo}>
          <View style={styles.surahNameRow}>
            <Text style={[styles.englishName, { color: c.text }]} numberOfLines={1}>
              {item.englishName}
            </Text>
            <Text style={[styles.arabicName, { color: c.primary }]} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
          <View style={styles.surahMetaRow}>
            <Text style={[styles.translation, { color: c.textSecondary }]} numberOfLines={1}>
              {item.englishNameTranslation}
            </Text>
            <Text style={[styles.ayahCount, { color: c.textSecondary }]}>
              {item.numberOfAyahs} {ui(t('ayahs'))}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [c]
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={c.headerBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: c.headerBg }]}>
        <View style={styles.headerTop}>
          {onBackToHome && (
            <TouchableOpacity onPress={onBackToHome} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>The Truth - Al Haq</Text>
            <Text style={styles.headerSubtitle}>{ui(t('holyQuranSubtitle2'))}</Text>
          </View>
          <TouchableOpacity onPress={onOpenBookmarks} style={styles.bookmarkBtn}>
            <Ionicons name="bookmark-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.6)" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={ui(t('searchSurah'))}
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={[styles.loadingText, { color: c.textSecondary }]}>
            {ui(t('loadingSurahs'))}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredSurahs}
          keyExtractor={(item) => String(item.number)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={20}
          maxToRenderPerBatch={20}
          windowSize={10}
          removeClippedSubviews={true}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: c.textSecondary }]}>
                {ui(t('noSurahFound'))}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  backBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  bookmarkBtn: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    padding: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 20,
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  surahNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  surahNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  surahInfo: {
    flex: 1,
  },
  surahNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  englishName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  arabicName: {
    fontSize: 18,
    fontWeight: '600',
  },
  surahMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  translation: {
    fontSize: 12,
    flex: 1,
    marginRight: 8,
  },
  ayahCount: {
    fontSize: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
  },
});

export default SurahListScreen;
