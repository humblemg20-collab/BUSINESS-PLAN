param(
  [string]$DeploymentId = "AKfycbYlpvmb6Cao-Sog2VYdwH9G8PrINOgBCdWFW--49dmT5L_M8efZnd-UQOe9oCXq_J2R",
  [string]$ExpectedScriptId = "1McxpCYTwJPAf8vFOAl6niawk9ro-DSnVzhMblqfVG08uPa6x5ItmjZWz",
  [string]$CanonicalBranch = "work/apps-script-v92",
  [string]$ExpectedRegressionVersion = "1.9.0",
  [string]$ExpectedReadinessGateVersion = "1.2.0",
  [switch]$SkipPush
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$AppsScript = Join-Path $RepoRoot "apps-script"
$EvidenceRoot = Join-Path $RepoRoot "release-evidence"
$ReleaseId = "bp_" + (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$EvidenceDir = Join-Path $EvidenceRoot $ReleaseId
$TranscriptPath = Join-Path $EvidenceDir "release.log"
$StatePath = Join-Path $EvidenceDir "state.json"

New-Item -ItemType Directory -Force -Path $EvidenceDir | Out-Null
Start-Transcript -Path $TranscriptPath -Force | Out-Null

function Invoke-Native {
  param(
    [Parameter(Mandatory=$true)][string]$File,
    [Parameter(Mandatory=$false)][string[]]$Arguments = @()
  )

  $oldPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"

  try {
    $output = & $File @Arguments 2>&1
    $code = $LASTEXITCODE

    return [pscustomobject]@{
      ExitCode = $code
      Output = @($output)
      Text = ($output | Out-String)
    }
  }
  finally {
    $ErrorActionPreference = $oldPreference
  }
}

function Assert-Native {
  param(
    [Parameter(Mandatory=$true)]$Result,
    [Parameter(Mandatory=$true)][string]$Step
  )

  if ($Result.ExitCode -ne 0) {
    if ($Result.Text) {
      Write-Host $Result.Text
    }

    throw "$Step failed. exitCode=$($Result.ExitCode)"
  }
}

function Invoke-Clasp {
  param(
    [Parameter(Mandatory=$false)][string[]]$Arguments = @()
  )

  return Invoke-Native -File "clasp" -Arguments $Arguments
}

function Get-DeploymentVersion {
  param(
    [Parameter(Mandatory=$true)][string]$DeploymentId
  )

  $result = Invoke-Clasp -Arguments @("list-deployments")

  if ($result.ExitCode -ne 0) {
    return $null
  }

  $pattern = [regex]::Escape($DeploymentId) + "\s+@(\d+)"
  $match = [regex]::Match($result.Text, $pattern)

  if (-not $match.Success) {
    return $null
  }

  return [int]$match.Groups[1].Value
}

function Wait-DeploymentVersion {
  param(
    [Parameter(Mandatory=$true)][string]$DeploymentId,
    [Parameter(Mandatory=$true)][int]$ExpectedVersion,
    [int]$Attempts = 12,
    [int]$DelaySeconds = 5
  )

  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    Write-Host "DEPLOYMENT_PROPAGATION_ATTEMPT=$attempt"

    $observed = Get-DeploymentVersion -DeploymentId $DeploymentId

    if ($null -ne $observed) {
      Write-Host "OBSERVED_VERSION=$observed"

      if ($observed -eq $ExpectedVersion) {
        return $true
      }
    }

    Start-Sleep -Seconds $DelaySeconds
  }

  return $false
}

function Test-ProductionHealth {
  param(
    [Parameter(Mandatory=$true)][string]$WebAppUrl
  )

  $openAIHealthUrl = $WebAppUrl + "?health=openai-config"

  try {
    $rootArgs = @{
      Uri = $WebAppUrl
      UseBasicParsing = $true
      MaximumRedirection = 10
      TimeoutSec = 45
    }

    $root = Invoke-WebRequest @rootArgs

    if ($root.StatusCode -ne 200) {
      return [pscustomobject]@{
        Success = $false
        Failure = "ROOT_HTTP_$($root.StatusCode)"
      }
    }

    if ($root.Content -notmatch "Business Plan") {
      return [pscustomobject]@{
        Success = $false
        Failure = "BUSINESS_PLAN_MARKER_MISSING"
      }
    }

    $aiArgs = @{
      Uri = $openAIHealthUrl
      UseBasicParsing = $true
      MaximumRedirection = 10
      TimeoutSec = 45
    }

    $ai = Invoke-WebRequest @aiArgs

    if ($ai.StatusCode -ne 200) {
      return [pscustomobject]@{
        Success = $false
        Failure = "OPENAI_HTTP_$($ai.StatusCode)"
      }
    }

    if ($ai.Content -notmatch '"provider"\s*:\s*"OPENAI"') {
      return [pscustomobject]@{
        Success = $false
        Failure = "OPENAI_PROVIDER_INVALID"
      }
    }

    if ($ai.Content -notmatch '"configured"\s*:\s*true') {
      return [pscustomobject]@{
        Success = $false
        Failure = "OPENAI_NOT_CONFIGURED"
      }
    }

    if ($ai.Content -notmatch '"store"\s*:\s*false') {
      return [pscustomobject]@{
        Success = $false
        Failure = "OPENAI_STORE_POLICY_INVALID"
      }
    }

    return [pscustomobject]@{
      Success = $true
      Failure = ""
    }
  }
  catch {
    return [pscustomobject]@{
      Success = $false
      Failure = $_.Exception.Message
    }
  }
}

function Wait-ProductionHealth {
  param(
    [Parameter(Mandatory=$true)][string]$WebAppUrl,
    [int]$Attempts = 6,
    [int]$DelaySeconds = 10
  )

  $last = $null

  for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
    Write-Host "PRODUCTION_HEALTH_ATTEMPT=$attempt"

    $last = Test-ProductionHealth -WebAppUrl $WebAppUrl

    if ($last.Success) {
      return $last
    }

    Write-Host "PRODUCTION_HEALTH_PENDING=$($last.Failure)"
    Start-Sleep -Seconds $DelaySeconds
  }

  return $last
}

$state = [ordered]@{
  releaseId = $ReleaseId
  canonicalBranch = $CanonicalBranch
  canonicalSha = ""
  regressionVersion = $ExpectedRegressionVersion
  readinessGateVersion = $ExpectedReadinessGateVersion
  deploymentId = $DeploymentId
  previousVersion = $null
  candidateVersion = $null
  productionVersion = $null
  productionHealth = $false
  rollbackAttempted = $false
  rollbackSuccess = $false
  status = "STARTED"
  startedAt = (Get-Date).ToUniversalTime().ToString("o")
  finishedAt = $null
}

try {
  Write-Host "============================================================"
  Write-Host "BUSINESS PLAN POWERSHELL RELEASE ENGINE V1"
  Write-Host "RELEASE_ID=$ReleaseId"
  Write-Host "============================================================"

  if (-not (Test-Path (Join-Path $RepoRoot ".git"))) {
    throw "Git repository not found: $RepoRoot"
  }

  if (-not (Test-Path (Join-Path $AppsScript ".clasp.json"))) {
    throw ".clasp.json not found: $AppsScript"
  }

  Write-Host ""
  Write-Host "[1/8] Canonical Git branch"

  $dirty = Invoke-Native -File "git" -Arguments @("-C", $RepoRoot, "status", "--porcelain")
  Assert-Native -Result $dirty -Step "git status"

  if ($dirty.Text.Trim()) {
    throw "WORKTREE_DIRTY: commit or discard local changes before release."
  }

  Assert-Native -Result (Invoke-Native -File "git" -Arguments @("-C", $RepoRoot, "fetch", "origin")) -Step "git fetch origin"
  Assert-Native -Result (Invoke-Native -File "git" -Arguments @("-C", $RepoRoot, "checkout", $CanonicalBranch)) -Step "git checkout canonical branch"
  Assert-Native -Result (Invoke-Native -File "git" -Arguments @("-C", $RepoRoot, "pull", "--ff-only", "origin", $CanonicalBranch)) -Step "git pull canonical branch"

  $branchResult = Invoke-Native -File "git" -Arguments @("-C", $RepoRoot, "branch", "--show-current")
  Assert-Native -Result $branchResult -Step "git branch --show-current"
  $currentBranch = $branchResult.Text.Trim()

  if ($currentBranch -ne $CanonicalBranch) {
    throw "CANONICAL_BRANCH_MISMATCH"
  }

  $headResult = Invoke-Native -File "git" -Arguments @("-C", $RepoRoot, "rev-parse", "HEAD")
  Assert-Native -Result $headResult -Step "git rev-parse HEAD"
  $head = $headResult.Text.Trim()

  $originResult = Invoke-Native -File "git" -Arguments @("-C", $RepoRoot, "rev-parse", ("origin/" + $CanonicalBranch))
  Assert-Native -Result $originResult -Step "git rev-parse origin canonical branch"
  $originCanonical = $originResult.Text.Trim()

  Write-Host "CANONICAL_BRANCH=$CanonicalBranch"
  Write-Host "LOCAL_SHA=$head"
  Write-Host "ORIGIN_SHA=$originCanonical"

  if ($head -ne $originCanonical) {
    throw "CANONICAL_BRANCH_SHA_MISMATCH"
  }

  $state.canonicalSha = $head

  Write-Host ""
  Write-Host "[2/8] Apps Script project contract"

  $claspJson = Get-Content (Join-Path $AppsScript ".clasp.json") -Raw | ConvertFrom-Json

  if ([string]$claspJson.scriptId -ne $ExpectedScriptId) {
    throw "SCRIPT_ID_MISMATCH"
  }

  Write-Host "SCRIPT_ID=$($claspJson.scriptId)"

  $regressionPath = Join-Path $AppsScript "AG24PremiumDocumentRegressionSuiteV1.js"
  $readinessPath = Join-Path $AppsScript "AG24PremiumFinanceurReleaseReadinessGateV1.js"

  if (-not (Test-Path $regressionPath)) {
    throw "REGRESSION_SUITE_SOURCE_MISSING"
  }

  if (-not (Test-Path $readinessPath)) {
    throw "RELEASE_READINESS_GATE_SOURCE_MISSING"
  }

  $regressionSource = Get-Content $regressionPath -Raw
  $readinessSource = Get-Content $readinessPath -Raw

  if ($regressionSource -notmatch ('VERSION:"' + [regex]::Escape($ExpectedRegressionVersion) + '"')) {
    throw "REGRESSION_VERSION_MISMATCH"
  }

  if ($readinessSource -notmatch ('VERSION:"' + [regex]::Escape($ExpectedReadinessGateVersion) + '"')) {
    throw "READINESS_GATE_VERSION_MISMATCH"
  }

  Write-Host "REGRESSION_SOURCE_VERSION=$ExpectedRegressionVersion"
  Write-Host "READINESS_GATE_SOURCE_VERSION=$ExpectedReadinessGateVersion"
  Write-Host "PREMIUM_SOURCE_CONTRACT=PASS"

  Set-Location $AppsScript

  Write-Host ""
  Write-Host "[3/8] clasp access"

  $access = Invoke-Clasp -Arguments @("list-deployments")

  if ($access.ExitCode -ne 0) {
    Write-Host "CLASP_ACCESS=FAIL"
    Write-Host "Interactive Google login required."

    Invoke-Clasp -Arguments @("logout") | Out-Null

    $oldPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"

    try {
      & clasp login
      $loginCode = $LASTEXITCODE
    }
    finally {
      $ErrorActionPreference = $oldPreference
    }

    if ($loginCode -ne 0) {
      throw "CLASP_LOGIN_FAILED"
    }

    $access = Invoke-Clasp -Arguments @("list-deployments")
  }

  Assert-Native -Result $access -Step "clasp project access"
  Write-Host "CLASP_ACCESS=PASS"

  Write-Host ""
  Write-Host "[4/8] Capture known-good deployment"

  $previousVersion = Get-DeploymentVersion -DeploymentId $DeploymentId

  if ($null -eq $previousVersion) {
    throw "CURRENT_DEPLOYMENT_VERSION_NOT_FOUND"
  }

  $state.previousVersion = $previousVersion
  Write-Host "PREVIOUS_VERSION=$previousVersion"

  Write-Host ""
  Write-Host "[5/8] Apps Script HEAD synchronization"

  if ($SkipPush) {
    Write-Host "APPS_SCRIPT_HEAD_PUSH=SKIPPED_BY_CALLER"
  }
  else {
    $push = Invoke-Clasp -Arguments @("push", "--force")
    Assert-Native -Result $push -Step "clasp push"
    Write-Host $push.Text
    Write-Host "APPS_SCRIPT_HEAD_PUSH=PASS"
  }

  Write-Host ""
  Write-Host "[6/8] Update existing production deployment"

  $description = "PowerShell release | $CanonicalBranch | $head | $ReleaseId"

  $deploy = Invoke-Clasp -Arguments @(
    "create-deployment",
    "--deploymentId", $DeploymentId,
    "--description", $description
  )

  Assert-Native -Result $deploy -Step "production deployment update"
  Write-Host $deploy.Text

  $candidateMatch = [regex]::Match(
    $deploy.Text,
    [regex]::Escape($DeploymentId) + "\s+@(\d+)"
  )

  if (-not $candidateMatch.Success) {
    throw "CANDIDATE_VERSION_NOT_FOUND_IN_DEPLOY_OUTPUT"
  }

  $candidateVersion = [int]$candidateMatch.Groups[1].Value
  $state.candidateVersion = $candidateVersion

  Write-Host "CANDIDATE_VERSION=$candidateVersion"

  if ($candidateVersion -le $previousVersion) {
    throw "CANDIDATE_VERSION_NOT_NEWER"
  }

  $propagated = Wait-DeploymentVersion -DeploymentId $DeploymentId -ExpectedVersion $candidateVersion

  if (-not $propagated) {
    throw "DEPLOYMENT_PROPAGATION_TIMEOUT"
  }

  Write-Host "DEPLOYMENT_PROPAGATION=PASS"

  Write-Host ""
  Write-Host "[7/8] Production health"

  $webAppUrl = "https://script.google.com/macros/s/" + $DeploymentId + "/exec"
  $health = Wait-ProductionHealth -WebAppUrl $webAppUrl

  if (-not $health.Success) {
    Write-Host "PRODUCTION_HEALTH=FAIL"
    Write-Host "FAILURE=$($health.Failure)"
    Write-Host "AUTOMATIC_ROLLBACK=START"

    $state.rollbackAttempted = $true

    $rollback = Invoke-Clasp -Arguments @(
      "create-deployment",
      "--deploymentId", $DeploymentId,
      "--versionNumber", [string]$previousVersion,
      "--description", "AUTO ROLLBACK | failed=$candidateVersion | $ReleaseId"
    )

    Assert-Native -Result $rollback -Step "automatic rollback"
    Write-Host $rollback.Text

    $rollbackPropagated = Wait-DeploymentVersion -DeploymentId $DeploymentId -ExpectedVersion $previousVersion

    if (-not $rollbackPropagated) {
      throw "ROLLBACK_PROPAGATION_TIMEOUT"
    }

    $rollbackHealth = Wait-ProductionHealth -WebAppUrl $webAppUrl

    if (-not $rollbackHealth.Success) {
      throw "ROLLBACK_HEALTH_FAILED: $($rollbackHealth.Failure)"
    }

    $state.rollbackSuccess = $true
    $state.productionVersion = $previousVersion
    $state.productionHealth = $true
    $state.status = "ROLLED_BACK"

    throw "RELEASE_ABORTED_PRODUCTION_RESTORED"
  }

  $state.productionVersion = $candidateVersion
  $state.productionHealth = $true

  Write-Host "PRODUCTION_HEALTH=PASS"
  Write-Host "OPENAI_CONFIG_HEALTH=PASS"

  Write-Host ""
  Write-Host "[8/8] Final verification"

  $finalVersion = Get-DeploymentVersion -DeploymentId $DeploymentId

  if ($finalVersion -ne $candidateVersion) {
    throw "FINAL_DEPLOYMENT_VERSION_MISMATCH"
  }

  $state.status = "PASS"

  Write-Host ""
  Write-Host "============================================================"
  Write-Host "BUSINESS PLAN POWERSHELL RELEASE = PASS"
  Write-Host "RELEASE_ID=$ReleaseId"
  Write-Host "CANONICAL_BRANCH=$CanonicalBranch"
  Write-Host "CANONICAL_SHA=$head"
  Write-Host "REGRESSION_VERSION=$ExpectedRegressionVersion"
  Write-Host "READINESS_GATE_VERSION=$ExpectedReadinessGateVersion"
  Write-Host "PREVIOUS_VERSION=$previousVersion"
  Write-Host "PRODUCTION_VERSION=$candidateVersion"
  Write-Host "PRODUCTION_HEALTH=PASS"
  Write-Host "OPENAI_CONFIG_HEALTH=PASS"
  Write-Host "EVIDENCE=$EvidenceDir"
  Write-Host "============================================================"
}
catch {
  if ($state.status -eq "STARTED") {
    $state.status = "FAILED"
  }

  Write-Host ""
  Write-Host "RELEASE_ENGINE_ERROR=$($_.Exception.Message)"
  throw
}
finally {
  $state.finishedAt = (Get-Date).ToUniversalTime().ToString("o")
  $state | ConvertTo-Json -Depth 6 | Set-Content -Path $StatePath -Encoding UTF8
  Write-Host "STATE_FILE=$StatePath"

  try {
    Stop-Transcript | Out-Null
  }
  catch {
  }
}
