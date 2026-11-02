[CmdletBinding()]
param([switch]$OpenBrowser)

# Dot-source to define functions only. No imports, builds or service operations.
function Stop-ShifterTestEnvironmentCheck {
    param([string]$Code)
    $actions = @{
        DOCKER_MISSING = 'Install/use the approved Windows Docker Desktop CLI; nothing was installed.'
        DOCKER_FAILED = 'Docker is unavailable or a bounded command failed. Operator: check Docker Desktop; no automatic restart.'
        DOCKER_OVERRIDE = 'Use the current local Docker context without Docker endpoint/config overrides.'
        DOCKER_REMOTE = 'The current Docker context must use the local Docker Desktop named pipe; no context was changed.'
        ABSENT = 'The three approved fixture projects must already exist. Ask the fixture owner to prepare the accepted cached images/projects; this launcher never builds, pulls or seeds.'
        PARTIAL = 'Incomplete or duplicate existing fixture project. Owner must reconcile it explicitly; no compose up/start/reset was attempted.'
        UNHEALTHY = 'Existing fixture container is stopped/unhealthy. Owner must investigate. Restart loses volatile fixture state, including consumed cancellation authority; native authority is never restored by restarting.'
        OWNERSHIP = 'Existing project labels, scope, isolation, image purpose or loopback ports do not match the approved fixture topology. Owner must investigate without replacing healthy containers.'
        IMAGE = 'An existing immutable image is unavailable or not in the accepted fixture image set. Owner must validate the source-built image; no pull/build/tag comparison was attempted.'
        PORT = 'A required loopback port belongs to something other than its exact approved fixture ingress. Owner must resolve it; no process was killed.'
        HTTP = 'A bounded loopback GET failed, redirected, or returned unsafe headers/JSON. Check the existing fixture proxy; no credentials are needed.'
        IDENTITY = 'Synthetic identity, exact T001 scope or exclusive capability family is incorrect. No login fallback was attempted.'
        READINESS = 'Existing fixture readiness/source/frozen-clock or populated inquiry coherence failed. No fixture commands or reset were attempted.'
        CHANGED = 'Fixture IDs, start times or images changed during verification. Investigate concurrent owner activity; this launcher did not restart anything.'
    }
    if (-not $actions.ContainsKey($Code)) { $Code = 'DOCKER_FAILED' }
    $e = New-Object InvalidOperationException("SHF TEST [$Code]: $($actions[$Code])")
    $e.Data['ShifterTestCode'] = $Code
    throw $e
}

function Invoke-ShifterTestDocker {
    param([string[]]$Arguments)
    $command = Get-Command docker.exe -CommandType Application -ErrorAction SilentlyContinue
    if (-not $command) { Stop-ShifterTestEnvironmentCheck DOCKER_MISSING }
    # Only known non-secret arguments are accepted from the functions below.
    # Windows argv escaping, including embedded quotes in Compose/Go templates.
    $quoted = foreach ($a in $Arguments) {
        '"' + ([regex]::Replace(([regex]::Replace($a, '(\\*)"', '$1$1\"')), '(\\+)$', '$1$1')) + '"'
    }
    $info = New-Object Diagnostics.ProcessStartInfo
    $info.FileName = $command.Source
    $info.Arguments = $quoted -join ' '
    $info.UseShellExecute = $false
    $info.CreateNoWindow = $true
    $info.RedirectStandardOutput = $true
    $info.RedirectStandardError = $true
    # Do not forward Oracle, broker, NODE_OPTIONS or unrelated inherited inputs.
    $info.EnvironmentVariables.Clear()
    foreach ($key in @('SystemRoot', 'WINDIR', 'PATH', 'PATHEXT', 'TEMP', 'TMP',
        'USERPROFILE', 'HOME', 'APPDATA', 'LOCALAPPDATA', 'ProgramData')) {
        $value = [Environment]::GetEnvironmentVariable($key, 'Process')
        if ($null -ne $value) { $info.EnvironmentVariables[$key] = $value }
    }
    $process = New-Object Diagnostics.Process
    $process.StartInfo = $info
    try {
        [void]$process.Start()
        $stdout = $process.StandardOutput.ReadToEndAsync()
        $stderr = $process.StandardError.ReadToEndAsync()
        if (-not $process.WaitForExit(15000)) {
            # Kill only this owned CLI child, never a service/container/daemon.
            $process.Kill()
            [void]$process.WaitForExit(2000)
            Stop-ShifterTestEnvironmentCheck DOCKER_FAILED
        }
        if ($process.ExitCode -ne 0) { Stop-ShifterTestEnvironmentCheck DOCKER_FAILED }
        return $stdout.GetAwaiter().GetResult().Trim()
    } catch {
        if ($_.Exception.Data['ShifterTestCode']) { throw }
        Stop-ShifterTestEnvironmentCheck DOCKER_FAILED
    } finally { $process.Dispose() }
}

function Get-ShifterTestProfiles {
    @(
        [pscustomobject]@{ Project = 'shf-full-test'; Mode = 'READONLY'; Port = 18080 }
        [pscustomobject]@{ Project = 'shf-full-test-management'; Mode = 'management'; Port = 18081 }
        [pscustomobject]@{ Project = 'shf-full-test-cancellation'; Mode = 'cancellation'; Port = 18082 }
    )
}

function Get-ShifterTestCapabilities {
    param([string]$Mode)
    $r7 = @('shift-day:read', 'current-shifts:read', 'shift-search:read', 'my-shifts:read',
        'shift-items:read', 'employee:read', 'attendance:read')
    if ($Mode -ceq 'management') {
        return $r7 + @('shift-management:prepare', 'shift-management:create', 'shift-management:change',
            'shift-management:cancel', 'shift-management:csv-preview', 'shift-management:csv-apply',
            'shift-management:test-oracle-write')
    }
    if ($Mode -ceq 'cancellation') {
        return $r7 + @('attendance-station-exit-cancellation:prepare', 'attendance-station-exit-cancellation:commit')
    }
    return $r7
}

function Get-ShifterTestContainers {
    $ids = @()
    foreach ($profile in Get-ShifterTestProfiles) {
        $text = Invoke-ShifterTestDocker @('ps', '-aq', '--no-trunc', '--filter', "label=com.docker.compose.project=$($profile.Project)")
        if ($text) { $ids += @($text -split '\r?\n') }
    }
    if ($ids.Count -eq 0) {
        if (@(Get-ShifterTestListeners).Count) { Stop-ShifterTestEnvironmentCheck PORT }
        Stop-ShifterTestEnvironmentCheck ABSENT
    }
    if ($ids.Count -ne 6) { Stop-ShifterTestEnvironmentCheck PARTIAL }
    if (@($ids | Where-Object { $_ -cnotmatch '^[a-f0-9]{64}$' }).Count) {
        Stop-ShifterTestEnvironmentCheck OWNERSHIP
    }
    # Raw inspect stays in memory. Never print Config.Env, command lines or logs.
    $parsed = Invoke-ShifterTestDocker (@('inspect') + $ids) | ConvertFrom-Json
    foreach ($container in $parsed) { Write-Output $container }
}

function Get-ShifterTestListeners {
    return @([Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() |
        Where-Object { $_.Port -in @(18080, 18081, 18082) })
}

function Assert-ShifterTestTopology {
    param([object[]]$Containers)
    $demoImages = @(
        'sha256:8c891ebe72cfc4885c5186bcb8057365824777ff69c13091dd6b83c875f697e1',
        'sha256:d1c8bda3afadcfb1ce6c02ce6295a2b4dcab96ba0d82be74a6522999e68eb212',
        'sha256:6b8bf5dcfa65f70d1fe461ae06812a9cea0fd286b1556a8fdf566fe3fe3bc335'
    )
    $ingressImage = 'sha256:51119d5d5f661a7b81de52e10f265b8a4c2cb4fa7baba5f48abe8baadd32188a'
    foreach ($p in Get-ShifterTestProfiles) {
        $world = @($Containers | Where-Object { $_.Config.Labels.'com.docker.compose.project' -ceq $p.Project })
        if ($world.Count -ne 2) { Stop-ShifterTestEnvironmentCheck PARTIAL }
        foreach ($service in @('demo', 'ingress')) {
            $matches = @($world | Where-Object { $_.Config.Labels.'com.docker.compose.service' -ceq $service })
            if ($matches.Count -ne 1) { Stop-ShifterTestEnvironmentCheck PARTIAL }
            $c = $matches[0]
            if (-not $c.State.Running -or $c.State.Health.Status -cne 'healthy') {
                Stop-ShifterTestEnvironmentCheck UNHEALTHY
            }
            if ($c.Config.User -cne '101:101' -or -not $c.HostConfig.ReadonlyRootfs -or
                -not $c.HostConfig.Init -or $c.Mounts.Count -ne 0 -or
                @($c.HostConfig.CapDrop) -cnotcontains 'ALL' -or
                @($c.HostConfig.SecurityOpt) -cnotcontains 'no-new-privileges:true' -or
                $c.HostConfig.RestartPolicy.Name -cne 'no') {
                Stop-ShifterTestEnvironmentCheck OWNERSHIP
            }
            $networks = @($c.NetworkSettings.Networks.PSObject.Properties.Name | Sort-Object)
            $expectedNetworks = @("$($p.Project)_demo")
            if ($service -ceq 'ingress') { $expectedNetworks += "$($p.Project)_ingress" }
            if (($networks -join '|') -cne (($expectedNetworks | Sort-Object) -join '|')) {
                Stop-ShifterTestEnvironmentCheck OWNERSHIP
            }
            $bindings = @($c.NetworkSettings.Ports.PSObject.Properties | Where-Object { $null -ne $_.Value })
            if ($service -ceq 'demo') {
                if ($bindings.Count -ne 0 -or
                    $c.Config.Labels.'org.shifter.scope' -cne 'populated-existing-workflows-synthetic-only' -or
                    $c.Config.Labels.'org.shifter.state' -cne 'volatile-frozen-clock-no-native-writes') {
                    Stop-ShifterTestEnvironmentCheck OWNERSHIP
                }
                if ($c.Image -cnotin $demoImages) { Stop-ShifterTestEnvironmentCheck IMAGE }
                $expected = @{
                    NODE_ENV = 'test'; SHF_DEMO_OPT_IN = 'synthetic-full-test'; SHF_FULL_MODE = $p.Mode
                    SHF_FULL_PROFILE = 'test'; SHF_FULL_DEPLOYMENT_CLASS = 'isolated-test-demo'
                    SHF_FULL_SYNTHETIC_ADMINISTRATOR = 'true'; SHF_FULL_PORT = '4301'
                    SHF_FULL_ORIGINS = '["http://127.0.0.1:' + $p.Port + '"]'
                }
                $found = @{}
                foreach ($entry in $c.Config.Env) {
                    $parts = $entry -split '=', 2
                    if ($expected.ContainsKey($parts[0])) { $found[$parts[0]] = $parts[1] }
                    elseif ($parts[0] -match '^(SHF_|NODE_OPTIONS$|ORACLE|TNS_|EMS_)') {
                        Stop-ShifterTestEnvironmentCheck OWNERSHIP
                    }
                }
                foreach ($key in $expected.Keys) {
                    if ($found[$key] -cne $expected[$key]) { Stop-ShifterTestEnvironmentCheck OWNERSHIP }
                }
            } else {
                if ($c.Image -cne $ingressImage) { Stop-ShifterTestEnvironmentCheck IMAGE }
                if ($bindings.Count -ne 1 -or $bindings[0].Name -cne '8080/tcp' -or
                    @($bindings[0].Value).Count -ne 1 -or
                    $bindings[0].Value[0].HostIp -cne '127.0.0.1' -or
                    $bindings[0].Value[0].HostPort -cne [string]$p.Port) {
                    Stop-ShifterTestEnvironmentCheck PORT
                }
            }
            # Existing accepted containers can retain an untagged/deleted image.
            # Their immutable inspected image IDs, not current tag/cache metadata,
            # are the reuse authority. Never recreate them to repair image cache.
            if ($service -ceq 'demo') {
                if ((Invoke-ShifterTestDocker @('exec', $c.Id, 'cat', '/app/packaging-scope')) -cne 'synthetic-full-test' -or
                    (Invoke-ShifterTestDocker @('exec', $c.Id, 'node', '--version')) -cne 'v24.21.0') {
                    Stop-ShifterTestEnvironmentCheck IMAGE
                }
            }
        }
    }
}

function Invoke-ShifterTestGet {
    param([int]$Port, [string]$Path, [datetime]$Deadline = [datetime]::UtcNow.AddSeconds(5))
    if ($Port -notin @(18080, 18081, 18082) -or $Path -cnotmatch '^/(api/v1/|readyz$)') {
        Stop-ShifterTestEnvironmentCheck HTTP
    }
    try {
        $seconds = [Math]::Min(3, [Math]::Ceiling(($Deadline - [datetime]::UtcNow).TotalSeconds))
        if ($seconds -le 0) { Stop-ShifterTestEnvironmentCheck HTTP }
        $response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$Port$Path" `
            -TimeoutSec $seconds -MaximumRedirection 0 -ErrorAction Stop
        if ($response.StatusCode -ne 200 -or
            $response.Headers['Content-Type'] -cnotmatch '^application/json(; charset=utf-8)?$' -or
            $response.Headers['X-Content-Type-Options'] -cne 'nosniff' -or
            $response.Headers['Cache-Control'] -cne 'no-store') { Stop-ShifterTestEnvironmentCheck HTTP }
        # PS5.1 may decode unlabelled JSON using an ANSI code page. Decode bytes explicitly.
        $body = [Text.Encoding]::UTF8.GetString($response.RawContentStream.ToArray()) | ConvertFrom-Json
        if ([datetime]::UtcNow -gt $Deadline) { Stop-ShifterTestEnvironmentCheck HTTP }
        return $body
    } catch {
        if ($_.Exception.Data['ShifterTestCode']) { throw }
        Stop-ShifterTestEnvironmentCheck HTTP
    }
}

function Get-ShifterTestInquiryPaths {
    param([string]$Mode)
    # Exact pure fullInquiryPaths protocol from backend/fixture-slice/populated-world.mts.
    $employee = '1'; $day = '19001'
    $query = 'attendanceDate=2026-11-01&timeFrom=11:00&timeTo=11:00&teamCodes=T001'
    if ($Mode -ceq 'cancellation') { $employee = '9001'; $day = '6201' }
    else { $query += '&innerJobCodes=101&workLocations=site' }
    @(
        '/api/v1/current-shifts?mode=at&attendanceDate=2026-11-01&currentTime=12:00'
        "/api/v1/shift-search?$query"
        "/api/v1/my-shifts?mode=selected&employeeId=$employee&dateFrom=2026-11-01&dateTo=2026-11-07"
        "/api/v1/employees/$employee/shift-days/$day"
        "/api/v1/employees/$employee/shift-days/$day/breaks-and-exceptions"
        "/api/v1/employees/$employee/operational-card"
        "/api/v1/attendance?$query"
        '/api/v1/current-shifts/filter-context'
        '/api/v1/shift-search/filter-context'
        "/api/v1/my-shifts/context?mode=selected&employeeId=$employee"
        '/api/v1/attendance/filter-context'
    )
}

function Assert-ShifterTestWorld {
    param($Profile)
    # Five seconds for each complete 13-GET world, not 13 independent retries.
    $deadline = [datetime]::UtcNow.AddSeconds(5)
    $ready = Invoke-ShifterTestGet $Profile.Port '/readyz' -Deadline $deadline
    if ($ready.ready -isnot [bool] -or $ready.ready -cne $true -or
        $ready.profile -cne 'test' -or $ready.mode -cne $Profile.Mode -or
        $ready.dataSource -cne 'isolated-fixture' -or $ready.authentication -cne 'synthetic' -or
        $ready.clock -cne 'frozen-demo' -or $ready.clockInstant -cne '2026-11-01T12:00:00.123Z' -or
        $ready.nativeOracle -isnot [bool] -or $ready.nativeEMS -isnot [bool] -or
        $ready.nativeOracle -cne $false -or $ready.nativeEMS -cne $false) {
        Stop-ShifterTestEnvironmentCheck READINESS
    }
    $identity = Invoke-ShifterTestGet $Profile.Port '/api/v1/identity' -Deadline $deadline
    $p = $identity.principal
    if ($identity.dataSource -cne 'isolated-fixture' -or $p.subject -cne 'synthetic:administrator' -or
        $p.synthetic -isnot [bool] -or $p.synthetic -cne $true -or $p.provider -cne 'synthetic' -or
        @($p.PSObject.Properties.Name) -cnotcontains 'employeeId' -or $null -ne $p.employeeId -or
        $p.roles -isnot [array] -or $p.capabilities -isnot [array] -or
        $p.resourceScope.orgUnitIds -isnot [array] -or
        (@($p.roles) -join '|') -cne 'Administrator' -or
        (@($p.capabilities) -join '|') -cne ((Get-ShifterTestCapabilities $Profile.Mode) -join '|') -or
        (@($p.resourceScope.orgUnitIds) -join '|') -cne 'T001' -or
        @($p.resourceScope.PSObject.Properties).Count -ne 1) {
        Stop-ShifterTestEnvironmentCheck IDENTITY
    }
    $index = 0
    foreach ($path in Get-ShifterTestInquiryPaths $Profile.Mode) {
        $body = Invoke-ShifterTestGet $Profile.Port $path -Deadline $deadline
        $text = $body | ConvertTo-Json -Depth 40 -Compress
        $employee = '1'; $day = '19001'
        if ($Profile.Mode -ceq 'cancellation') { $employee = '9001'; $day = '6201' }
        if (-not $text.Contains('"dataSource":"isolated-fixture"') -or
            ($index -lt 7 -and (-not $text.Contains('"employeeId":"' + $employee + '"') -or
                -not $text.Contains('T001') -or
                ($index -ne 5 -and -not $text.Contains('"shiftDayId":"' + $day + '"')))) -or
            ($index -eq 7 -and -not $text.Contains('M001')) -or
            ($index -gt 7 -and -not $text.Contains('T001')) -or
            $text -cmatch '"code":"(T002|T003|M002)"') {
            Stop-ShifterTestEnvironmentCheck READINESS
        }
        $index++
    }
}

function Get-ShifterTestSnapshot {
    param([object[]]$Containers)
    return (($Containers | Sort-Object Id | ForEach-Object {
        "$($_.Id)|$($_.Image)|$($_.State.StartedAt)"
    }) -join "`n")
}

function Start-ShifterTestEnvironment {
    [CmdletBinding()]
    param([switch]$OpenBrowser)
    $ErrorActionPreference = 'Stop'
    foreach ($name in @('DOCKER_HOST', 'DOCKER_CONTEXT', 'DOCKER_TLS_VERIFY', 'DOCKER_CERT_PATH',
        'DOCKER_CONFIG', 'DOCKER_API_VERSION')) {
        if ([Environment]::GetEnvironmentVariable($name, 'Process')) { Stop-ShifterTestEnvironmentCheck DOCKER_OVERRIDE }
    }
    $context = Invoke-ShifterTestDocker @('context', 'show')
    $endpoint = Invoke-ShifterTestDocker @('context', 'inspect', '--format', '{{.Endpoints.docker.Host}}')
    if ($context -notmatch '^[a-zA-Z0-9_.-]+$' -or
        $endpoint -cne 'npipe:////./pipe/dockerDesktopLinuxEngine') {
        Stop-ShifterTestEnvironmentCheck DOCKER_REMOTE
    }
    # Explicit invocation is opt-in. Restore all four process settings even on failure.
    # Child Docker has a minimum independent environment, never these or native inputs.
    $keys = @('SHF_DEMO_OPT_IN', 'SHF_FULL_MODE', 'SHF_FULL_ORIGINS', 'SHF_DEMO_HOST_PORT')
    $previous = @{}
    foreach ($key in $keys) { $previous[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }
    try {
        [Environment]::SetEnvironmentVariable('SHF_DEMO_OPT_IN', 'synthetic-full-test', 'Process')
        $before = @(Get-ShifterTestContainers)
        Assert-ShifterTestTopology $before
        foreach ($profile in Get-ShifterTestProfiles) {
            [Environment]::SetEnvironmentVariable('SHF_FULL_MODE', $profile.Mode, 'Process')
            [Environment]::SetEnvironmentVariable('SHF_FULL_ORIGINS', ('["http://127.0.0.1:' + $profile.Port + '"]'), 'Process')
            [Environment]::SetEnvironmentVariable('SHF_DEMO_HOST_PORT', [string]$profile.Port, 'Process')
            Assert-ShifterTestWorld $profile
        }
        $after = @(Get-ShifterTestContainers)
        if ((Get-ShifterTestSnapshot $before) -cne (Get-ShifterTestSnapshot $after)) {
            Stop-ShifterTestEnvironmentCheck CHANGED
        }
        foreach ($c in $after) {
            if (-not $c.State.Running -or $c.State.Health.Status -cne 'healthy') {
                Stop-ShifterTestEnvironmentCheck UNHEALTHY
            }
        }
        Write-Output "SHF COMPLETE IMPLEMENTED TEST: reused six healthy containers unchanged ($context; local named pipe)."
        Write-Output 'READONLY     http://127.0.0.1:18080/  inquiries (7 capabilities)'
        Write-Output 'management   http://127.0.0.1:18081/  fixture management writes (14 capabilities)'
        Write-Output 'cancellation http://127.0.0.1:18082/  fixture cancellation (9 capabilities; consumed authority preserved)'
        Write-Output 'PASS: 3 readiness + 3 identity + 21 inquiry + 12 context GETs; no business POSTs.'
        Write-Output 'Synthetic Administrator only; T001; frozen 2026-11-01T12:00:00.123Z UTC; isolated-fixture.'
        Write-Output 'Existing manager edits/consumed C52 retained. A disabled cancellation action is not a startup defect.'
        Write-Output 'No Oracle/EMS/native/production authority or full legacy rewrite claim; native controls remain fenced.'
        Write-Output 'No builds, pulls, installs, service starts/restarts, compose operations or resets. Close browser to leave services unchanged.'
        if ($OpenBrowser) { Start-Process 'http://127.0.0.1:18080/' }
    } finally {
        foreach ($key in $keys) { [Environment]::SetEnvironmentVariable($key, $previous[$key], 'Process') }
    }
}

if ($MyInvocation.InvocationName -ne '.') {
    try { Start-ShifterTestEnvironment -OpenBrowser:$OpenBrowser }
    catch {
        if ($_.Exception.Data['ShifterTestCode']) { Write-Output $_.Exception.Message }
        else { Write-Output 'SHF TEST [READINESS]: Unexpected fixture verification failure; no service mutation attempted. Ask the fixture owner to investigate.' }
        exit 1
    }
}
