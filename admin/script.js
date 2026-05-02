// Base de datos local (usando localStorage)
let printers = [];

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadPrinters();
    updatePrintersList();
    updatePrinterSelect();
    
    // Configurar el formulario
    document.getElementById('printer-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addPrinter();
    });
});

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

// Cargar impresoras desde localStorage
function loadPrinters() {
    const stored = localStorage.getItem('impresoras');
    if (stored) {
        printers = JSON.parse(stored);
    } else {
        // Datos de ejemplo
        printers = [
            {
                id: "P001",
                serial: "SN123456789",
                model: "HP LaserJet Pro M402dn",
                location: "Oficina Dirección",
                tonerType: "HP 26X",
                averiaEmail: "soporte@tuempresa.com",
                tonerEmail: "compras@tuempresa.com"
            },
            {
                id: "P002",
                serial: "SN987654321",
                model: "Brother HL-L2350DW",
                location: "Recepción",
                tonerType: "Brother TN-760",
                averiaEmail: "soporte@tuempresa.com",
                tonerEmail: "compras@tuempresa.com"
            }
        ];
        savePrinters();
    }
}

// Guardar impresoras en localStorage
function savePrinters() {
    localStorage.setItem('impresoras', JSON.stringify(printers));
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
    
    // Validar que no exista
    if (printers.find(p => p.id === newPrinter.id)) {
        alert('❌ Ya existe una impresora con ese ID');
        return;
    }
    
    printers.push(newPrinter);
    savePrinters();
    
    // Limpiar formulario
    document.getElementById('printer-form').reset();
    
    alert('✅ Impresora agregada correctamente');
    updatePrintersList();
    updatePrinterSelect();
}

// Actualizar lista de impresoras
function updatePrintersList() {
    const container = document.getElementById('printers-list');
    
    if (printers.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">No hay impresoras registradas</p>';
        return;
    }
    
    container.innerHTML = printers.map(printer => `
        <div class="printer-card">
            <button class="delete-btn" onclick="deletePrinter('${printer.id}')">🗑️</button>
            <h3>${printer.id} - ${printer.model}</h3>
            <p><strong>🔢 Serie:</strong> ${printer.serial}</p>
            <p><strong>📍 Ubicación:</strong> ${printer.location}</p>
            <p><strong>🖨️ Tóner:</strong> ${printer.tonerType}</p>
            <p><strong>📧 Avería:</strong> ${printer.averiaEmail}</p>
            <p><strong>📧 Tóner:</strong> ${printer.tonerEmail}</p>
        </div>
    `).join('');
}

// Eliminar impresora
function deletePrinter(id) {
    if (confirm(`¿Eliminar impresora ${id}?`)) {
        printers = printers.filter(p => p.id !== id);
        savePrinters();
        updatePrintersList();
        updatePrinterSelect();
        alert('✅ Impresora eliminada');
    }
}

// Actualizar select de impresoras para generar QR
function updatePrinterSelect() {
    const select = document.getElementById('qr-printer-select');
    select.innerHTML = '<option value="">-- Selecciona una impresora --</option>';
    
    printers.forEach(printer => {
        const option = document.createElement('option');
        option.value = printer.id;
        option.textContent = `${printer.id} - ${printer.model}`;
        select.appendChild(option);
    });
}