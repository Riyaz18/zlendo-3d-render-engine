# Zlendo 3D Native Render Engine

## Overview
A custom 3D rendering engine built with Three.js that dynamically parses architectural JSON data to construct a real-time interactive 3D scene.

## Key Features
- **Dynamic Geometric Construction**: Procedural generation of 3D walls and floors based on vertex-line-area hierarchy.
- **Automated Asset Mapping**: Logic to place 3D GLB models (Items & Holes) using coordinate translation and offset-based interpolation.
- **Smart Camera System**: Automatic scene centering based on the calculated bounding box of the layout.
- **Export Functionality**: Integrated high-quality PNG rendering via keyboard input.

## Technical Details
- **Math**: Used Trigonometry (atan2) for wall orientation and linear interpolation for door placement.
- **Graphics**: Utilized `MeshStandardMaterial` for realistic lighting response and `GLTFLoader` for asset management.

## How to Run
1. Serve the folder using a local server (e.g., VS Code Live Server).
2. Use Mouse to orbit, pan, and zoom.
3. **Press SPACE** to generate a high-quality rendered image.
