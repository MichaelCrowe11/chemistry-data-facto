import React from 'react'

/**
 * AnimatedLogo
 * Lightweight letter assembly animation (no external libs) meant for the welcome screen.
 * Keeps DOM small and avoids layout thrash: pure CSS keyframes + transform compositing.
 */
interface AnimatedLogoProps {
  text?: string
  className?: string
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ text = 'CROWE CODE', className = '' }) => {
  const letters = text.split('')

  return (
    <div className={"relative inline-flex select-none " + className}>
      {/* Local styles: scoped via data-animated-logo attribute */}
      <style>{`
        @keyframes logoFadeUp {0%{opacity:0;transform:translateY(18px) scale(.95)}60%{opacity:1}100%{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes logoAmbient {0%,100%{transform:translateY(0)}25%{transform:translateY(-4px)}50%{transform:translateY(0)}75%{transform:translateY(4px)}}
        [data-animated-logo] .logo-letter {opacity:0;display:inline-block;will-change:transform,opacity;}
        [data-animated-logo] .logo-letter[data-active='true'] {animation: logoFadeUp .9s cubic-bezier(.25,.8,.25,1) forwards, logoAmbient 4s ease-in-out infinite .9s;}
        [data-animated-logo] .logo-letter::after {content: attr(data-char);position:absolute;left:0;top:0;filter:blur(6px);opacity:0;animation: logoFadeUp .9s cubic-bezier(.25,.8,.25,1) forwards;animation-delay:inherit;}
      `}</style>
      <div data-animated-logo data-text={text} className="font-bold text-5xl tracking-wide">
        {letters.map((c, i) => (
          <span
            key={i}
            data-char={c}
            data-active="true"
            style={{ animationDelay: `${i * 0.06}s` }}
            className="logo-letter relative px-0.5 text-accent"
          >
            {c === ' ' ? '\u00A0' : c}
          </span>
        ))}
      </div>
    </div>
  )
}

export default AnimatedLogo
