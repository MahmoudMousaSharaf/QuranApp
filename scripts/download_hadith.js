const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';
const NAWAWI_API = 'https://uthumany.github.io/nawawi-40-hadiths/api/hadiths.json';
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'data');

async function downloadAll() {
  const allData = {};

  // 1. Download Nawawi 40 from the dedicated API (better text with narrator + source)
  console.log('Downloading 40 Hadith Nawawi (dedicated API)...');
  try {
    const nawawiRes = await fetch(NAWAWI_API).then(r => r.json());
    const hadiths = nawawiRes.hadiths.map(h => ({
      number: h.hadith_number,
      title: h.title || '',
      narrator: h.narrator || '',
      source: h.source || '',
      arabic: h.arabic_text || '',
      english: h.english_translation || '',
    }));
    allData.nawawi40 = {
      name_ar: 'الأربعون النووية',
      name_en: '40 Hadith of Imam Nawawi',
      count: hadiths.length,
      hadiths,
    };
    console.log(`  Downloaded ${hadiths.length} hadiths`);
  } catch (err) {
    console.error('  Nawawi API failed, trying CDN...', err.message);
    const [arRes, enRes] = await Promise.all([
      fetch(`${BASE_URL}/ara-nawawi.min.json`).then(r => r.json()),
      fetch(`${BASE_URL}/eng-nawawi.min.json`).then(r => r.json()),
    ]);
    const hadiths = arRes.hadiths.map((h, i) => ({
      number: h.hadithnumber,
      title: '',
      narrator: '',
      source: '',
      arabic: h.text || '',
      english: enRes.hadiths[i]?.text || '',
    }));
    allData.nawawi40 = {
      name_ar: 'الأربعون النووية',
      name_en: '40 Hadith of Imam Nawawi',
      count: hadiths.length,
      hadiths,
    };
    console.log(`  Downloaded ${hadiths.length} hadiths (CDN)`);
  }

  // 2. Download 40 Hadith Qudsi from CDN
  console.log('Downloading 40 Hadith Qudsi...');
  try {
    const [arRes, enRes] = await Promise.all([
      fetch(`${BASE_URL}/ara-qudsi.min.json`).then(r => r.json()),
      fetch(`${BASE_URL}/eng-qudsi.min.json`).then(r => r.json()),
    ]);
    const hadiths = arRes.hadiths.map((h, i) => ({
      number: h.hadithnumber,
      title: '',
      narrator: '',
      source: '',
      arabic: h.text || '',
      english: enRes.hadiths[i]?.text || '',
    }));
    allData.qudsi40 = {
      name_ar: 'الأحاديث القدسية',
      name_en: '40 Hadith Qudsi',
      count: hadiths.length,
      hadiths,
    };
    console.log(`  Downloaded ${hadiths.length} hadiths`);
  } catch (err) {
    console.error('  Qudsi failed:', err.message);
  }

  // 3. Download first 100 Bukhari hadiths
  console.log('Downloading Sahih al-Bukhari (100 hadiths)...');
  try {
    const [arRes, enRes] = await Promise.all([
      fetch(`${BASE_URL}/ara-bukhari.min.json`).then(r => r.json()),
      fetch(`${BASE_URL}/eng-bukhari.min.json`).then(r => r.json()),
    ]);
    const hadiths = arRes.hadiths.slice(0, 100).map((h, i) => ({
      number: h.hadithnumber,
      title: '',
      narrator: '',
      source: 'Sahih al-Bukhari',
      arabic: h.text || '',
      english: enRes.hadiths[i]?.text || '',
    }));
    allData.bukhari = {
      name_ar: 'صحيح البخاري',
      name_en: 'Sahih al-Bukhari',
      count: hadiths.length,
      hadiths,
    };
    console.log(`  Downloaded ${hadiths.length} hadiths`);
  } catch (err) {
    console.error('  Bukhari failed:', err.message);
  }

  // 4. Download first 100 Muslim hadiths
  console.log('Downloading Sahih Muslim (100 hadiths)...');
  try {
    const [arRes, enRes] = await Promise.all([
      fetch(`${BASE_URL}/ara-muslim.min.json`).then(r => r.json()),
      fetch(`${BASE_URL}/eng-muslim.min.json`).then(r => r.json()),
    ]);
    const hadiths = arRes.hadiths.slice(0, 100).map((h, i) => ({
      number: h.hadithnumber,
      title: '',
      narrator: '',
      source: 'Sahih Muslim',
      arabic: h.text || '',
      english: enRes.hadiths[i]?.text || '',
    }));
    allData.muslim = {
      name_ar: 'صحيح مسلم',
      name_en: 'Sahih Muslim',
      count: hadiths.length,
      hadiths,
    };
    console.log(`  Downloaded ${hadiths.length} hadiths`);
  } catch (err) {
    console.error('  Muslim failed:', err.message);
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'hadith_offline.json'),
    JSON.stringify(allData)
  );

  const stats = fs.statSync(path.join(OUTPUT_DIR, 'hadith_offline.json'));
  console.log(`\nDone! Saved hadith_offline.json (${(stats.size / 1024).toFixed(0)} KB)`);
  for (const [id, data] of Object.entries(allData)) {
    console.log(`  ${id}: ${data.count} hadiths`);
  }
  console.log(`Total: ${Object.values(allData).reduce((s, b) => s + b.count, 0)} hadiths`);
}

downloadAll().catch(console.error);
