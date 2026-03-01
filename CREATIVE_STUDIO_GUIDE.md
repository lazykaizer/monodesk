idea validator karo ab
# Creative Studio - Quick Reference Guide

## 🎨 Generation Modes

| Mode | Description | Key Feature |
|------|-------------|-------------|
| **Text to Image** 🖼️ | High-fidelity images from text | Concept enhancement with Gemini Pro |
| **Text to Video** 🎥 | Cinematic videos with Veo | 30-90 second generations |
| **Logo Maker** 🎨 | Professional square logos | **1:1 aspect ratio** enforced |
| **Agency Replacer** 📸 | Product photography compositing | **Dual upload** + preservation AI |

---

## 🚀 Quick Start

### 1. Setup Database (One-time)
```bash
# Run supabase_migration.sql in Supabase SQL Editor
# Creates creative_history table with RLS policies
```

### 2. Generate Your First Asset
1. Navigate to `/dashboard/creative`
2. Select mode from **left sidebar**
3. Enter prompt (or upload images for Agency mode)
4. Click Send or press Enter
5. Asset appears + auto-saves to **history**

### 3. Browse History Safely
- Click history item → **Modal opens** (current work preserved)
- Click "Reuse This Prompt" to copy prompt
- Click "Close" to return without changes

---

## 💡 Mode-Specific Tips

### Logo Maker
- **Input:** Simple brand name or concept
- **Example:** "coffee shop", "tech startup", "fitness brand"
- **Output:** Perfect square (1:1 ratio) suitable for app icons
- **Auto-enhancement:** System adds professional styling keywords

### Agency Replacer (Product Photography)

**NEW: Dual Upload System**

1. **Product Image** (Required - Cyan border)
   - Your actual product to preserve
   - Example: Circular watch, red headphones, square phone

2. **Reference Image** (Optional - Gray border)
   - Background scene or model photo
   - Example: Model holding phone, mountain landscape, office desk

3. **Placement Instruction**
   - Describe how to position product
   - Example: "Product held by model", "On wooden table", "Floating in air"

**How It Works:**
- AI receives both images + preservation prompt
- Product's exact shape/color/design preserved 100%
- Product placed into reference scene with realistic lighting
- Professional product photography quality

**Example Flow:**
```
Upload: Circular watch (product)
Upload: Model photo (reference)
Prompt: "Watch worn on model's wrist"
Result: EXACT circular watch on model with realistic shadows
```

---

## 🎯 New Features (Latest Update)

### ✅ History Modal (Prevents Data Loss)
- **Before:** Clicking history overwrote current prompt
- **Now:** Modal opens, current work stays safe
- **Actions:** "Reuse This Prompt" or "Close"

### ✅ Generation Protection
- History disabled during generation (grayed out)
- Prevents accidental cancellation
- Clear visual feedback

### ✅ Logo Aspect Ratio
- All logos generate as perfect squares (1:1)
- Suitable for app icons, favicons, branding
- No more landscape/portrait logos

### ✅ Agency Mode Deep Fix
- **Preservation Prompting:** Strict CRITICAL RULES prevent AI from regenerating products
- **Multimodal Input:** Actual images sent to API (base64), not just descriptions
- **Product Integrity:** Shape, color, design remain 100% identical

---

## 🎨 UI Layout

```
┌──────────┬─────────────────────────┬──────────┐
│  Modes   │        Header           │ History  │
│  (Left)  │   (Status Indicator)    │ (Right)  │
├──────────┼─────────────────────────┼──────────┤
│          │                         │          │
│ • Image  │   Generated Asset       │ Recent   │
│ • Video  │      Display            │ Items    │
│ • Logo   │   (Center Canvas)       │          │
│ • Agency │                         │ (Modal   │
│          ├─────────────────────────┤  on      │
│          │  Input & Generate Bar   │  click)  │
│          │                         │          │
└──────────┴─────────────────────────┴──────────┘
```

**Agency Mode Dual Upload:**
```
┌─────────────────────┬─────────────────────┐
│ Product Image *     │ Reference Image     │
│ (Cyan border)       │ (Gray border)       │
│ REQUIRED            │ OPTIONAL            │
└─────────────────────┴─────────────────────┘
```

---

## ⚡ Keyboard Shortcuts

- `Enter` - Generate (when input focused)
- `Esc` - Close history modal
- **Drag & Drop** - Drag any history item into upload zones or prompt area

---

## 🖱️ Drag & Drop Features

### Reuse History Assets
1. **Drag** any image from the "Recent Creations" sidebar.
2. **Drop** it into:
   - **Agency Product Box:** To use it as the product to preserve.
   - **Agency Reference Box:** To use it as the background scene.
   - **Main Prompt Area:** To trigger **Variation Mode** (Multimodal).

### Manual Upload
1. Click the **`+` (Plus)** button next to the prompt input (in Image, Video, or Logo modes).
2. Select an image from your device.
3. This image will be used as a reference for your next generation.

### Variation Mode (Multimodal)
- **Image-to-Image (Image/Logo):** Gemini uses your image as a structural/style base.
- **Image-to-Video (Video):** Veo uses your image as the starting frame/reference for the animation.
- Describe the changes you want in the prompt box (e.g., "Make it snow").

---

## 📊 Generation Times

| Type | Duration | Notes |
|------|----------|-------|
| Image | 5-15s | With concept enhancement |
| Logo | 5-15s | 1:1 aspect ratio |
| Agency | 10-20s | Multimodal processing |
| Video | 30-90s | Veo generation |

---

## 🔧 Troubleshooting

### "No history showing"
✅ Run `supabase_migration.sql` in Supabase  
✅ Verify you're logged in  
✅ Check console for warnings (table may not exist)

### "Generation failed"
✅ Check `NEXT_PUBLIC_GEMINI_API_KEY` in `.env.local`  
✅ Verify network connection  
✅ Check console for specific error

### "Agency mode generates new product instead of preserving mine"
✅ Ensure both images uploaded successfully (previews visible)  
✅ Check console logs for "Product image provided"  
✅ Verify API supports multimodal input (nano-banana-pro-preview)

### "History overwrites my current prompt"
✅ **Fixed!** History now opens in modal  
✅ Click "Reuse This Prompt" to explicitly copy  
✅ Current work never overwritten automatically

### "Can't click history during generation"
✅ **Expected behavior** - prevents cancellation  
✅ Wait for generation to complete  
✅ History re-enables automatically

---

## 🎨 Theme Colors

- **Primary:** Cyan (`#06B6D4`) - Buttons, accents, active states
- **Secondary:** Blue (`#3B82F6`) - Gradients, highlights
- **Background:** Dark (`#020202`, `#050505`, `#0a0a0a`)
- **Text:** White/Zinc (`#fff`, `#d4d4d4`, `#71717a`)

---

## 📝 Technical Notes

### History System
- Supabase-powered cloud storage
- User-specific (RLS policies)
- Last 20 creations
- Auto-saves on successful generation

### API Integration
- **Image/Logo/Agency:** Gemini Imagen 3 (nano-banana-pro-preview)
- **Video:** Veo 2
- **Concept Enhancement:** Gemini 2.5 Pro (text model)

### Agency Mode Architecture
```
User Uploads → Base64 Conversion → Multimodal API Call
[Product Image] + [Reference Image] + [Preservation Prompt]
                        ↓
                  Gemini API
                        ↓
            Preserved Product in Scene
```

---

## 🚀 Best Practices

1. **Logo Mode:** Keep prompts under 5 words for best results
2. **Agency Mode:** Use high-quality product images (clear, well-lit)
3. **History:** Review modal before reusing prompts (context matters)
4. **Generation:** Don't interrupt - wait for completion
5. **Prompts:** Be specific but concise

---

## 🔐 Security

- RLS policies ensure user data isolation
- Images processed server-side
- API keys stored in environment variables
- History visible only to authenticated users

---

**Last Updated:** 2026-02-11  
**Version:** 2.0 (Deep Fix + UX Refinements)
