# Exports a PowerPoint deck to slide images, a PDF, and a slide list (for alt text).
# Called by export-slides.mjs. Requires PowerPoint on Windows.
param(
  [Parameter(Mandatory)] [string] $Deck,
  [Parameter(Mandatory)] [string] $OutDir,
  [Parameter(Mandatory)] [string] $PdfName
)
$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force $OutDir | Out-Null
Get-ChildItem $OutDir -Include 'slide-*.png', 'slide-*.webp', '*.pdf', 'slides.json' -Recurse | Remove-Item -Force

$app = New-Object -ComObject PowerPoint.Application
try {
  $pres = $app.Presentations.Open((Resolve-Path $Deck).Path, $true, $false, $false)
  $slides = @()
  foreach ($s in $pres.Slides) {
    $file = 'slide-{0:D2}' -f $s.SlideIndex
    $s.Export((Join-Path $OutDir "$file.png"), 'PNG', 1600, 900)
    $texts = @()
    foreach ($sh in $s.Shapes) {
      if ($sh.HasTextFrame -and $sh.TextFrame.HasText) { $texts += ($sh.TextFrame.TextRange.Text -replace '\s+', ' ').Trim() }
    }
    $slides += [ordered]@{ file = "$file.webp"; text = (($texts | Select-Object -First 3) -join ' - ') }
  }
  $pres.SaveAs((Join-Path $OutDir $PdfName), 32)
  $pres.Close()
  ConvertTo-Json -InputObject @($slides) -Depth 3 | Set-Content -Encoding utf8 (Join-Path $OutDir 'slides.json')
  Write-Output "Exported $($slides.Count) slides"
} finally {
  $app.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($app) | Out-Null
}
