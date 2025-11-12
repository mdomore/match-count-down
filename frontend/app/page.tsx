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

type HorseballPhase = 'period1' | 'pause' | 'period2' | 'completed'

const sports: Sport[] = [
  { id: 'football', name: 'Football', defaultDuration: 2700, periods: 2 }, // 45 min periods
  { id: 'football-u10', name: 'Football U10', defaultDuration: 1500, periods: 2 }, // 25 min periods
  { id: 'football-u11', name: 'Football U11', defaultDuration: 1500, periods: 2 }, // 25 min periods
  { id: 'football-u12', name: 'Football U12', defaultDuration: 1800, periods: 2 }, // 30 min periods
  { id: 'football-u13', name: 'Football U13', defaultDuration: 1800, periods: 2 }, // 30 min periods
  { id: 'basketball', name: 'Basketball', defaultDuration: 1200, periods: 4 }, // 12 min quarters
  { id: 'tennis', name: 'Tennis', defaultDuration: 1800, periods: 3 }, // 30 min sets
  { id: 'volleyball', name: 'Volleyball', defaultDuration: 1800, periods: 5 }, // 30 min sets
  { id: 'horseball', name: 'Horseball', defaultDuration: 600, periods: 2 }, // 10 min periods
  { id: 'custom', name: 'Custom', defaultDuration: 1800, periods: 1 }
]

const HORSEBALL_PHASE_DURATIONS: Record<HorseballPhase, number> = {
  period1: 600,
  pause: 180,
  period2: 600,
  completed: 0
}

const HORSEBALL_PHASE_LABELS: Record<HorseballPhase, string> = {
  period1: 'First Period',
  pause: 'Intermission',
  period2: 'Second Period',
  completed: 'Match Completed'
}

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
  const [customPeriodCount, setCustomPeriodCount] = useState<number>(1)
  const [customDurations, setCustomDurations] = useState<number[]>([30]) // minutes per period
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number>(0)
  const [isSportSelectorOpen, setIsSportSelectorOpen] = useState<boolean>(false)
  const [horseballPhase, setHorseballPhase] = useState<HorseballPhase>('period1')
  const [timeoutTimeLeft, setTimeoutTimeLeft] = useState<number>(0)
  const [isTimeoutRunning, setIsTimeoutRunning] = useState<boolean>(false)
  const [activeTimeoutTeam, setActiveTimeoutTeam] = useState<'team1' | 'team2' | null>(null)
  const [horseballTimeoutsUsed, setHorseballTimeoutsUsed] = useState<{
    period1: { team1: boolean; team2: boolean }
    period2: { team1: boolean; team2: boolean }
  }>({
    period1: { team1: false, team2: false },
    period2: { team1: false, team2: false }
  })
  const [pendingHorseballAutoStart, setPendingHorseballAutoStart] = useState<boolean>(false)
  const [hasStarted, setHasStarted] = useState<boolean>(false)
  const [horseballWasRunningBeforeTimeout, setHorseballWasRunningBeforeTimeout] = useState<boolean>(false)

  const currentSport = sports.find(sport => sport.id === selectedSport)
  const isCustom = selectedSport === 'custom'
  const isHorseball = selectedSport === 'horseball'
  const totalCustomDurationSeconds = customDurations.reduce((total, minutes) => total + Math.max(minutes, 0) * 60, 0)
  const selectedSportConfig = isCustom
    ? {
        id: 'custom',
        name: 'Custom',
        defaultDuration: totalCustomDurationSeconds,
        periods: customPeriodCount
      }
    : currentSport
  const currentPeriodDurationSeconds = isCustom
    ? (customDurations[selectedPeriodIndex] ?? customDurations[0] ?? 30) * 60
    : isHorseball
      ? HORSEBALL_PHASE_DURATIONS[horseballPhase]
      : selectedSportConfig?.defaultDuration ?? 0

  useEffect(() => {
    setSelectedPeriodIndex(0)
  }, [selectedSport])

  useEffect(() => {
    setPendingHorseballAutoStart(false)

    if (isHorseball) {
      setHorseballPhase('period1')
      setHorseballTimeoutsUsed({
        period1: { team1: false, team2: false },
        period2: { team1: false, team2: false }
      })
      setTimeLeft(HORSEBALL_PHASE_DURATIONS.period1)
      setElapsedTime(0)
      setIsRunning(false)
      setIsCountUp(false)
      setIsTimeoutRunning(false)
      setActiveTimeoutTeam(null)
      setTimeoutTimeLeft(0)
      return
    }

    if (isCustom) {
      setTimeLeft(currentPeriodDurationSeconds)
      setElapsedTime(0)
      setIsRunning(false)
      setIsTimeoutRunning(false)
      setActiveTimeoutTeam(null)
      setTimeoutTimeLeft(0)
      return
    }

    if (selectedSportConfig) {
      setTimeLeft(selectedSportConfig.defaultDuration)
      setElapsedTime(0)
      setIsRunning(false)
      setIsTimeoutRunning(false)
      setActiveTimeoutTeam(null)
      setTimeoutTimeLeft(0)
    }
  }, [selectedSport, isHorseball, isCustom, currentPeriodDurationSeconds, selectedSportConfig?.id, selectedSportConfig?.defaultDuration])

  useEffect(() => {
    if (!isHorseball) return

    if (horseballPhase === 'completed') {
      setTimeLeft(0)
      setElapsedTime(0)
      setIsRunning(false)
      setIsTimeoutRunning(false)
      setActiveTimeoutTeam(null)
      setTimeoutTimeLeft(0)
      setPendingHorseballAutoStart(false)
      setHasStarted(false)
      return
    }

    setTimeLeft(HORSEBALL_PHASE_DURATIONS[horseballPhase])
    setElapsedTime(0)
    setIsRunning(false)
    setIsTimeoutRunning(false)
    setActiveTimeoutTeam(null)
    setTimeoutTimeLeft(0)

    if (horseballPhase === 'period1') {
      setHorseballTimeoutsUsed({
        period1: { team1: false, team2: false },
        period2: { team1: false, team2: false }
      })
    } else if (horseballPhase === 'period2') {
      setHorseballTimeoutsUsed(prev => ({
        ...prev,
        period2: { team1: false, team2: false }
      }))
    }
    setHasStarted(false)
    setHorseballWasRunningBeforeTimeout(false)

    if (horseballPhase === 'pause' && pendingHorseballAutoStart) {
      setPendingHorseballAutoStart(false)
      setTimeout(() => {
        setIsRunning(true)
        setHasStarted(true)
      }, 0)
    }
  }, [horseballPhase, isHorseball, pendingHorseballAutoStart])

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
              setHasStarted(false)
              if (isCustom) {
                const nextIndex = selectedPeriodIndex + 1
                if (nextIndex < customPeriodCount) {
                  setSelectedPeriodIndex(nextIndex)
                  const nextDuration = (customDurations[nextIndex] ?? customDurations[0] ?? 30) * 60
                  setTimeLeft(nextDuration)
                  setElapsedTime(0)
                }
              } else if (isHorseball) {
                setElapsedTime(0)
                if (horseballPhase === 'period1') {
                  setHorseballPhase('pause')
                  setPendingHorseballAutoStart(true)
                } else if (horseballPhase === 'pause') {
                  setHorseballPhase('period2')
                } else if (horseballPhase === 'period2') {
                  setHorseballPhase('completed')
                }
              }
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
  }, [
    isRunning,
    isCountUp,
    isCustom,
    selectedPeriodIndex,
    customPeriodCount,
    customDurations,
    isHorseball,
    horseballPhase
  ])

  const handleStartPauseResume = () => {
    if (isTimeoutRunning) return
    if (isRunning) {
      setIsRunning(false)
    } else {
      setIsRunning(true)
      setHasStarted(true)
      setIsSportSelectorOpen(false)
    }
  }

  const handleReset = () => {
    setIsRunning(false)
    if (isTimeoutRunning) {
      setIsTimeoutRunning(false)
      setActiveTimeoutTeam(null)
      setTimeoutTimeLeft(0)
      setHorseballWasRunningBeforeTimeout(false)
    }

    if (isCustom) {
      setTimeLeft(currentPeriodDurationSeconds)
      setElapsedTime(0)
      return
    }

    if (isHorseball) {
      setHorseballPhase('period1')
      setHorseballTimeoutsUsed({
        period1: { team1: false, team2: false },
        period2: { team1: false, team2: false }
      })
      setTimeLeft(HORSEBALL_PHASE_DURATIONS.period1)
      setElapsedTime(0)
      setPendingHorseballAutoStart(false)
      setHasStarted(false)
      setHorseballWasRunningBeforeTimeout(false)
      return
    }

    if (selectedSportConfig) {
      setTimeLeft(selectedSportConfig.defaultDuration)
      setElapsedTime(0)
    }

    setHasStarted(false)
    setHorseballWasRunningBeforeTimeout(false)
  }

  const handleToggleMode = () => {
    if (isHorseball) {
      setIsRunning(false)
      return
    }

    setIsCountUp(!isCountUp)
    setIsRunning(false)
    if (isCustom) {
      setTimeLeft(currentPeriodDurationSeconds)
      setElapsedTime(0)
      setHasStarted(false)
      setHorseballWasRunningBeforeTimeout(false)
      return
    }

    if (selectedSportConfig) {
      setTimeLeft(selectedSportConfig.defaultDuration)
      setElapsedTime(0)
    }

    setHasStarted(false)
    setHorseballWasRunningBeforeTimeout(false)
  }

  const displayTime = isCountUp ? elapsedTime : timeLeft
  const isTimeoutActive = isTimeoutRunning && activeTimeoutTeam !== null
  const isLiveAction = isRunning || isTimeoutRunning
  const horseballPhaseText = HORSEBALL_PHASE_LABELS[horseballPhase].toUpperCase()
  const horseballTimeoutKey: 'period1' | 'period2' =
    horseballPhase === 'period2' || horseballPhase === 'completed' || horseballPhase === 'pause'
      ? 'period2'
      : 'period1'
  const horseballTimeoutState = horseballTimeoutsUsed[horseballTimeoutKey]
  const team1TimeoutUsed = horseballTimeoutState.team1
  const team2TimeoutUsed = horseballTimeoutState.team2
  const team1TimeoutDisabled =
    horseballPhase === 'pause' || horseballPhase === 'completed' || isTimeoutRunning || team1TimeoutUsed
  const team2TimeoutDisabled =
    horseballPhase === 'pause' || horseballPhase === 'completed' || isTimeoutRunning || team2TimeoutUsed
  const team1DisplayName = team1Name.trim() || 'Team 1'
  const team2DisplayName = team2Name.trim() || 'Team 2'
  const team1TimeoutLabel = team1TimeoutUsed
    ? `${team1DisplayName} Timeout (used)`
    : isTimeoutActive && activeTimeoutTeam === 'team1'
      ? `${team1DisplayName} Timeout (running)`
      : `${team1DisplayName} Timeout`
  const team2TimeoutLabel = team2TimeoutUsed
    ? `${team2DisplayName} Timeout (used)`
    : isTimeoutActive && activeTimeoutTeam === 'team2'
      ? `${team2DisplayName} Timeout (running)`
      : `${team2DisplayName} Timeout`
  const primaryButtonLabel = isRunning ? 'Pause' : hasStarted ? 'Resume' : 'Start'
  const primaryButtonIcon = isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />
  useEffect(() => {
    if (!isTimeoutRunning) return
    const interval = setInterval(() => {
      setTimeoutTimeLeft(prev => {
        if (prev <= 1) {
          setIsTimeoutRunning(false)
          setActiveTimeoutTeam(null)
          if (horseballWasRunningBeforeTimeout) {
            setHasStarted(true)
          }
          setHorseballWasRunningBeforeTimeout(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimeoutRunning, horseballWasRunningBeforeTimeout])

  const startHorseballTimeout = (team: 'team1' | 'team2') => {
    if (!isHorseball) return
    if (horseballPhase !== 'period1' && horseballPhase !== 'period2') return
    if (isTimeoutRunning) return
    if (!isRunning) return

    const periodKey = horseballPhase === 'period1' ? 'period1' : 'period2'
    if (horseballTimeoutsUsed[periodKey][team]) return

    setHorseballTimeoutsUsed(prev => ({
      ...prev,
      [periodKey]: {
        ...prev[periodKey],
        [team]: true
      }
    }))
    setHorseballWasRunningBeforeTimeout(isRunning)
    setIsRunning(false)
    setIsTimeoutRunning(true)
    setTimeoutTimeLeft(30)
    setActiveTimeoutTeam(team)
  }

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
                {!isLiveAction && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleMode}
                    className="text-xs"
                    disabled={isHorseball}
                  >
                    {isCountUp ? 'Countdown' : 'Count Up'}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sport Selection */}
              {!isLiveAction && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Sport</span>
                    <button
                      type="button"
                      onClick={() => setIsSportSelectorOpen(prev => !prev)}
                      className="p-1 text-gray-300 transition hover:text-gray-600 focus:outline-none"
                      aria-label={isSportSelectorOpen ? 'Hide sport selection' : 'Show sport selection'}
                    >
                      {isSportSelectorOpen ? (
                        <Minus className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {!isSportSelectorOpen && (
                    <div className="text-xs text-gray-500 italic">
                      {selectedSportConfig?.name ?? 'Select a sport'}
                    </div>
                  )}
                  {isSportSelectorOpen && (
                    <Select
                      value={selectedSport}
                      onValueChange={(value) => {
                        setSelectedSport(value)
                        setIsSportSelectorOpen(false)
                      }}
                    >
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
                  )}
                </div>
              )}

              {isHorseball && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                      onClick={() => startHorseballTimeout('team1')}
                      variant="outline"
                      disabled={team1TimeoutDisabled}
                      className={team1TimeoutUsed ? 'border-dashed opacity-60' : undefined}
                    >
                      {team1TimeoutLabel}
                    </Button>
                    <Button
                      onClick={() => startHorseballTimeout('team2')}
                      variant="outline"
                      disabled={team2TimeoutDisabled}
                      className={team2TimeoutUsed ? 'border-dashed opacity-60' : undefined}
                    >
                      {team2TimeoutLabel}
                    </Button>
                  </div>
                </div>
              )}

              {!isLiveAction && isCustom && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Number of periods</label>
                    <input
                      type="number"
                      min={1}
                      value={customPeriodCount}
                      onChange={(e) => {
                        const value = Math.max(1, Number.parseInt(e.target.value, 10) || 1)
                        setCustomPeriodCount(value)
                        setSelectedPeriodIndex((prev) => Math.min(prev, value - 1))
                        setCustomDurations((prev) => {
                          if (value === prev.length) return prev
                          if (value > prev.length) {
                            return [...prev, ...Array.from({ length: value - prev.length }, () => prev[prev.length - 1] ?? 30)]
                          }
                          return prev.slice(0, value)
                        })
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Active period</label>
                    <Select
                      value={String(selectedPeriodIndex)}
                      onValueChange={(value) => {
                        const index = Number.parseInt(value, 10)
                        if (!Number.isNaN(index)) {
                          setSelectedPeriodIndex(index)
                          setIsRunning(false)
                          setElapsedTime(0)
                          setTimeLeft((customDurations[index] ?? customDurations[0] ?? 30) * 60)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: customPeriodCount }).map((_, index) => (
                          <SelectItem key={index} value={String(index)}>
                            Period {index + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customDurations.slice(0, customPeriodCount).map((duration, index) => (
                      <div key={index} className="space-y-2">
                        <label className="text-sm font-medium">Period {index + 1} (minutes)</label>
                        <input
                          type="number"
                          min={1}
                          value={duration}
                          onChange={(e) => {
                            const value = Math.max(1, Number.parseInt(e.target.value, 10) || 1)
                            setCustomDurations((prev) => {
                              const next = [...prev]
                              next[index] = value
                              return next
                            })
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total match duration: {formatTime(totalCustomDurationSeconds)}
                  </div>
                </div>
              )}

              {/* Timer Display */}
              <div className="text-center space-y-3">
                <div
                  className={`font-mono font-bold ${
                    isTimeoutActive ? 'text-3xl text-gray-500' : 'text-6xl text-gray-800'
                  }`}
                >
                  {formatTime(displayTime)}
                </div>
                {isTimeoutActive && (
                  <div className="text-5xl font-mono font-bold text-gray-800">
                    Timeout: {formatTime(timeoutTimeLeft)}
                  </div>
                )}
                <div
                  className={`text-sm text-gray-600 ${
                    isHorseball ? 'font-semibold uppercase text-gray-700' : ''
                  }`}
                >
                  {isHorseball ? (
                    <>
                      {horseballPhaseText}
                    </>
                  ) : isCustom ? (
                    <>
                      Period {selectedPeriodIndex + 1} of {customPeriodCount} •{' '}
                      {formatTime(currentPeriodDurationSeconds)} (Total {formatTime(totalCustomDurationSeconds)})
                    </>
                  ) : (
                    <>
                      {selectedSportConfig?.periods}{' '}
                      {selectedSportConfig?.periods === 1 ? 'period' : 'periods'} •{' '}
                      {formatTime(selectedSportConfig?.defaultDuration || 0)}
                    </>
                  )}
                </div>
              </div>

              {/* Timer Controls */}
              <div className="flex justify-center space-x-2">
                <Button
                  onClick={handleStartPauseResume}
                  variant={isRunning ? "secondary" : "default"}
                  size="lg"
                  disabled={(isHorseball && horseballPhase === 'completed') || isTimeoutRunning}
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
              {!isLiveAction && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={team1Name}
                      onChange={(e) => setTeam1Name(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={team2Name}
                      onChange={(e) => setTeam2Name(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Score Display */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center space-y-2">
                    {isLiveAction && (
                      <div className="text-lg font-semibold text-gray-800">{team1DisplayName}</div>
                    )}
                    <div className={`text-4xl font-bold text-gray-800 ${!isLiveAction ? 'mt-[28px]' : ''}`}>
                      {team1Score}
                    </div>
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
                  <div className="text-center space-y-2">
                    {isLiveAction && (
                      <div className="text-lg font-semibold text-gray-800">{team2DisplayName}</div>
                    )}
                    <div className={`text-4xl font-bold text-gray-800 ${!isLiveAction ? 'mt-[28px]' : ''}`}>
                      {team2Score}
                    </div>
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
                {!isLiveAction && (
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
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 