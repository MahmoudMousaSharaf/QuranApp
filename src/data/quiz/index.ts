import { AppLanguage } from '../../i18n/translations';
import { QuizQuestion } from '../quizData';

import bnTranslations from './bn.json';
import deTranslations from './de.json';
import esTranslations from './es.json';
import frTranslations from './fr.json';
import hiTranslations from './hi.json';
import idTranslations from './id.json';
import jaTranslations from './ja.json';
import koTranslations from './ko.json';
import msTranslations from './ms.json';
import ptTranslations from './pt.json';
import ruTranslations from './ru.json';
import trTranslations from './tr.json';
import urTranslations from './ur.json';
import zhTranslations from './zh.json';

export interface QuizTranslation {
  category: string;
  question: string;
  options: string[];
  reference: string;
}

export type QuizTranslations = Record<number, QuizTranslation>;

export interface LocalizedQuizContent {
  category: string;
  question: string;
  options: string[];
  reference: string;
}

const staticTranslations: Partial<Record<AppLanguage, QuizTranslations>> = {
  bn: bnTranslations as QuizTranslations,
  de: deTranslations as QuizTranslations,
  es: esTranslations as QuizTranslations,
  fr: frTranslations as QuizTranslations,
  hi: hiTranslations as QuizTranslations,
  id: idTranslations as QuizTranslations,
  ja: jaTranslations as QuizTranslations,
  ko: koTranslations as QuizTranslations,
  ms: msTranslations as QuizTranslations,
  pt: ptTranslations as QuizTranslations,
  ru: ruTranslations as QuizTranslations,
  tr: trTranslations as QuizTranslations,
  ur: urTranslations as QuizTranslations,
  zh: zhTranslations as QuizTranslations,
};

export async function loadQuizTranslations(lang: AppLanguage): Promise<QuizTranslations | null> {
  if (lang === 'en' || lang === 'ar') return null;
  return staticTranslations[lang] ?? null;
}

export function getQuizTranslation(
  lang: AppLanguage,
  translations: QuizTranslations | null,
  questionId: number
): QuizTranslation | null {
  if (!translations) return null;
  return translations[questionId] ?? null;
}

export function getLocalizedQuestion(
  question: QuizQuestion,
  lang: AppLanguage,
  translations: QuizTranslations | null
): LocalizedQuizContent {
  if (lang === 'ar') {
    return {
      category: question.category_ar,
      question: question.question_ar,
      options: question.options_ar,
      reference: question.reference_ar,
    };
  }
  if (lang !== 'en' && translations) {
    const tr = translations[question.id];
    if (tr) {
      return {
        category: tr.category,
        question: tr.question,
        options: tr.options,
        reference: tr.reference,
      };
    }
  }
  return {
    category: question.category,
    question: question.question_en,
    options: question.options_en,
    reference: question.reference_en,
  };
}
