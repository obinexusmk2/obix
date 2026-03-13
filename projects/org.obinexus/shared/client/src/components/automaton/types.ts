// Tennis score state machine types

export enum Score {
  LOVE = 0,
  FIFTEEN = 15,
  THIRTY = 30,
  FORTY = 40,
  GAME = 50,
  DEUCE = 60,
  ADVANTAGE = 70
}

export interface PlayerState {
  name: string
  currentScore: Score
  gamesWon: number
}

export interface AutomatonState {
  player1: PlayerState
  player2: PlayerState
  isDeuce: boolean
  advantagePlayer: 1 | 2 | null
}
