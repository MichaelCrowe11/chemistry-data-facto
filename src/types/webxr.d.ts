interface XRSession extends EventTarget {
  renderState: XRRenderState
  end(): Promise<void>
  requestReferenceSpace(type: XRReferenceSpaceType): Promise<XRReferenceSpace>
  requestAnimationFrame(callback: XRFrameRequestCallback): number
  cancelAnimationFrame(handle: number): void
  requestHitTestSource?(options: { space: XRSpace }): Promise<XRHitTestSource>
  addEventListener(type: 'end', listener: (event: Event) => void): void
  addEventListener(type: 'select', listener: (event: Event) => void): void
  removeEventListener(type: 'end', listener: (event: Event) => void): void
  removeEventListener(type: 'select', listener: (event: Event) => void): void
}

interface XRHitTestSource {
  cancel(): void
}

interface XRHitTestResult {
  getPose(baseSpace: XRSpace): XRPose | null
}

interface XRRenderState {
  baseLayer?: XRWebGLLayer
  depthNear: number
  depthFar: number
  inlineVerticalFieldOfView?: number
}

interface XRReferenceSpace extends EventTarget {
  getOffsetReferenceSpace(originOffset: XRRigidTransform): XRReferenceSpace
}

interface XRRigidTransform {
  position: DOMPointReadOnly
  orientation: DOMPointReadOnly
  matrix: Float32Array
}

type XRReferenceSpaceType = 'viewer' | 'local' | 'local-floor' | 'bounded-floor' | 'unbounded'

interface XRFrame {
  session: XRSession
  getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose | null
  getPose(space: XRSpace, baseSpace: XRSpace): XRPose | null
  getHitTestResults?(hitTestSource: XRHitTestSource): XRHitTestResult[]
}

interface XRViewerPose {
  transform: XRRigidTransform
  views: XRView[]
}

interface XRView {
  eye: 'left' | 'right' | 'none'
  projectionMatrix: Float32Array
  transform: XRRigidTransform
}

interface XRPose {
  transform: XRRigidTransform
  emulatedPosition: boolean
}

interface XRSpace extends EventTarget {}

interface XRWebGLLayer {
  framebuffer: WebGLFramebuffer
  framebufferWidth: number
  framebufferHeight: number
  getViewport(view: XRView): XRViewport
}

interface XRViewport {
  x: number
  y: number
  width: number
  height: number
}

type XRFrameRequestCallback = (time: DOMHighResTimeStamp, frame: XRFrame) => void

interface XRSystem extends EventTarget {
  isSessionSupported(mode: XRSessionMode): Promise<boolean>
  requestSession(mode: XRSessionMode, options?: XRSessionInit): Promise<XRSession>
}

type XRSessionMode = 'inline' | 'immersive-vr' | 'immersive-ar'

interface XRSessionInit {
  requiredFeatures?: string[]
  optionalFeatures?: string[]
  domOverlay?: { root: Element }
}

interface Navigator {
  xr?: XRSystem
}

interface WebGLRenderer {
  xr: {
    enabled: boolean
    isPresenting: boolean
    getController(index: number): any
    getControllerGrip(index: number): any
    getReferenceSpace(): XRReferenceSpace | null
    setSession(session: XRSession | null): Promise<void>
    setAnimationLoop(callback: ((time: number, frame?: XRFrame) => void) | null): void
  }
}

declare module 'three' {
  interface WebGLRenderer {
    xr: {
      enabled: boolean
      isPresenting: boolean
      getController(index: number): import('three').Group
      getControllerGrip(index: number): import('three').Group
      getReferenceSpace(): XRReferenceSpace | null
      setSession(session: XRSession | null): Promise<void>
      setAnimationLoop(callback: ((time: number, frame?: XRFrame) => void) | null): void
    }
  }
}
