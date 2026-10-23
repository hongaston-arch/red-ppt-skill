# Red PPT Skill

A multi-style HTML presentation skill forked from [Guizang PPT Skill](https://github.com/op7418/guizang-ppt-skill).

[中文](README.md) · [Style package contract](docs/style-packs.md) · [Maintenance](docs/maintenance.md)

For a new chat, start with [CONTEXT.md](CONTEXT.md). The [confirmation workflow](docs/style-confirmation.md) and [Swiss draft specification](styles/swiss/spec.md) distinguish inherited rules, proposals, user decisions, and verification. Direction decisions Q01–Q03 are confirmed, including a four-column, three-row S15 matrix; sample approval remains pending. Styles with a registered specification preserve a checksummed snapshot in each new deck.

## Current scope

This foundation registers the inherited `magazine` and `swiss` styles and adds scaffolding and validation commands. The templates and presenter runtime are inherited; this branch adds scoped Swiss S15 matrix components and a four-column animation. The presenter runtime remains unchanged. Shared runtime source extraction and a third style are future work, not completed features.

After this branch is reviewed and merged, install the stable main branch:

```bash
npx skills add https://github.com/hongaston-arch/red-ppt-skill --skill red-ppt-skill
```

The third-party installer still needs verification in the target agent environment. Scripts require Node.js 20 or later. From the repository root:

```bash
node scripts/styles.mjs
node scripts/new-deck.mjs --style magazine --title "My talk" ./work/my-talk
```

The output is an authoring scaffold, not a finished presentation. Follow the selected style guide, replace sample content, add slides and matching notes, then run:

```bash
node scripts/validate-deck.mjs --style magazine ./work/my-talk/index.html
```

Deliver the generated folder including images and local assets. Fonts, icons, and some effects may still use CDNs. Static checks do not prove offline operation, visual quality, or presenter interaction correctness; browser review remains necessary.

## Development

Keep `main` stable. Use focused feature/fix branches and draft PRs, then merge after validation and review. New styles begin as experimental packages with their own visual rules and the shared presentation contract. These conventions do not mean GitHub branch protection has been configured.

## Attribution

Original framework by Guizang; this is an independent fork maintained under hongaston-arch. See [LICENSE](LICENSE) (AGPL-3.0), [upstream baseline](docs/upstream-baseline.json), and [upstream sponsorship information](SPONSORS.md). Upstream sponsorship does not imply support for this fork. No html-ppt code has been imported in this foundation.
