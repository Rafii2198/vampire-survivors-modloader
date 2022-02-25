#!/bin/sh
if ! command -v "npm" &> /dev/null && command -v "node" &> /dev/null
then
  echo "Node is not installed"
  echo "Please install NodeJS, google how if you are unsure"
  exit 1
fi

if grep "vsmod" main.bundle.js &> /dev/null
then
  echo "VampireSurvivors ModLoader is already installed"
  echo "If you want to update the ModLoader, please  verify the game files from steam and run this installer again"
  exit 1
fi

cd "$(dirname -- "$0")"
npm install esprima pngjs
node vsmod.js
