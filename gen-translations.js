const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'i18n', 'translations.ts');
const content = fs.readFileSync(filePath, 'utf8');

// Keep header (lines 1-195) and footer (lines 2518+)
const lines = content.split('\n');
const header = lines.slice(0, 194).join('\n'); // lines 1-195 (0-indexed 0-194)
const footer = lines.slice(2517).join('\n'); // lines 2518+ (0-indexed 2517+)

const T = {};

// Helper: all keys in order
const keys = [
  'appTitle','appSubtitle','loadingQuran','holyQuran','scientificMiracles','prayerTimes',
  'qibla','islamicMonths','hadith','azkar','prophetSunnah','questionsAnswers','bookmarks',
  'supportUs','aboutUs','back','selectLanguage','quranSubtitle','miraclesSubtitle',
  'prayerSubtitle','qiblaSubtitle','monthsSubtitle','hadithSubtitle','azkarSubtitle',
  'tasbih','tasbihSubtitle','quranAudio','quranAudioSubtitle','sunnahSubtitle','qaSubtitle',
  'bookmarksSubtitle','supportSubtitle','aboutSubtitle','supportTitle','supportViaShegoz',
  'supportViaGuidano','jazakumAllahuKhairan','howToUse','hadithCollections',
  'worksOfflineHadith','supplications','sunnahs','scientificReference','reference',
  'loadingSurahs','searchSurah','noSurahFound','ayahs','holyQuranSubtitle2','today',
  'monthsTab','upcomingEventsTab','selectCountry','searchCountry','loadingSurah',
  'previous','next','sajda','loading','search','surah','ayah','noBookmarks','bookmarkHint',
  'completeQuranApp','ourMission','youtubeChannel','ourFirstProject','ourSecondProject',
  'versionLabel','locationPermissionTitle','locationPermissionMsg','calculatingPrayer',
  'determiningQibla','qiblaAngleFromNorth','yourHeading','facingQibla','distanceToKaaba',
  'howToUse','couldNotDetermineLocation','compassNotAvailable','qiblaNote','km',
  'calibrateCompass','qiblaInstructionsSensor','dhikrCircles','dhikrCirclesSubtitle',
  'quiz100','quiz100Subtitle','progressTracking','progressTrackingSubtitle','userName',
  'tapToAddName','enterYourName','notice','pleaseEnterName','yourLevel','questions',
  'questionsToNext','statistics','questionsAnswered','bookmarksCount','lastSurahRead',
  'backupRestore','backupDesc','export','import','exported','fileSavedTo','error',
  'failedExport','importData','importConfirmMsg','cancel','success','dataImportedSuccess',
  'failedImport','failedReadFile','invalidFileFormat','tierBeginner','tierSeeker',
  'tierStudent','tierScholar','tierExpert','tierHafiz','quiz100Title','all',
  'questionXOfY','answeredCount','correct','incorrect','reference','prev','next',
  'resetQuiz','resetConfirmMsg','yes','noQuestionsAvailable','catQuran','catProphets',
  'catPrayer','catFasting','catZakat','catHajj','catHistory','catBeliefs'
];

// Load language data from separate JSON files
const langData = {};
for (const lang of ['en','ar','zh','hi','ru','ko','ja','de','fr','es','tr','ur','id','bn','pt','ms']) {
  const fpath = path.join(__dirname, 'lang-data', lang + '.json');
  langData[lang] = JSON.parse(fs.readFileSync(fpath, 'utf8'));
}

// Build the TypeScript output
let output = header + '\n';
output += 'export const translationData: Record<AppLanguage, Translations> = {\n';

for (const lang of Object.keys(langData)) {
  output += `  ${lang}: {\n`;
  const data = langData[lang];
  for (const key of keys) {
    if (data[key] !== undefined) {
      const val = data[key].replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      output += `    ${key}: '${val}',\n`;
    }
  }
  output += '  },\n';
}

output += '};\n\n';
output += footer;

fs.writeFileSync(filePath, output, 'utf8');
console.log('Done! translations.ts rebuilt successfully.');
