/* Live WebGL2 drawing primitives used by the primary PixiJS compositor.
   Loaded in the playable PWA; not a standalone renderer.
   Inputs are projected world art and original asset images.
   Frame and lamp GPU commands do not use Canvas 2D drawing calls. */
(function (root) {
  'use strict';
  const DEFAULT_CLEAR = Object.freeze([12 / 255, 25 / 255, 19 / 255, 1]);
  const DEFAULT_BUDGET = 64 * 1024 * 1024;
  const assert = (okay, reason) => { if (!okay) throw Error(reason); return okay; };
  const finite = (...numbers) => numbers.every(Number.isFinite);
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));

  function iso(x, y) {
    assert(finite(x, y), 'Projection requires finite coordinates');
    return { x: (x - y) * 0.76, y: (x + y) * 0.27 };
  }
  function project(entity, hero, viewport, platform) {
    const scale = platform.cameraZoom || 1;
    const anchor = platform.cameraAnchor(viewport.width, viewport.height);
    const world = iso(entity.x, entity.y), center = iso(hero.x, hero.y);
    return {
      x: (world.x - center.x) * scale + anchor.x,
      y: (world.y - center.y) * scale + anchor.y
    };
  }
  function spriteLayout({ textureId, entry, frame = null, imageWidth, imageHeight,
                          point, scale = 1, facing = 1 }) {
    assert(typeof textureId === 'string' && textureId.length > 0, 'Texture id required');
    assert(entry && point && finite(point.x, point.y, scale) && scale > 0,
      'Original sprite dimensions and position required');
    const srcWidth = imageWidth, srcHeight = imageHeight;
    assert(finite(srcWidth, srcHeight) && srcWidth > 0 && srcHeight > 0,
      'Decoded original texture dimensions required');
    const clip = frame?.rect || [0, 0, srcWidth, srcHeight];
    assert(Array.isArray(clip) && clip.length === 4 && clip.every(Number.isFinite) &&
      clip[2] > 0 && clip[3] > 0 && clip[0] >= 0 && clip[1] >= 0 &&
      clip[0] + clip[2] <= srcWidth && clip[1] + clip[3] <= srcHeight,
      'Sprite clip must be inside original image');
    const width = clip[2], height = clip[3];
    const dw = (Number(entry.displayWidth) || width) * scale;
    const dh = (Number(entry.displayHeight) || height) * scale;
    const ax = frame ? frame.pivot[0] / width :
      Number.isFinite(entry.anchorX) ? entry.anchorX : 0.5;
    const ay = frame ? frame.pivot[1] / height :
      Number.isFinite(entry.anchorY) ? entry.anchorY : 0.88;
    const left = Math.round(point.x - dw * ax);
    const top = Math.round(point.y - dh * ay);
    const physicalWidth = Math.round(dw), physicalHeight = Math.round(dh);
    return {
      kind: 'sprite', textureId,
      x: facing < 0 ? 2 * point.x - (left + physicalWidth) : left,
      y: top, width: physicalWidth, height: physicalHeight,
      sourceRect: clip.slice(),
      opacity: Number.isFinite(entry.opacity) ? clamp(entry.opacity, 0, 1) : 1,
      flipX: facing < 0
    };
  }
  // Positions correspond to the game's existing PrototypeVisuals.atmosphere
  // light source calculation; these are GPU geometry commands rather than
  // re-painted screenshots. The gameplay supplies projected light coordinates.
  function lampGlowCommands(lights, region, { darkness = 1, hero = null } = {}) {
    const cmds = [];
    // Canvas keeps the tiny carried-glass glow visible by daylight, even
    // though its broad night light pools disappear. Do not add daytime
    // civic lamps or change world visibility/combat rules.
    if (darkness <= 0) return lights
      .filter((lamp) => lamp.kind === 'carried-lantern')
      .slice(0, 8)
      .map((lamp) => ({
        kind: 'screenGlow', x: lamp.x, y: lamp.y, radius: 22,
        rgb: [255, 221, 150], alpha: 0.12,
      }));
    if (hero) cmds.push({
      kind: 'screenGlow', x: hero.x, y: hero.y, radius: 145,
      rgb: region === 4 ? [215, 191, 231] : [235, 221, 184],
      alpha: 0.18 * clamp(darkness, 0, 1)
    });
    for (const lamp of lights.slice(0, 36)) {
      const carried = lamp.kind === 'carried-lantern',
        window = lamp.kind === 'window',
        fire = lamp.kind === 'fire' || lamp.kind === 'work-fire';
      const radius = carried ? 64 : window ? 70 :
        lamp.kind === 'work-fire' ? 105 : fire ? 90 : 85;
      const y = carried ? lamp.y : lamp.y -
        (lamp.fixture === 'post' ? 46 : window ? 32 : fire ? 13 : 28);
      cmds.push({
        kind: 'screenGlow', x: lamp.x, y, radius,
        rgb: region === 1 ? [245, 208, 150] :
          region === 4 ? [247, 194, 147] : [255, 207, 132],
        alpha: (window ? 0.27 : fire ? 0.30 : 0.25) * clamp(darkness, 0, 1)
      });
      if (carried) {
        cmds.push({
          kind: 'screenGlow', x: lamp.x, y, radius: 10,
          rgb: [255, 221, 150], alpha: 0.5 * clamp(darkness, 0, 1)
        });
        // Corresponds to Canvas's separate 22px daylight glass bloom.
        if (darkness < 1) cmds.push({
          kind: 'screenGlow', x: lamp.x, y, radius: 22,
          rgb: [255, 221, 150], alpha: 0.12 * (1 - clamp(darkness, 0, 1))
        });
      }
    }
    return cmds;
  }

  const VERTEX = '#version 300 es\n' +
    'in vec2 aUnit;uniform vec2 uViewport;uniform vec4 uRect;' +
    'out highp vec2 vUv;void main(){vec2 p=uRect.xy+aUnit*uRect.zw;' +
    'gl_Position=vec4(p.x/uViewport.x*2.0-1.0,1.0-p.y/uViewport.y*2.0,0.,1.);' +
    'vUv=aUnit;}';
  const SPRITE = '#version 300 es\n' +
    'precision highp float;in highp vec2 vUv;uniform sampler2D uTexture;' +
    'uniform vec4 uCrop;uniform float uOpacity;uniform float uFlip;' +
    'out vec4 color;void main(){vec2 uv=vec2(mix(vUv.x,1.-vUv.x,uFlip),vUv.y);' +
    'color=texture(uTexture,mix(uCrop.xy,uCrop.zw,uv))*uOpacity;}';
  const LIGHT = '#version 300 es\n' +
    'precision highp float;in highp vec2 vUv;uniform vec3 uColor;' +
    'uniform float uIntensity;out vec4 color;' +
    'void main(){float r=length(vUv*2.-1.);' +
    'float a=r<=0.35?mix(uIntensity,uIntensity*0.48,r/0.35):' +
    'mix(uIntensity*0.48,0.,clamp((r-0.35)/0.65,0.,1.));' +
    'color=vec4(uColor*a,a);}';
  const GRADE = '#version 300 es\n' +
    'precision highp float;in highp vec2 vUv;uniform vec4 uTop;' +
    'uniform vec4 uBottom;uniform float uStrength;out vec4 color;' +
    'void main(){vec4 c=mix(uTop,uBottom,vUv.y);float a=c.a*uStrength;' +
    'color=vec4(c.rgb*a,a);}';

  function create({ canvas, budgetBytes = DEFAULT_BUDGET, onContextLost = () => {},
                    onRestoreRequired = () => {} }) {
    assert(canvas && typeof canvas.getContext === 'function',
      'Dedicated WebGL2 canvas required');
    assert(Number.isSafeInteger(budgetBytes) && budgetBytes > 0,
      'Finite GPU texture budget required');
    const gl = assert(canvas.getContext('webgl2', {
      alpha: false, antialias: false, preserveDrawingBuffer: false
    }), 'WebGL2 unavailable; caller must retain original Canvas renderer');
    let lost = false, destroyed = false, usedBytes = 0, frames = 0, submitted = 0;
    const textures = new Map();
    const onLost = (event) => {
      event?.preventDefault?.();
      lost = true;
      onContextLost();
    };
    const onRestored = () => {
      // Resource names/GL state are INVALID after loss. A new renderer must
      // upload all original textures; do not resume a half-restored scene.
      lost = true;
      onRestoreRequired();
    };
    canvas.addEventListener?.('webglcontextlost', onLost);
    canvas.addEventListener?.('webglcontextrestored', onRestored);
    function available() {
      return !destroyed && !lost && !(gl.isContextLost?.() || false);
    }
    function shader(kind, source) {
      const sh = assert(gl.createShader(kind), 'Unable to allocate GPU shader');
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
      assert(gl.getShaderParameter(sh, gl.COMPILE_STATUS),
        gl.getShaderInfoLog(sh) || 'GPU shader compile failed');
      return sh;
    }
    function makeProgram(fragment) {
      const vertex = shader(gl.VERTEX_SHADER, VERTEX);
      const pixel = shader(gl.FRAGMENT_SHADER, fragment);
      const program = assert(gl.createProgram(), 'Unable to allocate WebGL2 program');
      gl.attachShader(program, vertex); gl.attachShader(program, pixel);
      gl.linkProgram(program);
      assert(gl.getProgramParameter(program, gl.LINK_STATUS),
        gl.getProgramInfoLog(program) || 'GPU program link failed');
      gl.deleteShader(vertex); gl.deleteShader(pixel);
      return {
        handle: program,
        location(name) { return gl.getUniformLocation(program, name); },
      };
    }
    const programs = {
      sprite: makeProgram(SPRITE),
      screenGlow: makeProgram(LIGHT),
      nightGrade: makeProgram(GRADE)
    };
    const quad = assert(gl.createBuffer(), 'GPU quad buffer unavailable');
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([0,0, 1,0, 0,1, 0,1, 1,0, 1,1]), gl.STATIC_DRAW);
    const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const locationByProgram = new Map();
    function use(type) {
      const program = programs[type];
      gl.useProgram(program.handle);
      gl.bindBuffer(gl.ARRAY_BUFFER,quad);
      let location = locationByProgram.get(type);
      if (location === undefined) {
        location = gl.getAttribLocation(program.handle, 'aUnit');
        assert(location >= 0, 'Quad position attribute absent');
        locationByProgram.set(type, location);
      }
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location,2,gl.FLOAT,false,8,0);
      gl.uniform2f(program.location('uViewport'),canvas.width,canvas.height);
      return program;
    }
    function rect(program,x,y,width,height) {
      assert(finite(x,y,width,height) && width > 0 && height > 0,
        'Valid GPU rectangle required');
      gl.uniform4f(program.location('uRect'),x,y,width,height);
    }
    function drawUnitQuad() {
      gl.drawArrays(gl.TRIANGLES,0,6);
      submitted++;
    }
    function registerTexture(id, image) {
      assert(available(),'GPU renderer unavailable or context lost');
      assert(typeof id === 'string' && id.length > 0 && image,
        'Original image and texture id required');
      const width = image.naturalWidth || image.width,
        height = image.naturalHeight || image.height;
      assert(Number.isSafeInteger(width) && Number.isSafeInteger(height) &&
        width > 0 && height > 0 && width <= maxTextureSize &&
        height <= maxTextureSize,'Texture dimensions exceed WebGL2 limits');
      const bytes = width * height * 4, old = textures.get(id);
      assert(Number.isSafeInteger(bytes) &&
        usedBytes - (old?.bytes || 0) + bytes <= budgetBytes,
        'GPU texture budget exceeded: refuse unbounded upload');
      const texture = assert(gl.createTexture(),'GPU texture allocation failed');
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      try {
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
        assert(gl.getError()===gl.NO_ERROR,'Original art texture upload failed');
      } catch(error) {
        gl.deleteTexture(texture);
        throw error;
      }
      if(old) gl.deleteTexture(old.handle);
      textures.set(id,{handle:texture,width,height,bytes});
      usedBytes=usedBytes-(old?.bytes||0)+bytes;
      return {id,width,height,bytes};
    }
    function releaseTexture(id) {
      const item=textures.get(id);
      if(!item)return false;
      if(available())gl.deleteTexture(item.handle);
      textures.delete(id);usedBytes-=item.bytes;
      return true;
    }
    function drawSprite(command) {
      const item=assert(textures.get(command.textureId),
        'Sprite texture missing; must preload original art before frame');
      const src=command.sourceRect || [0,0,item.width,item.height];
      assert(Array.isArray(src) && src.length===4 && src.every(Number.isFinite) &&
        src[2]>0 && src[3]>0 && src[0]>=0 && src[1]>=0 &&
        src[0]+src[2]<=item.width && src[1]+src[3]<=item.height,
        'Sprite source region outside loaded original art');
      const program=use('sprite');
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D,item.handle);
      gl.uniform1i(program.location('uTexture'),0);
      gl.uniform4f(program.location('uCrop'),src[0]/item.width,src[1]/item.height,
        (src[0]+src[2])/item.width,(src[1]+src[3])/item.height);
      gl.uniform1f(program.location('uOpacity'),clamp(command.opacity??1,0,1));
      gl.uniform1f(program.location('uFlip'),command.flipX?1:0);
      rect(program,command.x,command.y,command.width,command.height);
      drawUnitQuad();
    }
    function drawGlow(command) {
      const { x, y, radius, rgb, alpha }=command;
      assert(finite(x,y,radius,alpha) && radius>0 &&
        Array.isArray(rgb) && rgb.length===3 && rgb.every(Number.isFinite),
        'Original source light needs center/radius/color/alpha');
      const program=use('screenGlow');
      gl.enable(gl.BLEND);
      // Screen: src + dst*(1-src) for premultiplied RGB, preserving alpha.
      gl.blendFuncSeparate(gl.ONE,gl.ONE_MINUS_SRC_COLOR,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform3f(program.location('uColor'),...rgb.map(n=>clamp(n/255,0,1)));
      gl.uniform1f(program.location('uIntensity'),clamp(alpha,0,1));
      rect(program,x-radius,y-radius,radius*2,radius*2);
      drawUnitQuad();
    }
    function drawNightGrade(command) {
      const {top,bottom,strength=1}=command;
      assert([top,bottom].every(c=>Array.isArray(c)&&c.length===4&&
        c.every(Number.isFinite)), 'RGBA daytime/night grade endpoints required');
      const program=use('nightGrade');
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform4f(program.location('uTop'),...top);
      gl.uniform4f(program.location('uBottom'),...bottom);
      gl.uniform1f(program.location('uStrength'),clamp(strength,0,1));
      rect(program,0,0,canvas.width,canvas.height);
      drawUnitQuad();
    }
    // Preflight the COMPLETE display list before touching the framebuffer.
    // Missing art or unsupported lighting must NEVER produce half a picture.
    function validateCommand(command) {
      assert(command && typeof command==='object','GPU draw command required');
      if(command.kind==='sprite') {
        const item=assert(textures.get(command.textureId),
          'Sprite texture missing; must preload original art before frame');
        assert(finite(command.x,command.y,command.width,command.height) &&
          command.width>0&&command.height>0,
          'Native sprite geometry is invalid');
        assert(command.opacity===undefined ||
          (finite(command.opacity) && command.opacity>=0 && command.opacity<=1),
          'Invalid sprite opacity');
        const src=command.sourceRect || [0,0,item.width,item.height];
        assert(Array.isArray(src)&&src.length===4&&src.every(Number.isFinite)&&
          src[2]>0&&src[3]>0&&src[0]>=0&&src[1]>=0&&
          src[0]+src[2]<=item.width&&src[1]+src[3]<=item.height,
          'Sprite source region outside loaded original art');
      } else if(command.kind==='screenGlow') {
        assert(finite(command.x,command.y,command.radius,command.alpha) &&
          command.radius>0&&command.alpha>=0&&command.alpha<=1 &&
          Array.isArray(command.rgb)&&command.rgb.length===3 &&
          command.rgb.every(n=>Number.isFinite(n)&&n>=0&&n<=255),
          'Native lamp/ambient light command invalid');
      } else if(command.kind==='nightGrade') {
        assert([command.top,command.bottom].every(c=>Array.isArray(c)&&
          c.length===4&&c.every(n=>Number.isFinite(n)&&n>=0&&n<=1))&&
          (command.strength===undefined ||
            (finite(command.strength)&&command.strength>=0&&command.strength<=1)),
          'Native night/day grade command invalid');
      } else throw Error('Unsupported GPU scene command: '+String(command.kind));
    }
    function draw(commands,{clear=DEFAULT_CLEAR}={}) {
      assert(available(),'WebGL2 context lost; caller must use Canvas fallback');
      assert(Array.isArray(commands),'Ordered GPU display list required');
      assert(Array.isArray(clear)&&clear.length===4&&
        clear.every(n=>Number.isFinite(n)&&n>=0&&n<=1),
        'Frame clear must be normalized RGBA');
      for(const command of commands)validateCommand(command);
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.disable(gl.BLEND);
      gl.clearColor(...clear);
      gl.clear(gl.COLOR_BUFFER_BIT);
      for(const command of commands) {
        if(command.kind==='sprite')drawSprite(command);
        else if(command.kind==='screenGlow')drawGlow(command);
        else drawNightGrade(command);
      }
      frames++;
      return {frames,commands:commands.length};
    }
    function metrics() {
      return {
        gpuAvailable:available(), frames, submitted,
        textures:textures.size, textureBytes:usedBytes,textureBudgetBytes:budgetBytes
      };
    }
    function destroy() {
      if(destroyed)return;
      if(available()) {
        for(const {handle} of textures.values())gl.deleteTexture(handle);
        for(const program of Object.values(programs))gl.deleteProgram(program.handle);
        gl.deleteBuffer(quad);
      }
      textures.clear(); usedBytes=0; destroyed=true;
      canvas.removeEventListener?.('webglcontextlost',onLost);
      canvas.removeEventListener?.('webglcontextrestored',onRestored);
    }
    return Object.freeze({
      registerTexture,releaseTexture,draw,metrics,destroy,available
    });
  }

  const API=Object.freeze({
    create,iso,project,spriteLayout,lampGlowCommands,
    DEFAULT_CLEAR,DEFAULT_BUDGET
  });
  if(typeof module!=='undefined'&&module.exports)module.exports=API;
  else root.AzerothNativeWebGLCore=API;
})(typeof window!=='undefined'?window:globalThis);
