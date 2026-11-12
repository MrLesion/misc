/*!
 * neon-arcade-intro.js — animated NEON ARCADE intro as a drop-in JS component.
 *
 * Usage:
 *   <script src="neon-arcade-intro.js"></script>
 *   <script>
 *     NeonArcadeIntro.mount('#intro', { gameName: 'Tetris' })
 *       .then(function (intro) { return intro.replay(); });
 *   </script>
 *
 * The byline defaults to `presents {gameName}` and can be customized
 * via the `byline` option (string or (gameName) => string).
 */
(function (global) {
  'use strict';

  var VIEW_W = 1024;
  var VIEW_H = 301;
  var TITLE = 'NEON ARCADE';
  var BG = '#05060c';

  var FONT_HREF =
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@500;800&display=swap';

  var STAR_POINTS = [
    150.93, 114.0, 140.12, 123.24, 169.46, 157.3, 128.08, 139.85, 114.04,
    177.53, 99.96, 139.93, 59.3, 158.33, 88.17, 123.16, 76.96, 114.0, 41.85,
    84.83, 97.56, 95.7, 113.44, 45.53, 129.51, 95.23, 186.19, 84.11,
  ];

  var TITLE_SIZE = 80;
  var TITLE_TRACKING = 8;
  var TITLE_BASELINE = 143;
  var BY_SIZE = 26;
  var BY_BASELINE = 223.72;
  var BY_MAX_W = 900;

  var STAR_MIN_X = 41.85;
  var STAR_WIDTH = 186.19 - STAR_MIN_X;
  var GAP_STAR_TEXT = 40;

  var uidCounter = 0;

  var SHARED_CSS = [
    '.na-star{opacity:0;animation:naStarIn .9s ease-out .2s forwards}',
    '.na-letter{opacity:0;animation:naBlinkIn 1.1s linear forwards}',
    '.na-by{opacity:0;animation:naFadeIn .7s ease-out 3.6s forwards}',
    '.na-sheen{animation:naSweep 2.8s linear 4.2s infinite}',
    '@keyframes naStarIn{to{opacity:1}}',
    '@keyframes naFadeIn{to{opacity:1}}',
    '@keyframes naBlinkIn{0%{opacity:0}8%{opacity:1}16%{opacity:.05}' +
      '30%{opacity:1}40%{opacity:0}55%{opacity:1}64%{opacity:.15}' +
      '78%{opacity:1}100%{opacity:1}}',
    '@keyframes naSweep{0%{transform:translateX(-340px)}100%{transform:translateX(1120px)}}',
    '@media (prefers-reduced-motion:reduce){' +
      '.na-star,.na-letter,.na-by{animation-duration:.01s;animation-delay:0s}' +
      '.na-sheen{animation:none}}',
  ].join('\n');

  function ensureFont() {
    if (!global.document || document.getElementById('na-orbitron-font')) return;
    var link = document.createElement('link');
    link.id = 'na-orbitron-font';
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    document.head.appendChild(link);
    var style = document.createElement('style');
    style.id = 'na-intro-css';
    style.textContent = SHARED_CSS;
    document.head.appendChild(style);
  }

  function waitForFonts() {
    var ready = Promise.all([
      document.fonts.load('800 ' + TITLE_SIZE + 'px Orbitron'),
      document.fonts.load('500 ' + BY_SIZE + 'px Orbitron'),
    ]);
    var timeout = new Promise(function (resolve) {
      setTimeout(resolve, 2000);
    });
    return Promise.race([ready, timeout]).catch(function () {});
  }

  function el(name, attrs, children) {
    var node = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (var key in attrs) {
      if (attrs[key] == null) continue;
      node.setAttribute(key, attrs[key]);
    }
    (children || []).forEach(function (child) {
      node.appendChild(child);
    });
    return node;
  }

  function measureCtx() {
    var canvas = document.createElement('canvas');
    return canvas.getContext('2d');
  }

  function layoutTitle(ctx) {
    ctx.font = '800 ' + TITLE_SIZE + 'px Orbitron, sans-serif';
    var letters = [];
    var x = 0;
    for (var i = 0; i < TITLE.length; i++) {
      var ch = TITLE[i];
      if (ch !== ' ') {
        letters.push({ ch: ch, x: x });
      }
      x += ctx.measureText(ch).width + TITLE_TRACKING;
    }
    return { letters: letters, width: x - TITLE_TRACKING };
  }

  function layoutByline(ctx, text) {
    var size = BY_SIZE;
    ctx.font = '500 ' + size + 'px Orbitron, sans-serif';
    var width = ctx.measureText(text).width;
    if (width > BY_MAX_W) {
      size = Math.floor(size * (BY_MAX_W / width));
      ctx.font = '500 ' + size + 'px Orbitron, sans-serif';
      width = ctx.measureText(text).width;
    }
    return { size: size, width: width };
  }

  function buildDefs(uid) {
    var starGrad = el('radialGradient', { id: uid + '-sg', cx: '50%', cy: '46%', r: '62%' });
    [
      ['0%', '#f82e97'],
      ['30%', '#6e1b60'],
      ['62%', '#7c1f66'],
      ['100%', '#ff2e97'],
    ].forEach(function (stop) {
      starGrad.appendChild(el('stop', { offset: stop[0], 'stop-color': stop[1] }));
    });

    var neonGrad = el('linearGradient', { id: uid + '-ng', x1: 0, y1: 0, x2: 0, y2: 1 });
    [
      ['0%', '#eaffff'],
      ['45%', '#8fe8ff'],
      ['100%', '#4fc9ff'],
    ].forEach(function (stop) {
      neonGrad.appendChild(el('stop', { offset: stop[0], 'stop-color': stop[1] }));
    });

    var sheenGrad = el('linearGradient', { id: uid + '-shg', x1: 0, y1: 0, x2: 1, y2: 0 });
    [
      ['0', '0'],
      ['0.5', '0.75'],
      ['1', '0'],
    ].forEach(function (stop) {
      sheenGrad.appendChild(
        el('stop', { offset: stop[0], 'stop-color': '#fff', 'stop-opacity': stop[1] })
      );
    });

    var glow = el('filter', {
      id: uid + '-glow', x: '-40%', y: '-40%', width: '180%', height: '180%',
    });
    glow.appendChild(el('feGaussianBlur', { in: 'SourceAlpha', stdDeviation: 5, result: 'b1' }));
    glow.appendChild(el('feFlood', { 'flood-color': '#37c8ff', 'flood-opacity': 0.85, result: 'c1' }));
    glow.appendChild(el('feComposite', { in: 'c1', in2: 'b1', operator: 'in', result: 'g1' }));
    glow.appendChild(el('feGaussianBlur', { in: 'SourceAlpha', stdDeviation: 13, result: 'b2' }));
    glow.appendChild(el('feFlood', { 'flood-color': '#1e90ff', 'flood-opacity': 0.55, result: 'c2' }));
    glow.appendChild(el('feComposite', { in: 'c2', in2: 'b2', operator: 'in', result: 'g2' }));
    var merge = el('feMerge');
    ['g2', 'g1', 'SourceGraphic'].forEach(function (node) {
      merge.appendChild(el('feMergeNode', { in: node }));
    });
    glow.appendChild(merge);

    var softGlow = el('filter', {
      id: uid + '-soft', x: '-60%', y: '-60%', width: '220%', height: '220%',
    });
    softGlow.appendChild(el('feGaussianBlur', { in: 'SourceAlpha', stdDeviation: 2.5, result: 'b' }));
    softGlow.appendChild(el('feFlood', { 'flood-color': '#9db8ff', 'flood-opacity': 0.7, result: 'c' }));
    softGlow.appendChild(el('feComposite', { in: 'c', in2: 'b', operator: 'in', result: 'g' }));
    var softMerge = el('feMerge');
    ['g', 'SourceGraphic'].forEach(function (node) {
      softMerge.appendChild(el('feMergeNode', { in: node }));
    });
    softGlow.appendChild(softMerge);

    return el('defs', {}, [starGrad, neonGrad, sheenGrad, glow, softGlow]);
  }

  function buildSvg(options) {
    var uid = 'na' + ++uidCounter;
    var gameName = options.gameName || 'YOUR GAME';
    var bylineText =
      typeof options.byline === 'function'
        ? options.byline(gameName)
        : options.byline != null
          ? options.byline
          : 'presents ' + gameName;

    var ctx = measureCtx();
    var title = layoutTitle(ctx);
    var byline = layoutByline(ctx, bylineText);

    var contentW = STAR_WIDTH + GAP_STAR_TEXT + title.width;
    var left = (VIEW_W - contentW) / 2;
    var dx = left - STAR_MIN_X;
    var titleX = left + STAR_WIDTH + GAP_STAR_TEXT;

    var svg = el('svg', {
      viewBox: '0 0 ' + VIEW_W + ' ' + VIEW_H,
      width: '100%',
      role: 'img',
      'aria-label': TITLE + ' — ' + bylineText,
    });

    svg.appendChild(buildDefs(uid));

    svg.appendChild(el('rect', { width: VIEW_W, height: VIEW_H, fill: BG }));

    var logoGroup = el('g', { transform: 'translate(' + dx.toFixed(2) + ',0)' });

    logoGroup.appendChild(
      el('polygon', {
        class: 'na-star',
        points: STAR_POINTS.join(','),
        fill: 'url(#' + uid + '-sg)',
      })
    );

    var titleGroup = el('g', { filter: 'url(#' + uid + '-glow)', fill: 'url(#' + uid + '-ng)' });
    var letterIds = [];
    title.letters.forEach(function (letter) {
      var id = uid + '-l' + letterIds.length;
      letterIds.push(id);
      titleGroup.appendChild(
        el(
          'text',
          {
            id: id,
            class: 'na-letter',
            x: titleX + letter.x,
            y: TITLE_BASELINE,
            'font-family': 'Orbitron, sans-serif',
            'font-weight': 800,
            'font-size': TITLE_SIZE,
            style: 'animation-delay:' + (0.9 + Math.random() * 1.7).toFixed(2) + 's',
          },
          [document.createTextNode(letter.ch)]
        )
      );
    });
    logoGroup.appendChild(titleGroup);
    svg.appendChild(logoGroup);

    var clip = el('clipPath', { id: uid + '-clip' });
    letterIds.forEach(function (id) {
      clip.appendChild(el('use', { href: '#' + id }));
    });
    svg.appendChild(clip);

    svg.appendChild(
      el('rect', {
        class: 'na-sheen',
        x: -260,
        y: 65,
        width: 240,
        height: 98,
        fill: 'url(#' + uid + '-shg)',
        'clip-path': 'url(#' + uid + '-clip)',
      })
    );

    svg.appendChild(
      el(
        'text',
        {
          class: 'na-by',
          x: VIEW_W / 2,
          y: BY_BASELINE,
          'text-anchor': 'middle',
          'font-family': 'Orbitron, sans-serif',
          'font-weight': 500,
          'font-size': byline.size,
          fill: '#cdd6ee',
          filter: 'url(#' + uid + '-soft)',
        },
        [document.createTextNode(bylineText)]
      )
    );

    return svg;
  }

  function resolveTarget(target) {
    if (typeof target === 'string') return document.querySelector(target);
    return target;
  }

  function mount(target, options) {
    options = options || {};
    ensureFont();
    return waitForFonts().then(function () {
      var host = resolveTarget(target);
      if (!host) throw new Error('neon-arcade-intro: target not found: ' + target);
      host.innerHTML = '';
      var svg = buildSvg(options);
      host.appendChild(svg);
      return {
        el: svg,
        replay: function () {
          return mount(target, options);
        },
      };
    });
  }

  var api = { mount: mount, TITLE: TITLE };
  global.NeonArcadeIntro = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
