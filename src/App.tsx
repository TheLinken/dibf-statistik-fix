import React, { useState, useEffect } from 'react'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'
import PlayerManager from './PlayerManager'
import MatchManager from './MatchManager'
import MatchHistory from './MatchHistory'

interface Player {
  id: string
  name: string
  position: string
  created_at: string
}

interface Match {
  id: string
  name: string
  created_at: string
}

interface PlayerStats {
  id: string
  name: string
  position: string
  gp: number
  goals: number
  assists: number
  points: number
  pim: number
  plusMinus: number
  wins: number
  saves: number
  goalsAgainst: number
}

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedMatchId, setSelectedMatchId] = useState<string>('')
  const [matches, setMatches] = useState<Match[]>([])
  const [stats, setStats] = useState<PlayerStats[]>([])
  const [activeTab, setActiveTab] = useState<'skaters' | 'goalies'>('skaters')

  // Auth / Inloggning
  const [user, setUser] = useState<User | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  // Sortering
  const [sortField, setSortField] = useState<keyof PlayerStats>('points')
  const [sortAsc, setSortAsc] = useState(false)

  // Lyssna på inloggningsstatus i Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    fetchMatches()
    fetchStats()
  }, [refreshKey, selectedMatchId])

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const fetchMatches = async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) {
      setMatches(data)
    }
  }

  const fetchStats = async () => {
    const { data: playersData } = await supabase.from('players').select('*').order('name')
    if (!playersData) return

    let query = supabase.from('player_match_stats').select('*')
    if (selectedMatchId) {
      query = query.eq('match_id', selectedMatchId)
    }

    const { data: statsData } = await query

    const calculatedStats: PlayerStats[] = playersData.map((player: Player) => {
      const playerMatchRows = statsData ? statsData.filter((s) => s.player_id === player.id) : []

      const gp = playerMatchRows.length
      const goals = playerMatchRows.reduce((sum, r) => sum + (r.goals || 0), 0)
      const assists = playerMatchRows.reduce((sum, r) => sum + (r.assists || 0), 0)
      const points = goals + assists
      const pim = playerMatchRows.reduce((sum, r) => sum + (r.penalty_minutes || 0), 0)
      const plusMinus = playerMatchRows.reduce((sum, r) => sum + (r.plus_minus || 0), 0)

      const wins = playerMatchRows.reduce((sum, r) => sum + (r.wins || 0), 0)
      const saves = playerMatchRows.reduce((sum, r) => sum + (r.saves || 0), 0)
      const goalsAgainst = playerMatchRows.reduce((sum, r) => sum + (r.goals_against || 0), 0)

      return {
        id: player.id,
        name: player.name,
        position: player.position || 'Forward',
        gp,
        goals,
        assists,
        points,
        pim,
        plusMinus,
        wins,
        saves,
        goalsAgainst,
      }
    })

    setStats(calculatedStats)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoginError('Fel e-post eller lösenord.')
    } else {
      setShowLoginModal(false)
      setEmail('')
      setPassword('')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleSort = (field: keyof PlayerStats) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  const skaters = stats.filter((p) => p.position !== 'Målvakt')
  const goalies = stats.filter((p) => p.position === 'Målvakt')

  const sortedData = [...(activeTab === 'skaters' ? skaters : goalies)].sort((a, b) => {
    const valA = a[sortField]
    const valB = b[sortField]

    if (valA < valB) return sortAsc ? -1 : 1
    if (valA > valB) return sortAsc ? 1 : -1
    return 0
  })

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#001F3F',
        color: '#E8E8E8',
        fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
        padding: '20px',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header med Inloggnings-knapp */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
            borderBottom: '2px solid #0059B3',
            paddingBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <h1 style={{ color: '#FFD25F', margin: 0, fontSize: '28px' }}>
              Innebandystatistik
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#B0C4DE', fontSize: '14px' }}>
              Spelar- och matchstatistik för laget
            </p>
          </div>

          <div>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: '#85D7FF' }}>
                  Inloggad som <strong>Admin</strong>
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #FFD25F',
                    color: '#FFD25F',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 'bold',
                  }}
                >
                  Logga ut
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                style={{
                  backgroundColor: '#003A73',
                  border: '1px solid #0059B3',
                  color: '#FFD25F',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 'bold',
                }}
              >
                🔒 Logga in som Admin
              </button>
            )}
          </div>
        </header>

        {/* ADMIN-SEKTIONER (Visas endast om man är inloggad) */}
        {user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
            <PlayerManager onPlayerAdded={triggerRefresh} />
            <MatchManager
              onStatsUpdated={triggerRefresh}
              refreshKey={refreshKey}
              selectedMatchId={selectedMatchId}
              setSelectedMatchId={setSelectedMatchId}
            />
          </div>
        )}

        {/* VISNINGS-SEKTION FÖR ALLA (BESÖKARE OCH ADMIN) */}
        <div
          style={{
            backgroundColor: '#002850',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid #0059B3',
          }}
        >
          {/* Matchfilter för besökare när de inte använder MatchManager */}
          {!user && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
                justifyContent: 'flex-end',
              }}
            >
              <label style={{ fontWeight: 'bold', fontSize: '14px', color: '#FFD25F' }}>
                Visa match:
              </label>
              <select
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #0059B3',
                  backgroundColor: '#001F3F',
                  color: '#E8E8E8',
                  fontSize: '14px',
                }}
              >
                <option value="">Alla matcher</option>
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tab-växlare Utespelare / Målvakter */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              borderBottom: '2px solid #0059B3',
              marginBottom: '20px',
            }}
          >
            <button
              onClick={() => {
                setActiveTab('skaters')
                setSortField('points')
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTab === 'skaters' ? '#0059B3' : 'transparent',
                color: activeTab === 'skaters' ? '#FFD25F' : '#B0C4DE',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              Utespelare ({skaters.length})
            </button>

            <button
              onClick={() => {
                setActiveTab('goalies')
                setSortField('wins')
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: activeTab === 'goalies' ? '#0059B3' : 'transparent',
                color: activeTab === 'goalies' ? '#FFD25F' : '#B0C4DE',
                border: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              Målvakter ({goalies.length})
            </button>
          </div>

          {/* Statistik-tabell */}
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '15px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#001F3F', color: '#FFD25F' }}>
                  <th
                    onClick={() => handleSort('name')}
                    style={{ padding: '12px', cursor: 'pointer' }}
                  >
                    Spelare {sortField === 'name' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th
                    onClick={() => handleSort('position')}
                    style={{ padding: '12px', cursor: 'pointer' }}
                  >
                    Position {sortField === 'position' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th
                    onClick={() => handleSort('gp')}
                    style={{ padding: '12px', cursor: 'pointer', textAlign: 'center' }}
                  >
                    ST {sortField === 'gp' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>

                  {activeTab === 'skaters' ? (
                    <>
                      <th
                        onClick={() => handleSort('goals')}
                        style={{ padding: '12px', cursor: 'pointer', textAlign: 'center' }}
                      >
                        Mål {sortField === 'goals' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th
                        onClick={() => handleSort('assists')}
                        style={{ padding: '12px', cursor: 'pointer', textAlign: 'center' }}
                      >
                        Ass {sortField === 'assists' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th
                        onClick={() => handleSort('points')}
                        style={{ padding: '12px', cursor: 'pointer', textAlign: 'center' }}
                      >
                        Poäng {sortField === 'points' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th
                        onClick={() => handleSort('pim')}
                        style={{ padding: '12px', cursor: 'pointer', textAlign: 'center' }}
                      >
                        UTV {sortField === 'pim' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th
                        onClick={() => handleSort('plusMinus')}
                        style={{ padding: '12px', cursor: 'pointer', textAlign: 'center' }}
                      >
                        +/- {sortField === 'plusMinus' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                    </>
                  ) : (
                    <>
                      <th
                        onClick={() => handleSort('wins')}
                        style={{ padding: '12px', cursor: 'pointer', textAlign: 'center' }}
                      >
                        Vinster {sortField === 'wins' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th
                        onClick={() => handleSort('saves')}
                        style={{ padding: '12px', cursor: 'pointer', textAlign: 'center' }}
                      >
                        Räddningar {sortField === 'saves' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                      <th
                        onClick={() => handleSort('goalsAgainst')}
                        style={{ padding: '12px', cursor: 'pointer', textAlign: 'center' }}
                      >
                        Insläppta {sortField === 'goalsAgainst' ? (sortAsc ? '▲' : '▼') : ''}
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{ padding: '20px', textAlign: 'center', color: '#B0C4DE' }}
                    >
                      Ingen statistik registrerad ännu.
                    </td>
                  </tr>
                ) : (
                  sortedData.map((player, idx) => (
                    <tr
                      key={player.id}
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#002850' : '#001F3F',
                        borderBottom: '1px solid #003A73',
                      }}
                    >
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{player.name}</td>
                      <td style={{ padding: '12px', color: '#B0C4DE' }}>{player.position}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{player.gp}</td>

                      {activeTab === 'skaters' ? (
                        <>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{player.goals}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {player.assists}
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              textAlign: 'center',
                              fontWeight: 'bold',
                              color: '#FFD25F',
                            }}
                          >
                            {player.points}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{player.pim}</td>
                          <td
                            style={{
                              padding: '12px',
                              textAlign: 'center',
                              color:
                                player.plusMinus > 0
                                  ? '#28a745'
                                  : player.plusMinus < 0
                                  ? '#dc3545'
                                  : '#E8E8E8',
                            }}
                          >
                            {player.plusMinus > 0 ? `+${player.plusMinus}` : player.plusMinus}
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{player.wins}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{player.saves}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            {player.goalsAgainst}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MATCHHISTORIK FÖR ALLA */}
        <div style={{ marginTop: '30px' }}>
          <MatchHistory refreshKey={refreshKey} />
        </div>
      </div>

      {/* LOGIN POPUP MODAL */}
      {showLoginModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: '#002850',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #0059B3',
              width: '100%',
              maxWidth: '380px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            <h2 style={{ margin: '0 0 16px 0', color: '#FFD25F', textAlign: 'center' }}>
              Admin Inloggning
            </h2>

            {loginError && (
              <div
                style={{
                  backgroundColor: '#dc3545',
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  textAlign: 'center',
                }}
              >
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                  E-post:
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #0059B3',
                    backgroundColor: '#001F3F',
                    color: '#E8E8E8',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}>
                  Lösenord:
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #0059B3',
                    backgroundColor: '#001F3F',
                    color: '#E8E8E8',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#003A73',
                    color: '#E8E8E8',
                    cursor: 'pointer',
                  }}
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#FFD25F',
                    color: '#002850',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Logga in
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}