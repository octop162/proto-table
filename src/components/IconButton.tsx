import React from 'react';
import { IconType, getIconPath } from '../types/icons';
import styles from './IconButton.module.css';

type IconButtonProps = {
  iconType: IconType;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
  label?: string;
};

/**
 * アイコンボタンコンポーネント
 */
export const IconButton: React.FC<IconButtonProps> = ({
  iconType,
  onClick,
  disabled = false,
  title = '',
  label
}) => {
  return (
    <button
      className={styles.iconButton}
      onClick={onClick}
      disabled={disabled}
      title={title}
      type="button"
    >
      <img
        src={getIconPath(iconType)}
        alt={title}
        className={styles.icon}
      />
      {label && <span className={styles.label}>{label}</span>}
    </button>
  );
}; 