import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  UserCog,
  Building2,
  Radio,
  Cable,
  Globe,
  Server,
  Layers,
  Hash,
  MessageSquare,
  Receipt,
  Tag,
  Wallet,
  DollarSign,
  CreditCard,
  FileText,
  Bell,
  Code,
  BarChart3,
  ShieldCheck,
  Shield,
  Settings,
  Search,
  Plus,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Copy,
  Download,
  Upload,
  Filter,
  X,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  LogOut,
  Wifi,
  WifiOff,
  Zap,
  PauseCircle,
  Slash,
  LucideProps,
} from 'lucide-react';
import {
  WorldNetworkIcon,
  SmsRoutingIcon,
  DidNumberIcon,
  ProviderIcon,
  GatewayIcon,
  AgentIcon,
  ClientIcon,
  WalletIcon,
  BillingIcon,
  CdrIcon,
  RoutingIcon,
  NetworkAnalyticsIcon,
  MessagingTrafficIcon,
  TelecomNetworkIcon,
  ApiIntegrationIcon,
  SecurityInfrastructureIcon,
  WorldSmsSymbol,
  IconProps,
} from '../icons';

export type TelecomCustomIconName =
  | 'world-network'
  | 'global-network'
  | 'sms-routing'
  | 'message-routing'
  | 'did'
  | 'did-number'
  | 'number-inventory'
  | 'provider'
  | 'carrier'
  | 'gateway'
  | 'sms-gateway'
  | 'http-gateway'
  | 'smpp'
  | 'carrier-bind'
  | 'agent'
  | 'agent-commission'
  | 'client'
  | 'client-revenue'
  | 'wallet'
  | 'billing'
  | 'provider-cost'
  | 'platform-margin'
  | 'cdr'
  | 'delivery-report'
  | 'routing'
  | 'network-analytics'
  | 'analytics'
  | 'messaging-traffic'
  | 'telecom-network'
  | 'api-integration'
  | 'rest-api'
  | 'security-infrastructure'
  | 'security'
  | 'global-coverage'
  | 'brand-symbol';

export type LucideStandardIconName =
  | 'dashboard'
  | 'LayoutDashboard'
  | 'users'
  | 'Users'
  | 'user-check'
  | 'UserCheck'
  | 'user-cog'
  | 'UserCog'
  | 'building'
  | 'Building2'
  | 'radio'
  | 'Radio'
  | 'cable'
  | 'Cable'
  | 'globe'
  | 'Globe'
  | 'server'
  | 'Server'
  | 'layers'
  | 'Layers'
  | 'hash'
  | 'Hash'
  | 'message-square'
  | 'MessageSquare'
  | 'receipt'
  | 'Receipt'
  | 'tag'
  | 'Tag'
  | 'wallet'
  | 'Wallet'
  | 'dollar-sign'
  | 'DollarSign'
  | 'credit-card'
  | 'CreditCard'
  | 'file-text'
  | 'FileText'
  | 'bell'
  | 'Bell'
  | 'code'
  | 'Code'
  | 'bar-chart'
  | 'BarChart3'
  | 'shield-check'
  | 'ShieldCheck'
  | 'shield'
  | 'Shield'
  | 'settings'
  | 'Settings'
  | 'search'
  | 'Search'
  | 'plus'
  | 'Plus'
  | 'check'
  | 'Check'
  | 'check-circle'
  | 'CheckCircle2'
  | 'alert-circle'
  | 'AlertCircle'
  | 'alert-triangle'
  | 'AlertTriangle'
  | 'info'
  | 'Info'
  | 'clock'
  | 'Clock'
  | 'refresh'
  | 'RefreshCw'
  | 'trending-up'
  | 'TrendingUp'
  | 'trending-down'
  | 'TrendingDown'
  | 'arrow-left'
  | 'ArrowLeft'
  | 'arrow-right'
  | 'ArrowRight'
  | 'chevron-left'
  | 'ChevronLeft'
  | 'chevron-right'
  | 'ChevronRight'
  | 'chevron-down'
  | 'ChevronDown'
  | 'copy'
  | 'Copy'
  | 'download'
  | 'Download'
  | 'upload'
  | 'Upload'
  | 'filter'
  | 'Filter'
  | 'x'
  | 'X'
  | 'trash'
  | 'Trash2'
  | 'edit'
  | 'Edit2'
  | 'eye'
  | 'Eye'
  | 'eye-off'
  | 'EyeOff'
  | 'lock'
  | 'Lock'
  | 'unlock'
  | 'Unlock'
  | 'log-out'
  | 'LogOut'
  | 'wifi'
  | 'Wifi'
  | 'wifi-off'
  | 'WifiOff'
  | 'zap'
  | 'Zap'
  | 'pause-circle'
  | 'PauseCircle'
  | 'slash'
  | 'Slash';

export type AppIconName = TelecomCustomIconName | LucideStandardIconName;

export type AppIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string;

export type AppIconContainerVariant =
  | 'none'
  | 'glass'
  | 'accent'
  | 'kpi'
  | 'nav'
  | 'status'
  | 'emerald'
  | 'blue'
  | 'cyan'
  | 'amber'
  | 'rose'
  | 'violet';

export interface AppIconProps {
  name: AppIconName;
  size?: AppIconSize;
  strokeWidth?: number;
  className?: string;
  containerVariant?: AppIconContainerVariant;
  containerClassName?: string;
  'aria-label'?: string;
  title?: string;
}

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

const resolveSizeNumber = (size?: AppIconSize): number => {
  if (typeof size === 'number') return size;
  if (!size) return 20;
  if (size in SIZE_MAP) return SIZE_MAP[size as keyof typeof SIZE_MAP];
  const parsed = parseInt(size, 10);
  return isNaN(parsed) ? 20 : parsed;
};

// Custom domain icon registry
const CUSTOM_ICONS: Record<TelecomCustomIconName, React.FC<IconProps>> = {
  'world-network': WorldNetworkIcon,
  'global-network': WorldNetworkIcon,
  'sms-routing': SmsRoutingIcon,
  'message-routing': SmsRoutingIcon,
  'did': DidNumberIcon,
  'did-number': DidNumberIcon,
  'number-inventory': DidNumberIcon,
  'provider': ProviderIcon,
  'carrier': ProviderIcon,
  'gateway': GatewayIcon,
  'sms-gateway': GatewayIcon,
  'http-gateway': GatewayIcon,
  'smpp': GatewayIcon,
  'carrier-bind': GatewayIcon,
  'agent': AgentIcon,
  'agent-commission': AgentIcon,
  'client': ClientIcon,
  'client-revenue': ClientIcon,
  'wallet': WalletIcon,
  'billing': BillingIcon,
  'provider-cost': BillingIcon,
  'platform-margin': BillingIcon,
  'cdr': CdrIcon,
  'delivery-report': CdrIcon,
  'routing': RoutingIcon,
  'network-analytics': NetworkAnalyticsIcon,
  'analytics': NetworkAnalyticsIcon,
  'messaging-traffic': MessagingTrafficIcon,
  'telecom-network': TelecomNetworkIcon,
  'api-integration': ApiIntegrationIcon,
  'rest-api': ApiIntegrationIcon,
  'security-infrastructure': SecurityInfrastructureIcon,
  'security': SecurityInfrastructureIcon,
  'global-coverage': WorldNetworkIcon,
  'brand-symbol': WorldSmsSymbol,
};

// Lucide standard icon registry
const LUCIDE_ICONS: Record<string, React.FC<LucideProps>> = {
  dashboard: LayoutDashboard,
  LayoutDashboard: LayoutDashboard,
  users: Users,
  Users: Users,
  'user-check': UserCheck,
  UserCheck: UserCheck,
  'user-cog': UserCog,
  UserCog: UserCog,
  building: Building2,
  Building2: Building2,
  radio: Radio,
  Radio: Radio,
  cable: Cable,
  Cable: Cable,
  globe: Globe,
  Globe: Globe,
  server: Server,
  Server: Server,
  layers: Layers,
  Layers: Layers,
  hash: Hash,
  Hash: Hash,
  'message-square': MessageSquare,
  MessageSquare: MessageSquare,
  receipt: Receipt,
  Receipt: Receipt,
  tag: Tag,
  Tag: Tag,
  wallet: Wallet,
  Wallet: Wallet,
  'dollar-sign': DollarSign,
  DollarSign: DollarSign,
  'credit-card': CreditCard,
  CreditCard: CreditCard,
  'file-text': FileText,
  FileText: FileText,
  bell: Bell,
  Bell: Bell,
  code: Code,
  Code: Code,
  'bar-chart': BarChart3,
  BarChart3: BarChart3,
  'shield-check': ShieldCheck,
  ShieldCheck: ShieldCheck,
  shield: Shield,
  Shield: Shield,
  settings: Settings,
  Settings: Settings,
  search: Search,
  Search: Search,
  plus: Plus,
  Plus: Plus,
  check: Check,
  Check: Check,
  'check-circle': CheckCircle2,
  CheckCircle2: CheckCircle2,
  'alert-circle': AlertCircle,
  AlertCircle: AlertCircle,
  'alert-triangle': AlertTriangle,
  AlertTriangle: AlertTriangle,
  info: Info,
  Info: Info,
  clock: Clock,
  Clock: Clock,
  refresh: RefreshCw,
  RefreshCw: RefreshCw,
  'trending-up': TrendingUp,
  TrendingUp: TrendingUp,
  'trending-down': TrendingDown,
  TrendingDown: TrendingDown,
  'arrow-left': ArrowLeft,
  ArrowLeft: ArrowLeft,
  'arrow-right': ArrowRight,
  ArrowRight: ArrowRight,
  'chevron-left': ChevronLeft,
  ChevronLeft: ChevronLeft,
  'chevron-right': ChevronRight,
  ChevronRight: ChevronRight,
  'chevron-down': ChevronDown,
  ChevronDown: ChevronDown,
  copy: Copy,
  Copy: Copy,
  download: Download,
  Download: Download,
  upload: Upload,
  Upload: Upload,
  filter: Filter,
  Filter: Filter,
  x: X,
  X: X,
  trash: Trash2,
  Trash2: Trash2,
  edit: Edit2,
  Edit2: Edit2,
  eye: Eye,
  Eye: Eye,
  'eye-off': EyeOff,
  EyeOff: EyeOff,
  lock: Lock,
  Lock: Lock,
  unlock: Unlock,
  Unlock: Unlock,
  'log-out': LogOut,
  LogOut: LogOut,
  wifi: Wifi,
  Wifi: Wifi,
  'wifi-off': WifiOff,
  WifiOff: WifiOff,
  zap: Zap,
  Zap: Zap,
  'pause-circle': PauseCircle,
  PauseCircle: PauseCircle,
  slash: Slash,
  Slash: Slash,
};

const CONTAINER_CLASSES: Record<AppIconContainerVariant, string> = {
  none: '',
  glass: 'icon-box-glass',
  accent: 'icon-box-accent',
  kpi: 'icon-box-kpi',
  nav: 'icon-box-nav',
  status: 'icon-box-status',
  emerald: 'icon-box-emerald',
  blue: 'icon-box-blue',
  cyan: 'icon-box-cyan',
  amber: 'icon-box-amber',
  rose: 'icon-box-rose',
  violet: 'icon-box-violet',
};

/**
 * WORLD SMS SERVICE Unified Icon Component
 * Seamlessly resolves custom telecom SVG icons and standardized Lucide outline icons.
 */
export const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 'md',
  strokeWidth = 1.75,
  className = '',
  containerVariant = 'none',
  containerClassName = '',
  'aria-label': ariaLabel,
  title,
}) => {
  const pixelSize = resolveSizeNumber(size);
  const accessibleTitle = title || ariaLabel;
  const isDecorative = !accessibleTitle;

  // 1. Check custom telecom domain registry
  if (name in CUSTOM_ICONS) {
    const CustomComponent = CUSTOM_ICONS[name as TelecomCustomIconName];
    const iconElement = (
      <CustomComponent
        size={pixelSize}
        strokeWidth={strokeWidth}
        className={className}
        title={accessibleTitle}
        aria-hidden={isDecorative}
      />
    );

    if (containerVariant === 'none') {
      return iconElement;
    }

    return (
      <div
        className={`${CONTAINER_CLASSES[containerVariant]} ${containerClassName}`}
        role={isDecorative ? undefined : 'img'}
        aria-label={ariaLabel}
      >
        {iconElement}
      </div>
    );
  }

  // 2. Check standard Lucide registry
  const LucideComponent = LUCIDE_ICONS[name] || Layers;
  const iconElement = (
    <LucideComponent
      size={pixelSize}
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden={isDecorative}
    />
  );

  if (containerVariant === 'none') {
    return iconElement;
  }

  return (
    <div
      className={`${CONTAINER_CLASSES[containerVariant]} ${containerClassName}`}
      role={isDecorative ? undefined : 'img'}
      aria-label={ariaLabel}
    >
      {iconElement}
    </div>
  );
};
