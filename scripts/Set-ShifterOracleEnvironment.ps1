# Dot-source this file, then call Set-ShifterOracleEnvironment in the launcher
# process. This file alone does not read secrets or change any environment.
function Set-ShifterOracleEnvironment {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [ValidateSet('dev', 'test', 'production')]
        [string]$Profile,
        [string]$ConnectString = 'CTIDBT_WFMT',
        [string]$ClientLibDir = $env:SHF_ORACLE_CLIENT_LIB_DIR,
        [string]$TnsAdmin = $env:TNS_ADMIN,
        [switch]$NonInteractive
    )

    # Profile is an operator label, not authority to switch SHF_APP_ENV or
    # enable a datasource, synthetic authentication, native mode or writer.
    if ($ConnectString.ToUpperInvariant() -cnotin @('CTIDBT_WFMT', 'CTIDBT_WFMT.WORLD')) {
        throw 'Oracle target alias must be an approved CTIDBT_WFMT spelling.'
    }
    foreach ($directory in @($ClientLibDir, $TnsAdmin)) {
        $valid = $false
        try {
            $valid = -not [string]::IsNullOrWhiteSpace($directory) -and
                $directory.Length -le 4096 -and $directory -ceq $directory.Trim() -and
                $directory -match '\A[A-Za-z]:[\\/]' -and
                (Test-Path -LiteralPath $directory -PathType Container -ErrorAction Stop)
        } catch { $valid = $false }
        if (-not $valid) {
            throw 'Oracle client and TNS directories must be explicitly supplied existing local absolute Windows directories.'
        }
    }

    $keys = @('SHF_ORACLE_CONNECT_STRING', 'SHF_ORACLE_USER',
        'SHF_ORACLE_PASSWORD', 'SHF_ORACLE_CLIENT_LIB_DIR', 'TNS_ADMIN')
    $previous = @{}
    foreach ($key in $keys) {
        $previous[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
    }
    $password = $null
    $securePassword = $null
    $buffer = [IntPtr]::Zero
    $changing = $false
    try {
        $password = $previous['SHF_ORACLE_PASSWORD']
        if ([string]::IsNullOrEmpty($password)) {
            if ($NonInteractive) {
                throw 'SHF_ORACLE_PASSWORD is required in the current process; interactive input is disabled.'
            }
            try {
                $securePassword = Read-Host -Prompt 'Oracle password (process only)' -AsSecureString -ErrorAction Stop
                if ($null -eq $securePassword) { throw 'Input unavailable' }
                $buffer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
                $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($buffer)
            } catch {
                throw 'Oracle secure password input unavailable; environment unchanged.'
            } finally {
                if ($buffer -ne [IntPtr]::Zero) {
                    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($buffer)
                    $buffer = [IntPtr]::Zero
                }
            }
        }
        # Process environment cannot carry NUL. Never include a rejected value
        # (or its length) in diagnostics. Runtime validation remains independent.
        if ([string]::IsNullOrEmpty($password) -or $password.Length -gt 1024 -or
            $password.IndexOf([char]0) -ge 0) {
            throw 'Oracle process password is invalid; environment unchanged.'
        }
        $values = @($ConnectString.ToUpperInvariant(), 'shifter', $password, $ClientLibDir, $TnsAdmin)
        # All prerequisites are checked before the first environment write.
        $changing = $true
        for ($i = 0; $i -lt $keys.Count; $i++) {
            [Environment]::SetEnvironmentVariable($keys[$i], $values[$i], 'Process')
        }
    } catch {
        if ($changing) {
            foreach ($key in $keys) {
                [Environment]::SetEnvironmentVariable($key, $previous[$key], 'Process')
            }
            throw 'Oracle process environment update failed; previous values restored.'
        }
        throw
    } finally {
        if ($null -ne $securePassword) { $securePassword.Dispose() }
        $password = $null
        $values = $null
        $previous.Clear()
    }
    Write-Output 'Oracle process inputs prepared only; no connection, client verification or readiness proof performed. Deployment and security gates unchanged.'
}

if ($MyInvocation.InvocationName -ne '.') {
    Write-Warning 'Dot-source this script and call Set-ShifterOracleEnvironment in the launcher process. Direct script execution does not configure the caller.'
}
