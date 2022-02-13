class InGameConsole {
  // The constructor is run when initiating the mods, everything in the game is not expected to be initialized
  constructor(game_instance, game_config, api) {
    // this.name is required
    this.name = "InGame Console"
    // this.id is required and should be unique to your mod
    // for instance "yourname.modname"
    this.id = "nyxkrage.igconsole"
    // this.XXX can be used to save things for use in start or in your hooks
    this.api = api
    this.game_instance = game_instance
    this.game_config = game_config
    this.console = null;
    this.last_message = "";
    
    // functions called from pre and post are called hooks
    // Pre-hooks are called before the normal function is called
    this.pre = {
      "window.console.log": this.onConsoleLog,
    }
      // Post-hooks are called after the normal function is called
    this.post = {
      // Scene.XXXX hooks look at the XXXX scene for a function
      "Scene.MainScene.create": this.postMainSceneCreate,
    }
  }

  // Start is called before the `pre` and `post` hooks are applied, but after most things in the game have loaded
  start() {}

  // This function will be called before the normal console.log code
  onConsoleLog(self, ...args) {
    if (self.console !== null)
      try {
        self.console.setText(args.join(" "))
        self.last_message = args.join(" ")
      } catch(e) {
        self.console.destroy()
        self.console = null
      }
  }

  // This function will be called after the normal MainScene creation code
  postMainSceneCreate(self) {
    if (self.console === null) {
      self.console = this.add.text(10, this.game.renderer.height - 20, self.last_message, { color: "white", fontSize: "12px"}).setScrollFactor(0).setDepth(Number.MAX_SAFE_INTEGER)
    }
  }
}

module.exports = InGameConsole