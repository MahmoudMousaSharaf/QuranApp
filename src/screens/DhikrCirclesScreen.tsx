import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  Vibration,
  Animated,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { translateText } from '../services/contentTranslator';
import { useUITranslation } from '../hooks/useUITranslation';

interface DhikrCirclesScreenProps {
  onBack: () => void;
}

interface DhikrCircle {
  id: string;
  name: string;
  name_ar: string;
  target: number;
  color: string;
  icon: string;
}

interface DailyLog {
  date: string;
  count: number;
}

interface CircleProgress {
  current: number;
  totalCompleted: number;
  dailyLogs: DailyLog[];
  lastResetDate: string;
}

const CIRCLES_KEY = '@dhikr_circles_v1';
const PROGRESS_KEY = '@dhikr_circles_progress_v1';
const DAILY_GOAL_KEY = '@dhikr_daily_goal_v1';

const DEFAULT_CIRCLES: DhikrCircle[] = [
  { id: 'subhanallah', name: 'Subhanallah', name_ar: 'سُبْحَانَ اللَّهِ', target: 33, color: '#34C759', icon: 'leaf' },
  { id: 'alhamdulillah', name: 'Alhamdulillah', name_ar: 'الْحَمْدُ لِلَّهِ', target: 33, color: '#007AFF', icon: 'heart' },
  { id: 'allahuakbar', name: 'Allahu Akbar', name_ar: 'اللَّهُ أَكْبَرُ', target: 34, color: '#FF9500', icon: 'star' },
  { id: 'istighfar', name: 'Astaghfirullah', name_ar: 'أَسْتَغْفِرُ اللَّهَ', target: 100, color: '#5856D6', icon: 'water' },
  { id: 'salawat', name: 'Salawat', name_ar: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', target: 100, color: '#FF2D55', icon: 'ribbon' },
  { id: 'tahlil', name: 'La ilaha illallah', name_ar: 'لَا إِلَهَ إِلَّا اللَّهُ', target: 100, color: '#AF52DE', icon: 'bulb' },
  { id: 'takbir_100', name: 'Allahu Akbar (100x)', name_ar: 'اللَّهُ أَكْبَرُ (١٠٠)', target: 100, color: '#00C7BE', icon: 'flame' },
  { id: 'tasbeeh_hamd', name: 'Subhanallahi wa bihamdih', name_ar: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', target: 100, color: '#FF3B30', icon: 'sunny' },
];

const ACHIEVEMENTS = [
  { id: 'first_dhikr', threshold: 1, label_en: 'First Dhikr', label_ar: 'أول ذكر', icon: 'flag' },
  { id: 'dhikr_10', threshold: 10, label_en: '10 Dhikrs', label_ar: '١٠ أذكار', icon: 'ribbon' },
  { id: 'dhikr_100', threshold: 100, label_en: '100 Dhikrs', label_ar: '١٠٠ ذكر', icon: 'star' },
  { id: 'dhikr_500', threshold: 500, label_en: '500 Dhikrs', label_ar: '٥٠٠ ذكر', icon: 'trophy' },
  { id: 'dhikr_1000', threshold: 1000, label_en: '1000 Dhikrs', label_ar: '١٠٠٠ ذكر', icon: 'flame' },
  { id: 'dhikr_5000', threshold: 5000, label_en: '5000 Dhikrs', label_ar: '٥٠٠٠ ذكر', icon: 'diamond' },
  { id: 'dhikr_10000', threshold: 10000, label_en: '10000 Dhikrs', label_ar: '١٠٠٠٠ ذكر', icon: 'crown' },
];

const DhikrCirclesScreen: React.FC<DhikrCirclesScreenProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const { t, appLanguage } = useLanguage();
  const c = colors[theme];
  const isArabicUI = appLanguage === 'ar';
  const needsTranslation = appLanguage !== 'ar' && appLanguage !== 'en';
  const { ui, translateUI } = useUITranslation(appLanguage);

  const [circles, setCircles] = useState<DhikrCircle[]>(DEFAULT_CIRCLES);
  const [progress, setProgress] = useState<Record<string, CircleProgress>>({});
  const [dailyGoal, setDailyGoal] = useState(100);
  const [selectedCircle, setSelectedCircle] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTarget, setNewTarget] = useState('33');
  const [translatedCircles, setTranslatedCircles] = useState<Record<string, string>>({});
  const [translatedAchievements, setTranslatedAchievements] = useState<Record<string, string>>({});
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [activeTab, setActiveTab] = useState<'circles' | 'stats'>('circles');

  useEffect(() => {
    if (!needsTranslation) return;
    translateUI([
      'Dhikr Circles',
      'Personal dhikr tracker & statistics',
      'Circles',
      'Statistics',
      'Add Circle',
      'Daily Goal',
      'Total Today',
      'All Time',
      'Achievements',
      'Streak',
      'days',
      'Tap to count',
      'Reset',
      'Circle Name',
      'Target Count',
      'Save',
      'Cancel',
      'Delete',
      'Add New Circle',
      'Completed',
      'Keep going!',
    ]);
  }, [appLanguage, needsTranslation]);

  useEffect(() => {
    if (!needsTranslation) return;
    let cancelled = false;
    (async () => {
      const map: Record<string, string> = {};
      for (const circle of circles) {
        if (cancelled) return;
        map[circle.id] = await translateText(circle.name, appLanguage);
      }
      if (!cancelled) setTranslatedCircles(map);

      const achMap: Record<string, string> = {};
      for (const ach of ACHIEVEMENTS) {
        if (cancelled) return;
        achMap[ach.id] = await translateText(ach.label_en, appLanguage);
      }
      if (!cancelled) setTranslatedAchievements(achMap);
    })();
    return () => { cancelled = true; };
  }, [appLanguage, needsTranslation, circles]);

  useEffect(() => {
    (async () => {
      try {
        const circlesData = await AsyncStorage.getItem(CIRCLES_KEY);
        if (circlesData) setCircles(JSON.parse(circlesData));

        const progressData = await AsyncStorage.getItem(PROGRESS_KEY);
        if (progressData) setProgress(JSON.parse(progressData));

        const goalData = await AsyncStorage.getItem(DAILY_GOAL_KEY);
        if (goalData) setDailyGoal(JSON.parse(goalData));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const today = new Date().toISOString().split('T')[0];

  const getTotalToday = useCallback(() => {
    let total = 0;
    for (const key of Object.keys(progress)) {
      const p = progress[key];
      const todayLog = p.dailyLogs?.find(l => l.date === today);
      if (todayLog) total += todayLog.count;
    }
    return total;
  }, [progress, today]);

  const getAllTimeTotal = useCallback(() => {
    let total = 0;
    for (const key of Object.keys(progress)) {
      total += progress[key].totalCompleted;
    }
    return total;
  }, [progress]);

  const getStreak = useCallback(() => {
    let streak = 0;
    let checkDate = new Date();
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      let hasActivity = false;
      for (const key of Object.keys(progress)) {
        const log = progress[key].dailyLogs?.find(l => l.date === dateStr);
        if (log && log.count > 0) { hasActivity = true; break; }
      }
      if (hasActivity) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [progress]);

  const handleCount = useCallback((circleId: string, target: number) => {
    const current = progress[circleId]?.current ?? 0;
    const newCount = current + 1;

    Vibration.vibrate(newCount >= target ? 100 : 15);

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    setProgress(prev => {
      const existing = prev[circleId] || { current: 0, totalCompleted: 0, dailyLogs: [], lastResetDate: today };
      const dailyLogs = [...(existing.dailyLogs || [])];
      const todayIdx = dailyLogs.findIndex(l => l.date === today);
      if (todayIdx >= 0) {
        dailyLogs[todayIdx] = { ...dailyLogs[todayIdx], count: dailyLogs[todayIdx].count + 1 };
      } else {
        dailyLogs.push({ date: today, count: 1 });
      }

      let newCurrent = newCount;
      let newTotal = existing.totalCompleted;
      if (newCount >= target) {
        newCurrent = 0;
        newTotal += target;
        Vibration.vibrate([0, 50, 80, 50]);
      }

      const updated = {
        ...prev,
        [circleId]: {
          current: newCurrent,
          totalCompleted: newTotal,
          dailyLogs,
          lastResetDate: existing.lastResetDate,
        },
      };
      AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [progress, today, scaleAnim]);

  const handleReset = useCallback((circleId: string) => {
    setProgress(prev => {
      const existing = prev[circleId] || { current: 0, totalCompleted: 0, dailyLogs: [], lastResetDate: today };
      const updated = {
        ...prev,
        [circleId]: { ...existing, current: 0 },
      };
      AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [today]);

  const handleAddCircle = useCallback(() => {
    if (!newName.trim() || !newTarget.trim()) return;
    const id = `custom_${Date.now()}`;
    const target = parseInt(newTarget, 10) || 33;
    const colors_pool = ['#34C759', '#007AFF', '#FF9500', '#5856D6', '#FF2D55', '#AF52DE', '#00C7BE', '#FF3B30'];
    const randomColor = colors_pool[Math.floor(Math.random() * colors_pool.length)];
    const newCircle: DhikrCircle = {
      id,
      name: newName.trim(),
      name_ar: newName.trim(),
      target,
      color: randomColor,
      icon: 'add-circle',
    };
    const updated = [...circles, newCircle];
    setCircles(updated);
    AsyncStorage.setItem(CIRCLES_KEY, JSON.stringify(updated));
    setNewName('');
    setNewTarget('33');
    setShowAddModal(false);
  }, [circles, newName, newTarget]);

  const handleDeleteCircle = useCallback((circleId: string) => {
    if (circleId.startsWith('custom_')) {
      Alert.alert(
        isArabicUI ? 'حذف الحلقة' : ui('Delete'),
        isArabicUI ? 'هل أنت متأكد من حذف هذه الحلقة؟' : 'Are you sure you want to delete this circle?',
        [
          { text: isArabicUI ? 'إلغاء' : ui('Cancel'), style: 'cancel' },
          {
            text: isArabicUI ? 'حذف' : 'Delete',
            style: 'destructive',
            onPress: () => {
              const updated = circles.filter(c => c.id !== circleId);
              setCircles(updated);
              AsyncStorage.setItem(CIRCLES_KEY, JSON.stringify(updated));
              const newProgress = { ...progress };
              delete newProgress[circleId];
              setProgress(newProgress);
              AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(newProgress));
            },
          },
        ]
      );
    }
  }, [circles, progress, isArabicUI, ui]);

  const totalToday = getTotalToday();
  const allTimeTotal = getAllTimeTotal();
  const streak = getStreak();
  const dailyProgress = dailyGoal > 0 ? Math.min(totalToday / dailyGoal, 1) : 0;

  const getCircleName = (circle: DhikrCircle) => {
    if (isArabicUI) return circle.name_ar;
    if (needsTranslation) return translatedCircles[circle.id] || circle.name;
    return circle.name;
  };

  const getAchievementLabel = (ach: typeof ACHIEVEMENTS[0]) => {
    if (isArabicUI) return ach.label_ar;
    if (needsTranslation) return translatedAchievements[ach.id] || ach.label_en;
    return ach.label_en;
  };

  const unlockedAchievements = ACHIEVEMENTS.filter(a => allTimeTotal >= a.threshold);
  const nextAchievement = ACHIEVEMENTS.find(a => allTimeTotal < a.threshold);

  if (selectedCircle) {
    const circle = circles.find(c => c.id === selectedCircle);
    if (!circle) return null;
    const circleProgress = progress[selectedCircle] || { current: 0, totalCompleted: 0, dailyLogs: [], lastResetDate: today };
    const current = circleProgress.current;
    const progressPct = (current / circle.target) * 100;

    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={circle.color} />
        <View style={[styles.header, { backgroundColor: circle.color }]}>
          <TouchableOpacity onPress={() => setSelectedCircle(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{getCircleName(circle)}</Text>
          <TouchableOpacity
            onPress={() => handleDeleteCircle(circle.id)}
            style={styles.backBtn}
          >
            {circle.id.startsWith('custom_') && (
              <Ionicons name="trash-outline" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.counterContent}>
          <Text style={[styles.dhikrLabel, { color: c.textSecondary }]}>
            {isArabicUI ? circle.name_ar : getCircleName(circle)}
          </Text>

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              style={[styles.bigCounterCircle, { borderColor: circle.color, backgroundColor: c.surface }]}
              onPress={() => handleCount(circle.id, circle.target)}
              activeOpacity={0.7}
            >
              <Text style={[styles.bigCountNumber, { color: circle.color }]}>{current}</Text>
              <Text style={[styles.bigCountTarget, { color: c.textSecondary }]}>
                / {circle.target}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={[styles.progressBar, { backgroundColor: c.ayahBg }]}>
            <View
              style={[styles.progressFill, { backgroundColor: circle.color, width: `${Math.min(progressPct, 100)}%` }]}
            />
          </View>

          <Text style={[styles.tapHint, { color: c.textSecondary }]}>
            {isArabicUI ? 'اضغط للعد' : ui('Tap to count')}
          </Text>

          <View style={styles.circleStatsRow}>
            <View style={[styles.circleStatBox, { backgroundColor: c.surface }]}>
              <Text style={[styles.circleStatNumber, { color: circle.color }]}>{circleProgress.totalCompleted}</Text>
              <Text style={[styles.circleStatLabel, { color: c.textSecondary }]}>
                {isArabicUI ? 'الإجمالي' : ui('All Time')}
              </Text>
            </View>
            <View style={[styles.circleStatBox, { backgroundColor: c.surface }]}>
              <Text style={[styles.circleStatNumber, { color: circle.color }]}>
                {circleProgress.dailyLogs?.find(l => l.date === today)?.count || 0}
              </Text>
              <Text style={[styles.circleStatLabel, { color: c.textSecondary }]}>
                {isArabicUI ? 'اليوم' : ui('Total Today')}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.resetBtn, { backgroundColor: c.surface, borderColor: c.border }]}
            onPress={() => handleReset(circle.id)}
          >
            <Ionicons name="refresh-outline" size={20} color={circle.color} />
            <Text style={[styles.resetText, { color: circle.color }]}>
              {isArabicUI ? 'إعادة تعيين' : ui('Reset')}
            </Text>
          </TouchableOpacity>
        </View>
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
        <Text style={styles.headerTitle}>
          {isArabicUI ? 'حلقات الذكر' : ui(t('dhikrCircles'))}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Tab selector */}
      <View style={[styles.tabBar, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'circles' && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('circles')}
        >
          <Ionicons name="grid-outline" size={18} color={activeTab === 'circles' ? c.primary : c.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'circles' ? c.primary : c.textSecondary }]}>
            {isArabicUI ? 'الحلقات' : ui('Circles')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('stats')}
        >
          <Ionicons name="stats-chart-outline" size={18} color={activeTab === 'stats' ? c.primary : c.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'stats' ? c.primary : c.textSecondary }]}>
            {isArabicUI ? 'الإحصائيات' : ui('Statistics')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'circles' ? (
        <ScrollView contentContainerStyle={styles.circlesContent} showsVerticalScrollIndicator={false}>
          {/* Daily goal progress */}
          <View style={[styles.dailyGoalCard, { backgroundColor: c.surface }]}>
            <View style={styles.dailyGoalHeader}>
              <Text style={[styles.dailyGoalTitle, { color: c.text }]}>
                {isArabicUI ? 'الهدف اليومي' : ui('Daily Goal')}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  const newGoal = dailyGoal === 100 ? 300 : dailyGoal === 300 ? 500 : dailyGoal === 500 ? 1000 : 100;
                  setDailyGoal(newGoal);
                  AsyncStorage.setItem(DAILY_GOAL_KEY, JSON.stringify(newGoal));
                }}
              >
                <Text style={[styles.dailyGoalValue, { color: c.primary }]}>{dailyGoal}</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.progressBar, { backgroundColor: c.ayahBg }]}>
              <View
                style={[styles.progressFill, { backgroundColor: c.primary, width: `${dailyProgress * 100}%` }]}
              />
            </View>
            <Text style={[styles.dailyGoalStatus, { color: c.textSecondary }]}>
              {totalToday} / {dailyGoal} {isArabicUI ? (totalToday >= dailyGoal ? 'تم!' : 'استمر!') : (totalToday >= dailyGoal ? ui('Completed') : ui('Keep going!'))}
            </Text>
          </View>

          {/* Circles grid */}
          <View style={styles.circlesGrid}>
            {circles.map((circle) => {
              const p = progress[circle.id] || { current: 0, totalCompleted: 0, dailyLogs: [], lastResetDate: today };
              const pct = (p.current / circle.target) * 100;
              return (
                <TouchableOpacity
                  key={circle.id}
                  style={[styles.circleCard, { backgroundColor: c.surface }]}
                  onPress={() => setSelectedCircle(circle.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.circleIcon, { backgroundColor: circle.color + '20' }]}>
                    <Ionicons name={circle.icon as any} size={24} color={circle.color} />
                  </View>
                  <Text style={[styles.circleName, { color: c.text }]} numberOfLines={1}>
                    {getCircleName(circle)}
                  </Text>
                  <Text style={[styles.circleTarget, { color: c.textSecondary }]}>
                    {circle.target}x
                  </Text>
                  <View style={[styles.miniProgressBar, { backgroundColor: c.ayahBg }]}>
                    <View
                      style={[styles.miniProgressFill, { backgroundColor: circle.color, width: `${Math.min(pct, 100)}%` }]}
                    />
                  </View>
                  <Text style={[styles.circleCurrent, { color: circle.color }]}>
                    {p.current}/{circle.target}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Add circle button */}
            <TouchableOpacity
              style={[styles.circleCard, styles.addCircleCard, { backgroundColor: c.surface, borderColor: c.border }]}
              onPress={() => setShowAddModal(true)}
              activeOpacity={0.7}
            >
              <View style={[styles.circleIcon, { backgroundColor: c.primary + '20' }]}>
                <Ionicons name="add" size={28} color={c.primary} />
              </View>
              <Text style={[styles.circleName, { color: c.primary }]}>
                {isArabicUI ? 'إضافة حلقة' : ui('Add Circle')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.statsContent} showsVerticalScrollIndicator={false}>
          {/* Overview cards */}
          <View style={styles.statsOverview}>
            <View style={[styles.overviewCard, { backgroundColor: c.surface }]}>
              <Ionicons name="today-outline" size={28} color="#007AFF" />
              <Text style={[styles.overviewNumber, { color: c.text }]}>{totalToday}</Text>
              <Text style={[styles.overviewLabel, { color: c.textSecondary }]}>
                {isArabicUI ? 'اليوم' : ui('Total Today')}
              </Text>
            </View>
            <View style={[styles.overviewCard, { backgroundColor: c.surface }]}>
              <Ionicons name="infinite-outline" size={28} color="#34C759" />
              <Text style={[styles.overviewNumber, { color: c.text }]}>{allTimeTotal}</Text>
              <Text style={[styles.overviewLabel, { color: c.textSecondary }]}>
                {isArabicUI ? 'الإجمالي' : ui('All Time')}
              </Text>
            </View>
            <View style={[styles.overviewCard, { backgroundColor: c.surface }]}>
              <Ionicons name="flame-outline" size={28} color="#FF9500" />
              <Text style={[styles.overviewNumber, { color: c.text }]}>{streak}</Text>
              <Text style={[styles.overviewLabel, { color: c.textSecondary }]}>
                {isArabicUI ? 'يوم متتالي' : ui('Streak') + ' ' + ui('days')}
              </Text>
            </View>
          </View>

          {/* Per-circle breakdown */}
          <Text style={[styles.sectionTitle, { color: c.text }]}>
            {isArabicUI ? 'تفاصيل الحلقات' : ui('Circles')}
          </Text>
          {circles.map(circle => {
            const p = progress[circle.id] || { current: 0, totalCompleted: 0, dailyLogs: [], lastResetDate: today };
            const todayCount = p.dailyLogs?.find(l => l.date === today)?.count || 0;
            return (
              <View key={circle.id} style={[styles.statRow, { backgroundColor: c.surface }]}>
                <View style={[styles.statRowIcon, { backgroundColor: circle.color + '20' }]}>
                  <Ionicons name={circle.icon as any} size={18} color={circle.color} />
                </View>
                <Text style={[styles.statRowName, { color: c.text }]} numberOfLines={1}>
                  {getCircleName(circle)}
                </Text>
                <Text style={[styles.statRowToday, { color: c.textSecondary }]}>
                  {isArabicUI ? 'اليوم' : 'Today'}: {todayCount}
                </Text>
                <Text style={[styles.statRowTotal, { color: circle.color }]}>
                  {p.totalCompleted}
                </Text>
              </View>
            );
          })}

          {/* Achievements */}
          <Text style={[styles.sectionTitle, { color: c.text }]}>
            {isArabicUI ? 'الإنجازات' : ui('Achievements')}
          </Text>
          <View style={styles.achievementsGrid}>
            {ACHIEVEMENTS.map(ach => {
              const unlocked = allTimeTotal >= ach.threshold;
              return (
                <View
                  key={ach.id}
                  style={[
                    styles.achievementBadge,
                    {
                      backgroundColor: unlocked ? c.primary + '15' : c.surface,
                      borderColor: unlocked ? c.primary : c.border,
                      opacity: unlocked ? 1 : 0.5,
                    },
                  ]}
                >
                  <Ionicons
                    name={unlocked ? ach.icon as any : 'lock-closed-outline'}
                    size={28}
                    color={unlocked ? c.primary : c.textSecondary}
                  />
                  <Text
                    style={[
                      styles.achievementLabel,
                      { color: unlocked ? c.primary : c.textSecondary },
                    ]}
                    numberOfLines={2}
                  >
                    {getAchievementLabel(ach)}
                  </Text>
                  <Text style={[styles.achievementThreshold, { color: c.textSecondary }]}>
                    {ach.threshold}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Next achievement progress */}
          {nextAchievement && (
            <View style={[styles.nextAchCard, { backgroundColor: c.surface }]}>
              <Text style={[styles.nextAchTitle, { color: c.text }]}>
                {isArabicUI ? 'الإنجاز التالي' : 'Next Achievement'}
              </Text>
              <Text style={[styles.nextAchName, { color: c.primary }]}>
                {getAchievementLabel(nextAchievement)}
              </Text>
              <View style={[styles.progressBar, { backgroundColor: c.ayahBg }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: c.primary,
                      width: `${(allTimeTotal / nextAchievement.threshold) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.nextAchProgress, { color: c.textSecondary }]}>
                {allTimeTotal} / {nextAchievement.threshold}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Add Circle Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: c.surface }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>
              {isArabicUI ? 'إضافة حلقة جديدة' : ui('Add New Circle')}
            </Text>

            <TextInput
              style={[styles.modalInput, { backgroundColor: c.background, color: c.text, borderColor: c.border }]}
              placeholder={isArabicUI ? 'اسم الحلقة' : ui('Circle Name')}
              placeholderTextColor={c.textSecondary}
              value={newName}
              onChangeText={setNewName}
            />

            <TextInput
              style={[styles.modalInput, { backgroundColor: c.background, color: c.text, borderColor: c.border }]}
              placeholder={isArabicUI ? 'العدد المستهدف' : ui('Target Count')}
              placeholderTextColor={c.textSecondary}
              value={newTarget}
              onChangeText={setNewTarget}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: c.border }]}
                onPress={() => { setShowAddModal(false); setNewName(''); setNewTarget('33'); }}
              >
                <Text style={[styles.modalBtnText, { color: c.textSecondary }]}>
                  {isArabicUI ? 'إلغاء' : ui('Cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: c.primary, borderColor: c.primary }]}
                onPress={handleAddCircle}
              >
                <Text style={styles.modalBtnTextWhite}>
                  {isArabicUI ? 'حفظ' : ui('Save')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  tabText: { fontSize: 15, fontWeight: '600' },
  circlesContent: { padding: 16, paddingBottom: 40 },
  statsContent: { padding: 16, paddingBottom: 40 },
  dailyGoalCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  dailyGoalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dailyGoalTitle: { fontSize: 16, fontWeight: '600' },
  dailyGoalValue: { fontSize: 24, fontWeight: '700' },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  dailyGoalStatus: { fontSize: 13 },
  circlesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  circleCard: {
    width: 110,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  addCircleCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  circleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  circleTarget: { fontSize: 11 },
  miniProgressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  circleCurrent: { fontSize: 12, fontWeight: '700' },
  counterContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dhikrLabel: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
  },
  bigCounterCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  bigCountNumber: { fontSize: 60, fontWeight: 'bold' },
  bigCountTarget: { fontSize: 18, marginTop: 4 },
  tapHint: { fontSize: 14, marginBottom: 24 },
  circleStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    width: '100%',
  },
  circleStatBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  circleStatNumber: { fontSize: 24, fontWeight: 'bold' },
  circleStatLabel: { fontSize: 12, marginTop: 4 },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  resetText: { fontSize: 15, fontWeight: '600' },
  statsOverview: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  overviewCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 6,
  },
  overviewNumber: { fontSize: 28, fontWeight: 'bold' },
  overviewLabel: { fontSize: 11, textAlign: 'center' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
  },
  statRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statRowName: { flex: 1, fontSize: 14, fontWeight: '600' },
  statRowToday: { fontSize: 12 },
  statRowTotal: { fontSize: 18, fontWeight: '700' },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  achievementBadge: {
    width: 100,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  achievementLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  achievementThreshold: { fontSize: 10 },
  nextAchCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  nextAchTitle: { fontSize: 14, fontWeight: '600' },
  nextAchName: { fontSize: 18, fontWeight: '700' },
  nextAchProgress: { fontSize: 13 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalBtnText: { fontSize: 16, fontWeight: '600' },
  modalBtnTextWhite: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

export default DhikrCirclesScreen;
