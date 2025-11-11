import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'subtle' | 'medium' | 'high';
  glowColor?: string;
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * 3D Card Component with hover effects and particle glow
 * Provides depth, tilt, and animated particle effects on hover
 */
export function Card3D({
  children,
  className = '',
  intensity = 'medium',
  glowColor = '#00C9FF',
  onClick,
  disabled = false
}: Card3DProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const [transform, setTransform] = useState({ rotateY: 0, rotateX: 0, scale: 1 });

  // Intensity settings
  const intensitySettings = {
    subtle: { tilt: 5, scale: 1.02, particles: 10 },
    medium: { tilt: 10, scale: 1.05, particles: 20 },
    high: { tilt: 15, scale: 1.08, particles: 30 }
  };

  const settings = intensitySettings[intensity];

  useEffect(() => {
    if (!isHovered) {
      setTransform({ rotateY: 0, rotateX: 0, scale: 1 });
    } else {
      setTransform({
        rotateY: mousePos.current.x * settings.tilt,
        rotateX: -mousePos.current.y * settings.tilt,
        scale: settings.scale
      });
    }
  }, [isHovered, settings.tilt, settings.scale]);

  // Canvas particle effect
  useEffect(() => {
    if (!canvasRef.current || !isHovered) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    // Particle system
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      size: number;
    }> = [];

    for (let i = 0; i < settings.particles; i++) {
      particles.push({
        x: Math.random() * canvas.width / 2,
        y: Math.random() * canvas.height / 2,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: Math.random(),
        size: Math.random() * 3 + 1
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width / 2, canvas.height / 2);

      particles.forEach((particle, index) => {
        // Update
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= 0.01;

        // Respawn
        if (particle.life <= 0) {
          particle.x = Math.random() * canvas.width / 2;
          particle.y = Math.random() * canvas.height / 2;
          particle.life = 1;
        }

        // Draw
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size
        );
        gradient.addColorStop(0, `${glowColor}${Math.floor(particle.life * 150).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${glowColor}00`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw connections
        particles.forEach((other, otherIndex) => {
          if (index === otherIndex) return;
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 50) {
            ctx.strokeStyle = `${glowColor}${Math.floor((1 - distance / 50) * 30).toString(16).padStart(2, '0')}`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isHovered, settings.particles, glowColor]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || disabled) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mousePos.current = {
      x: (x / rect.width - 0.5) * 2,
      y: (y / rect.height - 0.5) * 2
    };

    if (isHovered) {
      setTransform({
        rotateY: mousePos.current.x * settings.tilt,
        rotateX: -mousePos.current.y * settings.tilt,
        scale: settings.scale
      });
    }
  };

  return (
    <div
      ref={cardRef}
      className={`relative transition-all duration-300 ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => !disabled && setIsHovered(false)}
      onMouseMove={handleMouseMove}
      onClick={() => !disabled && onClick?.()}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000,
        transform: `rotateY(${transform.rotateY}deg) rotateX(${transform.rotateX}deg) scale(${transform.scale}) translateZ(${isHovered ? 50 : 0}px)`
      }}
    >
      {/* Particle canvas */}
      {isHovered && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{ mixBlendMode: 'screen' }}
        />
      )}

      {/* Glow border */}
      {isHovered && (
        <div
          className="absolute inset-0 rounded-lg border-2 pointer-events-none transition-opacity duration-300"
          style={{
            borderColor: glowColor,
            boxShadow: `0 0 20px ${glowColor}80, inset 0 0 20px ${glowColor}40`,
            opacity: 1
          }}
        />
      )}

      {/* Shine effect */}
      {isHovered && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none overflow-hidden transition-opacity duration-300"
          style={{ opacity: 0.3 }}
        >
          <div
            className="absolute w-full h-full"
            style={{
              background: `linear-gradient(135deg, transparent 40%, ${glowColor}40 50%, transparent 60%)`,
              transform: `translateX(${mousePos.current.x * 50}px) translateY(${mousePos.current.y * 50}px)`
            }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * 3D Button Component with depth and hover effects
 */
interface Button3DProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export function Button3D({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false
}: Button3DProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const variantStyles = {
    primary: 'bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 text-white',
    secondary: 'bg-card border border-border text-foreground',
    ghost: 'bg-transparent border border-transparent text-foreground hover:bg-card/50'
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const getBoxShadow = () => {
    if (isPressed || disabled) return 'none';
    if (variant === 'primary') {
      return isHovered ? '0 10px 30px -5px rgba(139, 92, 246, 0.5)' : '0 5px 15px -3px rgba(139, 92, 246, 0.3)';
    }
    return isHovered ? '0 5px 15px -3px rgba(0, 0, 0, 0.3)' : 'none';
  };

  return (
    <button
      className={`rounded-lg font-medium transition-all duration-200 ${variantStyles[variant]} ${sizeStyles[size]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => {
        setIsPressed(false);
        setIsHovered(false);
      }}
      onMouseEnter={() => setIsHovered(true)}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000,
        transform: disabled 
          ? 'none' 
          : isPressed 
            ? 'scale(0.95) translateZ(-10px)' 
            : isHovered 
              ? 'scale(1.05) rotateX(5deg) translateZ(20px)' 
              : 'none',
        boxShadow: getBoxShadow()
      }}
    >
      {children}
    </button>
  );
}

/**
 * Floating 3D Badge Component
 */
interface Badge3DProps {
  children: React.ReactNode;
  color?: string;
  className?: string;
}

export function Badge3D({ children, color = '#00C9FF', className = '' }: Badge3DProps) {
  return (
    <div
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium animate-float ${className}`}
      style={{
        background: `linear-gradient(135deg, ${color}20, ${color}40)`,
        border: `1px solid ${color}60`,
        boxShadow: `0 0 10px ${color}40`,
        animation: 'float 2s ease-in-out infinite'
      }}
    >
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
            box-shadow: 0 0 10px ${color}40;
          }
          50% {
            transform: translateY(-5px);
            box-shadow: 0 5px 20px ${color}60;
          }
        }
      `}</style>
      {children}
    </div>
  );
}
