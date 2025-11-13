'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Copy, Check } from 'lucide-react'

// Use Next.js API routes as proxy to backend
const API_BASE = typeof window !== 'undefined' ? '/matchcountdown/api' : ''

interface Sport {
  id: string
  name: string
  defaultDuration: number
  periods: number
}

export default function Home() {
  const router = useRouter()
  const [selectedSport, setSelectedSport] = useState<string>('football')
  const [mode, setMode] = useState<'countdown' | 'countup'>('countdown')
  const [team1Name, setTeam1Name] = useState<string>('Team 1')
  const [team2Name, setTeam2Name] = useState<string>('Team 2')
  const [adminPassword, setAdminPassword] = useState<string>('')
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(false)
  const [createdCountdownId, setCreatedCountdownId] = useState<string | null>(null)
  const [copied, setCopied] = useState<boolean>(false)

  useEffect(() => {
    // Fetch sports from backend
    fetch(`${API_BASE}/sports`)
      .then(res => res.json())
      .then(data => setSports(data))
      .catch(err => console.error('Error fetching sports:', err))
  }, [])

  const handleCreateCountdown = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/countdowns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport_id: selectedSport,
          mode: mode,
          team1_name: team1Name,
          team2_name: team2Name,
          admin_password: adminPassword,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setCreatedCountdownId(data.id)
        // Auto-redirect after 5 seconds, or user can click the link
        setTimeout(() => {
          router.push(`/countdown/${data.id}`)
        }, 5000)
      } else {
        console.error('Failed to create countdown')
      }
    } catch (error) {
      console.error('Error creating countdown:', error)
    } finally {
      setLoading(false)
    }
  }

  const countdownUrl = createdCountdownId 
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/matchcountdown/countdown/${createdCountdownId}`
    : ''

  const copyToClipboard = () => {
    if (countdownUrl) {
      navigator.clipboard.writeText(countdownUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (createdCountdownId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
            Match Count Down
          </h1>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Countdown Created!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <p className="text-center text-gray-700">
                  Your countdown has been created. Share this link with others:
                </p>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Shareable Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={countdownUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      className="min-w-[100px]"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-center space-x-2">
                  <Button
                    onClick={() => router.push(`/countdown/${createdCountdownId}`)}
                    size="lg"
                    className="flex-1"
                  >
                    Open Countdown
                  </Button>
                  <Button
                    onClick={() => {
                      setCreatedCountdownId(null)
                      setAdminPassword('')
                      setTeam1Name('Team 1')
                      setTeam2Name('Team 2')
                      setCopied(false)
                    }}
                    variant="outline"
                    size="lg"
                    className="flex-1"
                  >
                    Create Another
                  </Button>
                </div>

                <p className="text-xs text-center text-gray-500">
                  Redirecting to countdown in 5 seconds...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Match Count Down
        </h1>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Create New Countdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Sport</label>
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Mode</label>
              <Select value={mode} onValueChange={(v) => setMode(v as 'countdown' | 'countup')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="countdown">Countdown</SelectItem>
                  <SelectItem value="countup">Count Up</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Team 1 Name</label>
                <input
                  type="text"
                  value={team1Name}
                  onChange={(e) => setTeam1Name(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Team 2 Name</label>
                <input
                  type="text"
                  value={team2Name}
                  onChange={(e) => setTeam2Name(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Admin Password (optional)</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Leave empty for no password protection"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">
                Set a password to control who can start/pause and change scores. Viewers can see the countdown without a password.
              </p>
            </div>

            <Button
              onClick={handleCreateCountdown}
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? 'Creating...' : 'Create Countdown'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 