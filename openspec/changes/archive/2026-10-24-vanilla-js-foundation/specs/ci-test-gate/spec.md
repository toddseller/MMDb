# Spec Delta

## ADDED Requirements

### Requirement: Front-end unit tests gate merges
The test run SHALL include unit tests for the app's script modules, run without a browser and without network access, in the same required check as the RSpec suite and the browser tests. A failing unit test SHALL fail that check, and the browser tests SHALL NOT run after a unit test fails.

#### Scenario: Unit test fails on a pull request
- **WHEN** a pull request's latest commit makes a script module's unit test fail
- **THEN** the required `test` check fails, without running the browser tests

### Requirement: Script modules are type-checked in the gate
The app's script modules and their unit tests SHALL be type-checked from their JSDoc types, without being compiled, in the same required check. A type error SHALL fail that check before the unit tests and browser tests run, and the files served to browsers SHALL be the checked source files themselves.

#### Scenario: Type error on a pull request
- **WHEN** a pull request's latest commit passes a number where a module's JSDoc type expects a string
- **THEN** the required `test` check fails, naming the file and line, without running the unit or browser tests

#### Scenario: Served as written
- **WHEN** a page loads a script module
- **THEN** the browser receives the same JavaScript file that was type-checked, with no compiled copy
