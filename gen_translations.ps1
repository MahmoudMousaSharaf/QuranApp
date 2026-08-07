# This script generates the translation blocks for each language
# We'll read the translations.ts file, find each progressTrackingSubtitle line, 
# and insert the new keys after it

$file = 'E:\quran-app\src\i18n\translations.ts'
$content = Get-Content $file -Raw -Encoding UTF8

# Define translations for each language
# Format: @lang => @{ keys = @{ key = value } }
$langs = @(
    @{lang='ar'; subs=@(
        "userName: 'اسم المستخدم',",
        "tapToAddName: 'اضغط لإضافة اسمك',",
        "enterYourName: 'أدخل اسمك',",
        "notice: 'تنبيه',",
        "pleaseEnterName: 'الرجاء إدخال اسم',",
        "yourLevel: 'المستوى',",
        "questions: 'سؤال',",
        "questionsToNext: 'سؤال للمستوى التالي',",
        "statistics: 'الإحصائيات',",
        "questionsAnswered: 'الأسئلة المجاب عنها',",
        "bookmarksCount: 'الإشارات المرجعية',",
        "lastSurahRead: 'آخر سورة مقروءة',",
        "backupRestore: 'النسخ الاحتياطي',",
        "backupDesc: 'صدّر تقدمك والإشارات المرجعية والبيانات إلى ملف، أو استوردها على جهاز آخر.',",
        "export: 'تصدير',",
        "import: 'استيراد',",
        "exported: 'تم التصدير',",
        "fileSavedTo: 'تم حفظ الملف في:',",
        "error: 'خطأ',",
        "failedExport: 'فشل تصدير البيانات',",
        "importData: 'استيراد البيانات',",
        "importConfirmMsg: 'سيتم استبدال بياناتك الحالية. هل تريد المتابعة؟',",
        "cancel: 'إلغاء',",
        "success: 'تم',",
        "dataImportedSuccess: 'تم استيراد البيانات بنجاح',",
        "failedImport: 'فشل استيراد البيانات',",
        "failedReadFile: 'فشل قراءة الملف',",
        "invalidFileFormat: 'ملف غير صالح',",
        "tierBeginner: 'مبتدئ',",
        "tierSeeker: 'طالب علم',",
        "tierStudent: 'طالب',",
        "tierScholar: 'عالم',",
        "tierExpert: 'خبير',",
        "tierHafiz: 'حافظ',",
        "quiz100Title: '١٠٠ سؤال وجواب',",
        "all: 'الكل',",
        "questionXOfY: 'السؤال',",
        "answeredCount: 'أُجيب',",
        "correct: 'إجابة صحيحة!',",
        "incorrect: 'إجابة خاطئة',",
        "reference: 'المرجع',",
        "prev: 'السابق',",
        "next: 'التالي',",
        "resetQuiz: 'إعادة التعيين',",
        "resetConfirmMsg: 'هل أنت متأكد من إعادة تعيين التقدم؟',",
        "yes: 'نعم',",
        "noQuestionsAvailable: 'لا توجد أسئلة',",
        "catQuran: 'القرآن',",
        "catProphets: 'الأنبياء',",
        "catPrayer: 'الصلاة',",
        "catFasting: 'الصيام',",
        "catZakat: 'الزكاة',",
        "catHajj: 'الحج',",
        "catHistory: 'التاريخ',",
        "catBeliefs: 'العقيدة',"
    )}
)

# Output the Arabic translations for verification
$langs[0].subs | Out-File 'E:\quran-app\ar_translations.txt' -Encoding utf8
Write-Output "Done - check ar_translations.txt"
