import { useEffect, useState } from 'react'
import { jsPDF } from "jspdf"
import { 
  LayoutDashboard, Users, Calendar as CalendarIcon, CreditCard, 
  TrendingUp, Clock, LogOut, CalendarDays, FileText, Trash2, Lock,
  Upload, Paperclip, Eye
} from 'lucide-react'

// --- CÓDIGO INTELIGENTE PARA URLs (SOLUCIÓN DEFINITIVA) ---
// Si estamos en localhost, usa la IP local de Django.
// Si estamos en un dominio público (ngrok), usa ese mismo dominio como base.
const API_BASE_URL = 'https://psyclinic.onrender.com'
// ********************************************

function App() {
  // --- SEGURIDAD ---
  const [token, setToken] = useState(localStorage.getItem('clinica_token'))
  
  // --- ESTADOS ---
  const [activeTab, setActiveTab] = useState('dashboard')
  const [patients, setPatients] = useState([])
  const [appointments, setAppointments] = useState([]) 
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientFiles, setPatientFiles] = useState([]) 
  
  // --- FORMULARIOS ---
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  const [formData, setFormData] = useState({ first_name: '', last_name: '', phone: '' })
  const [appointmentDate, setAppointmentDate] = useState('') 
  const [clinicalNotes, setClinicalNotes] = useState('')

  useEffect(() => {
    if (token) {
      fetchPatients()
      fetchAppointments()
    }
  }, [token])

  // --- FUNCIONES SEGURIDAD ---
  const handleLogin = (e) => {
    e.preventDefault()
    fetch(API_BASE_URL + '/api-token-auth/', { // URL DINÁMICA
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData)
    })
    .then(res => {
      if (!res.ok) throw new Error("Usuario o contraseña incorrectos")
      return res.json()
    })
    .then(data => {
      localStorage.setItem('clinica_token', data.token)
      setToken(data.token)
    })
    .catch(err => alert(err.message))
  }

  const handleLogout = () => {
    localStorage.removeItem('clinica_token')
    setToken(null)
    setLoginData({ username: '', password: '' })
  }

  // --- CABECERA ESTÁNDAR ---
  const authHeader = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Token ${token}`
  })

  // --- API CALLS (LECTURA) ---
  const fetchPatients = () => fetch(API_BASE_URL + '/api/patients/', { headers: authHeader() }).then(r => r.json()).then(setPatients)
  const fetchAppointments = () => fetch(API_BASE_URL + '/api/appointments/', { headers: authHeader() }).then(r => r.json()).then(setAppointments)
  
  const fetchPatientFiles = (patientId) => {
    fetch(API_BASE_URL + `/api/files/?patient=${patientId}`, { headers: authHeader() })
      .then(res => res.json())
      .then(data => setPatientFiles(data))
  }

  // --- ACCIONES (ESCRITURA CON LLAVE) ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const data = new FormData()
    data.append('file', file)
    data.append('patient', selectedPatient.id)
    data.append('name', file.name)

    fetch(API_BASE_URL + '/api/files/', { 
      method: 'POST', 
      headers: { 'Authorization': `Token ${token}` },
      body: data 
    })
    .then(res => {
      if(res.ok) { alert("¡Archivo subido correctamente!"); fetchPatientFiles(selectedPatient.id) }
      else { alert("Error al subir archivo. Asegúrate de que el archivo existe y no sea demasiado grande.") }
    })
  }

  const handleCreatePatient = (e) => {
    e.preventDefault()
    fetch(API_BASE_URL + '/api/patients/', { 
      method: 'POST', headers: authHeader(),
      body: JSON.stringify({ ...formData, therapist: 1 })
    }).then(res => { if(res.ok) { fetchPatients(); setFormData({ first_name: '', last_name: '', phone: '' }) } })
  }

  const handleCreateAppointment = (e) => {
    e.preventDefault()
    const newStart = new Date(appointmentDate)
    const newEnd = new Date(newStart.getTime() + 60 * 60 * 1000) 
    const conflict = appointments.find(app => {
      const existingStart = new Date(app.start_time); const existingEnd = new Date(app.end_time)
      return newStart < existingEnd && newEnd > existingStart
    })
    if (conflict) { alert("⚠️ Conflicto de horario: Ya tienes una cita a esa hora."); return }

    fetch(API_BASE_URL + '/api/appointments/', { 
      method: 'POST', headers: authHeader(),
      body: JSON.stringify({ patient: selectedPatient.id, therapist: 1, start_time: newStart.toISOString(), end_time: newEnd.toISOString(), status: 'CONFIRMED' })
    }).then(res => { if(res.ok) { alert("¡Cita agendada!"); fetchAppointments(); setAppointmentDate('') } })
  }

  const handleSaveNotes = () => {
    fetch(API_BASE_URL + `/api/patients/${selectedPatient.id}/`, { 
      method: 'PATCH', headers: authHeader(),
      body: JSON.stringify({ notes: clinicalNotes })
    }).then(res => { if(res.ok) { alert("¡Notas guardadas!"); fetchPatients() } else { alert("Error al guardar notas.") } })
  }

  const handleDeletePatient = (e, id) => {
    e.stopPropagation() 
    if (window.confirm("¿Borrar paciente y sus citas?")) {
      fetch(API_BASE_URL + `/api/patients/${id}/`, { method: 'DELETE', headers: authHeader() })
      .then(res => { if (res.ok) { fetchPatients(); fetchAppointments(); if (selectedPatient?.id === id) setSelectedPatient(null) } })
    }
  }

  const handleDeleteAppointment = (id) => {
    if (window.confirm("¿Eliminar cita?")) {
      fetch(API_BASE_URL + `/api/appointments/${id}/`, { method: 'DELETE', headers: authHeader() })
      .then(res => { if (res.ok) fetchAppointments() })
    }
  }
  // --- RESTO DE FUNCIONES (IGUAL QUE ANTES) ---

  const handleOpenPatient = (patient) => {
    setClinicalNotes(patient.notes || '')
    setAppointmentDate('')
    setSelectedPatient(patient)
    fetchPatientFiles(patient.id) 
  }

  const generateInvoice = (appointment, patient) => {
    if (!patient) return;
    const doc = new jsPDF()
    doc.setTextColor(40, 40, 40); doc.setFontSize(20); doc.text("CLÍNICA ELENA", 20, 20)
    doc.setFontSize(10); doc.text("Psicología y Bienestar", 20, 30); doc.text("NIF: 12345678Z", 20, 35)
    doc.setFontSize(16); doc.text("FACTURA", 150, 20)
    doc.setFontSize(10); doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 35)
    doc.setDrawColor(200, 200, 200); doc.line(20, 55, 190, 55)
    doc.setFontSize(12); doc.text(`Paciente: ${patient.first_name} ${patient.last_name}`, 20, 70)
    doc.setFillColor(245, 247, 250); doc.rect(20, 90, 170, 10, 'F')
    doc.text(`Sesión de Psicoterapia - ${new Date(appointment.start_time).toLocaleDateString()}`, 25, 110); doc.text("60,00 €", 160, 110)
    doc.line(20, 120, 190, 120)
    doc.setFontSize(14); doc.text("TOTAL: 60,00 €", 140, 135)
    doc.save(`Factura_${patient.first_name}.pdf`)
  }

  const totalPatients = patients.length
  const estimatedRevenue = appointments.length * 60 
  const upcomingAppointments = appointments.filter(a => new Date(a.start_time) > new Date()).length
  const patientAppointments = selectedPatient ? appointments.filter(a => a.patient === selectedPatient.id) : []
  const next7Days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d })

  // --- VISTA LOGIN ---
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
             <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🦋</div>
             <h1 className="text-2xl font-bold text-gray-800">Clínica Elena</h1>
             <p className="text-gray-500">Acceso Profesional</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="text" value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="Usuario" autoFocus />
            <input type="password" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="Contraseña" />
            <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"><Lock size={20} /> Entrar</button>
          </form>
        </div>
      </div>
    )
  }

  // --- VISTA APP ---
  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-800">
           <h1 className="text-xl font-bold flex items-center gap-2"><div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">🦋</div>Clínica Elena</h1>
           <p className="text-xs text-slate-400 mt-1">Versión Pro</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => {setActiveTab('dashboard'); setSelectedPatient(null)}} className={`w-full flex gap-3 px-4 py-3 rounded-xl transition-all ${activeTab==='dashboard'?'bg-blue-600 text-white':'text-slate-400 hover:text-white'}`}><LayoutDashboard size={20}/> Dashboard</button>
          <button onClick={() => {setActiveTab('patients'); setSelectedPatient(null)}} className={`w-full flex gap-3 px-4 py-3 rounded-xl transition-all ${activeTab==='patients'?'bg-blue-600 text-white':'text-slate-400 hover:text-white'}`}><Users size={20}/> Pacientes</button>
          <button onClick={() => setActiveTab('calendar')} className={`w-full flex gap-3 px-4 py-3 rounded-xl transition-all ${activeTab==='calendar'?'bg-blue-600 text-white':'text-slate-400 hover:text-white'}`}><CalendarIcon size={20}/> Agenda</button>
          <button onClick={() => setActiveTab('billing')} className={`w-full flex gap-3 px-4 py-3 rounded-xl transition-all ${activeTab==='billing'?'bg-blue-600 text-white':'text-slate-400 hover:text-white'}`}><CreditCard size={20}/> Facturación</button>
        </nav>
        <div className="p-4 border-t border-slate-800"><button onClick={handleLogout} className="w-full flex gap-3 px-4 py-3 text-red-400 hover:bg-red-900/20 rounded-xl"><LogOut size={20}/> Salir</button></div>
      </aside>

      <main className="flex-1 overflow-y-auto p-10">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 capitalize">{activeTab === 'dashboard' ? 'Resumen General' : activeTab}</h2>
            <p className="text-gray-500 text-sm">Bienvenida, Elena 👋</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Elena" /></div>
        </header>

        {activeTab === 'dashboard' && (
           <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center"><TrendingUp size={24}/></div>
                    <div><p className="text-gray-500 text-sm">Ingresos</p><h3 className="text-2xl font-bold">{estimatedRevenue} €</h3></div>
                 </div>
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center"><Users size={24}/></div>
                    <div><p className="text-gray-500 text-sm">Pacientes</p><h3 className="text-2xl font-bold">{totalPatients}</h3></div>
                 </div>
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center"><Clock size={24}/></div>
                    <div><p className="text-gray-500 text-sm">Citas Pendientes</p><h3 className="text-2xl font-bold">{upcomingAppointments}</h3></div>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4">📢 Últimos Pacientes</h3>
                    {patients.slice(-3).reverse().map(p => (
                       <div key={p.id} className="flex justify-between py-3 border-b last:border-0"><span className="font-medium">{p.first_name} {p.last_name}</span><span className="text-xs text-gray-400">Reciente</span></div>
                    ))}
                    <button onClick={() => setActiveTab('patients')} className="w-full mt-4 text-blue-600 text-sm font-medium hover:underline">Ver todos →</button>
                 </div>
                 <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg">
                    <h3 className="font-bold text-lg mb-2">🚀 Tu consulta al día</h3>
                    <p className="text-blue-100 text-sm mb-6">Gestiona tus citas y pacientes de forma segura.</p>
                    <button onClick={() => setActiveTab('patients')} className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-bold">Ir a Gestión</button>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'patients' && !selectedPatient && (
          <div className="grid md:grid-cols-3 gap-8 animate-in fade-in">
            <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-blue-100 h-fit sticky top-10">
               <h2 className="text-xl font-bold text-blue-800 mb-4">➕ Nuevo Paciente</h2>
               <form onSubmit={handleCreatePatient} className="space-y-4">
                  <input type="text" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Nombre" required />
                  <input type="text" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Apellidos" required />
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Teléfono" required />
                  <button type="submit" className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md">Guardar Paciente</button>
               </form>
            </div>
            <div className="md:col-span-2 space-y-4">
               {patients.map(p => (
                 <div key={p.id} onClick={() => handleOpenPatient(p)} className="flex justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all">
                    <div className="flex gap-4 items-center">
                       <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">{p.first_name[0]}</div>
                       <div><h3 className="font-bold">{p.first_name} {p.last_name}</h3><p className="text-xs text-gray-500">📞 {p.phone}</p></div>
                    </div>
                    <button onClick={(e) => handleDeletePatient(e, p.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"><Trash2 size={18}/></button>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'patients' && selectedPatient && (
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6 animate-in fade-in">
             <div className="space-y-6">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                   <button onClick={() => setSelectedPatient(null)} className="mb-4 text-gray-400 hover:text-blue-600 flex items-center gap-2">← Volver</button>
                   <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">{selectedPatient.first_name[0]}</div>
                      <div><h1 className="text-3xl font-bold">{selectedPatient.first_name} {selectedPatient.last_name}</h1><p className="text-gray-500">📞 {selectedPatient.phone}</p></div>
                   </div>
                   <label className="font-bold text-blue-900 block mb-2">📝 Notas Clínicas</label>
                   <textarea value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} className="w-full h-40 p-4 border rounded-xl mb-4 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
                   <button onClick={handleSaveNotes} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 shadow-md transition-all">Guardar Notas</button>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100">
                   <h2 className="font-bold text-orange-800 mb-4 flex items-center gap-2"><Paperclip size={20}/> Documentos y Archivos</h2>
                   <label className="flex items-center gap-2 cursor-pointer bg-orange-50 text-orange-700 px-4 py-2 rounded-lg hover:bg-orange-100 transition-colors w-fit mb-4 font-medium text-sm border border-orange-200">
                      <Upload size={16}/> Subir Nuevo Archivo
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                   </label>
                   <div className="space-y-2">
                      {patientFiles.length === 0 ? <p className="text-sm text-gray-400 italic">No hay archivos adjuntos.</p> : 
                         patientFiles.map(file => (
                            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                               <div className="flex items-center gap-3 overflow-hidden">
                                  <FileText size={18} className="text-gray-400 flex-shrink-0"/>
                                  <span className="text-sm text-gray-700 truncate">{file.name}</span>
                               </div>
                               <a href={API_BASE_URL + file.file} target="_blank" rel="noopener noreferrer" className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:text-blue-600 flex items-center gap-1"><Eye size={12}/> Ver</a>
                            </div>
                         ))
                      }
                   </div>
                </div>
             </div>

             <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100">
                   <h2 className="font-bold text-purple-800 mb-4 flex gap-2 items-center"><CalendarIcon size={20}/> Agendar Cita</h2>
                   <div className="flex gap-2">
                      <input type="datetime-local" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} className="border p-2 rounded-lg flex-1 outline-none focus:border-purple-500" />
                      <button onClick={handleCreateAppointment} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 shadow-md">Agendar</button>
                   </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                   <h2 className="font-bold text-gray-800 mb-4">Próximas Citas</h2>
                   {patientAppointments.map(app => (
                      <div key={app.id} className="flex justify-between items-center p-3 border-b last:border-0 hover:bg-gray-50">
                         <div>
                            <p className="font-bold text-purple-900">{new Date(app.start_time).toLocaleDateString()}</p>
                            <p className="text-xs text-purple-700">{new Date(app.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}h</p>
                         </div>
                         <div className="flex gap-2">
                            <button onClick={() => generateInvoice(app, selectedPatient)} className="text-xs bg-white border px-2 py-1 rounded hover:text-blue-600 shadow-sm">Factura</button>
                            <button onClick={() => handleDeleteAppointment(app.id)} className="text-red-400 hover:bg-red-50 p-1 rounded"><Trash2 size={14}/></button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="animate-in fade-in">
             <div className="mb-6 bg-purple-600 text-white p-6 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-bold flex items-center gap-2"><CalendarDays /> Agenda Semanal</h2>
                <p className="text-purple-100 mt-1">Próximos 7 días</p>
             </div>
             <div className="grid gap-4">
                {next7Days.map((day, i) => {
                   const dayApps = appointments.filter(a => new Date(a.start_time).toDateString() === day.toDateString())
                   return (
                      <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                         <h3 className={`font-bold text-lg mb-2 ${i===0 ? 'text-purple-600' : 'text-gray-700'}`}>
                            {day.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            {i===0 && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Hoy</span>}
                         </h3>
                         {dayApps.length===0 ? <p className="text-sm text-gray-400 italic">Día libre ✨</p> : 
                            dayApps.map(app => {
                               const patient = patients.find(p => p.id === app.patient)
                               return (
                                  <div key={app.id} className="flex justify-between items-center p-3 bg-purple-50 rounded-lg border border-purple-100 mb-2">
                                     <div className="flex gap-4 items-center">
                                        <span className="font-bold text-purple-900">{new Date(app.start_time).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                        <div><p className="font-bold text-gray-800">{patient ? `${patient.first_name} ${patient.last_name}` : '?'}</p><p className="text-xs text-purple-600">Sesión</p></div>
                                     </div>
                                     <div className="flex gap-2">
                                        <button onClick={() => generateInvoice(app, patient)} className="text-xs bg-white border border-purple-200 text-purple-600 px-2 py-1 rounded">Factura</button>
                                        <button onClick={() => handleDeleteAppointment(app.id)} className="text-red-400"><Trash2 size={14}/></button>
                                     </div>
                                  </div>
                               )
                            })
                         }
                      </div>
                   )
                })}
             </div>
          </div>
        )}

        {activeTab === 'billing' && (
           <div className="animate-in fade-in">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 flex justify-between items-center">
                 <div><h2 className="text-xl font-bold text-gray-800">Historial</h2><p className="text-gray-500">Sesiones facturadas</p></div>
                 <div className="text-right"><p className="text-sm text-gray-500">Total</p><p className="text-3xl font-bold text-green-600">{estimatedRevenue} €</p></div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                 <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b">
                       <tr><th className="p-4 text-gray-600">Fecha</th><th className="p-4 text-gray-600">Paciente</th><th className="p-4 text-gray-600">Importe</th><th className="p-4 text-right text-gray-600">Acciones</th></tr>
                    </thead>
                    <tbody>
                       {appointments.slice().reverse().map(app => {
                          const p = patients.find(pat => pat.id === app.patient)
                          return (
                             <tr key={app.id} className="border-b hover:bg-gray-50">
                                <td className="p-4 text-gray-700">{new Date(app.start_time).toLocaleDateString()}</td>
                                <td className="p-4 font-medium">{p ? `${p.first_name} ${p.last_name}` : '?'}</td>
                                <td className="p-4 font-bold text-gray-700">60 €</td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                   <button onClick={() => generateInvoice(app, p)} className="text-xs border px-3 py-1 rounded hover:bg-blue-50 hover:text-blue-600">PDF</button>
                                   <button onClick={() => handleDeleteAppointment(app.id)} className="text-red-300 hover:text-red-500"><Trash2 size={16}/></button>
                                </td>
                             </tr>
                          )
                       })}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

      </main>
    </div>
  )
}

export default App