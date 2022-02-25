if (-Not ((Get-Command "node") -And (Get-Command "npm"))) {
  Write-Host "Node is not installed"
  Write-Host "Please install NodeJS, google how if you are unsure"
  Write-Host -NoNewLine 'Press any key to continue...';
  $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown');
  Exit
}

if ((Select-String -Path $(Join-Path -Path $PSScriptRoot -ChildPath "main.bundle.js") -Pattern "vsmod") -ne $null) {
  Write-Host "VampireSurvivors ModLoader is already installed"
  Write-Host "If you want to update the ModLoader, please  verify the game files from steam and run this installer again"
  Write-Host -NoNewLine 'Press any key to continue...';
  $null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown');
  Exit
}

npm install esprima pngjs
node "./vsmod.js"
Write-Host -NoNewLine 'Press any key to continue...';
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown');