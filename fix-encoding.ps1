$files = @(
  "src\i18n\translations.ts",
  "src\services\contentTranslations.ts",
  "src\data\quiz\de.json",
  "src\data\quiz\es.json",
  "src\data\quiz\fr.json",
  "src\data\quiz\pt.json",
  "src\data\quiz\tr.json",
  "src\data\quiz\zh.json"
)

$latin1 = [System.Text.Encoding]::GetEncoding("ISO-8859-1")
$utf8 = New-Object System.Text.UTF8Encoding($false)

foreach ($f in $files) {
  $path = "E:\quran-app\$f"
  if (-not (Test-Path $path)) { Write-Output "SKIP (not found): $f"; continue }
  
  $bytes = [System.IO.File]::ReadAllBytes($path)
  $text = $utf8.GetString($bytes)
  
  # Check if file has BOM and remove it for processing
  $hasBom = $bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF
  if ($hasBom) {
    $text = $utf8.GetString($bytes, 3, $bytes.Length - 3)
  }
  
  # Check for mojibake (characters in U+0080-U+00FF range that shouldn't be there)
  $hasMojibake = $false
  foreach ($c in $text.ToCharArray()) {
    if ([int]$c -ge 128 -and [int]$c -lt 256) { $hasMojibake = $true; break }
  }
  
  if (-not $hasMojibake) {
    Write-Output "SKIP (no mojibake): $f"
    continue
  }
  
  # Reverse the double encoding:
  # 1. Encode current string as Latin-1 to get original UTF-8 bytes
  # 2. Decode those bytes as UTF-8 to get correct text
  $originalBytes = $latin1.GetBytes($text)
  $correctedText = $utf8.GetString($originalBytes)
  
  # Write back as UTF-8 without BOM
  [System.IO.File]::WriteAllText($path, $correctedText, $utf8)
  Write-Output "FIXED: $f"
}

Write-Output "Done!"
