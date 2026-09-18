import { MenuItem } from '../types';

export const CATEGORIES = [
  { id: 'all', name: 'All Items', icon: 'Flame' },
  { id: 'burgers', name: 'Flame Burgers', icon: 'Beef' },
  { id: 'steaks', name: 'Steaks & Chops', icon: 'Utensils' },
  { id: 'skewers', name: 'Skewers & Kebabs', icon: 'Zap' },
  { id: 'ribs', name: 'Smoky BBQ Ribs', icon: 'Drumstick' },
  { id: 'platters', name: 'Combo Platters', icon: 'Layers' },
  { id: 'sides', name: 'Sides & Dips', icon: 'Salad' },
  { id: 'drinks', name: 'Beverages & Shakes', icon: 'CupSoda' },
];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'g1',
    name: 'The Boss Flame Burger',
    category: 'burgers',
    price: 13.99,
    originalPrice: 16.99,
    description: 'Double Angus flame-grilled patty, aged cheddar, smoky bacon jam, charred jalapenos & house chipotle mayo on toasted brioche.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewCount: 420,
    isBestseller: true,
    isSpicy: true,
    spiceLevel: 2,
    prepTime: '15-20 min',
    calories: 840,
    customizationOptions: {
      doneness: ['Medium', 'Medium Well', 'Well Done'],
      spiceLevels: ['Mild', 'Smoky Medium (Recommended)', 'Fiery Ghost Hot'],
      addOns: [
        { name: 'Extra Melted Cheddar', price: 1.50 },
        { name: 'Crispy Smoked Bacon (2 strips)', price: 2.00 },
        { name: 'Grilled Portobello Mushroom', price: 1.75 },
        { name: 'Fried Free-Range Egg', price: 1.50 }
      ]
    }
  },
  {
    id: 'g2',
    name: 'Smoked Texas Brisket Burger',
    category: 'burgers',
    price: 15.49,
    description: '14-hour hickory-smoked brisket shredded & seared, tangy Carolina coleslaw, fried onion rings & hickory glaze.',
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewCount: 310,
    isChefSpecial: true,
    prepTime: '15-20 min',
    calories: 920,
    customizationOptions: {
      spiceLevels: ['Mild Sweet BBQ', 'Spicy Mustard Blend'],
      addOns: [
        { name: 'Extra Cheddar Sauce', price: 1.50 },
        { name: 'Pickled Jalapenos', price: 0.99 },
        { name: 'Extra Smoked Brisket 50g', price: 3.50 }
      ]
    }
  },
  {
    id: 'g3',
    name: 'Prime Tomahawk Ribeye Steak (16 oz)',
    category: 'steaks',
    price: 34.99,
    originalPrice: 39.99,
    description: 'Charcoal-seared USDA Prime bone-in ribeye basted with rosemary garlic compound butter, served with roasted garlic head and chimichurri.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    rating: 5.0,
    reviewCount: 512,
    isBestseller: true,
    isChefSpecial: true,
    prepTime: '25-30 min',
    calories: 1100,
    customizationOptions: {
      doneness: ['Rare', 'Medium Rare (Chef Pick)', 'Medium', 'Medium Well', 'Well Done'],
      spiceLevels: ['Herb & Sea Salt', 'Cracked Black Pepper Crusted', 'Cajun Blackened'],
      addOns: [
        { name: 'Grilled Tiger Prawns (3 pcs)', price: 6.99 },
        { name: 'Truffle Butter Glaze', price: 2.50 },
        { name: 'Creamy Peppercorn Sauce', price: 1.99 },
        { name: 'Sautéed Garlic Asparagus', price: 3.99 }
      ]
    }
  },
  {
    id: 'g4',
    name: 'Chargrilled New York Strip',
    category: 'steaks',
    price: 26.99,
    description: 'Center-cut 10oz striploin with bold beef flavor, grilled over mesquite wood, served with smoked paprika herb butter.',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewCount: 220,
    prepTime: '20-25 min',
    calories: 820,
    customizationOptions: {
      doneness: ['Rare', 'Medium Rare', 'Medium', 'Medium Well'],
      addOns: [
        { name: 'Mushroom Demi-Glace', price: 2.00 },
        { name: 'Blue Cheese Crust', price: 2.50 }
      ]
    }
  },
  {
    id: 'g5',
    name: 'Smoky BBQ Baby Back Ribs (Full Rack)',
    category: 'ribs',
    price: 24.99,
    originalPrice: 28.99,
    description: 'Fall-off-the-bone pork ribs slow-smoked over applewood for 6 hours, glazed with our signature spicy honey-bourbon BBQ sauce.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewCount: 380,
    isBestseller: true,
    prepTime: '20-25 min',
    calories: 1250,
    customizationOptions: {
      spiceLevels: ['Sweet Brown Sugar BBQ', 'Smoky Tangy BBQ', 'Hot Honey Chipotle (Spicy)'],
      addOns: [
        { name: 'Extra Side of Signature BBQ Dip', price: 1.25 },
        { name: 'Cheddar Cornbread Muffin', price: 2.50 }
      ]
    }
  },
  {
    id: 'g6',
    name: 'Persian Saffron Chicken Skewers',
    category: 'skewers',
    price: 16.99,
    description: 'Marinated tender chicken chunks with Persian saffron, Greek yogurt, lemon juice and crushed coriander, fire-grilled over open coals.',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewCount: 195,
    isBestseller: true,
    prepTime: '15-20 min',
    calories: 650,
    customizationOptions: {
      spiceLevels: ['Mild Herb', 'Spicy Sumac', 'Chili Pepper Marinade'],
      addOns: [
        { name: 'Extra Grilled Garlic Flatbread', price: 1.99 },
        { name: 'Tzatziki Garlic Dip', price: 1.50 },
        { name: 'Grilled Persian Tomatoes', price: 1.50 }
      ]
    }
  },
  {
    id: 'g7',
    name: 'Adana Spicy Lamb Kebabs',
    category: 'skewers',
    price: 18.50,
    description: 'Hand-minced prime lamb kneaded with charred red bell peppers, Aleppo chili flakes and sumac, threaded on wide iron skewers.',
    image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewCount: 260,
    isSpicy: true,
    spiceLevel: 3,
    prepTime: '18-22 min',
    calories: 780,
    customizationOptions: {
      spiceLevels: ['Medium Spiced', 'Traditional Aleppo Fire (Hot)'],
      addOns: [
        { name: 'Hummus with Olive Oil', price: 2.50 },
        { name: 'Pickled Turnips & Chilis', price: 1.25 }
      ]
    }
  },
  {
    id: 'g8',
    name: 'The Ultimate Grill Spot Feast (For 3-4)',
    category: 'platters',
    price: 54.99,
    originalPrice: 65.00,
    description: 'Half rack smoked ribs, 2 flame cheeseburgers, 4 saffron chicken skewers, loaded dirty fries, grilled corn, slaw, and 4 artisanal dips.',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    rating: 5.0,
    reviewCount: 640,
    isBestseller: true,
    isChefSpecial: true,
    prepTime: '30-35 min',
    calories: 2400,
    customizationOptions: {
      spiceLevels: ['Family Friendly (Mild)', 'Assorted Spicy Mix'],
      addOns: [
        { name: 'Upgrade to Truffle Parmesan Fries', price: 3.50 },
        { name: 'Extra 4x Soft Brioche Buns', price: 3.00 }
      ]
    }
  },
  {
    id: 'g9',
    name: 'Truffle Parmesan Loaded Fries',
    category: 'sides',
    price: 7.99,
    description: 'Hand-cut Idaho russet fries tossed in white truffle oil, freshly grated 24-month Parmigiano-Reggiano, chopped parsley and roasted garlic aioli.',
    image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80',
    rating: 4.7,
    reviewCount: 410,
    isBestseller: true,
    prepTime: '10 min',
    calories: 520,
    customizationOptions: {
      addOns: [
        { name: 'Crispy Bacon Bits', price: 1.50 },
        { name: 'Jalapeno Cheese Sauce', price: 1.50 }
      ]
    }
  },
  {
    id: 'g10',
    name: 'Charred Street Corn (Elote Style)',
    category: 'sides',
    price: 6.49,
    description: 'Fire-roasted whole sweet corn slathered with lime crema, crumbled cotija cheese, smoked chili powder and cilantro.',
    image: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewCount: 185,
    isSpicy: true,
    spiceLevel: 1,
    prepTime: '10 min',
    calories: 310
  },
  {
    id: 'g11',
    name: 'Smoked Vanilla Salted Caramel Milkshake',
    category: 'drinks',
    price: 6.99,
    description: 'Thick handcrafted shake made with Madagascar vanilla bean gelato, smoked sea salt caramel drizzle, topped with whipped cream.',
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
    rating: 4.9,
    reviewCount: 290,
    isBestseller: true,
    prepTime: '5 min',
    calories: 540
  },
  {
    id: 'g12',
    name: 'Fresh Mint Flame Lemonade',
    category: 'drinks',
    price: 4.99,
    description: 'Freshly squeezed Meyer lemons, crushed garden spearmint, light cane sugar and sparkling mineral water with charred lemon wheels.',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    rating: 4.8,
    reviewCount: 160,
    prepTime: '5 min',
    calories: 140
  }
];

export const PROMO_CODES: Record<string, { discountPercent?: number; fixedDiscount?: number; minSpend: number; label: string }> = {
  GRILL20: { discountPercent: 20, minSpend: 20, label: '20% Off Orders over $20' },
  FIRSTBITE: { fixedDiscount: 5, minSpend: 15, label: '$5 Off First Grill Order' },
  FREEFRIES: { fixedDiscount: 7.99, minSpend: 30, label: 'Free Truffle Fries value ($7.99)' },
};
