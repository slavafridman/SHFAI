[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
$main = Join-Path $PSScriptRoot 'Start-ShifterTestEnvironment.ps1'
$tokens = $null; $errors = $null
[void][Management.Automation.Language.Parser]::ParseFile($main, [ref]$tokens, [ref]$errors)
if ($errors.Count) { throw 'Launcher syntax failed.' }
. $main
$script:passed = 0
function Assert-Test {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw "FAIL $Message" }
}
function Test-Case {
    param([string]$Name, [scriptblock]$Action, [string]$Code)
    Reset-TestWorld
    try {
        & $Action
        if ($Code) { throw "Expected $Code" }
    } catch {
        if (-not $Code -or $_.Exception.Data['ShifterTestCode'] -cne $Code) { throw }
    }
    $script:passed++
    Write-Output "PASS $Name"
}

$script:actualGet = ${function:Invoke-ShifterTestGet}
$script:actualDocker = ${function:Invoke-ShifterTestDocker}
function Reset-TestWorld {
    $script:world = @()
    $script:calls = @()
    $script:gets = @()
    $script:scenario = ''
    $script:listeners = @()
    $script:state = 'manager4/C52-consumed'
    $index = 0
    $images = @(
        'sha256:8c891ebe72cfc4885c5186bcb8057365824777ff69c13091dd6b83c875f697e1',
        'sha256:d1c8bda3afadcfb1ce6c02ce6295a2b4dcab96ba0d82be74a6522999e68eb212',
        'sha256:6b8bf5dcfa65f70d1fe461ae06812a9cea0fd286b1556a8fdf566fe3fe3bc335'
    )
    foreach ($p in Get-ShifterTestProfiles) {
        foreach ($service in @('demo', 'ingress')) {
            $index++
            $labels = @{
                'com.docker.compose.project' = $p.Project
                'com.docker.compose.service' = $service
                'org.shifter.scope' = 'populated-existing-workflows-synthetic-only'
                'org.shifter.state' = 'volatile-frozen-clock-no-native-writes'
            }
            $envs = @('NODE_ENV=test', 'SHF_DEMO_OPT_IN=synthetic-full-test', "SHF_FULL_MODE=$($p.Mode)",
                'SHF_FULL_PROFILE=test', 'SHF_FULL_DEPLOYMENT_CLASS=isolated-test-demo',
                'SHF_FULL_SYNTHETIC_ADMINISTRATOR=true', 'SHF_FULL_PORT=4301',
                ('SHF_FULL_ORIGINS=["http://127.0.0.1:' + $p.Port + '"]'))
            $networks = @{}; $networks["$($p.Project)_demo"] = @{}
            $ports = @{ '8080/tcp' = $null }
            $image = $images[[int][Math]::Floor(($index - 1) / 2)]
            if ($service -ceq 'ingress') {
                $image = 'sha256:51119d5d5f661a7b81de52e10f265b8a4c2cb4fa7baba5f48abe8baadd32188a'
                $networks["$($p.Project)_ingress"] = @{}
                $ports['8080/tcp'] = @(@{ HostIp = '127.0.0.1'; HostPort = [string]$p.Port })
            }
            # Round trip produces the same PSCustomObject graph as Docker JSON.
            $c = @{
                Id = ('{0:x64}' -f $index); Image = $image; Mounts = @()
                State = @{ Running = $true; Health = @{ Status = 'healthy' }; StartedAt = "2026-11-01T10:00:0${index}Z" }
                Config = @{ User = '101:101'; Labels = $labels; Env = $envs }
                HostConfig = @{ ReadonlyRootfs = $true; Init = $true; CapDrop = @('ALL')
                    SecurityOpt = @('no-new-privileges:true'); RestartPolicy = @{ Name = 'no' } }
                NetworkSettings = @{ Ports = $ports; Networks = $networks }
            } | ConvertTo-Json -Depth 20 | ConvertFrom-Json
            $script:world += $c
        }
    }
}

# All Docker and HTTP behavior below is synthetic, never an actual engine call.
function Invoke-ShifterTestDocker {
    param([string[]]$Arguments)
    $script:calls += ,$Arguments
    switch ($Arguments[0]) {
        'context' {
            if ($script:scenario -ceq 'daemon') { Stop-ShifterTestEnvironmentCheck DOCKER_FAILED }
            if ($Arguments[1] -ceq 'show') { return 'desktop-linux' }
            if ($script:scenario -ceq 'remote') { return 'tcp://unapproved.invalid:2375' }
            return 'npipe:////./pipe/dockerDesktopLinuxEngine'
        }
        'ps' {
            $project = $Arguments[-1].Substring('label=com.docker.compose.project='.Length)
            return (($script:world | Where-Object { $_.Config.Labels.'com.docker.compose.project' -ceq $project } |
                ForEach-Object { $_.Id }) -join "`n")
        }
        'inspect' {
            if ($script:scenario -ceq 'changed' -and $script:gets.Count -gt 0) {
                $script:world[0].State.StartedAt = '2026-11-02T00:00:00Z'
            }
            return ConvertTo-Json -InputObject @($script:world) -Depth 30 -Compress
        }
        'exec' {
            if ($script:scenario -ceq 'marker') { return 'synthetic-empty-dev' }
            if ($Arguments[2] -ceq 'cat') { return 'synthetic-full-test' }
            return 'v24.21.0'
        }
        default { throw 'Unexpected Docker command: no image cache, build, pull or service operations permitted.' }
    }
}
function Get-ShifterTestListeners { return $script:listeners }
function Invoke-ShifterTestGet {
    param([int]$Port, [string]$Path, [datetime]$Deadline)
    $script:gets += "$Port$Path"
    $p = Get-ShifterTestProfiles | Where-Object { $_.Port -eq $Port }
    if ($Path -ceq '/readyz') {
        $result = [pscustomobject]@{
            ready = $true; profile = 'test'; mode = $p.Mode; dataSource = 'isolated-fixture'
            authentication = 'synthetic'; clock = 'frozen-demo'; clockInstant = '2026-11-01T12:00:00.123Z'
            nativeOracle = $false; nativeEMS = $false
        }
        if ($script:scenario -ceq 'native') { $result.nativeOracle = $true }
        return $result
    }
    if ($Path -ceq '/api/v1/identity') {
        $result = [pscustomobject]@{
            dataSource = 'isolated-fixture'
            principal = [pscustomobject]@{ subject = 'synthetic:administrator'; provider = 'synthetic'
                synthetic = $true; employeeId = $null; roles = @('Administrator')
                capabilities = @(Get-ShifterTestCapabilities $p.Mode)
                resourceScope = [pscustomobject]@{ orgUnitIds = @('T001') } }
        }
        switch ($script:scenario) {
            'identity' { $result.principal.synthetic = $false }
            'grants' { $result.principal.capabilities += 'other:commit' }
            'scope' { $result.principal.resourceScope.orgUnitIds += 'T002' }
            'missing-employee' { $result.principal.PSObject.Properties.Remove('employeeId') }
            'scalar-role' { $result.principal.roles = 'Administrator' }
        }
        return $result
    }
    $employee = '1'; $day = '19001'
    if ($p.Mode -ceq 'cancellation') { $employee = '9001'; $day = '6201' }
    return [pscustomobject]@{ dataSource = 'isolated-fixture'; employeeId = $employee; shiftDayId = $day
        orgUnitId = 'T001'; moked = 'M001'; fixtureState = $script:state }
}

$keys = @('SHF_DEMO_OPT_IN', 'SHF_FULL_MODE', 'SHF_FULL_ORIGINS', 'SHF_DEMO_HOST_PORT',
    'DOCKER_HOST', 'DOCKER_CONTEXT', 'DOCKER_TLS_VERIFY', 'DOCKER_CERT_PATH', 'DOCKER_CONFIG', 'DOCKER_API_VERSION')
$previous = @{}
foreach ($key in $keys) {
    $previous[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
    [Environment]::SetEnvironmentVariable($key, $null, 'Process')
}
try {
    Test-Case 'mixed accepted images; no cache lookup; six IDs/start times and writer state preserved' {
        $snapshot = Get-ShifterTestSnapshot $script:world
        $messages = @(Start-ShifterTestEnvironment)
        Assert-Test ($messages.Count -eq 9) 'nine-line handoff'
        Assert-Test ($script:gets.Count -eq 39) '39 safe GETs'
        Assert-Test ((Get-ShifterTestSnapshot $script:world) -ceq $snapshot) 'snapshot constant'
        Assert-Test ($script:state -ceq 'manager4/C52-consumed') 'writer state constant'
        Assert-Test (@($script:calls | Where-Object { $_[0] -notin @('context', 'ps', 'inspect', 'exec') }).Count -eq 0) 'read-only CLI'
    }
    Test-Case 'daemon unavailable, no restart' { $script:scenario = 'daemon'; Start-ShifterTestEnvironment } DOCKER_FAILED
    Test-Case 'remote endpoint rejected' { $script:scenario = 'remote'; Start-ShifterTestEnvironment } DOCKER_REMOTE
    Test-Case 'override rejected before CLI' {
        try {
            [Environment]::SetEnvironmentVariable('DOCKER_HOST', 'synthetic-invalid', 'Process')
            Start-ShifterTestEnvironment
        } finally { [Environment]::SetEnvironmentVariable('DOCKER_HOST', $null, 'Process') }
    } DOCKER_OVERRIDE
    Test-Case 'absent projects do not create or pull' { $script:world = @(); Start-ShifterTestEnvironment } ABSENT
    Test-Case 'absent projects and occupied port stop without killing' {
        $script:world = @(); $script:listeners = @([pscustomobject]@{ Port = 18080 }); Start-ShifterTestEnvironment
    } PORT
    Test-Case 'partial project not repaired' { $script:world = @($script:world | Select-Object -First 5); Start-ShifterTestEnvironment } PARTIAL
    Test-Case 'foreign project labels' { $script:world[0].Config.Labels.'com.docker.compose.project' = 'foreign'; Start-ShifterTestEnvironment } PARTIAL
    Test-Case 'foreign service labels' { $script:world[0].Config.Labels.'com.docker.compose.service' = 'foreign'; Start-ShifterTestEnvironment } PARTIAL
    Test-Case 'stopped fixture not started or reseeded' { $script:world[0].State.Running = $false; Start-ShifterTestEnvironment } UNHEALTHY
    Test-Case 'unhealthy fixture not restarted' { $script:world[0].State.Health.Status = 'unhealthy'; Start-ShifterTestEnvironment } UNHEALTHY
    Test-Case 'unknown image rejected; no automatic pull' { $script:world[0].Image = 'sha256:unknown'; Start-ShifterTestEnvironment } IMAGE
    Test-Case 'wrong purpose marker rejected' { $script:scenario = 'marker'; Start-ShifterTestEnvironment } IMAGE
    Test-Case 'wildcard ingress rejected' {
        $script:world[1].NetworkSettings.Ports.'8080/tcp'[0].HostIp = '0.0.0.0'; Start-ShifterTestEnvironment
    } PORT
    Test-Case 'wrong world port rejected' {
        $script:world[1].NetworkSettings.Ports.'8080/tcp'[0].HostPort = '18081'; Start-ShifterTestEnvironment
    } PORT
    Test-Case 'missing runtime gate rejected' {
        $script:world[0].Config.Env = @($script:world[0].Config.Env | Where-Object { $_ -cne 'NODE_ENV=test' })
        Start-ShifterTestEnvironment
    } OWNERSHIP
    Test-Case 'production mode rejected statically, no startup' {
        $script:world[0].Config.Env = @($script:world[0].Config.Env | ForEach-Object {
            if ($_ -ceq 'NODE_ENV=test') { 'NODE_ENV=production' } else { $_ }
        })
        Start-ShifterTestEnvironment
    } OWNERSHIP
    Test-Case 'native configured input rejected without logging value' {
        $script:world[0].Config.Env += 'SHF_NATIVE_CONFIG=synthetic-rejected'
        Start-ShifterTestEnvironment
    } OWNERSHIP
    Test-Case 'corrupt identity' { $script:scenario = 'identity'; Start-ShifterTestEnvironment } IDENTITY
    Test-Case 'missing null employee binding rejected' { $script:scenario = 'missing-employee'; Start-ShifterTestEnvironment } IDENTITY
    Test-Case 'scalar role instead of exact roles array rejected' { $script:scenario = 'scalar-role'; Start-ShifterTestEnvironment } IDENTITY
    Test-Case 'capability union rejected' { $script:scenario = 'grants'; Start-ShifterTestEnvironment } IDENTITY
    Test-Case 'scope widening rejected' { $script:scenario = 'scope'; Start-ShifterTestEnvironment } IDENTITY
    Test-Case 'native readiness claim rejected' { $script:scenario = 'native'; Start-ShifterTestEnvironment } READINESS
    Test-Case 'concurrent container replacement detected' { $script:scenario = 'changed'; Start-ShifterTestEnvironment } CHANGED
    Test-Case 'four process opt-in keys restored on success and failure' {
        foreach ($key in $keys[0..3]) { [Environment]::SetEnvironmentVariable($key, "synthetic-before-$key", 'Process') }
        [void](Start-ShifterTestEnvironment)
        foreach ($key in $keys[0..3]) {
            Assert-Test ([Environment]::GetEnvironmentVariable($key, 'Process') -ceq "synthetic-before-$key") 'success restore'
        }
        $script:scenario = 'identity'
        try { [void](Start-ShifterTestEnvironment); throw 'Expected identity rejection' }
        catch { Assert-Test ($_.Exception.Data['ShifterTestCode'] -ceq 'IDENTITY') 'identity failure' }
        foreach ($key in $keys[0..3]) {
            Assert-Test ([Environment]::GetEnvironmentVariable($key, 'Process') -ceq "synthetic-before-$key") 'failure restore'
        }
    }
    Test-Case 'capability families and 11 exact inquiry paths reproducible' {
        $expected = @(7, 14, 9); $index = 0
        foreach ($p in Get-ShifterTestProfiles) {
            Assert-Test (@(Get-ShifterTestCapabilities $p.Mode).Count -eq $expected[$index]) 'exact cap count'
            Assert-Test (@(Get-ShifterTestInquiryPaths $p.Mode).Count -eq 11) '11 paths'
            Assert-Test (@(Get-ShifterTestInquiryPaths $p.Mode | Where-Object { $_ -match 'commands|validations|preparations' }).Count -eq 0) 'no writer probes'
            $index++
        }
    }
    Test-Case 'missing Docker is actionable (actual CLI helper, mocked command discovery)' {
        function Get-Command { param($Name, $CommandType, $ErrorAction) return $null }
        try { & $script:actualDocker @('context', 'show') }
        finally { Remove-Item Function:\Get-Command }
    } DOCKER_MISSING

    # Exercise the actual HTTP adapter with synthetic byte streams, never sockets.
    function Invoke-WebRequest {
        param([switch]$UseBasicParsing, $Uri, $TimeoutSec, $MaximumRedirection, $ErrorAction)
        Assert-Test ($MaximumRedirection -eq 0 -and $TimeoutSec -le 3) 'bounded redirects disabled'
        if ($script:scenario -ceq 'redirect') { throw 'synthetic redirect' }
        $headers = @{ 'Content-Type' = 'application/json'; 'X-Content-Type-Options' = 'nosniff'; 'Cache-Control' = 'no-store' }
        if ($script:scenario -ceq 'header') { $headers['X-Content-Type-Options'] = 'nosniff, nosniff' }
        if ($script:scenario -ceq 'type') { $headers['Content-Type'] = 'text/html' }
        $text = '{"label":"' + [char]0x05E9 + '"}'
        if ($script:scenario -ceq 'json') { $text = '{bad' }
        $stream = New-Object IO.MemoryStream(,[Text.Encoding]::UTF8.GetBytes($text))
        return [pscustomobject]@{ StatusCode = 200; Headers = $headers; RawContentStream = $stream }
    }
    Test-Case 'actual HTTP adapter UTF8 bytes, not ANSI Content' {
        $body = & $script:actualGet 18080 '/readyz'
        Assert-Test ($body.label -ceq [string][char]0x05E9) 'UTF8 JSON'
    }
    Test-Case 'redirect fail closed' { $script:scenario = 'redirect'; & $script:actualGet 18080 '/readyz' } HTTP
    Test-Case 'duplicated nosniff fail closed' { $script:scenario = 'header'; & $script:actualGet 18080 '/readyz' } HTTP
    Test-Case 'HTML masquerading as JSON rejected' { $script:scenario = 'type'; & $script:actualGet 18080 '/readyz' } HTTP
    Test-Case 'invalid JSON rejected' { $script:scenario = 'json'; & $script:actualGet 18080 '/readyz' } HTTP
    Test-Case 'nonapproved port rejected before network' { & $script:actualGet 8080 '/readyz' } HTTP
    Test-Case 'expired world budget rejected before network' {
        & $script:actualGet 18080 '/readyz' -Deadline ([datetime]::UtcNow.AddSeconds(-1))
    } HTTP
    $source = Get-Content $main -Raw
    Assert-Test ($source.Contains('$info.EnvironmentVariables.Clear()')) 'minimum child environment'
    Assert-Test ($source.Contains('$process.WaitForExit(15000)') -and $source.Contains('$process.Kill()')) 'owned CLI timeout'
    Assert-Test ($source.Contains('if ($MyInvocation.InvocationName -ne ''.'')')) 'dot-source guard'
    Write-Output "PASS $script:passed synthetic scenarios + parser/child-environment/owned-timeout/dot-source static checks; no Docker engine, HTTP sockets, build or application tests invoked."
} finally {
    foreach ($key in $keys) { [Environment]::SetEnvironmentVariable($key, $previous[$key], 'Process') }
}
