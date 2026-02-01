<script setup lang="ts">
  import { computed } from 'vue';
  const props = defineProps<{ set: string | number, id: number, data: any, locale?: string, fullView?: boolean }>();

  // Check if card is a Location (landscape orientation)
  // Supports all languages: EN=Location, DE=Ort, FR=Lieu, IT=Luogo
  const isLocation = computed(() => {
    const locationTypes = ['Location', 'Ort', 'Lieu', 'Luogo'];
    return locationTypes.includes(props.data.type);
  });

  // a computed ref - LorcanaJSON uses images.full for the full card image
  const url = computed(() => {
    // Support both old format (image) and new LorcanaJSON format (images.full)
    if (props.data.images?.full) {
      return props.data.images.full;
    }
    return props.data.image;
  });
</script>

<template>
  <!-- Single root element to ensure events work -->
  <div class="single-card-wrapper">
    <!-- Full View - Location (Landscape) -->
    <div v-if="props.fullView && isLocation" class="full-view-location">
      <img :src="url" class="card-image-landscape" />
    </div>
    
    <!-- Full View - Regular (Portrait) -->
    <div v-else-if="props.fullView" class="full-view-regular">
      <img :src="url" class="card-image-portrait" />
    </div>
    
    <!-- Condensed View - Location Cards -->
    <div v-else-if="isLocation" class="condensedCard location">
      <div class="locationCost" :style="{ backgroundImage: 'url(' + url + ')' }"></div>
      <div class="locationMain" :style="{ backgroundImage: 'url(' + url + ')' }"></div>
    </div>
    
    <!-- Condensed View - Regular Cards -->
    <div v-else class="condensedCard">
      <div class="cardCost" :style="{ backgroundImage: 'url(' + url + ')' }"></div>
      <div class="cardMain" :style="{ backgroundImage: 'url(' + url + ')' }"></div>
    </div>
  </div>
</template>

<style>
  .single-card-wrapper {
    cursor: grab;
  }
  
  .single-card-wrapper:active {
    cursor: grabbing;
  }
  
  .single-card-wrapper[draggable="true"] {
    user-select: none;
  }

  /* Full view - Portrait (regular cards) */
  .full-view-regular .card-image-portrait {
    width: 250px;
    height: auto;
    border-radius: 10px;
    display: block;
  }
  
  /* Full view - Landscape (location cards) */
  /* Location card images are stored in portrait but need to be displayed landscape */
  .full-view-location {
    width: 350px;
    height: 250px;
    overflow: visible;
    margin-bottom: 1rem;
  }
  
  .full-view-location .card-image-landscape {
    width: 250px;
    height: auto;
    border-radius: 10px;
    display: block;
    transform: rotate(90deg);
    transform-origin: top left;
    margin-left: 250px;
  }

  /* Condensed view - regular cards */
  div.condensedCard {
    height: 27px;
    border: 1px solid black;
    width: fit-content;
    margin: auto;
    display: flex;
    border-radius: 3px;
    overflow: hidden;
    transition: transform 0.1s ease;
  }
  
  div.condensedCard:hover {
    transform: scale(1.02);
  }
  
  div.cardCost {
    width: 26px;
    height: 27px;
    background-size: 620%;
    background-position-y: -3px;
    background-position-x: -3px;
    display: inline-block;
  }
  
  div.cardMain {
    width: 195px;
    height: 27px;
    background-size: 105%;
    display: inline-block;
    background-position-y: 705px;
    background-position-x: -4px;
  }

  /* Condensed view - location cards (landscape) */
  div.condensedCard.location {
    height: 24px;
    border: 1px solid #4a3728;
    background: linear-gradient(135deg, #3d2e1f 0%, #5a4532 100%);
  }
  
  div.locationCost {
    width: 24px;
    height: 24px;
    background-size: 850%;
    background-position-y: -2px;
    background-position-x: -2px;
    display: inline-block;
  }
  
  div.locationMain {
    width: 195px;
    height: 24px;
    background-size: 145%;
    display: inline-block;
    background-position-y: 520px;
    background-position-x: -5px;
  }
</style>
