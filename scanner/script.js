// Base de datos (se carga desde localStorage o JSON)
let printersDB = {};
let html5QrCode = null;
let lastScanned = "";
let scanCooldown = false;

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
    await loadPrinters();
    startScanner();
});

// Cargar impresoras desde localStorage o archivo
async function loadPrinters() {
    const stored = localStorage.getItem('impresoras');
    
    if (stored) {
        const printers = JSON.parse(stored);
        printers.forEach(printer => {
            printersDB[printer.id] = printer;
        });
        updateStatus(`✅ ${Object.keys(printersDB).length} impresoras cargadas`, 'success');
    } else {
        updateStatus('⚠️ Usando datos de ejemplo. Ve al panel de administración para agregar tus impresoras.', 'error');
        
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
    html5QrCode = new Html5Qrcode("qr-reader");
    
    const config = {
        fps: 10,
        qrbox: { width: 280, height: 280 },
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
    const cleanText = decodedText.trim();
    
    // Evitar escaneos duplicados consecutivos
    if (scanCooldown || cleanText === lastScanned) {
        return;
    }
    
    lastScanned = cleanText;
    scanCooldown = true;
    
    // Parsear el contenido del QR (formato: TIPO|ID)
    const parts = cleanText.split('|');
    
    if (parts.length !== 2) {
        updateStatus('❌ QR inválido. Formato incorrecto.', 'error');
        resetCooldown();
        return;
    }
    
    const [tipo, printerId] = parts;
    const printer = printersDB[printerId];
    
    if (!printer) {
        updateStatus(`❌ Impresora ${printerId} no encontrada en la base de datos`, 'error');
        resetCooldown();
        return;
    }
    
    // Detener escáner temporalmente para evitar múltiples lecturas
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.pause();
    }
    
    // Según el tipo, enviar correo correspondiente
    if (tipo === 'AVERIA') {
        sendAveriaEmail(printer);
    } else if (tipo === 'TONER') {
        sendTonerEmail(printer);
    } else {
        updateStatus(`❌ Tipo de QR desconocido: ${tipo}`, 'error');
        if (html5QrCode) html5QrCode.resume();
        resetCooldown();
    }
}

// Resetear cooldown después de un tiempo
function resetCooldown() {
    setTimeout(() => {
        scanCooldown = false;
        lastScanned = "";
        if (html5QrCode) html5QrCode.resume();
    }, 4000);
}

// Enviar correo de avería
function sendAveriaEmail(printer) {
    const destinatario = printer.averiaEmail;
    const asunto = `AVERÍA - ${printer.model} - Serie: ${printer.serial}`;
    
    const cuerpo = `
=========================================
📠 REPORTE DE AVERÍA EN IMPRESORA
=========================================

🖨️ MODELO: ${printer.model}
🔢 NÚMERO DE SERIE: ${printer.serial}
📍 UBICACIÓN: ${printer.location}

─────────────────────────────────────────
⚠️ DESCRIPCIÓN DEL PROBLEMA:
─────────────────────────────────────────

[Describe aquí la avería]

─────────────────────────────────────────
📅 FECHA: ${new Date().toLocaleString('es-ES')}
👤 REPORTADO POR: [Tu nombre]

=========================================`;
    
    const mailtoURL = `mailto:${destinatario}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    
    updateStatus(`🔴 Abriendo correo para AVERÍA de ${printer.model}...`, 'success');
    
    setTimeout(() => {
        // Usar window.open para mejor compatibilidad en móviles
        const win = window.open(mailtoURL, '_blank');
        if (!win || win.closed || typeof win.closed === 'undefined') {
            // Fallback si el popup fue bloqueado
            window.location.href = mailtoURL;
        }
        resetCooldown();
    }, 800);
}

// Enviar correo de tóner
function sendTonerEmail(printer) {
    const destinatario = printer.tonerEmail;
    const asunto = `PEDIDO TÓNER - ${printer.model} - Serie: ${printer.serial}`;
    
    const cuerpo = `
=========================================
🖨️ SOLICITUD DE TÓNER
=========================================

🖨️ MODELO: ${printer.model}
🔢 NÚMERO DE SERIE: ${printer.serial}
📍 UBICACIÓN: ${printer.location}
📦 TÓNER COMPATIBLE: ${printer.tonerType}

─────────────────────────────────────────
📊 CANTIDAD SOLICITADA:
─────────────────────────────────────────

[ ] 1 unidad
[ ] 2 unidades
[ ] Otros: _______

─────────────────────────────────────────
📅 FECHA: ${new Date().toLocaleString('es-ES')}
👤 SOLICITADO POR: [Tu nombre]

=========================================`;
    
    const mailtoURL = `mailto:${destinatario}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    
    updateStatus(`🟢 Abriendo correo para TÓNER de ${printer.model}...`, 'success');
    
    setTimeout(() => {
        const win = window.open(mailtoURL, '_blank');
        if (!win || win.closed || typeof win.closed === 'undefined') {
            window.location.href = mailtoURL;
        }
        resetCooldown();
    }, 800);
}

// Actualizar estado en pantalla
function updateStatus(message, type = 'normal') {
    const statusDiv = document.getElementById('scanner-status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
}
