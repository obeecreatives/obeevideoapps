import {
  ExplainerProject,
  ExplainerSlide,
  ExplainerSlideItem,
  ExplainerTheme,
} from '../types/editor';

interface ThemePalette {
  bgStart: string;
  bgEnd: string;
  surface: string;
  surfaceBorder: string;
  textPrimary: string;
  textSecondary: string;
  gridColor: string;
  headerBg: string;
  isLight: boolean;
}

const THEME_PALETTES: Record<ExplainerTheme, ThemePalette> = {
  'smartboard-dark': {
    bgStart: '#0b162a',
    bgEnd: '#112240',
    surface: 'rgba(15, 31, 56, 0.88)',
    surfaceBorder: 'rgba(56, 189, 248, 0.35)',
    textPrimary: '#f8fafc',
    textSecondary: '#cbd5e1',
    gridColor: 'rgba(148, 163, 184, 0.08)',
    headerBg: 'rgba(8, 18, 36, 0.78)',
    isLight: false,
  },
  'corporate-clean': {
    bgStart: '#f8fafc',
    bgEnd: '#e2e8f0',
    surface: 'rgba(255, 255, 255, 0.95)',
    surfaceBorder: 'rgba(15, 23, 42, 0.12)',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    gridColor: 'rgba(15, 23, 42, 0.05)',
    headerBg: 'rgba(255, 255, 255, 0.9)',
    isLight: true,
  },
  'editorial-warm': {
    bgStart: '#1c1512',
    bgEnd: '#2d211b',
    surface: 'rgba(46, 34, 28, 0.88)',
    surfaceBorder: 'rgba(245, 158, 11, 0.35)',
    textPrimary: '#fef3c7',
    textSecondary: '#d6c3b3',
    gridColor: 'rgba(251, 191, 36, 0.06)',
    headerBg: 'rgba(24, 17, 14, 0.82)',
    isLight: false,
  },
  'cyber-neon': {
    bgStart: '#09051a',
    bgEnd: '#1a0b2e',
    surface: 'rgba(24, 12, 46, 0.86)',
    surfaceBorder: 'rgba(192, 132, 252, 0.42)',
    textPrimary: '#f5f3ff',
    textSecondary: '#c4b5fd',
    gridColor: 'rgba(168, 85, 247, 0.09)',
    headerBg: 'rgba(10, 5, 26, 0.82)',
    isLight: false,
  },
};

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

function easeOutBack(t: number): number {
  const x = clamp01(t);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 2
): string[] {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) {
        lines.push(current);
        current = word;
      } else {
        lines.push(word);
        current = '';
      }
      if (lines.length >= maxLines) {
        // Add subtle ellipsis if truncated
        const lastIdx = lines.length - 1;
        if (i < words.length && !lines[lastIdx].endsWith('…')) {
          let trimmed = lines[lastIdx];
          while (trimmed.length > 3 && ctx.measureText(`${trimmed}…`).width > maxWidth) {
            trimmed = trimmed.slice(0, -1);
          }
          lines[lastIdx] = `${trimmed}…`;
        }
        return lines;
      }
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2
): number {
  const lines = wrapTextLines(ctx, text, maxWidth, maxLines);
  lines.forEach((line, idx) => {
    ctx.fillText(line, x, y + idx * lineHeight);
  });
  return lines.length * lineHeight;
}

/**
 * Renders the active AI Motion Explainer slide into any bounding rectangle (fullscreen or split/PIP slot).
 */
export function renderExplainerBoard(
  ctx: CanvasRenderingContext2D,
  project: ExplainerProject,
  currTime: number,
  dx: number,
  dy: number,
  width: number,
  height: number,
  roundedRadius = 0
): void {
  const palette = THEME_PALETTES[project.theme] || THEME_PALETTES['smartboard-dark'];
  const slides = project.slides || [];
  if (slides.length === 0) return;

  // Locate active slide
  let slideIdx = slides.findIndex(
    (s) => currTime >= s.startSec && currTime < s.endSec
  );
  if (slideIdx === -1) {
    slideIdx = currTime < slides[0].startSec ? 0 : slides.length - 1;
  }
  const slide: ExplainerSlide = slides[slideIdx];
  const slideDur = Math.max(0.5, slide.endSec - slide.startSec);
  const localTime = Math.max(0, currTime - slide.startSec);
  const progress = clamp01(localTime / slideDur);

  const isPortrait = height > width * 1.05;
  const accent = slide.accentColor || '#38bdf8';
  const unit = Math.min(width, height);

  ctx.save();

  // Clip to slot bounds
  ctx.beginPath();
  if (roundedRadius > 0) {
    ctx.roundRect(dx, dy, width, height, roundedRadius);
  } else {
    ctx.rect(dx, dy, width, height);
  }
  ctx.clip();
  ctx.translate(dx, dy);

  // 1. Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, palette.bgStart);
  bgGrad.addColorStop(1, palette.bgEnd);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Subtle animated ambient orbs
  const orbShift = Math.sin(currTime * 0.9) * unit * 0.04;
  const orb1 = ctx.createRadialGradient(
    width * 0.85 + orbShift,
    height * 0.2,
    0,
    width * 0.85 + orbShift,
    height * 0.2,
    unit * 0.65
  );
  orb1.addColorStop(0, `${accent}29`);
  orb1.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = orb1;
  ctx.fillRect(0, 0, width, height);

  const orb2 = ctx.createRadialGradient(
    width * 0.15 - orbShift,
    height * 0.78,
    0,
    width * 0.15 - orbShift,
    height * 0.78,
    unit * 0.55
  );
  orb2.addColorStop(0, palette.isLight ? 'rgba(14,165,233,0.12)' : 'rgba(99,102,241,0.18)');
  orb2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = orb2;
  ctx.fillRect(0, 0, width, height);

  // 3. Subtle studio smartboard grid
  ctx.strokeStyle = palette.gridColor;
  ctx.lineWidth = 1;
  const gridStep = Math.max(28, Math.round(unit * 0.065));
  for (let gx = gridStep; gx < width; gx += gridStep) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, height);
    ctx.stroke();
  }
  for (let gy = gridStep; gy < height; gy += gridStep) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(width, gy);
    ctx.stroke();
  }

  // 4. Smartboard top header bar
  const padX = Math.round(width * 0.055);
  const topBarH = Math.round(height * (isPortrait ? 0.085 : 0.115));

  ctx.fillStyle = palette.headerBg;
  ctx.fillRect(0, 0, width, topBarH);

  // Header accent progress bar
  ctx.fillStyle = accent;
  ctx.fillRect(0, topBarH - 3, width * ((slideIdx + progress) / slides.length), 3);

  // Deck Main Title (top-left)
  const deckFontSize = Math.max(14, Math.round(unit * (isPortrait ? 0.044 : 0.048)));
  ctx.fillStyle = palette.textPrimary;
  ctx.font = `900 ${deckFontSize}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(project.title.toUpperCase().slice(0, 28), padX, topBarH * 0.52);

  // Slide counter pill (top-right)
  const pillText = `${slideIdx + 1} / ${slides.length}`;
  const pillFont = Math.max(11, Math.round(unit * 0.026));
  ctx.font = `700 ${pillFont}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  const pillW = ctx.measureText(pillText).width + 24;
  const pillH = Math.max(22, Math.round(topBarH * 0.46));
  const pillX = width - padX - pillW;
  const pillY = (topBarH - pillH) / 2;

  ctx.fillStyle = `${accent}26`;
  ctx.strokeStyle = `${accent}99`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = palette.isLight ? palette.textPrimary : accent;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pillText, pillX + pillW / 2, pillY + pillH / 2 + 1);

  // Subtle decorative smartboard dots in top-right header (out of subtitle area!)
  if (project.theme === 'smartboard-dark' && width > 520) {
    const dots = ['#38bdf8', '#4ade80', '#facc15', '#f472b6'];
    const dotR = Math.max(3, Math.round(unit * 0.006));
    const dotGap = dotR * 3.4;
    const startDotX = pillX - 20 - (dots.length - 1) * dotGap;
    dots.forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(startDotX + i * dotGap, topBarH / 2, dotR, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 5. Slide Badge & Title Header (animated slide-in)
  const titleIn = easeOutCubic(localTime / 0.4);
  const contentTop = topBarH + Math.round(height * 0.028);
  // Reserve dedicated bottom safe zone (23% of height) so subtitles NEVER overlap cards
  const contentBottom = height - Math.round(height * (isPortrait ? 0.23 : 0.22));
  const contentW = width - padX * 2;

  ctx.save();
  ctx.globalAlpha = titleIn;
  ctx.translate(0, (1 - titleIn) * 16);

  // Badge label
  const badgeFontSize = Math.max(10, Math.round(unit * 0.023));
  ctx.font = `800 ${badgeFontSize}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  const badgeLabel = slide.badge.toUpperCase();
  const badgeW = Math.min(contentW * 0.7, ctx.measureText(badgeLabel).width + 20);
  const badgeH = Math.max(18, Math.round(badgeFontSize * 1.75));
  ctx.fillStyle = `${accent}24`;
  ctx.strokeStyle = `${accent}80`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(padX, contentTop, badgeW, badgeH, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = palette.isLight ? '#0369a1' : accent;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeLabel, padX + 10, contentTop + badgeH / 2 + 1);

  // Slide Title
  const slideTitleY = contentTop + badgeH + Math.round(unit * 0.018);
  const slideTitleFont = Math.max(17, Math.round(unit * (isPortrait ? 0.056 : 0.056)));
  ctx.font = `800 ${slideTitleFont}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.fillStyle = palette.textPrimary;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const titleUsedH = drawWrappedText(
    ctx,
    slide.title,
    padX,
    slideTitleY,
    contentW,
    slideTitleFont * 1.16,
    2
  );

  ctx.restore();

  // Body area coordinates
  const bodyTop = slideTitleY + titleUsedH + Math.round(unit * 0.024);
  const bodyHeight = Math.max(80, contentBottom - bodyTop);

  // 6. Render Layout-specific Body
  if (slide.layout === 'comparison-flow' && slide.rightItems && slide.rightItems.length > 0) {
    drawComparisonFlow(
      ctx,
      slide,
      palette,
      accent,
      padX,
      bodyTop,
      contentW,
      bodyHeight,
      localTime,
      slideDur,
      isPortrait
    );
  } else if (slide.layout === 'big-stat' || slide.layout === 'cta-finale') {
    drawBigStatOrFinale(
      ctx,
      slide,
      palette,
      accent,
      padX,
      bodyTop,
      contentW,
      bodyHeight,
      localTime,
      slideDur,
      isPortrait,
      currTime
    );
  } else {
    drawStepCards(
      ctx,
      slide,
      palette,
      accent,
      padX,
      bodyTop,
      contentW,
      bodyHeight,
      localTime,
      slideDur,
      isPortrait
    );
  }

  ctx.restore();
}

function drawStepCards(
  ctx: CanvasRenderingContext2D,
  slide: ExplainerSlide,
  palette: ThemePalette,
  accent: string,
  x: number,
  y: number,
  w: number,
  h: number,
  localTime: number,
  slideDur: number,
  isPortrait: boolean
) {
  const items = slide.items || [];
  if (items.length === 0) return;

  const gap = Math.round(Math.min(w, h) * 0.042);
  const useColumns = !isPortrait && items.length <= 3 && slide.layout === 'hero-hook';

  if (useColumns) {
    const cardW = (w - gap * (items.length - 1)) / items.length;
    const cardH = Math.min(h * 0.92, 235);
    const startY = y + (h - cardH) * 0.35;

    items.forEach((item, idx) => {
      const delay = 0.2 + idx * Math.min(0.55, slideDur * 0.16);
      const t = easeOutBack((localTime - delay) / 0.42);
      if (t <= 0.01) return;

      const cx = x + idx * (cardW + gap);
      ctx.save();
      ctx.globalAlpha = clamp01((localTime - delay) / 0.24);
      ctx.translate(cx + cardW / 2, startY + cardH / 2 + (1 - t) * 20);
      ctx.scale(0.93 + 0.07 * t, 0.93 + 0.07 * t);
      ctx.translate(-cardW / 2, -cardH / 2);

      ctx.fillStyle = palette.surface;
      ctx.strokeStyle = idx === 0 ? accent : palette.surfaceBorder;
      ctx.lineWidth = idx === 0 ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.roundRect(0, 0, cardW, cardH, 16);
      ctx.fill();
      ctx.stroke();

      // Emoji circle (bright opaque emoji!)
      const iconR = Math.max(18, Math.min(cardW, cardH) * 0.16);
      ctx.fillStyle = `${accent}2e`;
      ctx.strokeStyle = `${accent}77`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(iconR + 20, iconR + 18, iconR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // CRITICAL: opaque fillStyle so color emoji renders at 100% brightness
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.round(iconR * 1.15)}px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.icon || '✨', iconR + 20, iconR + 20);

      // Title
      const titleFs = Math.max(14, Math.round(Math.min(cardW * 0.068, cardH * 0.145)));
      ctx.fillStyle = palette.textPrimary;
      ctx.font = `800 ${titleFs}px 'Plus Jakarta Sans', system-ui, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const titleH = drawWrappedText(
        ctx,
        item.title,
        20,
        iconR * 2 + 28,
        cardW - 40,
        titleFs * 1.22,
        2
      );

      // Desc
      const descFs = Math.max(11, Math.round(Math.min(cardW * 0.052, cardH * 0.105)));
      ctx.fillStyle = palette.textSecondary;
      ctx.font = `500 ${descFs}px 'Plus Jakarta Sans', system-ui, sans-serif`;
      drawWrappedText(
        ctx,
        item.desc,
        20,
        iconR * 2 + 34 + titleH,
        cardW - 40,
        descFs * 1.3,
        3
      );

      ctx.restore();
    });
    return;
  }

  // Stacked vertical cards (bullet-steps & 9:16 portrait)
  const count = items.length;
  const maxCardH = Math.min(96, (h - gap * Math.max(0, count - 1)) / Math.max(1, count));
  const totalBlockH = maxCardH * count + gap * Math.max(0, count - 1);
  const startY = y + Math.max(0, (h - totalBlockH) * 0.25);

  items.forEach((item, idx) => {
    const delay = 0.18 + idx * Math.min(0.65, (slideDur * 0.5) / Math.max(1, count));
    const t = easeOutCubic((localTime - delay) / 0.38);
    if (t <= 0.01) return;

    const cy = startY + idx * (maxCardH + gap);
    ctx.save();
    ctx.globalAlpha = t;
    ctx.translate(x + (1 - t) * 24, cy);

    ctx.fillStyle = palette.surface;
    ctx.strokeStyle = palette.surfaceBorder;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, maxCardH, 14);
    ctx.fill();
    ctx.stroke();

    // Left accent stripe
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(0, 0, 6, maxCardH, [14, 0, 0, 14]);
    ctx.fill();

    // Emoji badge
    const badgeR = Math.max(15, Math.min(maxCardH * 0.34, 26));
    const badgeCx = 18 + badgeR;
    const badgeCy = maxCardH / 2;
    ctx.fillStyle = `${accent}2e`;
    ctx.strokeStyle = `${accent}80`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(badgeCx, badgeCy, badgeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.round(badgeR * 1.1)}px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.icon || `${idx + 1}`, badgeCx, badgeCy + 1);

    const textX = badgeCx + badgeR + 16;
    const textW = w - textX - 18;
    const titleFs = Math.max(13, Math.round(Math.min(maxCardH * 0.28, w * 0.038)));
    const descFs = Math.max(11, Math.round(Math.min(maxCardH * 0.21, w * 0.028)));

    ctx.fillStyle = palette.textPrimary;
    ctx.font = `800 ${titleFs}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    drawWrappedText(
      ctx,
      `${idx + 1}. ${item.title}`,
      textX,
      maxCardH * 0.19,
      textW,
      titleFs * 1.15,
      1
    );

    ctx.fillStyle = palette.textSecondary;
    ctx.font = `500 ${descFs}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    drawWrappedText(
      ctx,
      item.desc,
      textX,
      maxCardH * 0.56,
      textW,
      descFs * 1.2,
      1
    );

    ctx.restore();
  });
}

function drawComparisonFlow(
  ctx: CanvasRenderingContext2D,
  slide: ExplainerSlide,
  palette: ThemePalette,
  accent: string,
  x: number,
  y: number,
  w: number,
  h: number,
  localTime: number,
  slideDur: number,
  isPortrait: boolean
) {
  const leftItems = slide.items || [];
  const rightItems = slide.rightItems || [];
  const maxRows = Math.max(1, leftItems.length, rightItems.length);

  const computeListMetrics = (bh: number, count: number) => {
    const headerH = Math.max(22, Math.round(bh * 0.12));
    const listY = headerH + 6;
    const availH = bh - listY;
    const gap = Math.max(8, Math.round(availH * 0.055));
    const cardH = Math.min(76, (availH - gap * Math.max(0, count - 1)) / Math.max(1, count));
    return { headerH, listY, gap, cardH };
  };

  const drawMiniList = (
    items: ExplainerSlideItem[],
    colTitle: string,
    bx: number,
    by: number,
    bw: number,
    bh: number,
    colAccent: string,
    baseDelay: number,
    rowCountForScale: number
  ) => {
    const { headerH, listY, gap, cardH } = computeListMetrics(bh, rowCountForScale);
    const tHead = easeOutCubic((localTime - baseDelay) / 0.32);

    ctx.save();
    ctx.globalAlpha = tHead;
    ctx.fillStyle = colAccent;
    ctx.font = `800 ${Math.max(11, Math.round(Math.min(bw, bh) * 0.06))}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(colTitle.toUpperCase(), bx + 4, by + headerH * 0.45);
    ctx.restore();

    items.forEach((it, i) => {
      const t = easeOutCubic((localTime - (baseDelay + 0.12 + i * 0.22)) / 0.35);
      if (t <= 0.01) return;
      const cy = by + listY + i * (cardH + gap);

      ctx.save();
      ctx.globalAlpha = t;
      ctx.translate(bx, cy + (1 - t) * 12);
      ctx.fillStyle = palette.surface;
      ctx.strokeStyle = `${colAccent}70`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(0, 0, bw, cardH, 12);
      ctx.fill();
      ctx.stroke();

      const iconR = Math.max(13, Math.min(cardH * 0.32, 21));
      ctx.fillStyle = `${colAccent}30`;
      ctx.strokeStyle = `${colAccent}77`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(14 + iconR, cardH / 2, iconR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Bright opaque emoji
      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.round(iconR * 1.1)}px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(it.icon || '⚡', 14 + iconR, cardH / 2 + 1);

      const tx = 14 + iconR * 2 + 12;
      const maxTextW = bw - tx - 12;
      const titleFs = Math.max(11, Math.round(Math.min(cardH * 0.27, bw * 0.054)));
      const descFs = Math.max(10, Math.round(Math.min(cardH * 0.21, bw * 0.042)));

      ctx.fillStyle = palette.textPrimary;
      ctx.font = `800 ${titleFs}px 'Plus Jakarta Sans', system-ui, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      drawWrappedText(ctx, it.title, tx, cardH * 0.18, maxTextW, titleFs * 1.15, 1);

      ctx.fillStyle = palette.textSecondary;
      ctx.font = `500 ${descFs}px 'Plus Jakarta Sans', system-ui, sans-serif`;
      drawWrappedText(ctx, it.desc, tx, cardH * 0.56, maxTextW, descFs * 1.2, 1);
      ctx.restore();
    });
  };

  if (isPortrait) {
    const halfH = (h - 28) / 2;
    drawMiniList(
      leftItems,
      slide.leftColumnTitle || 'Tantangan',
      x,
      y,
      w,
      halfH,
      accent,
      0.12,
      leftItems.length
    );

    const arrowT = easeOutCubic((localTime - slideDur * 0.32) / 0.32);
    if (arrowT > 0.01) {
      ctx.save();
      ctx.globalAlpha = arrowT;
      ctx.fillStyle = '#facc15';
      ctx.font = `900 18px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⬇', x + w / 2, y + halfH + 14);
      ctx.restore();
    }

    drawMiniList(
      rightItems,
      slide.rightColumnTitle || 'Solusi',
      x,
      y + halfH + 28,
      w,
      halfH,
      '#4ade80',
      slideDur * 0.35,
      rightItems.length
    );
    return;
  }

  // Landscape side-by-side flow
  const arrowZoneW = Math.round(w * 0.1);
  const colW = (w - arrowZoneW) / 2;

  drawMiniList(
    leftItems,
    slide.leftColumnTitle || 'Profil & Masalah',
    x,
    y,
    colW,
    h,
    accent,
    0.12,
    maxRows
  );

  // Laser-aligned glowing connecting arrows matching exact card vertical centers!
  const { listY, gap, cardH } = computeListMetrics(h, maxRows);
  const arrowT = easeOutCubic((localTime - slideDur * 0.28) / 0.42);
  if (arrowT > 0.01) {
    const ax1 = x + colW + 10;
    const ax2 = x + colW + arrowZoneW - 10;
    const rows = Math.min(leftItems.length, rightItems.length);
    ctx.save();
    ctx.strokeStyle = '#facc15';
    ctx.fillStyle = '#facc15';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.globalAlpha = arrowT;

    for (let r = 0; r < rows; r++) {
      const ay = y + listY + r * (cardH + gap) + cardH / 2;
      const curX = ax1 + (ax2 - ax1) * arrowT;
      ctx.beginPath();
      ctx.moveTo(ax1, ay);
      ctx.lineTo(curX, ay);
      ctx.stroke();

      if (arrowT > 0.7) {
        ctx.beginPath();
        ctx.moveTo(curX, ay);
        ctx.lineTo(curX - 9, ay - 6);
        ctx.lineTo(curX - 9, ay + 6);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawMiniList(
    rightItems,
    slide.rightColumnTitle || 'Nilai & Solusi',
    x + colW + arrowZoneW,
    y,
    colW,
    h,
    '#4ade80',
    slideDur * 0.32,
    maxRows
  );
}

function drawBigStatOrFinale(
  ctx: CanvasRenderingContext2D,
  slide: ExplainerSlide,
  palette: ThemePalette,
  accent: string,
  x: number,
  y: number,
  w: number,
  h: number,
  localTime: number,
  _slideDur: number,
  isPortrait: boolean,
  currTime: number
) {
  const popT = easeOutBack((localTime - 0.12) / 0.45);
  const heroH = Math.round(h * (isPortrait ? 0.44 : 0.5));

  // Center Hero Spotlight Card
  ctx.save();
  ctx.globalAlpha = clamp01((localTime - 0.08) / 0.28);
  ctx.translate(x + w / 2, y + heroH / 2);
  ctx.scale(0.88 + 0.12 * popT, 0.88 + 0.12 * popT);

  const grad = ctx.createLinearGradient(-w / 2, -heroH / 2, w / 2, heroH / 2);
  grad.addColorStop(0, `${accent}30`);
  grad.addColorStop(1, palette.surface);
  ctx.fillStyle = grad;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -heroH / 2, w, heroH, 18);
  ctx.fill();
  ctx.stroke();

  // Sparkle particles around spotlight
  const sparkleCount = 6;
  for (let i = 0; i < sparkleCount; i++) {
    const angle = (i / sparkleCount) * Math.PI * 2 + currTime * 0.7;
    const sx = Math.cos(angle) * (w * 0.36);
    const sy = Math.sin(angle) * (heroH * 0.32);
    const pulse = 0.5 + 0.5 * Math.sin(currTime * 5 + i);
    ctx.fillStyle = `rgba(250, 204, 21, ${0.35 + 0.65 * pulse})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.5 + pulse * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const statText =
    slide.highlightStat ||
    (slide.layout === 'cta-finale' ? 'SIAP MULAI SEKARANG!' : '100% OPTIMAL');
  const statFs = Math.max(22, Math.round(Math.min(w * 0.082, heroH * 0.4)));
  ctx.fillStyle = palette.isLight ? palette.textPrimary : '#facc15';
  ctx.font = `900 ${statFs}px 'Plus Jakarta Sans', system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(statText.slice(0, 28), 0, -heroH * 0.1);

  const subLabel = slide.highlightLabel || slide.subtitle || '';
  if (subLabel) {
    const lblFs = Math.max(12, Math.round(Math.min(w * 0.032, heroH * 0.16)));
    ctx.fillStyle = palette.textSecondary;
    ctx.font = `600 ${lblFs}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    ctx.fillText(subLabel.slice(0, 62), 0, heroH * 0.25);
  }
  ctx.restore();

  // Bottom badges (items) with proper multi-line text wrap (no mid-word chopping!)
  const items = (slide.items || []).slice(0, 3);
  if (items.length === 0) return;

  const badgeAreaY = y + heroH + 14;
  const badgeAreaH = Math.max(54, h - heroH - 14);
  const gap = 12;
  const itemW = (w - gap * (items.length - 1)) / items.length;
  const itemH = Math.min(96, badgeAreaH);

  items.forEach((it, idx) => {
    const t = easeOutCubic((localTime - (0.38 + idx * 0.2)) / 0.34);
    if (t <= 0.01) return;
    const ix = x + idx * (itemW + gap);

    ctx.save();
    ctx.globalAlpha = t;
    ctx.translate(ix, badgeAreaY + (1 - t) * 14);
    ctx.fillStyle = palette.surface;
    ctx.strokeStyle = palette.surfaceBorder;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(0, 0, itemW, itemH, 12);
    ctx.fill();
    ctx.stroke();

    const titleFs = Math.max(11, Math.round(Math.min(itemW * 0.068, itemH * 0.22)));
    const descFs = Math.max(10, Math.round(Math.min(itemW * 0.052, itemH * 0.175)));

    // Draw emoji + title cleanly
    ctx.fillStyle = palette.textPrimary;
    ctx.font = `700 ${titleFs}px 'Plus Jakarta Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    drawWrappedText(
      ctx,
      `${it.icon || '✅'} ${it.title}`,
      itemW / 2,
      itemH * 0.16,
      itemW - 20,
      titleFs * 1.2,
      1
    );

    ctx.fillStyle = palette.textSecondary;
    ctx.font = `500 ${descFs}px 'Plus Jakarta Sans', system-ui, sans-serif`;
    drawWrappedText(
      ctx,
      it.desc,
      itemW / 2,
      itemH * 0.48,
      itemW - 20,
      descFs * 1.25,
      2
    );
    ctx.restore();
  });
}
