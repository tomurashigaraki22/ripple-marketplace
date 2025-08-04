export const CATEGORIES = {
  // Electronics & Technology
  'electronics': {
    name: 'Electronics & Technology',
    subcategories: [
      'smartphones-tablets',
      'computers-laptops', 
      'gaming-consoles',
      'audio-headphones',
      'cameras-photography',
      'smart-home',
      'wearable-tech',
      'tv-home-theater',
      'networking-wifi',
      'accessories-cables'
    ]
  },
  
  // Fashion & Accessories
  'fashion': {
    name: 'Fashion & Accessories',
    subcategories: [
      'mens-clothing',
      'womens-clothing',
      'shoes-footwear',
      'bags-luggage',
      'jewelry-watches',
      'sunglasses-eyewear',
      'hats-caps',
      'belts-accessories',
      'vintage-clothing',
      'designer-luxury'
    ]
  },
  
  // Home & Garden
  'home-garden': {
    name: 'Home & Garden',
    subcategories: [
      'furniture',
      'home-decor',
      'kitchen-dining',
      'bedding-bath',
      'lighting',
      'storage-organization',
      'garden-outdoor',
      'tools-hardware',
      'appliances',
      'cleaning-supplies'
    ]
  },
  
  // Vehicles & Transportation
  'vehicles': {
    name: 'Vehicles & Transportation',
    subcategories: [
      'cars-trucks',
      'motorcycles-scooters',
      'bicycles',
      'boats-watercraft',
      'rvs-campers',
      'auto-parts',
      'tires-wheels',
      'car-electronics',
      'tools-equipment',
      'accessories'
    ]
  },
  
  // Sports & Recreation
  'sports-recreation': {
    name: 'Sports & Recreation',
    subcategories: [
      'fitness-exercise',
      'outdoor-camping',
      'cycling',
      'water-sports',
      'winter-sports',
      'team-sports',
      'golf',
      'hunting-fishing',
      'martial-arts',
      'sports-memorabilia'
    ]
  },
  
  // Books, Movies & Music
  'media-entertainment': {
    name: 'Books, Movies & Music',
    subcategories: [
      'books-literature',
      'textbooks-education',
      'movies-dvd',
      'music-vinyl',
      'video-games',
      'musical-instruments',
      'sheet-music',
      'magazines-comics',
      'audiobooks',
      'collectible-media'
    ]
  },
  
  // Art & Collectibles
  'art-collectibles': {
    name: 'Art & Collectibles',
    subcategories: [
      'original-art',
      'prints-posters',
      'sculptures',
      'photography',
      'antiques',
      'coins-currency',
      'stamps',
      'trading-cards',
      'toys-games',
      'memorabilia'
    ]
  },
  
  // Health & Beauty
  'health-beauty': {
    name: 'Health & Beauty',
    subcategories: [
      'skincare',
      'makeup-cosmetics',
      'hair-care',
      'fragrances',
      'health-supplements',
      'medical-equipment',
      'fitness-nutrition',
      'personal-care',
      'beauty-tools',
      'organic-natural'
    ]
  },
  
  // Baby & Kids
  'baby-kids': {
    name: 'Baby & Kids',
    subcategories: [
      'baby-gear',
      'toys-games',
      'kids-clothing',
      'baby-clothing',
      'strollers-car-seats',
      'feeding-nursing',
      'diapering-potty',
      'baby-safety',
      'educational-toys',
      'outdoor-play'
    ]
  },
  
  // Business & Industrial
  'business-industrial': {
    name: 'Business & Industrial',
    subcategories: [
      'office-supplies',
      'industrial-equipment',
      'restaurant-food-service',
      'medical-dental',
      'construction-tools',
      'manufacturing',
      'agriculture-forestry',
      'printing-graphic-arts',
      'lab-scientific',
      'packaging-shipping'
    ]
  },
  
  // Digital & Virtual
  'digital-virtual': {
    name: 'Digital & Virtual',
    subcategories: [
      'nft-digital-art',
      'software-licenses',
      'digital-downloads',
      'online-courses',
      'ebooks',
      'stock-photos',
      'website-templates',
      'mobile-apps',
      'digital-music',
      'virtual-services'
    ]
  },
  
  // Services
  'services': {
    name: 'Services',
    subcategories: [
      'professional-services',
      'creative-services',
      'tutoring-lessons',
      'home-services',
      'automotive-services',
      'event-services',
      'travel-experiences',
      'consulting',
      'technical-support',
      'other-services'
    ]
  },
  
  // Other
  'other': {
    name: 'Other',
    subcategories: [
      'miscellaneous',
      'wholesale-lots',
      'gift-cards',
      'tickets-events',
      'real-estate',
      'pets-animals',
      'crafts-handmade',
      'vintage-retro',
      'seasonal-holiday',
      'everything-else'
    ]
  }
};

export const CONDITIONS = [
  { value: 'new', label: 'New', description: 'Brand new, never used' },
  { value: 'open-box', label: 'Open Box', description: 'New but packaging opened' },
  { value: 'refurbished', label: 'Refurbished', description: 'Professionally restored' },
  { value: 'like-new', label: 'Like New', description: 'Excellent condition, barely used' },
  { value: 'good', label: 'Good', description: 'Minor signs of wear' },
  { value: 'fair', label: 'Fair', description: 'Noticeable wear but functional' },
  { value: 'poor', label: 'Poor', description: 'Heavy wear, may need repair' }
];

export const SIZES = {
  clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
  shoes: ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13', '14', '15'],
  general: ['Small', 'Medium', 'Large', 'Extra Large']
};

export const COLORS = [
  'Black', 'White', 'Gray', 'Silver', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Purple', 'Pink', 'Brown', 'Gold', 'Rose Gold', 'Multicolor', 'Clear', 'Other'
];