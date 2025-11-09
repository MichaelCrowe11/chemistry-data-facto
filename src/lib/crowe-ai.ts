import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

// Vercel AI Gateway configuration
const AI_GATEWAY_URL = import.meta.env.VITE_AI_GATEWAY_URL || 'https://gateway.ai.cloudflare.com/v1'
const AI_API_KEY = import.meta.env.VITE_AI_API_KEY || ''

export interface CroweAIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export class CroweLogicAI {
  private apiKey: string
  private gatewayUrl: string

  constructor(apiKey?: string, gatewayUrl?: string) {
    this.apiKey = apiKey || AI_API_KEY
    this.gatewayUrl = gatewayUrl || AI_GATEWAY_URL
  }

  /**
   * Generate a response from Crowe Logic AI
   */
  async chat(messages: CroweAIMessage[], model: string = 'gpt-4o'): Promise<string> {
    try {
      const systemPrompt = `You are Crowe Logic, an expert AI coding assistant integrated into Crowe Code - a modern, VS Code-style editor.

Your capabilities:
- Expert in debugging, code review, refactoring, and optimization
- Proficient in multiple programming languages and frameworks
- Can explain complex code in simple terms
- Provide actionable, practical solutions
- Write clean, well-documented code

Your personality:
- Professional yet friendly
- Concise but thorough
- Always provide code in markdown blocks with proper language tags
- Focus on best practices and modern patterns

When helping users:
1. Analyze their code context carefully
2. Ask clarifying questions if needed
3. Provide step-by-step explanations
4. Include code examples when relevant
5. Suggest improvements and optimizations`

      const response = await generateText({
        model: openai(model),
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
      })

      return response.text
    } catch (error) {
      console.error('Crowe Logic AI error:', error)
      throw new Error('Failed to get response from Crowe Logic AI')
    }
  }

  /**
   * Quick code analysis
   */
  async analyzeCode(code: string, language: string, question?: string): Promise<string> {
    const prompt = question
      ? `I'm working with this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n${question}`
      : `Analyze this ${language} code and provide insights:\n\n\`\`\`${language}\n${code}\n\`\`\``

    return this.chat([
      { role: 'user', content: prompt }
    ])
  }

  /**
   * Code debugging assistant
   */
  async debugCode(code: string, language: string, error?: string): Promise<string> {
    const prompt = error
      ? `I'm getting this error in my ${language} code:\n\nError: ${error}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\`\n\nHelp me debug this.`
      : `Help me debug this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``

    return this.chat([
      { role: 'user', content: prompt }
    ])
  }

  /**
   * Code refactoring suggestions
   */
  async refactorCode(code: string, language: string, goal?: string): Promise<string> {
    const prompt = goal
      ? `Refactor this ${language} code to ${goal}:\n\n\`\`\`${language}\n${code}\n\`\`\``
      : `Suggest refactoring improvements for this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``

    return this.chat([
      { role: 'user', content: prompt }
    ])
  }
}

// Export singleton instance
export const croweAI = new CroweLogicAI()
