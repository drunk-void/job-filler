import { createRoot } from 'react-dom/client';
import '../assets/index.css';
import Options from './Options';

const root = createRoot(document.getElementById('root')!);
root.render(<Options />);
