// Variables globales
let printers = [];

// Cargar impresoras desde el archivo JSON central (GitHub)
async function loadPrinters() {
    try {
        const response = await fetch('../data/impresoras.json?t=' + new Date().getTime());
        printers = await response.json();
        updatePrintersList();
        updatePrinterSelect();
        console.log('✅ Impresoras cargadas desde JSON central:', printers.length);
    } catch (error) {
        console.error('Error cargando impresoras:', error);
        // Datos de respaldo por si falla la carga
        printers = [
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
        updatePrintersList();
        updatePrinterSelect();
        alert('⚠️ Usando datos locales. Verifica que el archivo data/impresoras.json existe en GitHub.');
    }
}

// Guardar impresoras (solo temporal, para pruebas)
// Para cambios permanentes, edita data/impresoras.json en GitHub
function savePrinters() {
    // Guardar copia en localStorage como respaldo
    localStorage.setItem('impresoras_backup', JSON.stringify(printers));
    console.warn('⚠️ Los cambios son temporales. Para cambios permanentes, edita data/impresoras.json en GitHub');
}

// Agregar nueva impresora (solo temporal)
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
        `✅ Impresora ${newPrinter.id} agregada TEMPORALMENTE.\n\n` +
        `Para que sea PERMANENTE y todos los dispositivos la vean:\n\n` +
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
        return;
    }
    
    container.innerHTML = printers.map(printer => `
        <div class="printer-card">
            <button class="delete-btn" onclick="deletePrinter('${printer.id}')" title="Eliminar (solo temporal)">🗑️</button>
            <h3>${printer.id} - ${printer.model}</h3>
            <p><strong>🔢 Serie:</strong> ${printer.serial}</p>
            <p><strong>📍 Ubicación:</strong> ${printer.location}</p>
            <p><strong>🖨️ Tóner:</strong> ${printer.tonerType}</p>
            <p><strong>📧 Avería:</strong> ${printer.averiaEmail}</p>
            <p><strong>📧 Tóner:</strong> ${printer.tonerEmail}</p>
        </div>
    `).join('');
    
    // Añadir botón para exportar a GitHub
    const exportBtn = document.createElement('div');
    exportBtn.style.textAlign = 'center';
    exportBtn.style.marginTop = '20px';
    exportBtn.innerHTML = `
        <button onclick="exportToGitHub()" style="padding:10px 20px; background:#3498db; color:white; border:none; border-radius:5px; cursor:pointer;">
            📋 Exportar todas las impresoras a GitHub
        </button>
    `;
    container.parentElement.appendChild(exportBtn);
}

// Exportar todas las impresoras al portapapeles para GitHub
function exportToGitHub() {
    const jsonText = JSON.stringify(printers, null, 4);
    navigator.clipboard.writeText(jsonText);
    alert('📋 JSON copiado al portapapeles.\n\n1. Ve a: https://github.com/cecofarmangel-cmyk/impresoras-app/blob/main/data/impresoras.json\n2. Haz clic en editar (lápiz)\n3. Pega el contenido\n4. Commit changes');
}

// Eliminar impresora (solo temporalmente)
function deletePrinter(id) {
    if (confirm(`¿Eliminar impresora ${id}? (solo temporalmente, no afecta al archivo JSON de GitHub)`)) {
        printers = printers.filter(p => p.id !== id);
        savePrinters();
        updatePrintersList();
        updatePrinterSelect();
        alert(`✅ Impresora ${id} eliminada TEMPORALMENTE. Para eliminarla permanentemente, edita el JSON en GitHub.`);
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

// Función manual para refrescar datos desde GitHub
async function refreshFromGitHub() {
    alert('Recargando impresoras desde GitHub...');
    await loadPrinters();
    alert(`✅ Recargadas ${printers.length} impresoras`);
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
