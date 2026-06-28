import { Injectable } from '@angular/core';
import { Recipe, Testimonial, BlogPost, MealPlanDay, Feature, PressLogo } from '../models/nutrition.models';


@Injectable({
  providedIn: 'root'
})
export class NutritionDataService {

   readonly pressLogos: PressLogo[] = [
    { name: 'Healthline' }, { name: 'Well + Good' }, { name: 'Bon Appétit' },
    { name: 'Eat This' },   { name: 'Shape' },        { name: 'Prevention' },
  ];

  readonly features: Feature[] = [
    { icon: '📊', iconBg: 'terra', title: 'Health Monitoring',          description: 'Log biometrics — weight, BMI, blood pressure, glucose — and track trends over time with automatic health alerts and AI-powered insights.' },
    { icon: '🎯', iconBg: 'sage',  title: 'Personalised Goals',         description: 'Set health goals with automatic milestone detection. Goals can be self-created or assigned directly by your nutritionist with full progress tracking.' },
    { icon: '🩺', iconBg: 'warm',  title: 'Nutritionist Consultations', description: 'Book video or in-person consultations with registered dietitians. Manage schedules, receive notes, and track follow-up care in one place.' },
    { icon: '🗺️', iconBg: 'terra', title: 'Patient Health Map',         description: 'Nutritionists get a real-time heatmap of their panel — health scores, engagement levels, churn risk, and critical alerts in a single dashboard.' },
    { icon: '📰', iconBg: 'sage',  title: 'Articles & Recipes',         description: 'A curated library of science-backed nutrition articles and tested recipes designed to support every health goal and dietary preference.' },
    { icon: '🧮', iconBg: 'warm',  title: 'Nutrition Calculator',       description: 'Instantly compute BMI, daily calorie needs, and macronutrient targets based on your personal data, activity level, and health objective.' },
  ];

  readonly recipes: Recipe[] = [
    {
      id: 1, emoji: '🐟', bgGradient: 'linear-gradient(135deg,#fde8d8,#f5c9a8)',
      title: 'Lemon Herb Baked Salmon with Quinoa & Roasted Asparagus',
      description: 'Restaurant-worthy in 30 minutes. Flaky salmon over fluffy quinoa with crispy asparagus — packed with omega-3s.',
      category: 'dinner', tag: '⭐ Fan Favorite', timeMinutes: 30, calories: 380, servings: 4,
      macros: { protein: 38, carbs: 32, fat: 14, fiber: 5 }, badges: ['Gluten-Free', 'High Protein'], featured: true
    },
    {
      id: 2, emoji: '🥑', bgGradient: 'linear-gradient(135deg,#e8f0dd,#c8ddb8)',
      title: 'Smashed Avocado Toast with Poached Eggs',
      description: 'The ultimate high-protein breakfast. Creamy avocado, perfectly poached eggs on toasted sourdough.',
      category: 'breakfast', tag: '⚡ Quick', timeMinutes: 10, calories: 290, servings: 1,
      macros: { protein: 18, carbs: 22, fat: 16, fiber: 7 }, badges: ['Vegan Option'], featured: false
    },
    {
      id: 3, emoji: '🥗', bgGradient: 'linear-gradient(135deg,#fce4ec,#f8bbd0)',
      title: 'Rainbow Buddha Bowl with Tahini Dressing',
      description: 'Vibrant and completely plant-based. Six colors, six nutrients — roasted chickpeas, sweet potato and more.',
      category: 'lunch', tag: '🌱 Vegan', timeMinutes: 25, calories: 420, servings: 2,
      macros: { protein: 16, carbs: 54, fat: 14, fiber: 12 }, badges: ['Vegan', 'Gluten-Free'], featured: false
    },
    {
      id: 4, emoji: '🫕', bgGradient: 'linear-gradient(135deg,#fff3e0,#ffe0b2)',
      title: 'Lean Turkey & White Bean Chili',
      description: 'Hearty, warming, high in fiber. Meal-prep friendly — gets better each day.',
      category: 'dinner', tag: '❤️ Heart-Healthy', timeMinutes: 40, calories: 310, servings: 6,
      macros: { protein: 32, carbs: 28, fat: 7, fiber: 10 }, badges: ['High Fiber', 'High Protein'], featured: false
    },
    {
      id: 5, emoji: '🫐', bgGradient: 'linear-gradient(135deg,#e8eaf6,#c5cae9)',
      title: 'Acai & Mixed Berry Smoothie Bowl',
      description: 'Packed with antioxidants, fiber, and natural energy. Ready in 5 minutes.',
      category: 'breakfast', tag: '💜 Antioxidants', timeMinutes: 5, calories: 260, servings: 1,
      macros: { protein: 9, carbs: 42, fat: 8, fiber: 9 }, badges: ['Vegan', 'Quick'], featured: false
    },
    {
      id: 6, emoji: '🌯', bgGradient: 'linear-gradient(135deg,#f9fbe7,#dce8b0)',
      title: 'Crispy Chickpea & Roasted Veggie Wrap',
      description: 'Crunchy, flavourful, plant-based. Spiced chickpeas with roasted peppers, hummus and greens.',
      category: 'lunch', tag: '🌱 Vegan', timeMinutes: 20, calories: 370, servings: 2,
      macros: { protein: 14, carbs: 48, fat: 11, fiber: 11 }, badges: ['Vegan', 'High Fiber'], featured: false
    },
  ];

  readonly mealPlanDays: MealPlanDay[] = [
    {
      label: 'Monday', emoji: '📅', featured: true,
      meals: [
        { time: 'breakfast', emoji: '☀️', name: 'Overnight Oats with Berries',  calories: 340, protein: 14 },
        { time: 'lunch',     emoji: '🥗', name: 'Mediterranean Chickpea Salad', calories: 420, protein: 18 },
        { time: 'dinner',    emoji: '🐟', name: 'Lemon Herb Salmon + Quinoa',   calories: 380, protein: 38 },
      ]
    },
    {
      label: 'Tuesday', emoji: '📅', featured: false,
      meals: [
        { time: 'breakfast', emoji: '🥚', name: 'Veggie Egg Muffins',          calories: 220, protein: 16 },
        { time: 'lunch',     emoji: '🍜', name: 'Soba Noodle Salad',           calories: 390, protein: 15 },
        { time: 'dinner',    emoji: '🍗', name: 'Herb Chicken + Sweet Potato', calories: 460, protein: 42 },
      ]
    },
    {
      label: 'Wednesday', emoji: '📅', featured: false,
      meals: [
        { time: 'breakfast', emoji: '🫐', name: 'Acai Smoothie Bowl',         calories: 260, protein: 9  },
        { time: 'lunch',     emoji: '🥙', name: 'Turkey Avocado Wrap',        calories: 410, protein: 28 },
        { time: 'dinner',    emoji: '🫕', name: 'Turkey & White Bean Chili',  calories: 310, protein: 32 },
      ]
    },
  ];

  readonly testimonials: Testimonial[] = [
    {
      id: 1, name: 'Melissa T.', memberDuration: 'Member for 8 months', stars: 5,
      text: "I've tried every diet out there. This is the first time eating healthy feels sustainable and enjoyable. I look forward to cooking now!",
      result: 'Lost 18 lbs in 4 months', resultEmoji: '🎉', avatarEmoji: '👩', avatarBg: '#fde8d8'
    },
    {
      id: 2, name: 'Rachel K.', memberDuration: 'Member for 1 year', stars: 5,
      text: "The meal plans saved my sanity. As a busy mom of three, having everything planned and the grocery list ready is a game-changer.",
      result: 'Gained energy & confidence', resultEmoji: '⚡', avatarEmoji: '👩‍👧', avatarBg: '#e8f0dd'
    },
    {
      id: 3, name: 'David M., 56', memberDuration: 'Member for 5 months', stars: 5,
      text: "My doctor was shocked at my lab results after 3 months. Cholesterol dropped 40 points. This is the real deal.",
      result: 'Cholesterol dropped 40 points', resultEmoji: '❤️', avatarEmoji: '👨', avatarBg: '#fff3e0'
    },
  ];

  readonly blogPosts: BlogPost[] = [
    {
      id: 1, category: 'Nutrition Science', date: 'March 1, 2026', emoji: '🥦',
      bgGradient: 'linear-gradient(135deg,#fde8d8,#f5c9a8)', featured: true,
      title: 'The Truth About Protein: How Much Do You Really Need?',
      excerpt: 'We analyzed 40+ studies to give you the definitive answer — and it might be different from what your fitness app says.'
    },
    {
      id: 2, category: 'Meal Prep', date: 'Feb 26, 2026', emoji: '🫙',
      bgGradient: 'linear-gradient(135deg,#e8f0dd,#c8ddb8)', featured: false,
      title: 'Sunday Meal Prep in Under 2 Hours',
      excerpt: 'Our step-by-step system for prepping an entire week of healthy food on Sunday afternoon.'
    },
    {
      id: 3, category: 'Supplements', date: 'Feb 22, 2026', emoji: '💊',
      bgGradient: 'linear-gradient(135deg,#fce4ec,#f8bbd0)', featured: false,
      title: '5 Supplements Worth Taking (& 5 to Skip)',
      excerpt: 'A registered dietitian cuts through the noise on the supplement industry\'s biggest claims.'
    },
  ];

  getRecipesByCategory(category: string): Recipe[] {
    if (category === 'all') return this.recipes;
    if (category === 'quick') return this.recipes.filter(r => r.timeMinutes <= 15);
    return this.recipes.filter(r => r.category === category);
  }
}
