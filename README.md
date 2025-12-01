# Clip Pop Medroa

Clip Pop Medroaは[Tauri](https://tauri.app/)で構築された軽量な常時最前面クリップボードオーバーレイです。クリップボードの更新を監視し、コピー/クリアのバナーを表示します。YAMLファイルによる設定が可能です。

## 機能

- **Tauriオーバーレイウィンドウ** - フレームレス、透明、常に最前面でトーストが他のアプリの後ろに隠れません
- **コピー/クリアバナー** - ローカライズされた「コピーしました」/「クリアしました」の文字列とフォントアイコン付きのダーク/ライトの半透明バー
- **カスタムPNG/WebPサポート** - テーマを`custom`に切り替えてイベントごとのアートワーク（アニメーション透過WebPを含む）を指定可能
- **ホバー対応フェードアウト** - 設定した秒数後にポップアップがフェードアウトし、ホバー中は一時停止してインラインメニューが使用可能
- **︙メニュー** - ライブプレビュー付きの設定画面を開くか、常駐プロセスを終了
- **OSネイティブ設定ファイル** - 起動時にプラットフォーム推奨のパスから`config.yaml`を読み込み:
  - Linux/BSD: `$XDG_CONFIG_HOME/ClipPopMedroa/config.yaml`（`~/.config/...`にフォールバック）
  - macOS: `~/Library/Application Support/ClipPopMedroa/config.yaml`
  - Windows: `%APPDATA%\ClipPopMedroa\config.yaml`
- **YAML設定** - テーマ（`dark`、`light`、`custom`）、ポップアップ表示時間、表示位置、カスタム画像パスを設定可能
- **ロケール辞書** - YAML辞書は`config/locales`（ユーザー提供）または同梱の`locales`フォルダに配置。不足キーは英語にフォールバック

## リポジトリ構成

```
config.example.yaml    # 設定値のサンプル
src/                   # オーバーレイ+設定用のフロントエンドHTML/CSS/JS
src-tauri/
  ├─ src/main.rs       # Tauriブートストラップ+コマンド（設定、ロケール、クリップボードポーリング）
  ├─ resources/locales # バイナリに同梱されるen/ja辞書
  └─ tauri.conf.json   # ウィンドウ+バンドラー設定
```

## アプリの実行

1. Rust（stable）とプラットフォーム用のTauriシステム依存関係をインストール
2. Tauriシェルをビルド:
   ```bash
   cd src-tauri
   cargo tauri dev
   ```
   フロントエンドはプレーンHTML/CSS/JS（バンドラーなし）のため、devサーバーは単に`../src`を読み込みます
3. デフォルトを上書きしたい場合は、OS固有のディレクトリに`config.yaml`を配置。同梱の`config.example.yaml`が参考になります

## 開発の自動化

- **Rust専用Gitフック** - `./scripts/install-hooks.sh`を一度実行して`core.hooksPath`を`.githooks`に向けます。pre-commitフックは`cargo fmt -- --check`と`cargo clippy --all-targets --all-features -- -D warnings`を実行し、Node.jsベースのHuskyなしでコミットをクリーンに保ちます
- **CIリント** - `.github/workflows/ci.yml`は`main`/`master`へのプッシュとプルリクエストで同じ`cargo fmt` + `cargo clippy`チェックを実行
- **タグ付きリリース** - `v*`にマッチするタグをプッシュ（または`workflow_dispatch`を使用）すると`.github/workflows/release.yml`がトリガーされ、TauriバンドルをGitHubリリースページに添付

## 設定リファレンス

```yaml
theme: dark           # dark / light / custom
display_time: 3       # 秒（1-10推奨）
corner: bottom_right  # top_left / top_right / bottom_left / bottom_right
custom_images:
  copy: ""            # 絶対ファイルパス（PNG/WebP）。空 -> 何も表示されない
  clear: ""
```

## ロケール辞書

ロケールYAMLファイルはフラットなキー/値ペアを含みます:

```yaml
copied: クリップボードにコピーしました！
cleared: クリップボードをクリアしました。
settings: 設定
...
```

ユーザー辞書は設定ディレクトリの`locales/<lang>.yaml`に配置できます。アプリは`navigator.language`を試し、英語にフォールバックし、UIにメッセージを表示します。

## スクリーンショット / プレビュー

設定パネルには、現在選択されているコーナー、テーマ、タイミングを表示するライブプレビューが含まれており、実際のクリップボードイベントを待たずに見た目を微調整できます。
