wget -P /tmp https://github.com/nyxkrage/vampire-survivors-modloader/releases/latest/download/vsmod.zip
unzip /tmp/vsmod.zip -d /tmp/vsmod
cp -r /tmp/vsmod/* .
rm -fdr /tmp/vsmod
rm -f /tmp/vsmod.zip ./vsmod.win.ps1 ./vsmod.mac.sh ./vsmod.linux.sh
npm install esprima pngjs
node "./vsmod.js"
