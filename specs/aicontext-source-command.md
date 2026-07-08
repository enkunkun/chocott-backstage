# Spec: AIContext kind に `source` 属性と `command` タイプを追加

## 背景

AIContext kind は当初 `skill` / `rule` の 2 タイプで実装した。しかし実際の AI context 資産を棚卸しすると、カタログ化すべき対象が当初想定より広い:

1. **外部 plugin からインポートした skill**（anthropic-agent-skills の example-skills 17 個、cosense 等）が、どのリポジトリにも属さず GitHub provider の視界に入らないため未登録。これらは自作 skill と**出所で区別**する必要がある。
2. **slash command**（`~/.claude/commands/` の 10 個。`/dig` `/grafana` 等）は skill でも rule でもない第 3 のカテゴリで、現行スキーマで表現できない。

## 目的

AIContext kind を後方互換を保ったまま拡張し、上記 2 種を正確に表現できるようにする。

## 要件

### R1: `source` 属性（出所）

- base spec に **任意** の `source` オブジェクトを追加する。
- `source` **不在 = first-party（自作）**。存在すれば外部インポート資産。
- フィールド:
  - `registry`（必須, string）: marketplace / registry 名。例 `anthropic-agent-skills`, `kuu-marketplace`。
  - `plugin`（任意, string）: 束ねる plugin 名。例 `example-skills`。
  - `version`（任意, string）: 固定バージョンや git sha。
  - `url`（任意, string）: upstream URL。
  - `installed`（任意, boolean）: 現在インストール済み（発火する）か、marketplace にあるだけ（非アクティブ）か。
- 既存の `skill` / `rule` エンティティは `source` 無しのまま有効（後方互換）。

### R2: `command` タイプ

- `spec.type` の enum に `command` を追加する。
- `command` 固有 spec:
  - `invocation`（必須, string, minLength 1）: slash 呼び出し。例 `/dig`。
  - `disciplines` / `categories` / `agents` / `usecases`（任意, string[]）。
  - `dependsOn`（任意, string[]）: 依存する他の AIContext（skill 等）への entity ref。
- `command` の `dependsOn` は `skill` と同様に `dependsOn` / `dependencyOf` relation を生成する。

### R3: 表示

- `AIContextSpecCard` の title に `command` → `Command details` を追加する。
- `source` は既存の generic な `...details` 表示にそのまま乗る（追加実装不要）。

## 非目標

- 既存 8 エンティティのスキーマ移行（`source` 追加は任意なので不要）。
- LSP plugin（swift-lsp / clangd-lsp）の登録（skill ではなく tool 統合のため別途判断）。

## 受け入れ条件

- `source` 付き skill / command エンティティが validator を通過する。
- `source.registry` 欠落時は validation エラー（source を書くなら registry 必須）。
- `command` で `invocation` 欠落時は validation エラー。
- 既存の source 無し skill / rule が引き続き通過する（後方互換テスト）。
- `command.dependsOn` から dependsOn/dependencyOf relation が emit される。
