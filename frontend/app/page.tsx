'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatTime } from '@/lib/utils'
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react'

interface Sport {
  id: string
  name: string
  defaultDuration: number // in seconds
  periods: number
}

const sports: Sport[] = [
  { id: 'football', name: 'Football', defaultDuration: 2700, periods: 2 }, // 45 min periods
  { id: 'basketball', name: 'Basketball', defaultDuration: 1200, periods: 4 }, // 12 min quarters
  { id: 'tennis', name: 'Tennis', defaultDuration: 1800, periods: 3 }, // 30 min sets
  { id: 'volleyball', name: 'Volleyball', defaultDuration: 1800, periods: 5 }, // 30 min sets
  { id: 'horseball', name: 'Horseball', defaultDuration: 600, periods: 2 }, // 10 min periods
  { id: 'custom', name: 'Custom', defaultDuration: 1800, periods: 1 }
]

export default function Home() {
  const [selectedSport, setSelectedSport] = useState<string>('football')
  const [timeLeft, setTimeLeft] = useState<number>(2700)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [isCountUp, setIsCountUp] = useState<boolean>(false)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const [team1Score, setTeam1Score] = useState<number>(0)
  const [team2Score, setTeam2Score] = useState<number>(0)
  const [team1Name, setTeam1Name] = useState<string>('Team 1')
  const [team2Name, setTeam2Name] = useState<string>('Team 2')

  const currentSport = sports.find(sport => sport.id === selectedSport)

  useEffect(() => {
    if (currentSport) {
      setTimeLeft(currentSport.defaultDuration)
      setElapsedTime(0)
    }
  }, [selectedSport])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        if (isCountUp) {
          setElapsedTime(prev => prev + 1)
        } else {
          setTimeLeft(prev => {
            if (prev <= 1) {
              setIsRunning(false)
              return 0
            }
            return prev - 1
          })
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, isCountUp])

  const handleStart = () => {
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    if (currentSport) {
      setTimeLeft(currentSport.defaultDuration)
      setElapsedTime(0)
    }
  }

  const handleToggleMode = () => {
    setIsCountUp(!isCountUp)
    setIsRunning(false)
    if (currentSport) {
      setTimeLeft(currentSport.defaultDuration)
      setElapsedTime(0)
    }
  }

  const displayTime = isCountUp ? elapsedTime : timeLeft

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Match Count Down
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timer Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Timer
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleMode}
                  className="text-xs"
                >
                  {isCountUp ? 'Countdown' : 'Count Up'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sport Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Sport</label>
                <Select value={selectedSport} onValueChange={setSelectedSport}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {sports.map((sport) => (
                      <SelectItem key={sport.id} value={sport.id}>
                        {sport.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Timer Display */}
              <div className="text-center">
                <div className="text-6xl font-mono font-bold text-gray-800 mb-4">
                  {formatTime(displayTime)}
                </div>
                <div className="text-sm text-gray-600">
                  {currentSport?.periods} {currentSport?.periods === 1 ? 'period' : 'periods'} • {formatTime(currentSport?.defaultDuration || 0)}
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex justify-center space-x-2">
                <Button
                  onClick={isRunning ? handlePause : handleStart}
                  variant={isRunning ? "secondary" : "default"}
                  size="lg"
                >
                  {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isRunning ? 'Pause' : 'Start'}
                </Button>
                <Button onClick={handleReset} variant="outline" size="lg">
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Scoreboard Section */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Scoreboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Team Names */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Team 1</label>
                  <input
                    type="text"
                    value={team1Name}
                    onChange={(e) => setTeam1Name(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Team 2</label>
                  <input
                    type="text"
                    value={team2Name}
                    onChange={(e) => setTeam2Name(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Score Display */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-800 mb-2">{team1Score}</div>
                  <div className="text-sm text-gray-600">{team1Name}</div>
                  <div className="flex justify-center space-x-1 mt-2">
                    <Button
                      onClick={() => setTeam1Score(prev => Math.max(0, prev - 1))}
                      variant="outline"
                      size="sm"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => setTeam1Score(prev => prev + 1)}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-800 mb-2">{team2Score}</div>
                  <div className="text-sm text-gray-600">{team2Name}</div>
                  <div className="flex justify-center space-x-1 mt-2">
                    <Button
                      onClick={() => setTeam2Score(prev => Math.max(0, prev - 1))}
                      variant="outline"
                      size="sm"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => setTeam2Score(prev => prev + 1)}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Reset Scores */}
              <div className="text-center">
                <Button
                  onClick={() => {
                    setTeam1Score(0)
                    setTeam2Score(0)
                  }}
                  variant="outline"
                  size="sm"
                >
                  Reset Scores
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 