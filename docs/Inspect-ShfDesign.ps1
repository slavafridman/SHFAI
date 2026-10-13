param(
    [ValidateSet('Baseline', 'Inventory', 'Config', 'Export', 'Validate')]
    [string]$Mode = 'Validate',
    [ValidateSet('All', 'CurrentProject')]
    [string]$DocumentationScope = 'All'
)
$ErrorActionPreference = 'Stop'
$root = Join-Path (Split-Path $PSScriptRoot -Parent) 'old'
$documentPath = Join-Path $PSScriptRoot 'SHF_REVERSE_ENGINEERED_TECHNICAL_DESIGN.md'
$strutsPath = Join-Path $root 'SHFWeb\WebContent\WEB-INF\struts-config.xml'
[xml]$struts = [IO.File]::ReadAllText($strutsPath)

function Get-ShfHttpRouteInventory {
    param([string]$Design)

    $uiSection = [regex]::Match($Design,
        '(?s)### 2\.5 UI-Only Navigation Inventory(.*?)(?=\r?\n## )')
    if (-not $uiSection.Success) {
        throw 'Missing separate UI navigation inventory.'
    }
    $uiRoutes = @{}
    foreach ($row in [regex]::Matches($uiSection.Groups[1].Value,
            '(?m)^\|\s*`([^`]+)`\s*\|\s*`(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)`\s*\|')) {
        $path = $row.Groups[1].Value
        $method = $row.Groups[2].Value
        if ($method -ne 'GET' -or $path -notmatch '^/app(?:/|$)') {
            throw "UI inventory must contain GET document paths under /app only: $method $path"
        }
        $route = $method + ' ' + $path
        if ($uiRoutes.ContainsKey($route)) {
            throw "Duplicate UI document route: $route"
        }
        $uiRoutes[$route] = $true
    }
    if ($uiRoutes.Count -eq 0) {
        throw 'The separate UI navigation inventory must contain document routes.'
    }

    $backendRoutes = @{}
    foreach ($row in [regex]::Matches($Design,
            '(?m)^\|\s*`(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)`\s*\|\s*`(/[^`]+)`[^|]*\|')) {
        $method = $row.Groups[1].Value
        $path = $row.Groups[2].Value
        if ($path -match '^/(?:api/v1/)?app(?:/|$)') {
            throw "UI document routes must not appear in the backend endpoint catalogue: $method $path"
        }
        if ($path -notmatch '^/(?:api/v1/|auth/|internal/)') {
            $path = '/api/v1' + $path
        }
        $route = $method + ' ' + $path
        if ($backendRoutes.ContainsKey($route)) {
            throw "Duplicate REST method/path contract: $route"
        }
        $backendRoutes[$route] = $true
    }
    [pscustomobject]@{ Ui = $uiRoutes; Backend = $backendRoutes }
}

function Get-ShfAngularUiInventory {
    param(
        [string]$Design,
        [hashtable]$UiRoutes,
        [hashtable]$BackendRoutes,
        [string[]]$OperationStates
    )

    $manifestSection = [regex]::Match($Design,
        '(?s)### 4\.2 Primary Route Manifest(.*?)(?=\r?\n### )')
    if (-not $manifestSection.Success) {
        throw 'Missing Angular primary route manifest.'
    }
    $angularRoutes = @{}
    $routeScreens = @{}
    foreach ($row in [regex]::Matches($manifestSection.Groups[1].Value,
            '(?m)^\|\s*`([^`]+)`\s*\|\s*`(UI-[0-9]{3})`\s*\|')) {
        $path = $row.Groups[1].Value
        $screenId = $row.Groups[2].Value
        if ($path -notmatch '^/app(?:/|$)') {
            throw "Angular manifest must contain UI document paths under /app: $path"
        }
        $route = 'GET ' + $path
        if ($angularRoutes.ContainsKey($route)) {
            throw "Duplicate Angular UI document route: $route"
        }
        if (-not $UiRoutes.ContainsKey($route)) {
            throw "Angular route is absent from the approved REST UI inventory: $route"
        }
        if ($routeScreens.ContainsKey($screenId)) {
            throw "Duplicate Angular route screen ID: $screenId"
        }
        $angularRoutes[$route] = $screenId
        $routeScreens[$screenId] = $true
    }
    if ($angularRoutes.Count -ne $UiRoutes.Count) {
        throw 'Angular primary routes must exactly cover the REST UI document inventory.'
    }

    $screenSection = [regex]::Match($Design,
        '(?s)## 9\. Detailed Screen Specifications(.*?)(?=\r?\n## )')
    $screenIds = @{}
    foreach ($heading in [regex]::Matches($screenSection.Groups[1].Value, '(?m)^### [^\r\n]+')) {
        foreach ($screen in [regex]::Matches($heading.Value, 'UI-[0-9]{3}')) {
            if ($screenIds.ContainsKey($screen.Value)) {
                throw "Duplicate Angular screen specification: $($screen.Value)"
            }
            $screenIds[$screen.Value] = $true
        }
    }
    foreach ($screenId in $routeScreens.Keys) {
        if (-not $screenIds.ContainsKey($screenId)) {
            throw "Missing Angular screen specification: $screenId"
        }
    }
    if ($screenIds.Count -ne $routeScreens.Count) {
        throw 'Angular screen specifications must exactly cover route screen IDs.'
    }

    $stateSection = [regex]::Match($Design,
        '(?s)### 11\.1 Operation Presentation(.*?)(?=\r?\n### )')
    $angularStates = @{}
    foreach ($row in [regex]::Matches($stateSection.Groups[1].Value,
            '(?m)^\|\s*`([A-Z_]+)`\s*\|')) {
        $state = $row.Groups[1].Value
        if ($angularStates.ContainsKey($state)) { throw "Duplicate Angular operation state: $state" }
        $angularStates[$state] = $true
    }
    foreach ($state in $OperationStates) {
        if (-not $angularStates.ContainsKey($state)) {
            throw "Missing Angular operation state: $state"
        }
    }
    if ($angularStates.Count -ne $OperationStates.Count) {
        throw 'Angular operation states must match the canonical REST state inventory.'
    }

    $apiBindings = @{}
    foreach ($binding in [regex]::Matches($Design,
            '`(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(/[^`\s]+)`')) {
        $route = $binding.Groups[1].Value + ' ' + $binding.Groups[2].Value
        if (-not $BackendRoutes.ContainsKey($route)) {
            throw "Unknown Angular API method/path binding: $route"
        }
        $apiBindings[$route] = $true
    }
    $jsonFixtureCount = 0
    foreach ($fixture in [regex]::Matches($Design, '(?s)```json\r?\n(.*?)\r?\n```')) {
        try { $fixtureObject = $fixture.Groups[1].Value | ConvertFrom-Json }
        catch { throw ('Invalid Angular JSON fixture: ' + $_.Exception.Message) }
        $jsonFixtureCount++
        if ($null -ne $fixtureObject.method -and $null -ne $fixtureObject.path) {
            $route = [string]$fixtureObject.method + ' ' + [string]$fixtureObject.path
            if (-not $BackendRoutes.ContainsKey($route)) {
                throw "Unknown Angular API fixture binding: $route"
            }
            if (-not $screenIds.ContainsKey([string]$fixtureObject.screenId)) {
                throw 'Angular command fixture must reference a documented screen.'
            }
            $apiBindings[$route] = $true
        }
    }
    if ($jsonFixtureCount -lt 3 -or $apiBindings.Count -eq 0) {
        throw 'Expected Angular API bindings and at least three parsed JSON fixtures.'
    }
    [pscustomobject]@{
        Ui              = $angularRoutes
        Screens         = $screenIds
        ApiBindings     = $apiBindings
        OperationStates = $angularStates
        JsonFixtures    = $jsonFixtureCount
    }
}

if ($Mode -eq 'Baseline' -or $Mode -eq 'Validate') {
    $document = [IO.File]::ReadAllText($documentPath)
    $login = $struts.SelectSingleNode('/struts-config/action-mappings/action[@path="/login"]')
    if ($null -eq $login -or $login.type -ne 'bzq.shf.actions.LoginAction') {
        throw 'The source does not support the documented login routing.'
    }
}

if ($Mode -eq 'Export') {
    $catalog = New-Object 'System.Collections.Generic.List[string]'
    $catalog.Add('# SHF Source Contract Catalog')
    $catalog.Add('')
    $catalog.Add('Generated from readable local source and Struts XML. This is not a live schema export.')
    $catalog.Add('Regenerate with `./docs/Inspect-ShfDesign.ps1 -Mode Export`. No database or broker is contacted.')
    $catalog.Add('')
    $catalog.Add('## 1. Complete Struts Route Catalog')
    $catalog.Add('')
    $catalog.Add('Routes, parameters, form bindings, and forwards come from parsed XML. HTTP methods are not constrained by this catalog. A `.do` suffix is visible in application links and forwards; servlet mapping remains unverified.')
    $catalog.Add('')
    $catalog.Add('| Legacy path | Owning action | Mapping parameters | Form / scope | Forwards |')
    $catalog.Add('| --- | --- | --- | --- | --- |')
    $actions = $struts.SelectNodes('/struts-config/action-mappings/action')
    foreach ($route in $actions) {
        $type = $route.GetAttribute('type')
        $source = 'SHF/src/' + $type.Replace('.', '/') + '.java'
        $label = $type
        if (Test-Path -LiteralPath (Join-Path $root $source)) {
            $label = '[' + $type + '](../old/' + $source + ')'
        }
        $forwardList = @($route.SelectNodes('forward') | ForEach-Object {
                $_.GetAttribute('name') + ': ' + $_.GetAttribute('path')
            }) -join '; '
        $parameters = $route.GetAttribute('parameter').Replace('|', '\|')
        $form = $route.GetAttribute('name') + ' / ' + $route.GetAttribute('scope')
        $catalog.Add('| `' + $route.GetAttribute('path') + '` | ' + $label + ' | `' + $parameters + '` | ' + $form + ' | ' + $forwardList + ' |')
    }
    $catalog.Add('')
    $catalog.Add('## 2. Form Binding Catalog')
    $catalog.Add('')
    $catalog.Add('Only fields declared directly in the readable class are indexed. Inherited fields, setter transformations, custom validation, and proprietary library classes require the design and source review; these declarations are not replacement API schemas.')
    $catalog.Add('')
    $catalog.Add('| Form name | Java type / evidence | Directly declared instance fields |')
    $catalog.Add('| --- | --- | --- |')
    foreach ($form in $struts.SelectNodes('/struts-config/form-beans/form-bean')) {
        $type = $form.GetAttribute('type')
        $source = 'SHF/src/' + $type.Replace('.', '/') + '.java'
        $fields = 'Source not available at expected path'
        $label = $type
        if (Test-Path -LiteralPath (Join-Path $root $source)) {
            $label = '[' + $type + '](../old/' + $source + ')'
            $text = [IO.File]::ReadAllText((Join-Path $root $source))
            $matches = [regex]::Matches($text, '(?m)^\s*(?:private|protected|public)\s+(?!static\b)([\w<>?,\[\].]+)\s+(\w+)\s*(?:=[^;]*)?;')
            $fields = @($matches | ForEach-Object { $_.Groups[2].Value + ': ' + $_.Groups[1].Value } | Sort-Object -Unique) -join '; '
            if ($fields.Length -eq 0) { $fields = 'No matching direct field declarations; inspect inherited fields.' }
        }
        $catalog.Add('| `' + $form.GetAttribute('name') + '` | ' + $label + ' | ' + $fields + ' |')
    }
    $catalog.Add('')
    $catalog.Add('## 3. Qualified Database Identifier Candidates')
    $catalog.Add('')
    $catalog.Add('This static identifier index includes commented code and SQL fragments. Entries may be tables, views, sequences, package names, or qualified column references. It does not prove object existence, grants, constraints, active use, or Oracle object type. Unqualified identifiers and dynamic SQL can be missed. Confirm with the read-only schema discovery SQL.')
    $catalog.Add('')
    $catalog.Add('| Qualified identifier candidate | Occurrences | Source references (first four) |')
    $catalog.Add('| --- | --- | --- |')
    $identifiers = @{}
    $unqualified = @{}
    $methodRows = New-Object 'System.Collections.Generic.List[string]'
    foreach ($relative in @('SHF\src', 'SHFBatch\src', 'SHFEJB\ejbModule\ejbs')) {
        foreach ($file in Get-ChildItem -LiteralPath (Join-Path $root $relative) -Recurse -File -Filter '*.java') {
            $source = $file.FullName.Substring($root.Length + 1).Replace('\', '/')
            $lines = [IO.File]::ReadAllLines($file.FullName)
            for ($index = 0; $index -lt $lines.Length; $index++) {
                foreach ($match in [regex]::Matches($lines[$index], '(?i)(?<![\w.])(?:SHIFTER|WFM|WM)\.[A-Z][A-Z0-9_$#]*\b')) {
                    $name = $match.Value.ToUpperInvariant()
                    if (-not $identifiers.ContainsKey($name)) {
                        $identifiers[$name] = New-Object 'System.Collections.Generic.List[string]'
                    }
                    $identifiers[$name].Add('[' + $source + ':' + ($index + 1) + '](../old/' + $source + '#L' + ($index + 1) + ')')
                }
                foreach ($match in [regex]::Matches($lines[$index], '(?i)\b(?:FROM|JOIN|INTO|UPDATE)\s+((?:SHF_|WM_)[A-Z0-9_$#]+)\b')) {
                    $name = $match.Groups[1].Value.ToUpperInvariant()
                    if (-not $unqualified.ContainsKey($name)) {
                        $unqualified[$name] = New-Object 'System.Collections.Generic.List[string]'
                    }
                    $unqualified[$name].Add('[' + $source + ':' + ($index + 1) + '](../old/' + $source + '#L' + ($index + 1) + ')')
                }
                if ($source -match '/model/|/batch/[^/]+\.java$|/servletListenersTasks/') {
                    $method = [regex]::Match($lines[$index], '^\s*public\s+(?:static\s+)?[^=;{}]+\s+(\w+)\s*\(')
                    if ($method.Success) {
                        $methodRows.Add('| [' + $source + '](../old/' + $source + '#L' + ($index + 1) + ') | `' + $method.Groups[1].Value + '` |')
                    }
                }
            }
        }
    }
    foreach ($name in $identifiers.Keys | Sort-Object) {
        $references = @($identifiers[$name] | Sort-Object -Unique | Select-Object -First 4) -join '; '
        $catalog.Add('| `' + $name + '` | ' + $identifiers[$name].Count + ' | ' + $references + ' |')
    }
    $catalog.Add('')
    $catalog.Add('### 3.1 Unqualified SQL Object Candidates')
    $catalog.Add('')
    $catalog.Add('Extracted from SQL-like FROM/JOIN/INTO/UPDATE fragments. Resolve each name against its actual connection, current schema, synonyms, and database links. A WM prefix alone does not establish its owner. Comma joins, split literals, comments, and dynamic SQL limit completeness.')
    $catalog.Add('')
    $catalog.Add('| Unqualified candidate | Occurrences | Source references (first four) |')
    $catalog.Add('| --- | --- | --- |')
    foreach ($name in $unqualified.Keys | Sort-Object) {
        $references = @($unqualified[$name] | Sort-Object -Unique | Select-Object -First 4) -join '; '
        $catalog.Add('| `' + $name + '` | ' + $unqualified[$name].Count + ' | ' + $references + ' |')
    }
    $catalog.Add('')
    $catalog.Add('## 4. Public Model and Worker Method Index')
    $catalog.Add('')
    $catalog.Add('A navigation aid, not a Java parser or a claim that every method is reachable. Multiline declarations can be missed. No bodies or sensitive payloads are exported.')
    $catalog.Add('')
    $catalog.Add('| Source | Method |')
    $catalog.Add('| --- | --- |')
    $catalog.AddRange($methodRows)
    $catalogPath = Join-Path $PSScriptRoot 'SHF_SOURCE_CONTRACT_CATALOG.md'
    [IO.File]::WriteAllLines($catalogPath, $catalog, (New-Object Text.UTF8Encoding($false)))
    [pscustomobject]@{
        Result                = 'EXPORTED'
        Routes                = $actions.Count
        Forms                 = $struts.SelectNodes('/struts-config/form-beans/form-bean').Count
        IdentifierCandidates  = $identifiers.Count
        UnqualifiedCandidates = $unqualified.Count
        MethodIndex           = $methodRows.Count
        Catalog               = 'docs/SHF_SOURCE_CONTRACT_CATALOG.md'
    } | ConvertTo-Json -Compress
}

if ($Mode -eq 'Baseline' -or $Mode -eq 'Validate') {
    $consumerPath = Join-Path $root 'SHFEJB\ejbModule\ejbs\SHFSPMDBBean.java'
    $consumer = [IO.File]::ReadAllText($consumerPath)
    if (-not $consumer.Contains('UPDATE shifter.shf_transactions t')) {
        throw 'The source does not support the documented response persistence.'
    }
    $required = @(
        '### 1.3 Current-Stage Requirements and Authority',
        '## 3. API and Application Services',
        '## 4. UI Design',
        '### 4.6 Current-Stage Screen and State Contracts',
        '## 5. Database and Business Rules',
        '### 5.7 Target Database Strategy',
        '## 6. Batch Processes',
        '## 7. Interfaces',
        '### 7.11 API Bridge Design and Current-Stage Abstract Ports',
        '### 9.5 Proposed Repository and Deployment Boundaries',
        '### 9.6 Reliable Operation State Machine',
        '### 9.7 Existing Storage Capabilities and Gaps'
    )
    foreach ($section in $required) {
        if (-not $document.Contains($section)) { throw "Missing section: $section" }
    }
    $scope = [regex]::Match($document,
        '(?s)### 1\.3 Current-Stage Requirements and Authority(.*?)(?=\r?\n## 2\.)')
    $scopeRequirements = @('REQ-01', 'REQ-02', 'REQ-03', 'REQ-04', 'REQ-05', 'REQ-06')
    foreach ($requirement in $scopeRequirements) {
        $requirementPattern = '(?m)^\|\s*' + [regex]::Escape($requirement) + '\s*\|'
        if ([regex]::Matches($scope.Value, $requirementPattern).Count -ne 1) {
            throw "Missing or duplicate current-stage requirement: $requirement"
        }
    }
    foreach ($boundary in @('No EMS clients', 'Exclude their code', 'No DDL',
            'Process memory is not a durable substitute', 'must not return simulated completion')) {
        if (-not $scope.Value.Contains($boundary)) {
            throw "Missing current-stage boundary: $boundary"
        }
    }
    $projectJsonFixtures = New-Object 'System.Collections.Generic.List[object]'
    foreach ($fixture in [regex]::Matches($document, '(?s)```json\r?\n(.*?)\r?\n```')) {
        try { $projectJsonFixtures.Add(($fixture.Groups[1].Value | ConvertFrom-Json)) }
        catch { throw ('Invalid project JSON fixture: ' + $_.Exception.Message) }
    }
    $bridgeCommand = @($projectJsonFixtures | Where-Object { $_.kind -eq 'MANAGED_BREAKS_CHANGE' })
    if ($bridgeCommand.Count -ne 1 -or
        $bridgeCommand[0].shiftId -isnot [string] -or
        $bridgeCommand[0].legacyTransactionId -isnot [string] -or
        $bridgeCommand[0].commandId -eq $bridgeCommand[0].shiftId -or
        $bridgeCommand[0].legacyTransactionId -eq $bridgeCommand[0].shiftId) {
        throw 'Bridge example must keep command, transaction and shift identifiers distinct and lossless.'
    }
    $unavailable = @($projectJsonFixtures | Where-Object { $_.code -eq 'INTEGRATION_NOT_AVAILABLE' })
    if ($unavailable.Count -ne 1 -or $unavailable[0].status -ne 503 -or
        $unavailable[0].retryable -ne $false) {
        throw 'Abstract bridge example must report an unavailable, non-retryable command.'
    }
    $links = [regex]::Matches($document, '\]\((\.\./[^)#]+)(?:#[^)]*)?\)')
    foreach ($link in $links) {
        $target = Join-Path $PSScriptRoot $link.Groups[1].Value
        if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
            throw "Missing evidence target: $target"
        }
    }
    [pscustomobject]@{
        Result        = 'PASS'
        Actions       = $struts.SelectNodes('/struts-config/action-mappings/action').Count
        Sections      = $required.Count
        Requirements  = $scopeRequirements.Count
        JsonFixtures  = $projectJsonFixtures.Count
        EvidenceLinks = $links.Count
    } | ConvertTo-Json -Compress
}

if ($Mode -eq 'Validate') {
    $documentationFiles = @(Get-ChildItem -LiteralPath $PSScriptRoot -File -Filter '*.md')
    if ($DocumentationScope -eq 'CurrentProject') {
        $projectDocuments = @(
            'AGENT_INSTRUCTION.md',
            'SHF_REVERSE_ENGINEERED_TECHNICAL_DESIGN.md',
            'SHF_SOURCE_CONTRACT_CATALOG.md'
        )
        $documentationFiles = @($documentationFiles | Where-Object { $_.Name -in $projectDocuments })
        if ($documentationFiles.Count -ne $projectDocuments.Count) {
            throw 'Current-project validation requires the brief, design and source catalog.'
        }
    }
    $lineCounts = @{}
    $anchors = @{}
    $linkCount = 0
    $lineReferenceCount = 0
    foreach ($documentation in $documentationFiles) {
        $text = [IO.File]::ReadAllText($documentation.FullName)
        if ([regex]::Matches($text, '(?m)^```').Count % 2 -ne 0) {
            throw "Unbalanced code fences: $($documentation.Name)"
        }
        foreach ($link in [regex]::Matches($text, '\]\(([^)\s]+)\)')) {
            $destination = $link.Groups[1].Value
            if ($destination -match '^https?://') { continue }
            $fragment = ''
            $separator = $destination.IndexOf('#')
            if ($separator -ge 0) {
                $fragment = $destination.Substring($separator + 1)
                $destination = $destination.Substring(0, $separator)
            }
            $target = $documentation.FullName
            if ($destination.Length -gt 0) {
                $target = [IO.Path]::GetFullPath((Join-Path $documentation.DirectoryName ([Uri]::UnescapeDataString($destination))))
            }
            if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
                throw "Broken local link in $($documentation.Name): $target"
            }
            $linkCount++
            if ($fragment -match '^L([1-9][0-9]*)$') {
                $lineNumber = [int]$Matches[1]
                if (-not $lineCounts.ContainsKey($target)) {
                    $lineCounts[$target] = [IO.File]::ReadAllLines($target).Length
                }
                if ($lineNumber -gt $lineCounts[$target]) {
                    throw "Out-of-range source line: $target#$fragment"
                }
                $lineReferenceCount++
            }
            elseif ($fragment.Length -gt 0 -and $target.EndsWith('.md', [StringComparison]::OrdinalIgnoreCase)) {
                if (-not $anchors.ContainsKey($target)) {
                    $anchorSet = @{}
                    foreach ($heading in [regex]::Matches([IO.File]::ReadAllText($target), '(?m)^#{1,6}\s+(.+?)\s*$')) {
                        $slug = $heading.Groups[1].Value.Trim().ToLowerInvariant()
                        $slug = [regex]::Replace($slug, '[^\p{L}\p{N}_\-\s]', '')
                        $slug = [regex]::Replace($slug, '\s+', '-')
                        $anchorSet[$slug] = $true
                    }
                    $anchors[$target] = $anchorSet
                }
                if (-not $anchors[$target].ContainsKey($fragment)) {
                    throw "Missing Markdown section: $target#$fragment"
                }
            }
        }
    }
    $catalogText = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'SHF_SOURCE_CONTRACT_CATALOG.md'))
    foreach ($route in $struts.SelectNodes('/struts-config/action-mappings/action')) {
        if (-not $catalogText.Contains('| `' + $route.GetAttribute('path') + '` | ')) {
            throw 'The route catalog is incomplete; regenerate with -Mode Export.'
        }
    }
    foreach ($form in $struts.SelectNodes('/struts-config/form-beans/form-bean')) {
        if (-not $catalogText.Contains('| `' + $form.GetAttribute('name') + '` | ')) {
            throw 'The form catalog is incomplete; regenerate with -Mode Export.'
        }
    }
    $capabilitySection = [regex]::Match($document, '(?s)### 3\.1 Existing Entry-Point Design(.*?)### 3\.2 Identity').Groups[1].Value
    $capabilityRoutes = 0
    foreach ($row in [regex]::Matches($capabilitySection, '(?m)^\|[^\r\n|]+\|\s*([0-9]+)\s*\|')) {
        $capabilityRoutes += [int]$row.Groups[1].Value
    }
    if ($capabilityRoutes -ne $struts.SelectNodes('/struts-config/action-mappings/action').Count) {
        throw 'Capability route counts do not reconcile with the Struts configuration.'
    }
    $sql = [IO.File]::ReadAllText((Join-Path $PSScriptRoot 'SHF_SCHEMA_DISCOVERY_READ_ONLY.sql'))
    $statements = @($sql.Split(';') | Where-Object { $_.Trim().Length -gt 0 })
    foreach ($statement in $statements) {
        if ($statement.Trim() -notmatch '^SELECT\b') {
            throw 'Schema discovery must contain SELECT statements only.'
        }
    }
    if ($sql -match '(?i)\b(?:NEXTVAL|DBMS_METADATA|UTL_HTTP|UTL_FILE)\b') {
        throw 'Unexpected side-effect-capable function in schema discovery.'
    }
    $tibcoFixtureCount = 0
    $tibcoRejectionCount = 0
    $tibcoDesignPath = Join-Path $PSScriptRoot 'SHF_TIBCO_DOTNET_INTERFACE_DESIGN.md'
    if ($DocumentationScope -eq 'All' -and (Test-Path -LiteralPath $tibcoDesignPath -PathType Leaf)) {
        $tibcoDesign = [IO.File]::ReadAllText($tibcoDesignPath)
        $schemaSet = New-Object System.Xml.Schema.XmlSchemaSet
        $schemaSet.XmlResolver = $null
        foreach ($schemaRelativePath in @(
                'SharedLibraries\bzq\bzq\shfsp\request\SHFSPBreaks.xsd',
                'SharedLibraries\bzq\bzq\shfsp\response\SHFSPBreaks_response.xsd'
            )) {
            $schemaSet.Add('', (Join-Path $root $schemaRelativePath)) | Out-Null
        }
        $schemaSet.Compile()
        $xmlSettings = New-Object System.Xml.XmlReaderSettings
        $xmlSettings.DtdProcessing = [System.Xml.DtdProcessing]::Prohibit
        $xmlSettings.XmlResolver = $null
        $xmlSettings.MaxCharactersInDocument = 1048576
        $xmlSettings.ValidationType = [System.Xml.ValidationType]::Schema
        $xmlSettings.Schemas = $schemaSet
        $xmlSettings.ValidationFlags = $xmlSettings.ValidationFlags -bor [System.Xml.Schema.XmlSchemaValidationFlags]::ReportValidationWarnings
        $xmlSettings.add_ValidationEventHandler({
                param($validationSender, $validationEvent)
                throw ('SHFSP XML schema validation failed: ' + $validationEvent.Message)
            })
        foreach ($fixture in [regex]::Matches($tibcoDesign, '(?s)```xml\r?\n(.*?)\r?\n```')) {
            $fixtureXml = $fixture.Groups[1].Value.Trim()
            if ($fixtureXml -notmatch '^<SHFSPBreaks(?:\s|>|_)') { continue }
            $fixtureInput = New-Object System.IO.StringReader($fixtureXml)
            $fixtureReader = $null
            try {
                $fixtureReader = [System.Xml.XmlReader]::Create($fixtureInput, $xmlSettings)
                while ($fixtureReader.Read()) { }
                $tibcoFixtureCount++
            }
            finally {
                if ($null -ne $fixtureReader) { $fixtureReader.Dispose() }
                $fixtureInput.Dispose()
            }
        }
        if ($tibcoFixtureCount -lt 4) {
            throw 'Expected at least four schema-validated SHFSP XML fixtures in the TIBCO design.'
        }
        $negativeFixtures = [ordered]@{
            MissingCorrelation = '<SHFSPBreaks><user>EXAMPLE</user><actionId>2</actionId></SHFSPBreaks>'
            WrongNamespace     = '<SHFSPBreaks xmlns="urn:unexpected"><user>EXAMPLE</user><transactionId>900001</transactionId><actionId>2</actionId></SHFSPBreaks>'
            ProhibitedDtd      = '<!DOCTYPE SHFSPBreaks [<!ENTITY example "EXAMPLE">]><SHFSPBreaks><user>&example;</user><transactionId>900001</transactionId><actionId>2</actionId></SHFSPBreaks>'
        }
        foreach ($negativeFixture in $negativeFixtures.GetEnumerator()) {
            $fixtureInput = New-Object System.IO.StringReader($negativeFixture.Value)
            $fixtureReader = $null
            $rejected = $false
            try {
                $fixtureReader = [System.Xml.XmlReader]::Create($fixtureInput, $xmlSettings)
                while ($fixtureReader.Read()) { }
            }
            catch {
                $rejected = $true
                $tibcoRejectionCount++
            }
            finally {
                if ($null -ne $fixtureReader) { $fixtureReader.Dispose() }
                $fixtureInput.Dispose()
            }
            if (-not $rejected) {
                throw "SHFSP XML validator accepted invalid case: $($negativeFixture.Key)"
            }
        }
    }
    $restUiRouteCount = 0
    $restRouteNegativeCaseCount = 0
    $restEndpointCount = 0
    $restBusinessEndpointCount = 0
    $restAuthEndpointCount = 0
    $restInternalEndpointCount = 0
    $restJsonFixtureCount = 0
    $restActionTypeCount = 0
    $restReferenceCount = 0
    $restOpenApiOperationCount = 0
    $restDesignPath = Join-Path $PSScriptRoot 'SHF_REST_API_DETAILED_DESIGN.md'
    if ($DocumentationScope -eq 'All' -and (Test-Path -LiteralPath $restDesignPath -PathType Leaf)) {
        $restDesign = [IO.File]::ReadAllText($restDesignPath)
        $restRequiredSections = @(
            '## 1. Purpose and Design Authority',
            '## 2. Backend Architecture',
            '### 2.4 UI Navigation versus API Calls',
            '### 2.5 UI-Only Navigation Inventory',
            '## 3. Shared HTTP Contract',
            '## 4. Shift Change Walkthrough',
            '## 5. Identity and Authorization',
            '## 6. Concurrency, Idempotency and Validation',
            '## 7. Shared Resource Representations',
            '## 8. Business Endpoint Contracts',
            '## 9. Operation Resources and Recovery',
            '## 10. Error Contract',
            '## 11. Persistence and Transaction Design',
            '## 12. Integration REST Boundaries',
            '## 13. OpenAPI Contract and Implementation Pattern',
            '### 13.3 Node.js Solution Adaptation',
            '## 14. Operational and Security Requirements',
            '## 15. Legacy Coverage and Migration',
            '## 16. Test Design and Release Gates',
            '## 17. Approval Register and Deliverable Verification'
        )
        foreach ($section in $restRequiredSections) {
            if (-not $restDesign.Contains($section)) {
                throw "Missing REST design section: $section"
            }
        }
        $restCoverageSection = [regex]::Match($restDesign,
            '(?s)### 15\.1 Action Coverage Matrix(.*?)### 15\.2').Groups[1].Value
        $restCoverage = @{}
        foreach ($row in [regex]::Matches($restCoverageSection,
                '(?m)^\|\s*`([^`]+)`\s*\|\s*([0-9]+)\s*\|')) {
            $actionType = $row.Groups[1].Value
            if ($restCoverage.ContainsKey($actionType)) {
                throw "Duplicate REST legacy coverage row: $actionType"
            }
            $restCoverage[$actionType] = [int]$row.Groups[2].Value
        }
        $sourceActionTypes = @($struts.SelectNodes('/struts-config/action-mappings/action') | Group-Object type)
        if ($restCoverage.Count -ne $sourceActionTypes.Count) {
            throw 'REST legacy coverage must contain exactly one row per source action type.'
        }
        foreach ($actionType in $sourceActionTypes) {
            if (-not $restCoverage.ContainsKey($actionType.Name) -or
                $restCoverage[$actionType.Name] -ne $actionType.Count) {
                throw "REST legacy mapping count mismatch: $($actionType.Name)"
            }
        }
        $restActionTypeCount = $restCoverage.Count
        $restRouteInventory = Get-ShfHttpRouteInventory -Design $restDesign
        $restUiRouteCount = $restRouteInventory.Ui.Count
        $restEndpoints = $restRouteInventory.Backend
        $restEndpointCount = $restEndpoints.Count
        $restBusinessEndpointCount = @($restEndpoints.Keys | Where-Object { $_ -match ' /api/v1/' }).Count
        $restAuthEndpointCount = @($restEndpoints.Keys | Where-Object { $_ -match ' /auth/' }).Count
        $restInternalEndpointCount = @($restEndpoints.Keys | Where-Object { $_ -match ' /internal/' }).Count
        $qualifiedDesign = $restDesign.Replace('| `GET` | `/me` |', '| `GET` | `/api/v1/me` |')
        $qualifiedInventory = Get-ShfHttpRouteInventory -Design $qualifiedDesign
        if ($qualifiedInventory.Backend.Count -ne $restEndpointCount -or
            -not $qualifiedInventory.Backend.ContainsKey('GET /api/v1/me')) {
            throw 'Already qualified API paths must not be prefixed twice.'
        }
        $routeNegativeCases = @(
            [pscustomobject]@{
                Name         = 'UI_POST'
                Design       = $restDesign.Replace('| `/app` | `GET` |', '| `/app` | `POST` |')
                ErrorPattern = 'UI inventory must contain GET'
            }
            [pscustomobject]@{
                Name         = 'API_IN_UI'
                Design       = $restDesign.Replace('| `/app` | `GET` |', '| `/api/v1/me` | `GET` |')
                ErrorPattern = 'UI inventory must contain GET'
            }
            [pscustomobject]@{
                Name         = 'DUPLICATE_UI'
                Design       = $restDesign.Replace('| `/app/me/messages` | `GET` |', '| `/app` | `GET` |')
                ErrorPattern = 'Duplicate UI document route'
            }
            [pscustomobject]@{
                Name         = 'UI_IN_BACKEND'
                Design       = $restDesign + [Environment]::NewLine + '| `GET` | `/app/leaked-view` | None. |'
                ErrorPattern = 'UI document routes must not appear'
            }
            [pscustomobject]@{
                Name         = 'PREFIXED_UI_IN_BACKEND'
                Design       = $restDesign + [Environment]::NewLine + '| `GET` | `/api/v1/app/leaked-view` | None. |'
                ErrorPattern = 'UI document routes must not appear'
            }
        )
        foreach ($testCase in $routeNegativeCases) {
            $rejection = $null
            try { $null = Get-ShfHttpRouteInventory -Design $testCase.Design }
            catch { $rejection = $_.Exception.Message }
            if ([string]::IsNullOrWhiteSpace($rejection) -or $rejection -notmatch $testCase.ErrorPattern) {
                throw "Route inventory negative case failed: $($testCase.Name)"
            }
            $restRouteNegativeCaseCount++
        }
        $restOpenApi = $null
        foreach ($fixture in [regex]::Matches($restDesign, '(?s)```json\r?\n(.*?)\r?\n```')) {
            $fixtureObject = $fixture.Groups[1].Value | ConvertFrom-Json
            $restJsonFixtureCount++
            if ($null -ne $fixtureObject.openapi) {
                if ($null -ne $restOpenApi) {
                    throw 'Expected one self-contained REST OpenAPI example.'
                }
                $restOpenApi = $fixtureObject
            }
        }
        if ($restJsonFixtureCount -lt 6 -or $null -eq $restOpenApi -or
            $restOpenApi.openapi -ne '3.1.0') {
            throw 'Expected at least six REST JSON examples including an OpenAPI 3.1 example.'
        }
        $restOperationIds = @{}
        foreach ($pathProperty in $restOpenApi.paths.PSObject.Properties) {
            if ($pathProperty.Name -match '^/(?:api/v1/)?app(?:/|$)') {
                throw "UI document routes must not appear in business OpenAPI: $($pathProperty.Name)"
            }
            foreach ($methodProperty in $pathProperty.Value.PSObject.Properties) {
                if ($methodProperty.Name -notin @('get', 'post', 'put', 'patch', 'delete', 'head', 'options')) { continue }
                $restOperation = $methodProperty.Value
                if ([string]::IsNullOrWhiteSpace($restOperation.operationId) -or
                    [string]::IsNullOrWhiteSpace($restOperation.'x-capability')) {
                    throw 'Each REST OpenAPI operation needs an operationId and explicit capability policy.'
                }
                if ($restOperationIds.ContainsKey($restOperation.operationId)) {
                    throw "Duplicate REST OpenAPI operationId: $($restOperation.operationId)"
                }
                $restOperationIds[$restOperation.operationId] = $true
                $endpoint = $methodProperty.Name.ToUpperInvariant() + ' /api/v1' + $pathProperty.Name
                if (-not $restEndpoints.ContainsKey($endpoint)) {
                    throw "REST OpenAPI operation is missing from the endpoint catalogue: $endpoint"
                }
                $restOpenApiOperationCount++
            }
        }
        $restNodes = New-Object 'System.Collections.Generic.Queue[object]'
        $restNodes.Enqueue($restOpenApi)
        while ($restNodes.Count -gt 0) {
            $restNode = $restNodes.Dequeue()
            if ($restNode -is [Array]) {
                foreach ($child in $restNode) { $restNodes.Enqueue($child) }
            }
            elseif ($restNode -is [pscustomobject]) {
                foreach ($property in $restNode.PSObject.Properties) {
                    if ($property.Name -ceq '$ref') {
                        $reference = [string]$property.Value
                        if (-not $reference.StartsWith('#/', [StringComparison]::Ordinal)) {
                            throw "REST OpenAPI example must use self-contained references: $reference"
                        }
                        $target = $restOpenApi
                        foreach ($segment in $reference.Substring(2).Split('/')) {
                            $pointerName = $segment.Replace('~1', '/').Replace('~0', '~')
                            $targetProperty = $target.PSObject.Properties | Where-Object { $_.Name -ceq $pointerName }
                            if ($null -eq $targetProperty) {
                                throw "Unresolved REST OpenAPI reference: $reference"
                            }
                            $target = $targetProperty.Value
                        }
                        $restReferenceCount++
                    }
                    elseif ($property.Value -is [Array] -or $property.Value -is [pscustomobject]) {
                        $restNodes.Enqueue($property.Value)
                    }
                }
            }
        }
    }
    $angularUiRouteCount = 0
    $angularScreenCount = 0
    $angularApiBindingCount = 0
    $angularOperationStateCount = 0
    $angularJsonFixtureCount = 0
    $angularNegativeCaseCount = 0
    $angularDesignPath = Join-Path $PSScriptRoot 'SHF_ANGULAR_UI_DETAILED_DESIGN.md'
    if ($DocumentationScope -eq 'All' -and (Test-Path -LiteralPath $angularDesignPath -PathType Leaf)) {
        if (-not (Test-Path -LiteralPath $restDesignPath -PathType Leaf)) {
            throw 'Angular design validation requires the REST design inventory.'
        }
        $angularDesign = [IO.File]::ReadAllText($angularDesignPath)
        $angularRequiredSections = @(
            '## 1. Purpose and Evidence',
            '## 2. Existing UI Baseline',
            '## 3. Angular Architecture',
            '## 4. Routing and Navigation',
            '## 5. Session, Permissions and Browser Security',
            '## 6. State and API Integration',
            '## 7. Dates, Time, Precision and Localization',
            '## 8. Shared UI, Responsive Design and Accessibility',
            '## 9. Detailed Screen Specifications',
            '## 10. Shift Editor Reference Flow and Angular Patterns',
            '## 11. Operations, Refresh and Recovery',
            '## 12. Proposed Angular Implementation Structure',
            '## 13. Quality, Performance and Test Design',
            '## 14. Deployment and Incremental Migration',
            '## 15. Decision and Risk Register',
            '## 16. Source Traceability and Deliverable Verification'
        )
        foreach ($section in $angularRequiredSections) {
            if (-not $angularDesign.Contains($section)) {
                throw "Missing Angular design section: $section"
            }
        }
        $canonicalStateSection = [regex]::Match($restDesign,
            '(?s)### 9\.2 Canonical Operation States(.*?)(?=\r?\n### )')
        $canonicalStates = @([regex]::Matches($canonicalStateSection.Groups[1].Value,
                '(?m)^\|\s*`([A-Z_]+)`\s*\|') | ForEach-Object { $_.Groups[1].Value })
        if ($canonicalStates.Count -eq 0) {
            throw 'Missing canonical REST operation states for Angular validation.'
        }
        $angularInventory = Get-ShfAngularUiInventory -Design $angularDesign `
            -UiRoutes $restRouteInventory.Ui -BackendRoutes $restRouteInventory.Backend `
            -OperationStates $canonicalStates
        $angularUiRouteCount = $angularInventory.Ui.Count
        $angularScreenCount = $angularInventory.Screens.Count
        $angularApiBindingCount = $angularInventory.ApiBindings.Count
        $angularOperationStateCount = $angularInventory.OperationStates.Count
        $angularJsonFixtureCount = $angularInventory.JsonFixtures
        $angularNegativeCases = @(
            [pscustomobject]@{
                Name         = 'DUPLICATE_UI'
                Design       = $angularDesign.Replace('| `/app/me/messages` | `UI-002` |', '| `/app` | `UI-002` |')
                ErrorPattern = 'Duplicate Angular UI document route'
            }
            [pscustomobject]@{
                Name         = 'API_IN_UI'
                Design       = $angularDesign.Replace('| `/app/me/messages` | `UI-002` |', '| `/api/v1/me` | `UI-002` |')
                ErrorPattern = 'Angular manifest must contain UI document paths'
            }
            [pscustomobject]@{
                Name         = 'MISSING_SCREEN'
                Design       = $angularDesign.Replace('### 9.2 Personal Messages: UI-002', '### 9.2 Personal Messages: omitted')
                ErrorPattern = 'Missing Angular screen specification'
            }
            [pscustomobject]@{
                Name         = 'UNKNOWN_API'
                Design       = $angularDesign + [Environment]::NewLine + '`GET /api/v1/not-an-approved-ui-contract`'
                ErrorPattern = 'Unknown Angular API method/path binding'
            }
            [pscustomobject]@{
                Name         = 'MISSING_OPERATION_STATE'
                Design       = $angularDesign.Replace('| `SYNC_UNKNOWN` | Publish/remote outcome uncertain.', '| `UNAPPROVED_STATE` | Publish/remote outcome uncertain.')
                ErrorPattern = 'Missing Angular operation state'
            }
            [pscustomobject]@{
                Name         = 'INVALID_JSON'
                Design       = $angularDesign.Replace('"expectedHttpStatus": 202', '"expectedHttpStatus": INVALID')
                ErrorPattern = 'Invalid Angular JSON fixture'
            }
        )
        foreach ($testCase in $angularNegativeCases) {
            $rejection = $null
            try {
                $null = Get-ShfAngularUiInventory -Design $testCase.Design `
                    -UiRoutes $restRouteInventory.Ui -BackendRoutes $restRouteInventory.Backend `
                    -OperationStates $canonicalStates
            }
            catch { $rejection = $_.Exception.Message }
            if ([string]::IsNullOrWhiteSpace($rejection) -or $rejection -notmatch $testCase.ErrorPattern) {
                throw "Angular documentation negative case failed: $($testCase.Name)"
            }
            $angularNegativeCaseCount++
        }
    }
    $validationResult = 'FULL_VALIDATION_PASS'
    if ($DocumentationScope -eq 'CurrentProject') { $validationResult = 'CURRENT_PROJECT_VALIDATION_PASS' }
    [pscustomobject]@{
        Result                      = $validationResult
        DocumentationScope          = $DocumentationScope
        Documents                   = $documentationFiles.Count
        Requirements                = $scopeRequirements.Count
        ProjectJsonFixtures         = $projectJsonFixtures.Count
        LocalLinks                  = $linkCount
        SourceLineReferences        = $lineReferenceCount
        CapabilityRoutes            = $capabilityRoutes
        FormBindings                = $struts.SelectNodes('/struts-config/form-beans/form-bean').Count
        MetadataSelects             = $statements.Count
        TibcoXmlFixtures            = $tibcoFixtureCount
        TibcoNegativeCases          = $tibcoRejectionCount
        RestUiDocumentRoutes        = $restUiRouteCount
        RestRouteNegativeCases      = $restRouteNegativeCaseCount
        RestEndpointContracts       = $restEndpointCount
        RestBusinessContracts       = $restBusinessEndpointCount
        RestAuthContracts           = $restAuthEndpointCount
        RestInternalContracts       = $restInternalEndpointCount
        RestJsonFixtures            = $restJsonFixtureCount
        RestLegacyActionTypes       = $restActionTypeCount
        RestOpenApiOperations       = $restOpenApiOperationCount
        RestOpenApiReferences       = $restReferenceCount
        AngularUiDocumentRoutes     = $angularUiRouteCount
        AngularScreenSpecifications = $angularScreenCount
        AngularApiBindings          = $angularApiBindingCount
        AngularOperationStates      = $angularOperationStateCount
        AngularJsonFixtures         = $angularJsonFixtureCount
        AngularNegativeCases        = $angularNegativeCaseCount
    } | ConvertTo-Json -Compress
}

if ($Mode -eq 'Inventory') {
    $paths = @('SHF\src', 'SHF\wfm', 'SHFBatch\src', 'SHFEJB\ejbModule\ejbs')
    foreach ($relative in $paths) {
        $files = @(Get-ChildItem -LiteralPath (Join-Path $root $relative) -Recurse -File -Filter '*.java')
        $lines = 0
        foreach ($file in $files) { $lines += [IO.File]::ReadAllLines($file.FullName).Length }
        [pscustomobject]@{ Source = $relative; Files = $files.Count; Lines = $lines } |
        ConvertTo-Json -Compress
    }
    $actions = $struts.SelectNodes('/struts-config/action-mappings/action')
    $actions | Group-Object type | Sort-Object Count -Descending |
    ForEach-Object {
        [pscustomobject]@{ Action = $_.Name; Routes = $_.Count } | ConvertTo-Json -Compress
    }
    $viewRoot = Join-Path $root 'SHFWeb\WebContent\jsp'
    [pscustomobject]@{
        JspFiles  = @(Get-ChildItem -LiteralPath $viewRoot -Recurse -File -Filter '*.jsp').Count
        FormBeans = $struts.SelectNodes('/struts-config/form-beans/form-bean').Count
    } | ConvertTo-Json -Compress
}

if ($Mode -eq 'Config') {
    foreach ($environment in @('local-dvlp', 'server-dvlp', 'server-test', 'server-prod')) {
        $base = Join-Path $root ('SHFWeb\WebContent\WEB-INF\env\' + $environment)
        [xml]$config = [IO.File]::ReadAllText((Join-Path $base 'shf-config.xml'))
        $safe = @(
            'environment', 'version', 'versionDate', 'contextUri', 'clientCharset',
            'serverCharset', 'initializer', 'name', 'dataSourceName', 'isDefaultDb',
            'factory', 'protocol', 'watch', 'watchInterval'
        )
        foreach ($node in $config.SelectNodes('//*')) {
            $values = @()
            foreach ($attribute in $node.Attributes) {
                if ($safe -contains $attribute.Name) {
                    $values += ($attribute.Name + '=' + $attribute.Value)
                }
            }
            if ($values.Count -gt 0) {
                "$environment | $($node.Name) | $($values -join ', ')"
            }
        }
        [xml]$additional = [IO.File]::ReadAllText((Join-Path $base 'additional.xml'))
        foreach ($node in $additional.SelectNodes('//*')) {
            $values = @()
            foreach ($attribute in $node.Attributes) {
                if (@('queueName', 'queueJndiName', 'port', 'scheme', 'account') -contains $attribute.Name) {
                    $values += ($attribute.Name + '=' + $attribute.Value)
                }
            }
            if ($values.Count -gt 0) {
                "$environment | $($node.ParentNode.Name)/$($node.Name) | $($values -join ', ')"
            }
        }
        "$environment | secret attributes present (values intentionally withheld): $(@($additional.SelectNodes('//@pass | //@user')).Count)"
    }
}