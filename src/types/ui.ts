import React from 'react';

export interface CardProps {
  children?: React.ReactNode;
  className?: string;
}

export interface CardHeaderProps {
  children?: React.ReactNode;
}

export interface CardTitleProps {
  children?: React.ReactNode;
}

export interface CardContentProps {
  children?: React.ReactNode;
}

export interface ButtonProps {
  children?: React.ReactNode;
  variant?: string;
  size?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export interface InputProps {
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export interface SelectItemProps {
  children?: React.ReactNode;
  value?: string;
}
