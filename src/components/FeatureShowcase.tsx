import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sparkle,
  Eye,
  MapPin,
  Microphone,
  Brain,
  Article,
  Flask,
  Robot,
  Atom,
  Cube,
  ImageSquare,
  Play,
  Dna,
  Speedometer,
  Package,
} from '@phosphor-icons/react'

interface FeatureShowcaseProps {
  className?: string
}

const features = [
  {
    icon: <Eye className="h-6 w-6" weight="duotone" />,
    title: 'VR Workspace',
    description: 'Code in virtual reality',
    gradient: 'from-purple-500 to-pink-500',
    delay: 0,
  },
  {
    icon: <MapPin className="h-6 w-6" weight="duotone" />,
    title: 'AR Overlay',
    description: 'Augmented reality coding',
    gradient: 'from-green-500 to-emerald-500',
    delay: 0.1,
  },
  {
    icon: <Microphone className="h-6 w-6" weight="duotone" />,
    title: 'Voice Commands',
    description: 'Hands-free coding',
    gradient: 'from-pink-500 to-rose-500',
    delay: 0.2,
  },
  {
    icon: <Brain className="h-6 w-6" weight="duotone" />,
    title: 'Sentient Debugger',
    description: 'AI predictive debugging',
    gradient: 'from-purple-500 to-indigo-500',
    delay: 0.3,
  },
  {
    icon: <Article className="h-6 w-6" weight="duotone" />,
    title: 'arXiv Papers',
    description: 'Research integration',
    gradient: 'from-blue-500 to-cyan-500',
    delay: 0.4,
  },
  {
    icon: <Flask className="h-6 w-6" weight="duotone" />,
    title: 'Experiments',
    description: 'Track ML experiments',
    gradient: 'from-green-500 to-teal-500',
    delay: 0.5,
  },
  {
    icon: <Robot className="h-6 w-6" weight="duotone" />,
    title: 'AI Pair Programmer',
    description: 'Collaborative coding',
    gradient: 'from-blue-500 to-purple-500',
    delay: 0.6,
  },
  {
    icon: <Atom className="h-6 w-6" weight="duotone" />,
    title: 'Quantum Synthesis',
    description: 'AI code generation',
    gradient: 'from-orange-500 to-red-500',
    delay: 0.7,
  },
  {
    icon: <Cube className="h-6 w-6" weight="duotone" />,
    title: '3D Holographic',
    description: 'Code visualization',
    gradient: 'from-pink-500 to-purple-500',
    delay: 0.8,
  },
  {
    icon: <ImageSquare className="h-6 w-6" weight="duotone" />,
    title: '3D Gallery',
    description: 'WebGL showcases',
    gradient: 'from-cyan-500 to-blue-500',
    delay: 0.9,
  },
  {
    icon: <Dna className="h-6 w-6" weight="duotone" />,
    title: 'DNA Sequencer',
    description: 'Code pattern analysis',
    gradient: 'from-emerald-500 to-green-500',
    delay: 1.0,
  },
  {
    icon: <Package className="h-6 w-6" weight="duotone" />,
    title: 'Reproducibility',
    description: 'Environment packaging',
    gradient: 'from-amber-500 to-orange-500',
    delay: 1.1,
  },
]

export function FeatureShowcase({ className = '' }: FeatureShowcaseProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 ${className}`}>
      {features.map((feature, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.4,
            delay: feature.delay,
            type: 'spring',
            stiffness: 100,
          }}
        >
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-700/50 backdrop-blur-sm hover:border-slate-600 transition-all hover:scale-105 cursor-pointer group">
            <div className="p-4">
              <div className={`p-2 bg-gradient-to-br ${feature.gradient} bg-opacity-20 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform`}>
                <div className="text-white">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">
                {feature.title}
              </h3>
              <p className="text-xs text-slate-400">
                {feature.description}
              </p>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
