/**
 * WaspLine Reader - Color gradient for easier reading
 * Based on https://github.com/corollari/waspline-reader
 */
(function() {
    'use strict';

    const COLORS = ['#4a6fa5', '#7a6b8a', '#a07a7a', '#8a7a5a']; // Muted: blue, purple, rose, tan
    const BASE_COLOR = '#1a1a1a';
    const GRADIENT_SIZE = 20; // How far the gradient extends (lower = more subtle)

    let isEnabled = false;
    let originalStyles = new Map();

    function lerp(v0, v1, t) {
        return v0 * (1 - t) + v1 * t;
    }

    function hexToRgb(hex) {
        return hex.replace('#', '').match(/.{1,2}/g).map(x => parseInt(x, 16));
    }

    function applyGradient() {
        const paragraphs = document.querySelectorAll('article p');
        const baseColor = hexToRgb(BASE_COLOR);
        let colorIdx = 0;
        let lineNo = 0;

        for (let paragraph of paragraphs) {
            // Skip short paragraphs
            if (paragraph.textContent.length < 100) continue;

            const lines = lineWrapDetector.getLines(paragraph);

            for (let line of lines) {
                if (line.length < 2) continue;

                const activeColor = hexToRgb(COLORS[colorIdx]);
                const isLeft = (lineNo % 2 === 0);

                // Store original styles
                for (let span of line) {
                    if (!originalStyles.has(span)) {
                        originalStyles.set(span, span.style.color);
                    }
                }

                // Work on a copy for direction
                let lineArray = Array.from(line);
                if (isLeft) {
                    lineArray = lineArray.reverse();
                }

                // Apply gradient
                for (let i = 0; i < lineArray.length; i++) {
                    const t = Math.max(0, 1 - (i / (lineArray.length * GRADIENT_SIZE / 50)));
                    const red = lerp(baseColor[0], activeColor[0], t);
                    const green = lerp(baseColor[1], activeColor[1], t);
                    const blue = lerp(baseColor[2], activeColor[2], t);
                    lineArray[i].style.color = `rgb(${red|0}, ${green|0}, ${blue|0})`;
                }

                if (!isLeft) {
                    colorIdx = (colorIdx + 1) % COLORS.length;
                }
                lineNo++;
            }
        }
    }

    function removeGradient() {
        for (let [span, originalColor] of originalStyles) {
            span.style.color = originalColor || '';
        }
        originalStyles.clear();
    }

    function toggle() {
        isEnabled = !isEnabled;
        if (isEnabled) {
            applyGradient();
            localStorage.setItem('waspline-enabled', 'true');
        } else {
            removeGradient();
            localStorage.setItem('waspline-enabled', 'false');
        }
        updateButton();
    }

    function updateButton() {
        const btn = document.getElementById('waspline-toggle');
        if (btn) {
            btn.textContent = isEnabled ? '🌈 On' : '🌈 Off';
            btn.title = isEnabled ? 'Disable reading gradient' : 'Enable reading gradient';
            btn.style.opacity = isEnabled ? '1' : '0.6';
        }
    }

    function init() {
        // Check saved preference (default: on)
        const saved = localStorage.getItem('waspline-enabled');
        isEnabled = saved === null ? true : saved === 'true';
        
        // Create toggle button
        const btn = document.createElement('button');
        btn.id = 'waspline-toggle';
        btn.onclick = toggle;
        btn.style.cssText = `
            position: fixed;
            bottom: 1.5rem;
            right: 1.5rem;
            padding: 0.5rem 0.75rem;
            background: var(--bg-secondary, #f0efeb);
            border: 1px solid var(--border, #d4d3cf);
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            font-family: inherit;
            transition: all 0.15s ease;
            z-index: 1000;
        `;
        document.body.appendChild(btn);
        updateButton();

        // Apply if enabled
        if (isEnabled) {
            // Small delay to let lineWrapDetector process
            setTimeout(applyGradient, 100);
        }
    }

    // Wait for DOM and lineWrapDetector
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
