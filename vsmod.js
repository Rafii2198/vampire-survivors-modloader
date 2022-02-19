const fs = require("fs");
const path = require("path");
const esprima = require("esprima");
const { exit } = require("process");

function get_mods() {
  return fs
    .readdirSync(path.join(__dirname, "mods/"), { withFileTypes: true })
    .filter((f) => f.isDirectory)
    .map((f) => f.name)
    .map((f) => require(path.join(__dirname, "mods/", f)));
}

let data_maps;
function scope(maps) {
  data_maps = maps;
}

function get_gi(main_path) {
  let main_contents = fs.readFileSync(path.join(main_path, "main.bundle.js"), { encoding: "utf-8" });
  let matches = main_contents.matchAll(/(_0x[a-f0-9]+) extends Phaser\[([a-zA-Z0-9_"'()]+)\]/g);
  let i = {};
  for (let match of matches) {
    if (match[2] === "'Game'") {
      return match[1];
    }
    let imatch = match[2].match(/_0x[a-f0-9]+\((0x[a-f0-9]+)\)/);
    if (imatch) {
      i[match[1]] = imatch[1];
    }
  }
  let singles = Object.entries(i).filter(([k, v]) => Object.values(i).filter((n) => n === v).length === 1);
  if (singles.length === 1) {
    return singles[0][0];
  }

  exit();
}

function wait_for_property(obj, property, callback) {
  let access_stack = property.split(".");
  let end_property;
  end_property = access_stack.reduce(
    (a, c) => (a === undefined ? undefined : a[c] === undefined ? undefined : a[c]),
    obj
  );

  if (end_property === undefined) {
    setTimeout(() => {
      wait_for_property(obj, property, callback);
    }, 0);
  } else {
    callback();
  }
}

let gi;
let gc;

function init(game_instance, game_config) {
  gi = game_instance.__proto__.constructor;
  gc = game_config;
  // Construct each mod, this will set their pre and post hooks and whatever initial variables they might need
  console.log("Initializing Vampire Survivors Mod Loader");
  let mods = get_mods().map((mod) => new mod(gi, game_config, api));
  console.log("Active mods:", mods.map((m) => m.name).join(","));

  wait_for_property(game_instance, "scene.scenes.0", () => {
    console.log("Scenes are loaded, finalizing mod hooks");
    let scenes = Object.fromEntries(
      game_instance.scene.scenes.map((c, i) => [c.sys.config.key, game_config.scene[i]])
    );
    // Check for incompatible mods with differing override hooks
    for (let mod of mods) {
      for (let overwrite in mod.overwrite) {
        for (let other of mods) {
          if (other.id !== mod.id) {
            if (Object.keys(other.overwrite)?.includes(overwrite)) {
              throw new Error(`${mod.name} and ${other.name} are not compatible!`);
            }
            if (Object.keys(other.pre).includes(overwrite)) {
              throw new Error(`${mod.name} and ${other.name} are not compatible!`);
            }
            if (Object.keys(other.post).includes(overwrite)) {
              throw new Error(`${mod.name} and ${other.name} are not compatible!`);
            }
          }
        }
      }
    }

    for (let mod of mods) {
      for (let overwrite in mod.overwrite) {
        let cb_stack = overwrite.split(".");
        let sori = cb_stack.shift();
        let scene;
        let callback;
        if (sori == "Scene") {
          scene = scenes[cb_stack.shift()];
        }
        if (sori != "Scene" && sori != "Game") {
          cb_stack.unshift(sori);
        }
        callback = cb_stack.join(".");
        let obj = sori == "Scene" ? scene.prototype : sori == "Game" ? gi : globalThis;
        wait_for_property(obj, callback, () => {
          let access_stack = callback.split(".");
          let function_name = access_stack.pop();
          let function_parent;
          if (access_stack.length === 1) function_parent = obj;
          else
            function_parent = access_stack.reduce(
              (a, c) => (a === undefined ? undefined : a[c] === undefined ? undefined : a[c]),
              obj
            );
          function_parent[function_name] = (function () {
            console.log(`Attaching overwrite-hook: "${overwrite}" for mod: ${mod.name}`);

            return function () {
              return mod.pre[overwrite].apply(this, [mod, ...arguments]);
            };
          })();
        });
      }
      for (let pre_callback in mod.pre) {
        let cb_stack = pre_callback.split(".");
        let sori = cb_stack.shift();
        let scene;
        let callback;
        if (sori == "Scene") {
          scene = scenes[cb_stack.shift()];
        }
        if (sori != "Scene" && sori != "Game") {
          cb_stack.unshift(sori);
        }
        callback = cb_stack.join(".");
        let obj = sori == "Scene" ? scene.prototype : sori == "Game" ? gi : globalThis;
        wait_for_property(obj, callback, () => {
          let access_stack = callback.split(".");
          let function_name = access_stack.pop();
          let function_parent;
          if (access_stack.length === 1) function_parent = obj;
          else
            function_parent = access_stack.reduce(
              (a, c) => (a === undefined ? undefined : a[c] === undefined ? undefined : a[c]),
              obj
            );
          function_parent[function_name] = (function () {
            console.log(`Attaching pre-hook: "${pre_callback}" for mod: ${mod.name}`);
            let cache_f = function_parent[function_name];

            return function () {
              mod.pre[pre_callback].apply(this, [mod, ...arguments]);

              let result = cache_f.apply(this, arguments);
              return result;
            };
          })();
        });
      }
      for (let post_callback in mod.post) {
        let cb_stack = post_callback.split(".");
        let sori = cb_stack.shift();
        let scene;
        let callback;
        if (sori == "Scene") {
          scene = scenes[cb_stack.shift()];
        }
        if (sori != "Scene" && sori != "Game") {
          cb_stack.unshift(sori);
        }
        callback = cb_stack.join(".");
        let obj = sori == "Scene" ? scene.prototype : sori == "Game" ? gi : globalThis;
        wait_for_property(obj, callback, () => {
          let access_stack = callback.split(".");
          let function_name = access_stack.pop();
          let function_parent;
          if (access_stack.length === 1) function_parent = obj;
          else
            function_parent = access_stack.reduce(
              (a, c) => (a === undefined ? undefined : a[c] === undefined ? undefined : a[c]),
              obj
            );
          function_parent[function_name] = (function () {
            console.log(`Attaching post-hook: "${post_callback}" for mod: ${mod.name}`);
            let cache_f = function_parent[function_name];

            return function () {
              let result = cache_f.apply(this, arguments);

              mod.post[post_callback].apply(this, [mod, ...arguments]);
              return result;
            };
          })();
        });
      }
    }
    wait_for_property(gi, "Core", () => {
      for (let mod of mods) {
        mod.start();
      }
    });
  });
}

function extract_data_maps() {
  let text = fs.readFileSync(path.join(__dirname, "main.bundle.js"), { encoding: "utf-8" });
  let save_data = JSON.parse(
    fs.readFileSync(path.join(__dirname, "SaveDataBackup.sav"), { encoding: "utf-8" })
  );
  let save_data_keys = Object.keys(save_data);
  let ast = esprima.parseScript(text);

  let webapck_mod_lookup = ast.body
    .filter((n) => n.type === "ExpressionStatement")[0]
    .expression.expressions.filter((n) => n.type === "CallExpression")
    .filter((n) => n.callee.type === "ArrowFunctionExpression")[0]
    .callee.body.body.filter((n) => n.type === "VariableDeclaration")
    .map((n) => n.declarations)
    .flat()
    .filter((n) => n.init !== null)
    .filter((n) => n.init.type === "ObjectExpression")
    .filter((n) => n.init.properties.length !== 0)[0].init.properties;

  let res = webapck_mod_lookup
    .filter((n) => n.value.params.length === 3)[0]
    .value.body.body.filter((n) => n.type === "VariableDeclaration" && n.kind === "const")
    .filter((n) =>
      n.declarations.some((n) => n.type === "VariableDeclarator" && n.init.type === "ClassExpression")
    )
    .map((n) => n.declarations)
    .flat()
    .filter((n) => n.init.id === null && n.init.superClass === null)
    .filter((n) => n.init.body.body.filter((n) => n.key.name === "constructor")[0].value.params.length === 0)
    .filter((n) =>
      n.init.body.body
        .filter((n) => n.key.name === "constructor")[0]
        .value.body.body.filter((n) => n.type === "ExpressionStatement")
        .filter((n) => (n.expression.type = "SequenceExpression"))
        .some((n) =>
          n.expression.expressions.some(
            (n) => n.left.object.type === "ThisExpression" && save_data_keys.includes(n.left.property.value)
          )
        )
    )[0]
    .init.body.body.filter((n) => n.value.body.body.some((n) => n.type === "IfStatement"))
    .map((n) =>
      n.value.body.body
        .filter((n) => n.type === "IfStatement")
        .map((n) => n.consequent)
        .filter((n) => n.type === "TryStatement")
        .map((n) => n.block.body)
        .flat()
        .filter((n) => n.type === "ExpressionStatement" && n.expression.type === "SequenceExpression")
        .map((n) =>
          n.expression.expressions
            .filter((n) => n.type === "CallExpression")
            .filter((n) => n.arguments.length !== 0)
            .map((n) => n.arguments)
        )
        .flat()
        .filter((n) => n.length !== 0)
    )
    .flat()
    .filter((n) => n.every((n) => n.type === "CallExpression"))
    .map(([p, d]) => [p.arguments[1], d.arguments[0]])
    .filter(([p, d]) => p.type == "BinaryExpression" && d !== undefined)
    .map(([p, d]) => [p.right.value, d.name])
    .map(([p, d]) => [p.split("_")[1], d]);

  return res;
}

if (require.main === module) {
  if (!fs.existsSync(path.join(__dirname, "mods/"))) {
    fs.mkdirSync(path.join(__dirname, "mods"));
  }
  let bundle = fs.readFileSync(path.join(__dirname, "main.bundle.js")).toString();
  let main_instance = get_gi(__dirname);

  let data_map_map = extract_data_maps();
  data_map_map = "{" + data_map_map.map((curr) => `"${curr[0]}": ${curr[1]}`).join(",") + "}";
  bundle = bundle.replace(
    RegExp(`(const _0x[a-f0-9]+=${main_instance};)`),
    `$1try{require(__dirname + "/vsmod.js")["scope"](${data_map_map});}catch(e){console["log"](e);};`
  );
  let main_game_idx = bundle.indexOf(`${main_instance} extends`);
  let end_of_game_constructor = bundle.indexOf(";", main_game_idx);
  let param = bundle.slice(main_game_idx, end_of_game_constructor).match(/constructor\((_0x[a-f0-9]+)\)/);
  bundle =
    bundle.slice(0, end_of_game_constructor + 1) +
    `try{require(__dirname + "/vsmod.js")["init"](this, ${param[1]});}catch(e){console["log"](e);};` +
    bundle.slice(end_of_game_constructor + 1);
  fs.writeFileSync(path.join(__dirname, "main.bundle.js"), bundle);
}

module.exports.init = init;
module.exports.scope = scope;
module.exports.get_data_map = (type) => {
  return data_maps[type];
};
module.exports.set_data_map = (type, key, value) => {
  data_maps[type][key] = value;
};

let api = {
  get_data_map: module.exports.get_data_map,
  set_data_map: module.exports.set_data_map,
};
