import React from 'react';
import {
  RoomStatus,
  ReservationStatus,
  HousekeepingStatus,
  VerificationStatus,
  Priority,
} from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'blue' | 'purple' | 'rose' | 'slate' | 'teal';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  className = '',
  size = 'md',
}) => {
  const variantStyles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
  }[variant];

  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border ${variantStyles} ${sizeStyles} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          variant === 'emerald'
            ? 'bg-emerald-500'
            : variant === 'amber'
            ? 'bg-amber-500'
            : variant === 'blue'
            ? 'bg-blue-500'
            : variant === 'purple'
            ? 'bg-purple-500'
            : variant === 'rose'
            ? 'bg-rose-500'
            : variant === 'teal'
            ? 'bg-teal-500'
            : 'bg-slate-400'
        }`}
      />
      {children}
    </span>
  );
};

export const RoomStatusBadge: React.FC<{ status: RoomStatus }> = ({ status }) => {
  switch (status) {
    case 'Available':
      return <Badge variant="emerald">Available</Badge>;
    case 'Occupied':
      return <Badge variant="blue">Occupied</Badge>;
    case 'Reserved':
      return <Badge variant="amber">Reserved</Badge>;
    case 'Cleaning':
      return <Badge variant="purple">Cleaning</Badge>;
    case 'Maintenance':
      return <Badge variant="rose">Maintenance</Badge>;
    case 'Out of Service':
      return <Badge variant="slate">Out of Service</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export const ReservationStatusBadge: React.FC<{ status: ReservationStatus }> = ({ status }) => {
  switch (status) {
    case 'Confirmed':
      return <Badge variant="teal">Confirmed</Badge>;
    case 'Checked In':
      return <Badge variant="blue">Checked In</Badge>;
    case 'Checked Out':
      return <Badge variant="slate">Checked Out</Badge>;
    case 'Pending':
      return <Badge variant="amber">Pending</Badge>;
    case 'Cancelled':
      return <Badge variant="rose">Cancelled</Badge>;
    case 'No Show':
      return <Badge variant="rose">No Show</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export const HousekeepingBadge: React.FC<{ status: HousekeepingStatus }> = ({ status }) => {
  switch (status) {
    case 'Clean':
      return <Badge variant="emerald">Clean</Badge>;
    case 'Inspected':
      return <Badge variant="teal">Inspected</Badge>;
    case 'Dirty':
      return <Badge variant="rose">Dirty</Badge>;
    case 'Cleaning in Progress':
      return <Badge variant="purple">Cleaning</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export const VerificationBadge: React.FC<{ status: VerificationStatus }> = ({ status }) => {
  switch (status) {
    case 'Verified':
      return <Badge variant="emerald">ID Verified</Badge>;
    case 'Pending':
      return <Badge variant="amber">ID Pending</Badge>;
    case 'Rejected':
      return <Badge variant="rose">ID Rejected</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
  switch (priority) {
    case 'Urgent':
      return <Badge variant="rose">Urgent</Badge>;
    case 'High':
      return <Badge variant="amber">High</Badge>;
    case 'Medium':
      return <Badge variant="blue">Medium</Badge>;
    case 'Low':
      return <Badge variant="slate">Low</Badge>;
    default:
      return <Badge>{priority}</Badge>;
  }
};
