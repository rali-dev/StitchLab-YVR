# video-to-website

This skill covers the complete pipeline for creating **production-grade video-driven websites**: from generating AI video prompts → extracting frames → building scroll-controlled cinematic landing pages with GSAP.

---

## PART 1 — VIDEO-TO-WEBSITE (GSAP Cinematic Layout)

Guides creation of landing pages and marketing sites with video backgrounds, scroll animations, and cinematic layouts.

### Core Principles

**Design Direction**: Commit to a bold aesthetic—brutalist, maximalist, editorial, or refined minimalism—executed with intentionality and precision.

- Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter
- Prioritize high-impact page loads with staggered reveals over scattered micro-interactions
- Never use generic AI-generated aesthetics (overused font families, predictable layouts)

### Typography
- Hero headings: minimum **6rem**, line-height 0.9–1.0
- Section headings: **3rem+**
- Marquee text: **10–15vw**, uppercase

### Layout
- Avoid cards/containers — text sits directly on backgrounds
- Rotate between centered, left/right-aligned, full-width, and split layouts across sections

### Animation (GSAP + ScrollTrigger)
- Each section uses a different entrance effect: fade-up, slide-left, scale-up, etc.
- Staggered element delays: **0.08–0.12s**
- At least one **pinned section**
- Oversized text moving **horizontally on scroll**
- Stats: **4rem+** with count-up animations via GSAP — numbers must animate, never appear static

### Implementation Snippets

```js
// Video background
<video autoplay muted loop playsinline style="object-fit:cover; width:100%; height:100%;">

// ScrollTrigger pin
ScrollTrigger.create({ trigger: ".section", pin: true, start: "top top", end: "+=500" });

// Marquee (infinite scroll)
gsap.to(".marquee-track", { x: "-50%", duration: 20, ease: "none", repeat: -1 });

// Count-up animation
const obj = { val: 0 };
gsap.to(obj, { val: 4200, duration: 2, onUpdate: () => el.textContent = Math.round(obj.val) });
```

---

## PART 2 — STOP-SCROLL BUILDER (Apple-Style Canvas Video)

Transforms a product video into a **scroll-controlled frame-by-frame playback** site using canvas — the same technique Apple uses on product pages.

### Mandatory Interview Phase

Before building, ask the user:
1. Brand name and logo
2. Accent and background colors
3. Overall design vibe
4. Content source (existing website URL or user-provided copy)
5. Optional sections: testimonials, confetti, 3D particle showcase

### Technical Pipeline

1. **Analyze** video with `ffprobe` — determine duration and frame count
2. **Extract frames** with FFmpeg at target quality (JPEG format):
   ```bash
   ffmpeg -i input.mp4 -vf fps=30 -q:v 3 frames/frame_%04d.jpg
   ```
3. **Build single-page HTML** with canvas-based rendering
4. **Preload all frames** before displaying content

> Hard requirement: Video's **first frame must show the product on a pure white background** — this is mandatory for the effect to work.

### Design System for Stop-Scroll Pages
- Fonts: **Space Grotesk** (headings) · **Archivo** (body) · **JetBrains Mono** (mono/data)
- Cards: glassmorphic — `backdrop-filter: blur(20px)`
- Background: animated starscape
- Navbar: transforms to a **centered pill shape** on scroll
- Scroll progress indicator always visible

### Canvas Frame Rendering (core logic)

```js
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const frameCount = 148;
const frames = [];

// Preload all frames
for (let i = 0; i < frameCount; i++) {
  const img = new Image();
  img.src = `frames/frame_${String(i).padStart(4,'0')}.jpg`;
  frames.push(img);
}

// Render frame on scroll
window.addEventListener('scroll', () => {
  const scrollFraction = window.scrollY / (document.body.scrollHeight - window.innerHeight);
  const frameIndex = Math.min(frameCount - 1, Math.floor(scrollFraction * frameCount));
  ctx.drawImage(frames[frameIndex], 0, 0, canvas.width, canvas.height);
});
```

---

## PART 3 — STOP-SCROLL PROMPTER (AI Video Generation)

Generates three coordinated AI prompts to create the source video for Parts 1 and 2.

### Six-Step Workflow

1. **Confirm the object** — Ask what product to feature (default: laptop)
2. **Prompt A** — Professional product shot: assembled object, white background #FFFFFF, soft studio lighting, subtle shadows, 16:9
3. **Prompt B** — Exploded/deconstructed view: 8–15 named components floating in space, clean separation
4. **Prompt C** — Video transition: assembled → deconstructed, 4–5 seconds, smooth mechanical deconstruction animation
5. **Build HTML prompt card** — Tabbed interface with one-click copy buttons + confetti on copy
6. **Present as text fallback** — Share all three prompts in chat as backup

### Key Principles for Prompts
- Maintain visual consistency across all three prompts (same lighting, same product)
- Pure white backgrounds only — no gradients, no colored surfaces
- Realistic component accuracy — name actual parts (e.g. "trackpad, keyboard, hinge, screen bezel")
- Prompts must be model-agnostic (work with Sora, Runway, Kling, etc.)

---

## Full Pipeline Summary

```
[User has a product]
       │
       ▼
PART 3: Generate AI prompts (Prompt A/B/C)
       │
       ▼
[User generates video with AI tool]
       │
       ├─► PART 1: GSAP cinematic landing page (video as background/hero)
       │
       └─► PART 2: Extract frames with FFmpeg → canvas scroll-playback page
```

---

## Pre-Delivery Checklist

- [ ] Video: `autoplay muted loop playsinline` attributes set
- [ ] Canvas: all frames preloaded before first scroll interaction
- [ ] GSAP ScrollTrigger imported and registered
- [ ] At least one pinned section exists
- [ ] Hero font ≥ 6rem with tight line-height
- [ ] Stats animate with count-up (never static)
- [ ] Navbar transforms on scroll
- [ ] Mobile fallback for canvas (show static image if frames fail to load)
- [ ] `prefers-reduced-motion` respected — disable GSAP animations if set

---

Source: https://github.com/dknz7/skills/tree/main/video-to-website
