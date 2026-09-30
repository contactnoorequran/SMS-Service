import React from 'react';

export interface SvgIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
  className?: string;
  title?: string;
}

/**
 * 1. SMS Routing / Message Routing Icon
 * Communicates SMS packet forwarding through gateway route with ingress/egress nodes.
 */
export const SmsRoutingIcon: React.FC<SvgIconProps> = ({
  size = 24,
  strokeWidth = 1.75,
  className = '',
  title,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={title ? 'img' : undefined}
    aria-hidden={!title}
    {...props}
  >
    {title && <title>{title}</title>}
    {/* Message container */}
    <path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H8l-5 4V5Z" />
    {/* Ingress packet path & forward router chevron */}
    <path d="m8 9 3 2.5-3 2.5" />
    <path d="M11 11.5h4.5" />
    <circle cx="16.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

/**
 * 2. SMS Gateway / HTTP Gateway Server
 * Depicts telecom server unit with packet burst conduits and bidirectional throughput.
 */
export const SmsGatewayIcon: React.FC<SvgIconProps> = ({
  size = 24,
  strokeWidth = 1.75,
  className = '',
  title,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={title ? 'img' : undefined}
    aria-hidden={!title}
    {...props}
  >
    {title && <title>{title}</title>}
    {/* Top rack module */}
    <rect width="20" height="7" x="2" y="3" rx="2" />
    {/* Bottom rack module */}
    <rect width="20" height="7" x="2" y="14" rx="2" />
    {/* Status LEDs */}
    <circle cx="6" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="6" cy="17.5" r="0.75" fill="currentColor" stroke="none" />
    {/* Carrier packet throughput vectors */}
    <path d="M11 6.5h4.5m0 0-1.5-1.5m1.5 1.5-1.5 1.5" />
    <path d="M15 17.5H10.5m0 0 1.5-1.5m-1.5 1.5 1.5 1.5" />
  </svg>
);

/**
 * 3. SMPP / Carrier Protocol Bind Icon
 * Short Message Peer-to-Peer duplex session between client ESME and SMSC.
 */
export const SmppIcon: React.FC<SvgIconProps> = ({
  size = 24,
  strokeWidth = 1.75,
  className = '',
  title,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={title ? 'img' : undefined}
    aria-hidden={!title}
    {...props}
  >
    {title && <title>{title}</title>}
    {/* ESME entity */}
    <rect x="2" y="4" width="6.5" height="16" rx="1.5" />
    {/* SMSC entity */}
    <rect x="15.5" y="4" width="6.5" height="16" rx="1.5" />
    {/* Duplex PDU packet streams */}
    <path d="M8.5 9h7m0 0-2-2m2 2-2 2" />
    <path d="M15.5 15h-7m0 0 2-2m-2 2 2 2" />
    {/* Channel pin nodes */}
    <circle cx="5.25" cy="8" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="5.25" cy="16" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="18.75" cy="8" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="18.75" cy="16" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);

/**
 * 4. Number Inventory / DID Phone Prefix Icon
 * Telephony direct-inward dialing number block with telephone matrix and active allocation node.
 */
export const NumberInventoryIcon: React.FC<SvgIconProps> = ({
  size = 24,
  strokeWidth = 1.75,
  className = '',
  title,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={title ? 'img' : undefined}
    aria-hidden={!title}
    {...props}
  >
    {title && <title>{title}</title>}
    {/* DID Telephone card frame */}
    <rect x="3.5" y="2.5" width="17" height="19" rx="3" />
    {/* Dial matrix pins */}
    <circle cx="8" cy="7" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="7" r="1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="7" r="1" fill="currentColor" stroke="none" />
    <circle cx="8" cy="11.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="11.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="16" cy="11.5" r="1" fill="currentColor" stroke="none" />
    {/* E.164 allocation status bar */}
    <path d="M7.5 16.5h9" />
  </svg>
);

/**
 * 5. Telecom Network / Carrier Tower Icon
 * Telecom transmission tower with radiated signal waves and carrier baseline.
 */
export const TelecomNetworkIcon: React.FC<SvgIconProps> = ({
  size = 24,
  strokeWidth = 1.75,
  className = '',
  title,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={title ? 'img' : undefined}
    aria-hidden={!title}
    {...props}
  >
    {title && <title>{title}</title>}
    {/* Base and tower legs */}
    <path d="M4 21h16" />
    <path d="m8 21 4-13 4 13" />
    <path d="M9.5 16h5" />
    <path d="M10.8 12h2.4" />
    {/* Mast beacon */}
    <path d="M12 8V4" />
    <circle cx="12" cy="3.5" r="1" fill="currentColor" stroke="none" />
    {/* Radiated carrier arcs */}
    <path d="M8 5a5 5 0 0 1 8 0" />
    <path d="M5.5 3a8.5 8.5 0 0 1 13 0" />
  </svg>
);

/**
 * 6. CDR / Delivery Report Icon
 * Call Detail Record with packet timestamp lines and cryptographic verification check.
 */
export const CdrReportIcon: React.FC<SvgIconProps> = ({
  size = 24,
  strokeWidth = 1.75,
  className = '',
  title,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={title ? 'img' : undefined}
    aria-hidden={!title}
    {...props}
  >
    {title && <title>{title}</title>}
    {/* Document page */}
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" />
    <path d="M14 2v6h6" />
    {/* CDR log records */}
    <path d="M8 12h4.5" />
    <path d="M8 16h3" />
    {/* Verification seal check */}
    <path d="m14 15.5 2 2 4.5-4.5" />
  </svg>
);

/**
 * 7. Provider Wholesale Cost Icon
 * Telecom carrier charges / wholesale debit ledger decrement.
 */
export const ProviderCostIcon: React.FC<SvgIconProps> = ({
  size = 24,
  strokeWidth = 1.75,
  className = '',
  title,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={title ? 'img' : undefined}
    aria-hidden={!title}
    {...props}
  >
    {title && <title>{title}</title>}
    {/* Stacked ledger frame */}
    <rect x="2.5" y="3.5" width="19" height="17" rx="2.5" />
    <path d="M2.5 8.5h19" />
    <path d="M6 13h4" />
    <path d="M6 16.5h3" />
    {/* Outgoing cost / carrier decrement flow */}
    <path d="M18 14.5h-5m0 0 1.75-1.75M13 14.5l1.75 1.75" />
  </svg>
);

/**
 * 8. Client Gross Revenue Icon
 * Customer inbound traffic billing and upward accumulation curve.
 */
export const ClientRevenueIcon: React.FC<SvgIconProps> = ({
  size = 24,
  strokeWidth = 1.75,
  className = '',
  title,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={title ? 'img' : undefined}
    aria-hidden={!title}
    {...props}
  >
    {title && <title>{title}</title>}
    <path d="M3 20h18" />
    <path d="m4.5 15.5 4.5-5 4 4 6.5-7.5" />
    <path d="M15 7h4.5v4.5" />
    <circle cx="9" cy="10.5" r="1" fill="currentColor" stroke="none" />
    <circle cx="13" cy="14.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

/**
 * 9. Agent Commission Icon
 * Partner revenue share / agent split percentage node.
 */
export const AgentCommissionIcon: React.FC<SvgIconProps> = ({
  size = 24,
  strokeWidth = 1.75,
  className = '',
  title,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={title ? 'img' : undefined}
    aria-hidden={!title}
    {...props}
  >
    {title && <title>{title}</title>}
    {/* Agent profile silhouette */}
    <path d="M15 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 3 18.5V20" />
    <circle cx="9" cy="7.5" r="3.5" />
    {/* Partner commission badge */}
    <circle cx="17.5" cy="8.5" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="20.5" cy="11.5" r="0.75" fill="currentColor" stroke="none" />
    <path d="m17 12 4-4" />
  </svg>
);

/**
 * 10. Platform Profit Margin Icon
 * Net profit clearing / margin differential balance.
 */
export const PlatformMarginIcon: React.FC<SvgIconProps> = ({
  size = 24,
  strokeWidth = 1.75,
  className = '',
  title,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={title ? 'img' : undefined}
    aria-hidden={!title}
    {...props}
  >
    {title && <title>{title}</title>}
    {/* Ledger coin coin perimeter */}
    <circle cx="12" cy="12" r="9" />
    {/* Currency symbol */}
    <path d="M14.5 9h-3.5a1.5 1.5 0 0 0 0 3h2a1.5 1.5 0 0 1 0 3H9.5" />
    <path d="M12 7.5v9" />
    {/* Positive margin trend tick */}
    <path d="m16.5 4.5 3-3" />
    <path d="M19.5 4.5V1.5h-3" />
  </svg>
);

/**
 * 11. Global Coverage Icon
 * Crisp vector globe with coordinate longitude/latitude grid and high-speed carrier transit point.
 * Clean, modern vector replacement for emoji flag fallback.
 */
export const GlobalCoverageIcon: React.FC<SvgIconProps> = ({
  size = 24,
  strokeWidth = 1.75,
  className = '',
  title,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    role={title ? 'img' : undefined}
    aria-hidden={!title}
    {...props}
  >
    {title && <title>{title}</title>}
    <circle cx="12" cy="12" r="9.5" />
    <path d="M2.5 12h19" />
    <path d="M12 2.5a14 14 0 0 0 0 19" />
    <path d="M12 2.5a14 14 0 0 1 0 19" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);
