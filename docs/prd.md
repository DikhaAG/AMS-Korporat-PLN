## Product Requirements Document: Corporate Electronic Official Documentation System

This document defines the functional architecture, technical specifications, data schema, and operational constraints for an enterprise-scale corporate Electronic Official Documentation platform.

---

## Executive Summary and Product Objectives

The corporate Electronic Official Documentation System is designed to digitize official paperwork, multi-tiered approval flows, and paperless delegation of work instructions between business units.

### Key Objectives

* Eliminate the bureaucratic process of physical official documents through a multi-tiered digital approval flow.
* Ensure the validity of official documents with a centralized, duplication-free numbering system and digital authentication based on cryptographic verification.
* Provide real-time chain-of-command tracking through a multi-branch document disposition tree.
* Ensure the integrity of corporate compliance audits through forensic logging of every data movement.

---

## Role Structure and Access Rights

The system uses a *Position-Based Access Control* model, where authority is assigned to structural positions within the organizational hierarchy, not to individual personal accounts.

| Role | Description of Authority | Scope of Access Rights |
| --- | --- | --- |
| **Draftsman** | Operational staff who drafts official documents. | Drafts documents, uploads attachments, submits drafts to direct superiors, and withdraws drafts before review. |
| **Checker/Verifier** | Mid-level structural official (such as Assistant Manager or Manager). | Checks the contents of the draft, affixes verification initials, provides correction notes, returns the draft for revision, and forwards the draft to the next superior. |
| **Document Signer** | The highest decision-making authority (such as a Senior Manager or General Manager). | Approves official documents, permanently rejects documents, triggers the issuance of an official letter number, and affixes an official electronic signature. |
| **Disposition Executor** | Official or staff member who receives the delegation of duties for issued official documents. | Reads official documents, creates disposition branches for subordinates, marks action instructions as completed, and completes follow-up reports. |
| **Unit Administrator** | Manages correspondence for the work unit secretariat. | Configures letter templates, monitors numbering diaries, registers incoming physical mail from external parties, and manages active and inactive archive files. |

---

## Functional Requirements Specification

### Module 1: Organizational Structure Management and Position Delegation

* **Dynamic Hierarchical Tree:** The system must map the corporate organizational structure without depth limitations using a hierarchical tree model, including relationships between direct superiors, parent work units, and implementing work units.
* **Temporary Delegation of Authority:** Structural officials have the right to appoint Daily Executors or Acting Task Forces while on leave or on official business.
* **Delegation Term:** The appointment of a Daily Executive must have a predetermined active period. All approval rights automatically transfer to the Daily Executive during that period and revert to the permanent official automatically at the end of the period.
* **Signer Identity Audit:** Documents approved by a replacement official must include a signature statement in the official name.

### Module 2: Atomic Official Document Number Generation

* **Standard Format Algorithm:** The system must dynamically compile document numbers based on the pattern:
`[Sequence Number]/[Subject Classification Code]/[Issuing Unit Position Code]/[Year of Publication]`
* **Duplicate Number Prevention:** Serial number generation must be executed using high-level transaction isolation with a pessimistic locking mechanism in the official document counter table to avoid number collisions under high concurrency conditions. * **Special Numbering:** Provides a manual numbering feature for backdated official documents originating from offline coordination with the approval of the secretariat administrator.

### Module 3: Document Lifecycle and Approval Workflow Engine

The document lifecycle is managed using a centralized finite state machine.

```
[DRAFT] ---> [IN_REVIEW] ---> [NEEDS_REVISION] ---> [DRAFT]
|
v
[APPROVED] ---> [SIGNED_AND_PUBLISHED]
|
v
[REJECTED]

```

* **Draft and Validation:** The document author fills in metadata such as the subject, the nature of the document (regular, urgent, confidential), a list of copies, the contents of the document via rich text, and supporting attachments. * **Flexible Review Chain:** The approval path can proceed sequentially following a structural hierarchy or include additional non-structural reviewers (such as Compliance or Legal Officers) before the manuscript reaches final sign-off.
* **Document Review Actions:** Reviewers have the following action rights:
* **Approve:** Digitally initial and forwardthe manuscript to the next reviewer.
* **Revision:** Returns the manuscript to the drafter with line-by-line correction notes, changes the status to `NEEDS_REVISION`, and blocks access for other reviewers.
* **Reject:** Permanently cancels the manuscript with the status `REJECTED`.

* **Cancellation by Sender:** The drafter can cancel a draft letter with the status `IN_REVIEW` as long as the first-level reviewer has not taken action.

### Module 4: Document Distribution and Disposition Tree

* **Automatic Distribution of Issued Manuscripts:** As soon as the final signer approves the manuscript, the system automatically issues a letter number, copies the document to the inboxes of all positions listed in the primary recipient and copy fields, and sounds a real-time notification.
* **Disposition Delegation Mechanism:** The recipient of an official manuscript can delegate the task mandate to one or more direct subordinates in parallel.
* **Disposition Parameters:** Each disposition instruction must include:
* **Disposition Type:** Open (visible to the entire disposition chain in the work unit) or Closed (readable only by the selected target subordinate).
* **Action Checklist:** The minimum selection includes 12 standard instructions (including: For Information, For Attention, For Study, Prepare Response, Respond Directly, Agree to Follow Up, Take Necessary Action, Discuss, Report, Resolve Immediately, Copy For, Other).
* **Directive Note:** Specific textual instructions from a superior.
* **Completion Deadline:** Target date and time for completion of the instruction.

* **Lineage Tree Tracking:** The system must present a visualization of the chain of instructions from the highest management to the lowest-ranking staff in a single, integrated hierarchical interface.

### Module 5: Electronic Signatures and File Integrity

* **Final File Compilation:** The system generates a final PDF document that combines the official document, definitive letter number, initial history, and attachments.
* **Dynamic QR Code Embedding:** Official documents are embedded with a QR code in the bottom right corner that leads to a public integrity verification link.
* **Public Validation Page:** When the QR code is scanned by an external party, the system displays a document verification page that proves the document's authenticity without revealing any confidential corporate data.
* **Integrity Encryption:** PDF files are cryptographically signed using a corporate digital certificate with the SHA-256 hash algorithm to detect unauthorized changes to the file after it is published.

### Module 6: Archive Governance and Document Retention

* **Automatic Retention Schedule:** Each published document is immediately calculated for its archive retention period based on the document classification code.
* Active Period: The document remains visible in the daily operational inbox.
* Inactive Period: Manuscripts are automatically moved to the static archive module and can only be accessed through the archive agenda book search.

* **Quick Search:** The document search engine supports multi-parameter filtering: manuscript date range, agenda number, subject, publishing unit, and full-text search within the body of the letter.

---

## Database Schema Design

```
+------------------+ +-------------------+ +----------------------------------+
| org_positions | | users | | position_delegations |
+------------------+ +-------------------+ +----------------------------------+
| id (PK) |<------| id (PK) | | id (PK) |
| title | | position_id (FK) | | delegator_pos_id (FK) |
| parent_id (FK) | | name | | delegatee_user_id(FK) |
| unit_code | | email | | start_date / end_date |
+--------+---------+ +---------+ +--------------+ 
| 
| 
+--------------------------+ 
| | 
v v
+-----------------------+ +-----------------------+
| documents | | document_approvals |
+-----------------------+ +-----------------------+
| id (PK) |<------| id (PK) |
| doc_number | | document_id (FK) |
| status | | reviewer_pos_id (FK) |
| classification | | step_order |
| sender_pos_id(FK)| | status (WAIT/ACC/REV) |
+--------+---------+ +-----------------------+ 
| 
v
+------------------+
| dispositions |
+------------------+
| id (PK) |
| document_id (FK) |
| parent_id (FK) |
| from_pos_id (FK) |
| to_pos_id (FK) |
| action_checklist |
+------------------+

```

### 1. `org_positions`

Stores the hierarchical structure of the organization.

* `id` (UUID, Primary Key)
* `code` (VARCHAR, Unique): Official position code, e.g., `SM KEU`, `GM UID S2JB`.
* `title` (VARCHAR): Full name of the position.
* `parent_id` (UUID, Nullable, Foreign Key to `org_positions.id`): Position of the immediate superiorg.
* `unit_id` (UUID): Relationship to the work unit table.
* `is_signer` (BOOLEAN): Status of whether this position is authorized to sign outgoing documents.

### 2. `users`

The identity of the employee operating the account.

* `id` (UUID, Primary Key)
* `nip` (VARCHAR, Unique): Employee Identification Number.
* `name` (VARCHAR): Full name and title.
* `email` (VARCHAR, Unique): Company email address.
* `position_id` (UUID, Foreign Key to `org_positions.id`): Current active position.
* `signature_passphrase_hash` (VARCHAR): Document signature authorization security key.

### 3. `position_delegations`

Recording the delegation of authority to temporary officials.

* `id` (UUID, Primary Key)
* `delegator_position_id` (UUID, Foreign Key to `org_positions.id`): The definitive official position.
* `delegatee_user_id` (UUID, Foreign Key to `users.id`): The employee appointed as the Daily Executive.
* `delegation_type` (ENUM: `PLH`, `PLT`): The type of appointment.
* `assignment_letter_ref` (VARCHAR): The basic assignment letter number.
* `valid_from` (TIMESTAMPTZ): The start time of the authorization.
* `valid_until` (TIMESTAMPTZ): The expiration time of the authorization.

### 4. `documents`

The central entity for official documents.

* `id` (UUID, Primary Key)
* `document_type` (ENUM: `DINAS_NOTE`, `OUTGOING_LETTER`, `ASSIGNMENT_LETTER`, `CIRCULAR_LETTER`)
* `document_number` (VARCHAR, Nullable, Indexed): Auto-populated after final approval.
* `agenda_number` (VARCHAR): Registration number of the incoming/outgoing agenda book.
* `classification_code` (VARCHAR): Archival classification code for official documents.
* `subject` (TEXT): Subject/summary of the document.
* `body_html` (TEXT): The content of the document in web layout format.
* `security_level` (ENUM: `REGULAR`, `RESTRICTED`, `CONFIDENTIAL`, `TOP_SECRET`)
* `urgency_level` (ENUM: `REGULAR`, `URGENT`, `FLASH`)
* `creator_user_id` (UUID, Foreign Key to `users.id`)
* `sender_position_id` (UUID, Foreign Key to `org_positions.id`)
* `current_status` (ENUM: `DRAFT`, `IN_REVIEW`, `NEEDS_REVISION`, `APPROVED`, `SIGNED_AND_PUBLISHED`, `REJECTED`, `CANCELLED`)
* `retention_active_date` (DATE): The end date of the active file.
* `retention_inactive_date` (DATE): The end of the file's inactive period before deletion.
* `final_pdf_path` (VARCHAR, Nullable): The location where the sworn PDF file is stored.

### 5. `document_approvals`

Logs the verification and approval path of official documents.

* `id` (UUID, Primary Key)
* `document_id` (UUID, Foreign Key to `documents.id`, On Delete Cascade)
* `reviewer_position_id` (UUID, Foreign Key to `org_positions.id`): The reviewer's position.
* `actual_reviewer_user_id` (UUID, Nullable, Foreign Key to `users.id`): The actual user who executed the action.
* `step_order` (INTEGER): The hierarchical order of the review (1, 2, 3, etc.).
* `approval_role` (ENUM: `INITIAL_DRAFTER`, `VERIFIER_PARAF`, `FINAL_SIGNER`)
* `action_status` (ENUM: `PENDING`, `APPROVED`, `REVISED`, `REJECTED`)
* `notes` (TEXT, Nullable): Notes on the revision return or disposition of the directive.
* `acted_at` (TIMESTAMPTZ, Nullable): Timestamp of the review execution.

### 6. `dispositions`

Tree for follow-up assignments for incoming letters and issued official memos.

* `id` (UUID, Primary Key)
* `document_id` (UUID, Foreign Key to `documents.id`)
* `parent_disposition_id` (UUID, Nullable, Foreign Key to `dispositions.id`): The parent of the disposition chain.
* `from_position_id` (UUID, Foreign Key to `org_positions.id`): The official issuing the instruction.
* `to_position_id` (UUID, Foreign Key to `org_positions.id`): The target official executing the instruction.
* `disposition_type` (ENUM: `OPEN`, `CLOSED`): The openness of the disposition.
* `action_checklist` (JSONB): An array of mandatory actions.
* `instruction_notes` (TEXT): Assignment notes from the supervisor.
* `deadline` (TIMESTAMPTZ): The deadline for completing the instruction.
* `execution_status` (ENUM: `WAITING`, `IN_PROGRESS`, `COMPLETED`)
* `completed_at` (TIMESTAMPTZ, Nullable)
* `completion_report` (TEXT, Nullable): Summary of subordinate work results.

### 7. `document_audit_trails`

Forensic history recording of all system operations.

* `id` (BIGSERIAL, Primary Key)
* `document_id` (UUID, Foreign Key to `documents.id`)
* `actor_user_id` (UUID, Foreign Key to `users.id`)
* `event_type` (VARCHAR): The event type (e.g., `DRAFT_CREATED`, `PARAF_ADDED`, `DOC_REVISED`, `DISPOSITION_CREATED`, `DOC_DOWNLOADED`).
* `ip_address` (INET): The user's network address.
* `user_agent` (TEXT): Client browser or device information.
* `state_payload` (JSONB): A record of the data state before and after the change was executed.
* `created_at` (TIMESTAMPTZ): The timestamp of the recording.

---

## Non-Functional Requirements

### 1. Data Security and Integrity

* **Closed Document Readability:** Documents with the confidentiality levels `SECRET` and `TOP_SECRET` can only be accessed through double credential verification by the relevant official and cannot be delegated to non-structural assistants.
* **Immutable Audit Trail:** The forensic history table `document_audit_trails` is append-only; the database is prohibited from having any update or delete functions.data in this table.
* **Data Encryption at Rest:** All official document PDF files and attachments are encrypted at the file storage level using the AES-256 encryption standard.

### 2. System Performance and Availability

* **Concurrency Lock Prevention:** Official document number generation must not block system read queries; number counter row lock transactions are limited to a maximum of 500 milliseconds.
* **Document Rendering Load:** Official document PDF file generation and QR code embedding must be delegated to a background process queue without blocking the user's browser's main thread.
* **Interface Load Time:** The main official document inbox display must load the first 50 rows of data in less than 1.5 seconds on a standard corporate network connection.

### 3. Archival Compliance

* **Automatic Document Retention:** The system must run a scheduled process every midnight to validate the active date of official documents and change the status of documents that have exceeded the active retention limit to inactive.
* **Permanent Storage:** Official documents with a published status may not be physically removed from the database to meet corporate archival audit standards. Deletion is only permitted logically with an official cancellation mark.