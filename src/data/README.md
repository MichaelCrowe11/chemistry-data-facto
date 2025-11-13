# Crowe Code Data Directory

This directory contains structured data, schemas, and templates used throughout the platform.

## Directory Structure

```
data/
├── schemas/         # TypeScript type definitions and Zod schemas
└── templates/       # Reusable code templates and snippets
```

## Schemas

The schemas directory contains validated data structures using Zod:

### Available Schemas

- **FileItemSchema**: File and folder structure
- **EditorTabSchema**: Editor tab state
- **UserPreferencesSchema**: User settings
- **ExperimentSchema**: Research experiment tracking
- **ResearchPaperSchema**: Academic paper metadata
- **ReproducibilityPackageSchema**: Environment packages

### Usage Example

```typescript
import { FileItemSchema, type FileItem } from '@/data/schemas'

// Validate data
const file = FileItemSchema.parse(rawData)

// Type-safe usage
const files: FileItem[] = []
```

## Templates

The templates directory provides reusable code snippets:

### Available Languages

- JavaScript (function, class, async, component)
- TypeScript (interface, type, enum, component)
- Python (function, class, async)

### Usage Example

```typescript
import { getTemplate, getAvailableTemplates } from '@/data/templates'

// Get a specific template
const template = getTemplate('typescript', 'interface')

// List available templates
const templates = getAvailableTemplates('typescript')
```

## Data Protection

All data in this directory is protected by:

1. **Schema Validation**: Zod ensures type safety
2. **Integrity Checks**: SHA-256 checksums
3. **Backup System**: Automatic and manual backups
4. **Export/Import**: Secure data portability

## Adding New Schemas

1. Define your schema in `schemas/index.ts`
2. Export the schema and inferred type
3. Use the schema for validation throughout the app

```typescript
export const MySchema = z.object({
  id: z.string(),
  name: z.string(),
})

export type MyType = z.infer<typeof MySchema>
```

## Adding New Templates

1. Add your template to `templates/index.ts`
2. Organize by language and template type
3. Use clear, consistent formatting

```typescript
export const codeTemplates = {
  // ... existing templates
  newLanguage: {
    templateType: `template content here`,
  },
}
```

## Best Practices

1. **Validate Early**: Use schemas at data boundaries
2. **Type Safety**: Always export inferred types
3. **Version Control**: Include version in schemas
4. **Documentation**: Comment complex schemas
5. **Testing**: Validate schemas with test data

## Security Considerations

- Never store secrets in templates
- Validate all user input with schemas
- Use secure defaults in templates
- Implement rate limiting for template generation

## Performance Tips

- Cache compiled schemas
- Use lazy loading for large template sets
- Implement template preloading for common patterns
- Monitor schema parse times
