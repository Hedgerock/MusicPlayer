# Contributing

## Language conventions

- Public documentation, including README and CHANGELOG, is written in English.
- Architecture decisions and internal feature specifications are written in Russian.
- Architecture decisions use explicit, declarative statements.
- Code identifiers, test names, and commit messages are written in English.

## Architecture

Follow the architecture defined in ADR-0001.

Business rules remain independent of React Native, Android APIs, storage libraries, and the playback engine.

Screens invoke application use cases. Infrastructure implementations are provided through explicit contracts.

The application composition layer connects use cases to their implementations.

Changes to architectural boundaries require an ADR.

## Development workflow

For each feature:

1. Document the expected behavior and acceptance criteria.
2. Identify business rules, dependencies, and failure cases.
3. Define unit and integration test scenarios.
4. Implement the behavior and its tests.
5. Run the required development checks.
6. Verify relevant behavior on Android.
7. Update the affected documentation and CHANGELOG.
8. Create a commit with one coherent purpose.

Use npm consistently and commit `package-lock.json` when dependencies change.

## Testing conventions

Use Given / When / Then to describe test scenarios.

- Given: the initial state and relevant conditions.
- When: the action or event.
- Then: the observable result.

Example:

```text
Given an empty playlist
When the user adds a track
Then the playlist contains that track at position zero
```

Use explicit behavior-oriented test names:

```text
given an empty playlist, when a track is added, then it becomes the first item
```

Tests must be independent and contain explicit assertions.

### Unit tests

Each behavior-changing feature includes unit tests for its business rules and application logic.

Cover normal behavior, boundary conditions, and relevant errors.

Use deterministic clocks and identifiers when the scenario depends on time or generated values.

### Integration tests

Each behavior-changing feature includes integration tests for cooperation between its components.

Prefer real application modules. Replace dependencies at external boundaries when necessary.

Document which boundaries are replaced. A test using an in-memory repository verifies application cooperation; persistence
requires a separate test against the real storage implementation.

### Android verification

Verify native behavior on a device or emulator.

Relevant scenarios include:

- Audio file permissions and discovery.
- Persistence across application restarts.
- Background playback and screen locking.
- Headphone and system playback commands.
- TalkBack interaction and system text scaling.

Add automated native or end-to-end tests for critical scenarios as their implementation becomes available.

### Bug fixes

Add a regression test that reproduces the reported failure before applying the fix.

### Accessibility

Accessibility is part of feature acceptance.

- Interactive elements expose meaningful roles, labels, and states.
- Text respects system font scaling.
- Content remains readable when text is enlarged.
- Touch targets are at least 48 x 48 dp.
- Primary actions use clear, visible labels.
- Essential actions are available through explicit controls.
- Focus order follows the visible interface.
- Errors explain the problem and the available next action.
- Relevant screens are checked with TalkBack.

## Documentation

Feature specifications belong in `docs/features/` and are written in Russian.

A specification records:

- Purpose and user scenario.
- Acceptance criteria.
- Business rules.
- Failure and recovery behavior.
- Required test scenarios.
- Accessibility requirements.

Architecture decisions belong in `docs/adr/`.

New ADRs follow the [ADR writing guidelines](docs/rules/adr-guidelines.md).

Each ADR records its status, context, decision, consequences, scope exclusions, and related decisions. Considered alternatives
and sources are included when relevant.

Accepted ADRs preserve their historical context and reasoning. Changes to an architectural decision require a new ADR.
Superseded decisions and their replacements link to each other.

Diagrams follow the [diagram guidelines](docs/rules/diagram-guidelines.md).

Database diagrams describe a specific schema version and are maintained alongside the corresponding migrations.

Source imports follow the [import guidelines](docs/rules/import-guidelines.md).

Run `npm run format` to apply formatting and `npm run format:check` to verify it.

Prettier sorts imports using the configured import sorting plugin. ESLint checks paths and type-import conventions.
Run `npm run lint:fix` to apply available automatic fixes.

CHANGELOG entries describe completed changes in behavior or project capabilities. Planned work belongs in feature
specifications.

## Commit messages

Use Conventional Commits:

```text
type(scope): description
```

The scope is optional. Use lowercase types and scopes, with a concise English description.

Types:

- `feat`: new application behavior
- `fix`: correction of existing behavior
- `refactor`: implementation changes preserving behavior
- `test`: changes focused on tests
- `docs`: documentation changes
- `build`: dependency or build configuration changes
- `ci`: continuous integration changes
- `chore`: repository maintenance

Examples:

```text
feat(playlists): add playlist creation
fix(history): preserve repeated track entries
refactor(playback): extract event handling
test(playlists): cover track ordering
docs(adr): document architecture boundaries
build(project): initialize React Native scaffold
```

Choose the type according to the primary purpose of the commit. A feature commit may include implementation, tests, and
related documentation.

## Required checks

Run from the project root:

```powershell
npm run format:check
npm test -- --runInBand
npm run lint
npx tsc --noEmit
```

The same checks run in GitHub Actions on pushes to `main` and pull requests targeting `main`. Review the `Quality checks`
job before merging a pull request.

Run the relevant Android build and device checks when native configuration or platform behavior changes.

## Definition of done

A feature is complete when:

- Its acceptance criteria are met.
- Required unit and integration tests pass.
- Relevant regression scenarios are covered.
- Lint and TypeScript checks pass.
- Relevant Android behavior is verified.
- Accessibility requirements are checked.
- Documentation reflects the implemented behavior.
- User-visible changes are recorded in CHANGELOG.
