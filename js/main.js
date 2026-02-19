/* ============================================
   GRAND SUITE MODERN - メインスクリプト
   ============================================ */

(function ($) {
  'use strict';

  /* ------------------------------------------
     0. 設定値（CONFIG）
     gsap-animations.js・premium-effects.js と同パターンで
     マジックナンバーを排除
     ------------------------------------------ */
  const CONFIG = {
    scroll: {
      threshold: 50,          // ヘッダー背景切り替えの閾値（px）
      fadeInOffset: 80,       // フェードイン発火のオフセット（px）
      throttleWait: 16        // スクロールスロットル間隔（ms）≒ 60fps
    },
    resize: {
      throttleWait: 200,      // リサイズスロットル間隔（ms）
      mobileBreakpoint: 1024  // モバイル⇔PC の切り替え幅（px）
    },
    sakura: {
      petalCount: 15,
      duration: [4, 8],       // animation-duration の範囲（秒）
      delay:    [0, 6],       // animation-delay の範囲（秒）
      size:     [8, 16],      // 花びらサイズの範囲（px）
      opacity:  [0.3, 0.7]    // 不透明度の範囲
    },
    heroFallbackHeight: 400   // ヒーロー高さ取得失敗時のフォールバック（px）
  };

  /* ------------------------------------------
     1. ユーティリティ
     ------------------------------------------ */

  /**
   * スクロールイベントのスロットリング
   * 最後の呼び出しも確実に実行する trailing edge 付き
   * @param {Function} fn - 実行する関数
   * @param {number} wait - 間隔（ms）
   * @returns {Function}
   */
  function throttle(fn, wait) {
    let lastTime = 0;
    let timerId = null;
    // trailing edge で「最後の呼び出し」の引数を使うため
    // 毎回上書きして最新値を保持する
    let lastArgs = null;
    let lastThis = null;
    return function () {
      const now = Date.now();
      const remaining = wait - (now - lastTime);
      lastArgs = arguments;
      lastThis = this;

      if (remaining <= 0) {
        clearTimeout(timerId);
        timerId = null;
        lastTime = now;
        fn.apply(lastThis, lastArgs);
        lastArgs = lastThis = null;
      } else if (!timerId) {
        // trailing edge: 最後のイベントを確実に処理
        // ※ arrow function は外側の lastArgs/lastThis を参照するため
        //    タイマー発火時に最新の値が使われる
        timerId = setTimeout(() => {
          lastTime = Date.now();
          timerId = null;
          fn.apply(lastThis, lastArgs);
          lastArgs = lastThis = null;
        }, remaining);
      }
    };
  }

  /**
   * prefers-reduced-motion を確認
   * @returns {boolean}
   */
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * スマートフォン判定（ビューポート幅 768px 以下）
   * @returns {boolean}
   */
  function isMobile() {
    return window.innerWidth <= 768;
  }

  /**
   * ランダムな範囲値を返すヘルパー
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  function randomRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  /* ------------------------------------------
     2. ナビゲーション - アクティブ状態
     ------------------------------------------ */

  /**
   * 現在のページに対応するナビリンクに .active を付与
   * パスの末尾とhref属性を比較（ルート "/" は index.html と見なす）
   */
  function setActiveNav() {
    const { pathname } = location;
    const currentPage = pathname.endsWith('/') ? 'index.html' : pathname.split('/').pop();

    $('.nav-list a, .mobile-nav a').each(function () {
      $(this).toggleClass('active', $(this).attr('href') === currentPage);
    });
  }

  /* ------------------------------------------
     3. ハンバーガーメニュー
     GSAP カーテンメニュー（window._curtainMenu）が利用可能な場合は
     タイムラインで開閉、それ以外は CSS トランジションにフォールバック
     ------------------------------------------ */

  function initHamburgerMenu() {
    const $hamburger = $('.hamburger');
    const $mobileNav = $('.mobile-nav');
    const $body = $('body');

    /**
     * GSAP カーテン API を取得
     * gsap-animations.js の init 後に確定するため遅延参照
     * @returns {object|null}
     */
    let curtainCache = null;
    function getCurtain() {
      return curtainCache || (curtainCache = window._curtainMenu || null);
    }

    /** メニューを開く */
    function openMenu() {
      $hamburger.addClass('active')
        .attr('aria-expanded', 'true')
        .attr('aria-label', 'メニューを閉じる');
      $body.addClass('menu-open');

      const curtain = getCurtain();
      curtain ? curtain.open() : $mobileNav.addClass('active');
    }

    /** メニューを閉じる */
    function closeMenu() {
      $hamburger.removeClass('active')
        .attr('aria-expanded', 'false')
        .attr('aria-label', 'メニューを開く');
      $body.removeClass('menu-open');

      const curtain = getCurtain();
      curtain ? curtain.close() : $mobileNav.removeClass('active');
    }

    $hamburger.on('click', function () {
      // カーテンアニメーション再生中はクリックを無視（状態不整合を防止）
      const curtain = getCurtain();
      if (curtain && curtain.isAnimating()) return;

      $(this).hasClass('active') ? closeMenu() : openMenu();
    });

    // モバイルメニューリンククリックで閉じる
    $mobileNav.on('click', 'a', closeMenu);

    // Escキーでメニューを閉じる
    // カーテンアニメーション再生中は無視（click ハンドラと同様の安全策）
    $(document).on('keydown', function (e) {
      if (e.key !== 'Escape' || !$hamburger.hasClass('active')) return;
      const curtain = getCurtain();
      if (curtain && curtain.isAnimating()) return;
      closeMenu();
      $hamburger.trigger('focus');
    });

    // リサイズ時にメニューがPC表示で開いたままにならないよう閉じる
    $(window).on('resize', throttle(function () {
      if (window.innerWidth > CONFIG.resize.mobileBreakpoint && $hamburger.hasClass('active')) {
        closeMenu();
      }
    }, CONFIG.resize.throttleWait));
  }

  /* ------------------------------------------
     4. スクロールハンドラ（統合版・DOM キャッシュ）
     ------------------------------------------ */

  /** DOM要素をキャッシュして参照を再利用 */
  const cache = {};

  /** ヘッダースクロール状態の前回値（冗長な toggleClass を抑止） */
  let wasScrolled = false;

  function initScrollCache() {
    cache.$header = $('.site-header');
    cache.$window = $(window);
    // GSAP 有効フラグ: gsap-animations.js の IIFE 実行後に確定するため
    // DOMContentLoaded 時点で安全にキャッシュ可能
    cache.isGsapReady = document.documentElement.classList.contains('gsap-ready');

    // GSAP が有効な場合は ScrollTrigger が制御するため、
    // CSS フォールバック用の DOM キャッシュは不要
    if (!cache.isGsapReady) {
      cache.$fadeIns = $('.fade-in');
      cache.$floatingCta = $('.floating-cta');
      cache.$scrollProgress = $('.scroll-progress');
      cache.heroHeight = $('.hero, .page-hero').outerHeight() || CONFIG.heroFallbackHeight;
      // ドキュメント全体の高さ（スクロール進捗バーの分母）
      // $(document).height() は複数のレイアウト読取りを伴うためキャッシュし、
      // resize 時に再計算する
      cache.docHeight = $(document).height() - cache.$window.height();
    }
  }

  /** リサイズ時にキャッシュ値を再計算 */
  function updateScrollCache() {
    if (!cache.isGsapReady) {
      cache.heroHeight = $('.hero, .page-hero').outerHeight() || CONFIG.heroFallbackHeight;
      cache.docHeight = $(document).height() - cache.$window.height();
    }
  }

  function onScroll() {
    const scrollTop = cache.$window.scrollTop();

    // 4-a. ヘッダー背景の切り替え（状態が変わった時のみ DOM 操作）
    const isScrolled = scrollTop > CONFIG.scroll.threshold;
    if (isScrolled !== wasScrolled) {
      cache.$header.toggleClass('is-scrolled', isScrolled);
      wasScrolled = isScrolled;
    }

    // 4-b. フェードインアニメーション（GSAP 未使用時のフォールバック）
    // GSAP が有効な場合は gsap-animations.js 側で ScrollTrigger が制御するためスキップ
    if (cache.isGsapReady) return;

    // フェードイン
    if (cache.$fadeIns.length) {
      const windowBottom = scrollTop + cache.$window.height();
      cache.$fadeIns.each(function () {
        if (windowBottom > $(this).offset().top + CONFIG.scroll.fadeInOffset) {
          $(this).addClass('visible');
        }
      });
      // 表示済みの要素をキャッシュから除外し、以降のループを軽量化
      cache.$fadeIns = cache.$fadeIns.not('.visible');
    }

    // フローティングCTAフォールバック
    if (cache.$floatingCta.length) {
      cache.$floatingCta.toggleClass('is-visible', scrollTop > cache.heroHeight);
    }

    // スクロール進捗バーフォールバック
    if (cache.$scrollProgress.length) {
      const progress = cache.docHeight > 0 ? (scrollTop / cache.docHeight) * 100 : 0;
      cache.$scrollProgress.css('width', `${progress}%`);
    }
  }

  /* ------------------------------------------
     5. 桜アニメーション（design.html）
     CSS @keyframes フォールバック版
     GSAP 有効時は gsap-animations.js 側で GSAP タイムラインに置き換え
     ------------------------------------------ */

  function initSakuraAnimation() {
    const $container = $('.sakura-container');
    if ($container.length === 0 || prefersReducedMotion() || isMobile()) return;

    // GSAP が有効な場合は gsap-animations.js 側で制御するためスキップ
    if (document.documentElement.classList.contains('gsap-ready')) return;

    const { sakura } = CONFIG;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < sakura.petalCount; i++) {
      const petal = document.createElement('div');
      petal.className = 'sakura-petal';

      const size = randomRange(sakura.size[0], sakura.size[1]);
      petal.style.cssText = [
        `left:${randomRange(0, 100)}%`,
        `animation-duration:${randomRange(sakura.duration[0], sakura.duration[1])}s`,
        `animation-delay:${randomRange(sakura.delay[0], sakura.delay[1])}s`,
        `width:${size}px`,
        `height:${size}px`,
        `opacity:${randomRange(sakura.opacity[0], sakura.opacity[1])}`,
      ].join(';');
      fragment.appendChild(petal);
    }
    $container[0].appendChild(fragment);
  }

  /* ------------------------------------------
     6. 俯瞰図ラベルクリック（interior.html）
     ------------------------------------------ */

  function initFloorplanLabels() {
    const $section = $('.floorplan-labels');
    if ($section.length === 0) return;

    // イベント委譲: 親要素で一括管理
    $section.on('click', '.floorplan-label', function () {
      const name = $(this).data('name');
      if (name) {
        alert(`${name} の詳細情報をご覧いただけます。`);
      }
    });
  }

  /* ------------------------------------------
     7. 初期化
     ------------------------------------------ */

  $(function () {
    initScrollCache();
    setActiveNav();
    initHamburgerMenu();
    initSakuraAnimation();
    initFloorplanLabels();

    // 初期表示時のスクロールチェック
    onScroll();

    // スクロールイベント（passive: true でスクロール性能を向上）
    // jQuery の .on() は passive 未対応のため vanilla JS を使用
    window.addEventListener('scroll', throttle(onScroll, CONFIG.scroll.throttleWait), { passive: true });

    // リサイズ時にキャッシュ値を更新
    cache.$window.on('resize', throttle(updateScrollCache, CONFIG.resize.throttleWait));
  });
})(jQuery);
