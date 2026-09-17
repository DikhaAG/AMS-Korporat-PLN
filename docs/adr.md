# Master Architectural Decision Records: Electronic Official Documentation System

This Architectural Decision Records (ADR) document defines technical decisions, architectural constraints, and business logic rules to guide an AI agent in writing, refactoring, and validating code for a corporate correspondence system.

---

## ADR-001: Core Technology Stack and Hybrid RSC-tRPC Architecture

### Status

Accepted (Updated)

### Context

The Electronic Official Documentation System (EDP) manages high-value bureaucratic data with requirements for low latency on inbox table reads, strict transaction isolation on mail numbering, and security of closed-loop correspondence data. User interactions involve complex workflows (dynamic modal disposition, layered form validation, and interactive data tables).

### Decisions

1. **Application Framework:** Using Next.js 16 App Router. Adopting a hybrid architecture:
* React Server Components (RSC): Used for rendering the app shell, main layout, and initial data fetching of the inbox for fast initial loading and internal SEO/archiving.
* Client Components (use client): Used for interactive components such as the scripting form, disposition modal, and table filter handler.

2. Communication and Data Validation Layer:
* tRPC v11: Serves as the primary protocol for data mutation and client-side data fetching that requires fast revalidation (e.g., updating draft statuses, opening verification modals, and retrieving disposition trees).
* Zod: Serves as the single source of truth for data schema validation across all layers (forms, tRPC procedures, and Drizzle JSONB field entities).

3. Database Layer: Drizzle ORM connects to PostgreSQL (Supabase). All critical mutations must be wrapped in a Drizzle database transaction.
4. Interface Components and State Management:

TanStack Table v8: A mail table-wide handler with server-side pagination, sorting, and filtering.

React Hook Form & `@hookform/resolvers/zod`: Mail input form and disposition sheet handlers.

shadcn/ui & Tailwind CSS: UI primitive components.

nuqs: Type-safe URL parameter synchronization for table state and search filters.

### Consequences for AI Agents

Do not create manual API routes (`app/api/*/route.ts`) for application business logic. All interactive data communication must go through tRPC procedure routes (`src/server/routers/*`).

Avoid manipulating table state using the local `useState` if the parameter represents an inbox filter; must be synchronized to a URL via `nuqs` and then passed to the tRPC query procedure.

---

## ADR-002: Position-Based Access Control (PBAC) and the `ltree` Extension

### Status

Accepted (Updated)

### Context

The authority to initial, sign, disposition, and read official letters is attached to the structural position code (`org_positions`). The system must handle temporary delegation of authority (Personnel/PLH and Task Acting/PLT) as well as the superior-subordinate hierarchy without slow query recursion.

### Decision

1. **Position Hierarchy Using `ltree`:** The `org_positions` table enables the PostgreSQL `ltree` extension on the `hierarchy_path` column. The path format is: `DIR_UTAMA.DIR_KEU.SM_KEU.ASMAN_AKUNTANSI`.

2. tRPC Middleware Integration: Any tRPC procedure that requires access rights must use the `protectedPositionProcedure` middleware. This middleware validates the Better-Auth session and extracts the user's effective position (including active PLH/PLT status).

```sql
CREATE EXTENSION IF NOT EXISTS ltree;

ALTER TABLE org_positions
ADD COLUMN hierarchy_path LTREE NOT NULL,
ADD COLUMN is_signer BOOLEAN DEFAULT FALSE;

CREATE INDEX org_positions_path_gist_idx ON org_positions USING GIST (hierarchy_path);

```

### Consequences for AI Agents

* Do not create access rights validation based on static role strings (such as `role === 'admin'`). Validation must check structural position relationships using the `ltree` operator (e.g., `path <@subpath` to check subordinate relationships).
* Better-Auth sessions must contain the active position context. If a user is acting as an PLH, each audit log must record dual identities: `actor_user_id` (executor) and `effective_position_id` (position represented).

---

## ADR-003: Isolated Finite State Machine

### Status

Accepted

### Context

The lifecycle of official document documents has legally binding transition rules. Directly updating the document status (*arbitrary status update*) via the `UPDATE documents SET current_status = ...` command can compromise the integrity of the file verification flow.

### Decision

State transitions must be managed through a single server-side State Machine module executed via protected tRPC mutations.

| Initial State    | Allowed Actions     | Goal Status                                    | Authorized Parties                                        |
| ------------------| ---------------------| ------------------------------------------------| -----------------------------------------------------------|
| `DRAFT`          | `SUBMIT_FOR_REVIEW` | `IN_REVIEW`                                    | Drafter                                                   |
| `IN_REVIEW`      | `APPROVE_STEP`      | `IN_REVIEW` (if there are follow-up reviewers) | Running Order Verifier                                    |
| `IN_REVIEW`      | `REQUEST_REVISION`  | `NEEDS_REVISION`                               | Verifier / Signer                                         |
| `IN_REVIEW`      | `REJECT`            | `REJECTED`                                     | Document Signer                                           |
| `IN_REVIEW`      | `FINAL_APPROVE`     | `SIGNED_AND_PUBLISHED`                         | Document Signer                                           |
| `NEEDS_REVISION` | `RESUBMIT`          | `IN_REVIEW`                                    | Drafter                                                   |
| `IN_REVIEW`      | `CANCEL`            | `CANCELLED`                                    | Drafter (only if the first verifier has not yet reviewed) |

### Consequences for AI Agents

* Direct mutations to the `current_status` field are prohibited. All state changes must call the central mutation procedure on the tRPC script router (e.g., `documentRouter.transitionState`).
* When the state becomes `IN_REVIEW`, the document locks the content of the document (`is_locked = true`). Editing rights are only re-opened if the state transitions to `NEEDS_REVISION`.

---

## ADR-004: Collision-Free Atomic Manuscript Number Generation

### Status

Accepted

### Context

The official document number (`document_number`) is only issued when the document reaches the `SIGNED_AND_PUBLISHED` status. The corporate numbering format (`[Sequence]/[Classification]/[Unit]/[Year]`) must not produce duplicate numbers or skip numbers due to race conditions when multiple documents are approved simultaneously.

### Decision

Sequence number generation must lock counter rows using PostgreSQL transaction isolation with a `SELECT ... FOR UPDATE` clause within a Drizzle ORM transaction block.

```typescript
export async function generateDocumentNumber(
tx: DrizzleTransaction,
classificationCode: string,
unitCode: string,
year: number
): Promise<string> {
const [counter] = await tx
.select()
.from(documentCounters)
.where(
and(
eq(documentCounters.classificationCode, classificationCode),
eq(documentCounters.year, year)
)
)
.for('update');

const nextSeq = (counter?.currentSequence??0) + 1;

await tx
.insert(documentCounters)
.values({ classificationCode, year, currentSequence: nextSeq })
.onConflictDoUpdate({
target: [documentCounters.classificationCode, documentCounters.year],
set: { currentSequence: nextSeq }
});

return `${nextSeq}/${classificationCode}/${unitCode}/${year}`;
}

```

### Consequences for AI Agents

* Do not use the aggregate count function `COUNT(id) + 1` from the document table to generate sequence numbers.
* Executing the document numbering must be part of the same database transaction as changing the document status to `SIGNED_AND_PUBLISHED`.

---

## ADR-005: Distribution Separation Model: Disposition vs. Forwarding

### Status

Accepted (Updated)

### Context

There is a functional difference between delegating a cascading operational instruction (Disposition) and distributing a copy of a file as a notification without a workload (Forward).

### Decision

1. Integrate the script distribution entity in the `dispositions` table with a separate `transmission_mode` column (`DISPOSITION` or `FORWARD`).
2. Validate the disposition action checklist data structure using the Zod schema `dispositionActionSchema`, which contains 12 standard instructions.
3. The `dispositions` table uses a self-referencing relationship (`parent_disposition_id`) to form the instruction lineage tree.

```sql
CREATE TYPE transmission_mode_enum AS ENUM ('DISPOSITION', 'FORWARD');
CREATE TYPE disposition_type_enum AS ENUM ('OPEN', 'CLOSED');

ALTER TABLE dispositions
ADD COLUMN transmission_mode transmission_mode_enum NOT NULL DEFAULT 'DISPOSITION',
ADD COLUMN disposition_type disposition_type_enum NOT NULL DEFAULT 'OPEN',
ADD COLUMN action_checklist JSONB NOT NULL DEFAULT '[]'::jsonb;

```

### Consequences for AI Agents

* If `transmission_mode === 'FORWARD'`, disable validation of `action_checklist` and the deadline (`deadline`).

* If `disposition_type === 'CLOSED'`, apply a query security filter so that the disposition history is only readable by the creator and recipient roles.

---

## ADR-006: Asynchronous Document Processing Pipeline and Digital Signatures

### Status

Accepted

### Context

Compiling an HTML/CSS document to a formal PDF, flattening the document, embedding a dynamic QR code stamp image, and verifying the digital certificate require high computational power and I/O operations that must not block the HTTP execution cycle.

### Decision

1. **Work Queue Separation:** Use a background queuing mechanism (*background job worker* via Inngest or pg-boss).
2. **Document Seal Flow:**
* Trigger: Document state transition reaches final approval.
* Step 1: The background worker renders the draft from the Tiptap editor into a primary PDF file via Puppeteer.
* Step 2: Using `pdf-lib`, embed the verification QR code image at the fixed coordinates of the document. The QR code link points to a public route: `https://[domain]/verify/[document_hash]`.
* Step 3: Calculate *ddigest* the file using SHA-256 and store the hash in the `integrity_hash` column of the document table before uploading the final file to the protected file storage (*storage bucket*).

### Consequences for AI Agents

* Running Puppeteer PDF rendering directly within tRPC procedures or Server Actions is prohibited. The tRPC procedure is solely responsible for validating the status and enqueuing the job ticket.
* The client interface must display a file processing status indicator (`GENERATING_PDF` $\rightarrow$ `READY`) by utilizing a Supabase Realtime event subscription on the associated document entity.

---

## ADR-007: Corporate Authentication and Session Management with Better-Auth

### Status

Accepted (New)

### Context

The system requires session management that integrates directly with Drizzle ORM on PostgreSQL, supports structural position metadata, and facilitates delegation of authority (PLH/PLT) mechanisms without compromising the integrity of the definitive employee account.

### Decision

1. Authentication Library: Use Better-Auth with the official Drizzle ORM adapter (`@better-auth/drizzle-adapter`).
2. Position Session Extension: The Better-Auth user table schema is extended with a `position_id` column and an active delegation table. Each session token stores custom session properties:
* `userId`: The authenticated employee account ID.
* `activePositionId`: The structural position ID currently in use in the session.
* `isDelegated`: A Boolean indicator of whether the user is currently acting as a PLH/PLT.
* `delegationId`: A reference to the `position_delegations` row if the delegation status is active.

3. PLH Role Switching: Provide a custom Better-Auth procedure to temporarily switch work contexts between the employee's definitive role and the supervisor's delegated role.

### Consequences for AI Agents

* Do not create your own custom authentication tables. They must follow the schema of the `user`, `session`, `account`, and `verification` tables generated by the Better-Auth CLI / Drizzle plugin.
* On every file mutation or disposition, be sure to read `ctx.session.activePositionId` from the tRPC context, rather than retrieving the raw `position_id` directly from the profile table.

---

## ADR-008: End-to-End Validation: Zod Schema, tRPC Procedure, React Hook Form, and TanStack Table

### Status

Accepted (New)

### Context

A corporate correspondence form has dozens of input variations (11 correspondence script subtypes, 12 disposition checklists, retention date selections, and script urgency markers). Validation discrepancies between the client and server interfaces can lead to bureaucratic failures and database inconsistencies.

### Decision

1. **Single Source of Truth Schema:** All validation schemas are defined once using **Zod** in the centralized `src/shared/schemas/` directory (e.g., `documentSchema`, `dispositionFormSchema`, `inboxFilterSchema`).

2. **Client Form:**
* Requires using **React Hook Form** with the `@hookform/resolvers/zod` resolver.
* Form interface components (Input, Select, Checkbox, Textarea) must be wrapped in the Form component from shadcn/ui.

3. **Inbox Data Presentation (TanStack Table + tRPC):**
* The inbox interface integrates **TanStack Table v8** with the tRPC query `inboxRouter.getDocuments`.
* Table parameters (pages, page limit, column sorting, search keywords, archive date range, and document status tab) are validated by `inboxFilterSchema` through the coordination of the `nuqs` library.
* The tRPC procedure returns a standard object: `{ items: Document[], totalCount: number, pageCount: number }`.

4. Data Mutation:
* Each form submission sends Zod-validated data to the associated tRPC mutation (e.g., `trpc.document.create.useMutation()`).
* Use optimistic query invalidation (*optimistic updates*) or directed query invalidation (`utils.inbox.getDocuments.invalidate()`) after a successful mutation to immediately update the status badge count.

### Consequences for AI Agents

* Do not write manual validation rules using long `if-else` blocks inside client component event handlers. Validation must be delegated to the Zod schema via the React Hook Form.
* Do not map raw array responses without pagination information to service script table views; all TanStack Table tables must support server-side pagination parameters.
* All tRPC input schemas must use the `.input(zodSchema)` method. It is forbidden to create tRPC procedures without validating the Zod input schema.