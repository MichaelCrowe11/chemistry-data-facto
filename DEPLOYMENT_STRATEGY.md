/**
 * Feature flags for controlling 3D graphics
 * Can be controlled via environment variables or remote config
 */

export interface FeatureFlags {
  enable3DGraphics: boolean;
  enable3DBackground: boolean;
  enable3DWelcome: boolean;
  enable3DTransitions: boolean;
  enablePerformanceSettings: boolean;
}

/**
 * Get feature flags
 * Priority: localStorage > environment > defaults
 */
export function getFeatureFlags(): FeatureFlags {
  // Check localStorage for admin overrides
  const localOverrides = localStorage.getItem('feature-flags');
  if (localOverrides) {
    try {
      return JSON.parse(localOverrides);
    } catch (e) {
      console.warn('Invalid feature flags in localStorage');
    }
  }

  // Check environment variables (set in Fly.io)
  const defaults: FeatureFlags = {
    enable3DGraphics: import.meta.env.VITE_ENABLE_3D !== 'false', // Default true
    enable3DBackground: import.meta.env.VITE_ENABLE_3D_BG !== 'false',
    enable3DWelcome: import.meta.env.VITE_ENABLE_3D_WELCOME !== 'false',
    enable3DTransitions: import.meta.env.VITE_ENABLE_3D_TRANSITIONS !== 'false',
    enablePerformanceSettings: true // Always allow users to configure
  };

  return defaults;
}

/**
 * Admin function to override feature flags
 * Call from browser console: setFeatureFlags({ enable3DGraphics: false })
 */
(window as any).setFeatureFlags = (flags: Partial<FeatureFlags>) => {
  const current = getFeatureFlags();
  const updated = { ...current, ...flags };
  localStorage.setItem('feature-flags', JSON.stringify(updated));
  console.log('✅ Feature flags updated:', updated);
  console.log('🔄 Reload the page to apply changes');
};

/**
 * Clear feature flag overrides
 */
(window as any).clearFeatureFlags = () => {
  localStorage.removeItem('feature-flags');
  console.log('✅ Feature flags cleared, using defaults');
  console.log('🔄 Reload the page to apply changes');
};

// Log current flags in development
if (import.meta.env.DEV) {
  console.log('🎛️ Feature Flags:', getFeatureFlags());
  console.log('💡 Use setFeatureFlags({ enable3DGraphics: false }) to override');
}
