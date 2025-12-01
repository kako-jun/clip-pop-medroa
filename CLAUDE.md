# CLAUDE.md

このファイルはClaude Codeがこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

Clip Pop MedroaはTauri v2で構築された軽量なクリップボード通知オーバーレイです。クリップボードイベントを監視し、コピー/クリアアクションに対してトースト通知を表示します。

## アーキテクチャ

- **バックエンド**: Rust + Tauri v2 (`src-tauri/`)
  - `src/main.rs` - コアロジック: クリップボードポーリング、設定管理、ロケール読み込み
  - `arboard`でクロスプラットフォームのクリップボードアクセス
  - `serde_yaml`によるYAMLベースの設定
- **フロントエンド**: プレーンHTML/CSS/JS (`src/`) - バンドラー不要
  - `index.html` - オーバーレイUIの構造
  - `styles.css` - テーマ用スタイル (dark/light/custom)
  - `main.js` - Tauri IPC、クリップボードポーリング、UIロジック

## よく使うコマンド

```bash
# 開発
npm run tauri:dev          # ホットリロード付き開発モードで実行
npm run tauri:build        # 本番用バイナリをビルド

# コード品質
npm run fmt                # Rustコードをフォーマット
npm run lint               # Rustフォーマットをチェック
cargo test                 # Rustテストを実行 (src-tauri/から)
cargo clippy               # Rustコードをリント (src-tauri/から)
```

## 設定

設定ファイルの場所はOSによって異なる:
- Linux: `~/.config/ClipPopMedroa/config.yaml`
- macOS: `~/Library/Application Support/ClipPopMedroa/config.yaml`
- Windows: `%APPDATA%\ClipPopMedroa\config.yaml`

テスト時は`CLIP_POP_MEDROA_CONFIG_DIR`環境変数で上書き可能。

## 設計上の決定事項

- **JSビルドツールチェーンなし** - シンプルさのためバニラJSを使用
- **Tauri v2** - v1から最近移行; `tauri::Manager`と更新されたAPIを使用
- **ポーリングベースのクリップボード** - クロスプラットフォーム互換性のためネイティブフックではなくインターバルポーリングを使用
- **常に最前面の透明ウィンドウ** - 常に表示されるフレームレスオーバーレイ

## テストに関する注意

- Rustユニットテストは`tempfile`を使用して設定テストを分離
- テストは環境変数で設定ディレクトリを上書き
- GUIテストにはディスプレイ環境（X11/Wayland）が必要
