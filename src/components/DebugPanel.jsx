import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './DebugPanel.module.css';

const DB_NAME = 'debug-panel-db';
const STORE = 'handles';
const KEY = 'saveDir';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getStoredHandle() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const rq = tx.objectStore(STORE).get(KEY);
    rq.onsuccess = () => resolve(rq.result || null);
    rq.onerror = () => reject(rq.error);
  });
}

async function storeHandle(handle) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(handle, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function verifyPermission(handle) {
  if ((await handle.queryPermission({ mode: 'readwrite' })) === 'granted') return true;
  if ((await handle.requestPermission({ mode: 'readwrite' })) === 'granted') return true;
  return false;
}

export default function DebugPanel() {
  const [visible, setVisible] = useState(false);
  const [blob, setBlob] = useState(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [filename, setFilename] = useState('');
  const [folderName, setFolderName] = useState(null);
  const [status, setStatus] = useState('');
  const inputRef = useRef(null);

  const readClipboard = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find(t => t.startsWith('image/'));
        if (imageType) {
          const b = await item.getType(imageType);
          setBlob(b);
          setImgSrc(URL.createObjectURL(b));
          return;
        }
      }
      setStatus('No image found in clipboard.');
    } catch {
      setStatus('Clipboard access denied or empty.');
    }
  }, []);

  const open = useCallback(async () => {
    setVisible(true);
    setStatus('');
    setBlob(null);
    setImgSrc(null);
    setFilename('');
    try {
      const h = await getStoredHandle();
      setFolderName(h ? h.name : null);
    } catch {
      setFolderName(null);
    }
    setTimeout(() => inputRef.current?.focus(), 50);
    // Read clipboard after opening
    setTimeout(async () => {
      try {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find(t => t.startsWith('image/'));
          if (imageType) {
            const b = await item.getType(imageType);
            setBlob(b);
            setImgSrc(URL.createObjectURL(b));
            return;
          }
        }
        setStatus('No image found in clipboard.');
      } catch {
        setStatus('Clipboard access denied or empty.');
      }
    }, 100);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setBlob(null);
    if (imgSrc) URL.revokeObjectURL(imgSrc);
    setImgSrc(null);
    setFilename('');
    setStatus('');
  }, [imgSrc]);

  const pickDirectory = useCallback(async () => {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    await storeHandle(handle);
    setFolderName(handle.name);
    return handle;
  }, []);

  const save = useCallback(async () => {
    if (!blob) return;
    const name = (filename.trim() || 'clipboard-image') + '.png';
    try {
      let dirHandle = await getStoredHandle();
      if (dirHandle) {
        const ok = await verifyPermission(dirHandle);
        if (!ok) dirHandle = null;
      }
      if (!dirHandle) dirHandle = await pickDirectory();
      const fileHandle = await dirHandle.getFileHandle(name, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      setStatus(`Saved to ${dirHandle.name}/${name}`);
      close();
    } catch (err) {
      if (err.name === 'AbortError') return;
      setStatus(`Save failed: ${err.message}`);
    }
  }, [blob, filename, pickDirectory, close]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        open();
      }
      if (e.key === 'Escape' && visible) {
        close();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, close, visible]);

  if (!visible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={close} />
      <div className={styles.modal}>
        <h3>Clipboard Image Preview</h3>
        <div className={styles.preview}>
          {imgSrc ? (
            <img src={imgSrc} alt="Clipboard preview" />
          ) : (
            <p>{status || 'Press Ctrl+Shift+V to read clipboard image…'}</p>
          )}
        </div>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          placeholder="my-screenshot"
          value={filename}
          onChange={e => setFilename(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); save(); } }}
        />
        <div className={styles.actions}>
          <span style={{ fontSize: 11, color: '#888', marginRight: 'auto' }}>
            {folderName ? `Folder: ${folderName}` : ''}
          </span>
          {folderName && (
            <a
              href="#"
              style={{ fontSize: 11, marginRight: 'auto' }}
              onClick={async (e) => { e.preventDefault(); try { await pickDirectory(); } catch {} }}
            >
              Change folder
            </a>
          )}
          <button className={`${styles.btn} ${styles.btnSave}`} onClick={save}>Save PNG</button>
          <button className={`${styles.btn} ${styles.btnClose}`} onClick={close}>Close</button>
        </div>
      </div>
    </div>
  );
}
