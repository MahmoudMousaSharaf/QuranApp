const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://api.alquran.cloud/v1';
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data', 'quran');

async function downloadAll() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Step 1: Download surah list
  console.log('Downloading surah list...');
  const listRes = await fetch(`${BASE_URL}/surah`);
  const listJson = await listRes.json();
  const surahs = listJson.data;
  
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'surah_list.json'),
    JSON.stringify(surahs.map(s => ({
      number: s.number,
      name: s.name,
      englishName: s.englishName,
      englishNameTranslation: s.englishNameTranslation,
      numberOfAyahs: s.numberOfAyahs,
      revelationType: s.revelationType,
    })))
  );
  console.log(`Saved surah list: ${surahs.length} surahs`);

  // Step 2: Download each surah with Arabic + English
  const allSurahs = {};
  
  for (let i = 1; i <= 114; i++) {
    console.log(`Downloading surah ${i}/114...`);
    try {
      const res = await fetch(`${BASE_URL}/surah/${i}/editions/quran-uthmani,en.sahih`);
      const json = await res.json();
      
      if (json.code === 200 && json.data) {
        const arabic = json.data[0];
        const english = json.data[1];
        
        allSurahs[i] = {
          number: arabic.number,
          name: arabic.name,
          englishName: arabic.englishName,
          englishNameTranslation: arabic.englishNameTranslation,
          numberOfAyahs: arabic.numberOfAyahs,
          revelationType: arabic.revelationType,
          ayahs: arabic.ayahs.map((a, idx) => ({
            number: a.number,
            numberInSurah: a.numberInSurah,
            text: a.text,
            englishText: english.ayahs[idx].text,
          })),
        };
      }
    } catch (err) {
      console.error(`Error downloading surah ${i}:`, err.message);
    }
    
    // Small delay to avoid rate limiting
    if (i % 10 === 0) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  // Save as a single file
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'full_quran.json'),
    JSON.stringify(allSurahs)
  );
  
  const stats = fs.statSync(path.join(OUTPUT_DIR, 'full_quran.json'));
  console.log(`\nDone! Saved full_quran.json (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Total surahs: ${Object.keys(allSurahs).length}`);
}

downloadAll().catch(console.error);
