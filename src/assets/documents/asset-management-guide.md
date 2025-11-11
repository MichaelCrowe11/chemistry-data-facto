# Asset Management Guide

## Overview

Crowe Code's Asset Management system provides enterprise-grade organization and protection for all your digital assets. Whether you're working with images, videos, 3D models, or documents, the Asset Manager keeps everything organized, searchable, and secure.

## Key Features

### 1. Category-Based Organization

Assets are automatically organized into six main categories:

- **Images**: Logos, icons, UI graphics, screenshots
- **Videos**: Tutorial videos, feature demonstrations, recordings
- **Audio**: Sound effects, notification sounds, voice recordings
- **Documents**: Research papers, guides, documentation, notes
- **3D Models**: Molecular structures, visualizations, VR/AR content
- **Fonts**: Custom typefaces for branding and specialized use

### 2. Asset Protection

Mark critical assets as "protected" to prevent accidental deletion:

```
Protected assets are displayed with a lock icon and cannot be deleted
until protection is manually removed.
```

**Use cases for protection:**
- Brand assets (logos, official colors)
- Critical 3D models used in VR/AR
- Important research papers and documentation
- Custom fonts required for branding

### 3. Tagging System

Organize assets with custom tags:

- Add multiple tags per asset
- Search across all tags
- Filter by common tags
- Auto-suggest popular tags

**Example tags:**
- `branding`, `logo`, `official`
- `tutorial`, `beginner`, `VR`
- `molecule`, `chemistry`, `3d`
- `paper`, `ML`, `reference`

### 4. Full-Text Search

Instantly find assets by searching:
- Asset names
- Tags
- Descriptions
- Metadata fields

### 5. Metadata Management

Each asset can have:
- **Name**: Display name
- **Description**: Detailed explanation
- **Tags**: Organizational labels
- **Category**: Primary classification
- **Size**: File size tracking
- **Upload Date**: When asset was added
- **Protected Status**: Deletion protection
- **User ID**: Owner tracking

## Workflow Examples

### Example 1: Organizing Tutorial Videos

1. Upload tutorial videos to `/assets/video/`
2. Open Asset Manager from toolbar
3. Select each video
4. Add tags: `tutorial`, `beginner`, `feature-name`
5. Add description explaining content
6. Mark important videos as protected

### Example 2: Managing 3D Models for VR

1. Import 3D models to `/assets/models/`
2. Tag with: `vr`, `molecule`, `chemistry`
3. Add descriptions with usage notes
4. Protect models used in production features
5. Export asset list for documentation

### Example 3: Research Paper Organization

1. Add papers to `/assets/documents/`
2. Tag by topic: `ML`, `algorithms`, `optimization`
3. Add descriptions with key findings
4. Link to related code files
5. Search when needed for reference

## Best Practices

### Naming Conventions

✅ **Good:**
- `crowe-logo-2024.png`
- `tutorial-vr-basics.mp4`
- `molecule-structure-dna.glb`
- `research-paper-transformers.pdf`

❌ **Avoid:**
- `IMG_1234.png`
- `video1.mp4`
- `model.glb`
- `paper.pdf`

### Tag Strategy

**Hierarchical tagging:**
- Broad: `tutorial`, `documentation`, `branding`
- Specific: `vr-tutorial`, `api-docs`, `logo-light-mode`
- Project: `project-alpha`, `research-2024`, `client-demo`

### Protection Guidelines

**Always protect:**
- Official brand assets
- Production 3D models
- Published documentation
- Custom fonts

**Consider protecting:**
- Frequently used templates
- Important reference materials
- Client-specific assets

### Metadata Documentation

Include in descriptions:
- Purpose and use cases
- Technical specifications
- Version information
- Related assets or files
- Attribution if applicable

## Integration Features

### Backup Integration

Assets are automatically included in Data Protection backups:
- Metadata preserved
- Tags maintained
- Protection status saved
- Restore with full fidelity

### Search Integration

Asset metadata is searchable from:
- Asset Manager panel
- Global search (coming soon)
- Code linking (coming soon)

### Export Capabilities

Export asset inventories as JSON:
- Complete metadata
- Size statistics
- Protection status
- Tag listings
- Upload timestamps

## Statistics Dashboard

Track your asset library:
- **Total Assets**: Overall count
- **Protected Assets**: Locked items
- **Total Size**: Storage used
- **Category Breakdown**: Assets per category

## Common Tasks

### Adding a New Asset

1. Place file in appropriate `/assets/` subdirectory
2. Import in your code: `import logo from '@/assets/images/logo.png'`
3. Open Asset Manager to add metadata
4. Add tags and description
5. Mark as protected if needed

### Finding an Asset

1. Open Asset Manager
2. Use search bar for name/tags
3. Filter by category tabs
4. Click asset to view details

### Protecting Critical Assets

1. Browse to asset in Asset Manager
2. Click edit/tag button
3. Toggle "Protected Asset" switch
4. Confirm changes
5. Asset now shows lock icon

### Exporting Asset List

1. Open Asset Manager
2. Click export/download button
3. JSON file downloads with all metadata
4. Use for documentation or audits

## Technical Reference

### File Locations

```
/src/assets/
├── images/          # Image files
├── video/           # Video files
├── audio/           # Audio files
├── documents/       # Document files (you are here!)
├── models/          # 3D model files
└── fonts/           # Font files
```

### Library Files

- **Manager**: `/src/lib/asset-manager.ts`
- **Component**: `/src/components/AssetManager.tsx`
- **Types**: Defined in asset-manager.ts

### Data Storage

Assets metadata stored in:
- Key: `crowe-assets`
- Format: Array of Asset objects
- Persistence: Spark KV store

## Future Enhancements

Planned features:
- Asset versioning and history
- Bulk operations (tag, protect, delete)
- Asset usage tracking
- Automatic optimization
- Cloud sync integration
- Collaborative asset libraries
- AI-powered tagging suggestions
- Asset dependency tracking

## Support

For issues or questions:
- Check `/src/assets/README.md` for technical details
- Review source code in `/src/lib/asset-manager.ts`
- Open Asset Manager for interactive help
- Contact platform administrators

---

*This document is part of the Crowe Code Asset Management system. Keep it updated as the system evolves.*
