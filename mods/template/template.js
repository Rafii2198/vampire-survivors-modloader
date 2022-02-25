class ExampleMod {
  // The constructor is run when initiating the mods, everything in the game is not expected to be initialized
  constructor(game_instance, game_config, api) {
    // this.name is required
    this.name = "Example Mod";
    // this.id is required and should be unique to your mod
    // for instance "yourname.modname"
    this.id = "nyxkrage.example";

    // this.XXX can be used to save things for use in start or in your hooks
    this.game_instance = game_instance;
    this.game_config = game_config;
    this.api = api;

    // functions called from pre and post are called hooks
    // Pre-hooks are called before the normal function is called
    this.pre = {
      // Scene.XXXX hooks look at the XXXX scene for a function
      "Scene.OmniScene.create": this.preCreateOmniScene,
    };
    // Post-hooks are called after the normal function is called
    this.post = {
      // Game.XXXX hooks look at the game_instance object to find the function
      "Game.Core.Player.LevelUp": this.postPlayerLevelUp,
    };
    this.overwrite = {};
  }

  // Start is called before the `pre` and `post` hooks are applied, but after, most things in the game have loaded
  start() {
    console.log("Mod", this.name, "is starting");
    let nyx_char = [
      {
        hidden: false,
        level: 1,
        startingWeapon: "SILF",
        charName: "NYX",
        surname: "KRAGE",
        spriteName: "CoolChar_01.png",
        walkingFrames: 2,
        description: "A modded character, without needing to share the main.bundle.js file",
        isBought: false,
        price: 1337,
        maxHp: 100,
        armor: 0,
        regen: 0,
        moveSpeed: 0.5,
        power: 1,
        cooldown: 1,
        area: 1,
        speed: 1,
        duration: 1,
        amount: 1,
        luck: 1,
        growth: 2,
        greed: 1,
        magnet: 1,
        revival: 0,
        showcase: [],
      },
    ];
    // This will set "NYX" in the Character data to `nyx_char` defined above
    this.api.set_data_map("CHARACTER", "NYX", nyx_char);
  }

  // This function will be called before normal OmniScene creation code
  preCreateOmniScene(self) {
    console.log("Pre Create OmniScene from", self.name);
  }

  // This function will be called after normal Player levelup code
  postPlayerLevelUp(self) {
    console.log("Post LevelUp Player from", self.name, ": Player is now level", this.level);
  }
}

// This makes it so the mod loader can see the mod
module.exports = ExampleMod;
