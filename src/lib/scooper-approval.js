/**
 * Vetting state of a scooper (Employee) as shown to admins. Mirrors
 * isApprovedScooper() in job-claims: only "approved" scoopers can claim jobs.
 *   pending  - signed up, status ACTIVE, not yet approved
 *   approved - status ACTIVE and approvedAt set
 *   inactive - rejected, deactivated or suspended (status is not ACTIVE)
 */
export function scooperApprovalState(employee) {
    if (!employee || employee.status !== 'ACTIVE') return 'inactive';
    return employee.approvedAt ? 'approved' : 'pending';
}
