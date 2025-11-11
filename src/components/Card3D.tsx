import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
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

  // Intensity settings
  const intensitySettings = {
    subtle: { tilt: 5, scale: 1.02, particles: 10 },
    medium: { tilt: 10, scale: 1.05, particles: 20 },
    high: { tilt: 15, scale: 1.08, particles: 30 }
  };

  const settings = intensitySettings[intensity];

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
  };

  return (
    <motion.div
      ref={cardRef}
      className={`relative ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => !disabled && setIsHovered(false)}
      onMouseMove={handleMouseMove}
      onClick={() => !disabled && onClick?.()}
      animate={{
        rotateY: isHovered ? mousePos.current.x * settings.tilt : 0,
        rotateX: isHovered ? -mousePos.current.y * settings.tilt : 0,
        scale: isHovered ? settings.scale : 1,
        z: isHovered ? 50 : 0
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20
      }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000
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
        <motion.div
          className="absolute inset-0 rounded-lg border-2 pointer-events-none"
          style={{
            borderColor: glowColor,
            boxShadow: `0 0 20px ${glowColor}80, inset 0 0 20px ${glowColor}40`
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {/* Shine effect */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
        >
          <div
            className="absolute w-full h-full"
            style={{
              background: `linear-gradient(135deg, transparent 40%, ${glowColor}40 50%, transparent 60%)`,
              transform: `translateX(${mousePos.current.x * 50}px) translateY(${mousePos.current.y * 50}px)`
            }}
          />
        </motion.div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
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

  return (
    <motion.button
      className={`rounded-lg font-medium ${variantStyles[variant]} ${sizeStyles[size]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      whileHover={{
        scale: disabled ? 1 : 1.05,
        rotateX: disabled ? 0 : 5,
        z: disabled ? 0 : 20
      }}
      whileTap={{
        scale: disabled ? 1 : 0.95,
        z: disabled ? 0 : -10
      }}
      animate={{
        boxShadow: isPressed
          ? 'none'
          : disabled
          ? 'none'
          : variant === 'primary'
          ? '0 10px 30px -5px rgba(139, 92, 246, 0.5)'
          : '0 5px 15px -3px rgba(0, 0, 0, 0.3)'
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 25
      }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000
      }}
    >
      {children}
    </motion.button>
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
    <motion.div
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${className}`}
      style={{
        background: `linear-gradient(135deg, ${color}20, ${color}40)`,
        border: `1px solid ${color}60`,
        boxShadow: `0 0 10px ${color}40`
      }}
      animate={{
        y: [0, -5, 0],
        boxShadow: [
          `0 0 10px ${color}40`,
          `0 5px 20px ${color}60`,
          `0 0 10px ${color}40`
        ]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  );
}
