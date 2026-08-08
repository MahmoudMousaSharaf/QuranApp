import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { getDailyTaskTranslation, DAILY_TASKS } from '../i18n/dailyTasks';
import { scheduleDailyTaskReminders } from '../services/dailyTaskNotifications';

const DAILY_TASKS_KEY = '@daily_tasks_progress';
const DAILY_TASKS_DATE_KEY = '@daily_tasks_date';

interface DailyTasksScreenProps {
  onBack: () => void;
}

const DailyTasksScreen: React.FC<DailyTasksScreenProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const { t, appLanguage } = useLanguage();
  const c = colors[theme];
  const isArabic = appLanguage === 'ar';

  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [taskDate, setTaskDate] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const todayStr = new Date().toDateString();

  const tt = (key: string) => getDailyTaskTranslation(appLanguage, key);

  useEffect(() => {
    loadTasks();
    scheduleDailyTaskReminders(appLanguage).catch((e) => console.log('Daily task reminders error:', e));
  }, [appLanguage]);

  const loadTasks = async () => {
    try {
      const [savedTasks, savedDate] = await Promise.all([
        AsyncStorage.getItem(DAILY_TASKS_KEY),
        AsyncStorage.getItem(DAILY_TASKS_DATE_KEY),
      ]);

      if (savedDate !== todayStr) {
        setCompletedTasks({});
        setTaskDate(todayStr);
        await AsyncStorage.removeItem(DAILY_TASKS_KEY);
        await AsyncStorage.setItem(DAILY_TASKS_DATE_KEY, todayStr);
      } else if (savedTasks) {
        setCompletedTasks(JSON.parse(savedTasks));
      }
    } catch (e) {
      console.error('Failed to load daily tasks:', e);
    }
  };

  const toggleTask = async (taskId: string) => {
    const newCompleted = { ...completedTasks, [taskId]: !completedTasks[taskId] };
    if (newCompleted[taskId] === false) delete newCompleted[taskId];
    setCompletedTasks(newCompleted);
    try {
      await AsyncStorage.setItem(DAILY_TASKS_KEY, JSON.stringify(newCompleted));
      await AsyncStorage.setItem(DAILY_TASKS_DATE_KEY, todayStr);
    } catch (e) {
      console.error('Failed to save daily task:', e);
    }
  };

  const completedCount = Object.keys(completedTasks).filter((k) => completedTasks[k]).length;
  const totalCount = DAILY_TASKS.length;
  const progressPercent = (completedCount / totalCount) * 100;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTasks();
    setRefreshing(false);
  }, []);

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
          <Text style={styles.headerTitle}>{tt('dailyTasksTitle')}</Text>
          <View style={{ width: 28 }} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0d9488']} />
        }
      >
        {/* Progress Card */}
        <View style={[styles.progressCard, { backgroundColor: c.surface }]}>
          <View style={styles.progressHeader}>
            <View style={styles.progressIconContainer}>
              <LinearGradient colors={['#0d9488', '#14b8a6']} style={styles.progressIcon}>
                <Ionicons name="checkmark-done" size={28} color="#fff" />
              </LinearGradient>
            </View>
            <View style={styles.progressInfo}>
              <Text style={[styles.progressTitle, { color: c.text }]}>
                {tt('dailyTasksProgress')}: {completedCount}/{totalCount}
              </Text>
              <Text style={[styles.progressSubtitle, { color: c.textSecondary }]}>
                {totalCount - completedCount} {tt('dailyTasksRemaining')}
              </Text>
            </View>
          </View>

          <View style={[styles.progressBar, { backgroundColor: c.surfaceAlt }]}>
            <LinearGradient
              colors={['#0d9488', '#14b8a6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progressPercent}%` }]}
            />
          </View>

          {completedCount === totalCount && (
            <View style={styles.allDoneBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.allDoneText}>{tt('dailyTasksAllDone')}</Text>
            </View>
          )}

          <Text style={[styles.resetNote, { color: c.textSecondary }]}>
            {tt('dailyTasksReset')}
          </Text>
        </View>

        {/* Task List */}
        {DAILY_TASKS.map((task) => {
          const isDone = !!completedTasks[task.id];
          return (
            <TouchableOpacity
              key={task.id}
              onPress={() => toggleTask(task.id)}
              activeOpacity={0.7}
              style={[
                styles.taskItem,
                {
                  backgroundColor: isDone ? c.ayahBg : c.surface,
                  borderColor: isDone ? '#10b981' : c.border,
                },
              ]}
            >
              <View style={[
                styles.taskCheckbox,
                { backgroundColor: isDone ? '#10b981' : 'transparent', borderColor: isDone ? '#10b981' : c.textSecondary },
              ]}>
                {isDone && <Ionicons name="checkmark" size={18} color="#fff" />}
              </View>

              <View style={styles.taskContent}>
                <View style={styles.taskHeaderRow}>
                  <Ionicons
                    name={task.icon as any}
                    size={20}
                    color={isDone ? '#10b981' : c.primary}
                    style={styles.taskIcon}
                  />
                  <Text
                    style={[
                      styles.taskTitle,
                      { color: isDone ? c.textSecondary : c.text },
                      isDone && styles.taskTitleDone,
                    ]}
                  >
                    {tt(task.taskKey)}
                  </Text>
                </View>
                <Text style={[styles.taskTime, { color: c.textSecondary }]}>
                  {task.time}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
  progressCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  progressIconContainer: { marginRight: 14 },
  progressIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressInfo: { flex: 1 },
  progressTitle: { fontSize: 18, fontWeight: '700' },
  progressSubtitle: { fontSize: 13, marginTop: 4 },
  progressBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  allDoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
  },
  allDoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10b981',
    flex: 1,
  },
  resetNote: {
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1.5,
  },
  taskCheckbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  taskContent: { flex: 1 },
  taskHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskIcon: { marginRight: 8 },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
  },
  taskTime: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 28,
  },
});

export default DailyTasksScreen;
