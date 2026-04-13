import { useState, useEffect } from 'react';
import styles from './CommitPill.module.css';

export default function CommitPill() {
  const [version, setVersion] = useState('?');

  useEffect(() => {
    fetch('/current-version.txt')
      .then(r => r.text())
      .then(t => setVersion(t.trim()))
      .catch(() => setVersion('?'));
  }, []);

  return <div className={styles.commitPill}>{version}</div>;
}
