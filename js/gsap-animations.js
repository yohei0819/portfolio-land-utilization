/* ============================================
   GRAND SUITE MODERN - GSAP アニメーション
   パララックス / マスクリビール / テキスト行分割
   ============================================ */

(function () {
  'use strict';

  /* ------------------------------------------
     0. ガード & プラグイン登録
     ------------------------------------------ */
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    return; // GSAP 未読み込み時は何もしない（CSS フォールバックに任せる）
  }

  gsap.registerPlugin(ScrollTrigger);

  /**
   * prefers-reduced-motion を確認
   * @returns {boolean}
   */
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // モーション抑制が有効な場合、全GSAP処理をスキップ
  if (prefersReducedMotion()) {
    // フォールバック：非表示要素を即座に表示
    document.querySelectorAll('.fade-in').forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    // カウンターを最終値で即座に表示
    document.querySelectorAll('.stat-item__value[data-count]').forEach(function (el) {
      const target = parseFloat(el.getAttribute('data-count'));
      if (isNaN(target) || target <= 0) return;
      el.textContent = target % 1 !== 0
        ? target.toFixed(1)
        : Math.round(target).toLocaleString();
    });
    return;
  }

  // GSAP が制御開始したことを示すフラグ
  document.documentElement.classList.add('gsap-ready');

  /* ------------------------------------------
     1. 共通設定
     ------------------------------------------ */
  const CONFIG = {
    parallax: {
      speed: 0.15,       // 背景のズレ量（0〜1）
      scale: 1.2,         // はみ出し防止の拡大率
      imageScale: 1.1,    // コンテンツ画像の拡大率
      imageY: -30          // コンテンツ画像の縦移動量（px）
    },
    reveal: {
      duration: 1.0,      // マスクがスライドする秒数
      ease: 'power4.inOut'
    },
    splitText: {
      stagger: 0.12,      // 行ごとの遅延（秒）
      duration: 0.9,
      ease: 'power3.out',
      yOffset: 60          // 下からの移動量（px）
    },
    fadeIn: {
      duration: 0.8,
      y: 40,
      stagger: 0.15,
      ease: 'power2.out'
    },
    trigger: {
      start: 'top 80%',   // スクロールトリガー発火位置
      once: true            // 一度だけ実行
    },
    curtainMenu: {
      curtainDuration: 0.6,    // カーテンスライド秒数
      curtainEase: 'power4.inOut',
      linkDuration: 0.4,       // リンク出現秒数
      linkStagger: 0.08,       // リンク間の遅延
      linkEase: 'power2.out',
      linkX: -40,              // リンクの横移動量（px）
      linkOverlap: 0.2,        // カーテン終盤でリンクが始まる重複時間（秒）
      lineDuration: 0.5,       // ゴールドライン描画秒数
      lineOverlap: 0.3,        // リンク終盤でラインが始まる重複時間（秒）
      hamburgerDuration: 0.3,  // ハンバーガー変形秒数
      hamburgerSpanGap: 6,     // hamburger spanのgap（px） ※CSSと一致させる
      hamburgerSpanH: 1.5,     // hamburger span高さ（px） ※CSSと一致させる
      closeTimeScale: 1.3      // 閉じる時の速度倍率（やや高速）
    },
    scrollProgress: {
      scrub: 0.3               // スクロール追従の平滑度
    },
    floatingCta: {
      showDuration: 0.4,       // 表示アニメーション秒数
      hideDuration: 0.3,       // 非表示アニメーション秒数
      showEase: 'power2.out',
      hideEase: 'power2.in',
      yOffset: 20,             // Y方向の移動量（px）
      heroStart: 'bottom 80%', // ヒーロー通過の検知位置
      footerStart: 'top 90%'   // フッター接近の検知位置
    },
    counter: {
      duration: 2,             // カウントアップ秒数
      ease: 'power1.out',
      start: 'top 85%'         // トリガー発火位置
    },
    divider: {
      ornamentDuration: 0.4,   // オーナメントの拡大秒数
      ornamentEase: 'back.out(1.7)',
      lineDuration: 0.6,       // ラインの伸長秒数
      lineEase: 'power2.out',
      lineStagger: 0.1,        // 左右ラインの時差
      lineOverlap: 0.2,        // オーナメントとラインの重複秒数
      start: 'top 85%'         // トリガー発火位置
    },
    sakura: {
      petalCount: 15,
      duration: [4, 8],        // 落下時間の範囲（秒）
      delay: [0, 6],           // 開始遅延の範囲（秒）
      size: [8, 16],           // 花びらサイズの範囲（px）
      opacity: [0.3, 0.7],     // 不透明度の範囲
      // 各セグメント（25%刻み）での横移動量（px）
      sway: [30, -20, 25, -10]
    }
  };

  /* ------------------------------------------
     2. パララックス
     ------------------------------------------ */

  /**
   * ヒーロー背景・画像にスクロール速度差をつける
   * 対象: .hero-bg, .parallax-bg
   */
  function initParallax() {
    /**
     * 背景要素にパララックスを適用する共通ヘルパー
     * @param {Element} bg    - 背景要素
     * @param {string}  start - ScrollTrigger の start 位置
     */
    function applyBgParallax(bg, start) {
      const parent = bg.parentElement;
      if (!parent) return; // 孤立ノード対策

      gsap.set(bg, { scale: CONFIG.parallax.scale });

      gsap.to(bg, {
        y: function () {
          return parent.offsetHeight * CONFIG.parallax.speed;
        },
        ease: 'none',
        scrollTrigger: {
          trigger: parent,
          start: start,
          end: 'bottom top',
          scrub: true
        }
      });
    }

    // ヒーロー背景のパララックス
    document.querySelectorAll('.hero-bg').forEach(function (bg) {
      applyBgParallax(bg, 'top top');
    });

    // feature-block / equipment-block / concept-image 内の画像パララックス
    // ※ .reveal-mask 内の画像はマスクリビールと scale が競合するため除外
    const parallaxSelectors = [
      '.feature-block__image:not(.reveal-mask) img',
      '.feature-block__images:not(.reveal-mask) img',
      '.equipment-block__image:not(.reveal-mask) img',
      '.concept-image:not(.reveal-mask) img',
      '.comparison__image img'
    ].join(', ');

    document.querySelectorAll(parallaxSelectors).forEach(function (img) {
      const triggerEl = img.closest('.feature-block, .equipment-block, .concept-image, .comparison__item');
      if (!triggerEl) return;

      gsap.set(img, { scale: CONFIG.parallax.imageScale });

      gsap.to(img, {
        y: CONFIG.parallax.imageY,
        ease: 'none',
        scrollTrigger: {
          trigger: triggerEl,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    });

    // ブランドステートメント帯・インタースティシャルの背景パララックス
    document.querySelectorAll('.brand-statement__bg, .interstitial__bg').forEach(function (bg) {
      applyBgParallax(bg, 'top bottom');
    });
  }

  /* ------------------------------------------
     3. マスクリビール
     ------------------------------------------ */

  /**
   * .reveal-mask クラスの画像コンテナにゴールドマスクのスライドアニメーションを適用
   * JS で overlay div を自動生成（HTML 手動追加不要）
   */
  function initMaskReveal() {
    document.querySelectorAll('.reveal-mask').forEach(function (container) {
      // overlay が未作成なら動的生成
      let overlay = container.querySelector('.reveal-mask__overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'reveal-mask__overlay';
        overlay.setAttribute('aria-hidden', 'true');
        container.appendChild(overlay);
      }

      // FOUC 防止: overlay を即座に非表示にする
      // ※ timeline 内の fromTo は paused 状態では immediateRender しないケースがあるため、
      //   DOM 追加直後に明示的に scaleX: 0 を設定しておく
      gsap.set(overlay, { scaleX: 0 });

      // 画像を初期非表示
      const img = container.querySelector('img');
      if (img) {
        gsap.set(img, { scale: 1.2 });
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: container,
          start: CONFIG.trigger.start,
          once: CONFIG.trigger.once
        },
        // アニメーション完了後に画像のインライン transform を除去
        // ※ overlay は scaleX(0) のまま保持する（clearProps すると再表示されてしまう）
        onComplete: function () {
          if (img) gsap.set(img, { clearProps: 'transform' });
          // CSS の hover 用 transition を復元（.gsap-ready .reveal-mask.is-revealed img）
          container.classList.add('is-revealed');
        }
      });

      // Phase 1: マスクが左→右にスライドイン（画像を隠した状態で覆う）
      tl.fromTo(overlay,
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: CONFIG.reveal.duration * 0.5, ease: 'power4.inOut' }
      );

      // Phase 2: マスクが左→右に退場（画像が現れる）
      tl.to(overlay, {
        scaleX: 0,
        transformOrigin: 'right center',
        duration: CONFIG.reveal.duration * 0.5,
        ease: 'power4.inOut'
      });

      // 画像のスケール戻し（Phase 2 開始と同時に開始）
      if (img) {
        tl.to(img, {
          scale: 1,
          duration: CONFIG.reveal.duration * 0.8,
          ease: 'power2.out'
        }, '-=' + (CONFIG.reveal.duration * 0.5));
      }
    });
  }

  /* ------------------------------------------
     4. テキスト行分割フェードイン
     ------------------------------------------ */

  /**
   * .split-text 要素内のテキストを <br> で行に分割し、
   * 各行を overflow:hidden のラッパーで包んでから下→上にフェードイン
   * SplitText プラグイン不要の軽量実装
   */
  function initSplitTextAnimation() {
    document.querySelectorAll('.split-text').forEach(function (el) {
      // すでに分割済みならスキップ
      if (el.querySelector('.line-wrap')) return;

      const html = el.innerHTML;

      // 空コンテンツはスキップ
      if (!html.trim()) return;

      // <br> で分割し各行をラップ
      const lines = html.split(/<br\s*\/?>/i);
      const wrapped = lines.map(function (line) {
        const trimmed = line.trim();
        if (!trimmed) return '';
        return '<span class="line-wrap"><span class="line-inner">' + trimmed + '</span></span>';
      }).filter(Boolean).join('');

      el.innerHTML = wrapped;

      const lineInners = el.querySelectorAll('.line-inner');
      // ラップ後に有効な行がなければスキップ
      if (!lineInners.length) return;

      // 初期状態: 下にずらして非表示
      gsap.set(lineInners, {
        y: CONFIG.splitText.yOffset,
        opacity: 0
      });

      // スクロールトリガーで行ごとに stagger フェードイン
      gsap.to(lineInners, {
        y: 0,
        opacity: 1,
        duration: CONFIG.splitText.duration,
        stagger: CONFIG.splitText.stagger,
        ease: CONFIG.splitText.ease,
        scrollTrigger: {
          trigger: el,
          start: CONFIG.trigger.start,
          once: CONFIG.trigger.once
        }
      });
    });
  }

  /* ------------------------------------------
     5. フェードイン（GSAP版 — ScrollTrigger.batch）
     ------------------------------------------ */

  /**
   * .fade-in 要素を ScrollTrigger.batch() で一括管理
   *
   * メリット:
   *   - 個別に ScrollTrigger を生成するより軽量（DOM 監視が 1 つで済む）
   *   - 同フレームでビューポートに入った複数要素を
   *     stagger 付きでまとめてアニメーションできる
   */
  function initGsapFadeIn() {
    // .split-text と重複する要素はテキスト分割側で制御するため除外
    const targets = gsap.utils.toArray('.fade-in').filter(function (el) {
      return !el.classList.contains('split-text');
    });
    if (!targets.length) return;

    // GSAP で初期状態を統一設定（CSS の translateY(30px) を上書き）
    gsap.set(targets, { opacity: 0, y: CONFIG.fadeIn.y });

    // batch: 同タイミングでビューポートに入った要素群を
    // stagger 付きでまとめてアニメーション
    ScrollTrigger.batch(targets, {
      start: CONFIG.trigger.start,
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: CONFIG.fadeIn.duration,
          stagger: CONFIG.fadeIn.stagger,
          ease: CONFIG.fadeIn.ease,
          overwrite: true
        });
      }
    });
  }

  /* ------------------------------------------
     6. ヒーローテキスト演出（CSS animation の GSAP 版）
     ------------------------------------------ */

  /**
   * TOP ヒーロー (.hero-content) と サブページヒーロー (.page-hero-title) の
   * 登場アニメーションを GSAP で制御（CSS animation: none で無効化済み）
   *
   * ローディングスクリーンが存在する場合、premium-effects.js が発行する
   * 'loadingComplete' カスタムイベントを待ってからアニメーションを開始する。
   * これによりローディングカーテンの背後でヒーロー演出が完了してしまう問題を解消。
   */
  function initHeroAnimation() {
    const heroContent = document.querySelector('.hero-content');
    const pageHeroTitle = document.querySelector('.page-hero-title');
    const heroCm = document.querySelector('.hero-cm');

    // 初期状態を即座に設定（FOUC 防止）
    // CSS の opacity:0 だけでなく GSAP が最終的に制御する全プロパティを明示
    if (heroContent) gsap.set(heroContent, { opacity: 0, yPercent: 10 });
    if (pageHeroTitle) gsap.set(pageHeroTitle, { opacity: 0, y: 20 });
    if (heroCm) gsap.set(heroCm, { opacity: 0 });

    /** ヒーロー要素をアニメーション表示する */
    function playAnimations() {
      // TOP ヒーロー: absolute + translate(-50%, -50%) 中央配置
      if (heroContent) {
        gsap.to(heroContent, {
          opacity: 1, yPercent: 0,
          duration: 1.2, ease: 'power2.out', delay: 0.5
        });
      }
      // サブページヒーロー: flexbox 中央配置
      if (pageHeroTitle) {
        gsap.to(pageHeroTitle, {
          opacity: 1, y: 0,
          duration: 1, ease: 'power2.out', delay: 0.3
        });
      }
      // CM バッジ
      if (heroCm) {
        gsap.to(heroCm, {
          opacity: 1,
          duration: 1, ease: 'power2.out', delay: 1.5
        });
      }
    }

    // ローディングスクリーンがある場合、完了後にアニメーション開始
    // premium-effects.js が 'loadingComplete' カスタムイベントを発行する
    if (document.querySelector('.loading-screen')) {
      let played = false;
      const play = function () {
        if (played) return;
        played = true;
        clearTimeout(safetyId);
        playAnimations();
      };
      // 安全策: premium-effects.js のロード失敗等に備えたタイムアウト
      const safetyId = setTimeout(play, 4000);
      window.addEventListener('loadingComplete', play, { once: true });
    } else {
      playAnimations();
    }
  }

  /* ------------------------------------------
     7. フルスクリーン・カーテンメニュー
     ------------------------------------------ */

  /**
   * ハンバーガーメニューをGSAPタイムラインで
   * フルスクリーン・カーテン演出に変換する
   *
   * 演出フロー（開く）:
   *   1. mobileNav コンテナを autoAlpha:1 で即可視化
   *   2. カーテン背景が scaleY 0→1 で上からスライドダウン
   *   3. メニューリンクが左から stagger でフェードイン（カーテン終盤に重複）
   *   4. 装飾ゴールドラインが scaleY 0→1 で下から伸びる
   *   5. ハンバーガーの3本線が ✕ にモーフ（独立タイムライン・同時進行）
   *
   * 演出フロー（閉じる）:
   *   全タイムラインを closeTimeScale 倍速でリバース再生
   */
  function initCurtainMenu() {
    const mobileNav = document.querySelector('.mobile-nav');
    const hamburger = document.querySelector('.hamburger');
    if (!mobileNav || !hamburger) return;

    const links = mobileNav.querySelectorAll('a');
    const spans = hamburger.querySelectorAll('span');
    // ハンバーガーの 3 本線が揃っていなければ演出を中止
    if (spans.length < 3) return;
    const cfg = CONFIG.curtainMenu;

    // --- ハンバーガー span の移動量を CSS 値から算出 ---
    // 中央 span との中心間距離 = spanH/2 + gap + spanH/2 = spanH + gap
    const spanOffset = cfg.hamburgerSpanGap + cfg.hamburgerSpanH;

    /* --- 装飾 DOM を動的生成（重複ガード付き） --- */
    let curtain = mobileNav.querySelector('.mobile-nav__curtain');
    if (!curtain) {
      curtain = document.createElement('div');
      curtain.className = 'mobile-nav__curtain';
      curtain.setAttribute('aria-hidden', 'true');
      mobileNav.insertBefore(curtain, mobileNav.firstChild);
    }

    let line = mobileNav.querySelector('.mobile-nav__line');
    if (!line) {
      line = document.createElement('div');
      line.className = 'mobile-nav__line';
      line.setAttribute('aria-hidden', 'true');
      mobileNav.appendChild(line);
    }

    /* --- 初期状態を GSAP で設定 --- */
    gsap.set(mobileNav, { autoAlpha: 0, pointerEvents: 'none' });
    gsap.set(curtain, { scaleY: 0 });
    gsap.set(links, { opacity: 0, x: cfg.linkX });
    gsap.set(line, { scaleY: 0, transformOrigin: 'top center' });

    /* ------------------------------------------------
       メニュー開閉タイムライン（paused・play/reverse で制御）
       ------------------------------------------------ */
    const menuTl = gsap.timeline({
      paused: true,
      defaults: { ease: cfg.curtainEase },
      onStart: function () {
        gsap.set(mobileNav, { pointerEvents: 'auto' });
      },
      onReverseComplete: function () {
        gsap.set(mobileNav, { autoAlpha: 0, pointerEvents: 'none' });
      }
    });

    menuTl
      // Step 1: コンテナを即可視化
      .set(mobileNav, { autoAlpha: 1 })
      // Step 2: カーテン背景が上から降りてくる
      .fromTo(curtain,
        { scaleY: 0 },
        { scaleY: 1, duration: cfg.curtainDuration }
      )
      // Step 3: リンクが左からスタガーでスライドイン
      .fromTo(links,
        { opacity: 0, x: cfg.linkX },
        {
          opacity: 1,
          x: 0,
          duration: cfg.linkDuration,
          ease: cfg.linkEase,
          stagger: cfg.linkStagger
        },
        '-=' + cfg.linkOverlap
      )
      // Step 4: 装飾ゴールドラインが下から伸びる
      .fromTo(line,
        { scaleY: 0 },
        {
          scaleY: 1,
          duration: cfg.lineDuration,
          ease: 'power2.out'
        },
        '-=' + cfg.lineOverlap
      );

    /* ------------------------------------------------
       ハンバーガー → ✕ モーフタイムライン（独立制御）
       ------------------------------------------------ */
    const hamburgerTl = gsap.timeline({ paused: true });
    const morphEase = 'power2.inOut';

    hamburgerTl
      .to(spans[0], {
        rotation: 45,
        y: spanOffset,
        duration: cfg.hamburgerDuration,
        ease: morphEase
      }, 0)
      .to(spans[1], {
        opacity: 0,
        duration: cfg.hamburgerDuration * 0.7,
        ease: morphEase
      }, 0)
      .to(spans[2], {
        rotation: -45,
        y: -spanOffset,
        duration: cfg.hamburgerDuration,
        ease: morphEase
      }, 0);

    /* ------------------------------------------------
       外部公開 API（main.js から window._curtainMenu で参照）
       ------------------------------------------------ */
    window._curtainMenu = {
      /** メニューを開く */
      open: function () {
        menuTl.timeScale(1).play();
        hamburgerTl.timeScale(1).play();
      },
      /** メニューを閉じる（closeTimeScale 倍速リバース） */
      close: function () {
        menuTl.timeScale(cfg.closeTimeScale).reverse();
        hamburgerTl.timeScale(cfg.closeTimeScale).reverse();
      },
      /**
       * メニューが開いているか判定
       * 再生中（play途中）も「開いている」と見なす
       * @returns {boolean}
       */
      isOpen: function () {
        return !menuTl.reversed() && menuTl.progress() > 0;
      },
      /**
       * アニメーション再生中か判定
       * @returns {boolean}
       */
      isAnimating: function () {
        return menuTl.isActive() || hamburgerTl.isActive();
      }
    };
  }

  /* ------------------------------------------
     8. スクロール進捗バー (C1)
     ------------------------------------------ */

  /**
   * ヘッダー下部にゴールドの進捗バーを表示
   * ページ全体のスクロール位置に応じて width を 0〜100% に変化
   */
  function initScrollProgress() {
    const bar = document.querySelector('.scroll-progress');
    if (!bar) return;

    gsap.to(bar, {
      width: '100%',
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: CONFIG.scrollProgress.scrub
      }
    });
  }

  /* ------------------------------------------
     9. 固定フローティング CTA (D1)
     ------------------------------------------ */

  /**
   * ヒーローセクションを通過したら右下にCTAを表示
   * フッターに近づいたら非表示にする
   */
  function initFloatingCta() {
    const cta = document.querySelector('.floating-cta');
    if (!cta) return;

    const cfg = CONFIG.floatingCta;

    /** CTA の表示・非表示を統一的に切り替えるヘルパー */
    function showCta() {
      gsap.to(cta, {
        autoAlpha: 1, y: 0,
        duration: cfg.showDuration,
        ease: cfg.showEase,
        overwrite: 'auto'
      });
    }
    function hideCta() {
      gsap.to(cta, {
        autoAlpha: 0, y: cfg.yOffset,
        duration: cfg.hideDuration,
        ease: cfg.hideEase,
        overwrite: 'auto'
      });
    }

    // ヒーロー通過でフェードイン
    const hero = document.querySelector('.hero, .page-hero');
    if (hero) {
      gsap.set(cta, { autoAlpha: 0, y: cfg.yOffset });
      ScrollTrigger.create({
        trigger: hero,
        start: cfg.heroStart,
        onEnter: function () {
          showCta();
          cta.classList.add('is-visible');
        },
        onLeaveBack: function () {
          hideCta();
          cta.classList.remove('is-visible');
        }
      });
    } else {
      // ヒーローが存在しないページではCTAを即表示
      gsap.set(cta, { autoAlpha: 1, y: 0 });
      cta.classList.add('is-visible');
    }

    // フッターに近づいたら非表示
    const footer = document.querySelector('.site-footer');
    if (footer) {
      ScrollTrigger.create({
        trigger: footer,
        start: cfg.footerStart,
        onEnter: hideCta,
        onLeaveBack: function () {
          if (cta.classList.contains('is-visible')) {
            showCta();
          }
        }
      });
    }
  }

  /* ------------------------------------------
     10. 数字カウンターアニメーション (A1)
     ------------------------------------------ */

  /**
   * data-count 属性を持つ .stat-item__value 要素を
   * ScrollTrigger でビューポートに入った時にカウントアップ
   */
  function initCounterAnimation() {
    const counters = document.querySelectorAll('.stat-item__value[data-count]');
    if (!counters.length) return;

    const cfg = CONFIG.counter;

    counters.forEach(function (el) {
      const target = parseFloat(el.getAttribute('data-count'));
      // data-count が不正値の場合はスキップ
      if (isNaN(target) || target <= 0) return;

      const isDecimal = target % 1 !== 0;
      const obj = { value: 0 };

      gsap.to(obj, {
        value: target,
        duration: cfg.duration,
        ease: cfg.ease,
        scrollTrigger: {
          trigger: el,
          start: cfg.start,
          once: true
        },
        onUpdate: function () {
          if (isDecimal) {
            el.textContent = obj.value.toFixed(1);
          } else {
            el.textContent = Math.round(obj.value).toLocaleString();
          }
        }
      });
    });
  }

  /* ------------------------------------------
     11. セクション装飾ラインのフェードイン (B1)
     ------------------------------------------ */

  /**
   * 装飾ラインのオーナメントと左右の線を
   * スクロール時にスケールアニメーションで表示
   */
  function initDividerAnimation() {
    const cfg = CONFIG.divider;

    document.querySelectorAll('.section-divider').forEach(function (divider) {
      const lines = divider.querySelectorAll('.section-divider__line');
      const ornament = divider.querySelector('.section-divider__ornament');

      // 要素が不足している場合はスキップ
      if (!lines.length || !ornament) return;

      gsap.set(lines, { scaleX: 0 });
      gsap.set(ornament, { scale: 0, rotation: 45 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: divider,
          start: cfg.start,
          once: true
        }
      });

      tl.to(ornament, {
        scale: 1, rotation: 45,
        duration: cfg.ornamentDuration,
        ease: cfg.ornamentEase
      })
      .to(lines, {
        scaleX: 1,
        duration: cfg.lineDuration,
        ease: cfg.lineEase,
        stagger: cfg.lineStagger
      }, '-=' + cfg.lineOverlap);
    });
  }

  /* ------------------------------------------
     12. 桜アニメーション (design.html)
     ------------------------------------------ */

  /**
   * 桜の花びらを GSAP タイムラインで落下させる
   * CSS @keyframes sakuraFall の GSAP 版（GSAP 有効時は CSS animation を無効化）
   *
   * 各花びらに独立した timeline(repeat:-1) を設定し、
   * ランダムな duration / delay で自然な動きを表現
   *
   * 演出フロー（1サイクル = 4セグメント）:
   *   0%   → y:-20px, opacity:0
   *   25%  → y:25vh,  横揺れ+回転,  opacity:peak
   *   50%  → y:50vh,  横揺れ+回転,  opacity:85%
   *   75%  → y:75vh,  横揺れ+回転,  opacity:57%
   *   100% → y:100vh, 横揺れ+回転,  opacity:0
   *   → repeat: -1 で初期状態に戻り無限ループ
   */
  function initSakuraAnimation() {
    const container = document.querySelector('.sakura-container');
    if (!container) return;

    const cfg = CONFIG.sakura;
    const random = gsap.utils.random; // ユーティリティのショートハンド
    const fragment = document.createDocumentFragment();

    // --- 花びら DOM 生成 & アニメーション設定 ---
    for (let i = 0; i < cfg.petalCount; i++) {
      const petal = document.createElement('div');
      petal.className = 'sakura-petal';

      const size = random(cfg.size[0], cfg.size[1]);
      const peakOpacity = random(cfg.opacity[0], cfg.opacity[1]);
      const duration = random(cfg.duration[0], cfg.duration[1]);
      const delay = random(cfg.delay[0], cfg.delay[1]);

      // CSS animation を無効化し、サイズ・初期位置を設定
      petal.style.cssText = [
        'left:' + random(0, 100) + '%',
        'width:' + size + 'px',
        'height:' + size + 'px',
        'animation:none'
      ].join(';');

      fragment.appendChild(petal);

      // 初期状態（画面外・透明）
      gsap.set(petal, { y: -20, x: 0, rotation: 0, opacity: 0 });

      // --- タイムライン構築 ---
      const segDur = duration * 0.25; // 4セグメントに均等分割
      const sway = cfg.sway;

      gsap.timeline({ repeat: -1, delay: delay })
        // 25%: フェードインしながら落下開始
        .to(petal, {
          y: '25vh', rotation: 90, x: sway[0],
          opacity: peakOpacity,
          duration: segDur, ease: 'none'
        })
        // 50%: 横揺れしながら落下継続
        .to(petal, {
          y: '50vh', rotation: 180, x: sway[1],
          opacity: peakOpacity * 0.85,
          duration: segDur, ease: 'none'
        })
        // 75%: フェードアウト開始
        .to(petal, {
          y: '75vh', rotation: 270, x: sway[2],
          opacity: peakOpacity * 0.57,
          duration: segDur, ease: 'none'
        })
        // 100%: 画面外へ消失
        .to(petal, {
          y: '100vh', rotation: 360, x: sway[3],
          opacity: 0,
          duration: segDur, ease: 'none'
        });
    }

    container.appendChild(fragment);
  }

  /* ------------------------------------------
     13. 初期化
     ------------------------------------------ */

  function init() {
    initHeroAnimation();
    initParallax();
    initMaskReveal();
    initSplitTextAnimation();
    initGsapFadeIn();
    initCurtainMenu();
    initScrollProgress();
    initFloatingCta();
    initCounterAnimation();
    initDividerAnimation();
    initSakuraAnimation();
  }

  // DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
