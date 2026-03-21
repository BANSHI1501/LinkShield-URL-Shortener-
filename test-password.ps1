$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YmQ4OGYzYTI3NmU3NzViYWU0MDI5MiIsImlhdCI6MTc3NDAzMTQ4MywiZXhwIjoxNzc0MTE3ODgzfQ.M91qNOE8EeFXLbmL74uMXyN-GSagOo2el5jxj2UYm40"
$headers = @{
    'Authorization' = "Bearer $token"
    'Content-Type' = 'application/json'
}
$body = @{
    originalUrl = 'https://www.youtube.com'
    password = 'secure123'
} | ConvertTo-Json

Write-Output "[CREATE] Creating password-protected URL..."
$response = Invoke-WebRequest -Uri 'http://localhost:5000/shorten' -Method POST -Headers $headers -Body $body -UseBasicParsing
$shortUrl = ($response.Content | ConvertFrom-Json).shortUrl
$code = ($shortUrl -split '/')[-1]
Write-Output "[CREATED] $shortUrl (code: $code)"
Write-Output ""

Write-Output "[TEST1] Access WITHOUT password (expect 401)"
try {
    $r1 = Invoke-WebRequest -Uri "http://localhost:5000/$code" -UseBasicParsing -ErrorAction Stop
    Write-Output "[FAIL] Got 200 instead of 401"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 401) {
        Write-Output "[PASS] Got 401 Unauthorized - correct!"
    } else {
        Write-Output "[FAIL] Got $status instead of 401"
    }
}
Write-Output ""

Write-Output "[TEST2] Access with WRONG password (expect 403)"
try {
    $r2 = Invoke-WebRequest -Uri "http://localhost:5000/$code`?password=wrong123" -UseBasicParsing -ErrorAction Stop
    Write-Output "[FAIL] Got 200 instead of 403"
} catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -eq 403) {
        Write-Output "[PASS] Got 403 Forbidden - correct!"
    } else {
        Write-Output "[FAIL] Got $status instead of 403"
    }
}
Write-Output ""

Write-Output "[TEST3] Access with CORRECT password (expect 302 redirect)"
try {
    # Try with -FollowRelLink to see if it actually follows redirect
    $r3 = Invoke-WebRequest -Uri "http://localhost:5000/$code`?password=secure123" -MaximumRedirection 1 -UseBasicParsing -ErrorAction Stop
    Write-Output "[PASS] Followed redirect successfully - password protection WORKING!"
} catch {
    $ex = $_.Exception
    if ($ex.Response) {
        $status = $ex.Response.StatusCode.value__
        Write-Output "[DEBUG] Exception status: $status"
    } else {
        Write-Output "[DEBUG] Exception: $($ex.Message)"
    }
}
