# Lumex AI

> An intelligent visual assistance system powered by Google's Gemini Live API, designed to help blind and visually impaired users navigate their environment with multi-step guidance and persistent scene memory.

![Lumex AI](https://img.shields.io/badge/Gemini-2.0%20Flash-blue)
![React](https://img.shields.io/badge/React-18.3.1-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6.3-3178c6)

---

## 🌟 Overview

Lumex AI is a real-time visual assistance application that combines computer vision, voice interaction, and AI to provide comprehensive environmental awareness and navigation guidance. Built on Google's Gemini 2.0 Flash API with multimodal live capabilities, Lumex AI offers step-by-step navigation around obstacles, even when they're no longer visible in the camera view.

### Key Capabilities

- **Real-time Visual Analysis**: Continuous environmental scanning and object detection
- **Scene Memory System**: Persistent tracking of user position and detected objects
- **Multi-Step Navigation**: Step-by-step guidance around obstacles with position tracking
- **Voice Interaction**: Natural language communication with AI assistant
- **Spatial Awareness**: Clock-position based directional guidance
- **Safety First**: Immediate hazard warnings and safety-critical information

---

## ✨ Features

### 🎯 Core Features

- **Live Video Processing**: Real-time camera feed analysis at 0.5 FPS
- **Audio Streaming**: Bidirectional audio communication with Gemini Live
- **Multimodal AI**: Combines visual, audio, and contextual information
- **Scene Memory**: Remembers object positions even when out of view
- **Navigation Guidance**: Step-by-step instructions to reach destinations
- **Position Tracking**: Maintains user location through environment
- **History Logging**: Complete movement and interaction history

### 🚀 Advanced Capabilities

- **Context-Aware Queries**: AI receives full scene state for accurate guidance
- **Relative Position Calculation**: Automatic spatial relationship tracking
- **Goal-Based Navigation**: Define destinations and receive optimal routing
- **Persistent Object Memory**: Objects tracked throughout session
- **Event-Based Architecture**: Efficient real-time updates
- **Testing Interface**: Browser console API for development

---

## 🏗️ Architecture

### Technology Stack

```
Frontend:        React 18.3.1 + TypeScript 5.6.3
AI Engine:       Google Gemini 2.0 Flash (Live API)
State:           Zustand + React Context
Audio:           Web Audio API + AudioWorklets
Video:           MediaDevices API (getUserMedia)
Events:          EventEmitter3
Styling:         SCSS
```

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    React Application                     │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Altair     │  │  ControlTray │  │    Logger     │  │
│  │ (Config)    │  │  (Controls)  │  │  (Messages)   │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└─────────────────────┬────────────────────────────────────┘
                      │
                      ↓
         ┌────────────────────────┐
         │   LiveAPIContext       │
         │   (State Management)   │
         └────────┬───────────────┘
                  │
                  ↓
    ┌─────────────────────────────┐
    │   GenAILiveClient           │
    │   • Scene Memory            │
    │   • Position Tracking       │
    │   • Navigation Logic        │
    └────────┬────────────────────┘
             │
             ↓
    ┌──────────────────────┐
    │  Google Gemini Live  │
    │  • Vision Analysis   │
    │  • Voice Response    │
    │  • Navigation AI     │
    └──────────────────────┘
```

### Scene Memory System

```typescript
SceneMemory {
  user: [x, y]              // Current position
  objects: [                // Detected objects
    { name, position, description, timestamp }
  ]
  goal: [x, y]              // Navigation target
  goalDescription: string   // Goal description
  history: [                // Movement history
    { timestamp, user, objects, action }
  ]
}
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Google Gemini API key ([Get one here](https://ai.google.dev))
- Modern web browser with camera/microphone access
- HTTPS connection (required for media access)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LumaAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API key**

   Create a `.env` file in the root directory:
   ```env
   REACT_APP_GEMINI_API_KEY=your_api_key_here
   ```

4. **Start the application**
   ```bash
   npm start
   ```

   For HTTPS (recommended):
   ```bash
   npm run start-https
   ```

5. **Open in browser**
   ```
   https://localhost:3000
   ```

   Grant camera and microphone permissions when prompted.

---

## 📖 Usage

### Basic Operation

1. **Launch the app** - Camera and API connection start automatically
2. **Wait for connection** - Look for "Connected - Visual Assistance Active"
3. **Start speaking** - Ask questions or request assistance
4. **Receive guidance** - Gemini provides audio responses with visual context

### Navigation Mode

Use the browser console (F12) to test navigation features:

```javascript
// Add an obstacle to scene memory
window.lumaNav.addObject('box', 3, 0, 'cardboard box');

// Start navigation with a goal
window.lumaNav.start('get to the other side of the box');

// After completing each step Gemini instructs
window.lumaNav.updateStep([0, 2], 'moved 2 steps right');
window.lumaNav.updateStep([4, 2], 'moved 4 steps forward');
window.lumaNav.updateStep([4, 0], 'moved 2 steps left');

// Complete navigation
window.lumaNav.complete();
```

### Example Scenarios

**Object Identification**
> User: "What's in front of me?"
> Lumex: "I see a wooden table approximately 5 feet ahead at your 12 o'clock position."

**Navigation Assistance**
> User: "Help me get around this chair"
> Lumex: "I can see the chair 3 feet ahead. Take 2 steps to your right, then 4 steps forward..."

**Safety Warnings**
> User: "Can I walk forward?"
> Lumex: "Caution! There are stairs descending about 6 feet directly ahead. Stop and use the handrail on your right."

---

## 🎮 API Reference

### `window.lumaNav` Console API

The global testing interface available when connected:

#### Methods

**`addObject(name, x, y, description?)`**
```javascript
// Add an object to scene memory
window.lumaNav.addObject('chair', 5, 2, 'office chair');
```

**`start(goalDescription)`**
```javascript
// Begin navigation session
window.lumaNav.start('reach the door on the far side');
```

**`updateStep(position, action)`**
```javascript
// Update position after completing a step
window.lumaNav.updateStep([2, 1], 'moved 2 steps forward and 1 step right');
```

**`complete()`**
```javascript
// End navigation session
window.lumaNav.complete();
```

**`getScene()`**
```javascript
// View current scene state
console.log(window.lumaNav.getScene());
```

**`resetScene()`**
```javascript
// Clear scene memory
window.lumaNav.resetScene();
```

### Coordinate System

- Origin: User starts at `[0, 0]`
- X-axis: Forward (+) / Backward (-)
- Y-axis: Right (+) / Left (-)
- Units: Steps or feet (configurable)

```
         Y (Right) →
         │
         │  [0, 2]
         │
[0, 0] ──┼────────── X (Forward) →
  User   │
         │  [0, -2]
```

---

## 📚 Documentation

### Quick Reference
- **[SCENE_NAVIGATION_README.md](./SCENE_NAVIGATION_README.md)** - Quick start for navigation features
- **[EXAMPLE_NAVIGATION.md](./EXAMPLE_NAVIGATION.md)** - Step-by-step navigation example

### Technical Docs
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Complete implementation details
- **[NAVIGATION_GUIDE.md](./NAVIGATION_GUIDE.md)** - Developer guide and API reference

---

## 🛠️ Configuration

### System Instructions

Customize AI behavior in `src/components/altair/Altair.tsx`:

```typescript
systemInstruction: {
  parts: [{
    text: `You are an AI visual assistant designed to help...`
  }]
}
```

### Voice Configuration

Change voice model in `Altair.tsx`:

```typescript
speechConfig: {
  voiceConfig: {
    prebuiltVoiceConfig: {
      voiceName: "Aoede"  // Options: Aoede, Charon, Fenrir, Kore, Puck
    }
  }
}
```

### Response Modality

Toggle between audio, text, or both:

```typescript
responseModalities: [Modality.AUDIO]  // or Modality.TEXT
```

---

## 🧪 Development

### Project Structure

```
LumaAI/
├── src/
│   ├── components/
│   │   ├── altair/              # System configuration
│   │   ├── control-tray/        # Main controls & navigation
│   │   ├── logger/              # Message display
│   │   ├── audio-pulse/         # Visual audio indicator
│   │   └── settings-dialog/     # Settings UI
│   ├── contexts/
│   │   └── LiveAPIContext.tsx   # React Context provider
│   ├── hooks/
│   │   ├── use-live-api.ts      # Main API hook
│   │   ├── use-webcam.ts        # Camera access
│   │   └── use-media-stream-mux.ts
│   ├── lib/
│   │   ├── genai-live-client.ts # Core client & scene memory
│   │   ├── audio-recorder.ts    # Audio capture
│   │   ├── audio-streamer.ts    # Audio playback
│   │   └── store-logger.ts      # Logging state
│   └── types.ts                 # TypeScript definitions
├── public/
├── .env                         # Environment variables
└── package.json
```

### Key Files

**Scene Memory Implementation**
- `src/lib/genai-live-client.ts` - Core scene memory logic
- `src/types.ts` - Scene memory type definitions

**Navigation State Machine**
- `src/components/control-tray/ControlTray.tsx` - Navigation controller

**AI Configuration**
- `src/components/altair/Altair.tsx` - System instructions

### Build Commands

```bash
# Development server
npm start

# HTTPS development server (recommended)
npm run start-https

# Production build
npm run build

# Run tests
npm test
```

### Debug Logging

Console logs are prefixed for easy filtering:

- `[NAV]` - Navigation events
- `[SCENE]` - Scene memory updates
- `[SEND]` - API queries
- `[PERIODIC]` - Periodic message sender

Example:
```javascript
// Filter console by prefix
console.log.apply(console, arguments.filter(arg =>
  typeof arg === 'string' && arg.startsWith('[NAV]')
));
```

---

## 🎯 Use Cases

### For Blind/Visually Impaired Users

- **Indoor Navigation**: Navigate through rooms, around furniture
- **Obstacle Detection**: Real-time warnings about obstacles in path
- **Object Identification**: Identify items, read labels, find objects
- **Spatial Orientation**: Understand room layout and surroundings
- **Safe Movement**: Step-by-step guidance to destinations

### For Developers

- **Accessibility Research**: Study and improve accessibility tech
- **Computer Vision**: Integrate custom object detection models
- **AI Applications**: Build on Gemini Live API capabilities
- **Educational Tool**: Learn multimodal AI implementation
- **Prototype Base**: Foundation for advanced assistance systems

---

## 🔧 Customization

### Adding Object Detection

Integrate with computer vision libraries:

```typescript
import * as cocoSsd from '@tensorflow-models/coco-ssd';

// Detect objects from video frames
const detectObjects = async (videoElement) => {
  const model = await cocoSsd.load();
  const predictions = await model.detect(videoElement);

  predictions.forEach(pred => {
    const position = estimatePosition(pred.bbox);
    client.updateSceneObject({
      name: pred.class,
      position: position,
      description: `${pred.class} (${Math.round(pred.score * 100)}% confidence)`
    });
  });
};
```

### Adding Voice Commands

Implement speech recognition:

```typescript
const recognition = new webkitSpeechRecognition();

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;

  if (transcript.includes('navigate to')) {
    const goal = extractGoal(transcript);
    window.lumaNav.start(goal);
  }
};

recognition.start();
```

### Adding Sensor Integration

Use device sensors for position tracking:

```typescript
window.addEventListener('devicemotion', (event) => {
  const acceleration = event.accelerationIncludingGravity;

  // Calculate movement from accelerometer
  const movement = calculateMovement(acceleration);

  if (movement.steps > 0) {
    const currentPos = client.sceneMemory.user;
    const newPos = updatePosition(currentPos, movement);
    client.updateUserPosition(newPos, `walked ${movement.steps} steps`);
  }
});
```

---

## 🔐 Privacy & Security

### Data Handling

- **Camera/Mic Access**: Required, processed locally before transmission
- **API Communication**: Encrypted via HTTPS/WSS
- **No Storage**: Video/audio not stored permanently
- **Session-Based**: Scene memory cleared on disconnect

### Best Practices

- Use HTTPS in production
- Secure API keys (never commit to git)
- Implement user consent for media access
- Add rate limiting for API calls
- Validate all user inputs

### Environment Variables

Never commit `.env` files. Use `.env.example`:

```env
# .env.example
REACT_APP_GEMINI_API_KEY=your_api_key_here
```

---

## 🐛 Troubleshooting

### Common Issues

**"Camera not accessible"**
- Ensure HTTPS is enabled (`npm run start-https`)
- Check browser permissions
- Verify camera is not in use by another app

**"API key invalid"**
- Verify `.env` file exists with correct key
- Restart development server after adding key
- Check API key is activated in Google AI Studio

**"No audio response"**
- Check volume/mute settings
- Verify audio output device is selected
- Check browser audio permissions

**"Navigation not working"**
- Ensure connection is established first
- Check console for error messages
- Verify `window.lumaNav` is defined

### Debug Mode

Enable verbose logging:

```javascript
// In browser console
localStorage.setItem('lumex-debug', 'true');
location.reload();
```

---

## 🤝 Contributing

Contributions are welcome! Areas for enhancement:

- **Computer Vision**: Integrate object detection models
- **Voice Control**: Natural language navigation commands
- **UI/UX**: Visual interface for navigation
- **Sensors**: IMU/GPS integration for outdoor use
- **Accessibility**: Additional accessibility features
- **Documentation**: Tutorials, examples, translations

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is based on Google's Multimodal Live API Web Console, licensed under the Apache License 2.0.

```
Copyright 2024 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

---

## 🙏 Acknowledgments

- **Google AI** - Gemini 2.0 Flash Live API
- **React Team** - React framework
- **TypeScript** - Type safety and developer experience
- **Open Source Community** - Various libraries and tools

---

## 📞 Support

- **Documentation**: See `/docs` directory for detailed guides
- **Issues**: Report bugs or request features via GitHub Issues
- **Discussions**: Join community discussions for help and ideas

---

## 🗺️ Roadmap

### Version 1.0 (Current)
- ✅ Real-time visual analysis
- ✅ Voice interaction
- ✅ Scene memory system
- ✅ Multi-step navigation
- ✅ Console testing API

### Version 1.1 (Planned)
- ⏳ Voice command recognition
- ⏳ Automatic object detection (TensorFlow.js)
- ⏳ UI controls for navigation
- ⏳ Position history visualization
- ⏳ Export navigation logs

### Version 2.0 (Future)
- 🔮 3D position tracking
- 🔮 Outdoor navigation (GPS)
- 🔮 Semantic room mapping
- 🔮 Multi-room navigation
- 🔮 Obstacle prediction
- 🔮 Mobile app version

---

## 📊 Technical Specifications

- **Video Processing**: 0.5 FPS, 25% scale, JPEG compression
- **Audio Input**: 16kHz PCM, mono
- **Audio Output**: PCM16, streamed via Web Audio API
- **API Model**: Gemini 2.0 Flash Experimental
- **Response Modality**: Audio (configurable)
- **WebSocket**: Persistent bidirectional connection

---

## 🌐 Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Firefox | 88+ | ⚠️ Limited |
| Opera | 76+ | ✅ Full |

Note: HTTPS required for all browsers

---

<div align="center">

**Lumex AI** - Empowering independence through AI-powered visual assistance

Made with ❤️ using Google Gemini Live API

[Documentation](./NAVIGATION_GUIDE.md) • [Examples](./EXAMPLE_NAVIGATION.md) • [API Reference](./IMPLEMENTATION_SUMMARY.md)

</div>
