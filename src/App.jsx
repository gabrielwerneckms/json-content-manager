import './global.css';
import CommitPill from './components/CommitPill';
import Board from './components/Board';
import DebugPanel from './components/DebugPanel';
import jsonData from '../index.json';

export default function App() {
  // Separate jcm-data from the display data
  const { 'jcm-data': jcmData, ...displayData } = jsonData;

  return (
    <>
      <CommitPill />
      <Board data={displayData} jcmData={jcmData} />
      <DebugPanel />
    </>
  );
}
