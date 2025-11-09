import { useState, useEffect } from 'react'
import { User, SignOut, Crown } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface UserInfo {
  avatarUrl: string
  email: string
  id: string
  isOwner: boolean
  login: string
}

interface UserProfileProps {
  onUserLoaded?: (user: UserInfo) => void
}

export function UserProfile({ onUserLoaded }: UserProfileProps) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await window.spark.user()
        if (userData) {
          const normalizedUser: UserInfo = {
            avatarUrl: userData.avatarUrl || '',
            email: userData.email || '',
            id: String(userData.id),
            isOwner: userData.isOwner || false,
            login: userData.login || 'User'
          }
          setUser(normalizedUser)
          onUserLoaded?.(normalizedUser)
        }
      } catch (error) {
        console.error('Failed to load user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [onUserLoaded])

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-2">
        <div className="h-7 w-7 rounded-full bg-muted animate-pulse" />
      </div>
    )
  }

  if (!user) {
    return (
      <Button variant="ghost" size="sm" className="gap-2">
        <User className="h-4 w-4" />
        <span className="text-xs">Sign In</span>
      </Button>
    )
  }

  const initials = user.login
    .split(/[-_]/)
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 h-9 px-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.avatarUrl} alt={user.login} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium hidden sm:inline">{user.login}</span>
          {user.isOwner && (
            <Crown className="h-3.5 w-3.5 text-accent" weight="fill" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{user.login}</span>
              {user.isOwner && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Crown className="h-3 w-3" weight="fill" />
                  Owner
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground font-normal">
              {user.email}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-xs">
          <User className="h-4 w-4 mr-2" />
          Profile Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-xs text-muted-foreground">
          <SignOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
