const Raycaster = require('engine')

export class Player extends Raycaster.PlanarObject {
  MOUSE_TURN_MULT = 2 / 3
  KEYBOARD_TURN_HORIZ_MULT = 1.25
  KEYBOARD_TURN_VERT_MULT = 3
  SHIFT_MULT = 2
  MIN_PITCH = -Math.PI * 4
  MAX_PITCH = Math.PI * 4
  _GRAVITATIONAL_FORCE = 30
  JUMP_FORCE = 150
  ARCADE_MOVE_FORCE = 17500
  TERMINAL_VELOCITY_X = 300
  TERMINAL_VELOCITY_Z = 300
  TERMINAL_VELOCITY_Y = 300
  // JUMP_FORCE = 2500
  // ARCADE_MOVE_FORCE = 175000
  // TERMINAL_VELOCITY_X = 30000
  // TERMINAL_VELOCITY_Z = 30000
  // TERMINAL_VELOCITY_Y = 10000

  soundEnabled = false
  moveCallback = () => {}

  constructor(raycaster,game,x,y,options={}) {
    let width = 100;
    let height = .5;
    // height = .1;
    super(raycaster, x, y, x+width, y, Object.assign(options, {
      varHeight: height
    }));
    this.game = game;

    this.addCamera(game, 100);

    const [w, h] = [125, 125];
    const padding = 10;
    this.minimap = new Raycaster.Minimap(
      this,
      .855,
      () => raycaster.instanceWidth * .015,
      () => raycaster.instanceWidth*.13,
      () => raycaster.instanceWidth*.13,
      undefined,
      undefined,
      {
        borderWidth: 2,
        relative: true
      }
    );

    this.keys = Player.KEYS.shift();

    this._TERMINAL_VELOCITY = {
      x: this.TERMINAL_VELOCITY_X,
      z: this.TERMINAL_VELOCITY_Z,
      y: this.TERMINAL_VELOCITY_Y
    };

    this.ARCADE_PHYSICS = true;

    this.friction.y = this._GRAVITATIONAL_FORCE;

    if (this.ARCADE_PHYSICS) {
      // Adjust force for fixed speed
      this.force = this.ARCADE_MOVE_FORCE;
    }
    else {
      this.force = 2500;

      this.friction.x = 750;
      this.friction.z = 750;
    }

    this.loadSounds()
  }

  get GRAVITATIONAL_FORCE() {
    return this._GRAVITATIONAL_FORCE
  }

  set GRAVITATIONAL_FORCE(value) {
    this._GRAVITATIONAL_FORCE = value
    this.friction.y = value
  }

  render(elapsed) {
    super.render(elapsed);
    let ctx = this.game.canvas.getContext('2d');
    this.camera.render();
    // this.minimap.render();
  }
  setupMouse() {
    super.setupMouse(this.game);
    this.mouse.setMoveCallback(this.mouseMove,this);
  }
  /**
   * Applies a negative force to the player's y-velocity
   *
   * @param {number} elapsed - Elapsed time in milliseconds since the previous frame. Used to calculate time-based movement.
   */
  jump(elapsed) {
    // Requires varHeight to work properly when the y-axis exceeds 1
    // If the player is not grounded, do not jump
    if (this.yPos3D === 0) {
      this.moveY(this.JUMP_FORCE, elapsed);
    }
  }
  /**
   * Moves the Player in the 2d plane.
   *
   * @param {number} horiz - Within {-1, 0, 1}. Indicates direction of strafe.
   * @param {number} vert - Within {-1, 0, 1}. Indicates direction of movement.
   * @param {number} mult - Multiplier applied to vertical and horizontal speed (e.g. when shift is down a multiplier is applied to increase speed).
   * @param {number} elapsed - Elapsed time in milliseconds since the previous frame. Used to calculate time-based movement.
   *
   */
  move(horiz, vert, mult, elapsed) {
    const force = this.force * (vert + horiz) * mult;
    super.move(force, horiz, elapsed);
  }
  /**
   * Rotates the Player in the 2d plane.
   *
   * @param {number} horiz - Within {-1, 1}. Indicates direction.
   * @param {number} elapsed - Elapsed time in milliseconds since the previous frame. Used to calculate time-based movement.
   *
   */
  turnHorizontally(horiz, elapsed) {
    let angle = horiz * this.camera.turnSpeed * this.KEYBOARD_TURN_HORIZ_MULT * (elapsed/1000);
    super.turnHorizontally(angle);
  }
  /**
   * Rotates the Player's vertical angle about the y-axis of a sphere (in a 3d context).
   *
   * @param {number} vert - Within {-1, 1}. Indicates direction.
   * @param {number} elapsed - Elapsed time in milliseconds since the previous frame. Used to calculate time-based movement.
   *
   */
  turnVertically(vert, elapsed) {
    let angle = vert * this.camera.turnSpeed * this.KEYBOARD_TURN_VERT_MULT * (elapsed/1000);
    super.turnVertically(angle);
    this.verticalAngle = Math.max(this.MIN_PITCH, Math.min(this.verticalAngle, this.MAX_PITCH))
    // NOTE: works properly but does not look correct due to the skybox and ground not being true.
  }
  handleInput(elapsed) {
    if (this.keys.q.isDown) {
      this.turnHorizontally(-1, elapsed);
    }
    if (this.keys.e.isDown) {
      this.turnHorizontally(1, elapsed);
    }
    if (this.keys.up.isDown) {
      this.turnVertically(1, elapsed);
    }
    if (this.keys.down.isDown) {
      this.turnVertically(-1, elapsed);
    }
    if (this.keys.space.isDown) {
      this.jump(elapsed);
    }
  }

  update(elapsed) {
    // super.update(elapsed);
    // /* Traditional arcade-esque physics */
    // if (this.ARCADE_PHYSICS) {
    //   this.velocity.x = 0;
    //   this.velocity.z = 0;
    //   // Leave y-axis.
    // }
    let forward = false
    let back = false
    let left = false
    let right = false
    let mult = this.keys.shift.isDown ? this.SHIFT_MULT : 1
    if (this.keys.w.isDown) {
      forward = true
    }
    if (this.keys.a.isDown) {
      left = true
    }
    if (this.keys.s.isDown) {
      back = true
    }
    if (this.keys.d.isDown) {
      right = true
    }
    let ang = this.angle;
    let moveX = 0
    let moveZ = 0
    if (left) {
      moveX += Math.cos(ang)
      moveZ += Math.sin(ang)
    }
    if (right) {
      moveX -= Math.cos(ang)
      moveZ -= Math.sin(ang)
    }
    if (forward) {
      moveX += Math.cos(ang + Math.PI/2)
      moveZ += Math.sin(ang + Math.PI/2)
    }
    if (back) {
      moveX += Math.cos(ang - Math.PI/2)
      moveZ += Math.sin(ang - Math.PI/2)
    }
    const mag = Math.sqrt(moveX ** 2 + moveZ ** 2)
    if (mag > 0) {
      moveX = (moveX / mag) * this.TERMINAL_VELOCITY_X * mult
      moveZ = (moveZ / mag) * this.TERMINAL_VELOCITY_Z * mult
      const x = moveX * elapsed/1000
      const z = moveZ * elapsed/1000
      this.setX(this.start.x+x)
      this.setZ(this.start.y+z)
      this.handleCollision()
      this.playWalkSound()
      this.moveCallback()
    }
    let didMoveY = false
    this.velocity.y -= (this.GRAVITATIONAL_FORCE / this.mass) * (elapsed/1000);
    if (this.velocity.y !== 0) {
      let y = this.velocity.y * (elapsed/1000);
      if (this.yPos3D > 0 && this.yPos3D + y <= 0 && this.soundEnabled) this.jumpLandSound.play()
      this.yPos3D += y;
      didMoveY = true
    }
    if (this.yPos3D < 0) {
      this.yPos3D = 0;
      this.velocity.y = 0;
    }
    if (didMoveY) this.moveCallback()
    this.handleInput(elapsed)
  }

  mouseMove(e) {
    let moveX = e.movementX;
    let moveY = e.movementY;
    this.turnHorizontally(moveX, this.MOUSE_TURN_MULT);
    this.turnVertically(-moveY, this.MOUSE_TURN_MULT);
  }

  loadSounds() {
    const walkSrcs = [...Array(18).keys()].map((i) => {
      const num = (i + 1).toString().padStart(2, "0")
      return `${ process.env.PUBLIC_URL }/sounds/walk2/Corsica_S-Walking_on_snow_covered_gravel_${ num }.mp3`
    })
    this.walkSounds = walkSrcs.map((src) => new Audio(src))
    this.walkSound = null

    this.jumpLandSound = new Audio(`${ process.env.PUBLIC_URL }/sounds/jumpland2.mp3`)
    this.jumpLandSound.volume = 0.75
  }

  playWalkSound() {
    if (this.soundEnabled && (!this.walkSound || this.walkSound.paused)) {
      this.walkSound = this.walkSounds[Math.floor(Math.random() * this.walkSounds.length)]
      this.walkSound.playbackRate = this.keys.shift.isDown ? 3.5 : 2
      this.walkSound.play()
    }
  }
}