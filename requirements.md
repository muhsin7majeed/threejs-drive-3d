# Driving Sandbox (Arcade Physics) - Requirements

## 🎯 Goal

Build an **arcade-style driving sandbox** using **React Three Fiber** and **Rapier** where the player controls a 3D car in a physics-enabled environment.  
The experience should feel **smooth, snappy, and fun** rather than hyper-realistic.  
Think: drifting, responsive steering, and satisfying camera follow.

---

## 🚗 Core Gameplay

- Player drives a single car around a 3D environment.
- Car responds to **physics** (collisions, friction, gravity).
- **Rear-wheel torque** provides acceleration.
- **Front wheels steer** left/right, affecting the car’s movement direction.
- Driving feel is **arcade-like** (forgiving, responsive), not simulation.

---

## 🧑‍💻 Technical Stack

- **React Three Fiber (R3F)** → rendering & scene management.
- **@react-three/rapier** → physics engine integration.
- **GLTF car model** with **separate wheels** for animation.
- **Keyboard input** (Arrow keys or WASD).

---

## 🔑 Features

### Phase 1 (MVP)

- Render 3D scene with ground plane, lighting, and skybox.
- Load a GLTF car model with separate wheels.
- Create a rigidbody chassis for the car.
- Add colliders:
  - Box collider for chassis.
  - Cylinder/sphere colliders for wheels (or raycast wheels).
- Keyboard input:
  - ArrowUp / W → apply torque (accelerate).
  - ArrowDown / S → brake/reverse.
  - ArrowLeft / A → steer left.
  - ArrowRight / D → steer right.
- Apply torque to **rear wheels** only.
- Rotate **front wheels (Y-axis)** for steering.
- Rotate **all wheels (X-axis)** to match movement speed.
- Smooth **chase camera** that follows behind car.

### Phase 2 (Polish)

- Add **linear + angular damping** to make driving smoother.
- Reduce steering angle at high speeds.
- Add **friction** and **drift factor** to prevent hovercraft feel.
- Add **center of mass adjustment** to reduce flipping.
- Add collisions with simple environment props (walls, ramps, cubes).
- Add particle effects:
  - Dust/smoke when drifting or braking.
  - Skid marks on sharp turns.

### Phase 3 (Stretch Goals)

- Terrain/road environment (heightfield collider).
- Multiple cars / AI traffic.
- Audio feedback (engine rev, drift sounds, collisions).
- Speedometer UI overlay.
- Reset car if it flips upside down.
- Simple checkpoint or lap-based system (optional).

---

## 📚 Key Concepts & Keywords

Search for:

- `react-three-fiber car example`
- `@react-three/rapier rigidbody`
- `applyTorqueImpulse rapier`
- `ackermann steering geometry`
- `raycast vehicle physics`
- `arcade car controller unity`
- `react-three-fiber chase camera`
- `rapier linear damping angular damping`
- `car drift physics pseudocode`

---

## ⚠️ Gotchas

- Wheels need **separate groups** for spin (X) and steer (Y).
- Keep **units consistent** (1 unit = 1 meter).
- Use **impulses/torque**, not manual position setting.
- Cap **max velocity** to avoid infinite acceleration.
- Lower **center of mass** for stability.
- Clamp **sideways velocity** for arcade-style grip.

---
