import { createRoot } from 'react-dom/client'
import App from './app'

const root = createRoot(document.getElementById('root')!)

root.render(<App />)

console.log('Brought to you by Monumei')
