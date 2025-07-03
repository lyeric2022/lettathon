# Assets Directory

## Adding the Catfish Logo

1. **Add your catfish PNG file** to this directory with the name `catfish-logo.png`
2. **Recommended specifications:**
   - Size: 48x48 pixels (or higher resolution for retina displays)
   - Format: PNG with transparency
   - Style: Clean, modern design that matches the app's aesthetic

## File Structure
```
src/renderer/assets/
├── catfish-logo.png        # Your catfish logo (add this file)
├── catfish-placeholder.svg # Temporary placeholder (already included)
└── README.md              # This file
```

## Usage
The logo is automatically loaded in the MainScreen component with smart fallbacks:
```tsx
<CatfishLogo src="/assets/catfish-logo.png" alt="Catfish" />
```

## Fallback System
1. **Primary**: Tries to load `catfish-logo.png` (your custom PNG)
2. **Secondary**: Falls back to `catfish-placeholder.svg` (included placeholder)
3. **Final**: Shows emoji 🐟 if both fail

## How to Add Your PNG
1. Create or find a catfish PNG image
2. Resize it to 48x48 pixels (or higher for retina)
3. Save it as `catfish-logo.png` in this directory
4. Restart the development server (`npm run dev`)

The app will automatically use your PNG instead of the placeholder! 