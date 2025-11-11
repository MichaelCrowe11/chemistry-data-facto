# Crowe Code Assets Directory

This directory contains all static assets used throughout the Crowe Code platform.

## Directory Structure

```
assets/
├── images/          # Image files (PNG, JPG, SVG, WebP)
├── video/           # Video files (MP4, WebM, OGG)
├── audio/           # Audio files (MP3, WAV, OGG)
├── documents/       # PDF guides, markdown docs
├── models/          # 3D models (GLTF, GLB, OBJ, FBX)
└── fonts/           # Custom font files (WOFF, WOFF2, TTF, OTF)
```

## Usage Guidelines

### Importing Assets

Always import assets explicitly rather than using string paths:

```typescript
// ✅ CORRECT
import logo from '@/assets/images/crowelogo.png'
<img src={logo} alt="Crowe Code" />

// ❌ WRONG
<img src="@/assets/images/crowelogo.png" alt="Crowe Code" />
```

### Using the Asset Manager

For dynamic asset loading, use the asset manager utility:

```typescript
import { getAssetUrl, preloadAssets } from '@/lib/asset-manager'

// Get a single asset
const logoUrl = await getAssetUrl('images', 'logo')

// Preload multiple assets
await preloadAssets([
  { category: 'images', name: 'logo' },
  { category: 'models', name: 'scene' },
])
```

## Asset Categories

### Images
- **Format**: PNG, JPG, SVG, WebP
- **Max Size**: 2MB recommended
- **Use Cases**: Logos, icons, UI elements, thumbnails

### Video
- **Format**: MP4 (H.264), WebM, OGG
- **Max Size**: 10MB recommended
- **Use Cases**: Tutorials, demos, AR/VR recordings

### Audio
- **Format**: MP3, WAV, OGG
- **Max Size**: 1MB recommended
- **Use Cases**: Voice commands, notifications, sound effects

### Documents
- **Format**: PDF, MD, TXT
- **Max Size**: 5MB recommended
- **Use Cases**: User guides, research papers, documentation

### 3D Models
- **Format**: GLTF, GLB, OBJ, FBX
- **Max Size**: 5MB recommended
- **Use Cases**: VR/AR scenes, 3D visualizations, holographic displays

### Fonts
- **Format**: WOFF, WOFF2, TTF, OTF
- **Max Size**: 500KB recommended
- **Use Cases**: Custom typography, branding

## Best Practices

1. **Optimize Before Upload**
   - Compress images with tools like TinyPNG or ImageOptim
   - Convert videos to web-optimized formats
   - Use GLTF/GLB for 3D models (better compression)

2. **Naming Conventions**
   - Use kebab-case: `my-asset-name.png`
   - Be descriptive: `vr-workspace-tutorial.mp4`
   - Include version if needed: `logo-v2.png`

3. **File Size Limits**
   - Keep assets under recommended limits
   - Use lazy loading for large assets
   - Implement progressive loading for videos

4. **Security**
   - Never commit sensitive data
   - Use environment variables for API keys
   - Validate file types on upload

## Asset Protection

The platform includes built-in asset protection features:

- **Checksum Validation**: All assets are validated for integrity
- **Secure Storage**: Assets are stored with encrypted metadata
- **Version Control**: Track asset changes and rollback if needed
- **Access Control**: Owner-only assets remain protected

## Adding New Assets

1. Place the file in the appropriate subdirectory
2. Update the asset registry in `src/lib/asset-manager.ts`
3. Import and use the asset in your components
4. Test on all target devices (desktop, mobile, VR)

## Performance Considerations

- **Lazy Load**: Use dynamic imports for large assets
- **Preload Critical**: Preload assets needed for initial render
- **CDN**: Consider using a CDN for production deployments
- **Caching**: Implement proper cache headers for static assets

## Supported Formats

| Category  | Formats                    | Notes                          |
|-----------|----------------------------|--------------------------------|
| Images    | PNG, JPG, SVG, WebP        | WebP preferred for photos      |
| Video     | MP4, WebM, OGG             | MP4 (H.264) for best support   |
| Audio     | MP3, WAV, OGG              | MP3 for compatibility          |
| Documents | PDF, MD, TXT               | MD for in-app rendering        |
| 3D Models | GLTF, GLB, OBJ, FBX        | GLB preferred (binary GLTF)    |
| Fonts     | WOFF, WOFF2, TTF, OTF      | WOFF2 for modern browsers      |

## Questions?

Refer to the main documentation or contact the platform owner.
