# 使い方

## インストール

### ビルド済みバイナリを使う場合

GitHubリリースページから、お使いのOSに対応したインストーラをダウンロードしてください。

- Windows: `.msi` または `.exe`
- macOS: `.dmg`
- Linux: `.AppImage` または `.deb`

### ソースからビルドする場合

以下が必要です。

- Rust（stable）
- OS固有のTauriシステム依存関係（[Tauri公式ドキュメント](https://tauri.app/start/prerequisites/)を参照）

```bash
git clone <リポジトリURL>
cd clip-pop-medroa
npm run tauri:build
```

## 起動と常駐

アプリを起動すると、タスクトレイ（通知領域）には表示されません。
クリップボードの監視はバックグラウンドで常に動作しています。
終了するには、バナーが表示されている間に「︙」メニューから「終了」を選びます。

## 設定の変更

1. クリップボードをコピーして、バナーが表示されるのを待ちます
2. バナーにマウスカーソルを乗せると、自動消去が一時停止します
3. 右端の「︙」ボタンをクリックしてメニューを開きます
4. 「設定」を選ぶと設定パネルが開きます

設定パネルでは、テーマ・表示時間・表示位置・カスタム画像を変更できます。
変更内容はパネル内のプレビューにリアルタイムで反映され、設定ファイルにも自動保存されます。

## 設定ファイルを直接編集する

設定はYAMLファイルで管理されています。テキストエディタで直接編集することもできます。

| OS | パス |
|---|---|
| Windows | `%APPDATA%\ClipPopMedroa\config.yaml` |
| macOS | `~/Library/Application Support/ClipPopMedroa/config.yaml` |
| Linux | `~/.config/ClipPopMedroa/config.yaml` |

```yaml
theme: dark           # dark / light / custom
display_time: 3       # 秒（1〜10を推奨）
corner: bottom_right  # top_left / top_right / bottom_left / bottom_right
custom_images:
  copy: ""            # カスタムテーマ時に表示する画像の絶対パス
  clear: ""
```

設定ファイルを編集した場合は、アプリを再起動して反映させてください。

## カスタム画像の設定

1. 設定パネルでテーマを「カスタム」に切り替えます
2. 「コピー画像」「クリア画像」のボタンをそれぞれクリックして、画像ファイルを選択します
3. 対応形式はPNG、WebP、GIFです。アニメーション透過WebPも使用できます

## 独自ロケールの追加

設定ディレクトリの `locales/` フォルダに `<言語コード>.yaml` を置くと、アプリが自動的に読み込みます。

```yaml
# 例: ~/.config/ClipPopMedroa/locales/fr.yaml
copied: Copié dans le presse-papier !
cleared: Presse-papier vidé.
settings: Paramètres
quit: Quitter
```
