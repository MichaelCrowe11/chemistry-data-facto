# Chemistry Data Factory Dashboard - PRD

A sophisticated web interface for exploring and visualizing chemistry knowledge from the comprehensive chemistry data factory backend.

**Experience Qualities:**
1. **Scientific** - Clean, data-focused interface that feels like a professional research tool
2. **Intuitive** - Complex chemistry data made accessible through thoughtful information architecture
3. **Performant** - Responsive interactions with large datasets through efficient queries and virtualization

**Complexity Level:** Light Application (multiple features with basic state)
This is a data exploration and visualization interface connecting to an existing REST API backend with compound search, reaction browsing, and literature discovery features.

## Essential Features

### Compound Search & Exploration
- **Functionality**: Search compounds by name, formula, SMILES, molecular weight range
- **Purpose**: Enable researchers to quickly find specific compounds or browse chemical space
- **Trigger**: User enters search criteria in compound search interface
- **Progression**: Enter query → API request → Results display in cards → Click compound → Detailed view with properties, reactions, literature
- **Success criteria**: Results display within 500ms, all compound properties visible, structure rendering works

### Reaction Browser
- **Functionality**: Browse and filter chemical reactions by yield, reaction class, conditions
- **Purpose**: Discover high-performing reactions and experimental conditions
- **Trigger**: User navigates to reactions tab or filters reaction list
- **Progression**: View reaction list → Apply filters (yield, class, temperature) → See filtered results → Click reaction → View full details with reactants/products
- **Success criteria**: Filter updates are instant, yield sorting works correctly, reaction schemes display clearly

### Literature Discovery
- **Functionality**: Search scientific papers, view extracted chemistry knowledge
- **Purpose**: Connect chemistry data to source literature
- **Trigger**: User searches literature or views compound/reaction references
- **Progression**: Enter search query → Results with titles/abstracts → Click paper → View extracted compounds/reactions/properties
- **Success criteria**: Full-text search works, extracted data displays correctly, citations link properly

### Database Statistics Dashboard
- **Functionality**: Real-time overview of data factory contents and health
- **Purpose**: Monitor system status and understand data coverage
- **Trigger**: User views dashboard home
- **Progression**: Load dashboard → Display entity counts → Show recent imports → Health status indicators
- **Success criteria**: All metrics accurate, updates reflect database state, health checks functional

## Edge Case Handling

- **API Unavailable** - Show offline banner, cache last results, retry connection
- **No Results Found** - Display helpful message with search suggestions, show similar queries
- **Invalid Chemical Structure** - Validate SMILES/InChI before search, show format examples
- **Large Result Sets** - Implement virtual scrolling, paginate beyond 100 results
- **Slow Queries** - Show loading skeletons, allow query cancellation, cache frequent searches

## Design Direction

The design should feel like a modern scientific research platform - professional and data-rich while remaining approachable. Think of the clarity of PubChem combined with the modern UX of Observable notebooks. The interface should prioritize information density without overwhelming users, using progressive disclosure to reveal complexity as needed. Minimal visual ornamentation, maximum focus on the chemistry data itself.

## Color Selection

Triadic color scheme representing the scientific nature of chemistry with energy and precision.

- **Primary Color (Deep Blue #1e40af / oklch(0.45 0.15 264))**: Represents scientific rigor and knowledge - used for primary actions, headers, and key data points. Communicates trust and professionalism.
- **Secondary Colors**: 
  - Teal #0d9488 / oklch(0.55 0.12 180) - Supporting color for secondary actions and informational elements
  - Slate #475569 / oklch(0.40 0.02 250) - Tertiary color for subtle UI elements and backgrounds
- **Accent Color (Vibrant Amber #f59e0b / oklch(0.72 0.15 70))**: Attention-grabbing highlight for important chemistry data, active states, and successful operations. Represents the energy of chemical reactions.
- **Foreground/Background Pairings**:
  - Background (White #ffffff / oklch(1 0 0)): Deep Blue text (oklch(0.45 0.15 264)) - Ratio 9.2:1 ✓
  - Card (Light Gray #f8fafc / oklch(0.99 0 0)): Deep Blue text - Ratio 8.9:1 ✓
  - Primary (Deep Blue #1e40af): White text (oklch(1 0 0)) - Ratio 9.2:1 ✓
  - Secondary (Teal #0d9488): White text - Ratio 4.8:1 ✓
  - Accent (Amber #f59e0b): Black text (oklch(0.2 0 0)) - Ratio 8.1:1 ✓
  - Muted (Light Slate #f1f5f9): Slate text (oklch(0.40 0.02 250)) - Ratio 7.2:1 ✓

## Font Selection

Typography should convey scientific precision while maintaining excellent readability for long data browsing sessions. Use Inter for its exceptional clarity at all sizes and tabular figure support for numerical data.

- **Typographic Hierarchy**:
  - H1 (Dashboard Title): Inter Bold/32px/tight letter spacing
  - H2 (Section Headers): Inter Semibold/24px/normal spacing
  - H3 (Card Titles): Inter Medium/18px/normal spacing
  - Body (Data Labels): Inter Regular/14px/relaxed line height 1.6
  - Data Values: Inter Medium/14px/tabular numbers
  - Small (Metadata): Inter Regular/12px/muted color

## Animations

Animations should be subtle and purposeful, enhancing data comprehension rather than decorating the interface. Transitions should feel instant (< 200ms) while still providing visual continuity during state changes.

- **Purposeful Meaning**: Use motion to guide attention to newly loaded data, indicate search progress, and confirm actions. Card entrances stagger slightly to show data relationships.
- **Hierarchy of Movement**: Primary data (compound structures, reaction schemes) animate smoothly on reveal. Secondary elements (metadata, stats) fade in simply. Background elements remain static.

## Component Selection

- **Components**: 
  - Card (compound/reaction/paper cards with hover states)
  - Input (search fields with chemical formula validation)
  - Tabs (navigation between Compounds/Reactions/Literature)
  - Badge (reaction classes, compound categories)
  - Separator (visual grouping of properties)
  - ScrollArea (virtualized lists for large datasets)
  - Skeleton (loading states for async data)
  - Alert (API errors, system status)
- **Customizations**: 
  - MoleculeViewer component (2D structure rendering)
  - PropertyGrid component (key-value pairs for chemical properties)
  - ReactionScheme component (reactants → products visualization)
  - StatCard component (dashboard metrics)
- **States**: 
  - Search inputs: Default/Focused (blue ring)/Disabled/Error (red border)
  - Cards: Rest/Hover (elevated shadow + border highlight)/Selected (blue border)
  - Buttons: Default/Hover (opacity 0.9)/Active (scale 0.98)/Loading (spinner)
  - Data loading: Skeleton → Fade in content
- **Icon Selection**: 
  - MagnifyingGlass (search)
  - Flask (compounds)
  - Lightning (reactions)
  - BookOpen (literature)
  - ChartBar (statistics)
  - Funnel (filters)
  - X (clear filters)
  - Check (validation success)
- **Spacing**: Consistent 16px base unit (4px, 8px, 16px, 24px, 32px, 48px) for padding/margins using Tailwind's spacing scale
- **Mobile**: Stacked single-column layout on mobile, tab navigation converts to bottom sheet selector, cards maintain full width, data tables scroll horizontally, search becomes modal overlay
