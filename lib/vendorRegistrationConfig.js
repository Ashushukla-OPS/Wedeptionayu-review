// Shared vendor registration configuration.
// Used by registration form (Step 5) and vendor dashboard display/edit.

export const VENDOR_CATEGORY_OPTIONS = [
  { value: 'Venues', label: 'Venue', icon: '🏛️' },
  { value: 'Decorators', label: 'Decorator', icon: '🎨' },
  { value: 'Photographers', label: 'Photographer', icon: '📷' },
  { value: 'Videographers', label: 'Videographer', icon: '🎥' },
  { value: 'Makeup Artists', label: 'Makeup Artist', icon: '💄' },
  { value: 'Mehendi Artists', label: 'Mehendi Artist', icon: '🖌️' },
  { value: 'DJs', label: 'DJ', icon: '🎵' },
  { value: 'Bands', label: 'Band', icon: '🎶' },
  { value: 'Choreographers', label: 'Choreographer', icon: '💃' },
  { value: 'Caterers', label: 'Caterer', icon: '🍽️' },
  { value: 'Pandits/Priests', label: 'Pandit / Priest', icon: '🙏' }
]

const yesNoOptions = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' }
]

export const VENDOR_CATEGORY_QUESTION_MAP = {
  Photographers: {
    detailsFields: [
      {
        key: 'shoot_type',
        label: 'Shoot Type',
        question: 'Photography type?',
        type: 'single',
        options: ['Wedding', 'Pre-wedding', 'Both']
      },
      {
        key: 'delivery_days',
        label: 'Delivery Days',
        question: 'Final photo delivery days?',
        type: 'number'
      },
      {
        key: 'drone_photography',
        label: 'Drone Photography',
        question: 'Drone photography available?',
        type: 'boolean',
        options: yesNoOptions
      }
    ],
    pricingFields: [
      { key: 'package_price', label: 'Package price', type: 'number' },
      { key: 'wedding_price', label: 'Wedding price', type: 'number' },
      { key: 'pre_wedding_price', label: 'Pre-wedding price', type: 'number' }
    ]
  },

  Videographers: {
    detailsFields: [
      {
        key: 'video_type',
        label: 'Video Type',
        question: 'Video type?',
        type: 'single',
        options: ['Cinematic', 'Traditional', 'Both']
      },
      {
        key: 'delivery_method',
        label: 'Delivery Method',
        question: 'Delivery method?',
        type: 'single',
        options: ['USB', 'Drive', 'Online']
      },
      {
        key: 'teaser_video',
        label: 'Teaser Video',
        question: 'Teaser included?',
        type: 'boolean',
        options: yesNoOptions
      }
    ],
    pricingFields: [
      { key: 'package_price', label: 'Package price', type: 'number' },
      { key: 'cinematic_price', label: 'Cinematic price', type: 'number' }
    ]
  },

  Caterers: {
    detailsFields: [
      {
        key: 'food_type',
        label: 'Food Type',
        question: 'Food type?',
        type: 'single',
        options: ['Veg', 'Non-veg', 'Both']
      },
      {
        key: 'cuisines',
        label: 'Cuisines',
        question: 'Cuisine options?',
        type: 'text'
      },
      {
        key: 'min_guests',
        label: 'Min Guests',
        question: 'Minimum guests?',
        type: 'number'
      }
    ],
    pricingFields: [
      { key: 'price_per_plate', label: 'Price per plate', type: 'number' },
      { key: 'minimum_order', label: 'Minimum order', type: 'number' }
    ]
  },

  Decorators: {
    detailsFields: [
      {
        key: 'indoor_outdoor',
        label: 'Indoor/Outdoor',
        question: 'Indoor or outdoor?',
        type: 'single',
        options: ['Indoor', 'Outdoor', 'Both']
      },
      {
        key: 'themes',
        label: 'Themes',
        question: 'Theme style?',
        type: 'text'
      },
      {
        key: 'custom_decoration',
        label: 'Custom Decoration',
        question: 'Custom decoration possible?',
        type: 'boolean',
        options: yesNoOptions
      }
    ],
    pricingFields: [
      { key: 'decor_starting_price', label: 'Starting decor price', type: 'number' },
      { key: 'full_event_price', label: 'Full event price', type: 'number' }
    ]
  },

  'Makeup Artists': {
    detailsFields: [
      {
        key: 'makeup_type',
        label: 'Makeup Type',
        question: 'Makeup type?',
        type: 'single',
        options: ['Bridal', 'Party', 'Both']
      },
      {
        key: 'trial_session',
        label: 'Trial Session',
        question: 'Trial available?',
        type: 'boolean',
        options: yesNoOptions
      },
      {
        key: 'travel_available',
        label: 'Travel Available',
        question: 'Travel available?',
        type: 'boolean',
        options: yesNoOptions
      }
    ],
    pricingFields: [
      { key: 'bridal_price', label: 'Bridal price', type: 'number' },
      { key: 'per_person_price', label: 'Per person price', type: 'number' }
    ]
  },

  'Mehendi Artists': {
    detailsFields: [
      {
        key: 'mehendi_type',
        label: 'Mehendi Type',
        question: 'Mehendi type?',
        type: 'single',
        options: ['Bridal', 'Guest', 'Both']
      },
      {
        key: 'mehendi_style',
        label: 'Mehendi Style',
        question: 'Mehendi style?',
        type: 'single',
        options: ['Arabic', 'Traditional', 'Both']
      },
      {
        key: 'travel_available',
        label: 'Travel Available',
        question: 'Travel available?',
        type: 'boolean',
        options: yesNoOptions
      }
    ],
    pricingFields: [
      { key: 'bridal_price', label: 'Bridal price', type: 'number' },
      { key: 'per_hand_price', label: 'Per hand price', type: 'number' }
    ]
  },

  DJs: {
    detailsFields: [
      {
        key: 'music_type',
        label: 'Music Type',
        question: 'Music type?',
        type: 'single',
        options: ['Bollywood', 'EDM', 'Punjabi', 'Mixed']
      },
      {
        key: 'sound_system',
        label: 'Sound System',
        question: 'Sound system included?',
        type: 'boolean',
        options: yesNoOptions
      },
      {
        key: 'lighting_setup',
        label: 'Lighting Setup',
        question: 'Lighting setup included?',
        type: 'boolean',
        options: yesNoOptions
      }
    ],
    pricingFields: [
      { key: 'price_per_hour', label: 'Price per hour', type: 'number' },
      { key: 'full_event_price', label: 'Full event price', type: 'number' }
    ]
  },

  Bands: {
    detailsFields: [
      {
        key: 'band_type',
        label: 'Band Type',
        question: 'Band type?',
        type: 'single',
        options: ['Live', 'Baraat']
      },
      {
        key: 'member_count',
        label: 'Member Count',
        question: 'Band members?',
        type: 'number'
      },
      {
        key: 'instruments_included',
        label: 'Own Instruments',
        question: 'Instruments included?',
        type: 'boolean',
        options: yesNoOptions
      }
    ],
    pricingFields: [
      { key: 'price_per_event', label: 'Price per event', type: 'number' },
      { key: 'price_per_hour', label: 'Price per hour', type: 'number' }
    ]
  },

  Choreographers: {
    detailsFields: [
      {
        key: 'choreo_type',
        label: 'Choreography Type',
        question: 'Choreo for wedding/sangeet?',
        type: 'single',
        options: ['Wedding', 'Sangeet', 'Both']
      },
      {
        key: 'practice_sessions',
        label: 'Practice Sessions',
        question: 'Practice sessions?',
        type: 'number'
      },
      {
        key: 'max_group_size',
        label: 'Max Group Size',
        question: 'Max group size?',
        type: 'number'
      }
    ],
    pricingFields: [
      { key: 'price_per_session', label: 'Price per session', type: 'number' },
      { key: 'full_choreography_price', label: 'Full choreo price', type: 'number' }
    ]
  },

  Venues: {
    detailsFields: [
      {
        key: 'guest_capacity',
        label: 'Guest Capacity',
        question: 'Guest capacity?',
        type: 'number'
      },
      {
        key: 'venue_type',
        label: 'Venue Type',
        question: 'Indoor or outdoor?',
        type: 'single',
        options: ['Indoor', 'Outdoor', 'Both']
      },
      {
        key: 'accommodation_available',
        label: 'Accommodation',
        question: 'Rooms available?',
        type: 'boolean',
        options: yesNoOptions
      }
    ],
    pricingFields: [
      { key: 'price_per_day', label: 'Price per day', type: 'number' },
      { key: 'price_per_plate', label: 'Price per plate', type: 'number' }
    ]
  },

  'Pandits/Priests': {
    detailsFields: [
      {
        key: 'rituals_type',
        label: 'Rituals Type',
        question: 'Ritual types?',
        type: 'single',
        options: ['Wedding', 'All rituals']
      },
      {
        key: 'languages',
        label: 'Languages',
        question: 'Languages?',
        type: 'text'
      },
      {
        key: 'travel_available',
        label: 'Travel Available',
        question: 'Travel available?',
        type: 'boolean',
        options: yesNoOptions
      }
    ],
    pricingFields: [
      { key: 'price_per_ritual', label: 'Price per ritual', type: 'number' },
      { key: 'full_package_price', label: 'Full package price', type: 'number' }
    ]
  }
}

// V2: stricter per-category compulsory pricing questions
// These keys are used by the vendor dashboard to render dynamic questions and by the vendor cards to display prices.
const VENDOR_CATEGORY_QUESTION_MAP_V2 = {
  Venues: {
    detailsFields: [
      {
        key: 'venue_offers_catering',
        label: 'Venue Catering',
        question: 'Do you offer catering at your venue?',
        type: 'boolean',
        options: yesNoOptions,
        required: true
      }
    ],
    pricingFields: [
      { key: 'price_per_day_event', label: 'Price per day / per event', type: 'number', required: true },
      {
        key: 'price_per_plate',
        label: 'Price per plate',
        type: 'number',
        required: true,
        visibleIf: { key: 'venue_offers_catering', value: true }
      }
    ]
  },

  Decorators: {
    detailsFields: [],
    pricingFields: [
      { key: 'starting_decorator_price', label: 'Price per event (starting from)', type: 'number', required: true }
    ]
  },

  Photographers: {
    detailsFields: [
      {
        key: 'photography_pricing_type',
        label: 'Pricing Type',
        question: 'Select your photography pricing type',
        type: 'single',
        options: ['Per function / per day', 'Package'],
        required: true
      }
    ],
    pricingFields: [
      {
        key: 'price_per_function_day',
        label: 'Price per function / per day',
        type: 'number',
        required: true,
        visibleIf: { key: 'photography_pricing_type', value: 'Per function / per day' }
      },
      {
        key: 'package_price',
        label: 'Package price',
        type: 'number',
        required: true,
        visibleIf: { key: 'photography_pricing_type', value: 'Package' }
      }
    ]
  },

  Videographers: {
    detailsFields: [
      {
        key: 'videography_pricing_type',
        label: 'Pricing Type',
        question: 'Select your videography pricing type',
        type: 'single',
        options: ['Per day / per event', 'Package'],
        required: true
      }
    ],
    pricingFields: [
      {
        key: 'price_per_day_event',
        label: 'Price per day / per event',
        type: 'number',
        required: true,
        visibleIf: { key: 'videography_pricing_type', value: 'Per day / per event' }
      },
      {
        key: 'package_price',
        label: 'Package price',
        type: 'number',
        required: true,
        visibleIf: { key: 'videography_pricing_type', value: 'Package' }
      }
    ]
  },

  'Makeup Artists': {
    detailsFields: [
      {
        key: 'makeup_pricing_type',
        label: 'Pricing Type',
        question: 'Select your makeup pricing type',
        type: 'single',
        options: ['Per person', 'Bridal package'],
        required: true
      }
    ],
    pricingFields: [
      {
        key: 'price_per_person',
        label: 'Price per person',
        type: 'number',
        required: true,
        visibleIf: { key: 'makeup_pricing_type', value: 'Per person' }
      },
      {
        key: 'bridal_package_price',
        label: 'Bridal package',
        type: 'number',
        required: true,
        visibleIf: { key: 'makeup_pricing_type', value: 'Bridal package' }
      }
    ]
  },

  'Mehendi Artists': {
    detailsFields: [
      {
        key: 'mehendi_pricing_type',
        label: 'Pricing Type',
        question: 'Select your mehendi pricing type',
        type: 'single',
        options: ['Per hand', 'Bridal mehendi'],
        required: true
      }
    ],
    pricingFields: [
      {
        key: 'price_per_hand',
        label: 'Price per hand',
        type: 'number',
        required: true,
        visibleIf: { key: 'mehendi_pricing_type', value: 'Per hand' }
      },
      {
        key: 'bridal_mehendi_price',
        label: 'Bridal mehendi',
        type: 'number',
        required: true,
        visibleIf: { key: 'mehendi_pricing_type', value: 'Bridal mehendi' }
      }
    ]
  },

  DJs: {
    detailsFields: [],
    pricingFields: [
      { key: 'price_per_event_per_night', label: 'Price per event / per night', type: 'number', required: true }
    ]
  },

  Bands: {
    detailsFields: [
      {
        key: 'bands_pricing_type',
        label: 'Pricing Type',
        question: 'Select your bands pricing type',
        type: 'single',
        options: ['Per baraat', 'Per event'],
        required: true
      }
    ],
    pricingFields: [
      {
        key: 'price_per_baraat',
        label: 'Price per baraat',
        type: 'number',
        required: true,
        visibleIf: { key: 'bands_pricing_type', value: 'Per baraat' }
      },
      {
        key: 'price_per_event',
        label: 'Price per event',
        type: 'number',
        required: true,
        visibleIf: { key: 'bands_pricing_type', value: 'Per event' }
      }
    ]
  },

  Choreographers: {
    detailsFields: [
      {
        key: 'choreo_pricing_type',
        label: 'Pricing Type',
        question: 'Select your choreographers pricing type',
        type: 'single',
        options: ['Per song', 'Per session'],
        required: true
      }
    ],
    pricingFields: [
      {
        key: 'price_per_song',
        label: 'Price per song',
        type: 'number',
        required: true,
        visibleIf: { key: 'choreo_pricing_type', value: 'Per song' }
      },
      {
        key: 'price_per_session',
        label: 'Price per session',
        type: 'number',
        required: true,
        visibleIf: { key: 'choreo_pricing_type', value: 'Per session' }
      }
    ]
  },

  Caterers: {
    detailsFields: [
      {
        key: 'non_veg_service_available',
        label: 'Non-Veg Service',
        question: 'Are you providing non-veg service?',
        type: 'boolean',
        options: yesNoOptions,
        required: true
      },
      {
        key: 'caterer_food_type',
        label: 'Food Type',
        question: 'Select caterer pricing food type',
        type: 'single',
        options: ['Veg', 'Non-Veg', 'Both'],
        required: true
      }
    ],
    pricingFields: [
      {
        key: 'veg_price_per_plate',
        label: 'Veg price per plate',
        type: 'number',
        required: true,
        visibleIf: { key: 'caterer_food_type', values: ['Veg', 'Both'] }
      },
      {
        key: 'non_veg_price_per_plate',
        label: 'Non-veg price per plate',
        type: 'number',
        required: true,
        visibleIf: { key: 'caterer_food_type', values: ['Non-Veg', 'Both'] }
      }
    ]
  },

  'Pandits/Priests': {
    detailsFields: [],
    pricingFields: [
      { key: 'price_per_ceremony_or_day', label: 'Price per ceremony / per day', type: 'number', required: true }
    ]
  }
}

export function getCategoryConfig(category) {
  return VENDOR_CATEGORY_QUESTION_MAP_V2[category] || VENDOR_CATEGORY_QUESTION_MAP[category] || null
}

