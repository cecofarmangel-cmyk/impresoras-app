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

// Cargar impresoras desde localStorage o archivo JSON
async function loadPrinters() {
    const stored = localStorage.getItem('impresoras');
    
    if (stored) {
        try {
            const printers = JSON.parse(stored);
            printersDB = {};
            printers.forEach(printer => {
                printersDB[printer.id] = printer;
            });
            updateStatus(`✅ ${Object.keys(printersDB).length} impresoras cargadas`, 'success');
            return;
        } catch (e) {
            console.error('Error parseando localStorage:', e);
        }
    }
    
    // Si no hay localStorage, intentar cargar desde JSON central
    try {
        const response = await fetch('../data/impresoras.json?t=' + new Date().getTime());
        const printers = await response.json();
        printersDB = {};
        printers.forEach(printer => {
            printersDB[printer.id] = printer;
        });
        updateStatus(`✅ ${Object.keys(printersDB).length} impresoras cargadas desde servidor`, 'success');
    } catch (error) {
        console.error('Error cargando JSON:', error);
        updateStatus('⚠️ Usando datos de ejemplo. Ve al panel de administración para agregar tus impresoras.', 'error');
        
        const ejemplo = [
            { id: "P001", serial: "SN123456789", model: "HP LaserJet Pro M402dn", location: "Oficina Dirección", tonerType: "HP 26X", averiaEmail: "soporte@tuempresa.com", tonerEmail: "compras@tuempresa.com" },
            { id: "P002", serial: "SN987654321", model: "Brother HL-L2350DW", location: "Recepción", tonerType: "Brother TN-760", averiaEmail: "soporte@tuempresa.com", tonerEmail: "compras@tuempresa.com" }
        ];
        
        printersDB = {};
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
    
    let data;
    
    // Intentar parsear como JSON primero (nuevo formato)
    try {
        data = JSON.parse(cleanText);
    } catch (e) {
        // Si falla, intentar formato antiguo (TIPO|ID)
        const parts = cleanText.split('|');
        if (parts.length === 2) {
            const [tipo, printerId] = parts;
            const printer = printersDB[printerId];
            if (printer) {
                data = {
                    t: tipo.toLowerCase(),
                    m: printer.model,
                    s: printer.serial,
                    l: printer.location,
                    tt: printer.tonerType,
                    ae: printer.averiaEmail,
                    te: printer.tonerEmail
                };
            }
        }
    }
    
    if (!data || !data.t || !data.m || !data.s) {
        updateStatus('❌ QR inválido o incompleto. Regenera los QR desde el panel.', 'error');
        resetCooldown();
        return;
    }
    
    // Detener escáner temporalmente para evitar múltiples lecturas
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.pause();
    }
    
    // Según el tipo, enviar correo correspondiente
    if (data.t === 'averia') {
        sendAveriaEmail(data);
    } else if (data.t === 'toner') {
        sendTonerEmail(data);
    } else {
        updateStatus(`❌ Tipo de QR desconocido: ${data.t}`, 'error');
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
function sendAveriaEmail(data) {
    const destinatario = data.ae || 'soporte@tuempresa.com';
    const asunto = `AVERÍA - ${data.m} - Serie: ${data.s}`;
    
    const cuerpo = `
=========================================
📠 REPORTE DE AVERÍA EN IMPRESORA
=========================================

🖨️ MODELO: ${data.m}
🔢 NÚMERO DE SERIE: ${data.s}
📍 UBICACIÓN: ${data.l || 'No especificada'}

─────────────────────────────────────────
⚠️ DESCRIPCIÓN DEL PROBLEMA:
─────────────────────────────────────────

[Describe aquí la avería]

─────────────────────────────────────────
📅 FECHA: ${new Date().toLocaleString('es-ES')}
👤 REPORTADO POR: [Tu nombre]

=========================================`;
    
    const mailtoURL = `mailto:${destinatario}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
    
    updateStatus(`🔴 Abriendo correo para AVERÍA de ${data.m}...`, 'success');
    
    setTimeout(() => {
        const win = window.open(mailtoURL, '_blank');
        if (!win || win.closed || typeof win.closed === 'undefined') {
            window.location.href = mailtoURL;
        }
        resetCooldown();
    }, 800);
}

// Enviar correo de tóner
function sendTonerEmail(data) {
    const destinatario = data.te || 'compras@tuempresa.com';
    const asunto = `PEDIDO TÓNER - ${data.m} - Serie: ${data.s}`;
    
    const cuerpo = `
=========================================
🖨️ SOLICITUD DE TÓNER
=========================================

🖨️ MODELO: ${data.m}
🔢 NÚMERO DE SERIE: ${data.s}
📍 UBICACIÓN: ${data.l || 'No especificada'}
📦 TÓNER COMPATIBLE: ${data.tt || 'No especificado'}

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
    
    updateStatus(`🟢 Abriendo correo para TÓNER de ${data.m}...`, 'success');
    
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
