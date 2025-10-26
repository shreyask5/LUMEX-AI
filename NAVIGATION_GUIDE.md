# Multi-Step Navigation with Scene Memory - Guide

## Overview

This implementation adds multi-step navigation capabilities to the LumaAI visual assistant, enabling Gemini Live to guide users around obstacles even when those objects are no longer visible in the current camera view.

## Key Features

1. **Scene Memory**: Persistent storage of user position and detected objects
2. **Multi-Step Navigation**: Step-by-step guidance with position tracking
3. **Context-Aware Queries**: Gemini receives scene state with each query
4. **Navigation State Management**: Tracks active navigation sessions

## Architecture

### Components Modified

#### 1. **types.ts** - Type Definitions
New types added:
- `Position` - 2D coordinate [x, y]
- `SceneObject` - Detected object with name, position, description
- `SceneMemory` - Complete scene state with user position, objects, history
- `NavigationState` - Navigation session state

#### 2. **genai-live-client.ts** - Scene Memory Management
New properties:
- `sceneMemory` - Current scene state

New methods:
- `updateUserPosition(newPosition, action)` - Updates user position after each step
- `updateSceneObject(object)` - Adds/updates detected objects
- `setNavigationGoal(goal)` - Sets navigation destination
- `resetScene()` - Clears scene memory
- `getSceneContext()` - Generates scene context string for prompts
- `send(parts, turnComplete, includeSceneContext)` - Enhanced to include scene context

New events:
- `sceneupdate` - Emitted when scene memory changes

#### 3. **Altair.tsx** - Enhanced System Instructions
Added section 7 & 8 to system instructions:
- Multi-step navigation protocols
- Scene memory format and usage
- Step-by-step guidance patterns
- Example navigation workflows

#### 4. **ControlTray.tsx** - Navigation State Machine
New state:
- `navigationState` - Tracks active navigation

New functions:
- `startNavigation(goalDescription)` - Initiates multi-step navigation
- `updateNavigationStep(newPosition, action)` - Updates position after step completion
- `completeNavigation()` - Ends navigation session

Testing interface:
- `window.lumaNav.*` - Global API for testing navigation features

## How It Works

### Scene Memory System

The scene memory maintains:
```typescript
{
  user: [x, y],              // Current user position
  objects: [                  // Detected objects
    {
      name: "box",
      position: [x, y],
      description: "cardboard box",
      timestamp: 1234567890
    }
  ],
  goal: [target_x, target_y], // Optional target position
  goalDescription: "...",      // Description of goal
  history: [                   // Previous scene states
    {
      timestamp: 1234567890,
      user: [prev_x, prev_y],
      objects: [...],
      action: "moved 2 steps forward"
    }
  ]
}
```

### Navigation Flow

1. **Detection Phase**
   - User requests navigation (e.g., "Help me get past this box")
   - System detects objects via camera
   - Objects are stored in scene memory with positions

2. **Planning Phase**
   - Navigation goal is set
   - Scene context is generated
   - Gemini is queried WITH scene context for first step

3. **Execution Phase**
   - Gemini provides step-by-step instructions
   - User completes each step
   - System updates user position
   - Gemini is queried again with UPDATED scene context
   - Process repeats until goal is reached

4. **Completion**
   - Goal is reached
   - Navigation session ends
   - Scene memory is retained for reference

### Scene Context Format

When `includeSceneContext = true`, queries to Gemini include:

```
--- SCENE MEMORY ---
User Position: [0, 0]

Detected Objects:
- box at [3, 0] (relative: [3, 0]) - cardboard box
- chair at [5, 2] (relative: [5, 2]) - office chair

Navigation Goal: get to the other side of the room
--- END SCENE MEMORY ---

[User's actual query]
```

This allows Gemini to:
- Remember objects even when they're out of view
- Calculate positions relative to current user location
- Provide accurate step-by-step guidance
- Track progress toward goal

## Example Workflows

### Example 1: Simple Obstacle Avoidance

**User Input (voice):** "There is a box in front of me. Help me get to the other side."

**System Flow:**

```javascript
// 1. Detect object from camera
window.lumaNav.addObject('box', 3, 0, 'cardboard box');

// 2. Start navigation
window.lumaNav.start('get to the other side');
```

**Gemini Response 1 (with scene context):**
> "I can see a cardboard box approximately 3 feet directly ahead of you. I'll guide you around it.
>
> **Step 1:** Take 2 steps to your right."

**User Action:** Completes step

```javascript
// 3. Update position after step
window.lumaNav.updateStep([0, 2], 'moved 2 steps right');
```

**Gemini Response 2 (with UPDATED scene context):**
> "Good. You've moved to the right of the box.
>
> **Step 2:** Take 4 steps forward."

**User Action:** Completes step

```javascript
// 4. Update position
window.lumaNav.updateStep([4, 2], 'moved 4 steps forward');
```

**Gemini Response 3:**
> "Excellent. You're now past the box.
>
> **Step 3:** Take 2 steps to your left to return to center."

**User Action:** Completes step

```javascript
// 5. Update position
window.lumaNav.updateStep([4, 0], 'moved 2 steps left');
```

**Gemini Response 4:**
> "Perfect! You have successfully navigated around the box and reached the other side."

```javascript
// 6. Complete navigation
window.lumaNav.complete();
```

### Example 2: Multiple Obstacles

**Scenario:** Navigate through a room with multiple objects

```javascript
// Add multiple objects
window.lumaNav.addObject('table', 5, 0, 'dining table');
window.lumaNav.addObject('chair', 3, -2, 'wooden chair');
window.lumaNav.addObject('plant', 7, 3, 'potted plant');

// Start navigation
window.lumaNav.start('reach the door on the far side');
```

Gemini will provide multi-step navigation around ALL detected objects, even as they move out of camera view.

### Example 3: Real-World Usage (Voice-Activated)

In production, navigation would be triggered by voice:

**User (speaking):** "I need to find my way to the kitchen"

**System:**
1. Activates navigation mode
2. Continuously detects objects via camera
3. Updates scene memory as objects are detected
4. Provides step-by-step voice guidance
5. Updates user position after each confirmed step
6. Continues until goal is reached

## Testing the Implementation

### Browser Console Testing

Once the app is running and connected:

```javascript
// Check scene memory
window.lumaNav.getScene();

// Add a test object at position [3, 0] (3 units ahead)
window.lumaNav.addObject('box', 3, 0, 'test obstacle');

// Start navigation
window.lumaNav.start('navigate around the box');

// After Gemini gives first instruction and you complete it:
window.lumaNav.updateStep([0, 2], 'moved 2 steps right');

// Continue following instructions and updating position...

// Complete navigation
window.lumaNav.complete();

// Reset scene for new test
window.lumaNav.resetScene();
```

### Available Console Commands

```javascript
window.lumaNav = {
  // Start navigation with goal description
  start: (goalDescription: string) => void

  // Update position after completing a step
  updateStep: (newPosition: [x, y], action: string) => void

  // Complete navigation session
  complete: () => void

  // Add detected object to scene
  addObject: (name: string, x: number, y: number, description?: string) => void

  // Reset scene memory
  resetScene: () => void

  // Get current scene state
  getScene: () => SceneMemory
}
```

## Integration Points

### Voice Command Integration (Future)

To integrate with voice commands:

```typescript
// In ControlTray or custom component
useEffect(() => {
  const handleVoiceCommand = (transcript: string) => {
    // Detect navigation intent
    if (transcript.includes('help me get') ||
        transcript.includes('navigate to') ||
        transcript.includes('guide me')) {

      // Extract goal from transcript
      const goal = extractGoal(transcript);

      // Start navigation
      startNavigation(goal);
    }

    // Detect step completion
    if (transcript.includes('done') ||
        transcript.includes('completed')) {

      // Estimate new position (could use sensor data)
      const newPosition = estimatePosition();

      // Update navigation
      updateNavigationStep(newPosition, 'completed step');
    }
  };

  // Subscribe to voice recognition
  voiceRecognition.on('transcript', handleVoiceCommand);
}, []);
```

### Object Detection Integration (Future)

To auto-populate scene memory from camera:

```typescript
useEffect(() => {
  const handleObjectDetection = (detections: Detection[]) => {
    detections.forEach(det => {
      // Convert detection to scene coordinates
      const position = convertToSceneCoords(det.bbox, userPosition);

      // Update scene memory
      client.updateSceneObject({
        name: det.label,
        position: position,
        description: det.confidence > 0.9 ? det.label : `possible ${det.label}`
      });
    });
  };

  // Run object detection on video frames
  objectDetector.on('detections', handleObjectDetection);
}, []);
```

## Technical Details

### Coordinate System

- User starts at origin `[0, 0]`
- Positive X = forward direction
- Positive Y = right direction
- Positions are in "steps" or "feet" (configurable unit)

Example:
```
    Y (Right)
    |
[0, 2] ------ [3, 2]
    |            |
    |   box at   |
    |   [3, 0]   |
    |            |
[0, 0] ------ [3, 0] ---- X (Forward)
 user         box
 start
```

### Event Flow

```
User Action → updateUserPosition() → scene.history.push()
                                   ↓
                            emit('sceneupdate')
                                   ↓
                         ControlTray state updates
                                   ↓
                         client.send(..., includeSceneContext=true)
                                   ↓
                         Gemini receives full context
                                   ↓
                         Gemini provides next instruction
```

### Message Flow

**Without Navigation:**
```
Periodic Timer → send([{ text: "Talk about surrounding" }], true, false)
                 ↓
              Gemini (no scene context)
```

**With Navigation:**
```
Navigation Step → send([{ text: "What's next?" }], true, true)
                  ↓
               getSceneContext() generates:
               --- SCENE MEMORY ---
               ...
               --- END SCENE MEMORY ---
                  ↓
               Gemini (with full scene awareness)
```

## Best Practices

1. **Always update position after each step**
   - Ensures accurate scene state
   - Enables Gemini to track progress

2. **Include descriptive actions**
   - Helps with history tracking
   - Useful for debugging

3. **Reset scene when starting new session**
   - Prevents confusion from old data
   - Ensures clean state

4. **Validate positions**
   - Check for reasonable coordinates
   - Handle edge cases (negative positions, etc.)

5. **Provide clear goal descriptions**
   - Helps Gemini understand intent
   - Enables better guidance

## Debugging

### Check Scene State
```javascript
console.log(window.lumaNav.getScene());
```

### Monitor Scene Updates
```javascript
client.on('sceneupdate', (scene) => {
  console.log('[SCENE UPDATE]', scene);
});
```

### View Navigation Logs
Check browser console for `[NAV]` prefixed logs:
- `[NAV] Starting navigation with goal: ...`
- `[NAV] Updating position to: ...`
- `[NAV] Navigation complete`

### View Scene Logs
Check browser console for `[SCENE]` prefixed logs from GenAILiveClient:
- `scene.userUpdate`
- `scene.objectUpdate`
- `scene.goalSet`
- `scene.reset`

## Limitations & Future Enhancements

### Current Limitations
1. Manual position updates (no automatic sensor integration)
2. Console-based testing interface (no UI)
3. 2D coordinate system (no elevation tracking)
4. Manual object detection (no automatic CV integration)

### Future Enhancements
1. **Sensor Integration**: Use device sensors for automatic position tracking
2. **Computer Vision**: Automatic object detection and scene mapping
3. **3D Coordinates**: Track elevation for stairs, ramps, etc.
4. **Voice Commands**: Natural language navigation control
5. **UI Dashboard**: Visual representation of scene memory
6. **Path Planning**: Pre-calculate optimal routes
7. **Obstacle Prediction**: Anticipate moving obstacles
8. **Semantic Mapping**: Build persistent map of environment

## Conclusion

This implementation provides a solid foundation for multi-step navigation with scene memory. The system can track user position, remember object locations, and provide context-aware guidance through Gemini Live, enabling navigation around obstacles even when they're no longer visible.

The modular design allows for easy integration with voice commands, object detection, and sensor systems for a complete autonomous navigation solution.
