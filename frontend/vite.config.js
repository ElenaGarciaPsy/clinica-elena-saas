import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', 
    allowedHosts: [
      // 1. El comodín general (que debería funcionar)
      '*', 
      // 2. El comodín de ngrok (más específico)
      '*.ngrok-free.dev', 
      // 3. LA DIRECCIÓN EXACTA QUE TE DIO EL ERROR (Cópiala de tu móvil)
      'preobedient-archeologically-haylee.ngrok-free.dev' 
    ]
  }
})