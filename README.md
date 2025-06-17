# 🎮 テトリスゲーム (Tetris Game)

モダンでシンプルなテトリスゲームのウェブ実装です。レスポンシブデザインで、PCとスマートフォンの両方で快適にプレイできます。

## 🎯 特徴

- シンプルで直感的な操作感
- レスポンシブデザイン（PC/スマホ対応）
- スコアシステムとレベル進行
- ゴーストピース表示
- モバイルフレンドリーなタッチコントロール
- 軽量で高速な動作

## 🎮 遊び方

### PCでの操作方法
- **←→↓**: テトリミノを移動
- **↑**: テトリミノを回転
- **スペースキー**: ハードドロップ（一気に下まで落下）
- **Pキー**: 一時停止/再開

### スマホでの操作方法
- 画面下のボタンで操作
  - 左/右/下ボタン: 移動
  - 回転ボタン: テトリミノを回転
  - ドロップボタン: ハードドロップ

## 📊 スコアシステム

- 1ライン消去: 100点 × レベル
- 2ライン消去: 300点 × レベル
- 3ライン消去: 500点 × レベル
- 4ライン同時消去（テトリス）: 800点 × レベル
- 10ライン消すごとにレベルアップ
- レベルが上がるごとに落下速度が上昇

## 🛠️ インストール方法

1. リポジトリをクローン:
   ```bash
   git clone https://github.com/your-username/tetris-game.git
   cd tetris-game
   ```

2. ローカルサーバーを起動:
   ```bash
   # Pythonの場合
   python -m http.server 8000
   ```
   
   ```bash
   # Node.jsの場合
   npx http-server -p 8000
   ```

3. ブラウザで以下のURLを開く:
   ```
   http://localhost:8000
   ```

## 📱 対応ブラウザ

- Google Chrome（最新版）
- Mozilla Firefox（最新版）
- Safari（最新版）
- Microsoft Edge（最新版）
- iOS Safari（最新版）
- Android Chrome（最新版）

## 🛠️ 技術スタック

- HTML5
- CSS3 (Flexbox, CSS Variables)
- JavaScript (ES6+)
- Canvas API

## 📂 プロジェクト構成

```
tetris-game/
├── index.html       # ゲームのメインHTML
├── css/
│   └── style.css   # スタイルシート
├── js/
│   └── tetris.js   # ゲームロジック
└── README.md        # このファイル
```

## 🎨 カスタマイズ

### 難易度の調整
`js/tetris.js` の以下の定数を変更してゲームバランスを調整できます：

```javascript
const GAME = {
    INITIAL_LEVEL: 1,              // 開始時のレベル
    LINES_PER_LEVEL: 10,           // レベルアップに必要なライン数
    INITIAL_SPEED: 1000,           // 初期落下速度（ミリ秒）
    SPEED_DECREMENT: 100,          // レベルアップごとの速度増加量
    MIN_SPEED: 100,                // 最小落下速度
    // ...
};
```

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 🙏 クレジット

- 開発者: [あなたの名前]
- 作成日: 2025年6月

## 🤝 コントリビューション

バグレポートや機能要望は、IssueまたはPull Requestでお気軽にどうぞ。

---

🎮 楽しいテトリスライフを！
