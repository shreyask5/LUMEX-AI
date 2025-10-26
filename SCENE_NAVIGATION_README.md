# Scene Memory & Multi-Step Navigation - Quick Start

## 🎯 What Was Implemented

Multi-step navigation system that allows Gemini Live to guide users around obstacles by maintaining scene memory, even when objects are no longer visible in the camera view.

---

## 🚀 Quick Start

### 1. Run the Application
```bash
npm start
```

### 2. Wait for Connection
The app will automatically:
- Start the webcam
- Connect to Gemini Live API
- Display "Connected - Visual Assistance Active"

### 3. Test Navigation (Browser Console)

Open the browser console (F12) and use the global `window.lumaNav` API:

```javascript
// Example: Navigate around a box

// Step 1: Add an obstacle
window.lumaNav.addObject('box', 3, 0, 'cardboard box');

// Step 2: Start navigation
window.lumaNav.start('get to the other side of the box');

// Step 3: After Gemini gives you an instruction (e.g., "move 2 steps right")
window.lumaNav.updateStep([0, 2], 'moved 2 steps right');

// Step 4: Continue following Gemini's instructions and updating position
window.lumaNav.updateStep([4, 2], 'moved 4 steps forward');
window.lumaNav.updateStep([4, 0], 'moved 2 steps left');

// Step 5: Complete when goal is reached
window.lumaNav.complete();
```

---

## 📋 Available Commands

### `window.lumaNav` API

```javascript
// Add an object to scene memory
window.lumaNav.addObject(name, x, y, description?)
// Example: window.lumaNav.addObject('chair', 5, 2, 'wooden chair')

// Start navigation with a goal
window.lumaNav.start(goalDescription)
// Example: window.lumaNav.start('reach the door')

// Update position after completing a step
window.lumaNav.updateStep([x, y], action)
// Example: window.lumaNav.updateStep([2, 0], 'moved forward 2 steps')

// Complete navigation
window.lumaNav.complete()

// View current scene state
window.lumaNav.getScene()

// Reset scene memory
window.lumaNav.resetScene()
```

---

## 🔧 How It Works

### Coordinate System
- User starts at `[0, 0]`
- `X` axis = forward/backward (positive = forward)
- `Y` axis = left/right (positive = right)
- Units = steps or feet

### Scene Memory Structure
```javascript
{
  user: [0, 0],           // Current position
  objects: [
    {
      name: 'box',
      position: [3, 0],   // Absolute position
      description: 'cardboard box',
      timestamp: 1234567890
    }
  ],
  goalDescription: 'get to the other side',
  history: [...]          // Previous positions
}
```

### Navigation Flow
```
1. User requests navigation
   ↓
2. Objects detected/added to scene
   ↓
3. Gemini receives scene context
   ↓
4. Gemini provides step-by-step guidance
   ↓
5. User completes step
   ↓
6. Position updated
   ↓
7. Gemini receives UPDATED scene context
   ↓
8. Repeat until goal reached
```

---

## 📖 Documentation Files

- **IMPLEMENTATION_SUMMARY.md** - Complete list of all changes made
- **NAVIGATION_GUIDE.md** - Comprehensive developer guide
- **EXAMPLE_NAVIGATION.md** - Detailed step-by-step example

---

## 🔍 Key Features

✅ **Scene Memory**
- Stores user position and object positions
- Maintains history of all movements
- Persists even when objects leave camera view

✅ **Multi-Step Navigation**
- Step-by-step guidance from Gemini
- Position tracking after each step
- Context-aware queries with scene state

✅ **Smart Context**
- Automatic scene context generation
- Relative position calculations
- Only included when navigation is active

✅ **Testing Interface**
- Browser console API for testing
- Manual position updates
- Scene inspection tools

---

## 📝 Example Scenario

**Goal:** Navigate around a box to reach the other side

```javascript
// Initial state: User at [0, 0]
window.lumaNav.addObject('box', 3, 0, 'cardboard box');
window.lumaNav.start('get to the other side');
```

**Gemini:** "I see a box 3 feet ahead. Take 2 steps to your right."

```javascript
// User moved right
window.lumaNav.updateStep([0, 2], 'moved right');
```

**Gemini:** "Good! Now take 4 steps forward."

```javascript
// User moved forward
window.lumaNav.updateStep([4, 2], 'moved forward');
```

**Gemini:** "You've passed the box. Take 2 steps to your left."

```javascript
// User moved left
window.lumaNav.updateStep([4, 0], 'moved left');
```

**Gemini:** "Perfect! You've reached the other side."

```javascript
window.lumaNav.complete();
```

---

## 🎨 Visual Diagram

```
Start:           After Right:     After Forward:    Goal Reached:

Y→               Y→               Y→                Y→
│                │                │                 │
│ 🧑[0,0]        │ 🧑[0,2]        │ 🧑[4,2]         │
│                │                │                 │
└──X             └──X             │                 │ 🧑[4,0]
   📦[3,0]          📦[3,0]       └──X              └──X
                                     📦[3,0]           📦[3,0]
                                                      (behind)
```

---

## 🐛 Debugging

### View Scene State
```javascript
console.log(window.lumaNav.getScene());
```

### Check Console Logs
Look for these prefixes:
- `[NAV]` - Navigation events
- `[SCENE]` - Scene memory updates
- `[SEND]` - Queries sent to Gemini

### Common Issues

**Issue:** `window.lumaNav is undefined`
- **Solution:** Wait for "Connected - Visual Assistance Active" message

**Issue:** Navigation not working
- **Solution:** Check console for errors, ensure connection is active

**Issue:** Scene memory not updating
- **Solution:** Check that objects are added with valid coordinates

---

## 🔗 Integration Points

### Future Enhancements

**Voice Commands**
```typescript
// Detect voice commands to control navigation
voiceRecognition.on('transcript', (text) => {
  if (text.includes('navigate')) {
    window.lumaNav.start(extractGoal(text));
  }
});
```

**Object Detection**
```typescript
// Auto-detect objects from camera
objectDetector.on('objects', (objects) => {
  objects.forEach(obj => {
    window.lumaNav.addObject(obj.name, obj.x, obj.y, obj.label);
  });
});
```

**Sensor Integration**
```typescript
// Use device sensors for position tracking
IMU.on('step', (direction, distance) => {
  const newPos = calculatePosition(direction, distance);
  window.lumaNav.updateStep(newPos, `walked ${distance}`);
});
```

---

## 📚 Files Modified

### Core Implementation
- `src/types.ts` - Type definitions for scene memory
- `src/lib/genai-live-client.ts` - Scene memory management
- `src/components/altair/Altair.tsx` - Enhanced system instructions
- `src/components/control-tray/ControlTray.tsx` - Navigation state machine

### Documentation
- `IMPLEMENTATION_SUMMARY.md` - Complete change summary
- `NAVIGATION_GUIDE.md` - Developer guide
- `EXAMPLE_NAVIGATION.md` - Step-by-step example
- `SCENE_NAVIGATION_README.md` - This file

---

## ✨ Key Code Locations

### Scene Memory Management
**File:** `src/lib/genai-live-client.ts`
- `updateUserPosition()` - Line 315
- `updateSceneObject()` - Line 336
- `setNavigationGoal()` - Line 364
- `getSceneContext()` - Line 393

### Navigation Control
**File:** `src/components/control-tray/ControlTray.tsx`
- `startNavigation()` - Line 236
- `updateNavigationStep()` - Line 261
- `completeNavigation()` - Line 275
- `window.lumaNav` API - Line 291

### System Instructions
**File:** `src/components/altair/Altair.tsx`
- Multi-step navigation instructions - Line 74
- Scene memory format - Line 98

---

## 🎯 Requirements Met

✅ Scene object maintains user position and object positions externally
✅ Logic to update user position after each step
✅ Gemini Live queries include scene state in context
✅ Multi-step navigation works end-to-end
✅ Objects tracked even when not visible
✅ Example workflow provided and documented
✅ Clear comments explaining how everything works

---

## 🚀 Next Steps

1. **Test the implementation**
   - Run the app: `npm start`
   - Open console: Press F12
   - Try the example commands above

2. **Read the documentation**
   - Start with EXAMPLE_NAVIGATION.md for a walkthrough
   - Check NAVIGATION_GUIDE.md for technical details
   - Review IMPLEMENTATION_SUMMARY.md for all changes

3. **Integrate with your systems**
   - Add voice command detection
   - Implement object detection
   - Connect sensor systems

4. **Customize as needed**
   - Adjust coordinate system units
   - Add validation logic
   - Enhance UI/UX

---

## 💡 Tips

- **Start simple**: Test with one object first
- **Use console**: `window.lumaNav.getScene()` is your friend
- **Check logs**: Console logs show what's happening
- **Read responses**: Gemini provides step-by-step guidance
- **Be patient**: Wait for responses before next step

---

## 📞 Support

For issues or questions:
1. Check console logs for error messages
2. Review NAVIGATION_GUIDE.md for troubleshooting
3. Verify connection to Gemini Live API
4. Ensure objects are added before navigation starts

---

**Implementation Complete!** 🎉

The multi-step navigation system with scene memory is fully integrated and ready to use. Follow the Quick Start guide above to begin testing.
