# Vampire Survivors ModLoader

This is a monkey-patching modding framework for Vampire Survivors

## Getting Started

### Installing

#### MacOS

1. Make sure you have [NodeJS](https://nodejs.org/en/download/) installed
1. Download the latest version of the modloader from [the releases](https://github.com/nyxkrage/vampire-survivors-modloader/releases)
1. Right-click the game in Steam and choose `Properties...`, then click `LOCAL FILES` and click `Browse...`
1. Then right-click `Vampire_Survivors` and choose `Show Package Contents`
1. Then go through the folders, `Contents/Resources/app/.webpack/renderer` (if you cant see the .webpack folder, press cmd+shift+.)
1. Drag the files from `vsmod.zip` into the renderer folder
1. Right-click `vsmod.mac.sh` and choose `Open With > Other...`
1. Search for Terminal and switch Enable to `All Applications`
1. Select Terminal in the list above and click open
1. Now launch the game, and you should see a NYX character from the example mod included

#### Windows

1. Make sure you have [NodeJS](https://nodejs.org/en/download/) installed
1. Download the latest version of the modloader from [the releases](https://github.com/nyxkrage/vampire-survivors-modloader/releases)
1. Unzip the `vsmod.zip` file into your renderer folder `C:\Program Files (x86)\Steam\steamapps\common\Vampire Survivors\resources\app\.webpack\renderer\`
1. Right-click `vsmod.win.ps1` and choose `Run with PowerShell`
1. Now launch the game, and you should see a NYX character from the example mod included

### Making mods

Check out [the template.js mod](mods/template.js)
Check out [The Wiki](https://github.com/nyxkrage/vampire-survivors-modloader/wiki) for more in-depth information
