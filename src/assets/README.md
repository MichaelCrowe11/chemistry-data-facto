# Crowe Code Assets Directory

This directory contains all static assets used in the Crowe Code platform. Assets are organized by type for easy management and retrieval.

## Directory Structure

```
assets/
├── images/          # PNG, JPG, SVG, WebP graphics and icons
├── video/           # MP4, WebM video tutorials and demos
├── audio/           # MP3, WAV, OGG sound effects and music
├── documents/       # PDF, MD, TXT research papers and documentation
├── models/          # GLB, GLTF, OBJ 3D models for visualization
└── fonts/           # TTF, WOFF, WOFF2 custom typefaces
```

## Usage Guidelines

### Importing Assets

Always import assets explicitly in your TypeScript/React files:

```typescript
// ✅ CORRECT - Import assets explicitly
import myLogo from '@/assets/images/crowelogo.png'
import myModel from '@/assets/models/molecule.glb'
import myVideo from '@/assets/video/tutorial.mp4'

// Then use in JSX
<img src={myLogo} alt="Logo" />
<video src={myVideo} />
```

```typescript
// ❌ WRONG - Don't use string paths
<img src="@/assets/images/crowelogo.png" />
```

### Asset Categories

1. **Images** (`/images/`)
   - Logos, icons, UI graphics
   - Supported: PNG, JPG, SVG, WebP
   - Use cases: Branding, UI elements, diagrams

2. **Videos** (`/video/`)
   - Tutorial videos, feature demos
   - Supported: MP4, WebM
   - Use cases: Onboarding, help system, feature showcases

3. **Audio** (`/audio/`)
   - Sound effects, notification sounds
   - Supported: MP3, WAV, OGG
   - Use cases: UI feedback, notifications, voice samples

4. **Documents** (`/documents/`)
   - Research papers, documentation, guides
   - Supported: PDF, MD, TXT
   - Use cases: Help documentation, research references

5. **3D Models** (`/models/`)
   - 3D visualization assets
   - Supported: GLB, GLTF, OBJ
   - Use cases: Molecular structures, code visualizations, VR/AR content

6. **Fonts** (`/fonts/`)
   - Custom typefaces
   - Supported: TTF, WOFF, WOFF2
   - Use cases: Custom branding, specialized code fonts

## Asset Protection

The Asset Manager provides built-in protection features:

- **Protected Assets**: Mark critical assets as protected to prevent accidental deletion
- **Tagging System**: Organize assets with tags for easy searching and filtering
- **Metadata**: Add descriptions and custom metadata to assets
- **Version Control**: Track asset versions and changes
- **Search**: Full-text search across names, tags, and descriptions

### Protecting an Asset

```typescript
import { assetManager } from '@/lib/asset-manager'

// Mark an asset as protected
assetManager.updateAsset('asset-id', {
  protected: true,
  tags: ['logo', 'branding', 'critical'],
  description: 'Main Crowe Code logo - do not delete'
})
```

## Best Practices

### File Naming
- Use lowercase with hyphens: `crowe-logo.png`, `tutorial-intro.mp4`
- Be descriptive: `molecule-structure-3d.glb` instead of `model1.glb`
- Include version if needed: `logo-v2.png`

### Organization
- Group related assets in subdirectories when needed
- Use consistent naming conventions within categories
- Document any special requirements in asset metadata

### Optimization
- Compress images before adding (use WebP when possible)
- Keep video files under 10MB when possible
- Use appropriate quality settings for your use case

### Security
- Never commit sensitive documents
- Mark proprietary assets as protected
- Use appropriate file permissions

## Asset Management Features

Access the Asset Manager from the toolbar (folder icon) to:

- **Browse** all assets by category
- **Search** across all asset metadata
- **Tag** assets for organization
- **Protect** critical assets from deletion
- **Export** asset lists for documentation
- **View** detailed statistics and metrics

## Integration with Data Protection

Assets are automatically included in backups created through the Data Protection system:

- Full asset metadata is preserved
- Protected status is maintained
- Tags and descriptions are backed up
- Restore operations include all asset information

## API Reference

For programmatic asset management, see `/src/lib/asset-manager.ts`:

```typescript
import { assetManager } from '@/lib/asset-manager'

// Get all assets
const allAssets = assetManager.getAllAssets()

// Get assets by type
const images = assetManager.getAssetsByType('image')

// Search assets
const results = assetManager.searchAssets('logo')

// Get protected assets
const protected = assetManager.getProtectedAssets()

// Get statistics
const stats = assetManager.getAssetStats()
```

## Support

For questions or issues with asset management, refer to:
- Asset Manager panel in the application
- `/src/lib/asset-manager.ts` for technical details
- `/src/components/AssetManager.tsx` for UI implementation
