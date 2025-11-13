if (typeof window !== 'undefined') {
  if (!window.performance || typeof window.performance.now !== 'function') {
    if (!window.performance) {
      window.performance = {} as Performance;
    }
    window.performance.now = () => Date.now();
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
        return originalGetComputedStyle(element, pseudoElt);
      } catch (e) {
        return {
          getPropertyValue: () => '',
          getPropertyPriority: () => '',
          item: () => '',
          length: 0,
          cssText: '',
          parentRule: null,
          removeProperty: () => '',
          setProperty: () => {},
          [Symbol.iterator]: function* () {}
        } as unknown as CSSStyleDeclaration;
      }
    };
  }
}