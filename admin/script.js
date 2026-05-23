// Variables globales
let printers = [];

// Cargar impresoras combinando JSON central + localStorage
async function loadPrinters() {
    let mergedPrinters = [];
    
    // 1. Cargar desde JSON central (GitHub)
    try {
        const response = await fetch('../data/impresoras.json?t=' + new Date().getTime());
        const jsonPrinters = await response.json();
        mergedPrinters = [...jsonPrinters];
        console.log('✅ Impresoras cargadas desde JSON central:', jsonPrinters.length);
    } catch (error) {
        console.error('Error cargando impresoras desde JSON:', error);
        // Si falla, seguimos con array vacío
    }
    
    // 2. Cargar desde localStorage (impresoras agregadas en este dispositivo)
    const stored = localStorage.getItem('impresoras');
    if (stored) {
        try {
            const localPrinters = JSON.parse(stored);
            // Merge: las locales sobrescriben a las del JSON si tienen mismo ID
            localPrinters.forEach(localP => {
                const index = mergedPrinters.findIndex(p => p.id === localP.id);
                if (index >= 0) {
                    mergedPrinters[index] = localP; // Actualizar existente
                } else {
                    mergedPrinters.push(localP); // Añadir nueva
                }
            });
            console.log('✅ Impresoras locales mergeadas:', localPrinters.length);
        } catch (e) {
            console.error('Error parseando localStorage:', e);
        }
    }
    
    // 3. Respaldo si todo está vacío
    if (mergedPrinters.length === 0) {
        mergedPrinters = [
            {
                "id": "IM001",
                "serial": "4064433113CMN",
                "model": "ESTUDIO 528P",
                "location": "SALIDA DE RUTAS CONDUCTORES",
                "tonerType": "NEGRO",
                "averiaEmail": "avisos@printsur.com",
                "tonerEmail": "avisos@printsur.com"
            }
        ];
        console.warn('⚠️ Usando datos de respaldo');
    }
    
    printers = mergedPrinters;
    updatePrintersList();
    updatePrinterSelect();
}

// Guardar impresoras en localStorage (persistente en el navegador)
function savePrinters() {
    localStorage.setItem('impresoras', JSON.stringify(printers));
    console.log('💾 Impresoras guardadas en localStorage');
}

// Agregar nueva impresora
function addPrinter() {
    const newPrinter = {
        id: document.getElementById('printer-id').value.trim().toUpperCase(),
        serial: document.getElementById('serial-number').value.trim(),
        model: document.getElementById('model').value.trim(),
        location: document.getElementById('location').value.trim(),
        tonerType: document.getElementById('toner-type').value.trim(),
        averiaEmail: document.getElementById('averia-email').value.trim(),
        tonerEmail: document.getElementById('toner-email').value.trim()
    };
    
    // Validar campos
    if (!newPrinter.id || !newPrinter.model) {
        alert('❌ Completa al menos ID y Modelo');
        return;
    }
    
    // Validar que no exista
    if (printers.find(p => p.id === newPrinter.id)) {
        alert('❌ Ya existe una impresora con ese ID');
        return;
    }
    
    printers.push(newPrinter);
    savePrinters();
    
    // Limpiar formulario
    document.getElementById('printer-form').reset();
    
    // Mostrar instrucciones para guardar permanentemente
    showTempPrinterAlert(newPrinter);
    
    updatePrintersList();
    updatePrinterSelect();
}

// Mostrar alerta con instrucciones para guardar en GitHub
function showTempPrinterAlert(newPrinter) {
    const jsonText = JSON.stringify(printers, null, 4);
    const confirmSave = confirm(
        `✅ Impresora ${newPrinter.id} agregada y guardada en este dispositivo.\n\n` +
        `Se mantendrá incluso si cierras y vuelves a abrir la página.\n\n` +
        `Para que sea PERMANENTE en GitHub (todos los dispositivos la vean):\n\n` +
        `1. Ve a: https://github.com/cecofarmangel-cmyk/impresoras-app/blob/main/data/impresoras.json\n` +
        `2. Haz clic en el lápiz (editar)\n` +
        `3. Reemplaza el contenido con este JSON:\n\n` +
        `${jsonText}\n\n` +
        `4. Haz clic en "Commit changes"\n\n` +
        `¿Quieres copiar el JSON al portapapeles?`
    );
    
    if (confirmSave) {
        navigator.clipboard.writeText(jsonText);
        alert('📋 JSON copiado al portapapeles. Pégalo en GitHub.');
    }
}

// Mostrar pestañas
function showTab(tabName) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Desactivar todos los botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostrar la pestaña seleccionada
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Activar el botón correspondiente
    event.target.classList.add('active');
    
    // Actualizar listas si es necesario
    if (tabName === 'list') {
        updatePrintersList();
    } else if (tabName === 'generate') {
        updatePrinterSelect();
    }
}

// Actualizar lista de impresoras en la pestaña "Lista"
function updatePrintersList() {
    const container = document.getElementById('printers-list');
    
    if (printers.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">No hay impresoras registradas</p>';
        // Limpiar botón de exportar si existe
        const oldExport = document.getElementById('export-github-btn');
        if (oldExport) oldExport.remove();
        return;
    }
    
    container.innerHTML = printers.map(printer => `
        <div class="printer-card">
            <button class="delete-btn" onclick="deletePrinter('${printer.id}')" title="Eliminar (solo de este dispositivo)">🗑️</button>
            <h3>${printer.id} - ${printer.model}</h3>
            <p><strong>🔢 Serie:</strong> ${printer.serial}</p>
            <p><strong>📍 Ubicación:</strong> ${printer.location}</p>
            <p><strong>🖨️ Tóner:</strong> ${printer.tonerType}</p>
            <p><strong>📧 Avería:</strong> ${printer.averiaEmail}</p>
            <p><strong>📧 Tóner:</strong> ${printer.tonerEmail}</p>
        </div>
    `).join('');
    
    // Añadir botón para exportar a GitHub (solo si no existe ya)
    let exportBtn = document.getElementById('export-github-btn');
    if (!exportBtn) {
        exportBtn = document.createElement('div');
        exportBtn.id = 'export-github-btn';
        exportBtn.style.textAlign = 'center';
        exportBtn.style.marginTop = '20px';
        exportBtn.innerHTML = `
            <button onclick="exportToGitHub()" style="padding:10px 20px; background:#3498db; color:white; border:none; border-radius:5px; cursor:pointer;">
                📋 Exportar todas las impresoras a GitHub
            </button>
        `;
        container.parentElement.appendChild(exportBtn);
    }
}

// Exportar todas las impresoras al portapapeles para GitHub
function exportToGitHub() {
    const jsonText = JSON.stringify(printers, null, 4);
    navigator.clipboard.writeText(jsonText);
    alert('📋 JSON copiado al portapapeles.\n\n1. Ve a: https://github.com/cecofarmangel-cmyk/impresoras-app/blob/main/data/impresoras.json\n2. Haz clic en editar (lápiz)\n3. Pega el contenido\n4. Commit changes');
}

// Eliminar impresora (solo del dispositivo local)
function deletePrinter(id) {
    if (confirm(`¿Eliminar impresora ${id}? (solo de este dispositivo, no afecta al archivo JSON de GitHub)`)) {
        printers = printers.filter(p => p.id !== id);
        savePrinters();
        updatePrintersList();
        updatePrinterSelect();
        alert(`✅ Impresora ${id} eliminada de este dispositivo.`);
    }
}

// Actualizar select de impresoras para generar QR
function updatePrinterSelect() {
    const select = document.getElementById('qr-printer-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Selecciona una impresora --</option>';
    
    printers.forEach(printer => {
        const option = document.createElement('option');
        option.value = printer.id;
        option.textContent = `${printer.id} - ${printer.model} (${printer.location})`;
        select.appendChild(option);
    });
}

// Función manual para refrescar datos desde GitHub (descarta locales)
async function refreshFromGitHub() {
    if (!confirm('⚠️ Esto recargará solo las impresoras de GitHub. ¿Perder las agregadas localmente?')) {
        return;
    }
    localStorage.removeItem('impresoras');
    alert('Recargando impresoras desde GitHub...');
    await loadPrinters();
    alert(`✅ Recargadas ${printers.length} impresoras desde GitHub`);
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    await loadPrinters();
    
    // Configurar el formulario
    const form = document.getElementById('printer-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            addPrinter();
        });
    }
    
    // Añadir botón de refrescar si no existe
    const header = document.querySelector('header');
    if (header && !document.getElementById('refresh-btn')) {
        const refreshBtn = document.createElement('button');
        refreshBtn.id = 'refresh-btn';
        refreshBtn.innerHTML = '🔄 Refrescar desde GitHub';
        refreshBtn.style.cssText = 'margin-top:10px; padding:5px 15px; background:#27ae60; color:white; border:none; border-radius:5px; cursor:pointer;';
        refreshBtn.onclick = refreshFromGitHub;
        header.appendChild(refreshBtn);
    }
});
