$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
  throw 'DATABASE_URL is not set. Load the production environment before syncing the schema.'
}

$schemaPath = Join-Path $PSScriptRoot '..\prisma\schema.prisma'
if (-not (Test-Path -LiteralPath $schemaPath)) {
  throw "Prisma schema was not found at: $schemaPath"
}

Write-Host 'Syncing Prisma schema without force-reset or accept-data-loss flags.'
Write-Host 'If Prisma reports a destructive change, cancel and review the schema diff.'

Push-Location (Join-Path $PSScriptRoot '..')
try {
  & npx prisma db push --schema $schemaPath
  if ($LASTEXITCODE -ne 0) {
    throw "Prisma db push failed with exit code $LASTEXITCODE."
  }
}
finally {
  Pop-Location
}
