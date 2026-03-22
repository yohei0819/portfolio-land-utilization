# GRAND Suite Modern — ポートフォリオサイト

高級賃貸マンションブランド **GRAND Suite Modern** のコンセプトサイトです。  
ダーク背景 × ゴールドアクセントの配色に、GSAP アニメーションを組み合わせた、上質感のある Web 体験を実現しています。

## デモ

🔗 **<https://yohei0819.github.io/portfolio-land-utilization/>**

## ページ構成

| ページ | ファイル | 概要 |
|--------|----------|------|
| トップ | `index.html` | ローディング演出 → ヒーローパララックス → ブランドステートメント → 統計カウンター |
| デザイン | `design.html` | 外観・共用部のデザインコンセプト、桜アニメーション |
| 設備・構造 | `feature.html` | 構造性能・設備仕様の比較表、マスクリビール演出 |
| 内装 | `interior.html` | 内装グレード紹介、俯瞰図ラベル |

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| マークアップ | HTML5 / CSS3（カスタムプロパティ） |
| スクリプト | Vanilla JS + jQuery 3.7.1 |
| アニメーション | GSAP 3.12.5 + ScrollTrigger |
| スムーススクロール | Lenis 1.1.18 |
| フォント | Noto Serif JP（Google Fonts） |
| ホスティング | GitHub Pages |

## ディレクトリ構成

```
├── index.html            # トップページ
├── design.html           # デザインページ
├── feature.html          # 設備・構造ページ
├── interior.html         # 内装ページ
├── favicon.svg
├── css/
│   └── style.css         # 全ページ共通スタイル
└── js/
    ├── utils.js           # 共通ユーティリティ（各スクリプトが参照）
    ├── main.js            # ナビゲーション / ハンバーガーメニュー / スクロール制御
    ├── gsap-animations.js # GSAP ScrollTrigger アニメーション群
    └── premium-effects.js # Lenis / ローディング / マグネティックボタン
```

## 主な演出・機能

- **ローディングスクリーン** — ゴールドライン描画 → ロゴフェードイン → カーテンオープン
- **パララックス背景** — ヒーロー・セクション背景のスクロール速度差
- **マスクリビール** — ゴールドオーバーレイがスライドし画像が現れる
- **テキスト行分割フェードイン** — `<br>` 区切りの行を下→上に stagger 表示
- **カーテンメニュー** — GSAP タイムラインによるフルスクリーンメニュー開閉
- **数字カウンター** — ScrollTrigger 連動のカウントアップ
- **マグネティックボタン** — マウス追従の吸い寄せ効果
- **テキストグラデーション** — スクロールに連動した文字色変化
- **桜アニメーション** — GSAP タイムラインによる花びら落下（design.html）
- **アクセシビリティ** — `prefers-reduced-motion` 対応、スキップリンク、ARIA 属性
- **レスポンシブ対応** — 768px 以下でアニメーション無効化、モバイルメニュー

## スクリプト読み込み順

```
jQuery → GSAP → ScrollTrigger → Lenis → utils.js → main.js → gsap-animations.js → premium-effects.js
```

`utils.js` が共有ユーティリティ（`prefersReducedMotion`, `isMobile`, `throttle` 等）を `window.AppUtils` として公開し、後続スクリプトが参照します。

## ローカルで確認する

```bash
# 任意のローカルサーバーで起動（例: VS Code Live Server、http-server 等）
npx http-server . -o
```

> `file://` プロトコルではフォント読み込みや一部演出が正常に動作しません。

## ライセンス

ポートフォリオ作品のため、コードの参考利用は自由です。  
画像・ブランド名はデモ用であり、実在の物件とは関係ありません。
