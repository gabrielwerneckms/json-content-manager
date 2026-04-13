import styles from './Board.module.css';
import PrimitiveCard from './PrimitiveCard';
import ComplexCard from './ComplexCard';

export default function Board({ data, jcmData }) {
  const rootMeta = jcmData.__meta;
  const childPositions = rootMeta.childPositions;
  const containerSize = rootMeta.containerSize;

  const gridStyle = {
    gridTemplateColumns: `repeat(${containerSize.w}, 90px)`,
    gridTemplateRows: `repeat(${containerSize.h}, 45px)`,
  };

  return (
    <div className={styles.board} style={gridStyle}>
      {Object.entries(childPositions).map(([key, pos]) => {
        const value = data[key];
        const childJcm = jcmData[key];

        if (value === undefined) return null;

        const gridPlacement = {
          gridColumn: `${pos.pos.col + 1} / ${pos.pos.col + 1 + pos.size.w}`,
          gridRow: `${pos.pos.row + 1} / ${pos.pos.row + 1 + pos.size.h}`,
        };

        if (isPrimitive(value)) {
          return (
            <PrimitiveCard
              key={key}
              keyName={key}
              value={value}
              style={gridPlacement}
            />
          );
        }

        const isArray = Array.isArray(value);

        // Arrays of primitives (e.g. platformTables is string[])
        if (isArray && value.length > 0 && value.every(v => isPrimitive(v))) {
          return (
            <PrimitiveCard
              key={key}
              keyName={truncateLabel(key)}
              value={value[0]}
              isCode={typeof value[0] === 'string' && value[0].startsWith('<')}
              style={gridPlacement}
            />
          );
        }

        return (
          <ComplexCard
            key={key}
            keyName={key}
            data={value}
            jcmMeta={childJcm}
            isArray={isArray}
            depth={0}
            style={gridPlacement}
          />
        );
      })}
    </div>
  );
}

function isPrimitive(value) {
  if (value === null || value === undefined) return true;
  const t = typeof value;
  return t === 'string' || t === 'number' || t === 'boolean';
}

function truncateLabel(key) {
  if (key.length > 12) return key.slice(0, 10) + '...';
  return key;
}
