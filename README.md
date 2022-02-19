# Vampire Survivors ModLoader

This is a monkey-patching modding framework for Vampire Survivors

## Getting Started
### Installing

1. Make sure you have [NodeJS](https://nodejs.org/en/download/) installed
1. Download the latest version of the modloader from [the releases](https://github.com/nyxkrage/vampire-survivors-modloader/releases)
1. Unzip the `vsmod.zip` file into your renderer folder, by default `C:\Program Files (x86)\Steam\steamapps\common\Vampire Survivors\resources\app\.webpack\renderer\` on Windows
1. Open a PowerShell window in the renderer folder, either by shift-right-clicking and selecting `Open PowerShell window here` or by opening a PowerShell window and running `cd C:\Program Files (x86)\Steam\steamapps\common\Vampire Survivors\resources\app\.webpack\renderer\`
1. Then run the following 2 commands `npm install esprima` and then `node .\vsmod.js`
1. Now launch the game, and you should see a NYX character from the example mod included

### Making mods

Check out [the template.js mod](mods/template.js)
Check out [The Wiki](https://github.com/nyxkrage/vampire-survivors-modloader/wiki) for more in-depth information