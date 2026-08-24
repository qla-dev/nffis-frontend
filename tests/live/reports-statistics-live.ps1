param(
    [string]$BaseUrl = $(if ($env:NFFIS_LIVE_BASE_URL) { $env:NFFIS_LIVE_BASE_URL } else { 'http://localhost:3000' }),
    [string]$Username = $(if ($env:NFFIS_LIVE_USERNAME) { $env:NFFIS_LIVE_USERNAME } else { 'qla.dev' }),
    [string]$Password = $env:NFFIS_LIVE_PASSWORD
)

$ErrorActionPreference = 'Stop'

if (-not $Password) {
    throw 'Set NFFIS_LIVE_PASSWORD before running this opt-in live-write test.'
}

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$browserHeaders = @{
    Origin = $BaseUrl
    Referer = "$BaseUrl/"
    Accept = 'application/json'
}

function Invoke-NffisRequest {
    param(
        [Parameter(Mandatory)][string]$Method,
        [Parameter(Mandatory)][string]$Path,
        [object]$Body,
        [switch]$WithCsrf
    )

    $headers = $browserHeaders.Clone()
    if ($WithCsrf) {
        $csrfResponse = Invoke-WebRequest "$BaseUrl/sanctum/csrf-cookie" -WebSession $session -Headers $browserHeaders -SkipHttpErrorCheck -TimeoutSec 60
        if ([int]$csrfResponse.StatusCode -ne 204) {
            throw "CSRF initialization failed with HTTP $([int]$csrfResponse.StatusCode)."
        }

        $csrfCookie = $session.Cookies.GetCookies($BaseUrl) | Where-Object Name -eq 'XSRF-TOKEN' | Select-Object -First 1
        if (-not $csrfCookie) { throw 'The XSRF-TOKEN cookie was not returned.' }
        $headers['X-XSRF-TOKEN'] = [Uri]::UnescapeDataString($csrfCookie.Value)
    }

    $request = @{
        Uri = "$BaseUrl$Path"
        Method = $Method
        WebSession = $session
        Headers = $headers
        SkipHttpErrorCheck = $true
        TimeoutSec = 60
    }
    if ($null -ne $Body) {
        $request.ContentType = 'application/json'
        $request.Body = $Body | ConvertTo-Json -Depth 8 -Compress
    }

    Invoke-WebRequest @request
}

$login = Invoke-NffisRequest -Method POST -Path '/api/login' -Body @{ login = $Username; password = $Password } -WithCsrf
if ([int]$login.StatusCode -ne 200) {
    throw "Login failed with HTTP $([int]$login.StatusCode): $($login.Content)"
}

$beforeResponse = Invoke-NffisRequest -Method GET -Path '/api/reports/statistics'
if ([int]$beforeResponse.StatusCode -ne 200) { throw "Initial statistics request failed with HTTP $([int]$beforeResponse.StatusCode)." }
$before = $beforeResponse.Content | ConvertFrom-Json

$stamp = if ($env:NFFIS_LIVE_TEST_RUN_ID) { $env:NFFIS_LIVE_TEST_RUN_ID } else { (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmss') }
$marker = "[NFFIS LIVE TEST $stamp]"
$reportedAt = (Get-Date).ToUniversalTime().ToString('o')
$reports = @(
    @{
        incident_type = 'FIRE'
        description = "[NFFIS LIVE TEST $stamp] Controlled wildfire statistics test incident."
        region = 'Sarajevo Canton'
        locality = 'Trebevic test point'
        latitude = 43.842
        longitude = 18.429
        timezone = 'Europe/Sarajevo'
        reported_at = $reportedAt
        weather_condition = 'Clear Sky'
        temperature_c = 31.4
        humidity_percent = 42
        pressure_hpa = 1012
        precipitation_mm = 0
        cloud_cover_percent = 15
        wind_speed_kmh = 14
        wind_direction_degrees = 225
        wind_gust_kmh = 25
    },
    @{
        incident_type = 'FLOOD'
        description = "[NFFIS LIVE TEST $stamp] Controlled flood statistics test incident."
        region = 'Herzegovina-Neretva Canton'
        locality = 'Mostar test point'
        latitude = 43.3438
        longitude = 17.8078
        timezone = 'Europe/Sarajevo'
        reported_at = $reportedAt
        weather_condition = 'Heavy Rain'
        temperature_c = 19.8
        humidity_percent = 88
        pressure_hpa = 998
        precipitation_mm = 18.5
        cloud_cover_percent = 96
        wind_speed_kmh = 22
        wind_direction_degrees = 180
        wind_gust_kmh = 37
    }
)

$existingResponse = Invoke-NffisRequest -Method GET -Path '/api/reports?per_page=100'
if ([int]$existingResponse.StatusCode -ne 200) { throw "Report listing failed with HTTP $([int]$existingResponse.StatusCode)." }
$existingReports = @((($existingResponse.Content | ConvertFrom-Json).data) | Where-Object {
    $_.description -and $_.description.Contains($marker)
})

$created = @()
$newlyCreated = 0
foreach ($report in $reports) {
    $existing = $existingReports | Where-Object { $_.incident_type -eq $report.incident_type } | Select-Object -First 1
    if ($existing) {
        $created += $existing
        continue
    }

    $response = Invoke-NffisRequest -Method POST -Path '/api/reports' -Body $report -WithCsrf
    if ([int]$response.StatusCode -notin @(200, 201)) {
        throw "Creating $($report.incident_type) report failed with HTTP $([int]$response.StatusCode): $($response.Content)"
    }
    $created += ($response.Content | ConvertFrom-Json).data
    $newlyCreated++
}

$afterResponse = Invoke-NffisRequest -Method GET -Path '/api/reports/statistics'
if ([int]$afterResponse.StatusCode -ne 200) { throw "Final statistics request failed with HTTP $([int]$afterResponse.StatusCode)." }
$after = $afterResponse.Content | ConvertFrom-Json

if ([int]$after.total -lt ([int]$before.total + $newlyCreated)) {
    throw "Expected statistics total to increase by $newlyCreated (before=$($before.total), after=$($after.total))."
}

$fireCount = ($after.by_incident_type | Where-Object { $_.label -eq 'FIRE' } | Measure-Object -Property count -Sum).Sum
$floodCount = ($after.by_incident_type | Where-Object { $_.label -eq 'FLOOD' } | Measure-Object -Property count -Sum).Sum
if ([int]$fireCount -lt 1 -or [int]$floodCount -lt 1) {
    throw "Expected FIRE and FLOOD buckets, received FIRE=$fireCount FLOOD=$floodCount."
}

[pscustomobject]@{
    passed = $true
    base_url = $BaseUrl
    created_ids = @($created | ForEach-Object id)
    descriptions = @($created | ForEach-Object description)
    newly_created = $newlyCreated
    total_before = [int]$before.total
    total_after = [int]$after.total
    by_incident_type = $after.by_incident_type
    by_weather_condition = $after.by_weather_condition
} | ConvertTo-Json -Depth 8
