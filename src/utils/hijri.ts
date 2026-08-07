const hijriMonths = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah'
];

const hijriMonthsAr = [
  'مُحَرَّم', 'صَفَر', 'رَبِيع الأَوَّل', 'رَبِيع الثَّانِي',
  'جُمَادَى الأُولَى', 'جُمَادَى الثَّانِيَة', 'رَجَب', 'شَعْبَان',
  'رَمَضَان', 'شَوَّال', 'ذُو الْقِعْدَة', 'ذُو الْحِجَّة'
];

const islamicEvents = [
  { day: 1, month: 1, name_en: 'Islamic New Year', name_ar: 'رأس السنة الهجرية' },
  { day: 10, month: 1, name_en: 'Day of Ashura', name_ar: 'يوم عاشوراء' },
  { day: 12, month: 3, name_en: 'Mawlid an-Nabi (Birth of Prophet)', name_ar: 'المولد النبوي' },
  { day: 27, month: 7, name_en: 'Isra and Mi\'raj (Night Journey)', name_ar: 'الإسراء والمعراج' },
  { day: 15, month: 8, name_en: 'Laylat al-Bara\'at (Night of Forgiveness)', name_ar: 'ليلة البراءة' },
  { day: 1, month: 9, name_en: 'First Day of Ramadan', name_ar: 'أول يوم في رمضان' },
  { day: 27, month: 9, name_en: 'Laylat al-Qadr (Night of Power, estimated)', name_ar: 'ليلة القدر (تقديري)' },
  { day: 1, month: 10, name_en: 'Eid al-Fitr', name_ar: 'عيد الفطر' },
  { day: 9, month: 12, name_en: 'Day of Arafah', name_ar: 'يوم عرفة' },
  { day: 10, month: 12, name_en: 'Eid al-Adha', name_ar: 'عيد الأضحى' },
  { day: 8, month: 12, name_en: 'Hajj begins', name_ar: 'بداية الحج' },
];

export function gregorianToHijri(date: Date): { day: number; month: number; year: number; monthName_en: string; monthName_ar: string } {
  const gy = date.getFullYear();
  const gm = date.getMonth() + 1;
  const gd = date.getDate();

  let jd;
  if (gy > 1582 || (gy === 1582 && gm > 10) || (gy === 1582 && gm === 10 && gd > 14)) {
    jd = Math.floor((1461 * (gy + 4800 + Math.floor((gm - 14) / 12))) / 4) +
         Math.floor((367 * (gm - 2 - 12 * Math.floor((gm - 14) / 12))) / 12) -
         Math.floor((3 * Math.floor((gy + 4900 + Math.floor((gm - 14) / 12)) / 100)) / 4) +
         gd - 32075;
  } else {
    jd = 367 * gy - Math.floor((7 * (gy + 5001 + Math.floor((gm - 9) / 7))) / 4) +
         Math.floor((275 * gm) / 9) + gd + 1729777;
  }

  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
            Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
             Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hm = Math.floor((24 * l3) / 709);
  const hd = l3 - Math.floor((709 * hm) / 24);
  const hy = 30 * n + j - 30;

  const monthIdx = Math.max(0, Math.min(11, hm - 1));

  return {
    day: hd,
    month: hm,
    year: hy,
    monthName_en: hijriMonths[monthIdx],
    monthName_ar: hijriMonthsAr[monthIdx],
  };
}

export function getEventsForHijriMonth(month: number): typeof islamicEvents {
  return islamicEvents.filter(e => e.month === month);
}

export function getUpcomingEvents(date: Date, count: number = 10): Array<{ hijri: string; gregorian: string; name_en: string; name_ar: string; month: number; day: number }> {
  const events: Array<{ hijri: string; gregorian: string; name_en: string; name_ar: string; month: number; day: number }> = [];
  const currentDate = new Date(date);

  for (let i = 0; i < 365 * 2 && events.length < count; i++) {
    const testDate = new Date(currentDate);
    testDate.setDate(testDate.getDate() + i);
    const hijri = gregorianToHijri(testDate);

    const matchingEvents = islamicEvents.filter(
      e => e.day === hijri.day && e.month === hijri.month
    );

    for (const event of matchingEvents) {
      events.push({
        hijri: `${hijri.day} ${hijri.monthName_en} ${hijri.year} AH`,
        gregorian: testDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        name_en: event.name_en,
        name_ar: event.name_ar,
        month: event.month,
        day: event.day,
      });
    }
  }

  return events;
}

export function getHijriYearForGregorian(gy: number): number {
  const date = new Date(gy, 5, 15);
  const hijri = gregorianToHijri(date);
  return hijri.year;
}

export function getIslamicCalendarForYear(hijriYear: number): Array<{ month: number; monthName_en: string; monthName_ar: string; events: typeof islamicEvents }> {
  const calendar = [];
  for (let m = 1; m <= 12; m++) {
    const monthIdx = m - 1;
    calendar.push({
      month: m,
      monthName_en: hijriMonths[monthIdx],
      monthName_ar: hijriMonthsAr[monthIdx],
      events: getEventsForHijriMonth(m),
    });
  }
  return calendar;
}

export { hijriMonths, hijriMonthsAr, islamicEvents };
