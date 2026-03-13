<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue'
import { Score } from './types'

interface Player {
  name: string
  currentScore: Score
  gamesWon: number
}

interface GameState {
  player1: Player
  player2: Player
  history: Array<{
    player1Score: Score
    player2Score: Score
    timestamp: number
  }>
}

export default defineComponent({
  name: 'TraditionalAutomaton',
  
  props: {
    player1Name: {
      type: String,
      required: true
    },
    player2Name: {
      type: String,
      required: true
    },
    theme: {
      type: String,
      default: 'light',
      validator: (value: string) => ['light', 'dark'].includes(value)
    }
  },

  setup(props, { emit }) {
    // State Management
    const gameState = ref<GameState>({
      player1: {
        name: props.player1Name,
        currentScore: Score.LOVE,
        gamesWon: 0
      },
      player2: {
        name: props.player2Name,
        currentScore: Score.LOVE,
        gamesWon: 0
      },
      history: []
    })

    const isAnimating = ref(false)
    const currentTransition = ref<string | null>(null)

    // Score Sequence Map
    const scoreSequence = {
      [Score.LOVE]: Score.FIFTEEN,
      [Score.FIFTEEN]: Score.THIRTY,
      [Score.THIRTY]: Score.FORTY,
      [Score.FORTY]: Score.GAME
    }

    // Methods
    const recordState = () => {
      gameState.value.history.push({
        player1Score: gameState.value.player1.currentScore,
        player2Score: gameState.value.player2.currentScore,
        timestamp: Date.now()
      })
    }

    const resetScores = () => {
      gameState.value.player1.currentScore = Score.LOVE
      gameState.value.player2.currentScore = Score.LOVE
      recordState()
    }

    const getScoreLabel = (score: Score): string => {
      return Score[score].toString()
    }

    const handleScorePoint = async (scoringPlayerNum: 1 | 2) => {
      if (isAnimating.value) return

      isAnimating.value = true
      const scoringPlayer = scoringPlayerNum === 1 ? gameState.value.player1 : gameState.value.player2
      const otherPlayer = scoringPlayerNum === 1 ? gameState.value.player2 : gameState.value.player1

      if (scoringPlayer.currentScore === Score.FORTY) {
        // Game point
        currentTransition.value = 'game-point'
        await animateTransition()
        scoringPlayer.currentScore = Score.GAME
        scoringPlayer.gamesWon++
        recordState()
        
        // Small delay before reset
        await new Promise(resolve => setTimeout(resolve, 1000))
        resetScores()
      } else {
        // Regular point
        currentTransition.value = 'point-scored'
        await animateTransition()
        scoringPlayer.currentScore = scoreSequence[scoringPlayer.currentScore]
        recordState()
      }

      isAnimating.value = false
      emit('state-updated', {
        player1: { ...gameState.value.player1 },
        player2: { ...gameState.value.player2 },
        history: [...gameState.value.history]
      })
    }

    const animateTransition = async () => {
      // Placeholder for transition animation
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    const getPerformanceMetrics = () => {
      return {
        totalStates: gameState.value.history.length,
        stateChangesPerGame: gameState.value.history.length / 
          (gameState.value.player1.gamesWon + gameState.value.player2.gamesWon || 1),
        memoryUsage: JSON.stringify(gameState.value).length
      }
    }

    // Lifecycle
    onMounted(() => {
      recordState() // Record initial state
    })

    return {
      gameState,
      isAnimating,
      currentTransition,
      handleScorePoint,
      getScoreLabel,
      getPerformanceMetrics
    }
  }
})
</script>

<template>
  <div 
    class="automaton-container"
    :class="[theme, { 'is-animating': isAnimating }]"
  >
    <!-- Score Display -->
    <div class="score-display">
      <div class="player-score">
        <h3>{{ gameState.player1.name }}</h3>
        <div class="score">{{ getScoreLabel(gameState.player1.currentScore) }}</div>
        <div class="games">Games: {{ gameState.player1.gamesWon }}</div>
      </div>
      
      <div class="vs">VS</div>
      
      <div class="player-score">
        <h3>{{ gameState.player2.name }}</h3>
        <div class="score">{{ getScoreLabel(gameState.player2.currentScore) }}</div>
        <div class="games">Games: {{ gameState.player2.gamesWon }}</div>
      </div>
    </div>

    <!-- Controls -->
    <div class="controls">
      <button 
        class="score-btn"
        :disabled="isAnimating"
        @click="handleScorePoint(1)"
      >
        Point for {{ gameState.player1.name }}
      </button>
      
      <button 
        class="score-btn"
        :disabled="isAnimating"
        @click="handleScorePoint(2)"
      >
        Point for {{ gameState.player2.name }}
      </button>
    </div>

    <!-- State History -->
    <div class="state-history">
      <h4>State History</h4>
      <div class="history-container">
        <div 
          v-for="(state, index) in gameState.history"
          :key="state.timestamp"
          class="history-entry"
        >
          <div class="point-number">Point {{ index + 1 }}</div>
          <div class="point-scores">
            {{ gameState.player1.name }}: {{ getScoreLabel(state.player1Score) }} | 
            {{ gameState.player2.name }}: {{ getScoreLabel(state.player2Score) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Metrics -->
    <div class="metrics">
      <h4>Performance Metrics</h4>
      <div class="metrics-grid">
        <div class="metric">
          <span class="label">Total States:</span>
          <span class="value">{{ getPerformanceMetrics().totalStates }}</span>
        </div>
        <div class="metric">
          <span class="label">States/Game:</span>
          <span class="value">{{ getPerformanceMetrics().stateChangesPerGame.toFixed(2) }}</span>
        </div>
        <div class="metric">
          <span class="label">Memory Usage:</span>
          <span class="value">{{ getPerformanceMetrics().memoryUsage }} bytes</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.automaton-container {
  padding: 2rem;
  border-radius: 8px;
  background: var(--background-primary);
  max-width: 800px;
  margin: 0 auto;
  font-family: var(--font-family-primary);
}

.score-display {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.player-score {
  text-align: center;
  padding: 1rem;
  background: var(--background-secondary);
  border-radius: 8px;
  min-width: 200px;
}

.score {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--primary-red);
  margin: 0.5rem 0;
}

.games {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.vs {
  font-weight: bold;
  color: var(--text-secondary);
}

.controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.score-btn {
  padding: 0.75rem 1.5rem;
  background: var(--secondary-purple);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.score-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.score-btn:not(:disabled):hover {
  background: var(--secondary-purple-dark);
  transform: translateY(-2px);
}

.state-history {
  margin-bottom: 2rem;
}

.history-container {
  max-height: 200px;
  overflow-y: auto;
  padding: 1rem;
  background: var(--background-secondary);
  border-radius: 4px;
}

.history-entry {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.point-number {
  font-weight: bold;
  color: var(--text-secondary);
}

.metrics {
  background: var(--background-secondary);
  padding: 1rem;
  border-radius: 4px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.metric {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  background: var(--background-tertiary);
  border-radius: 4px;
}

.label {
  color: var(--text-secondary);
}

.value {
  font-weight: bold;
  color: var(--text-primary);
}

/* Theme Variations */
.dark {
  --background-primary: #1a202c;
  --background-secondary: #2d3748;
  --background-tertiary: #4a5568;
  --text-primary: #f8f9fa;
  --text-secondary: #e2e8f0;
  --border-color: rgba(226, 232, 240, 0.2);
}

.light {
  --background-primary: #ffffff;
  --background-secondary: #f8f9fa;
  --background-tertiary: #f1f3f5;
  --text-primary: #2d3748;
  --text-secondary: #4a5568;
  --border-color: rgba(74, 85, 104, 0.2);
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
</style>

// types.ts
export enum Score {
  LOVE = 0,
  FIFTEEN = 15,
  THIRTY = 30,
  FORTY = 40,
  GAME = 1
}