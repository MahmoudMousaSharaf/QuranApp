import { AppLanguage } from '../i18n/translations';

export const PRAYER_NAMES: Record<AppLanguage, { fajr: string; sunrise: string; dhuhr: string; asr: string; maghrib: string; isha: string }> = {
  ar: { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' },
  en: { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
  zh: { fajr: '晨礼', sunrise: '日出', dhuhr: '晌礼', asr: '晡礼', maghrib: '昏礼', isha: '宵礼' },
  hi: { fajr: 'फज्र', sunrise: 'सूर्योदय', dhuhr: 'ज़ुहर', asr: 'अस्र', maghrib: 'मग़रिब', isha: 'इशा' },
  ru: { fajr: 'Фаджр', sunrise: 'Восход', dhuhr: 'Зухр', asr: 'Аср', maghrib: 'Магриб', isha: 'Иша' },
  ko: { fajr: '파즈르', sunrise: '일출', dhuhr: '두흐르', asr: '아스르', maghrib: '마그리브', isha: '이샤' },
  ja: { fajr: 'ファジュル', sunrise: '日の出', dhuhr: 'ズフル', asr: 'アスル', maghrib: 'マグリブ', isha: 'イシャー' },
  de: { fajr: 'Fadschr', sunrise: 'Sonnenaufgang', dhuhr: 'Zuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
  fr: { fajr: 'Fajr', sunrise: 'Lever du soleil', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
  es: { fajr: 'Fajr', sunrise: 'Amanecer', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
  tr: { fajr: 'Sabah', sunrise: 'Güneş', dhuhr: 'Öğle', asr: 'İkindi', maghrib: 'Akşam', isha: 'Yatsı' },
  ur: { fajr: 'فجر', sunrise: 'طلوع آفتاب', dhuhr: 'ظہر', asr: 'عصر', maghrib: 'مغرب', isha: 'عشاء' },
  id: { fajr: 'Subuh', sunrise: 'Terbit', dhuhr: 'Dzuhur', asr: 'Ashar', maghrib: 'Maghrib', isha: 'Isya' },
  bn: { fajr: 'ফজর', sunrise: 'সূর্যোদয়', dhuhr: 'জোহর', asr: 'আসর', maghrib: 'মাগরিব', isha: 'এশা' },
  pt: { fajr: 'Fajr', sunrise: 'Nascer do sol', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
  ms: { fajr: 'Subuh', sunrise: 'Syuruk', dhuhr: 'Zuhur', asr: 'Asar', maghrib: 'Maghrib', isha: 'Isyak' },
};

export const HIJRI_MONTHS: Record<AppLanguage, string[]> = {
  ar: ['محرّم', 'صفر', 'ربيع الأول', 'ربيع الثاني', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوّال', 'ذو القعدة', 'ذو الحجة'],
  en: ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah'],
  zh: ['穆哈兰', '萨法尔', '莱比尔·奥瓦尔', '莱比尔·萨尼', '主马达·奥瓦尔', '主马达·萨尼', '赖哲卜', '舍尔邦', '莱麦丹', '肖瓦尔', '祖勒·格尔德', '祖勒·希哲'],
  hi: ['मुहर्रम', 'सफर', 'रबी उल अव्वल', 'रबी उस सानी', 'जुमादा उल अव्वल', 'जुमादा उस सानी', 'रजब', "शा'बान", 'रमज़ान', 'शव्वाल', 'ज़ु अल-क़ादा', 'ज़ु अल-हिज्जा'],
  ru: ['Мухаррам', 'Сафар', 'Раби аль-авваль', 'Раби ас-сани', 'Джумада аль-авваль', 'Джумада ас-сани', 'Раджаб', 'Шаабан', 'Рамадан', 'Шавваль', 'Зу-ль-каада', 'Зу-ль-хиджжа'],
  ko: ['무하람', '사파르', '라비 알 아왈', '라비 알 타니', '주마다 알 아왈', '주마다 알 타니', '라자브', "샤'반", '라마단', '샤왈', '두 알 키다', '두 알 히자'],
  ja: ['ムハッラム', 'サファル', 'ラビー・アル＝アウワル', 'ラビー・アル＝サーニー', 'ジュマーダー・アル＝アウワル', 'ジュマーダー・アル＝サーニー', 'ラジャブ', "シャアバーン", 'ラマダーン', 'シャッワール', 'ズー・アル＝カアダ', 'ズー・アル＝ヒッジャ'],
  de: ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi ath-Thani', 'Dschumada al-Awwal', 'Dschumada ath-Thani', 'Rajab', "Sha'ban", 'Ramadan', 'Schawwal', 'Dhu al-Qida', 'Dhu al-Hidschda'],
  fr: ['Mouharram', 'Safar', 'Rabi al-Awwal', 'Rabi ath-Thani', 'Joumada al-Oula', 'Joumada ath-Thania', 'Rajab', "Cha'ban", 'Ramadan', 'Chawwal', 'Dhou al-Qida', 'Dhou al-Hijja'],
  es: ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi ath-Thani', 'Yumada al-Awwal', 'Yumada ath-Thani', 'Rayab', "Sha'ban", 'Ramadan', 'Shawwal', 'Dhu al-Qida', 'Dhu al-Hiyya'],
  tr: ['Muharrem', 'Safer', 'Rebiülevvel', 'Rebiülahir', 'Cemaziyelevvel', 'Cemaziyelahir', 'Recep', 'Şaban', 'Ramazan', 'Şevval', 'Zilkade', 'Zilhicce'],
  ur: ['محرم', 'صفر', 'ربیع الاول', 'ربیع الثانی', 'جمادی الاولی', 'جمادی الثانیہ', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدہ', 'ذو الحجہ'],
  id: ['Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir', 'Jumadil Awal', 'Jumadil Akhir', 'Rajab', "Sya'ban", 'Ramadhan', 'Syawal', 'Dzulqaidah', 'Dzulhijjah'],
  bn: ['মুহররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি', 'জুমাদাউল আউয়াল', 'জুমাদাউস সানি', 'রজব', "শা'বান", 'রমজান', 'শাওয়াল', 'জিলকাদ', 'জিলহজ'],
  pt: ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi ath-Thani', 'Jumada al-Awwal', 'Jumada ath-Thani', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', 'Dhu al-Qida', 'Dhu al-Hijja'],
  ms: ['Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir', 'Jumadil Awal', 'Jumadil Akhir', 'Rejab', "Sya'ban", 'Ramadan', 'Syawal', 'Zulkaedah', 'Zulhijjah'],
};

export const HIJRI_SUFFIX: Record<AppLanguage, string> = {
  ar: 'هـ',
  en: 'AH',
  zh: 'AH',
  hi: 'AH',
  ru: 'AH',
  ko: 'AH',
  ja: 'AH',
  de: 'AH',
  fr: 'AH',
  es: 'AH',
  tr: 'AH',
  ur: 'ھ',
  id: 'H',
  bn: 'হিজরি',
  pt: 'AH',
  ms: 'H',
};

export function getPrayerNames(lang: AppLanguage) {
  return PRAYER_NAMES[lang] || PRAYER_NAMES.en;
}

export function getHijriMonthName(lang: AppLanguage, monthIndex: number): string {
  const months = HIJRI_MONTHS[lang] || HIJRI_MONTHS.en;
  return months[Math.max(0, Math.min(11, monthIndex))];
}

export function getHijriSuffix(lang: AppLanguage): string {
  return HIJRI_SUFFIX[lang] || 'AH';
}
