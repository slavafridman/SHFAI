param(
    [ValidateSet('Build', 'Validate')]
    [string]$Mode = 'Build'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$cache = Join-Path $env:TEMP 'SHF-WordExport'
$sources = @(
    'SHF_REVERSE_ENGINEERED_TECHNICAL_DESIGN.md',
    'SHF_SOURCE_CONTRACT_CATALOG.md'
)

function Get-PandocExecutable {
    $installed = Get-Command pandoc.exe -ErrorAction SilentlyContinue
    if ($null -ne $installed) { return $installed.Source }
    $toolDirectory = Join-Path $cache 'pandoc'
    $cached = Get-ChildItem -LiteralPath $toolDirectory -Recurse -File -Filter 'pandoc.exe' -ErrorAction SilentlyContinue |
    Select-Object -First 1
    if ($null -ne $cached) { return $cached.FullName }
    [IO.Directory]::CreateDirectory($toolDirectory) | Out-Null
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    $release = Invoke-RestMethod -Uri 'https://api.github.com/repos/jgm/pandoc/releases/latest' -Headers @{ 'User-Agent' = 'SHF-WordExport' }
    $asset = $release.assets | Where-Object { $_.name -match '^pandoc-.+-windows-x86_64\.zip$' } | Select-Object -First 1
    if ($null -eq $asset) { throw 'A portable Windows Pandoc release was not available.' }
    $archive = Join-Path $cache $asset.name
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $archive -UseBasicParsing
    if ($asset.digest -match '^sha256:(.+)$') {
        $expectedHash = $Matches[1]
        if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $expectedHash) {
            throw 'The Pandoc archive does not match its published SHA-256 digest.'
        }
    }
    [IO.Compression.ZipFile]::ExtractToDirectory($archive, $toolDirectory)
    $executable = Get-ChildItem -LiteralPath $toolDirectory -Recurse -File -Filter 'pandoc.exe' | Select-Object -First 1
    if ($null -eq $executable) { throw 'Pandoc extraction did not produce an executable.' }
    return $executable.FullName
}

function Test-WordDocument {
    param([string]$Path, [int]$ExpectedTables, [int]$ExpectedImages)
    $archive = [IO.Compression.ZipFile]::OpenRead($Path)
    try {
        foreach ($part in @('[Content_Types].xml', '_rels/.rels', 'word/document.xml', 'word/styles.xml')) {
            if ($null -eq $archive.GetEntry($part)) { throw "Missing Word package part: $part" }
        }
        $reader = New-Object IO.StreamReader($archive.GetEntry('word/document.xml').Open())
        try { [xml]$document = $reader.ReadToEnd() } finally { $reader.Dispose() }
        $namespaces = New-Object Xml.XmlNamespaceManager($document.NameTable)
        $namespaces.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
        $tableCount = $document.SelectNodes('//w:tbl', $namespaces).Count
        if ($tableCount -ne $ExpectedTables) { throw "Word table count differs from the source: $tableCount / $ExpectedTables" }
        $text = @($document.SelectNodes('//w:t', $namespaces) | ForEach-Object { $_.InnerText }) -join ' '
        if ($text.Length -lt 1000) { throw 'The Word document appears empty or truncated.' }
        $images = @($archive.Entries | Where-Object { $_.FullName -like 'word/media/*' })
        if ($images.Count -ne $ExpectedImages) { throw "Word diagram count differs from the source: $($images.Count) / $ExpectedImages" }
        $headingCount = $document.SelectNodes('//w:pStyle[@w:val="Heading1"]', $namespaces).Count
        if ($headingCount -lt 4) { throw 'The Word document is missing its main chapter headings.' }
        $fields = @($document.SelectNodes('//w:instrText', $namespaces) | ForEach-Object { $_.InnerText }) -join ' '
        if ($fields -notmatch '\bTOC\b') { throw 'The Word document is missing its contents field.' }
        if (@($archive.Entries | Where-Object { $_.FullName -match '^word/footer[0-9]+\.xml$' }).Count -eq 0) {
            throw 'The Word document is missing its page-number footer.'
        }
        [pscustomobject]@{
            Result                = 'PASS'
            File                  = 'docs/' + [IO.Path]::GetFileName($Path)
            Tables                = $tableCount
            TextCharacters        = $text.Length
            EmbeddedImages        = $images.Count
            MainHeadings          = $headingCount
            RepeatingTableHeaders = $document.SelectNodes('//w:tblHeader', $namespaces).Count
        } | ConvertTo-Json -Compress
    }
    finally { $archive.Dispose() }
}

function Get-DiagramRenderer {
    $rendererDirectory = Join-Path $cache 'mermaid'
    $renderer = Join-Path $rendererDirectory 'node_modules\.bin\mmdc.cmd'
    if (-not (Test-Path -LiteralPath $renderer)) {
        [IO.Directory]::CreateDirectory($rendererDirectory) | Out-Null
        & npm.cmd install --prefix $rendererDirectory --no-save --package-lock=false --ignore-scripts --no-audit --no-fund '@mermaid-js/mermaid-cli@10.9.1' | Out-Host
        if ($LASTEXITCODE -ne 0) { throw 'The diagram renderer could not be installed in the temporary tool cache.' }
    }
    return $renderer
}

function Convert-Diagrams {
    param([string]$Source)
    $browserPaths = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
    )
    $browser = $browserPaths | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    if ($null -eq $browser) { throw 'An installed Chrome or Edge browser is required to render diagrams.' }
    $renderDirectory = Join-Path $cache 'rendered'
    [IO.Directory]::CreateDirectory($renderDirectory) | Out-Null
    $browserConfig = Join-Path $renderDirectory 'browser.json'
    $themeConfig = Join-Path $renderDirectory 'theme.json'
    $browserOptions = @{ executablePath = $browser; args = @('--no-first-run', '--no-default-browser-check') }
    $themeOptions = @{
        theme          = 'default'
        themeVariables = @{ fontFamily = 'Calibri'; fontSize = '18px' }
        flowchart      = @{ htmlLabels = $false; useMaxWidth = $false }
    }
    [IO.File]::WriteAllText($browserConfig, ($browserOptions | ConvertTo-Json -Depth 5))
    [IO.File]::WriteAllText($themeConfig, ($themeOptions | ConvertTo-Json -Depth 5))
    $rendered = Join-Path $renderDirectory ([IO.Path]::GetFileName($Source))
    $renderer = Get-DiagramRenderer
    & $renderer --input $Source --output $rendered --outputFormat png --puppeteerConfigFile $browserConfig --configFile $themeConfig --backgroundColor white --width 2200 --scale 2 | Out-Host
    if ($LASTEXITCODE -ne 0) { throw 'Diagram rendering failed.' }
    if (-not (Test-Path -LiteralPath $rendered)) { throw 'Diagram rendering did not produce a Markdown input.' }
    return $rendered
}

function Format-WordDocument {
    param([string]$Path, [string]$Title, [bool]$Landscape)
    $archive = [IO.Compression.ZipFile]::Open($Path, [IO.Compression.ZipArchiveMode]::Update)
    $wordNamespace = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    $relationshipNamespace = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    try {
        $parts = @{}
        foreach ($name in @('word/document.xml', 'word/styles.xml', 'word/settings.xml', 'word/_rels/document.xml.rels', '[Content_Types].xml')) {
            $reader = New-Object IO.StreamReader($archive.GetEntry($name).Open())
            try { $parts[$name] = [xml]$reader.ReadToEnd() } finally { $reader.Dispose() }
        }
        $document = $parts['word/document.xml']
        $namespaces = New-Object Xml.XmlNamespaceManager($document.NameTable)
        $namespaces.AddNamespace('w', $wordNamespace)
        $namespaces.AddNamespace('wp', 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing')
        $namespaces.AddNamespace('a', 'http://schemas.openxmlformats.org/drawingml/2006/main')

        function Set-WordElement {
            param([Xml.XmlElement]$Parent, [string]$Name, [hashtable]$Attributes = @{})
            $element = $Parent.SelectSingleNode("w:$Name", $namespaces)
            if ($null -eq $element) {
                $element = $Parent.OwnerDocument.CreateElement('w', $Name, $wordNamespace)
                $Parent.AppendChild($element) | Out-Null
            }
            foreach ($key in $Attributes.Keys) {
                $attribute = $Parent.OwnerDocument.CreateAttribute('w', $key, $wordNamespace)
                $attribute.Value = [string]$Attributes[$key]
                $element.Attributes.SetNamedItem($attribute) | Out-Null
            }
            return $element
        }

        $pageWidth = 11906
        $pageHeight = 16838
        $orientation = 'portrait'
        if ($Landscape) { $pageWidth = 16838; $pageHeight = 11906; $orientation = 'landscape' }
        foreach ($section in $document.SelectNodes('//w:sectPr', $namespaces)) {
            Set-WordElement $section 'pgSz' @{ w = $pageWidth; h = $pageHeight; orient = $orientation } | Out-Null
            Set-WordElement $section 'pgMar' @{ top = 936; bottom = 936; left = 936; right = 936; header = 432; footer = 432; gutter = 0 } | Out-Null
            foreach ($kind in @('header', 'footer')) {
                foreach ($oldReference in @($section.SelectNodes("w:$($kind)Reference", $namespaces))) { $section.RemoveChild($oldReference) | Out-Null }
                $reference = $document.CreateElement('w', $kind + 'Reference', $wordNamespace)
                $reference.SetAttribute('type', $wordNamespace, 'default')
                $relationship = $document.CreateAttribute('r', 'id', $relationshipNamespace)
                $relationship.Value = 'rIdShf' + $kind
                $reference.Attributes.Append($relationship) | Out-Null
                $section.PrependChild($reference) | Out-Null
            }
        }
        $styleSizes = @{ Normal = 21; BodyText = 21; Heading1 = 32; Heading2 = 24; Heading3 = 22; Title = 52; SourceCode = 17; VerbatimChar = 17 }
        foreach ($styleName in $styleSizes.Keys) {
            $style = $parts['word/styles.xml'].SelectSingleNode("//w:style[@w:styleId='$styleName']", $namespaces)
            if ($null -eq $style) { continue }
            $properties = Set-WordElement $style 'rPr'
            $font = 'Calibri'
            if ($styleName -in @('SourceCode', 'VerbatimChar')) { $font = 'Consolas' }
            Set-WordElement $properties 'rFonts' @{ ascii = $font; hAnsi = $font; cs = $font } | Out-Null
            Set-WordElement $properties 'sz' @{ val = $styleSizes[$styleName] } | Out-Null
            if ($styleName -like 'Heading*') {
                Set-WordElement $properties 'color' @{ val = '1F4E79' } | Out-Null
                $paragraphProperties = Set-WordElement $style 'pPr'
                Set-WordElement $paragraphProperties 'keepNext' @{ val = 1 } | Out-Null
                Set-WordElement $paragraphProperties 'spacing' @{ before = 240; after = 120 } | Out-Null
                if ($styleName -eq 'Heading1') { Set-WordElement $paragraphProperties 'pageBreakBefore' @{ val = 1 } | Out-Null }
            }
        }
        foreach ($table in $document.SelectNodes('//w:tbl', $namespaces)) {
            $properties = Set-WordElement $table 'tblPr'
            Set-WordElement $properties 'tblW' @{ w = 5000; type = 'pct' } | Out-Null
            Set-WordElement $properties 'tblLayout' @{ type = 'autofit' } | Out-Null
            $firstRow = $table.SelectSingleNode('w:tr', $namespaces)
            $rowProperties = Set-WordElement $firstRow 'trPr'
            Set-WordElement $rowProperties 'tblHeader' @{ val = 1 } | Out-Null
            foreach ($cell in $firstRow.SelectNodes('w:tc', $namespaces)) {
                $cellProperties = Set-WordElement $cell 'tcPr'
                Set-WordElement $cellProperties 'shd' @{ val = 'clear'; fill = 'E6ECF1' } | Out-Null
            }
            foreach ($run in $table.SelectNodes('.//w:r', $namespaces)) {
                $runProperties = Set-WordElement $run 'rPr'
                Set-WordElement $runProperties 'sz' @{ val = 18 } | Out-Null
            }
            foreach ($paragraph in $table.SelectNodes('.//w:p', $namespaces)) {
                $paragraphProperties = Set-WordElement $paragraph 'pPr'
                Set-WordElement $paragraphProperties 'keepNext' @{ val = 0 } | Out-Null
                Set-WordElement $paragraphProperties 'spacing' @{ before = 0; after = 60 } | Out-Null
            }
        }
        $maximumWidth = ($pageWidth - 1872) * 635
        $maximumHeight = ($pageHeight - 2592) * 635
        foreach ($image in $document.SelectNodes('//wp:inline', $namespaces)) {
            $extent = $image.SelectSingleNode('wp:extent', $namespaces)
            $ratio = [Math]::Min(1, [Math]::Min($maximumWidth / [double]$extent.cx, $maximumHeight / [double]$extent.cy))
            foreach ($size in @($extent, $image.SelectSingleNode('.//a:xfrm/a:ext', $namespaces))) {
                if ($null -ne $size) {
                    $size.SetAttribute('cx', [string][long]([double]$extent.cx * $ratio))
                    $size.SetAttribute('cy', [string][long]([double]$extent.cy * $ratio))
                }
            }
        }
        $parts['word/header1.xml'] = [xml]('<w:hdr xmlns:w="' + $wordNamespace + '"><w:p><w:pPr><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:sz w:val="16"/><w:color w:val="666666"/></w:rPr><w:t/></w:r></w:p></w:hdr>')
        $parts['word/header1.xml'].SelectSingleNode('//w:t', $namespaces).InnerText = $Title
        $parts['word/footer1.xml'] = [xml]('<w:ftr xmlns:w="' + $wordNamespace + '"><w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:r><w:rPr><w:sz w:val="16"/></w:rPr><w:t xml:space="preserve">SHF | Page </w:t></w:r><w:fldSimple w:instr=" PAGE "><w:r><w:t>1</w:t></w:r></w:fldSimple></w:p></w:ftr>')
        Set-WordElement $parts['word/settings.xml'].DocumentElement 'updateFields' @{ val = 1 } | Out-Null
        foreach ($kind in @('header', 'footer')) {
            $relationships = $parts['word/_rels/document.xml.rels']
            $relation = $relationships.CreateElement('Relationship', $relationships.DocumentElement.NamespaceURI)
            $relation.SetAttribute('Id', 'rIdShf' + $kind)
            $relation.SetAttribute('Type', $relationshipNamespace + '/' + $kind)
            $relation.SetAttribute('Target', $kind + '1.xml')
            $relationships.DocumentElement.AppendChild($relation) | Out-Null
            $types = $parts['[Content_Types].xml']
            $override = $types.CreateElement('Override', $types.DocumentElement.NamespaceURI)
            $override.SetAttribute('PartName', '/word/' + $kind + '1.xml')
            $override.SetAttribute('ContentType', 'application/vnd.openxmlformats-officedocument.wordprocessingml.' + $kind + '+xml')
            $types.DocumentElement.AppendChild($override) | Out-Null
        }
        foreach ($name in $parts.Keys) {
            $oldEntry = $archive.GetEntry($name)
            if ($null -ne $oldEntry) { $oldEntry.Delete() }
            $entry = $archive.CreateEntry($name)
            $writer = New-Object IO.StreamWriter($entry.Open(), (New-Object Text.UTF8Encoding($false)))
            try { $parts[$name].Save($writer) } finally { $writer.Dispose() }
        }
        [pscustomobject]@{ Formatting = 'PASS'; File = [IO.Path]::GetFileName($Path); Orientation = $orientation } |
        ConvertTo-Json -Compress | Write-Host
    }
    finally { $archive.Dispose() }
}

[IO.Directory]::CreateDirectory($cache) | Out-Null
$statusPath = Join-Path $cache 'word-export-status.json'
try {
    $pandoc = Get-PandocExecutable
    $filterPath = Join-Path $cache 'word-layout.lua'
    $filter = @'
function Header(header)
  if header.level == 1 then
    return {}
  end
  header.level = header.level - 1
  return header
end

function Link(link)
  local base = link.target:match("^([^#]+%.md)")
  if base == "SHF_SOURCE_CONTRACT_CATALOG.md" or base == "SHF_REVERSE_ENGINEERED_TECHNICAL_DESIGN.md" then
    link.target = base:gsub("%.md$", ".docx")
  end
  return link
end
'@
    if ($Mode -eq 'Build') { [IO.File]::WriteAllText($filterPath, $filter) }
    foreach ($sourceName in $sources) {
        $source = Join-Path $PSScriptRoot $sourceName
        $output = [IO.Path]::ChangeExtension($source, '.docx')
        $astJson = (& $pandoc $source --from=gfm --to=json) -join "`n"
        if ($LASTEXITCODE -ne 0) { throw "Unable to parse the source: $sourceName" }
        $ast = $astJson | ConvertFrom-Json
        $expectedTables = @($ast.blocks | Where-Object { $_.t -eq 'Table' }).Count
        $expectedImages = @($ast.blocks | Where-Object { $_.t -eq 'CodeBlock' -and $_.c[0][1] -contains 'mermaid' }).Count
        if ($Mode -eq 'Build') {
            $conversionSource = $source
            if ($expectedImages -gt 0) { $conversionSource = Convert-Diagrams -Source $source }
            $title = 'SHF Reverse-Engineered Technical Design'
            $landscape = $false
            if ($sourceName -eq 'SHF_SOURCE_CONTRACT_CATALOG.md') {
                $title = 'SHF Source Contract Catalog'
                $landscape = $true
            }
            $resources = $PSScriptRoot + [IO.Path]::PathSeparator + (Join-Path $cache 'rendered')
            & $pandoc $conversionSource --from=gfm --to=docx --standalone --toc --toc-depth=2 --metadata=lang:en-US "--metadata=title:$title" "--lua-filter=$filterPath" "--resource-path=$resources" "--output=$output"
            if ($LASTEXITCODE -ne 0) { throw "Word conversion failed: $sourceName" }
            Format-WordDocument -Path $output -Title $title -Landscape $landscape
        }
        Test-WordDocument -Path $output -ExpectedTables $expectedTables -ExpectedImages $expectedImages
    }
    [IO.File]::WriteAllText($statusPath, (@{ Result = 'PASS'; Mode = $Mode; Files = $sources } | ConvertTo-Json))
}
catch {
    $failure = [pscustomobject]@{
        Result   = 'FAIL'
        Error    = $_.Exception.Message
        Position = $_.InvocationInfo.PositionMessage
        Stack    = $_.ScriptStackTrace
    } | ConvertTo-Json
    [IO.File]::WriteAllText($statusPath, $failure)
    Write-Host $failure
    throw
}