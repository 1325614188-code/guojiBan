
# 获取所有以 GEMINI_API_KEY 开头的环境变量名
Write-Host "Fetching environment variables..."
$listOutput = npx vercel env ls

$envVars = @()
foreach ($line in $listOutput) {
    if ($line -match "GEMINI_API_KEY") {
        # 移除行首可能的特殊字符或空格，然后按空格分割
        $cleanLine = $line.Trim()
        if ($cleanLine -match "^GEMINI_API_KEY") {
            $parts = $cleanLine -split "\s+"
            if ($parts.Length -gt 0) {
                $envVars += $parts[0]
            }
        }
    }
}

$uniqueVars = $envVars | Select-Object -Unique

Write-Host "Found $($uniqueVars.Count) Gemini API keys to delete."

foreach ($key in $uniqueVars) {
    Write-Host "Deleting $key..."
    npx vercel env rm $key -y
}

Write-Host "Done!"
