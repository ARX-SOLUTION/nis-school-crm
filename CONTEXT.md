# NIS School CRM Domain

Shared business language for the school CRM.

## Authorization

**Permission**:
A code-defined business capability that may be granted through a Role.
_Avoid_: Access flag, privilege

**Role**:
An administrator-managed named collection of Permissions. A User may hold multiple Roles, and receives the union of their Permissions.
_Avoid_: User type, rank

**Effective Permissions**:
The Permissions a User receives from all assigned Roles within the applicable Permission Scope. Missing Permission always means access is denied.
_Avoid_: Role level

**Permission Scope**:
A predefined data boundary attached to a Permission grant: all records, records in assigned branches, or records owned by the User.
_Avoid_: Custom filter, access query

**System Role**:
A Role supplied by the system for a standard responsibility. `SUPER_ADMIN` is the immutable recovery authority and cannot lose unrestricted access.
_Avoid_: Hard-coded role

**Custom Role**:
A Role created by a Super Admin from the code-defined Permission catalog.
_Avoid_: Custom permission

**Role Assignment**:
The association that grants a User a Role globally or within a specific branch. A User may hold different Roles in different branches.
_Avoid_: User role

## Billing

**Invoice**:
A Student’s financial obligation for one or more school services, issued with a due date and owned by one branch.
_Avoid_: Charge, bill

**Invoice Line**:
One priced component of an Invoice, such as tuition, a club, a service, a discount, or an adjustment.
_Avoid_: Charge

**Payment**:
Money received for a Student through a manual or external payment channel.
_Avoid_: Invoice, gateway transaction

**Payment Allocation**:
The portion of a Payment applied to a specific Invoice.
_Avoid_: Payment link

**Student Credit**:
The unapplied portion of a Student’s Payments, available for future Invoice allocation or refund.
_Avoid_: Negative debt, overpayment

**Refund**:
Money returned from a previously received Payment while preserving the original financial history.
_Avoid_: Payment deletion

**Reversal**:
A compensating financial entry that cancels an erroneous entry without erasing it.
_Avoid_: Edit, delete

**Reconciliation**:
The process of matching external provider or bank transactions with internal Payments and identifying discrepancies.
_Avoid_: Balance calculation
