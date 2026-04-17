if (typeof window !== 'undefined') {
  if (!window.performance) {
    (window as any).performance = {
      now: function() { return Date.now(); },
      timing: {
        navigationStart: Date.now()
      },
      navigation: {
        type: 0
      },
      timeOrigin: Date.now()
    };
  } else if (typeof window.performance.now !== 'function') {
    window.performance.now = function() { return Date.now(); };
  }
  
  if (typeof window.requestAnimationFrame !== 'function') {
    let lastTime = 0;
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      const currentTime = Date.now();
      const timeToCall = Math.max(0, 16 - (currentTime - lastTime));
      const id = window.setTimeout(() => {
        callback(currentTime + timeToCall);
      }, timeToCall);
      lastTime = currentTime + timeToCall;
      return id as unknown as number;
    };
  }
  
  if (typeof window.cancelAnimationFrame !== 'function') {
    window.cancelAnimationFrame = (id: number) => {
      clearTimeout(id);
    };
  }

  if (typeof (Element.prototype as any).getBoundingClientRect !== 'function') {
    (Element.prototype as any).getBoundingClientRect = function() {
      return {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => ({})
      };
    };
  }

  const originalGetComputedStyle = window.getComputedStyle;
  if (typeof originalGetComputedStyle === 'function') {
    window.getComputedStyle = function(element: Element, pseudoElt?: string | null) {
      try {
        const styles = originalGetComputedStyle.call(this, element, pseudoElt);
        if (!styles || typeof styles.getPropertyValue !== 'function') {
          throw new Error('Invalid styles');
        }
        return styles;
      } catch (e) {
        const fallbackStyles = {
          getPropertyValue: (prop: string) => {
            const defaults: Record<string, string> = {
              'display': 'block',
              'position': 'static',
              'box-sizing': 'border-box',
              'transform': 'none',
              'opacity': '1',
              'visibility': 'visible',
              'width': 'auto',
              'height': 'auto'
            };
            return defaults[prop] || '';
          },
          getPropertyPriority: () => '',
          item: (index: number) => '',
          length: 0,
          cssText: '',
          parentRule: null,
          removeProperty: () => '',
          setProperty: () => {},
          [Symbol.iterator]: function* () {}
        } as unknown as CSSStyleDeclaration;
        return fallbackStyles;
      }
    };
  }

  if (typeof (window as any).ResizeObserver === 'undefined') {
    (window as any).ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
}

export {}