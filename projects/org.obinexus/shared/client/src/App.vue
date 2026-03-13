<template>
    <div class="app">
        <!-- Navigation -->
        <nav class="nav">
            <router-link to="/" class="nav__logo">Nnamdi Okpala</router-link>
            <div class="nav__links">
                <router-link to="#about" class="nav__link">About</router-link>
                <router-link to="#projects" class="nav__link">Projects</router-link>
                <router-link to="#innovations" class="nav__link">Innovations</router-link>
                <router-link to="#contact" class="nav__link">Contact</router-link>
            </div>
        </nav>

        <!-- Hero Section -->
        <section class="hero">
            <div class="hero__content">
                <h1 class="hero__title">Software Engineer & Innovator</h1>
                <p class="hero__subtitle">Specializing in State Machine Optimization & Software Architecture</p>
                <router-link to="#contact" class="button">Get in Touch</router-link>
            </div>
        </section>

        <!-- Projects Section -->
        <section id="projects" class="projects">
            <h2 class="section-title">Featured Projects</h2>
            <div class="projects__grid">
                <!-- Automaton Project -->
                <article class="project-card">
                    <h3>Automaton State Minimization</h3>
                    <p>Advanced research and implementation in finite state machine optimization.</p>
                    <div class="project-demo">
                        <traditional-automaton 
                            player1-name="Player 1"
                            player2-name="Player 2"
                            theme="light"
                            @state-updated="handleStateUpdate"
                        />
                    </div>
                    <router-link to="/projects/automaton" class="button">Learn More</router-link>
                </article>

                <!-- Text Flow Patterns -->
                <article class="project-card">
                    <h3>Text Flow Patterns</h3>
                    <p>Implementation of F, T, and Z pattern layouts for optimal content readability.</p>
                    <div class="pattern-demos">
                        <text-flow-pattern 
                            :content="textFlowContent"
                            theme="light"
                        />
                    </div>
                    <router-link to="/projects/textflow" class="button">View Patterns</router-link>
                </article>

                <!-- Collatz Visualization -->
                <article class="project-card">
                    <h3>Collatz Visualization</h3>
                    <p>Interactive visualization of the Collatz conjecture with quantum computing insights.</p>
                    <collatz-analytics
                        :trajectories="collatzTrajectories"
                        :is-quantum="true"
                    />
                    <router-link to="/projects/collatz" class="button">Explore Data</router-link>
                </article>
            </div>
        </section>

        <!-- Innovations Section -->
        <section id="innovations" class="innovations">
            <div class="innovations__content">
                <h2 class="section-title">Innovative Approaches</h2>
                <text-flow-pattern 
                    pattern="Z"
                    :content="innovationsContent"
                    theme="light"
                />
            </div>
        </section>

        <!-- Skills Section -->
        <section class="skills">
            <h2 class="section-title">Technical Skills</h2>
            <div class="skills__grid">
                <div class="skill-card">
                    <h3>Frontend Development</h3>
                    <p>JavaScript, TypeScript, Vue.js, React</p>
                </div>
                <div class="skill-card">
                    <h3>Backend Development</h3>
                    <p>Node.js, Python, C++</p>
                </div>
                <div class="skill-card">
                    <h3>Software Architecture</h3>
                    <p>State Machines, Design Patterns</p>
                </div>
                <div class="skill-card">
                    <h3>Digital Arts</h3>
                    <p>Clip Studio Paint, Animation</p>
                </div>
            </div>
        </section>

        <!-- Contact Section -->
        <section id="contact" class="contact">
            <div class="contact__content">
                <h2 class="section-title">Get in Touch</h2>
                <p>Interested in collaboration? Let's discuss your project.</p>
                <a href="mailto:okpalan@protonmail.com" class="button">Email Me</a>
            </div>
        </section>

        <!-- Footer -->
        <footer class="footer">
            <p>&copy; {{ currentYear }} Nnamdi Okpala. All rights reserved.</p>
        </footer>
    </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import TraditionalAutomaton from '@/components/automaton/TraditionalAutomaton.vue'
import TextFlowPattern from '@/components/common/TextFlowPattern/TextFlowPattern.vue'
import CollatzAnalytics from '@/components/visualization/collatz/CollatzAnalytics.vue'
import type { Trajectory } from '@/components/visualization/collatz/types'

export default defineComponent({
    name: 'App',

    components: {
        TraditionalAutomaton,
        TextFlowPattern,
        CollatzAnalytics
    },

    setup() {
        // Sample data for components
        const textFlowContent = ref({
            title: "Modern Web Development",
            sections: [
                {
                    headerContent: "Efficient Patterns",
                    mainContent: "Implementing optimal reading patterns for web content.",
                    hasDropCap: true
                }
            ],
            pattern: 'F' as const
        })

        const collatzTrajectories = ref<Record<string, Trajectory[]>>({
            // Sample trajectory data
            '7': [{value: 7, probability: 1}, {value: 22, probability: 1}, {value: 11, probability: 1}]
        })

        const innovationsContent = ref({
            title: "Innovation Approach",
            sections: [
                {
                    leftContent: "State Machine Optimization",
                    rightContent: "Modern Web Architecture"
                }
            ],
            pattern: 'Z' as const
        })

        const currentYear = computed(() => new Date().getFullYear())

        const handleStateUpdate = (newState: any) => {
            console.log('State updated:', newState)
        }

        return {
            textFlowContent,
            collatzTrajectories,
            innovationsContent,
            currentYear,
            handleStateUpdate
        }
    }
})
</script>

<style>
/* Base styles */
:root {
    --primary-red: #F71735;
    --secondary-purple: #594157;
    --tertiary-teal: #046865;
    --accent-orange: #F18F01;
    --highlight-blue: #1170FF;
    --background-primary: #ffffff;
    --background-secondary: #f8f9fa;
    --background-tertiary: #f1f3f5;
    --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --font-family-mono: 'SF Mono', 'Fira Code', monospace;
}

/* App layout */
.app {
    font-family: var(--font-family-primary);
    color: var(--secondary-purple);
    background: var(--background-primary);
}

/* Component-specific styles */
.pattern-demos {
    margin: 1rem 0;
    padding: 1rem;
    background: var(--background-secondary);
    border-radius: 8px;
}

.project-demo {
    margin: 1rem 0;
    padding: 1rem;
    background: var(--background-secondary);
    border-radius: 8px;
    overflow: hidden;
}

/* Responsive Design */
@media (max-width: 768px) {
    .nav__links {
        display: none;
    }
    
    .hero__title {
        font-size: 2.5rem;
    }
    
    .projects__grid {
        grid-template-columns: 1fr;
    }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
    * {
        transition: none !important;
        animation: none !important;
    }
}
</style>