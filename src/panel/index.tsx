import { createRoot } from 'react-dom/client';
import '../assets/index.css';
import Panel from './Panel';

const root = createRoot(document.getElementById('root')!);
root.render(<Panel />);
