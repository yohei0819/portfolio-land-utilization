/* ============================================
   GRAND SUITE MODERN - プレミアム演出
   Lenis / ローディング / カスタムカーソル /
   マグネティックボタン / テキストグラデーション
   ============================================ */

(function () {
  'use strict';

  /* ------------------------------------------
     0. 共通ユーティリティの参照（utils.js から取得）
     ------------------------------------------ */
  const { prefersReducedMotion, isTouchDevice, isMobile, hasGsap, hasScrollTrigger } = window.AppUtils;

  /* ------------------------------------------
     1. 設定値（CONFIG）
     gsap-animations.js の CONFIG パターンに準拠し、
     マジックナンバーを排除
     ------------------------------------------ */
  const CONFIG = {
    lenis: {
      duration: 1.2,             // スクロールの平滑化時間
      wheelMultiplier: 1,
      touchMultiplier: 2
    },
    loading: {
      lineDuration: 0.8,         // ゴールドライン伸長秒数
      lineDelay: 0.3,            // ライン開始遅延
      lineEase: 'power4.inOut',
      logoDuration: 0.6,         // ロゴ出現秒数
      logoDelay: 0.6,            // ロゴ開始遅延
      logoEase: 'power2.out',
      logoY: 20,                 // ロゴの初期Y位置（px）
      logoScale: 0.95,           // ロゴの初期スケール
      holdDuration: 0.6,         // ブランド印象の待機秒数
      fadeOutDuration: 0.3,      // フェードアウト秒数
      fadeOutEase: 'power2.in',
      curtainDuration: 0.8,      // カーテン開閉秒数
      curtainEase: 'power4.inOut',
      curtainOverlap: 0.1,       // カーテン開始のオーバーラップ秒数
      fallbackDelay: 500          // GSAP なし時のフォールバック遅延（ms）
    },
    magnetic: {
      defaultStrength: 0.3,      // デフォルトの吸い寄せ強度
      navStrength: 0.2,          // ナビリンクの吸い寄せ強度
      moveDuration: 0.3,         // 吸い寄せ移動秒数
      moveEase: 'power2.out',
      returnDuration: 0.6,       // 戻りアニメーション秒数
      returnEase: 'elastic.out(1, 0.3)'
    },
    textGradient: {
      colorFrom: 'rgba(255, 255, 255, 0.3)',  // 初期色（グレー）
      colorTo: '#c8b88a',                       // 最終色（ゴールド）
      stagger: 0.03,             // 文字間遅延（秒）
      triggerStart: 'top 80%',   // スクロールトリガー開始位置
      triggerEnd: 'center 40%',  // スクロールトリガー終了位置
      scrub: 1                   // scrub 平滑度
    }
  };

  /* ------------------------------------------
     2. Lenis スムーススクロール
     ------------------------------------------ */

  /**
   * Lenis による慣性スクロールを初期化
   * ScrollTrigger と自動連携し、スクロール位置を同期
   */
  function initLenis() {
    // タッチデバイスではネイティブの慣性スクロールが十分なため
    // Lenis を無効化し、ScrollTrigger との競合を防止
    if (typeof Lenis === 'undefined' || prefersReducedMotion() || isTouchDevice()) return;

    const cfg = CONFIG.lenis;

    const lenis = new Lenis({
      duration: cfg.duration,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: cfg.wheelMultiplier,
      touchMultiplier: cfg.touchMultiplier,
      infinite: false
    });

    // ScrollTrigger との連携
    if (hasScrollTrigger()) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (time) {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      // ScrollTrigger なしの場合は rAF ループで駆動
      // 初回のタイムスタンプはブラウザが提供するため手動指定しない
      // ※ strictモードではブロック内の function 宣言は実装依存のため関数式を使用
      const raf = function (time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }

    // メニュー開閉時にスクロールを停止・再開する API を公開
    window._lenis = lenis;

    // body.menu-open の class 変化を監視
    // attributeFilter で 'class' のみに絞り、不要な発火を抑制
    // is-loading 解除など無関係な class 変更での冗長呼び出しを prev 状態で回避
    let menuOpen = false;
    new MutationObserver(function () {
      const isOpen = document.body.classList.contains('menu-open');
      if (isOpen === menuOpen) return;
      menuOpen = isOpen;
      if (isOpen) {
        lenis.stop();
      } else {
        lenis.start();
      }
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  /* ------------------------------------------
     3. ローディングアニメーション
     ------------------------------------------ */

  /**
   * ページ読み込み時にゴールドラインがロゴを描画→画面が開くアニメーション
   *
   * 演出フロー:
   *   1. ゴールドラインが中央から左右に伸びる
   *   2. ロゴテキストがフェードイン
   *   3. ブランド印象を刻むため待機
   *   4. ロゴとラインがフェードアウト
   *   5. カーテンが上下に開く
   *   6. ローディングスクリーンを DOM から除去
   */
  function initLoadingAnimation() {
    const screen = document.querySelector('.loading-screen');
    if (!screen) return;

    /** ローディング完了の共通処理（DOM 除去 & ScrollTrigger リフレッシュ） */
    function completeLoading() {
      screen.remove();
      document.body.classList.remove('is-loading');
      if (hasScrollTrigger()) {
        ScrollTrigger.refresh();
      }
      // ローディング完了を通知（ヒーローアニメーション連携用）
      window.dispatchEvent(new CustomEvent('loadingComplete'));
    }

    // モーション抑制時またはスマホでは即完了
    if (prefersReducedMotion() || isMobile()) {
      completeLoading();
      return;
    }

    // GSAP が未読み込みの場合はフォールバック
    if (!hasGsap()) {
      setTimeout(completeLoading, CONFIG.loading.fallbackDelay);
      return;
    }

    const cfg = CONFIG.loading;
    const logoText = screen.querySelector('.loading-logo-text');
    const line = screen.querySelector('.loading-line');
    const topCurtain = screen.querySelector('.loading-curtain--top');
    const bottomCurtain = screen.querySelector('.loading-curtain--bottom');

    // 必要な子要素が揃っていない場合はスキップして即完了
    if (!logoText || !line || !topCurtain || !bottomCurtain) {
      completeLoading();
      return;
    }

    // 初期状態
    gsap.set(screen, { autoAlpha: 1 });
    gsap.set(logoText, { opacity: 0, y: cfg.logoY, scale: cfg.logoScale });
    gsap.set(line, { scaleX: 0, transformOrigin: 'center center' });

    gsap.timeline({ onComplete: completeLoading })
      // Step 1: ゴールドラインが中央から左右に伸びる
      .to(line, {
        scaleX: 1,
        duration: cfg.lineDuration,
        ease: cfg.lineEase
      }, cfg.lineDelay)
      // Step 2: ロゴテキストがフェードイン
      .to(logoText, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: cfg.logoDuration,
        ease: cfg.logoEase
      }, cfg.logoDelay)
      // Step 3+4: ブランド印象の待機後、ロゴとラインがフェードアウト
      // 空の tween を挟む代わりに position パラメータで待機を表現
      .to([logoText, line], {
        opacity: 0,
        duration: cfg.fadeOutDuration,
        ease: cfg.fadeOutEase
      }, '+=' + cfg.holdDuration)
      // Step 5: カーテンが上下に開く
      .to(topCurtain, {
        yPercent: -100,
        duration: cfg.curtainDuration,
        ease: cfg.curtainEase
      }, '-=' + cfg.curtainOverlap)
      .to(bottomCurtain, {
        yPercent: 100,
        duration: cfg.curtainDuration,
        ease: cfg.curtainEase
      }, '<');
  }

  /* ------------------------------------------
     4. マグネティックボタン
     ------------------------------------------ */

  /**
   * CTA ボタンやナビリンクに「吸い寄せ」効果を適用
   * マウスが近づくとボタンがカーソル方向に微妙に移動し、
   * 離れると elastic easing で元に戻る
   */
  function initMagneticButtons() {
    if (isTouchDevice() || prefersReducedMotion() || !hasGsap()) return;

    const cfg = CONFIG.magnetic;

    /**
     * 要素にマグネティック効果を適用するヘルパー
     * @param {Element} el       - 対象要素
     * @param {number}  strength - 吸い寄せ強度（0〜1）
     */
    function applyMagnetic(el, strength) {
      // mouseenter 時に位置をキャッシュし、
      // mousemove 毎の getBoundingClientRect() 呼び出しを回避
      let rect = null;

      el.addEventListener('mouseenter', function () {
        rect = el.getBoundingClientRect();
      });

      el.addEventListener('mousemove', function (e) {
        if (!rect) return;
        const deltaX = (e.clientX - (rect.left + rect.width / 2)) * strength;
        const deltaY = (e.clientY - (rect.top + rect.height / 2)) * strength;
        gsap.to(el, {
          x: deltaX,
          y: deltaY,
          duration: cfg.moveDuration,
          ease: cfg.moveEase
        });
      });

      el.addEventListener('mouseleave', function () {
        rect = null;
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: cfg.returnDuration,
          ease: cfg.returnEase
        });
      });
    }

    // セレクタと強度のマッピング
    // ※ 元のコードでは el.classList.contains('nav-list') で判定していたが、
    //    .nav-list は li の親要素のため a 要素では一致しない不具合があった
    const targets = [
      { selector: '.nav-list li a', strength: cfg.navStrength },
      { selector: '.floating-cta__link, .footer-cta__btn, .btn, .hero-cm a', strength: cfg.defaultStrength }
    ];

    targets.forEach(function (group) {
      document.querySelectorAll(group.selector).forEach(function (el) {
        applyMagnetic(el, group.strength);
      });
    });
  }

  /* ------------------------------------------
     5. テキストスクロール連動グラデーション
     ------------------------------------------ */

  /**
   * HTMLタグを保持しつつテキスト文字を個別 <span> でラップする
   * 正規表現で「HTMLタグ」と「非空白文字」を交互にマッチさせ、
   * 元の文字ループ処理（20行超）を1行に集約
   *
   * @param {string} html - 元の innerHTML
   * @returns {string} ラップ後の HTML
   */
  function wrapCharsInSpans(html) {
    // HTMLタグ → エンティティ（&amp; &#123; &#xAB;）→ 通常文字 の順でマッチ
    // エンティティを1単位として扱い、文字分割で壊れるのを防止
    return html.replace(
      /(<[^>]+>)|(&[a-zA-Z]+;|&#\d+;|&#x[\da-fA-F]+;)|([^\s<])/g,
      function (match, tag, entity, char) {
        if (tag) return tag;
        return '<span class="gradient-char">' + (entity || char) + '</span>';
      }
    );
  }

  /**
   * ブランドステートメントの文字をスクロールに連動して
   * 1文字ずつグレー→ゴールドに変化させる
   */
  function initTextScrollGradient() {
    if (!hasScrollTrigger() || prefersReducedMotion() || isMobile()) return;

    const quoteEl = document.querySelector('.brand-statement__quote');
    if (!quoteEl) return;

    const cfg = CONFIG.textGradient;

    // テキストを1文字ずつ <span> でラップ
    quoteEl.innerHTML = wrapCharsInSpans(quoteEl.innerHTML);

    const chars = quoteEl.querySelectorAll('.gradient-char');
    if (!chars.length) return;

    gsap.set(chars, { color: cfg.colorFrom });

    gsap.to(chars, {
      color: cfg.colorTo,
      stagger: cfg.stagger,
      scrollTrigger: {
        trigger: quoteEl,
        start: cfg.triggerStart,
        end: cfg.triggerEnd,
        scrub: cfg.scrub
      }
    });
  }

  /* ------------------------------------------
     6. 初期化
     ------------------------------------------ */

  /**
   * 全プレミアム演出を初期化
   * 各モジュールは内部でフィーチャーディテクションを行うため
   * 呼び出し順に依存関係はない
   */
  function init() {
    initLenis();
    initLoadingAnimation();
    initMagneticButtons();
    initTextScrollGradient();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
