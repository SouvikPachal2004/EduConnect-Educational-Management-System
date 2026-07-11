$jsFolder = "d:\Educonnect_New\FYP 12\EduConnect\frontend\js"
$htmlFolder = "d:\Educonnect_New\FYP 12\EduConnect\frontend"

$allFiles = @()
$allFiles += Get-ChildItem "$jsFolder\*.js" -Recurse
$allFiles += Get-ChildItem "$htmlFolder\*.html" -Recurse

foreach ($file in $allFiles) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $content = [System.Text.Encoding]::UTF8.GetString($bytes)
    $before = ([regex]::Matches($content, '[^\x00-\x7F]')).Count
    if ($before -gt 0) {
        $content = [regex]::Replace($content, '[^\x00-\x7F]', '')
        [System.IO.File]::WriteAllText($file.FullName, $content, (New-Object System.Text.UTF8Encoding $false))
        Write-Host "Cleaned $($file.Name): $before chars removed"
    }
}
Write-Host "Done."
