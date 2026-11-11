/**
 * RoleGate — replaces every dead end in the app with a one-click identity switch.
 *
 * The consortium enforces its access matrix inside the chaincode (`requireOrg`),
 * so a page opened by the "wrong" organisation genuinely has nothing to offer.
 * Saying so in one flat sentence ("Switch to a funder identity…") leaves the
 * user stranded: they have to find the identity picker in the header themselves.
 *
 * RoleGate closes that loop. It names the organisations the contract accepts,
 * lists the concrete people who hold those roles, and hands the user a
 * one-click "Act as …" button for each of them — so the page re-renders with
 * the new capabilities the instant the switch happens.
 */

import React from 'react';
import { useStore } from '../core/store';
import { type OrgId } from '../core/types';

export interface RoleGateProps {
  /** What the user was trying to do, e.g. "Endorsing a planting proof". */
  action: string;
  /** Which orgs may perform it. */
  allows: OrgId[];
  /** Optional extra explanation of WHY the contract restricts it. */
  reason?: string;
  children?: React.ReactNode;
  /**
   * Render the gate even when the current identity already qualifies.
   * Used for explanatory panels that double as documentation.
   */
  force?: boolean;
}

/**
 * The gate renders nothing at all when the current identity is already
 * allowed to act — callers can therefore mount it unconditionally.
 */
export default function RoleGate({ action, allows, reason, children, force }: RoleGateProps) {
  const { participants, current, switchTo } = useStore();

  const qualifies = current ? allows.includes(current.org) : false;
  if (qualifies && !force) return null;

  const eligible = participants.filter((p) => allows.includes(p.org));

  return (
    <div className="gate">
      <div className="gate__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
          <path d="M8 10.5V7.6a4 4 0 0 1 8 0v2.9" />
          <circle cx="12" cy="15.8" r="1.3" fill="currentColor" stroke="none" />
        </svg>
      </div>

      <div className="gate__title">{action} needs a different identity</div>

      <div className="gate__detail">
        {reason}
        {current ? (
          <>
            {' '}
            You are acting as <strong>{current.orgName}</strong> — switch to one of these identities to
            continue.
          </>
        ) : (
          ' — switch to one of these identities to continue.'
        )}
      </div>

      {eligible.length > 0 ? (
        <div className="gate__roles">
          {eligible.map((p) => (
            <div className="gate__row" key={p.id}>
              <span className={`avatar avatar--${p.org.toLowerCase()}`}>{p.name[0]}</span>
              <span className="gate__name">{p.name}</span>
              <span className="gate__role">
                {p.orgName}
                {p.role && p.role !== p.orgName ? ` · ${p.role}` : ''}
              </span>
              <button
                type="button"
                className="btn btn--soft btn--sm gate__cta gate__switch"
                onClick={() => switchTo(p.id)}
              >
                Act as {p.name}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="gate__detail">
          No identity in this consortium currently holds that permission — ask the channel operator to
          enrol one.
        </div>
      )}

      {children}
    </div>
  );
}
