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

#### Linux
**Automatic version:**
1. Make sure you have `wget`, `unzip` and NodeJS installed
1. Navigate to `renderer` folder in the game directory. Default path is `~/.steam/steamapps/common/Vampire Survivors/resources/app/.webpack/renderer/`
    1. Alternatively, right-click the game in Steam and choose `Properties...`, then click `LOCAL FILES` and click `Browse...`, then navigate to `./resources/app/.webpack/renderer/`
1. Open terminal in this location
1. Enter this code:
```sh
wget -P /tmp https://github.com/nyxkrage/vampire-survivors-modloader/releases/latest/download/vsmod.zip
unzip /tmp/vsmod.zip -d /tmp/vsmod
cp -r /tmp/vsmod/* .
rm -fdr /tmp/vsmod
rm -f /tmp/vsmod.zip ./vsmod.win.ps1 ./vsmod.mac.sh ./vsmod.linux.sh
npm install esprima pngjs
node "./vsmod.js"
```
1. Now launch the game, and you should see a NYX character from the example mod included

**Manual version**
1. Make sure you have NodeJS installed
1. Download the latest version of the modloader from [the releases](https://github.com/nyxkrage/vampire-survivors-modloader/releases)
1. Navigate to `renderer` folder in the game directory. Default path is `~/.steam/steamapps/common/Vampire Survivors/resources/app/.webpack/renderer/`
    1. Alternatively, right-click the game in Steam and choose `Properties...`, then click `LOCAL FILES` and click `Browse...`, then navigate to `./resources/app/.webpack/renderer/`
1. Unzip the `vsmod.zip` into that dirextory
1. Run `vsmod.linux.sh` file
1. Now launch the game, and you should see a NYX character from the example mod included

### Making mods

Check out [the template.js mod](mods/template.js)
Check out [The Wiki](https://github.com/nyxkrage/vampire-survivors-modloader/wiki) for more in-depth information
