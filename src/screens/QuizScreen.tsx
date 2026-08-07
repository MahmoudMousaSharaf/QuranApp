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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { quizQuestions, QuizQuestion } from '../data/quizData';
import { loadQuizTranslations, getLocalizedQuestion, QuizTranslations } from '../data/quiz';

const QUIZ_PROGRESS_KEY = '@quiz_progress';
const QUIZ_ANSWERED_KEY = '@quiz_answered';

interface QuizScreenProps {
  onBack: () => void;
}

const QuizScreen: React.FC<QuizScreenProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const { t, appLanguage } = useLanguage();
  const c = colors[theme];

  const isRTL = appLanguage === 'ar' || appLanguage === 'ur';

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answeredIds, setAnsweredIds] = useState<number[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [quizTranslations, setQuizTranslations] = useState<QuizTranslations | null>(null);

  const categories = Array.from(new Set(quizQuestions.map((q) => q.category)));
  const categoryTranslationKey: Record<string, string> = {
    Quran: 'catQuran',
    Prophets: 'catProphets',
    Prayer: 'catPrayer',
    Fasting: 'catFasting',
    Zakat: 'catZakat',
    Hajj: 'catHajj',
    History: 'catHistory',
    Beliefs: 'catBeliefs',
  };

  const filteredQuestions = filterCategory
    ? quizQuestions.filter((q) => q.category === filterCategory)
    : quizQuestions;

  const currentQuestion: QuizQuestion | undefined = filteredQuestions[currentIndex];

  useEffect(() => {
    loadProgress();
  }, []);

  useEffect(() => {
    loadQuizTranslations(appLanguage).then(setQuizTranslations);
  }, [appLanguage]);

  const loadProgress = async () => {
    try {
      const data = await AsyncStorage.getItem(QUIZ_ANSWERED_KEY);
      if (data) {
        const parsed: number[] = JSON.parse(data);
        setAnsweredIds(parsed);
        setCorrectCount(parsed.length);
      }
    } catch (e) {
      console.error('Failed to load quiz progress:', e);
    }
  };

  const saveProgress = async (id: number) => {
    try {
      const updated = [...answeredIds, id];
      setAnsweredIds(updated);
      await AsyncStorage.setItem(QUIZ_ANSWERED_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save quiz progress:', e);
    }
  };

  const handleSelectAnswer = (index: number) => {
    if (showResult || !currentQuestion) return;
    setSelectedAnswer(index);
    setShowResult(true);
    if (!answeredIds.includes(currentQuestion.id)) {
      saveProgress(currentQuestion.id);
      if (index === currentQuestion.correct) {
        setCorrectCount((prev) => prev + 1);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      t('resetQuiz'),
      t('resetConfirmMsg'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('yes'),
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(QUIZ_ANSWERED_KEY);
            setAnsweredIds([]);
            setCorrectCount(0);
            setCurrentIndex(0);
            setSelectedAnswer(null);
            setShowResult(false);
          },
        },
      ]
    );
  };

  const handleCategoryFilter = (cat: string | null) => {
    setFilterCategory(cat);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  if (!currentQuestion) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Text style={{ color: c.text, textAlign: 'center', marginTop: 50 }}>
          {t('noQuestionsAvailable')}
        </Text>
      </View>
    );
  }

  const progress = ((currentIndex + 1) / filteredQuestions.length) * 100;
  const isAnswered = answeredIds.includes(currentQuestion.id);
  const isCorrect = selectedAnswer === currentQuestion.correct;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={c.headerBg} />

      <View style={[styles.header, { backgroundColor: c.headerBg }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('quiz100Title')}
        </Text>
        <TouchableOpacity onPress={handleReset} style={styles.resetBtn}>
          <Ionicons name="refresh" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryBar}
        contentContainerStyle={styles.categoryBarContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            { backgroundColor: filterCategory === null ? c.primary : c.surface, borderColor: c.border },
          ]}
          onPress={() => handleCategoryFilter(null)}
        >
          <Text style={{ color: filterCategory === null ? '#fff' : c.text, fontSize: 12, fontWeight: '600' }}>
            {t('all')}
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              { backgroundColor: filterCategory === cat ? c.primary : c.surface, borderColor: c.border },
            ]}
            onPress={() => handleCategoryFilter(cat)}
          >
            <Text style={{ color: filterCategory === cat ? '#fff' : c.text, fontSize: 12, fontWeight: '600' }}>
              {t(categoryTranslationKey[cat] as any) || cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressInfo}>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>
            {`${t('questionXOfY')} ${currentIndex + 1} ${isRTL ? 'من' : 'of'} ${filteredQuestions.length}`}
          </Text>
          <Text style={{ color: c.primary, fontSize: 12, fontWeight: '700' }}>
            {`${t('answeredCount')}: ${answeredIds.length}`}
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: c.surfaceAlt }]}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: c.primary }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Question Card */}
        <View style={[styles.questionCard, { backgroundColor: c.surface }]}>
          <View style={styles.questionHeader}>
            <View style={[styles.categoryBadge, { backgroundColor: c.primary }]}>
              <Text style={styles.categoryBadgeText}>
                {getLocalizedQuestion(currentQuestion, appLanguage, quizTranslations).category}
              </Text>
            </View>
            <Text style={{ color: c.textSecondary, fontSize: 12 }}>
              #{currentQuestion.id}
            </Text>
          </View>

          <Text style={[styles.questionText, { color: c.text }]}>
            {getLocalizedQuestion(currentQuestion, appLanguage, quizTranslations).question}
          </Text>

          {appLanguage === 'ar' && (
            <Text style={[styles.questionTextEn, { color: c.textSecondary }]}>
              {currentQuestion.question_en}
            </Text>
          )}

          {/* Options */}
          <View style={styles.optionsContainer}>
            {getLocalizedQuestion(currentQuestion, appLanguage, quizTranslations).options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectOption = index === currentQuestion.correct;
              const showCorrect = showResult && isCorrectOption;
              const showWrong = showResult && isSelected && !isCorrectOption;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionBtn,
                    {
                      backgroundColor: showCorrect
                        ? '#10b981'
                        : showWrong
                        ? '#ef4444'
                        : isSelected
                        ? c.primary
                        : c.surfaceAlt,
                      borderColor: showCorrect
                        ? '#10b981'
                        : showWrong
                        ? '#ef4444'
                        : isSelected
                        ? c.primary
                        : c.border,
                    },
                  ]}
                  onPress={() => handleSelectAnswer(index)}
                  disabled={showResult}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: showCorrect || showWrong || isSelected ? '#fff' : c.text,
                      fontSize: 14,
                      fontWeight: '500',
                      flex: 1,
                    }}
                  >
                    {option}
                  </Text>
                  {showCorrect && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
                  {showWrong && <Ionicons name="close-circle" size={20} color="#fff" />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Result & Reference */}
          {showResult && (
            <View style={styles.resultContainer}>
              <View
                style={[
                  styles.resultBanner,
                  { backgroundColor: isCorrect ? '#10b981' : '#ef4444' },
                ]}
              >
                <Ionicons
                  name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                  size={24}
                  color="#fff"
                />
                <Text style={styles.resultText}>
                  {isCorrect ? t('correct') : t('incorrect')}
                </Text>
              </View>

              <View style={[styles.referenceBox, { backgroundColor: c.ayahBg, borderLeftColor: c.primary }]}>
                <View style={styles.referenceHeader}>
                  <Ionicons name="bookmarks" size={14} color={c.primary} />
                  <Text style={{ color: c.primary, fontSize: 12, fontWeight: '700' }}>
                    {t('reference')}
                  </Text>
                </View>
                <Text style={[styles.referenceText, { color: c.textSecondary }]}>
                  {getLocalizedQuestion(currentQuestion, appLanguage, quizTranslations).reference}
                </Text>
                {appLanguage === 'ar' && (
                  <Text style={[styles.referenceTextEn, { color: c.textSecondary }]}>
                    {currentQuestion.reference_en}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navButtons}>
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: c.surface, borderColor: c.border }, currentIndex === 0 && styles.navBtnDisabled]}
            onPress={handlePrev}
            disabled={currentIndex === 0}
          >
            <Ionicons name="chevron-back" size={20} color={currentIndex === 0 ? c.textSecondary : c.text} />
            <Text style={{ color: currentIndex === 0 ? c.textSecondary : c.text, fontSize: 14 }}>
              {t('prev')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: c.primary }, currentIndex === filteredQuestions.length - 1 && styles.navBtnDisabled]}
            onPress={handleNext}
            disabled={currentIndex === filteredQuestions.length - 1}
          >
            <Text style={{ color: currentIndex === filteredQuestions.length - 1 ? 'rgba(255,255,255,0.5)' : '#fff', fontSize: 14 }}>
              {t('next')}
            </Text>
            <Ionicons name="chevron-forward" size={20} color={currentIndex === filteredQuestions.length - 1 ? 'rgba(255,255,255,0.5)' : '#fff'} />
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
  resetBtn: { padding: 4 },
  categoryBar: {
    maxHeight: 44,
    paddingVertical: 6,
  },
  categoryBarContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  content: {
    padding: 16,
  },
  questionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 8,
  },
  questionTextEn: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  optionsContainer: {
    gap: 10,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  resultContainer: {
    marginTop: 16,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  resultText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  referenceBox: {
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 3,
  },
  referenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  referenceText: {
    fontSize: 13,
    lineHeight: 20,
  },
  referenceTextEn: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    fontStyle: 'italic',
  },
  navButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
});

export default QuizScreen;
