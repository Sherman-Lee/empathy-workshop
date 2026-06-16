# ACC Empathy Workshop — UI flow diagrams

Visual maps of how facilitators and participants move through the workshop app. Each diagram below focuses on one slice of the experience — from opening a link on your phone to syncing stickies on the projector.

Generated from `docs/ui-flow.seed.json` by `scripts/ui-flow-to-mermaid.js`. Re-generate after seed changes: `npm run diagrams`

## Reading the diagrams


| Arrow style     | Meaning                                                  |
| --------------- | -------------------------------------------------------- |
| Solid (`-->`)   | Someone tapped a button or followed a link               |
| Dotted (`-.->`) | Automatic step (loading, lock check, preview auto-enter) |
| Thick (`==>`)   | Storage sync — facilitator change propagates to phones   |


## Diagram guide


| Diagram                                                                            | Who it's for                    | What it answers                                                                                                                                                                                                                                                           |
| ---------------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Overview — full workshop navigation](#overview)                                   | Everyone                        | The single map of how the workshop app fits together: how people enter as facilitator or participant, what each role sees, and how the projector and phones connect.                                                                                                      |
| [URL & bootstrap — how to open the app](#layer-url)                                | Facilitators, tech setup        | Shows the only two browser addresses the app uses (`/` for the live workshop, `/preview` for the design demo) and how query parameters skip the landing screen.                                                                                                           |
| [Role shells — facilitator vs participant](#layer-top-level)                       | Facilitators, product reviewers | What happens immediately after someone chooses a role.                                                                                                                                                                                                                    |
| [Facilitator boards — workshop agenda on the projector](#layer-facilitator-boards) | Facilitators                    | The five phases you move the room through by clicking tabs: Empathy Maps, Parking Lot, Reflections, Practice Proposals, and Commitments.                                                                                                                                  |
| [Facilitator tools — room controls beyond boards](#layer-facilitator-tools)        | Facilitators                    | Utilities in the header bar for running the session: show a QR code so phones can join, display the current prompt full-screen on the projector, pace the agenda with the timer, and open settings to edit personas, reclassify stickies, print a PDF, or wipe test data. |
| [Participant board flows — what phones show per phase](#layer-participant-boards)  | Facilitators, participants      | The submission experience on a phone for each workshop phase.                                                                                                                                                                                                             |
| [Participant overlays — modals and parking shortcut](#layer-participant-overlays)  | Participants, facilitators      | Pop-ups and shortcuts on the phone that sit above the active board.                                                                                                                                                                                                       |
| [Cross-role sync — how projector and phones stay aligned](#layer-cross-role)       | Facilitators, tech setup        | The behind-the-scenes contract between devices.                                                                                                                                                                                                                           |


## overview

**Overview — full workshop navigation**

*For:* Everyone

The single map of how the workshop app fits together: how people enter as facilitator or participant, what each role sees, and how the projector and phones connect. Start here if you are onboarding facilitators or explaining the tool to stakeholders.

**What to look for:** URL entry points at the top, the landing role chooser, facilitator board tabs, participant flows driven by storage sync (thick arrows), and the parking-lot shortcut available on every board.

```mermaid
flowchart TD
  %% Overview: entry points and role shells
  ep_root["/"]
  ep_root --> landing
  ep_participant_deeplink["/?role=participant"]
  ep_participant_deeplink --> participant_shell
  ep_facilitator_deeplink["/?role=facilitator"]
  ep_facilitator_deeplink --> facilitator_shell
  ep_room["/"]
  ep_preview["/preview"]
  ep_preview --> preview_canvas
  bootstrap["App bootstrap"]
  landing["Landing"]
  preview_canvas["Preview canvas"]
  participant_shell["Participant app shell"]
  facilitator_shell["Facilitator app shell"]
  centered_loader{{"Connecting / Loading"}}
  fac_lock_pending{{"Facilitator lock"}}
  fac_lock_displaced(["Facilitator lock"])
  fac_board_empathy["Empathy Maps board"]
  fac_board_parking["Parking Lot board"]
  fac_board_reflections["Reflections board"]
  fac_board_practices["Practice Proposals board"]
  fac_board_commitments["Commitments board"]
  fac_qr_panel(["QR"])
  fac_big_prompt(["Big prompt (projector intro)"])
  fac_agenda_timer["Agenda timer"]
  fac_settings(["Settings"])
  part_flow_empathy["Empathy flow"]
  part_flow_simple_parking["Parking Lot prompt flow"]
  part_flow_simple_reflections["Reflections prompt flow"]
  part_flow_practices["Practice proposals flow"]
  part_flow_simple_commitments["Commitments prompt flow"]
  part_parking_overlay(["Parking lot overlay"])
  bootstrap -->|"Navigate to / with no role query"| landing
  bootstrap -->|"?role=participant"| participant_shell
  bootstrap -->|"?role=facilitator"| facilitator_shell
  bootstrap -->|"Navigate to /preview"| preview_canvas
  preview_canvas -.->|"Auto-click participant landing button"| participant_shell
  preview_canvas -.->|"Auto-click facilitator landing button"| facilitator_shell
  landing -->|"I'm a Participant"| participant_shell
  landing -->|"I'm the Facilitator"| facilitator_shell
  facilitator_shell -->|"Exit header button"| landing
  participant_shell -.->|"Initial mount while loading"| centered_loader
  centered_loader -.->|"Storage poll complete"| participant_shell
  facilitator_shell -.->|"Initial mount or lock checking"| centered_loader
  centered_loader -.->|"Another facilitator holds fresh lock"| fac_lock_pending
  centered_loader -.->|"Lock acquired or stale"| facilitator_shell
  fac_lock_pending -->|"Take over as facilitator"| facilitator_shell
  fac_lock_pending -->|"Exit"| landing
  facilitator_shell -.->|"Lock heartbeat detects another session"| fac_lock_displaced
  fac_lock_displaced -->|"Take it back"| facilitator_shell
  fac_lock_displaced -->|"Exit"| landing
  facilitator_shell -->|"Board tab · Empathy Maps"| fac_board_empathy
  facilitator_shell -->|"Board tab · Parking Lot"| fac_board_parking
  facilitator_shell -->|"Board tab · Reflections"| fac_board_reflections
  facilitator_shell -->|"Board tab · Practice Proposals"| fac_board_practices
  facilitator_shell -->|"Board tab · Commitments"| fac_board_commitments
  facilitator_shell -->|"QR header button"| fac_qr_panel
  fac_qr_panel -->|"Close or backdrop click"| facilitator_shell
  facilitator_shell -->|"Prompt header button"| fac_big_prompt
  fac_big_prompt -->|"Close or backdrop click"| facilitator_shell
  facilitator_shell -->|"Clock icon"| fac_agenda_timer
  facilitator_shell -->|"Settings gear"| fac_settings
  fac_settings -->|"Close or backdrop click"| facilitator_shell
  participant_shell ==>|"activeBoard = empathy (from storage)"| part_flow_empathy
  participant_shell ==>|"activeBoard = parking"| part_flow_simple_parking
  participant_shell ==>|"activeBoard = reflections"| part_flow_simple_reflections
  participant_shell ==>|"activeBoard = practices"| part_flow_practices
  participant_shell ==>|"activeBoard = commitments"| part_flow_simple_commitments
  participant_shell -->|"Add to Parking Lot FAB"| part_parking_overlay
  part_parking_overlay -->|"Close or Back to workshop after success"| participant_shell
```



## layer-url

**URL & bootstrap — how to open the app**

*For:* Facilitators, tech setup

Shows the only two browser addresses the app uses (`/` for the live workshop, `/preview` for the design demo) and how query parameters skip the landing screen. Use this when building join links, testing QR codes, or sharing the preview canvas.

**What to look for:** Deep links like `/?role=participant` (phone join) and `/?role=facilitator` (projector). Dotted arrows are automatic steps, such as the preview page clicking the role buttons for you.

```mermaid
flowchart TD
  %% URL & bootstrap
  bootstrap["App bootstrap"]
  landing["Landing"]
  preview_canvas["Preview canvas"]
  participant_shell["Participant app shell"]
  facilitator_shell["Facilitator app shell"]
  fac_lock_pending{{"Facilitator lock"}}
  fac_lock_displaced(["Facilitator lock"])
  bootstrap -->|"Navigate to / with no role query"| landing
  bootstrap -->|"?role=participant"| participant_shell
  bootstrap -->|"?role=facilitator"| facilitator_shell
  bootstrap -->|"Navigate to /preview"| preview_canvas
  preview_canvas -.->|"Auto-click participant landing button"| participant_shell
  preview_canvas -.->|"Auto-click facilitator landing button"| facilitator_shell
  landing -->|"I'm a Participant"| participant_shell
  landing -->|"I'm the Facilitator"| facilitator_shell
  facilitator_shell -->|"Exit header button"| landing
  fac_lock_pending -->|"Take over as facilitator"| facilitator_shell
  fac_lock_pending -->|"Exit"| landing
  facilitator_shell -.->|"Lock heartbeat detects another session"| fac_lock_displaced
  fac_lock_displaced -->|"Take it back"| facilitator_shell
  fac_lock_displaced -->|"Exit"| landing
```



## layer-top-level

**Role shells — facilitator vs participant**

*For:* Facilitators, product reviewers

What happens immediately after someone chooses a role. The facilitator may hit a lock screen if another tab is already driving the room; the participant waits briefly while connecting to shared storage. This diagram clarifies who controls the agenda and what each side can navigate.

**What to look for:** Only the facilitator can exit back to landing. Participant board content follows the facilitator's active tab (thick `==>` arrows). Facilitator tools (QR, prompt, settings) branch off the main shell.

```mermaid
flowchart TD
  %% Role shells
  landing["Landing"]
  participant_shell["Participant app shell"]
  facilitator_shell["Facilitator app shell"]
  centered_loader{{"Connecting / Loading"}}
  fac_lock_pending{{"Facilitator lock"}}
  fac_lock_displaced(["Facilitator lock"])
  bootstrap["App bootstrap"]
  preview_canvas["Preview canvas"]
  fac_board_empathy["Empathy Maps board"]
  fac_board_parking["Parking Lot board"]
  fac_board_reflections["Reflections board"]
  fac_board_practices["Practice Proposals board"]
  fac_board_commitments["Commitments board"]
  fac_qr_panel(["QR"])
  fac_big_prompt(["Big prompt (projector intro)"])
  fac_agenda_timer["Agenda timer"]
  fac_settings(["Settings"])
  part_flow_empathy["Empathy flow"]
  part_flow_simple_parking["Parking Lot prompt flow"]
  part_flow_simple_reflections["Reflections prompt flow"]
  part_flow_practices["Practice proposals flow"]
  part_flow_simple_commitments["Commitments prompt flow"]
  part_parking_overlay(["Parking lot overlay"])
  bootstrap -->|"Navigate to / with no role query"| landing
  bootstrap -->|"?role=participant"| participant_shell
  bootstrap -->|"?role=facilitator"| facilitator_shell
  bootstrap -->|"Navigate to /preview"| preview_canvas
  preview_canvas -.->|"Auto-click participant landing button"| participant_shell
  preview_canvas -.->|"Auto-click facilitator landing button"| facilitator_shell
  landing -->|"I'm a Participant"| participant_shell
  landing -->|"I'm the Facilitator"| facilitator_shell
  facilitator_shell -->|"Exit header button"| landing
  participant_shell -.->|"Initial mount while loading"| centered_loader
  centered_loader -.->|"Storage poll complete"| participant_shell
  facilitator_shell -.->|"Initial mount or lock checking"| centered_loader
  centered_loader -.->|"Another facilitator holds fresh lock"| fac_lock_pending
  centered_loader -.->|"Lock acquired or stale"| facilitator_shell
  fac_lock_pending -->|"Take over as facilitator"| facilitator_shell
  fac_lock_pending -->|"Exit"| landing
  facilitator_shell -.->|"Lock heartbeat detects another session"| fac_lock_displaced
  fac_lock_displaced -->|"Take it back"| facilitator_shell
  fac_lock_displaced -->|"Exit"| landing
  facilitator_shell -->|"Board tab · Empathy Maps"| fac_board_empathy
  facilitator_shell -->|"Board tab · Parking Lot"| fac_board_parking
  facilitator_shell -->|"Board tab · Reflections"| fac_board_reflections
  facilitator_shell -->|"Board tab · Practice Proposals"| fac_board_practices
  facilitator_shell -->|"Board tab · Commitments"| fac_board_commitments
  facilitator_shell -->|"QR header button"| fac_qr_panel
  fac_qr_panel -->|"Close or backdrop click"| facilitator_shell
  facilitator_shell -->|"Prompt header button"| fac_big_prompt
  fac_big_prompt -->|"Close or backdrop click"| facilitator_shell
  facilitator_shell -->|"Clock icon"| fac_agenda_timer
  facilitator_shell -->|"Settings gear"| fac_settings
  fac_settings -->|"Close or backdrop click"| facilitator_shell
  participant_shell ==>|"activeBoard = empathy (from storage)"| part_flow_empathy
  participant_shell ==>|"activeBoard = parking"| part_flow_simple_parking
  participant_shell ==>|"activeBoard = reflections"| part_flow_simple_reflections
  participant_shell ==>|"activeBoard = practices"| part_flow_practices
  participant_shell ==>|"activeBoard = commitments"| part_flow_simple_commitments
  participant_shell -->|"Add to Parking Lot FAB"| part_parking_overlay
  part_parking_overlay -->|"Close or Back to workshop after success"| participant_shell
  fac_qr_panel -->|"Participant scans QR (?role=participant)"| participant_shell
```



## layer-facilitator-boards

**Facilitator boards — workshop agenda on the projector**

*For:* Facilitators

The five phases you move the room through by clicking tabs: Empathy Maps, Parking Lot, Reflections, Practice Proposals, and Commitments. Switching tabs updates every participant phone within a few seconds. On Empathy Maps you can show all eight personas at once (gallery) or zoom into one (focus).

**What to look for:** Linear tab order across boards. The nested Empathy Maps state shows gallery ↔ focus toggles while staying on the same board.

```mermaid
stateDiagram-v2
  %% Facilitator workshop boards
  fac_board_parking: Parking Lot board
  fac_board_reflections: Reflections board
  fac_board_practices: Practice Proposals board
  fac_board_commitments: Commitments board
  [*] --> fac_board_empathy
  fac_board_empathy --> fac_board_parking: Parking Lot board
  fac_board_parking --> fac_board_reflections: Reflections board
  fac_board_reflections --> fac_board_practices: Practice Proposals board
  fac_board_practices --> fac_board_commitments: Commitments board
  state "Empathy Maps board" as fac_board_empathy {
    [*] --> fac_board_empathy_grid
    fac_board_empathy_grid --> fac_board_empathy_focus: Focus (1)
    fac_board_empathy_focus --> fac_board_empathy_grid: Gallery (8)
  }
```



## layer-facilitator-tools

**Facilitator tools — room controls beyond boards**

*For:* Facilitators

Utilities in the header bar for running the session: show a QR code so phones can join, display the current prompt full-screen on the projector, pace the agenda with the timer, and open settings to edit personas, reclassify stickies, print a PDF, or wipe test data.

**What to look for:** QR links out to the participant join URL. Settings has four tabs; persona editing and print/export are one level deeper.

```mermaid
flowchart TD
  %% Facilitator overlays & settings
  fac_qr_panel(["QR"])
  fac_big_prompt(["Big prompt (projector intro)"])
  fac_agenda_timer["Agenda timer"]
  fac_settings(["Settings"])
  fac_settings_personas["Settings"]
  fac_persona_editor["Persona editor"]
  fac_settings_move["Settings"]
  fac_settings_export["Settings"]
  fac_print_view["Print / PDF export"]
  fac_settings_clear["Settings"]
  facilitator_shell["Facilitator app shell"]
  participant_shell["Participant app shell"]
  facilitator_shell -->|"QR header button"| fac_qr_panel
  fac_qr_panel -->|"Close or backdrop click"| facilitator_shell
  facilitator_shell -->|"Prompt header button"| fac_big_prompt
  fac_big_prompt -->|"Close or backdrop click"| facilitator_shell
  facilitator_shell -->|"Clock icon"| fac_agenda_timer
  facilitator_shell -->|"Settings gear"| fac_settings
  fac_settings -->|"Close or backdrop click"| facilitator_shell
  fac_settings -->|"Personas tab"| fac_settings_personas
  fac_settings -->|"Move stickies tab"| fac_settings_move
  fac_settings -->|"Print / Export tab"| fac_settings_export
  fac_settings -->|"Clear data tab"| fac_settings_clear
  fac_settings_personas -->|"Click persona card"| fac_persona_editor
  fac_persona_editor -->|"Cancel or Save"| fac_settings_personas
  fac_settings_export -->|"Open print view"| fac_print_view
  fac_qr_panel -->|"Participant scans QR (?role=participant)"| participant_shell
```



## layer-participant-boards

**Participant board flows — what phones show per phase**

*For:* Facilitators, participants

The submission experience on a phone for each workshop phase. Participants never pick the board themselves — they always see whatever the facilitator has activated. Empathy and Practice Proposals use two-step flows; the other boards are a single prompt and submit.

**What to look for:** Back navigation within empathy and practices flows. Simple boards (parking, reflections, commitments) have no sub-steps in this diagram.

```mermaid
stateDiagram-v2
  %% Participant board flows
  part_flow_empathy: Empathy flow
  part_empathy_persona: Empathy
  part_empathy_compose: Empathy
  part_flow_simple_parking: Parking Lot prompt flow
  part_flow_simple_reflections: Reflections prompt flow
  part_flow_practices: Practice proposals flow
  part_practices_column: Practices
  part_practices_write: Practices
  part_flow_simple_commitments: Commitments prompt flow
  [*] --> part_flow_empathy
  [*] --> part_flow_simple_parking
  [*] --> part_flow_simple_reflections
  [*] --> part_flow_practices
  [*] --> part_flow_simple_commitments
  part_flow_empathy --> part_empathy_persona: Default step
  part_empathy_persona --> part_empathy_compose: Select persona card
  part_empathy_compose --> part_empathy_persona: Header Back
  part_flow_practices --> part_practices_column: Default step
  part_practices_column --> part_practices_write: Select column
  part_practices_write --> part_practices_column: Header Back
```



## layer-participant-overlays

**Participant overlays — modals and parking shortcut**

*For:* Participants, facilitators

Pop-ups and shortcuts on the phone that sit above the active board. The parking-lot button is always available at the bottom so operational concerns can be captured without leaving the current exercise. After submitting, the posted confirmation lets people add another note or switch persona.

**What to look for:** Parking overlay reachable from any board. Sample empathy map is only offered during persona selection. Posted modal paths differ for empathy vs other boards.

```mermaid
flowchart TD
  %% Participant modals & parking
  part_parking_overlay(["Parking lot overlay"])
  part_sample_overlay(["Sample empathy map"])
  part_posted_modal(["Posted confirmation"])
  participant_shell["Participant app shell"]
  part_flow_simple_parking["Parking Lot prompt flow"]
  part_flow_simple_reflections["Reflections prompt flow"]
  part_flow_simple_commitments["Commitments prompt flow"]
  part_empathy_persona["Empathy"]
  part_empathy_compose["Empathy"]
  part_practices_write["Practices"]
  participant_shell ==>|"activeBoard = parking"| part_flow_simple_parking
  participant_shell ==>|"activeBoard = reflections"| part_flow_simple_reflections
  participant_shell ==>|"activeBoard = commitments"| part_flow_simple_commitments
  part_empathy_persona -->|"Select persona card"| part_empathy_compose
  part_empathy_compose -->|"Header Back"| part_empathy_persona
  part_empathy_persona -->|"See an example empathy map"| part_sample_overlay
  part_sample_overlay -->|"Close / Got it"| part_empathy_persona
  part_empathy_compose -->|"Submit sticky"| part_posted_modal
  part_flow_simple_parking -->|"Submit sticky"| part_posted_modal
  part_flow_simple_reflections -->|"Submit sticky"| part_posted_modal
  part_flow_simple_commitments -->|"Submit sticky"| part_posted_modal
  part_practices_write -->|"Submit proposal"| part_posted_modal
  part_posted_modal -->|"Add another (empathy)"| part_empathy_compose
  part_posted_modal -->|"Switch to different person (empathy)"| part_empathy_persona
  part_posted_modal -->|"Add another (simple boards)"| part_flow_simple_parking
  participant_shell -->|"Add to Parking Lot FAB"| part_parking_overlay
  part_parking_overlay -->|"Close or Back to workshop after success"| participant_shell
```



## layer-cross-role

**Cross-role sync — how projector and phones stay aligned**

*For:* Facilitators, tech setup

The behind-the-scenes contract between devices. No URLs change when the facilitator switches boards — shared storage carries state. Facilitator tab changes push the active board to phones; participant submissions flow back to the projector. Only one facilitator session can drive a room at a time.

**What to look for:** Four sync channels: active board, sticky submissions, persona edits, and facilitator lock heartbeat.

```mermaid
sequenceDiagram
  %% Facilitator ↔ participant sync
  %% sync-active-board: Participant main content switches between board flows; participant cannot change board
  participant Facilitator
  participant Storage
  participant Participant
  Facilitator->>Storage: set acc-active-board
  Participant->>Storage: poll
  Storage-->>Participant: Participant main content switches between board flows; participant cannot change board

  %% sync-stickies: Facilitator board views update with new stickies
  participant Participant
  participant Storage
  participant Facilitator
  Participant->>Storage: append acc-stickies-empathy, acc-stickies-parking-lot, acc-stickies-reflections, acc-stickies-practices, acc-stickies-commitments
  Facilitator->>Storage: poll
  Storage-->>Facilitator: Facilitator board views update with new stickies

  %% sync-personas: Participant persona picker reflects facilitator edits
  participant Facilitator
  participant Storage
  participant Participant
  Facilitator->>Storage: set acc-personas
  Participant->>Storage: poll
  Storage-->>Participant: Participant persona picker reflects facilitator edits

  %% sync-facilitator-lock: Only one active facilitator session per room
  participant Facilitator
  Facilitator->>Facilitator: Heartbeat every 5s; stale after 15s (acc-facilitator-lock)
```



