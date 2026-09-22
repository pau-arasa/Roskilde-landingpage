# Cat and mouse header animation

An original hand-inked animation made in Blender 5.2.1. All character outlines,
fills and moving parts are editable Blender objects with baked keyframes.

- Timeline: frames 1–240 at 24 fps, exactly 10 seconds.
- Output: 1280 × 256 (5:1), orthographic camera, transparent background.
- `cat-mouse-header.blend`: native scene, animation, camera, materials and timeline markers.
- `cat-mouse-header.webm`: transparent VP9 video for the website.
- `cat-mouse-preview.mp4`: video on the site's cream background for easy review.
- `sleeping-poster.png`: transparent final pose and reduced-motion fallback.
- `frames/`: full-resolution RGBA PNG render sequence.
- `preview.html`: playback, transparency and header-size preview.
- `storyboard.jpg`: key poses from the actual render.

## Timing

| Frames | Action |
| --- | --- |
| 1–94 | Mouse enters from the left; cat follows toward the right. |
| 95–124 | Mouse reverses left; the trailing cat leaps and lands. |
| 125–169 | Cat faces the viewer, looks left, then right in confusion. |
| 170–200 | Cat lowers its head, curls up and settles. |
| 201–240 | Sleeping breath and hand-drawn Z marks. |

## Website use

Play once and keep the final sleeping pose. Do not set `loop` unless you want
the scene to jump back to its beginning. The video contains no audio.

```html
<video class="header-cat" muted playsinline preload="metadata"
       poster="assets/sleeping-poster.png" aria-hidden="true">
  <source src="assets/cat-mouse-header.webm" type="video/webm">
</video>
<script>
  const cat = document.querySelector('.header-cat');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cat.play().catch(() => {});
  }
</script>
```

Use `width: 100%; height: 100%; object-fit: contain; pointer-events: none;` in the
header's available left column. Keep the poster for browsers without supported
transparent video playback. The MP4 is a cream-background preview, not an alpha export.

The live website and repository have not been changed by this animation delivery.
