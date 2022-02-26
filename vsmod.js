const fs = require("fs");
const path = require("path");
const esprima = require("esprima");
const { exit } = require("process");

function readSubDirSync(path) {
  return fs
    .readdirSync(path, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

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

  // Suport MacOS steam version
  if (singles.length === 2 && process.platform == "darwin") {
    return singles[1][0];
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

const PNG = require("pngjs").PNG;

Buffer.prototype.chunk = function (chunkSize) {
  let arr = Array.from(this);
  var R = [];
  for (var i = 0; i < arr.length; i += chunkSize) {
    R.push(arr.slice(i, i + chunkSize));
  }
  return R;
};

Array.prototype.reshape = function (rows, cols) {
  var R = [];

  for (var r = 0; r < rows; r++) {
    var row = [];
    for (var c = 0; c < cols; c++) {
      var i = r * cols + c;
      if (i < this.length) {
        row.push(this[i]);
      }
    }
    R.push(row);
  }
  return R;
};

Array.prototype.subsection = function (x, y, w, h) {
  return this.slice(y, y + h).map((i) => i.slice(x, x + w));
};

Array.prototype.unshape = function () {
  arr = [];
  for (row of this) {
    for (e of row) {
      arr.push(e);
    }
  }
  return arr;
};

function unpack(filename) {
  let ijson = JSON.parse(fs.readFileSync(filename).toString()).textures[0];
  let rawbuf = fs.readFileSync(path.join(path.dirname(filename), ijson.image));
  let ipng = PNG.sync.read(rawbuf);
  let pixels = ipng.data.chunk(4).reshape(ipng.height, ipng.width);
  let frame = ijson.frames[0].frame;
  let sprites = [];
  for (let _frame of ijson.frames) {
    frame = _frame.frame;
    let pframe = pixels.subsection(frame.x, frame.y, frame.w, frame.h);
    sprites.push({
      filename: _frame.filename,
      w: frame.w,
      h: frame.h,
      source: _frame.trimmed
        ? {
            w: _frame.sourceSize.w,
            h: _frame.sourceSize.h,
            x: _frame.spriteSourceSize.x,
            y: _frame.spriteSourceSize.y,
          }
        : {
            w: frame.w,
            h: frame.h,
            x: 0,
            y: 0,
          },
      data: pframe,
    });
  }
  return sprites;
}

function potpack(boxes) {
  // calculate total box area and maximum box width
  let area = 0;
  let maxWidth = 0;

  for (const box of boxes) {
    area += box.w * box.h;
    maxWidth = Math.max(maxWidth, box.w);
  }

  // sort the boxes for insertion by height, descending
  boxes.sort((a, b) => b.h - a.h);

  // aim for a squarish resulting container,
  // slightly adjusted for sub-100% space utilization
  const startWidth = Math.max(Math.ceil(Math.sqrt(area / 0.95)), maxWidth);

  // start with a single empty space, unbounded at the bottom
  const spaces = [{ x: 0, y: 0, w: startWidth, h: Infinity }];

  let width = 0;
  let height = 0;

  for (const box of boxes) {
    // look through spaces backwards so that we check smaller spaces first
    for (let i = spaces.length - 1; i >= 0; i--) {
      const space = spaces[i];

      // look for empty spaces that can accommodate the current box
      if (box.w > space.w || box.h > space.h) continue;

      // found the space; add the box to its top-left corner
      // |-------|-------|
      // |  box  |       |
      // |_______|       |
      // |         space |
      // |_______________|
      box.x = space.x;
      box.y = space.y;

      height = Math.max(height, box.y + box.h);
      width = Math.max(width, box.x + box.w);

      if (box.w === space.w && box.h === space.h) {
        // space matches the box exactly; remove it
        const last = spaces.pop();
        if (i < spaces.length) spaces[i] = last;
      } else if (box.h === space.h) {
        // space matches the box height; update it accordingly
        // |-------|---------------|
        // |  box  | updated space |
        // |_______|_______________|
        space.x += box.w;
        space.w -= box.w;
      } else if (box.w === space.w) {
        // space matches the box width; update it accordingly
        // |---------------|
        // |      box      |
        // |_______________|
        // | updated space |
        // |_______________|
        space.y += box.h;
        space.h -= box.h;
      } else {
        // otherwise the box splits the space into two spaces
        // |-------|-----------|
        // |  box  | new space |
        // |_______|___________|
        // | updated space     |
        // |___________________|
        spaces.push({
          x: space.x + box.w,
          y: space.y,
          w: space.w - box.w,
          h: box.h,
        });
        space.y += box.h;
        space.h -= box.h;
      }
      break;
    }
  }

  return {
    w: width, // container width
    h: height, // container height
    fill: area / (width * height) || 0, // space utilization
  };
}

function repack(sprites, filename) {
  let { w: width, h: height } = potpack(sprites);
  let oimg = [...Array(height)].map((e) => [...Array(width)].map((ee) => [...Array(4)].map((eee) => 0)));
  let ojson = {
    textures: [
      {
        image: filename,
        format: "RGBA8888",
        size: {
          w: width,
          h: height,
        },
        scale: 1,
        frames: Array(sprites.length),
      },
    ],
  };

  for (let [i, sprite] of sprites.entries()) {
    for (let iy = sprite.y; iy < sprite.y + sprite.h; iy++) {
      for (let ix = sprite.x; ix < sprite.x + sprite.w; ix++) {
        ojson.textures[0].frames[i] = {
          filename: sprite.filename,
          rotated: false,
          trimmed: false,
          sourceSize: {
            w: sprite.source.w,
            h: sprite.source.h,
          },
          spriteSourceSize: {
            x: sprite.souce.x,
            y: sprite.source.y,
            w: sprite.w,
            h: sprite.h,
          },
          frame: {
            x: sprite.x,
            y: sprite.y,
            w: sprite.w,
            h: sprite.h,
          },
        };
        oimg[iy][ix] = sprite.data[iy - sprite.y][ix - sprite.x];
      }
    }
  }

  return {
    width: width,
    height: height,
    img: oimg,
    json: ojson,
  };
}

function load_sprite(filename) {
  let rawbuf = fs.readFileSync(filename);
  let ipng = PNG.sync.read(rawbuf);
  let pixels = ipng.data.chunk(4).reshape(ipng.height, ipng.width);

  return {
    filename: path.basename(filename),
    w: ipng.width,
    h: ipng.height,
    source: {
      w: ipng.width,
      h: ipng.width,
      x: 0,
      y: 0,
    },
    data: pixels,
  };
}

function copyDirSync(src, dest, options) {
  var srcPath = path.resolve(src);
  var destPath = path.resolve(dest);
  if (path.relative(srcPath, destPath).charAt(0) != ".") throw new Error("dest path must be out of src path");
  var settings = Object.assign(Object.create(copyDirSync.options), options);
  copyDirSync0(srcPath, destPath, settings);
  function copyDirSync0(srcPath, destPath, settings) {
    var files = fs.readdirSync(srcPath);
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath);
    } else if (!fs.lstatSync(destPath).isDirectory()) {
      if (settings.overwrite)
        throw new Error(`Cannot overwrite non-directory '${destPath}' with directory '${srcPath}'.`);
      return;
    }
    files.forEach(function (filename) {
      var childSrcPath = path.join(srcPath, filename);
      var childDestPath = path.join(destPath, filename);
      var type = fs.lstatSync(childSrcPath).isDirectory() ? "directory" : "file";
      if (!settings.filter(childSrcPath, type)) return;
      if (type == "directory") {
        copyDirSync0(childSrcPath, childDestPath, settings);
      } else {
        fs.copyFileSync(childSrcPath, childDestPath, settings.overwrite ? 0 : fs.constants.COPYFILE_EXCL);
        if (!settings.preserveFileDate) fs.futimesSync(childDestPath, Date.now(), Date.now());
      }
    });
  }
}
copyDirSync.options = {
  overwrite: true,
  preserveFileDate: true,
  filter: function (filepath, type) {
    return true;
  },
};

function sprites(modded_images_dirs) {
  let spritesheets = fs
    .readdirSync(path.join(__dirname, "tmp/img"))
    .filter((a) => a.endsWith("json"))
    .map((a) => {
      return { image: a.replace(".json", ".png"), json: a, unpacked: a.replace(".json", "/") };
    })
    .map((a) => {
      return {
        image: path.join(__dirname, "tmp/img", a.image),
        json: path.join(__dirname, "tmp/img", a.json),
        type: a.json.slice(0, -5),
      };
    })
    .filter((a) => fs.existsSync(a.json) && fs.existsSync(a.image));

  for (let spritesheet of spritesheets) {
    let sprites = unpack(spritesheet.json);
    // read mod sprites
    for (let modded_image of modded_images_dirs
      .flat()
      .filter((d) => path.basename(d) == spritesheet.type)
      .map((d) => fs.readdirSync(d).map((f) => path.join(d, f)))
      .flat()) {
      sprites.push(load_sprite(modded_image));
    }
    let packed = repack(sprites, spritesheet.type + ".png");
    let opng = new PNG({
      width: packed.width,
      height: packed.height,
      colorType: 6,
      bitDepth: 8,
      inputHasAlpha: true,
    });
    opng.data = Buffer.from(packed.img.flat(4));
    let obuf = PNG.sync.write(opng);
    fs.writeFileSync(path.join(__dirname, "assets/img", spritesheet.type + ".png"), obuf);
    fs.writeFileSync(
      path.join(__dirname, "assets/img", spritesheet.type + ".json"),
      JSON.stringify(packed.json, null, 2)
    );
  }
}

let gi;
let gc;

function init(game_instance, game_config) {
  // override and copy over modded assets
  let mods_dirs = fs.readdirSync(path.join(__dirname, "mods/"));
  let modded_images = mods_dirs
    .map((d) => path.join(__dirname, "mods/", d, "img"))
    .filter((d) => fs.existsSync(d))
    .map((d) => fs.readdirSync(d).map((i) => path.join(d, i)));
  // backup original game images
  if (!fs.existsSync(path.join(__dirname, "tmp/img"))) {
    if (!fs.existsSync(path.join(__dirname, "tmp/"))) {
      fs.mkdirSync(path.join(__dirname, "tmp/"));
    }
    copyDirSync(path.join(__dirname, "assets/img"), path.join(__dirname, "tmp/img"));
  }
  sprites(modded_images);

  gi = game_instance.__proto__.constructor;
  gc = game_config;
  // Construct each mod, this will set their pre and post hooks and whatever initial variables they might need
  console.log("Initializing Vampire Survivors Mod Loader");
  let mods = mods_dirs
    .map((d) =>
      path.join(d, fs.readdirSync(path.join(__dirname, "mods/", d)).filter((f) => f.endsWith(".js"))[0])
    )
    .map((f) => require(path.join(__dirname, "mods/", f)))
    .map((mod) => new mod(gi, game_config, api));
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
