/* ============================================
   GRAND SUITE MODERN - 共通ユーティリティ
   全スクリプト（main.js / gsap-animations.js /
   premium-effects.js）から参照される共有関数群
   ============================================ */

window.AppUtils = (function () {
  'use strict';

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
   * タッチデバイスかどうかを判定
   * @returns {boolean}
   */
  function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * GSAP が利用可能かどうかを判定
   * @returns {boolean}
   */
  function hasGsap() {
    return typeof gsap !== 'undefined';
  }

  /**
   * GSAP + ScrollTrigger が利用可能かどうかを判定
   * @returns {boolean}
   */
  function hasScrollTrigger() {
    return hasGsap() && typeof ScrollTrigger !== 'undefined';
  }

  /**
   * ランダムな範囲値を返す
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  function randomRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   * スクロールイベントのスロットリング（trailing edge 付き）
   * 最後の呼び出しも確実に実行する
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
        timerId = setTimeout(() => {
          lastTime = Date.now();
          timerId = null;
          fn.apply(lastThis, lastArgs);
          lastArgs = lastThis = null;
        }, remaining);
      }
    };
  }

  return {
    prefersReducedMotion: prefersReducedMotion,
    isMobile: isMobile,
    isTouchDevice: isTouchDevice,
    hasGsap: hasGsap,
    hasScrollTrigger: hasScrollTrigger,
    randomRange: randomRange,
    throttle: throttle
  };
})();
