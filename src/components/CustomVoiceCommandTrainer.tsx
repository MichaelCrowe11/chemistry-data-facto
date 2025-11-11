import { useState, useEffect, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Microphone, Plus, Trash, Play, BookmarkSimple, Lightning, Code, Sparkle, Check, X } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface CustomVoiceCommand {
  id: string
  name: string
  description: string
  phrases: string[]
  actionType: 'insert-code' | 'run-command' | 'ai-generate' | 'custom-script'
  actionData: string
  createdAt: Date
  trainingSamples: string[]
  isActive: boolean
}

interface CustomVoiceCommandTrainerProps {
  onCommandExecute: (command: CustomVoiceCommand) => void
  onCodeInsert: (code: string) => void
  currentLanguage?: string
}

export function CustomVoiceCommandTrainer({ 
  onCommandExecute, 
  onCodeInsert,
  currentLanguage = 'javascript' 
}: CustomVoiceCommandTrainerProps) {
  const [customCommands, setCustomCommands] = useKV<CustomVoiceCommand[]>('custom-voice-commands', [])
  const [isTrainingDialogOpen, setIsTrainingDialogOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [currentRecordingIndex, setCurrentRecordingIndex] = useState(0)
  const [recordedSamples, setRecordedSamples] = useState<string[]>([])
  const [recognition, setRecognition] = useState<any>(null)

  const [newCommand, setNewCommand] = useState<Partial<CustomVoiceCommand>>({
    name: '',
    description: '',
    phrases: [],
    actionType: 'insert-code',
    actionData: '',
    trainingSamples: [],
    isActive: true,
  })

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognitionInstance = new SpeechRecognition()
      recognitionInstance.continuous = false
      recognitionInstance.interimResults = false
      recognitionInstance.lang = 'en-US'

      recognitionInstance.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setRecordedSamples(prev => [...prev, transcript.toLowerCase().trim()])
        setIsRecording(false)
        toast.success(`Sample ${recordedSamples.length + 1} recorded: "${transcript}"`)
      }

      recognitionInstance.onerror = (event: any) => {
        toast.error(`Recording error: ${event.error}`)
        setIsRecording(false)
      }

      recognitionInstance.onend = () => {
        setIsRecording(false)
      }

      setRecognition(recognitionInstance)
    }
  }, [recordedSamples.length])

  const startRecordingSample = useCallback(() => {
    if (recognition) {
      setIsRecording(true)
      recognition.start()
    }
  }, [recognition])

  const handleCreateCommand = useCallback(() => {
    if (!newCommand.name || !newCommand.description || recordedSamples.length === 0) {
      toast.error('Please provide a name, description, and at least one training sample')
      return
    }

    const command: CustomVoiceCommand = {
      id: `custom-${Date.now()}`,
      name: newCommand.name,
      description: newCommand.description,
      phrases: recordedSamples,
      actionType: newCommand.actionType || 'insert-code',
      actionData: newCommand.actionData || '',
      createdAt: new Date(),
      trainingSamples: recordedSamples,
      isActive: true,
    }

    setCustomCommands(prev => [...(prev || []), command])
    
    toast.success(
      <div>
        <div className="font-semibold">Custom Command Created!</div>
        <div className="text-xs mt-1">"{command.name}" is now active</div>
      </div>
    )

    setIsTrainingDialogOpen(false)
    resetTrainingForm()
  }, [newCommand, recordedSamples, setCustomCommands])

  const resetTrainingForm = useCallback(() => {
    setNewCommand({
      name: '',
      description: '',
      phrases: [],
      actionType: 'insert-code',
      actionData: '',
      trainingSamples: [],
      isActive: true,
    })
    setRecordedSamples([])
    setCurrentRecordingIndex(0)
  }, [])

  const deleteCommand = useCallback((commandId: string) => {
    setCustomCommands(prev => (prev || []).filter(cmd => cmd.id !== commandId))
    toast.success('Custom command deleted')
  }, [setCustomCommands])

  const toggleCommandActive = useCallback((commandId: string) => {
    setCustomCommands(prev => 
      (prev || []).map(cmd => 
        cmd.id === commandId ? { ...cmd, isActive: !cmd.isActive } : cmd
      )
    )
  }, [setCustomCommands])

  const testCommand = useCallback(async (command: CustomVoiceCommand) => {
    toast.info(`Testing command: ${command.name}`)
    
    switch (command.actionType) {
      case 'insert-code':
        onCodeInsert(command.actionData)
        toast.success('Code inserted')
        break
      
      case 'ai-generate':
        try {
          const prompt = spark.llmPrompt`${command.actionData}
          
Generate code in ${currentLanguage} based on the above instruction.
Only return the code, no explanations.`
          
          toast.loading('AI generating code...')
          const code = await spark.llm(prompt, 'gpt-4o')
          const cleanedCode = code.replace(/```[\w]*\n?/g, '').trim()
          onCodeInsert(cleanedCode)
          toast.success('AI-generated code inserted')
        } catch (error) {
          toast.error('Failed to generate code')
        }
        break
      
      case 'run-command':
        onCommandExecute(command)
        toast.success('Command executed')
        break
      
      case 'custom-script':
        try {
          const scriptFunction = new Function('onCodeInsert', 'currentLanguage', command.actionData)
          scriptFunction(onCodeInsert, currentLanguage)
          toast.success('Custom script executed')
        } catch (error) {
          toast.error('Failed to execute custom script')
        }
        break
    }
  }, [onCodeInsert, onCommandExecute, currentLanguage])

  const activeCommands = (customCommands || []).filter(cmd => cmd.isActive)
  const inactiveCommands = (customCommands || []).filter(cmd => !cmd.isActive)

  return (
    <div className="h-full flex flex-col bg-[var(--card)] border-l border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightning className="h-5 w-5 text-primary" weight="duotone" />
            <h3 className="font-semibold text-sm">Custom Voice Commands</h3>
          </div>
          <Badge variant="default" className="text-xs">
            {activeCommands.length} Active
          </Badge>
        </div>

        <Button
          onClick={() => setIsTrainingDialogOpen(true)}
          variant="default"
          className="w-full"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Train New Command
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {activeCommands.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold mb-2 flex items-center gap-2">
                <Sparkle className="h-3 w-3" />
                Active Commands
              </h4>
              <div className="space-y-2">
                {activeCommands.map((cmd) => (
                  <Card key={cmd.id} className="p-3 bg-gradient-to-r from-primary/10 to-accent/10">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <div className="text-sm font-semibold flex items-center gap-2">
                          {cmd.name}
                          <Badge variant="secondary" className="text-[10px]">
                            {cmd.actionType}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {cmd.description}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => testCommand(cmd)}
                          title="Test command"
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => toggleCommandActive(cmd.id)}
                          title="Deactivate"
                        >
                          <Check className="h-3 w-3 text-green-500" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => deleteCommand(cmd.id)}
                          title="Delete"
                        >
                          <Trash className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {cmd.phrases.slice(0, 3).map((phrase, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">
                          "{phrase}"
                        </Badge>
                      ))}
                      {cmd.phrases.length > 3 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{cmd.phrases.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {inactiveCommands.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
                  Inactive Commands
                </h4>
                <div className="space-y-2">
                  {inactiveCommands.map((cmd) => (
                    <Card key={cmd.id} className="p-3 opacity-50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="text-sm font-semibold">{cmd.name}</div>
                          <div className="text-xs text-muted-foreground">{cmd.description}</div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => toggleCommandActive(cmd.id)}
                            title="Activate"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => deleteCommand(cmd.id)}
                            title="Delete"
                          >
                            <Trash className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeCommands.length === 0 && inactiveCommands.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BookmarkSimple className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No custom commands yet</p>
              <p className="text-xs mt-1">Train your first voice command to get started</p>
            </div>
          )}

          <Separator />

          <div className="text-xs text-muted-foreground space-y-1 bg-muted/20 rounded p-3">
            <p className="font-semibold">💡 Command Types:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Insert Code:</strong> Insert predefined code snippets</li>
              <li><strong>AI Generate:</strong> Use AI to generate code from instructions</li>
              <li><strong>Run Command:</strong> Execute editor commands</li>
              <li><strong>Custom Script:</strong> Run custom JavaScript</li>
            </ul>
          </div>
        </div>
      </ScrollArea>

      <Dialog open={isTrainingDialogOpen} onOpenChange={setIsTrainingDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightning className="h-5 w-5 text-primary" />
              Train Custom Voice Command
            </DialogTitle>
            <DialogDescription>
              Create a personalized voice command by recording how you naturally say it
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="command-name">Command Name</Label>
                <Input
                  id="command-name"
                  placeholder="e.g., Create React Component"
                  value={newCommand.name}
                  onChange={(e) => setNewCommand(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="command-description">Description</Label>
                <Input
                  id="command-description"
                  placeholder="What does this command do?"
                  value={newCommand.description}
                  onChange={(e) => setNewCommand(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <Separator />

              <div>
                <Label className="mb-2 block">Voice Training Samples (3-5 recommended)</Label>
                <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Record yourself saying this command in different ways. The system will learn to recognize your natural speech patterns.
                  </p>
                  
                  <Button
                    onClick={startRecordingSample}
                    disabled={isRecording}
                    variant={isRecording ? 'destructive' : 'default'}
                    className="w-full"
                  >
                    <Microphone className={`h-4 w-4 mr-2 ${isRecording ? 'animate-pulse' : ''}`} />
                    {isRecording ? 'Recording... Speak now!' : `Record Sample ${recordedSamples.length + 1}`}
                  </Button>

                  <AnimatePresence>
                    {recordedSamples.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <div className="text-xs font-semibold">Recorded Samples:</div>
                        {recordedSamples.map((sample, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 bg-background rounded p-2"
                          >
                            <Badge variant="outline" className="text-[10px]">{i + 1}</Badge>
                            <span className="text-xs flex-1 font-mono">"{sample}"</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => setRecordedSamples(prev => prev.filter((_, idx) => idx !== i))}
                            >
                              <Trash className="h-3 w-3" />
                            </Button>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <Separator />

              <div>
                <Label htmlFor="action-type">Action Type</Label>
                <Select
                  value={newCommand.actionType}
                  onValueChange={(value: any) => setNewCommand(prev => ({ ...prev, actionType: value }))}
                >
                  <SelectTrigger id="action-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="insert-code">Insert Code Snippet</SelectItem>
                    <SelectItem value="ai-generate">AI Code Generation</SelectItem>
                    <SelectItem value="run-command">Run Editor Command</SelectItem>
                    <SelectItem value="custom-script">Custom JavaScript</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newCommand.actionType === 'insert-code' && (
                <div>
                  <Label htmlFor="code-snippet">Code Snippet to Insert</Label>
                  <Textarea
                    id="code-snippet"
                    placeholder="Enter the code that will be inserted when this command is triggered..."
                    rows={6}
                    className="font-mono text-xs"
                    value={newCommand.actionData}
                    onChange={(e) => setNewCommand(prev => ({ ...prev, actionData: e.target.value }))}
                  />
                </div>
              )}

              {newCommand.actionType === 'ai-generate' && (
                <div>
                  <Label htmlFor="ai-prompt">AI Generation Prompt</Label>
                  <Textarea
                    id="ai-prompt"
                    placeholder="Describe what code the AI should generate..."
                    rows={4}
                    value={newCommand.actionData}
                    onChange={(e) => setNewCommand(prev => ({ ...prev, actionData: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Example: "Create a React functional component with useState hook"
                  </p>
                </div>
              )}

              {newCommand.actionType === 'run-command' && (
                <div>
                  <Label htmlFor="command-id">Command ID</Label>
                  <Input
                    id="command-id"
                    placeholder="e.g., save, format, run"
                    value={newCommand.actionData}
                    onChange={(e) => setNewCommand(prev => ({ ...prev, actionData: e.target.value }))}
                  />
                </div>
              )}

              {newCommand.actionType === 'custom-script' && (
                <div>
                  <Label htmlFor="custom-script">Custom JavaScript Code</Label>
                  <Textarea
                    id="custom-script"
                    placeholder="Write custom JavaScript... Available: onCodeInsert(code), currentLanguage"
                    rows={6}
                    className="font-mono text-xs"
                    value={newCommand.actionData}
                    onChange={(e) => setNewCommand(prev => ({ ...prev, actionData: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Example: onCodeInsert(`// Generated at ${'{'}new Date().toISOString(){'}'}`)
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => {
              setIsTrainingDialogOpen(false)
              resetTrainingForm()
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCommand}
              disabled={!newCommand.name || !newCommand.description || recordedSamples.length === 0}
            >
              <Sparkle className="h-4 w-4 mr-2" />
              Create Command
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
