import { useState } from 'react';
import styles from './PrimitiveCard.module.css';

export default function PrimitiveCard({ keyName, value, style, className, isCode: forceCode }) {
  const isBoolean = typeof value === 'boolean';
  const isCode = forceCode || (typeof value === 'string' && value.startsWith('<'));
  const isEmpty = value === '' || value === null || value === undefined;
  const isDimmed = isEmpty && !isBoolean;

  return (
    <div className={`${styles.card} ${className || ''}`} style={style}>
      <div className={`${styles.label} ${isDimmed ? styles.labelDimmed : ''}`}>
        {keyName}
      </div>
      <div className={`${styles.value} ${isCode ? styles.codeText : ''}`}>
        {isBoolean ? (
          <BooleanToggle value={value} />
        ) : (
          String(value ?? '')
        )}
      </div>
    </div>
  );
}

function BooleanToggle({ value }) {
  return (
    <div className={`${styles.toggle} ${value ? styles.toggleOn : ''}`}>
      <div className={styles.toggleKnob} />
    </div>
  );
}
