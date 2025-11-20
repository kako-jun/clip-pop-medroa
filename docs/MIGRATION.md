# Python プロトタイプから Tauri 実装への移行

## 現状確認
- `git ls-files '*.py'` を実行すると 0 件が返り、このリポジトリに Python ソースは残っていません。
- `README.md` で説明している通り、現行アプリは Tauri + WebView で構成されており、バックエンドは Rust、フロントエンドは Web 技術のみです。

## 取り除いた方法
1. 旧 Tkinter プロトタイプ一式を Git から削除 (`git rm src/*.py` など) し、履歴上も不要な Python 依存を排除しました。
2. `npm create tauri-app@latest` 相当の初期化を行い、`src` を Web UI、`src-tauri` を Rust バックエンドとして再構成しました。
3. 新しい構成に合わせて `package.json`、`Cargo.toml`、`tauri.conf.json` を追加し、Python 関連の依存を持たない形にしました。
4. クリップボード監視や設定読み込みは Rust 側 (`src-tauri/src/main.rs`) に実装し、UI 表示は `src/index.html` + `src/main.js` + `src/styles.css` で再実装しました。

## これから Python が混入しないようにするには
- 新機能は Rust (Tauri コマンド) と Web フロントで実装し、`*.py` を追加しない。
- CI やローカルで `git ls-files '*.py'` をチェックする簡単なスクリプトを用意すると、誤って Python ファイルを追加したときに気づけます。

## JS 依存を増やさないための運用
- Node 版 Husky は削除し、`./scripts/install-hooks.sh` で `.githooks` を hooksPath に指定して、Rust ツールチェーンのみで pre-commit を実行します。
- CI も `cargo fmt` と `cargo clippy` のみを呼ぶ構成にしており、JS パッケージを追加しなくても自動化が回るようにしています。
