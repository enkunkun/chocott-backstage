# Spec: AIContext カスタム kind の導入

Upstream RFC: https://github.com/backstage/backstage/issues/33575

## 背景 / 目的

AI コーディングエージェント（Claude Code, Copilot, Cursor 等）の rules / skills が
リポジトリに散在し、発見性・ガバナンス・重複・ツール間一貫性の問題がある。
Software Catalog に新 kind `AIContext` を追加し、rules / skills を
所有者・ライフサイクル付きでカタログ管理できるようにする。

upstream 本体への変更ではなく、Backstage の公式拡張機構
（カスタム kind + `validateEntityKind` processor）を使って
このインスタンス内で完結する実装とする。

## スコープ

### やること

1. **kind 定義**: `kind: AIContext` / `apiVersion: backstage.io/v1alpha1`
   - `spec.type` による discriminated union: `skill` と `rule`（RFC の初期スコープ通り）
2. **バリデーション**: JSON Schema（draft-07, upstream の kind schema と同形式）
   + `entityKindSchemaValidator` を使う `CatalogProcessor`
3. **relations 生成**: processor の `postProcessEntity` で
   - `spec.owner` → `ownedBy` / `ownerOf`
   - `spec.dependsOn`（skill のみ）→ `dependsOn` / `dependencyOf`
4. **backend 登録**: 新パッケージ
   `@internal/backstage-plugin-catalog-backend-module-aicontext`
   （`plugins/catalog-backend-module-aicontext/`）を `packages/backend` に add
5. **catalog rules**: `app-config.yaml` の `catalog.rules.allow` に `AIContext` を追加
6. **サンプル**: `examples/aicontext.yaml` に skill / rule 各 1 エンティティ
7. **フロントエンド**: `EntityPage.tsx` に AIContext 用ページ
   （About カード + spec フィールドの表示）

### やらないこと

- skills / rules の**本文**の格納（RFC 通り `backstage.io/source-location`
  annotation で参照するのみ）
- `prompt` 等の追加 type（RFC でも将来拡張扱い）
- 専用の検索・発見 UI（catalog の kind フィルタで足りる）
- upstream `packages/catalog-model` への変更

## エンティティ形状（RFC より）

共通 spec（必須: `type`, `lifecycle`, `owner`）:

| フィールド | 型 | 備考 |
| --- | --- | --- |
| `type` | `'skill' \| 'rule'` | discriminator |
| `lifecycle` | string | `experimental` / `production` / `deprecated` |
| `owner` | string (entity ref) | ownedBy relation を生成 |
| `visibility` | `'public' \| 'private' \| 'restricted'`? | 省略時 public 扱い |

skill 固有（すべて任意）: `disciplines[]`, `categories[]`, `agents[]`,
`usecases[]`, `allowedTools[]`, `dependsOn[]`(entity refs), `license`,
`compatibility`(max 500 chars)

rule 固有: `category`(必須), `ruleType`(必須), `rationale`(必須),
`disciplines[]?`, `activation?{strategy(必須), languages[]?, fileGlobs[]?}`,
`sources[]?{type: docs|example|link, url}`

## 受け入れ条件

- [ ] 有効な skill / rule エンティティが catalog に取り込まれる
- [ ] 必須フィールド欠落（rule の `rationale` 等）や不正な `visibility` は
      processing error になる（黙って通らない）
- [ ] `spec.owner` / `spec.dependsOn` から relations が張られ、
      Group ページの Ownership に AIContext が現れる
- [ ] `AIContext` kind が catalog rules で許可されている
- [ ] examples の 2 エンティティがローカル起動で表示できる
- [ ] `yarn tsc` / 対象パッケージの `yarn test` がゼロエラー

## 本番反映時の注意（このブランチの外）

compose リポジトリ側 `backstage/app-config.yaml` の `catalog.rules.allow` にも
`AIContext` を追加しないと本番では取り込まれない（bind-mount 設定が優先されるため）。
