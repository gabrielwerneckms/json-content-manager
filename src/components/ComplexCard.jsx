import { useState } from 'react';
import styles from './ComplexCard.module.css';
import PrimitiveCard from './PrimitiveCard';

export default function ComplexCard({
  keyName,
  data,
  jcmMeta,
  isArray,
  depth = 0,
  style,
  className,
}) {
  const items = isArray ? data : null;
  const childKeys = isArray
    ? null
    : Object.keys(data).filter(k => k !== '__meta');

  // For arrays, determine active tab index
  const [activeIndex, setActiveIndex] = useState(
    isArray ? getDefaultActiveIndex(data, jcmMeta) : 0
  );

  // Count for label
  const count = isArray ? data.length : Object.keys(data).filter(k => k !== '__meta').length;
  const label = isArray ? `${keyName}[${count}]` : `${keyName}{${count}}`;

  // Get tab titles for arrays
  const tabTitles = isArray ? getTabTitles(data) : null;

  // Determine the active item's data for rendering
  const activeData = isArray ? data[activeIndex] : data;
  const activeJcm = isArray
    ? jcmMeta?.[String(activeIndex)]
    : jcmMeta;

  // Build the inner grid from the active item's jcm-data
  const meta = activeJcm?.__meta;
  const containerSize = meta?.containerSize;
  const childPositions = meta?.childPositions;

  // Determine background
  const isTopLevel = depth === 0;
  const bgClass = isTopLevel
    ? styles.containerWhiteBg
    : styles.containerNested;

  const gridStyle = containerSize
    ? {
        gridTemplateColumns: `repeat(${containerSize.w}, 90px)`,
        gridTemplateRows: `repeat(${containerSize.h}, 45px)`,
      }
    : {};

  return (
    <div
      className={`${styles.container} ${bgClass} ${className || ''}`}
      style={style}
    >
      {/* Header */}
      <div className={styles.header}>
        {isArray ? (
          <span className={styles.arrLabel}>{label}</span>
        ) : (
          <span className={styles.objLabel}>{label}</span>
        )}
        {isArray && tabTitles && (
          <div className={styles.tabs}>
            {tabTitles.map((title, i) => (
              <span
                key={i}
                className={`${styles.tab} ${i === activeIndex ? styles.tabActive : ''}`}
                onClick={() => setActiveIndex(i)}
              >
                {title}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Inner grid of children */}
      {childPositions && (
        <div className={styles.innerGrid} style={gridStyle}>
          {Object.entries(childPositions).map(([childKey, pos]) => {
            const childData = activeData[childKey];
            const childJcm = activeJcm?.[childKey];

            if (childData === undefined) return null;

            const gridPlacement = {
              gridColumn: `${pos.pos.col + 1} / ${pos.pos.col + 1 + pos.size.w}`,
              gridRow: `${pos.pos.row + 1} / ${pos.pos.row + 1 + pos.size.h}`,
            };

            // Determine if child is primitive or complex
            if (isPrimitive(childData)) {
              return (
                <PrimitiveCard
                  key={childKey}
                  keyName={childKey}
                  value={childData}
                  style={gridPlacement}
                />
              );
            }

            // Arrays of primitives
            const childIsArray = Array.isArray(childData);
            if (childIsArray && childData.length > 0 && childData.every(v => isPrimitive(v))) {
              return (
                <PrimitiveCard
                  key={childKey}
                  keyName={childKey.length > 12 ? childKey.slice(0, 10) + '...' : childKey}
                  value={childData[0]}
                  isCode={typeof childData[0] === 'string' && childData[0].startsWith('<')}
                  style={gridPlacement}
                />
              );
            }

            return (
              <ComplexCard
                key={childKey}
                keyName={childKey}
                data={childData}
                jcmMeta={childJcm}
                isArray={childIsArray}
                depth={depth + 1}
                style={gridPlacement}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function isPrimitive(value) {
  if (value === null || value === undefined) return true;
  const t = typeof value;
  return t === 'string' || t === 'number' || t === 'boolean';
}

function getDefaultActiveIndex(arr, jcmMeta) {
  // Use the first item with a __meta that has childZoom, or default to 0
  // Actually, let's just pick index 1 if available for games (MCL), else 0
  // For now, default to 0
  return 0;
}

function getTabTitles(arr) {
  return arr.map((item, i) => {
    if (typeof item === 'object' && item !== null) {
      // Use 'title' field if available
      if (item.title && typeof item.title === 'string') {
        return item.title;
      }
    }
    return String(i);
  });
}
