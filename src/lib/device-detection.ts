/**
 * Device detection and automatic performance preset selection
 */

export interface DeviceCapabilities {
  tier: 'high-end' | 'mid-range' | 'low-end';
  recommendedPreset: 'ultra' | 'high' | 'balanced' | 'performance';
  gpuTier?: number;
  isMobile: boolean;
  cores?: number;
  memory?: number;
}

/**
 * Detect device capabilities and recommend performance preset
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  // Get hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 4;

  // Estimate device memory (GB) - only available in some browsers
  const memory = (navigator as any).deviceMemory || 4;

  // Check for GPU info
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  let gpuTier = 2; // Default mid-range

  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

      // High-end GPU patterns
      if (
        /RTX|Radeon RX 6|Radeon RX 7|Apple M[1-3] Pro|Apple M[1-3] Max/i.test(renderer)
      ) {
        gpuTier = 3;
      }
      // Low-end GPU patterns
      else if (
        /Intel.*HD|Intel.*UHD [6-7][0-9]{2}|Mali|Adreno [4-5]/i.test(renderer)
      ) {
        gpuTier = 1;
      }
    }
  }

  // Determine tier based on multiple factors
  let tier: DeviceCapabilities['tier'];
  let recommendedPreset: DeviceCapabilities['recommendedPreset'];

  if (isMobile) {
    // Mobile devices - generally more conservative
    if (memory >= 6 && cores >= 6) {
      tier = 'mid-range';
      recommendedPreset = 'balanced';
    } else {
      tier = 'low-end';
      recommendedPreset = 'performance';
    }
  } else {
    // Desktop/laptop
    if (gpuTier === 3 && cores >= 8 && memory >= 16) {
      tier = 'high-end';
      recommendedPreset = 'ultra';
    } else if (gpuTier >= 2 && cores >= 4 && memory >= 8) {
      tier = 'mid-range';
      recommendedPreset = 'high';
    } else {
      tier = 'low-end';
      recommendedPreset = 'performance';
    }
  }

  return {
    tier,
    recommendedPreset,
    gpuTier,
    isMobile,
    cores,
    memory
  };
}

/**
 * Get performance config based on device capabilities
 */
export function getRecommendedPerformanceConfig() {
  const capabilities = detectDeviceCapabilities();

  const configs = {
    ultra: {
      backgroundIntensity: 'high' as const,
      particleCount: 'maximum' as const,
      enableBloom: true,
      enableParallax: true,
      enableTransitions: true,
      antialiasing: true,
      pixelRatio: 'auto' as const
    },
    high: {
      backgroundIntensity: 'medium' as const,
      particleCount: 'balanced' as const,
      enableBloom: true,
      enableParallax: true,
      enableTransitions: true,
      antialiasing: true,
      pixelRatio: '2' as const
    },
    balanced: {
      backgroundIntensity: 'medium' as const,
      particleCount: 'balanced' as const,
      enableBloom: false,
      enableParallax: true,
      enableTransitions: true,
      antialiasing: true,
      pixelRatio: '1' as const
    },
    performance: {
      backgroundIntensity: 'low' as const,
      particleCount: 'minimal' as const,
      enableBloom: false,
      enableParallax: false,
      enableTransitions: true,
      antialiasing: false,
      pixelRatio: '1' as const
    }
  };

  return {
    config: configs[capabilities.recommendedPreset],
    capabilities
  };
}

/**
 * Check if user has manually configured settings
 */
export function hasManualConfig(): boolean {
  return localStorage.getItem('3d-performance-config') !== null;
}

/**
 * Initialize performance config with device detection
 */
export function initializePerformanceConfig() {
  // If user has already configured, don't override
  if (hasManualConfig()) {
    return JSON.parse(localStorage.getItem('3d-performance-config')!);
  }

  // Auto-detect and set recommended config
  const { config, capabilities } = getRecommendedPerformanceConfig();

  // Save to localStorage
  localStorage.setItem('3d-performance-config', JSON.stringify(config));

  // Optionally show notification about auto-detection
  console.log('🎮 3D Graphics: Auto-detected', capabilities.tier, 'device');
  console.log('📊 Recommended preset:', capabilities.recommendedPreset);

  return config;
}
