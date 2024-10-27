// calendar-utils.js
// Función para obtener el primer día de la semana dado un año y número de semana
function getFirstDayOfWeek(year, week) {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = new Date(simple.getTime());
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    return ISOweekStart;
}

// Función para obtener el nombre del día de la semana
function getDayName(dayIndex) {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayIndex];
}

// Función para obtener el número de semana de una fecha
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return [d.getUTCFullYear(), Math.ceil((((d - yearStart) / 86400000) + 1) / 7)];
}

function cargarFestivos() {
  const festivosNacionales = JSON.parse(localStorage.getItem('festivosNacionales')) || {};
  const festivosMadrid = JSON.parse(localStorage.getItem('festivosMadrid')) || {};
  const festivosManuales = JSON.parse(localStorage.getItem('festivosManuales')) || {};
  return { festivosNacionales, festivosMadrid, festivosManuales };
}

function esFestivo(fecha, festivos) {
  const [year, month, day] = fecha.split('-');
  return (festivos.festivosNacionales[year] && festivos.festivosNacionales[year][fecha]) ||
         (festivos.festivosMadrid[year] && festivos.festivosMadrid[year][fecha]) ||
         (festivos.festivosManuales[year] && festivos.festivosManuales[year][fecha]);
}

function esFindeSemana(fecha) {
    const dia = fecha.getDay();
    return dia === 0 || dia === 6;
}

function esDiaLaborable(fecha) {
    const dia = new Date(fecha);
    const diaSemana = dia.getDay();
    const fechaFormateada = formatDate(dia);

    // Comprobar si es sábado (6) o domingo (0)
    if (diaSemana === 0 || diaSemana === 6) {
        return false;
    }

    // Comprobar si es un día festivo
    if (esFestivo(fechaFormateada)) {
        return false;
    }

    // Si no es fin de semana ni festivo, es día laborable
    return true;
}

// Función para obtener el número de días en un mes
function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
}

// Función para obtener el primer día de un mes
function getFirstDayOfMonth(year, month) {
    return new Date(year, month - 1, 1).getDay();
}

// Función para formatear una fecha como YYYY-MM-DD
function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}

// Función para obtener el nombre del mes
function getMonthName(month) {
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return monthNames[month];
}

// Función para obtener el día de la semana (0-6)
function getDayOfWeek(date) {
    const d = new Date(date);
    let day = d.getDay();
    if (day === 0) day = 7; // Ajusta el domingo a 7 en lugar de 0
    return day - 1; // Resta 1 para que lunes sea 0 y domingo 6
}
// Function to load subspecialties
function cargarSubespecialidades() {
    const subespecialidades = JSON.parse(localStorage.getItem('subespecialidadesPosibles')) || [];
    const subespecialidadesMedicos = JSON.parse(localStorage.getItem('subespecialidadesMedicos')) || {};

    const todasLasSubespecialidades = new Set(["Pediatría General"]);

    subespecialidades.forEach(sub => todasLasSubespecialidades.add(sub));

    Object.values(subespecialidadesMedicos).forEach(subs => {
        subs.forEach(sub => todasLasSubespecialidades.add(sub));
    });

    return Array.from(todasLasSubespecialidades).sort();
}

// Function to generate calendar week
function generarCalendarioSemanal(semana, festivos) {
    const [year, week] = semana.split('-W');
    const fechaInicio = getDateOfISOWeek(parseInt(week), parseInt(year));
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    let calendarHTML = '';

    diasSemana.forEach((dia, index) => {
        const fecha = new Date(fechaInicio);
        fecha.setDate(fecha.getDate() + index);
        const fechaStr = fecha.toISOString().split('T')[0];
        const esFestivoHoy = esFestivo(fechaStr, festivos);

        calendarHTML += `
            <div class="day ${esFestivoHoy ? 'holiday' : ''}">
                <div class="day-header">${dia}<br>${fecha.toLocaleDateString()}${esFestivoHoy ? '<br><small>Festivo</small>' : ''}</div>
                <div class="day-content" ondrop="drop(event)" ondragover="allowDrop(event)" data-fecha="${fechaStr}"></div>
            </div>
        `;
    });

    return calendarHTML;
}

// Helper function to get the date of ISO week
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

// Function to handle drag and drop
function handleDragDrop(ev, tipo) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text/plain");
    const element = document.getElementById(data);
    if (element) {
        const item = JSON.parse(element.getAttribute(`data-${tipo}`));
        const diaSeleccionado = ev.target.closest('.day-content');
        const fecha = diaSeleccionado.getAttribute('data-fecha');

        if (diaSeleccionado.closest('.day').classList.contains('holiday')) {
            alert(`No se pueden asignar ${tipo}s en días festivos.`);
            return;
        }

        checkDoctorAvailability(fecha, item.subespecialidad, tipo);
    }
}

// Function to check doctor availability
function checkDoctorAvailability(fecha, subespecialidad, tipo) {
    const medicos = JSON.parse(localStorage.getItem('medicos')) || [];
    const subespecialidadesMedicos = JSON.parse(localStorage.getItem('subespecialidadesMedicos')) || {};

    let medicosDisponibles = medicos.filter(medico => 
        !subespecialidad || 
        (subespecialidadesMedicos[medico.correo] && subespecialidadesMedicos[medico.correo].includes(subespecialidad))
    );

    let todosNoDisponibles = true;
    let algunoNoPreferido = false;

    for (let medico of medicosDisponibles) {
        const preferencias = JSON.parse(localStorage.getItem(`calendario_${medico.correo}`)) || {};
        if (preferencias[fecha] === 'rojo') {
            continue;
        }
        if (preferencias[fecha] === 'amarillo') {
            algunoNoPreferido = true;
        }
        todosNoDisponibles = false;
        break;
    }

    if (todosNoDisponibles) {
        showWarning(`No hay médicos disponibles para este ${tipo} en la fecha seleccionada. Todos los médicos han marcado este día como no disponible.`);
    } else if (algunoNoPreferido) {
        showWarning(`Algunos médicos han marcado preferencia de no trabajar en este día. Se añadirá un distintivo al ${tipo}. ¿Desea continuar con la asignación?`, () => asignarItem(fecha, tipo));
    } else {
        asignarItem(fecha, tipo);
    }
}

// Function to show warning
function showWarning(message, onConfirm) {
    const warningModal = document.getElementById('warningModal');
    const warningMessage = document.getElementById('warningMessage');
    warningMessage.textContent = message;
    warningModal.style.display = "block";

    const confirmBtn = document.getElementById('confirmAssignment');
    const cancelBtn = document.getElementById('cancelAssignment');

    confirmBtn.onclick = () => {
        if (onConfirm) onConfirm();
        warningModal.style.display = "none";
    };
    cancelBtn.onclick = () => {
        warningModal.style.display = "none";
    };
}

// Function to assign item (turno or consulta)
function asignarItem(fecha, tipo) {
    const asignaciones = JSON.parse(localStorage.getItem(`${tipo}sAsignados`)) || {};
    if (!asignaciones[fecha]) {
        asignaciones[fecha] = [];
    }
    asignaciones[fecha].push({...window[`${tipo}Actual`], asignacionId: Date.now(), preferenciaNoTrabajar: true});
    localStorage.setItem(`${tipo}sAsignados`, JSON.stringify(asignaciones));
    actualizarCalendario();
}

// Function to update calendar
function actualizarCalendario() {
    const dias = document.querySelectorAll('.day-content');
    dias.forEach((dia) => {
        const fecha = dia.getAttribute('data-fecha');
        const turnosAsignados = JSON.parse(localStorage.getItem('turnosAsignados')) || {};
        const consultasAsignadas = JSON.parse(localStorage.getItem('consultasAsignadas')) || {};
        const turnosDia = turnosAsignados[fecha] || [];
        const consultasDia = consultasAsignadas[fecha] || [];

        dia.innerHTML = '';

        turnosDia.forEach((turno) => {
            const turnoElement = crearElementoAsignado(turno, 'turno');
            dia.appendChild(turnoElement);
        });

        consultasDia.forEach((consulta) => {
            const consultaElement = crearElementoAsignado(consulta, 'consulta');
            dia.appendChild(consultaElement);
        });

        const medicos = JSON.parse(localStorage.getItem('medicos')) || [];
        let todosNoDisponibles = true;
        for (let medico of medicos) {
            const preferencias = JSON.parse(localStorage.getItem(`calendario_${medico.correo}`)) || {};
            if (preferencias[fecha] !== 'rojo') {
                todosNoDisponibles = false;
                break;
            }
        }
        if (todosNoDisponibles) {
            dia.classList.add('unavailable');
        } else {
            dia.classList.remove('unavailable');
        }
    });
}

// Function to create assigned element (turno or consulta)
function crearElementoAsignado(item, tipo) {
    const element = document.createElement('div');
    element.className = `${tipo} ${tipo}-asignado`;
    element.draggable = true;
    element.innerHTML = `${item.nombre} (${item.inicio} - ${item.fin})${item.subespecialidad ? `<br>Subespecialidad: ${item.subespecialidad}` : ''}${item.preferenciaNoTrabajar ? '<span class="preference-dot" title="Preferencia de no trabajar"></span>' : ''}`;
    element.id = `${tipo}-asignado-${item.asignacionId}`;
    element.setAttribute(`data-${tipo}`, JSON.stringify(item));
    element.addEventListener('dragstart', drag);
    return element;
}

// Function to handle drag start
function drag(ev) {
    ev.dataTransfer.setData("text/plain", ev.target.id);
}

// Function to save assignments
function guardarAsignaciones(tipo) {
    const semanaSeleccionada = document.getElementById('semana').value;
    if (!semanaSeleccionada) {
        alert("Por favor, selecciona una semana antes de guardar.");
        return;
    }

    const asignaciones = JSON.parse(localStorage.getItem(`${tipo}sAsignados`)) || {};
    localStorage.setItem(`${tipo}sAsignados_${semanaSeleccionada}`, JSON.stringify(asignaciones));
    alert("Asignaciones guardadas correctamente.");
}

// Function to load saved assignments
function cargarAsignacionesGuardadas(semana, tipo) {
    const asignacionesGuardadas = JSON.parse(localStorage.getItem(`${tipo}sAsignados_${semana}`)) || {};
    localStorage.setItem(`${tipo}sAsignados`, JSON.stringify(asignacionesGuardadas));
    actualizarCalendario();
}

// Function to copy assignments from previous week
function copiarSemanaPreviaAsignaciones(tipo) {
    const semanaSeleccionada = document.getElementById('semana').value;
    if (!semanaSeleccionada) {
        alert("Por favor, selecciona una semana antes de copiar.");
        return;
    }

    const [year, week] = semanaSeleccionada.split('-W');
    const semanaPreviaNum = parseInt(week) - 1;
    const semanaPreviaYear = semanaPreviaNum > 0 ? year : parseInt(year) - 1;
    const semanaPreviaWeek = semanaPreviaNum > 0 ? semanaPreviaNum : 52;
    const semanaPrevia = `${semanaPreviaYear}-W${semanaPreviaWeek.toString().padStart(2, '0')}`;

    const asignacionesPrevias = JSON.parse(localStorage.getItem(`${tipo}sAsignados_${semanaPrevia}`)) || {};

    const fechaInicioSemanaActual = getDateOfISOWeek(parseInt(week), parseInt(year));
    const fechaInicioSemanaPrevia = getDateOfISOWeek(semanaPreviaWeek, semanaPreviaYear);

    const nuevasAsignaciones = {};
    Object.keys(asignacionesPrevias).forEach(fechaPrevia => {
        const diferenciaEnDias = (new Date(fechaPrevia) - fechaInicioSemanaPrevia) / (1000 * 60 * 60 * 24);
        const nuevaFecha = new Date(fechaInicioSemanaActual);
        nuevaFecha.setDate(nuevaFecha.getDate() + diferenciaEnDias);
        const nuevaFechaStr = nuevaFecha.toISOString().split('T')[0];
        nuevasAsignaciones[nuevaFechaStr] = asignacionesPrevias[fechaPrevia].map(item => ({
            ...item,
            asignacionId: Date.now() + Math.random()
        }));
    });

    localStorage.setItem(`${tipo}sAsignados`, JSON.stringify(nuevasAsignaciones));
    actualizarCalendario();

    alert("Asignaciones de la semana previa copiadas. No olvides guardar los cambios si deseas mantenerlos.");
}