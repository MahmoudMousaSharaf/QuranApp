import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
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
import { Bookmark } from '../types';
import { getBookmarks, removeBookmark } from '../services/storage';

interface BookmarksScreenProps {
  onBack: () => void;
  onSelectSurah: (surahNumber: number, ayahNumber?: number) => void;
}

const BookmarksScreen: React.FC<BookmarksScreenProps> = ({
  onBack,
  onSelectSurah,
}) => {
  const { theme } = useTheme();
  const { t, appLanguage } = useLanguage();
  const c = colors[theme];
  const { ui, translateUI } = useUITranslation(appLanguage);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    translateUI([
      t('bookmarks'),
      t('noBookmarks'),
      t('bookmarkHint'),
      t('ayah'),
    ]);
  }, [appLanguage]);

  useEffect(() => {
    (async () => {
      const bms = await getBookmarks();
      setBookmarks(bms);
      setLoading(false);
    })();
  }, []);

  const handleRemove = useCallback(async (bm: Bookmark) => {
    await removeBookmark(bm.surahNumber, bm.ayahNumber);
    setBookmarks((prev) =>
      prev.filter(
        (b) =>
          !(b.surahNumber === bm.surahNumber && b.ayahNumber === bm.ayahNumber)
      )
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Bookmark }) => (
      <TouchableOpacity
        style={[styles.item, { backgroundColor: c.surface, borderBottomColor: c.border }]}
        onPress={() => onSelectSurah(item.surahNumber, item.ayahNumber)}
        activeOpacity={0.7}
      >
        <View style={[styles.itemIcon, { backgroundColor: c.ayahBg }]}>
          <Ionicons name="bookmark" size={20} color={c.primary} />
        </View>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemTitle, { color: c.text }]} numberOfLines={1}>
            {item.surahName} · {ui(t('ayah'))} {item.ayahNumber}
          </Text>
          <Text style={[styles.itemText, { color: c.textSecondary }]} numberOfLines={2}>
            {item.text}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleRemove(item)}
          style={styles.removeBtn}
        >
          <Ionicons name="trash-outline" size={18} color={c.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [c, handleRemove]
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={c.headerBg} />

      <View style={[styles.header, { backgroundColor: c.headerBg }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{ui(t('bookmarks'))}</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : bookmarks.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="bookmark-outline" size={56} color={c.textSecondary} />
          <Text style={[styles.emptyText, { color: c.textSecondary }]}>
            {ui(t('noBookmarks'))}
          </Text>
          <Text style={[styles.emptySubtext, { color: c.textSecondary }]}>
            {ui(t('bookmarkHint'))}
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => `${item.surahNumber}:${item.ayahNumber}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          windowSize={10}
          removeClippedSubviews={true}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 12,
    paddingBottom: 14,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  itemText: {
    fontSize: 13,
  },
  removeBtn: {
    padding: 8,
  },
});

export default BookmarksScreen;
