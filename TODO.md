# TODO: 検証した ZIP をそのまま配布用成果物にする

## 目的と現在の問題

`npm run build` が成功したとき、`bundle/` に残る配布用 ZIP が、展開・実行テストを通過した ZIP そのものになるようにする。

現在の流れは次のとおり。

1. `package.json` の `build` が `npm test` を実行する。
2. `tests/release-bundle.test.mjs` の最初のテストが ZIP を生成する。
3. 同ファイルの後続テストが ZIP を展開して CLI を検証する。
4. `build` の末尾の `npm run build:bundle:zip` が検証済み ZIP を削除・再生成する。

最後に生成した ZIP 自体は検証されていない。破損が確認されたという指摘ではなく、配布物と検証対象の同一性を保証する工程が欠けているという指摘である。

## 作業範囲と前提

- 対象は `package.json`、`tests/release-bundle.test.mjs`、`README.md`。関連する CI 設定が古い手順を直接呼んでいる場合だけ、その呼び出しも合わせる。
- 作業開始時に `git status --short` と差分を確認する。0.6.0 への更新を含む既存の未コミット変更を保持する。
- ランタイム、スキルの指示本文、バージョン、生成済み `index.json` は今回の修正対象にしない。
- Node.js 22 以上、`zip`、`unzip` を使用する。追加の依存パッケージは不要。
- GitHub への push、タグ作成、Release 公開はこの TODO の対象外。

## 実装手順

- [x] **1. ZIP 生成をテスト本体から npm コマンドの前処理へ移す。**

  `package.json` の scripts を以下の構成にする。既存の説明やバージョンなど、他のフィールドは保持する。

  ```json
  {
    "test": "npm run build:bundle:zip && npm run test:verify",
    "test:verify": "node --test --test-concurrency=1 tests/*.test.mjs",
    "build": "npm test",
    "build:bundle": "node scripts/build-skill-bundle.mjs",
    "build:bundle:zip": "node scripts/build-skill-bundle-zip.mjs"
  }
  ```

  これにより、`npm test` と `npm run build` はどちらも「ZIP を1回生成 → 全テストで検証 → 終了」となる。`test:verify` は既存 ZIP の検証専用とし、ZIP を生成しない。npm の `pretest` などに重複する生成処理を追加しない。

- [x] **2. 配布テストを既存 ZIP の読み取り・展開だけにする。**

  `tests/release-bundle.test.mjs` の最初のテストから、`scripts/build-skill-bundle-zip.mjs` を呼ぶ `execFileSync` を削除する。`execFileSync` 自体は `unzip` や CLI の起動にも使うため、import は残す。

  `node:test` の `before` フックで ZIP の存在を確認する。存在しない場合は、対象パスと「先に `npm run build:bundle:zip` を実行するか、`npm test` を使用する」という案内を含むエラーで失敗させる。検証中に ZIP を自動生成するフォールバックは設けない。

  既存の ZIP 内容確認、隔離ディレクトリへの展開、メタデータ、UTF-8 stdin、Windows-31J の更新・競合・削除などの検証は保持する。展開先と試験用ファイルの一時ディレクトリ作成・削除は引き続き許可する。

- [x] **3. 配布テストの前後で ZIP の同一性を検証する。**

  同じテストファイルで `node:crypto` の `createHash` を使用し、`before` フックで配布 ZIP の SHA-256 を記録する。`after` フックで同じパスの SHA-256 を計算し、一致することを assert する。初期ハッシュを取得できなかった場合は、後処理で別のエラーを重ねない。

  ハッシュ値を固定文字列としてソースに保存しない。この検証は、その実行中に ZIP の内容が変わっていないことを確認するもの。異なるビルド間で ZIP のバイト列が一致する再現可能ビルドは今回の要件ではない。

  このハッシュ検証だけではテスト終了後の再生成を検出できないため、手順1のコマンド順序の変更も必ず実施する。

- [x] **4. 利用者向けのコマンド説明を更新する。**

  `README.md` の Commands に、次の意味を短く追記する。

  - `npm test` / `npm run build`: ZIP を生成し、その ZIP を全テストで検証する。成功後の ZIP が配布候補となる。
  - `npm run test:verify`: 既存 ZIP を再生成せずに検証する。ZIP が必要。
  - `npm run build:bundle:zip`: ZIP の生成のみ。検証済みであることを意味しない。

  `.github/` も検索し、テスト成功後に配布 ZIP を再生成する呼び出しがあれば同じ順序に揃える。該当がなければ CI は変更しない。

## 検証と完了条件

- [x] `npm test` が成功する。生成スクリプトのログから、ZIP の生成が1回だけで、その後にテストが走ることを確認する。
- [x] `npm run build` が成功する。テスト完了後に ZIP の生成ログが出ないことを確認する。
- [x] 生成済み ZIP の SHA-256 を記録し、`npm run test:verify` を実行してから再計算する。同じハッシュで、検証中に生成ログが出ないことを確認する。ZIP 名は現在の `package.json` の version から求め、`0.6.0` を新しいコードへ固定しない。
- [x] ZIP がない状態の `npm run test:verify` が非ゼロ終了し、生成手順を案内することを確認する。既存 ZIP は一時退避して `finally` 等で確実に戻すか、隔離した作業コピーで試験する。検証コマンドが ZIP を再生成しないことも確認する。
- [x] 既存の機能テストを削除・弱体化していないことを差分で確認する。直前のレビュー時は35件中34件成功、Windows専用1件スキップ。件数を固定した assert は追加せず、失敗0件とスキップ理由を確認する。
- [x] `git diff --check` と最終差分を確認し、この TODO の完了項目にチェックを入れる。最終報告に変更内容、実行した検証、Windows専用テストの実施有無を書く。
