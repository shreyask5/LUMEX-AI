# Example: Multi-Step Navigation Workflow

## Scenario: Navigate Around a Box

This example demonstrates the complete workflow for navigating around a simple obstacle.

---

## Step-by-Step Example

### Initial Setup

**User says:** "There is a box in front of me. Help me get to the other side."

### 1. System Detects Object and Starts Navigation

```javascript
// Browser Console (or triggered by voice/CV system)

// Add the detected box to scene memory
window.lumaNav.addObject('box', 3, 0, 'cardboard box');
// This creates: SceneObject { name: 'box', position: [3, 0], description: 'cardboard box' }

// Start navigation with goal
window.lumaNav.start('get to the other side of the box');
```

**What happens internally:**
```typescript
// Scene memory now contains:
{
  user: [0, 0],           // User at origin
  objects: [
    {
      name: 'box',
      position: [3, 0],   // Box is 3 units ahead
      description: 'cardboard box'
    }
  ],
  goalDescription: 'get to the other side of the box'
}

// System sends to Gemini:
`
--- SCENE MEMORY ---
User Position: [0, 0]

Detected Objects:
- box at [3, 0] (relative: [3, 0]) - cardboard box

Navigation Goal: get to the other side of the box
--- END SCENE MEMORY ---

I need to navigate: get to the other side of the box. What objects do you see and what should I do first?
`
```

---

### 2. Gemini Provides First Instruction

**Gemini responds (via audio):**
> "I can see a cardboard box approximately 3 feet directly in front of you. I'll guide you around it safely.
>
> **Step 1:** Take 2 steps to your right."

**Scene State:**
- User: `[0, 0]`
- Box: `[3, 0]` (still 3 units ahead)
- Instruction: Move right to avoid collision

---

### 3. User Completes Step 1

**User performs action:** Takes 2 steps to the right

```javascript
// Update position after completing the step
window.lumaNav.updateStep([0, 2], 'moved 2 steps right');
```

**What happens internally:**
```typescript
// Previous position saved to history
history.push({
  timestamp: Date.now(),
  user: [0, 0],
  objects: [...],
  action: 'moved 2 steps right'
});

// User position updated
user: [0, 2]  // User is now 2 units to the right

// System sends to Gemini:
`
--- SCENE MEMORY ---
User Position: [0, 2]

Detected Objects:
- box at [3, 0] (relative: [3, -2]) - cardboard box

Navigation Goal: get to the other side of the box
--- END SCENE MEMORY ---

I completed that step. What's next?
`
```

**Note:** Box is now at `relative: [3, -2]` meaning 3 units ahead and 2 units to the LEFT of current position.

---

### 4. Gemini Provides Second Instruction

**Gemini responds:**
> "Good job! You've successfully moved to the right side of the box.
>
> **Step 2:** Now take 4 steps forward to pass the box."

**Scene State:**
- User: `[0, 2]` (2 units right of start)
- Box: `[3, 0]` (absolute) = `[3, -2]` (relative)
- Instruction: Move forward to pass the obstacle

---

### 5. User Completes Step 2

**User performs action:** Takes 4 steps forward

```javascript
window.lumaNav.updateStep([4, 2], 'moved 4 steps forward');
```

**What happens internally:**
```typescript
// User position updated
user: [4, 2]  // User is now 4 units forward, 2 units right

// System sends to Gemini:
`
--- SCENE MEMORY ---
User Position: [4, 2]

Detected Objects:
- box at [3, 0] (relative: [-1, -2]) - cardboard box

Navigation Goal: get to the other side of the box
--- END SCENE MEMORY ---

I completed that step. What's next?
`
```

**Note:** Box is now BEHIND user at `relative: [-1, -2]` (1 unit behind, 2 units left).

---

### 6. Gemini Provides Final Instruction

**Gemini responds:**
> "Excellent! You've passed the box and are now on the other side.
>
> **Step 3:** Take 2 steps to your left to return to the center path."

**Scene State:**
- User: `[4, 2]` (past the box, but offset to the right)
- Box: `[3, 0]` (behind and to the left)
- Instruction: Center yourself after detour

---

### 7. User Completes Final Step

**User performs action:** Takes 2 steps to the left

```javascript
window.lumaNav.updateStep([4, 0], 'moved 2 steps left');
```

**What happens internally:**
```typescript
// User position updated
user: [4, 0]  // User is now 4 units forward, back at center

// System sends to Gemini:
`
--- SCENE MEMORY ---
User Position: [4, 0]

Detected Objects:
- box at [3, 0] (relative: [-1, 0]) - cardboard box

Navigation Goal: get to the other side of the box
--- END SCENE MEMORY ---

I completed that step. What's next?
`
```

**Note:** Box is now directly behind at `relative: [-1, 0]`.

---

### 8. Gemini Confirms Goal Reached

**Gemini responds:**
> "Perfect! You have successfully navigated around the cardboard box and reached the other side. You are now 1 foot past the box on the original path. Navigation complete!"

```javascript
// End navigation session
window.lumaNav.complete();
```

---

## Visual Representation

```
Starting Position:
     Y (Right) →
     |
[0,2]│
     │
[0,1]│
     │
[0,0]│ 🧑 User
     └────────────────── X (Forward) →
[1,0]  [2,0]  [3,0]  [4,0]
               📦 Box


After Step 1 (move 2 right):
     Y →
     |
[0,2]│ 🧑 User
     │
[0,1]│
     │
[0,0]│
     └─────────────────
[1,0]  [2,0]  [3,0]  [4,0]
               📦 Box


After Step 2 (move 4 forward):
     Y →
     |
[4,2]│ 🧑 User
     │
[3,0]│        📦 Box (passed!)
     │
[0,0]│ (start)
     └─────────────────
       [1,0][2,0][3,0][4,0]


After Step 3 (move 2 left):
     Y →
     |
[4,1]│
     │
[4,0]│ 🧑 User (goal reached!)
     │
[3,0]│    📦 Box (behind)
     │
[0,0]│ (start)
     └─────────────────
```

---

## Key Observations

### 1. **Scene Memory Persists**
Even though the box moves out of camera view during steps 2-3, the system remembers its position and calculates relative positions.

### 2. **Relative Position Updates**
- At `[0, 0]`: Box is at `relative [3, 0]` (ahead)
- At `[0, 2]`: Box is at `relative [3, -2]` (ahead-left)
- At `[4, 2]`: Box is at `relative [-1, -2]` (behind-left)
- At `[4, 0]`: Box is at `relative [-1, 0]` (behind)

### 3. **Context-Aware Instructions**
Gemini receives the full scene state with each query, allowing it to:
- Know exactly where the user is
- Remember where obstacles are
- Provide accurate next steps
- Confirm goal completion

### 4. **Step-by-Step Confirmation**
Each step waits for user confirmation before proceeding, ensuring safety and accuracy.

---

## Testing This Example

Open browser console when app is connected:

```javascript
// Run the complete example
console.log("Starting navigation example...");

// Step 1: Add box
console.log("1. Adding box at [3, 0]");
window.lumaNav.addObject('box', 3, 0, 'cardboard box');

// Step 2: Start navigation
console.log("2. Starting navigation");
window.lumaNav.start('get to the other side of the box');

// Wait for Gemini's first instruction, then:
console.log("3. Completing step 1 - move right");
window.lumaNav.updateStep([0, 2], 'moved 2 steps right');

// Wait for Gemini's second instruction, then:
console.log("4. Completing step 2 - move forward");
window.lumaNav.updateStep([4, 2], 'moved 4 steps forward');

// Wait for Gemini's third instruction, then:
console.log("5. Completing step 3 - move left");
window.lumaNav.updateStep([4, 0], 'moved 2 steps left');

// Wait for Gemini's confirmation, then:
console.log("6. Navigation complete!");
window.lumaNav.complete();
```

---

## Expected Console Output

```
[NAV] Navigation controls available at window.lumaNav
[NAV] Example usage:
  window.lumaNav.addObject('box', 3, 0, 'cardboard box')
  window.lumaNav.start('get to the other side of the room')
  window.lumaNav.updateStep([2, 0], 'moved 2 steps right')
  window.lumaNav.complete()

Starting navigation example...
1. Adding box at [3, 0]
[SCENE] Object "box" at [3, 0]

2. Starting navigation
[NAV] Starting navigation with goal: get to the other side of the box
[SCENE] Goal set: get to the other side of the box
[SEND] GenAILiveClient.send() called with scene context

3. Completing step 1 - move right
[NAV] Updating position to: [0, 2] after: moved 2 steps right
[SCENE] User moved to [0, 2] - moved 2 steps right
[SEND] GenAILiveClient.send() called with scene context

4. Completing step 2 - move forward
[NAV] Updating position to: [4, 2] after: moved 4 steps forward
[SCENE] User moved to [4, 2] - moved 4 steps forward
[SEND] GenAILiveClient.send() called with scene context

5. Completing step 3 - move left
[NAV] Updating position to: [4, 0] after: moved 2 steps left
[SCENE] User moved to [4, 0] - moved 2 steps left
[SEND] GenAILiveClient.send() called with scene context

6. Navigation complete!
[NAV] Navigation complete
```

---

## Integration with Real Systems

### Voice Commands
```typescript
// Detect "done" or "completed" from user speech
voiceRecognition.on('transcript', (text) => {
  if (text.includes('done') || text.includes('completed')) {
    // Estimate new position based on last instruction
    // (could use step counters, IMU sensors, etc.)
    const newPos = estimateNewPosition();
    window.lumaNav.updateStep(newPos, text);
  }
});
```

### Object Detection
```typescript
// Auto-detect objects from camera
objectDetector.on('objects', (detections) => {
  detections.forEach(obj => {
    const scenePos = convertCameraToScene(obj.bbox, obj.distance);
    window.lumaNav.addObject(obj.label, scenePos[0], scenePos[1], obj.label);
  });
});
```

### Sensor Fusion
```typescript
// Use device sensors for position tracking
IMU.on('step', (direction, distance) => {
  const currentPos = window.lumaNav.getScene().user;
  const newPos = calculateNewPosition(currentPos, direction, distance);
  window.lumaNav.updateStep(newPos, `walked ${distance}m ${direction}`);
});
```

---

This example demonstrates how scene memory enables multi-step navigation with persistent object awareness, allowing Gemini to guide users around obstacles even when those obstacles are no longer visible in the camera view.
