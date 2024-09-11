<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generar Planning</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 {
            text-align: center;
            color: #333;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
        }
        input, select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        button {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        button:hover {
            background-color: #45a049;
        }
        #calendario {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 5px;
            margin-top: 20px;
        }
        .dia {
            border: 1px solid #ddd;
            padding: 5px;
            min-height: 100px;
        }
        .dia-header {
            font-weight: bold;
            text-align: center;
            margin-bottom: 5px;
        }
        .dia-content {
            min-height: 50px;
        }
        .asignacion {
            background-color: #e6f3ff;
            padding: 2px 5px;
            margin: 2px 0;
            font-size: 0.9em;
        }
        .festivo {
            background-color: #ffcccb;
        }
        nav {
            margin-top: 20px;
            text-align: center;
        }
        nav a {
            margin: 0 10px;
            text-decoration: none;
            color: #4CAF50;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Generar Planning</h1>
        
        <div class="form-group">
            <label for="semana">Seleccionar Semana:</label>
            <input type="week" id="semana" onchange="mostrarCalendarioSemanal()">
        </div>
        
        <button onclick="generarPlanning()">Generar Planning</button>
        
        <div id="calendario"></div>

        <nav>
            <a href="index.html">Volver al Inicio</a>
        </nav>
    </div>

    <script>
        let medicos = [];
        let turnosCreados = [];
        let consultasCreadas = [];
        let turnosAsignados = {};
        let consultasAsignadas = {};
        let festivosNacionales = {};
        let festivosMadrid = {};
        let festivosManuales = {};
        let subespecialidadesMedicos = {};
        let calendarioMedicos = {};

        function mostrarCalendarioSemanal() {
            const semanaSeleccionada = document.getElementById('semana').value;
            if (!semanaSeleccionada) return;

            generarCalendario(semanaSeleccionada);
        }

        function getDateOfISOWeek(week, year) {
            const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
            const dayOfWeek = simple.getUTCDay();
            const ISOweekStart = new Date(simple);
            if (dayOfWeek <= 4)
                ISOweekStart.setUTCDate(simple.getUTCDate() - dayOfWeek + 1);
            else
                ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - dayOfWeek);
            return ISOweekStart;
        }

        function generarCalendario(semana) {
            const calendario = document.getElementById('calendario');
            calendario.innerHTML = '';
            const [year, week] = semana.split('-W');
            const primerDia = getDateOfISOWeek(parseInt(week), parseInt(year));
            const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            
            diasSemana.forEach((dia, index) => {
                const fecha = new Date(primerDia);
                fecha.setUTCDate(fecha.getUTCDate() + index);
                const fechaStr = fecha.toISOString().split('T')[0];
                
                const diaElement = document.createElement('div');
                diaElement.className = 'dia';
                if (esFestivo(fechaStr)) {
                    diaElement.classList.add('festivo');
                }
                diaElement.innerHTML = `
                    <div class="dia-header">${dia}<br>${fecha.toLocaleDateString()}</div>
                    <div class="dia-content" data-fecha="${fechaStr}"></div>
                `;
                calendario.appendChild(diaElement);
            });
        }

        function esFestivo(fecha) {
            return festivosNacionales[fecha] || festivosMadrid[fecha] || festivosManuales[fecha];
        }

        function cargarDatos() {
            medicos = JSON.parse(localStorage.getItem('medicos')) || [];
            turnosCreados = JSON.parse(localStorage.getItem('turnosCreados')) || [];
            consultasCreadas = JSON.parse(localStorage.getItem('consultas')) || [];
            festivosNacionales = JSON.parse(localStorage.getItem('festivosNacionales')) || {};
            festivosMadrid = JSON.parse(localStorage.getItem('festivosMadrid')) || {};
            festivosManuales = JSON.parse(localStorage.getItem('festivosManuales')) || {};
            subespecialidadesMedicos = JSON.parse(localStorage.getItem('subespecialidadesMedicos')) || {};
            calendarioMedicos = {};
            
            medicos.forEach(medico => {
                calendarioMedicos[medico.correo] = JSON.parse(localStorage.getItem(`calendario_${medico.correo}`)) || {};
            });
        }

        function generarPlanning() {
            const semanaSeleccionada = document.getElementById('semana').value;
            if (!semanaSeleccionada) {
                alert("Por favor, selecciona una semana antes de generar el planning.");
                return;
            }

            cargarDatos();

            const [year, week] = semanaSeleccionada.split('-W');
            const primerDia = getDateOfISOWeek(parseInt(week), parseInt(year));

            // Reiniciar asignaciones
            turnosAsignados = {};
            consultasAsignadas = {};

            for (let i = 0; i < 7; i++) {
                const fecha = new Date(primerDia);
                fecha.setUTCDate(fecha.getUTCDate() + i);
                const fechaStr = fecha.toISOString().split('T')[0];

                if (!esFestivo(fechaStr)) {
                    asignarTurnosYConsultas(fechaStr);
                }
            }

            actualizarCalendario();
        }

        function asignarTurnosYConsultas(fecha) {
            const medicosDisponibles = obtenerMedicosDisponibles(fecha);
            
            // Asignar consultas
            consultasCreadas.forEach(consulta => {
                const medicoAsignado = asignarMedicoAConsulta(consulta, medicosDisponibles, fecha);
                if (medicoAsignado) {
                    if (!consultasAsignadas[fecha]) consultasAsignadas[fecha] = [];
                    consultasAsignadas[fecha].push({...consulta, medico: medicoAsignado});
                    medicosDisponibles.splice(medicosDisponibles.indexOf(medicoAsignado), 1);
                }
            });

            // Asignar turnos
            turnosCreados.forEach(turno => {
                const medicoAsignado = asignarMedicoATurno(turno, medicosDisponibles, fecha);
                if (medicoAsignado) {
                    if (!turnosAsignados[fecha]) turnosAsignados[fecha] = [];
                    turnosAsignados[fecha].push({...turno, medico: medicoAsignado});
                    medicosDisponibles.splice(medicosDisponibles.indexOf(medicoAsignado), 1);
                }
            });
        }

        function obtenerMedicosDisponibles(fecha) {
            return medicos.filter(medico => {
                const calendarioMedico = calendarioMedicos[medico.correo];
                return !calendarioMedico[fecha] || calendarioMedico[fecha] !== 'rojo';
            });
        }

        function asignarMedicoAConsulta(consulta, medicosDisponibles, fecha) {
            const medicosAptos = medicosDisponibles.filter(medico => 
                subespecialidadesMedicos[medico.correo].includes(consulta.subespecialidad) &&
                !haTrabajoNochePrevia(medico, fecha) &&
                !haTrabajoMuchoReciente(medico, fecha)
            );

            if (medicosAptos.length > 0) {
                return medicosAptos[Math.floor(Math.random() * medicosAptos.length)];
            }

            return null;
        }

        function asignarMedicoATurno(turno, medicosDisponibles, fecha) {
            const medicosAptos = medicosDisponibles.filter(medico => 
                !haTrabajoNochePrevia(medico, fecha) &&
                !haTrabajoMuchoReciente(medico, fecha) &&
                !excedeFinesDeSemana(medico, fecha)
            );

            if (medicosAptos.length > 0) {
                return medicosAptos[Math.floor(Math.random() * medicosAptos.length)];
            }

            return null;
        }

        function haTrabajoNochePrevia(medico, fecha) {
            const fechaPrevia = new Date(fecha);
            fechaPrevia.setDate(fechaPrevia.getDate() - 1);
            const fechaPreviaStr = fechaPrevia.toISOString().split('T')[0];

            const turnosPrevios = turnosAsignados[fechaPreviaStr] || [];
            return turnosPrevios.some(turno => 
                turno.medico === medico.correo &&
                (turno.inicio >= '00:00' && turno.fin <= '07:00')
            );
        }

        function haTrabajoMuchoReciente(medico, fecha) {
            const fechaPrevia = new Date(fecha);
            fechaPrevia.setDate(fechaPrevia.getDate() - 1);
            const fechaPreviaStr = fechaPrevia.toISOString().split('T')[0];

            const turnosPrevios = turnosAsignados[fechaPreviaStr] || [];
            return turnosPrevios.some(turno => 
                turno.medico === medico.correo &&
                turno.fin === '24:00'
            );
        }

        function excedeFinesDeSemana(medico, fecha) {
            const dia = new Date(fecha).getDay();
            if (dia !== 0 && dia !== 6) return false;

            const mesActual = new Date(fecha).getMonth();
            let finesDeSemanaTrabajados = 0;

            Object.keys(turnosAsignados).forEach(fechaAsignada => {
                const fechaAsignadaObj = new Date(fechaAsignada);
                if (fechaAsignadaObj.getMonth() === mesActual) {
                    const diaAsignado = fechaAsignadaObj.getDay();
                    if ((diaAsignado === 0 || diaAsignado === 6) && 
                        turnosAsignados[fechaAsignada].some(turno => turno.medico === medico.correo)) {
                        finesDeSemanaTrabajados++;
                    }
                }
            });

            return finesDeSemanaTrabajados >= 2;
        }

        function actualizarCalendario() {
            const dias = document.querySelectorAll('.dia-content');
            dias.forEach((dia) => {
                const fecha = dia.getAttribute('data-fecha');
                dia.innerHTML = '';

                // Mostrar consultas asignadas
                const consultasDia = consultasAsignadas[fecha] || [];
                consultasDia.forEach(consulta => {
                    const consultaElement = document.createElement('div');
                    consultaElement.className = 'asignacion';
                    consultaElement.textContent = `Consulta: ${consulta.nombre} - ${consulta.medico}`;
                    dia.appendChild(consultaElement);
                });

                // Mostrar turnos asignados
                const turnosDia = turnosAsignados[fecha] || [];
                turnosDia.forEach(turno => {
                    const turnoElement = document.createElement('div');
                    turnoElement.className = 'asignacion';
                    turnoElement.textContent = `Turno: ${turno.nombre} - ${turno.medico}`;
                    dia.appendChild(turnoElement);
                });

                // Agregar selector para modificar asignación
                const selector = document.createElement('select');
                selector.innerHTML = '<option value="">Modificar asignación</option>';
                medicos.forEach(medico => {
                    selector.innerHTML += `<option value="${medico.correo}">${medico.nombre} ${medico.apellidos}</option>`;
                });
                selector.onchange = (e) => modificarAsignacion(fecha, e.target.value);
                dia.appendChild(selector);
            });
        }

        function modificarAsignacion(fecha, nuevoMedico) {
            if (!nuevoMedico) return;

            const asignacionesDelDia = [...(consultasAsignadas[fecha] || []), ...(turnosAsignados[fecha] || [])];
            if (asignacionesDelDia.length === 0) {
                alert("No hay asignaciones para modificar en este día.");
                return;
            }

            const asignacionAModificar = asignacionesDelDia[0];
            
            // Verificar si el nuevo médico puede realizar esta asignación
            if (asignacionAModificar.subespecialidad && !subespecialidadesMedicos[nuevoMedico].includes(asignacionAModificar.subespecialidad)) {
                alert("Este médico no tiene la subespecialidad requerida para esta asignación.");
                return;
            }

            // Verificar si el nuevo médico no ha trabajado la noche anterior o 24 horas el día anterior
            if (haTrabajoNochePrevia(nuevoMedico, fecha) || haTrabajoMuchoReciente(nuevoMedico, fecha)) {
                alert("Este médico no puede ser asignado debido a sus turnos previos.");
                return;
            }

            // Modificar la asignación
            asignacionAModificar.medico = nuevoMedico;

            // Actualizar las asignaciones
            if (asignacionAModificar.nombre.includes('Consulta')) {
                consultasAsignadas[fecha] = consultasAsignadas[fecha].map(c => 
                    c.asignacionId === asignacionAModificar.asignacionId ? asignacionAModificar : c
                );
            } else {
                turnosAsignados[fecha] = turnosAsignados[fecha].map(t => 
                    t.asignacionId === asignacionAModificar.asignacionId ? asignacionAModificar : t
                );
            }

            actualizarCalendario();
        }

        function cargarMedicosYSubespecialidades() {
            medicos = JSON.parse(localStorage.getItem('medicos')) || [];
            subespecialidades = JSON.parse(localStorage.getItem('subespecialidadesPosibles')) || [];
            subespecialidadesMedicos = JSON.parse(localStorage.getItem('subespecialidadesMedicos')) || {};
        }

        window.onload = function() {
            cargarMedicosYSubespecialidades();
            cargarFestivos();
            const currentDate = new Date();
            const currentWeek = getWeekNumber(currentDate);
            document.getElementById('semana').value = `${currentDate.getFullYear()}-W${currentWeek.toString().padStart(2, '0')}`;
            mostrarCalendarioSemanal();
        };
    </script>
</body>
</html>