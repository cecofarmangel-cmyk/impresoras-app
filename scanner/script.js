// Base de datos (se carga desde localStorage o JSON)
let printersDB = {};

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
    await loadPrinters();
    startScanner();
});

// Cargar impresoras desde localStorage o archivo
async function loadPrinters() {
    // Primero intentar cargar desde localStorage (para que funcione con el admin panel)
    const stored = localStorage.getItem('impresoras');
    
    if (stored) {
        const printers = JSON.parse(stored);
        printers.forEach(printer => {
            printersDB[printer.id] = printer;
        });
        updateStatus(`✅ ${Object.keys(printersDB).length} impresoras cargadas`, 'success');
    } else {
        // Si no hay datos en localStorage, usar datos de ejemplo
        updateStatus('⚠️ Usando datos de ejemplo. Ve al panel de administración para agregar tus impresoras.', 'error');
        
        // Datos de ejemplo
        const ejemplo = [
            { id: "P001", serial: "SN123456789", model: "HP LaserJet Pro M402dn", location: "Oficina Dirección", tonerType: "HP 26X", averiaEmail: "soporte@tuempresa.com", tonerEmail: "compras@tuempresa.com" },
            { id: "P002", serial: "SN987654321", model: "Brother HL-L2350DW", location: "Recepción", tonerType: "Brother TN-760", averiaEmail: "soporte@tuempresa.com", tonerEmail: "compras@tuempresa.com" }
        ];
        
        ejemplo.forEach(printer => {
            printersDB[printer.id] = printer;
        });
    }
}

// Iniciar el escáner
function startScanner() {
    const html5QrCode = new Html5Qrcode("qr-reader");
    
    const config = {
        fps: 10,
        qrbox: { width: 300, height: 300 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true
    };
    
    html5QrCode.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        (errorMessage) => {
            // Silencioso
        }
    ).catch(err => {
        console.error("Error al iniciar cámara:", err);
        updateStatus('❌ No se pudo acceder a la cámara. Asegúrate de permitir el acceso.', 'error');
    });
}

// Cuando se escanea un QR
function onScanSuccess(decodedText) {
    // Parsear el contenido del QR (formato: TIPO|ID)
    const parts = decodedText.split('|');
    
    if (parts.length !== 2) {
        updateStatus('❌ QR inválido. Formato incorrecto.', 'error');
        return;
    }
    
    const [tipo, printerId] = parts;
    const printer = printersDB[printerId];
    
    if (!printer) {
        updateStatus(`❌ Impresora ${printerId} no encontrada en la base de datos`, 'error');
        return;
    }
    
    // Según el tipo, enviar correo correspondiente
    if (tipo === 'AVERIA') {
        sendAveriaEmail(printer);
    } else if (tipo === 'TONER') {
        sendTonerEmail(printer);
    } else {
        updateStatus(`❌ Tipo de QR desconocido: ${tipo}`, 'error');
    }
}

// Enviar correo de avería
function sendAveriaEmail(printer) {
    const destinatario = printer.averiaEmail;
    const asunto = `AVERÍA - ${printer.model} - Serie: ${printer.serial}`;
    
    const cuerpo = `%0A%0A
=========================================
📠 REPORTE DE AVERÍA EN IMPRESORA
=========================================
%0A
🖨️ MODELO: ${printer.model}
🔢 NÚMERO DE SERIE: ${printer.serial}
📍 UBICACIÓN: ${printer.location}
%0A
─────────────────────────────────────────
⚠️ DESCRIPCIÓN DEL PROBLEMA:
─────────────────────────────────────────
%0A
[Describe aquí la avería]
%0A
─────────────────────────────────────────
📅 FECHA: ${new Date().toLocaleString('es-ES')}
👤 REPORTADO POR: [Tu nombre]
%0A
=========================================`;
    
    const mailtoURL = `mailto:${destinatario}?subject=${encodeURIComponent(asunto)}&body=${cuerpo}`;
    
    updateStatus(`🔴 Abriendo correo para AVERÍA de ${printer.model}...`, 'success');
    
    setTimeout(() => {
        window.location.href = mailtoURL;
    }, 500);
}

// Enviar correo de tóner
function sendTonerEmail(printer) {
    const destinatario = printer.tonerEmail;
    const asunto = `PEDIDO TÓNER - ${printer.model} - Serie: ${printer.serial}`;
    
    const cuerpo = `%0A%0A
=========================================
🖨️ SOLICITUD DE TÓNER
=========================================
%0A
🖨️ MODELO: ${printer.model}
🔢 NÚMERO DE SERIE: ${printer.serial}
📍 UBICACIÓN: ${printer.location}
📦 TÓNER COMPATIBLE: ${printer.tonerType}
%0A
─────────────────────────────────────────
📊 CANTIDAD SOLICITADA:
─────────────────────────────────────────
%0A
[ ] 1 unidad
[ ] 2 unidades
[ ] Otros: _______
%0A
─────────────────────────────────────────
📅 FECHA: ${new Date().toLocaleString('es-ES')}
👤 SOLICITADO POR: [Tu nombre]
%0A
=========================================`;
    
    const mailtoURL = `mailto:${destinatario}?subject=${encodeURIComponent(asunto)}&body=${cuerpo}`;
    
    updateStatus(`🟢 Abriendo correo para TÓNER de ${printer.model}...`, 'success');
    
    setTimeout(() => {
        window.location.href = mailtoURL;
    }, 500);
}

// Actualizar estado en pantalla
function updateStatus(message, type = 'normal') {
    const statusDiv = document.getElementById('scanner-status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    
    // Si es éxito, limpiar después de 3 segundos
    if (type === 'success') {
        setTimeout(() => {
            if (statusDiv.textContent === message) {
                statusDiv.textContent = '🔍 Esperando escaneo...';
                statusDiv.className = 'status';
            }
        }, 3000);
    }
}