<script setup lang="ts">
import { ref, computed, onMounted, watch, reactive } from 'vue'
import SingleCard from './components/SingleCard.vue'
import { availableSets, availableLanguages, loadSetData } from './data/sets/index'

// Types
interface CardData {
  id: number
  name: string
  cost: number
  color: string
  rarity: string
  images: { full: string; thumbnail?: string }
  [key: string]: any
}

// Unique ID counter for cards
let cardUidCounter = 0

class Card {
  public uid: number
  constructor(public id: number, public set: string, public data: CardData) {
    this.uid = cardUidCounter++
  }
}

class CardStack {
  constructor(public cards: Card[]) {}
}

// Settings with realistic defaults based on official pull rates
const settings = reactive({
  // Booster structure
  nbBoosters: 6,
  nbCommons: 6,
  nbUncommons: 3,
  nbRareSlots: 2,
  nbFoils: 1,
  
  // Rare slot pull rates (must sum to 100)
  rareSlotRates: {
    rare: 65,        // ~65% - base rate
    superRare: 25,   // ~25% - 1 in 4
    legendary: 10,   // ~10% - 1 in 10
    enchanted: 0     // Disabled by default (officially ~1 in 72 packs)
  },
  
  // Foil slot pull rates (must sum to 100)
  foilSlotRates: {
    common: 40,
    uncommon: 30,
    rare: 15,
    superRare: 10,
    legendary: 4,
    enchanted: 1
  }
})

// Settings UI state
const showSettings = ref(false)

// Confirmation dialog state
const showConfirmDialog = ref(false)

// Export dialog state
const showExportDialog = ref(false)
const exportText = ref('')
const isExporting = ref(false)

// Auto-Sort toggle (global setting)
const autoSort = ref(false)

// View mode: 'boosters' or 'deck'
const currentView = ref<'boosters' | 'deck'>('boosters')

// Reactive state
const selectedLanguage = ref('en')
const selectedSet = ref('11')
const stacks = ref<CardStack[]>([])
const cardToPreview = ref<Card | null>(null)

// Deck state
const deckCards = ref<Card[]>([])

// Drag and Drop state
const isDragging = ref(false)
const isDragOverDeck = ref(false)
const isDragOverBoosters = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const cardsDatabase = ref<CardData[]>([])
const setInfo = ref<{ name: string } | null>(null)

// Computed
const hasCardToPreview = computed(() => cardToPreview.value !== null)

const availableSetsForLanguage = computed(() => {
  return availableSets.filter(set => set.languages.includes(selectedLanguage.value))
})

const isSetAvailable = computed(() => {
  const set = availableSets.find(s => s.code === selectedSet.value)
  return set?.languages.includes(selectedLanguage.value) ?? false
})

// Validate that rates sum to 100
const rareSlotRatesValid = computed(() => {
  const sum = Object.values(settings.rareSlotRates).reduce((a, b) => a + b, 0)
  return Math.abs(sum - 100) < 0.1
})

const foilSlotRatesValid = computed(() => {
  const sum = Object.values(settings.foilSlotRates).reduce((a, b) => a + b, 0)
  return Math.abs(sum - 100) < 0.1
})

// Color order for sorting
const colorOrder: Record<string, number> = {
  "Amber": 1,
  "Amethyst": 2,
  "Emerald": 3,
  "Ruby": 4,
  "Sapphire": 5,
  "Steel": 6
}

// Rarity mapping for all languages
const rarityMapping: Record<string, Record<string, string>> = {
  en: {
    "Common": "Common",
    "Uncommon": "Uncommon", 
    "Rare": "Rare",
    "Super Rare": "Super Rare",
    "Legendary": "Legendary",
    "Enchanted": "Enchanted",
    "Special": "Special"
  },
  de: {
    "Common": "Gewöhnlich",
    "Uncommon": "Ungewöhnlich",
    "Rare": "Selten",
    "Super Rare": "Episch",
    "Legendary": "Legendär",
    "Enchanted": "Verzaubert",
    "Special": "Speziell"
  },
  fr: {
    "Common": "Commune",
    "Uncommon": "Inhabituelle",
    "Rare": "Rare",
    "Super Rare": "Très Rare",
    "Legendary": "Légendaire",
    "Enchanted": "Enchantée",
    "Special": "Spécial"
  },
  it: {
    "Common": "Comune",
    "Uncommon": "Non comune",
    "Rare": "Rara",
    "Super Rare": "Super Rara",
    "Legendary": "Leggendaria",
    "Enchanted": "Incantata",
    "Special": "Speciale"
  }
}

// Get localized rarity name
function getLocalizedRarity(englishRarity: string): string {
  const langMap = rarityMapping[selectedLanguage.value] || rarityMapping.en
  return langMap[englishRarity] || englishRarity
}

// Card selection functions
function getRandomCardOfRarity(englishRarity: string): CardData | null {
  const localizedRarity = getLocalizedRarity(englishRarity)
  const cardsOfRarity = cardsDatabase.value.filter(c => c.rarity === localizedRarity)
  
  if (cardsOfRarity.length === 0) {
    return null
  }
  
  const randomPick = Math.floor(Math.random() * cardsOfRarity.length)
  return cardsOfRarity[randomPick]
}

// Get a random common card of a specific color
function getRandomCommonOfColor(color: string): CardData | null {
  const localizedRarity = getLocalizedRarity("Common")
  const cardsOfColorAndRarity = cardsDatabase.value.filter(
    c => c.rarity === localizedRarity && c.color === color
  )
  
  if (cardsOfColorAndRarity.length === 0) {
    return null
  }
  
  const randomPick = Math.floor(Math.random() * cardsOfColorAndRarity.length)
  return cardsOfColorAndRarity[randomPick]
}

// Pick rarity based on weighted rates
function pickRarityFromRates(rates: Record<string, number>): string {
  const rand = Math.random() * 100
  let cumulative = 0
  
  for (const [rarity, rate] of Object.entries(rates)) {
    cumulative += rate
    if (rand < cumulative) {
      // Convert key to proper rarity name
      const rarityMap: Record<string, string> = {
        common: "Common",
        uncommon: "Uncommon",
        rare: "Rare",
        superRare: "Super Rare",
        legendary: "Legendary",
        enchanted: "Enchanted"
      }
      return rarityMap[rarity] || rarity
    }
  }
  return "Rare" // fallback
}

function getRandomRareSlot(): CardData | null {
  const rarityPicked = pickRarityFromRates(settings.rareSlotRates)
  
  // Try selected rarity, fallback chain if not found
  let card = getRandomCardOfRarity(rarityPicked)
  if (!card && rarityPicked === "Enchanted") card = getRandomCardOfRarity("Legendary")
  if (!card && rarityPicked !== "Rare") card = getRandomCardOfRarity("Super Rare")
  if (!card) card = getRandomCardOfRarity("Rare")
  return card
}

function getRandomFoilSlot(): CardData | null {
  const rarityPicked = pickRarityFromRates(settings.foilSlotRates)
  
  // Try selected rarity, fallback to common if not found
  let card = getRandomCardOfRarity(rarityPicked)
  if (!card && rarityPicked !== "Common") {
    card = getRandomCardOfRarity("Common")
  }
  return card
}

function generateBooster(): CardStack {
  const cards: Card[] = []
  
  // Foil slots
  for (let c = 0; c < settings.nbFoils; c++) {
    const cardInfo = getRandomFoilSlot()
    if (cardInfo) {
      cards.push(new Card(cardInfo.id, selectedSet.value, cardInfo))
    }
  }
  
  // Rare+ slots
  for (let c = 0; c < settings.nbRareSlots; c++) {
    const cardInfo = getRandomRareSlot()
    if (cardInfo) {
      cards.push(new Card(cardInfo.id, selectedSet.value, cardInfo))
    }
  }
  
  // Uncommon slots
  for (let c = 0; c < settings.nbUncommons; c++) {
    const cardInfo = getRandomCardOfRarity("Uncommon")
    if (cardInfo) {
      cards.push(new Card(cardInfo.id, selectedSet.value, cardInfo))
    }
  }
  
  // Common slots - official distribution: one per color when 6 commons
  if (settings.nbCommons === 6) {
    // Official distribution: one common per color
    const colors = ["Amber", "Amethyst", "Emerald", "Ruby", "Sapphire", "Steel"]
    for (const color of colors) {
      const cardInfo = getRandomCommonOfColor(color)
      if (cardInfo) {
        cards.push(new Card(cardInfo.id, selectedSet.value, cardInfo))
      } else {
        // Fallback: if no common of this color exists, pick any common
        const fallbackCard = getRandomCardOfRarity("Common")
        if (fallbackCard) {
          cards.push(new Card(fallbackCard.id, selectedSet.value, fallbackCard))
        }
      }
    }
  } else {
    // Custom setting: random commons
    for (let c = 0; c < settings.nbCommons; c++) {
      const cardInfo = getRandomCardOfRarity("Common")
      if (cardInfo) {
        cards.push(new Card(cardInfo.id, selectedSet.value, cardInfo))
      }
    }
  }
  
  return new CardStack(cards)
}

// Actions
async function loadSet() {
  isLoading.value = true
  errorMessage.value = ''
  stacks.value = []
  cardToPreview.value = null
  
  try {
    const data = await loadSetData(selectedSet.value, selectedLanguage.value)
    cardsDatabase.value = data.cards
    setInfo.value = { name: data.name }
    generateBoosters()
  } catch (error) {
    errorMessage.value = `Failed to load set: ${error}`
    cardsDatabase.value = []
  } finally {
    isLoading.value = false
  }
}

function requestNewBoosters() {
  // If deck has cards, show confirmation dialog
  if (deckCards.value.length > 0) {
    showConfirmDialog.value = true
  } else {
    generateBoosters()
  }
}

function confirmNewBoosters() {
  showConfirmDialog.value = false
  generateBoosters()
}

function cancelNewBoosters() {
  showConfirmDialog.value = false
}

function generateBoosters() {
  if (cardsDatabase.value.length === 0) return
  
  // Clear boosters and deck
  stacks.value = []
  deckCards.value = []
  
  for (let n = 0; n < settings.nbBoosters; n++) {
    stacks.value.push(generateBooster())
  }
  
  applyAutoSort()
}

function preview(set: string, id: number, data: CardData) {
  cardToPreview.value = new Card(id, set, data)
}

function sortBoosters() {
  // Sort booster cards into stacks by cost
  const mixedCards: Card[] = []
  stacks.value.forEach(stack => {
    mixedCards.push(...stack.cards)
  })

  const newStacks: CardStack[] = []
  for (let cost = 1; cost < 6; cost++) {
    newStacks.push(new CardStack(mixedCards.filter(c => c.data.cost === cost)))
  }
  newStacks.push(new CardStack(mixedCards.filter(c => c.data.cost >= 6)))

  newStacks.forEach(ns => {
    ns.cards.sort((a, b) => {
      const colorA = colorOrder[a.data.color] || 99
      const colorB = colorOrder[b.data.color] || 99
      if (colorA !== colorB) return colorA - colorB
      return a.id - b.id
    })
  })

  stacks.value = newStacks
}

function sortDeck() {
  // Sort deck cards by cost, then color, then id
  deckCards.value.sort((a, b) => {
    if (a.data.cost !== b.data.cost) return a.data.cost - b.data.cost
    const colorA = colorOrder[a.data.color] || 99
    const colorB = colorOrder[b.data.color] || 99
    if (colorA !== colorB) return colorA - colorB
    return a.id - b.id
  })
}

function applyAutoSort() {
  if (autoSort.value) {
    sortBoosters()
    sortDeck()
  }
}

function resetSettings() {
  settings.nbBoosters = 6
  settings.nbCommons = 6
  settings.nbUncommons = 3
  settings.nbRareSlots = 2
  settings.nbFoils = 1
  settings.rareSlotRates = { rare: 65, superRare: 25, legendary: 10, enchanted: 0 }
  settings.foilSlotRates = { common: 40, uncommon: 30, rare: 15, superRare: 10, legendary: 4, enchanted: 1 }
}

// Drag and Drop functions
function onDragStart(event: DragEvent, card: Card) {
  isDragging.value = true
  event.dataTransfer?.setData('text/plain', card.uid.toString())
  event.dataTransfer!.effectAllowed = 'move'
}

function onDragEnd() {
  isDragging.value = false
  isDragOverDeck.value = false
  isDragOverBoosters.value = false
}

function onDragOverDeck(event: DragEvent) {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
  isDragOverDeck.value = true
}

function onDragLeaveDeck() {
  isDragOverDeck.value = false
}

function onDropOnDeck(event: DragEvent) {
  event.preventDefault()
  isDragOverDeck.value = false
  isDragging.value = false
  
  const cardUid = parseInt(event.dataTransfer?.getData('text/plain') || '')
  if (isNaN(cardUid)) return
  
  // Find and remove card from stacks
  for (const stack of stacks.value) {
    const cardIndex = stack.cards.findIndex(c => c.uid === cardUid)
    if (cardIndex !== -1) {
      const [card] = stack.cards.splice(cardIndex, 1)
      deckCards.value.push(card)
      applyAutoSort()
      break
    }
  }
}

function onDragOverBoosters(event: DragEvent) {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
  isDragOverBoosters.value = true
}

function onDragLeaveBoosters() {
  isDragOverBoosters.value = false
}

function onDropOnBoosters(event: DragEvent) {
  event.preventDefault()
  isDragOverBoosters.value = false
  isDragging.value = false
  
  const cardUid = parseInt(event.dataTransfer?.getData('text/plain') || '')
  if (isNaN(cardUid)) return
  
  // Find and remove card from deck
  const cardIndex = deckCards.value.findIndex(c => c.uid === cardUid)
  if (cardIndex !== -1) {
    const [card] = deckCards.value.splice(cardIndex, 1)
    // Add to first stack (or create one if empty)
    if (stacks.value.length === 0) {
      stacks.value.push(new CardStack([card]))
    } else {
      stacks.value[0].cards.push(card)
    }
    applyAutoSort()
  }
}

// Click-to-move functions
function moveCardToDeck(card: Card) {
  // Find and remove card from stacks
  for (const stack of stacks.value) {
    const cardIndex = stack.cards.findIndex(c => c.uid === card.uid)
    if (cardIndex !== -1) {
      stack.cards.splice(cardIndex, 1)
      deckCards.value.push(card)
      applyAutoSort()
      break
    }
  }
}

function moveCardToBoosters(card: Card) {
  const cardIndex = deckCards.value.findIndex(c => c.uid === card.uid)
  if (cardIndex !== -1) {
    deckCards.value.splice(cardIndex, 1)
    // Add to first stack (or create one if empty)
    if (stacks.value.length === 0) {
      stacks.value.push(new CardStack([card]))
    } else {
      stacks.value[0].cards.push(card)
    }
    applyAutoSort()
  }
}

// Export deck function
async function exportDeck() {
  if (deckCards.value.length === 0) return
  
  isExporting.value = true
  showExportDialog.value = true
  
  try {
    // Get English card names - load English data if current language is not English
    let englishCardMap: Map<number, string> = new Map()
    
    if (selectedLanguage.value === 'en') {
      // Already English, use current data
      deckCards.value.forEach(card => {
        englishCardMap.set(card.id, card.data.fullName || `${card.data.name}${card.data.version ? ' - ' + card.data.version : ''}`)
      })
    } else {
      // Load English data for the current set
      const englishData = await loadSetData(selectedSet.value, 'en')
      const englishCards = englishData.cards || englishData
      
      // Build a map of id -> English fullName
      englishCards.forEach((card: any) => {
        englishCardMap.set(card.id, card.fullName || `${card.name}${card.version ? ' - ' + card.version : ''}`)
      })
    }
    
    // Count cards by name
    const cardCounts: Map<string, number> = new Map()
    
    deckCards.value.forEach(card => {
      const englishName = englishCardMap.get(card.id) || card.data.fullName || card.data.name
      cardCounts.set(englishName, (cardCounts.get(englishName) || 0) + 1)
    })
    
    // Sort by count (descending) then by name
    const sortedCards = Array.from(cardCounts.entries()).sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      return a[0].localeCompare(b[0])
    })
    
    // Generate export text
    exportText.value = sortedCards.map(([name, count]) => `${count} ${name}`).join('\n')
  } catch (error) {
    exportText.value = `Error loading English card data: ${error}`
  } finally {
    isExporting.value = false
  }
}

function closeExportDialog() {
  showExportDialog.value = false
  exportText.value = ''
}

async function copyExportText() {
  try {
    await navigator.clipboard.writeText(exportText.value)
  } catch (err) {
    // Fallback: select the textarea content
    const textarea = document.querySelector('.export-textarea') as HTMLTextAreaElement
    if (textarea) {
      textarea.select()
      document.execCommand('copy')
    }
  }
}

// Track if initial load is done
const initialLoadDone = ref(false)

// Watch for language changes
watch(selectedLanguage, async () => {
  if (!isSetAvailable.value) {
    const firstAvailable = availableSetsForLanguage.value[0]
    if (firstAvailable) {
      selectedSet.value = firstAvailable.code
      return
    }
  }
  if (initialLoadDone.value) {
    await loadSet()
  }
})

// Watch for set changes
watch(selectedSet, async () => {
  if (initialLoadDone.value) {
    await loadSet()
  }
})

// Load initial set
onMounted(async () => {
  await loadSet()
  initialLoadDone.value = true
})
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1>Lorcana Sealed Simulator</h1>
      
      <div class="controls">
        <div class="select-group">
          <label for="language">Language</label>
          <select id="language" v-model="selectedLanguage" :disabled="isLoading">
            <option v-for="lang in availableLanguages" :key="lang.code" :value="lang.code">
              {{ lang.name }}
            </option>
          </select>
        </div>
        
        <div class="select-group">
          <label for="set">Set</label>
          <select id="set" v-model="selectedSet" :disabled="isLoading">
            <option 
              v-for="set in availableSetsForLanguage" 
              :key="set.code" 
              :value="set.code"
            >
              {{ set.code }}. {{ set.name }}
            </option>
          </select>
        </div>
        
        <div class="button-group">
          <button @click="requestNewBoosters" :disabled="isLoading || cardsDatabase.length === 0" class="btn-primary">
            New Boosters
          </button>
          
          <!-- View Toggle Tabs -->
          <div class="view-tabs">
            <button 
              @click="currentView = 'boosters'" 
              :class="{ active: currentView === 'boosters', 'drop-target': isDragging, 'drag-over': isDragOverBoosters }"
              class="tab-btn boosters-drop-zone"
              @dragover="onDragOverBoosters"
              @dragleave="onDragLeaveBoosters"
              @drop="onDropOnBoosters"
            >
              📦 Boosters
            </button>
            <button 
              @click="currentView = 'deck'" 
              :class="{ active: currentView === 'deck', 'drop-target': isDragging, 'drag-over': isDragOverDeck }"
              class="tab-btn deck-drop-zone"
              @dragover="onDragOverDeck"
              @dragleave="onDragLeaveDeck"
              @drop="onDropOnDeck"
            >
              🃏 Deck ({{ deckCards.length }})
            </button>
          </div>
          
          <button 
            @click="autoSort = !autoSort; if (autoSort) applyAutoSort()" 
            :class="{ active: autoSort }"
            class="auto-sort-btn"
          >
            {{ autoSort ? '✓ Auto Sort' : 'Auto Sort' }}
          </button>
          <button @click="showSettings = !showSettings" :class="{ active: showSettings }">
            ⚙️ Settings
          </button>
        </div>
      </div>

      <!-- Settings Panel -->
      <div v-if="showSettings" class="settings-panel">
        <div class="settings-header">
          <h3>Booster Settings</h3>
          <button @click="resetSettings" class="btn-small">Reset to Default</button>
        </div>
        
        <div class="settings-grid">
          <!-- Booster Structure -->
          <div class="settings-section">
            <h4>Booster Structure</h4>
            <div class="setting-row">
              <label>Number of Boosters</label>
              <input type="number" v-model.number="settings.nbBoosters" min="1" max="36" />
            </div>
            <div class="setting-row">
              <label>Commons per Pack</label>
              <span v-if="settings.nbCommons === 6" class="setting-hint">(1 per color)</span>
              <input type="number" v-model.number="settings.nbCommons" min="0" max="12" />
            </div>
            <div class="setting-row">
              <label>Uncommons per Pack</label>
              <input type="number" v-model.number="settings.nbUncommons" min="0" max="12" />
            </div>
            <div class="setting-row">
              <label>Rare Slots per Pack</label>
              <input type="number" v-model.number="settings.nbRareSlots" min="0" max="12" />
            </div>
            <div class="setting-row">
              <label>Foil Slots per Pack</label>
              <input type="number" v-model.number="settings.nbFoils" min="0" max="12" />
            </div>
          </div>

          <!-- Rare Slot Rates -->
          <div class="settings-section">
            <h4>Rare Slot Pull Rates (%)</h4>
            <div class="setting-row">
              <label>Rare</label>
              <input type="number" v-model.number="settings.rareSlotRates.rare" min="0" max="100" step="1" />
            </div>
            <div class="setting-row">
              <label>Super Rare</label>
              <input type="number" v-model.number="settings.rareSlotRates.superRare" min="0" max="100" step="1" />
            </div>
            <div class="setting-row">
              <label>Legendary</label>
              <input type="number" v-model.number="settings.rareSlotRates.legendary" min="0" max="100" step="1" />
            </div>
            <div class="setting-row">
              <label>Enchanted</label>
              <input type="number" v-model.number="settings.rareSlotRates.enchanted" min="0" max="100" step="0.1" />
            </div>
            <div class="rate-sum" :class="{ invalid: !rareSlotRatesValid }">
              Sum: {{ Object.values(settings.rareSlotRates).reduce((a, b) => a + b, 0).toFixed(1) }}%
              <span v-if="!rareSlotRatesValid">(must be 100%)</span>
            </div>
          </div>

          <!-- Foil Slot Rates -->
          <div class="settings-section">
            <h4>Foil Slot Pull Rates (%)</h4>
            <div class="setting-row">
              <label>Common</label>
              <input type="number" v-model.number="settings.foilSlotRates.common" min="0" max="100" step="1" />
            </div>
            <div class="setting-row">
              <label>Uncommon</label>
              <input type="number" v-model.number="settings.foilSlotRates.uncommon" min="0" max="100" step="1" />
            </div>
            <div class="setting-row">
              <label>Rare</label>
              <input type="number" v-model.number="settings.foilSlotRates.rare" min="0" max="100" step="1" />
            </div>
            <div class="setting-row">
              <label>Super Rare</label>
              <input type="number" v-model.number="settings.foilSlotRates.superRare" min="0" max="100" step="1" />
            </div>
            <div class="setting-row">
              <label>Legendary</label>
              <input type="number" v-model.number="settings.foilSlotRates.legendary" min="0" max="100" step="1" />
            </div>
            <div class="setting-row">
              <label>Enchanted</label>
              <input type="number" v-model.number="settings.foilSlotRates.enchanted" min="0" max="100" step="0.1" />
            </div>
            <div class="rate-sum" :class="{ invalid: !foilSlotRatesValid }">
              Sum: {{ Object.values(settings.foilSlotRates).reduce((a, b) => a + b, 0).toFixed(1) }}%
              <span v-if="!foilSlotRatesValid">(must be 100%)</span>
            </div>
          </div>
        </div>

        <div class="settings-info">
          <p><strong>Default rates:</strong> Rare ~65%, Super Rare ~25%, Legendary ~10%, Enchanted ~1% per rare slot</p>
        </div>
      </div>
    </header>

    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>Loading {{ selectedSet }}...</p>
    </div>

    <!-- Boosters View -->
    <div v-else-if="currentView === 'boosters'" class="layout">
      <div class="mainView">
        <div class="cardStack" v-for="(stack, index) in stacks" :key="index">
          <div class="stack-header">Pack {{ index + 1 }}</div>
          <div class="card-row" v-for="card in stack.cards" :key="card.uid">
            <SingleCard 
              draggable="true"
              @dragstart="onDragStart($event, card)"
              @dragend="onDragEnd"
              @mouseover="preview(card.set, card.id, card.data)" 
              :set="card.set" 
              :id="card.id" 
              :data="card.data" 
            />
            <button class="move-btn move-to-deck" @click="moveCardToDeck(card)" title="Move to Deck">
              →
            </button>
          </div>
        </div>
      </div>
      
      <div class="PreviewZone">
        <div class="preview-header">Card Preview</div>
        <div v-if="hasCardToPreview && cardToPreview">
          <SingleCard 
            :set="cardToPreview.set" 
            :id="cardToPreview.id" 
            :data="cardToPreview.data" 
            :fullView="true"
          />
          <div class="card-info">
            <div class="card-name">{{ cardToPreview.data.fullName || cardToPreview.data.name }}</div>
            <div class="card-type">{{ cardToPreview.data.type }}</div>
            <div v-if="cardToPreview.data.subtypesText" class="card-subtypes">{{ cardToPreview.data.subtypesText }}</div>
            
            <div class="card-stats">
              <div class="stat cost">
                <span class="stat-icon">⬡</span>
                <span class="stat-value">{{ cardToPreview.data.cost }}</span>
              </div>
              <div v-if="cardToPreview.data.strength !== undefined" class="stat strength">
                <span class="stat-icon">⚔</span>
                <span class="stat-value">{{ cardToPreview.data.strength }}</span>
              </div>
              <div v-if="cardToPreview.data.willpower !== undefined" class="stat willpower">
                <span class="stat-icon">🛡</span>
                <span class="stat-value">{{ cardToPreview.data.willpower }}</span>
              </div>
              <div v-if="cardToPreview.data.lore !== undefined" class="stat lore">
                <span class="stat-icon">◇</span>
                <span class="stat-value">{{ cardToPreview.data.lore }}</span>
              </div>
            </div>
            
            <div class="card-details">
              <span class="rarity" :class="cardToPreview.data.rarity.toLowerCase().replace(' ', '-')">
                {{ cardToPreview.data.rarity }}
              </span>
              <span class="color">{{ cardToPreview.data.color }}</span>
              <span v-if="cardToPreview.data.inkwell" class="inkable">Inkable</span>
            </div>
            
            <div v-if="cardToPreview.data.fullText" class="card-text">{{ cardToPreview.data.fullText }}</div>
          </div>
        </div>
        <div v-else class="preview-placeholder">
          <p>Hover over a card to preview</p>
        </div>
      </div>
    </div>

    <!-- Deck View -->
    <div v-else-if="currentView === 'deck'" class="layout">
      <div class="mainView deck-view">
        <div class="cardStack deck-stack">
          <div class="deck-header">
            <div class="stack-header">My Deck ({{ deckCards.length }} cards)</div>
            <button 
              v-if="deckCards.length > 0"
              @click="exportDeck" 
              class="export-btn"
              :disabled="isExporting"
            >
              📋 Export
            </button>
          </div>
          <div v-if="deckCards.length === 0" class="empty-deck">
            <p>Your deck is empty.</p>
            <p class="hint">Add cards from your boosters to build your deck.</p>
          </div>
          <div class="card-row" v-for="card in deckCards" :key="'deck-' + card.uid">
            <SingleCard 
              draggable="true"
              @dragstart="onDragStart($event, card)"
              @dragend="onDragEnd"
              @mouseover="preview(card.set, card.id, card.data)" 
              :set="card.set" 
              :id="card.id" 
              :data="card.data" 
            />
            <button class="move-btn move-to-boosters" @click="moveCardToBoosters(card)" title="Move to Boosters">
              ←
            </button>
          </div>
        </div>
      </div>
      
      <div class="PreviewZone">
        <div class="preview-header">Card Preview</div>
        <div v-if="hasCardToPreview && cardToPreview">
          <SingleCard 
            :set="cardToPreview.set" 
            :id="cardToPreview.id" 
            :data="cardToPreview.data" 
            :fullView="true"
          />
          <div class="card-info">
            <div class="card-name">{{ cardToPreview.data.fullName || cardToPreview.data.name }}</div>
            <div class="card-type">{{ cardToPreview.data.type }}</div>
            <div v-if="cardToPreview.data.subtypesText" class="card-subtypes">{{ cardToPreview.data.subtypesText }}</div>
            
            <div class="card-stats">
              <div class="stat cost">
                <span class="stat-icon">⬡</span>
                <span class="stat-value">{{ cardToPreview.data.cost }}</span>
              </div>
              <div v-if="cardToPreview.data.strength !== undefined" class="stat strength">
                <span class="stat-icon">⚔</span>
                <span class="stat-value">{{ cardToPreview.data.strength }}</span>
              </div>
              <div v-if="cardToPreview.data.willpower !== undefined" class="stat willpower">
                <span class="stat-icon">🛡</span>
                <span class="stat-value">{{ cardToPreview.data.willpower }}</span>
              </div>
              <div v-if="cardToPreview.data.lore !== undefined" class="stat lore">
                <span class="stat-icon">◇</span>
                <span class="stat-value">{{ cardToPreview.data.lore }}</span>
              </div>
            </div>
            
            <div class="card-details">
              <span class="rarity" :class="cardToPreview.data.rarity.toLowerCase().replace(' ', '-')">
                {{ cardToPreview.data.rarity }}
              </span>
              <span class="color">{{ cardToPreview.data.color }}</span>
              <span v-if="cardToPreview.data.inkwell" class="inkable">Inkable</span>
            </div>
            
            <div v-if="cardToPreview.data.fullText" class="card-text">{{ cardToPreview.data.fullText }}</div>
          </div>
        </div>
        <div v-else class="preview-placeholder">
          <p>Hover over a card to preview</p>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <div v-if="showConfirmDialog" class="dialog-overlay" @click.self="cancelNewBoosters">
      <div class="dialog">
        <div class="dialog-header">
          <h3>New Boosters?</h3>
        </div>
        <div class="dialog-content">
          <p>You have <strong>{{ deckCards.length }}</strong> cards in your deck.</p>
          <p>Starting new boosters will clear your current deck and all boosters.</p>
        </div>
        <div class="dialog-actions">
          <button @click="cancelNewBoosters" class="btn-secondary">Cancel</button>
          <button @click="confirmNewBoosters" class="btn-danger">New Boosters</button>
        </div>
      </div>
    </div>

    <!-- Export Dialog -->
    <div v-if="showExportDialog" class="dialog-overlay" @click.self="closeExportDialog">
      <div class="dialog export-dialog">
        <div class="dialog-header">
          <h3>Export Deck</h3>
        </div>
        <div class="dialog-content">
          <div v-if="isExporting" class="export-loading">
            <div class="spinner"></div>
            <p>Loading card data...</p>
          </div>
          <div v-else>
            <p class="export-info">{{ deckCards.length }} cards (Official format - English)</p>
            <textarea 
              class="export-textarea" 
              v-model="exportText"
            ></textarea>
          </div>
        </div>
        <div class="dialog-actions">
          <button @click="closeExportDialog" class="btn-secondary">Close</button>
          <button @click="copyExportText" class="btn-primary" :disabled="isExporting">
            📋 Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* CSS Variables for theming */
:root {
  /* Background colors */
  --bg-primary: #1a1a1a;
  --bg-secondary: #2a2a2a;
  --bg-tertiary: #3a3a3a;
  --bg-hover: #4a4a4a;
  --bg-card: rgba(255, 255, 255, 0.03);
  --bg-controls: rgba(255, 255, 255, 0.05);
  --bg-overlay: rgba(0, 0, 0, 0.7);
  
  /* Text colors */
  --text-primary: #f0f0f0;
  --text-secondary: #ccc;
  --text-muted: #888;
  --text-dimmed: #666;
  --text-placeholder: #555;
  
  /* Border colors */
  --border-primary: #444;
  --border-secondary: #555;
  --border-hover: #666;
  --border-dashed: #333;
  
  /* Accent colors */
  --accent-primary: #4a6fa5;
  --accent-hover: #5a7fb5;
  --accent-light: #7a9fd5;
  --accent-bg: rgba(74, 111, 165, 0.1);
  
  /* Status colors */
  --color-danger: #c0392b;
  --color-danger-hover: #e74c3c;
  --color-error: #ff6b6b;
  --color-error-bg: rgba(220, 50, 50, 0.2);
  
  /* Stat colors */
  --stat-cost: #64b5f6;
  --stat-strength: #ef5350;
  --stat-willpower: #66bb6a;
  --stat-lore: #ffd54f;
  
  /* Rarity backgrounds */
  --rarity-common: #555;
  --rarity-uncommon: #2d5a27;
  --rarity-rare: #1e3a5f;
  --rarity-super-rare: #5c3d6e;
  --rarity-legendary: #8b6914;
}

/* Light theme */
@media (prefers-color-scheme: light) {
  :root {
    /* Background colors */
    --bg-primary: #ffffff;
    --bg-secondary: #f5f5f5;
    --bg-tertiary: #e8e8e8;
    --bg-hover: #ddd;
    --bg-card: rgba(0, 0, 0, 0.03);
    --bg-controls: rgba(0, 0, 0, 0.05);
    --bg-overlay: rgba(0, 0, 0, 0.5);
    
    /* Text colors */
    --text-primary: #1a1a1a;
    --text-secondary: #333;
    --text-muted: #666;
    --text-dimmed: #888;
    --text-placeholder: #aaa;
    
    /* Border colors */
    --border-primary: #ccc;
    --border-secondary: #bbb;
    --border-hover: #999;
    --border-dashed: #ddd;
    
    /* Accent colors */
    --accent-primary: #3a5f95;
    --accent-hover: #4a6fa5;
    --accent-light: #6a8fc5;
    --accent-bg: rgba(74, 111, 165, 0.15);
    
    /* Status colors */
    --color-danger: #c0392b;
    --color-danger-hover: #e74c3c;
    --color-error: #c0392b;
    --color-error-bg: rgba(220, 50, 50, 0.1);
    
    /* Rarity backgrounds - slightly adjusted for light mode */
    --rarity-common: #777;
    --rarity-uncommon: #3d7a37;
    --rarity-rare: #2e5a8f;
    --rarity-super-rare: #7c5d8e;
    --rarity-legendary: #ab8924;
  }
}

.app-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem;
}

.app-header {
  margin-bottom: 1.5rem;
}

.app-header h1 {
  margin: 0 0 1rem 0;
  font-size: 1.8rem;
  color: var(--text-primary);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
  padding: 1rem;
  background: var(--bg-controls);
  border-radius: 12px;
}

.select-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.select-group label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.select-group select {
  padding: 0.6rem 1rem;
  font-size: 0.95rem;
  border-radius: 8px;
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  min-width: 200px;
}

.select-group select:hover {
  border-color: var(--border-hover);
}

.select-group select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button-group {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
  align-items: center;
}

/* View Toggle Tabs */
.view-tabs {
  display: flex;
  background: var(--bg-primary);
  border-radius: 8px;
  padding: 3px;
  gap: 2px;
}

.tab-btn {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  border: none;
  background: transparent;
  color: var(--text-muted);
  border-radius: 6px;
  transition: all 0.2s;
}

.tab-btn:hover:not(.active) {
  color: var(--text-secondary);
  background: var(--bg-controls);
}

.tab-btn.active {
  background: var(--accent-primary);
  color: #fff;
}

/* Drag and Drop styles */
.deck-drop-zone.drop-target,
.boosters-drop-zone.drop-target {
  animation: pulse-border 1s infinite;
  border: 2px dashed var(--accent-primary);
}

.deck-drop-zone.drag-over,
.boosters-drop-zone.drag-over {
  background: var(--accent-primary) !important;
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(74, 111, 165, 0.6);
}

@keyframes pulse-border {
  0%, 100% { border-color: var(--accent-primary); }
  50% { border-color: var(--accent-light); }
}

button {
  padding: 0.6rem 1.2rem;
  font-size: 0.95rem;
  border-radius: 8px;
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

button:hover:not(:disabled) {
  background: var(--bg-tertiary);
  border-color: var(--border-hover);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button.btn-primary {
  background: var(--accent-primary);
  border-color: var(--accent-hover);
  color: #fff;
}

button.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

button.active {
  background: var(--accent-primary);
  border-color: var(--accent-hover);
  color: #fff;
}

button.btn-small {
  padding: 0.3rem 0.8rem;
  font-size: 0.8rem;
}

/* Settings Panel */
.settings-panel {
  margin-top: 1rem;
  padding: 1.5rem;
  background: var(--bg-card);
  border: 1px solid var(--border-dashed);
  border-radius: 12px;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.settings-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-secondary);
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.settings-section {
  background: var(--bg-controls);
  padding: 1rem;
  border-radius: 8px;
}

.settings-section h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.setting-row label {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.setting-row input {
  width: 70px;
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
  border-radius: 6px;
  border: 1px solid var(--border-primary);
  background: var(--bg-primary);
  color: var(--text-primary);
  text-align: right;
}

.setting-row input:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.setting-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-left: 0.5rem;
  font-style: italic;
}

.rate-sum {
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border-dashed);
  font-size: 0.8rem;
  color: var(--text-muted);
  text-align: right;
}

.rate-sum.invalid {
  color: var(--color-error);
}

.settings-info {
  margin-top: 1rem;
  padding: 0.75rem;
  background: var(--accent-bg);
  border-radius: 6px;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.settings-info p {
  margin: 0;
}

.error-message {
  padding: 1rem;
  background: var(--color-error-bg);
  border: 1px solid var(--color-danger);
  border-radius: 8px;
  color: var(--color-error);
  margin-bottom: 1rem;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-muted);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-dashed);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.layout {
  display: flex;
  gap: 2rem;
}

.mainView {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  flex: 1;
}

.cardStack {
  background: var(--bg-card);
  border-radius: 8px;
  padding: 0.5rem;
  min-width: 230px;
}

.stack-header {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-dimmed);
  margin-bottom: 0.5rem;
  padding-left: 0.25rem;
}

/* Card row with move button */
.card-row {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 1px 0;
}

.move-btn {
  width: 22px;
  height: 22px;
  padding: 0;
  border: 1px solid var(--border-primary);
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.move-btn:hover {
  background: var(--accent-primary);
  color: #fff;
  border-color: var(--accent-primary);
  transform: scale(1.1);
}


/* Deck View Styles */
.deck-view {
  justify-content: flex-start;
}

.deck-stack {
  min-width: 300px;
  max-width: 400px;
  flex-grow: 0;
}

.deck-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.deck-header .stack-header {
  margin-bottom: 0;
}

.export-btn {
  padding: 0.3rem 0.6rem;
  font-size: 0.8rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-secondary);
  border-radius: 4px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.export-btn:hover {
  background: var(--accent-primary);
  color: #fff;
  border-color: var(--accent-primary);
}

.empty-deck {
  padding: 2rem;
  text-align: center;
  color: var(--text-dimmed);
  border: 2px dashed var(--border-dashed);
  border-radius: 8px;
  margin: 0.5rem;
}

.empty-deck p {
  margin: 0.5rem 0;
}

.empty-deck .hint {
  font-size: 0.85rem;
  color: var(--text-placeholder);
}

.PreviewZone {
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 1rem;
  align-self: flex-start;
}

.preview-header {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-dimmed);
  margin-bottom: 0.5rem;
}

.preview-placeholder {
  width: 250px;
  height: 350px;
  border: 2px dashed var(--border-dashed);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-placeholder);
  font-size: 0.85rem;
  text-align: center;
  padding: 1rem;
}

.card-info {
  margin-top: 0.75rem;
  text-align: center;
  max-width: 280px;
}

.card-name {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 0.25rem;
  color: var(--text-primary);
}

.card-type {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}

.card-subtypes {
  font-size: 0.75rem;
  color: var(--text-dimmed);
  margin-bottom: 0.5rem;
}

.card-stats {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin: 0.5rem 0;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: var(--bg-controls);
  border-radius: 4px;
  font-size: 0.85rem;
}

.stat-icon {
  font-size: 0.9rem;
}

.stat-value {
  font-weight: 600;
}

.stat.cost .stat-icon { color: var(--stat-cost); }
.stat.strength .stat-icon { color: var(--stat-strength); }
.stat.willpower .stat-icon { color: var(--stat-willpower); }
.stat.lore .stat-icon { color: var(--stat-lore); }

.card-details {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  font-size: 0.8rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}

.rarity {
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  font-weight: 500;
  color: #fff;
}

.rarity.common, .rarity.gewöhnlich, .rarity.commune, .rarity.comune { background: var(--rarity-common); }
.rarity.uncommon, .rarity.ungewöhnlich, .rarity.inhabituelle, .rarity.non-comune { background: var(--rarity-uncommon); }
.rarity.rare, .rarity.selten, .rarity.rara { background: var(--rarity-rare); }
.rarity.super-rare, .rarity.episch, .rarity.très-rare, .rarity.super-rara { background: var(--rarity-super-rare); }
.rarity.legendary, .rarity.legendär, .rarity.légendaire, .rarity.leggendaria { background: var(--rarity-legendary); }
.rarity.enchanted, .rarity.verzaubert, .rarity.enchantée, .rarity.incantata { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }

.color {
  color: var(--text-muted);
}

.inkable {
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  background: rgba(100, 181, 246, 0.2);
  color: var(--stat-cost);
  font-weight: 500;
}

.card-text {
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: var(--bg-controls);
  border-radius: 6px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.4;
  text-align: left;
  white-space: pre-wrap;
}

@media (max-width: 900px) {
  .layout {
    flex-direction: column;
  }
  
  .PreviewZone {
    width: 100%;
    position: static;
    order: -1;
  }
  
  .controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .button-group {
    margin-left: 0;
    flex-wrap: wrap;
  }
  
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

/* Confirmation Dialog */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.dialog {
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-primary);
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  animation: dialog-appear 0.2s ease-out;
}

.export-dialog {
  max-width: 500px;
}

.export-info {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 0.75rem !important;
}

.export-textarea {
  width: 100%;
  height: 300px;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.85rem;
  padding: 0.75rem;
  resize: vertical;
  line-height: 1.5;
}

.export-textarea:focus {
  outline: none;
  border-color: var(--accent-primary);
}

.export-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: var(--text-muted);
}

.export-loading .spinner {
  width: 30px;
  height: 30px;
  margin-bottom: 1rem;
}

@keyframes dialog-appear {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dialog-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-primary);
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
}

.dialog-content {
  padding: 1.5rem;
}

.dialog-content p {
  margin: 0 0 0.75rem 0;
  color: var(--text-secondary);
  line-height: 1.5;
}

.dialog-content p:last-child {
  margin-bottom: 0;
}

.dialog-actions {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-primary);
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-secondary {
  background: var(--bg-tertiary);
  border-color: var(--border-secondary);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-danger {
  background: var(--color-danger);
  border-color: #a93226;
  color: #fff;
}

.btn-danger:hover {
  background: var(--color-danger-hover);
  border-color: var(--color-danger);
}
</style>
