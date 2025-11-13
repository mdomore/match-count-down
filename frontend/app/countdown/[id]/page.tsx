'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatTime } from '@/lib/utils'
import { Play, Pause, RotateCcw, Plus, Minus, LogOut } from 'lucide-react'

interface CountdownData {
  id: string
  sport_id: string
  mode: 'countdown' | 'countup'
  state: 'stopped' | 'running' | 'paused'
  time_left: number
  elapsed_time: number
  team1_name: string
  team2_name: string
  team1_score: number
  team2_score: number
}

// Use Next.js API routes as proxy to backend
const API_BASE = typeof window !== 'undefined' ? '/matchcountdown/api' : ''

export default function CountdownPage() {
  const params = useParams()
  const router = useRouter()
  const countdownId = params.id as string

  const [countdown, setCountdown] = useState<CountdownData | null>(null)
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [isLiveAction, setIsLiveAction] = useState(false)
  const [team1Score, setTeam1Score] = useState(0)
  const [team2Score, setTeam2Score] = useState(0)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState<boolean>(false)
  const [passwordInput, setPasswordInput] = useState<string>('')
  const [passwordError, setPasswordError] = useState<string>('')

  useEffect(() => {
    // Check if admin status is stored in localStorage
    const storedAdmin = localStorage.getItem(`admin_${countdownId}`)
    if (storedAdmin === 'true') {
      setIsAdmin(true)
    }

    // Fetch initial countdown data
    const fetchCountdown = async () => {
      try {
        const response = await fetch(`${API_BASE}/countdowns/${countdownId}`)
        if (response.ok) {
          const data = await response.json()
          setCountdown(data)
          setTeam1Score(data.team1_score)
          setTeam2Score(data.team2_score)
          setIsLiveAction(data.state === 'running' || data.state === 'paused')
        } else {
          console.error('Failed to fetch countdown')
        }
      } catch (error) {
        console.error('Error fetching countdown:', error)
      }
    }

    fetchCountdown()

    // Try WebSocket connection first, fallback to polling if it fails
    const getWsUrl = () => {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return `${protocol}//${hostname}:3001`
        }
        // Use nginx proxy path for WebSocket
        return `${protocol}//${hostname}/matchcountdown/ws`
      }
      return 'ws://localhost:3001'
    }

    let websocket: WebSocket | null = null
    let pollInterval: NodeJS.Timeout | null = null
    let usePolling = false

    const connectWebSocket = () => {
      try {
        const wsUrl = getWsUrl()
        // wsUrl already includes /matchcountdown/ws for production, so just add the path
        const wsPath = typeof window !== 'undefined' && 
          (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
          ? `/countdowns/${countdownId}`  // Production: wsUrl already has /matchcountdown/ws
          : `/ws/countdowns/${countdownId}`  // Local: wsUrl is just hostname:port
        websocket = new WebSocket(`${wsUrl}${wsPath}`)

        websocket.onopen = () => {
          console.log('WebSocket connected')
          usePolling = false
          if (pollInterval) {
            clearInterval(pollInterval)
            pollInterval = null
          }
        }

        websocket.onmessage = (event) => {
          const message = JSON.parse(event.data)
          if (message.type === 'update' && message.data) {
            setCountdown(message.data)
            setTeam1Score(message.data.team1_score)
            setTeam2Score(message.data.team2_score)
            setIsLiveAction(
              message.data.state === 'running' || message.data.state === 'paused'
            )
          }
        }

        websocket.onerror = (error) => {
          console.warn('WebSocket error, falling back to polling:', error)
          usePolling = true
          if (websocket) {
            websocket.close()
            websocket = null
          }
          // Start polling as fallback
          startPolling()
        }

        websocket.onclose = () => {
          console.log('WebSocket closed')
          if (!usePolling) {
            // If not intentionally using polling, try to reconnect
            setTimeout(connectWebSocket, 2000)
          }
        }

        setWs(websocket)
      } catch (error) {
        console.warn('WebSocket connection failed, using polling:', error)
        usePolling = true
        startPolling()
      }
    }

    const startPolling = () => {
      if (pollInterval) return // Already polling
      
      console.log('Using polling for real-time updates')
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`${API_BASE}/countdowns/${countdownId}`)
          if (response.ok) {
            const data = await response.json()
            setCountdown(data)
            setTeam1Score(data.team1_score)
            setTeam2Score(data.team2_score)
            setIsLiveAction(
              data.state === 'running' || data.state === 'paused'
            )
          }
        } catch (error) {
          console.error('Polling error:', error)
        }
      }, 1000) // Poll every second
    }

    // Try WebSocket first
    connectWebSocket()

    // Fallback: if WebSocket doesn't connect within 2 seconds, use polling
    const fallbackTimer = setTimeout(() => {
      if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        console.log('WebSocket not connected, using polling')
        usePolling = true
        if (websocket) {
          websocket.close()
          websocket = null
        }
        startPolling()
      }
    }, 2000)

    return () => {
      clearTimeout(fallbackTimer)
      if (websocket) {
        websocket.close()
      }
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [countdownId])

  const handleVerifyAdmin = async () => {
    if (!passwordInput.trim()) {
      setPasswordError('Please enter a password')
      return
    }

    try {
      const response = await fetch(`${API_BASE}/countdowns/${countdownId}/verify-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      })

      if (response.ok) {
        setIsAdmin(true)
        setShowPasswordPrompt(false)
        setPasswordInput('')
        setPasswordError('')
        // Store admin status in localStorage
        localStorage.setItem(`admin_${countdownId}`, 'true')
      } else {
        setPasswordError('Invalid password')
      }
    } catch (error) {
      console.error('Error verifying admin:', error)
      setPasswordError('Failed to verify password')
    }
  }

  const handleLogout = () => {
    setIsAdmin(false)
    localStorage.removeItem(`admin_${countdownId}`)
  }

  const handleStartPause = async () => {
    if (!countdown || !isAdmin) return

    try {
      if (countdown.state === 'running') {
        const response = await fetch(`${API_BASE}/countdowns/${countdownId}/pause`, {
          method: 'POST',
        })
        if (!response.ok) {
          console.error('Failed to pause countdown')
        }
      } else {
        // Start from stopped or paused state
        const response = await fetch(`${API_BASE}/countdowns/${countdownId}/start`, {
          method: 'POST',
        })
        if (!response.ok) {
          console.error('Failed to start countdown')
        }
      }
      // State will be updated via WebSocket, no need to manually update
    } catch (error) {
      console.error('Error updating countdown:', error)
    }
  }

  const handleReset = async () => {
    if (!countdown) return

    try {
      await fetch(`${API_BASE}/countdowns/${countdownId}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    } catch (error) {
      console.error('Error resetting countdown:', error)
    }
  }

  const handleScoreChange = async (team: 'team1' | 'team2', delta: number) => {
    if (!countdown || !isAdmin) return

    const newScore = team === 'team1' 
      ? Math.max(0, team1Score + delta)
      : Math.max(0, team2Score + delta)

    try {
      await fetch(`${API_BASE}/countdowns/${countdownId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team, score: newScore }),
      })
    } catch (error) {
      console.error('Error updating score:', error)
    }
  }

  if (!countdown) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-800">Loading...</div>
        </div>
      </div>
    )
  }

  const displayTime = countdown.mode === 'countup' ? countdown.elapsed_time : countdown.time_left
  const getButtonLabel = () => {
    if (countdown.state === 'running') return 'Pause'
    if (countdown.state === 'paused') return 'Resume'
    return 'Start'
  }
  const primaryButtonLabel = getButtonLabel()
  const primaryButtonIcon = countdown.state === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />
  const team1DisplayName = countdown.team1_name.trim() || 'Team 1'
  const team2DisplayName = countdown.team2_name.trim() || 'Team 2'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-4 text-center">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="mb-2"
          >
            ← Back to Home
          </Button>
          <div className="text-sm text-gray-600">Countdown ID: {countdownId}</div>
          {!isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordPrompt(true)}
              className="mt-2"
            >
              Admin Access
            </Button>
          )}
          {isAdmin && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className="text-sm text-green-600 font-semibold">
                ✓ Admin Mode
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="ml-2"
              >
                <LogOut className="w-3 h-3 mr-1" />
                Logout
              </Button>
            </div>
          )}
        </div>

        {/* Password Prompt Modal */}
        {showPasswordPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
              <CardHeader>
                <CardTitle>Admin Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Enter Admin Password</label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value)
                      setPasswordError('')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleVerifyAdmin()
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  {passwordError && (
                    <p className="text-sm text-red-600">{passwordError}</p>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordPrompt(false)
                      setPasswordInput('')
                      setPasswordError('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleVerifyAdmin}>
                    Verify
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Match Count Down
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timer Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Timer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-3">
                <div className="font-mono font-bold text-6xl text-gray-800">
                  {formatTime(displayTime)}
                </div>
                <div className="text-sm text-gray-600">
                  Mode: {countdown.mode === 'countup' ? 'Count Up' : 'Countdown'}
                </div>
              </div>

              <div className="flex justify-center space-x-2">
                {isAdmin ? (
                  <>
                    <Button
                      onClick={handleStartPause}
                      variant={countdown.state === 'running' ? 'secondary' : 'default'}
                      size="lg"
                    >
                      {primaryButtonIcon}
                      {primaryButtonLabel}
                    </Button>
                    {!isLiveAction && (
                      <Button onClick={handleReset} variant="outline" size="lg">
                        <RotateCcw className="w-4 h-4" />
                        Reset
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    Admin access required to control timer
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scoreboard Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Scoreboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center space-y-3">
                  <div className="text-lg font-semibold text-gray-800">
                    {team1DisplayName}
                  </div>
                  <div className="text-4xl font-bold text-gray-800">
                    {team1Score}
                  </div>
                  {isAdmin ? (
                    <div className="flex justify-center space-x-1">
                      <Button
                        onClick={() => handleScoreChange('team1', -1)}
                        variant="outline"
                        size="sm"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => handleScoreChange('team1', 1)}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">View only</div>
                  )}
                </div>
                <div className="text-center space-y-3">
                  <div className="text-lg font-semibold text-gray-800">
                    {team2DisplayName}
                  </div>
                  <div className="text-4xl font-bold text-gray-800">
                    {team2Score}
                  </div>
                  {isAdmin ? (
                    <div className="flex justify-center space-x-1">
                      <Button
                        onClick={() => handleScoreChange('team2', -1)}
                        variant="outline"
                        size="sm"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => handleScoreChange('team2', 1)}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400">View only</div>
                  )}
                </div>
              </div>

              {!isLiveAction && isAdmin && (
                <div className="text-center">
                  <Button
                    onClick={() => {
                      handleScoreChange('team1', -team1Score)
                      handleScoreChange('team2', -team2Score)
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Reset Scores
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
