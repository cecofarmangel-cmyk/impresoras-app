// Generar QR individual
async function generateQR(type) {
    const printerId = document.getElementById('qr-printer-select').value;
    
    if (!printerId) {
        alert('❌ Selecciona una impresora primero');
        return;
    }
    
    const printer = printers.find(p => p.id === printerId);
    if (!printer) return;
    
    // Crear el enlace mailto directamente
    let mailtoURL = '';
    
    if (type === 'averia') {
        const asunto = encodeURIComponent(`AVERÍA - ${printer.model} - Serie: ${printer.serial}`);
        const cuerpo = encodeURIComponent(`
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

=========================================`);
        
        mailtoURL = `mailto:${printer.averiaEmail}?subject=${asunto}&body=${cuerpo}`;
    } else {
        const asunto = encodeURIComponent(`PEDIDO TÓNER - ${printer.model} - Serie: ${printer.serial}`);
        const cuerpo = encodeURIComponent(`
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

=========================================`);
        
        mailtoURL = `mailto:${printer.tonerEmail}?subject=${asunto}&body=${cuerpo}`;
    }
    
    const container = document.getElementById('qr-result');
    container.innerHTML = '';
    
    // Crear contenedor
    const qrDiv = document.createElement('div');
    qrDiv.className = 'qr-item';
    qrDiv.style.textAlign = 'center';
    qrDiv.style.padding = '20px';
    qrDiv.style.background = 'white';
    qrDiv.style.borderRadius = '10px';
    qrDiv.style.border = '1px solid #ddd';
    qrDiv.style.display = 'inline-block';
    qrDiv.style.margin = '10px';
    
    // Crear canvas para QR
    const canvas = document.createElement('canvas');
    canvas.id = `qr-${Date.now()}`;
    qrDiv.appendChild(canvas);
    
    // Generar QR con el mailto URL
    try {
        await QRCode.toCanvas(canvas, mailtoURL, {
            width: 250,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        });
        
        const title = type === 'averia' ? '🔴 AVERÍA' : '🟢 TÓNER';
        qrDiv.innerHTML += `
            <p><strong>${title}</strong></p>
            <p><strong>ID:</strong> ${printer.id}</p>
            <p><strong>Modelo:</strong> ${printer.model}</p>
            <p style="font-size:12px; color:#666; word-break:break-all;">📧 Al escanear: Abre correo automáticamente</p>
            <button onclick="downloadSingleQR('${printer.id}_${type}')" style="margin-top:15px; padding:10px 20px; background:#27ae60; color:white; border:none; border-radius:5px; cursor:pointer;">
                💾 Descargar QR
            </button>
        `;
        
        // Guardar referencia al canvas
        qrCache[`${printer.id}_${type}`] = canvas;
        
        container.appendChild(qrDiv);
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `<p style="color:red;">Error al generar QR: ${error.message}</p>`;
    }
}

// Generar TODOS los QR (versión con mailto)
async function generateAllQRs() {
    if (printers.length === 0) {
        alert('❌ No hay impresoras registradas');
        return;
    }
    
    const container = document.getElementById('qr-result');
    container.innerHTML = '<h3>📦 Generando todos los QR...</h3><div id="qr-list-container" style="display:flex; flex-wrap:wrap; gap:20px; justify-content:center; margin-top:20px;"></div>';
    const qrList = document.getElementById('qr-list-container');
    
    let count = 0;
    const total = printers.length * 2;
    
    for (const printer of printers) {
        // Generar QR Avería
        await generateAndAppendQRMailto(printer, 'averia', '🔴 AVERÍA', qrList);
        count++;
        
        // Generar QR Tóner
        await generateAndAppendQRMailto(printer, 'toner', '🟢 TÓNER', qrList);
        count++;
        
        container.innerHTML = `<h3>📦 Generando QR... (${count}/${total})</h3>`;
    }
    
    container.innerHTML = `
        <h3>✅ Todos los QR generados (${total})</h3>
        <div id="qr-list-container" style="display:flex; flex-wrap:wrap; gap:20px; justify-content:center; margin-top:20px;"></div>
        <div style="text-align:center; margin-top:30px;">
            <button onclick="downloadAllQRsAsZip()" style="padding:12px 25px; background:#e74c3c; color:white; border:none; border-radius:8px; cursor:pointer; font-size:16px;">
                📦 DESCARGAR TODOS EN ZIP
            </button>
        </div>
    `;
    
    const newList = document.getElementById('qr-list-container');
    while (qrList.firstChild) {
        newList.appendChild(qrList.firstChild);
    }
}

// Generar QR con mailto
async function generateAndAppendQRMailto(printer, type, title, container) {
    return new Promise(async (resolve) => {
        // Construir mailto URL
        let mailtoURL = '';
        
        if (type === 'averia') {
            const asunto = encodeURIComponent(`AVERÍA - ${printer.model} - Serie: ${printer.serial}`);
            const cuerpo = encodeURIComponent(`
📠 AVERÍA EN IMPRESORA
Modelo: ${printer.model}
Serie: ${printer.serial}
Ubicación: ${printer.location}
Reportado por: [Tu nombre]`);
            
            mailtoURL = `mailto:${printer.averiaEmail}?subject=${asunto}&body=${cuerpo}`;
        } else {
            const asunto = encodeURIComponent(`PEDIDO TÓNER - ${printer.model} - Serie: ${printer.serial}`);
            const cuerpo = encodeURIComponent(`
🖨️ SOLICITUD TÓNER
Modelo: ${printer.model}
Serie: ${printer.serial}
Tóner: ${printer.tonerType}
Cantidad: 1 unidad`);
            
            mailtoURL = `mailto:${printer.tonerEmail}?subject=${asunto}&body=${cuerpo}`;
        }
        
        const qrDiv = document.createElement('div');
        qrDiv.className = 'qr-item';
        qrDiv.style.textAlign = 'center';
        qrDiv.style.padding = '15px';
        qrDiv.style.background = 'white';
        qrDiv.style.borderRadius = '10px';
        qrDiv.style.border = '1px solid #ddd';
        qrDiv.style.width = '200px';
        
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 160;
        qrDiv.appendChild(canvas);
        
        try {
            await QRCode.toCanvas(canvas, mailtoURL, {
                width: 160,
                margin: 1
            });
            
            qrDiv.innerHTML += `
                <p><strong>${title}</strong></p>
                <p><strong>${printer.id}</strong></p>
                <p style="font-size:10px; color:#27ae60;">📧 Escanea → Abre correo</p>
                <button onclick="downloadSingleQR('${printer.id}_${type}')" style="margin-top:10px; padding:5px 10px; background:#27ae60; color:white; border:none; border-radius:3px; cursor:pointer; font-size:11px;">
                    💾 Descargar
                </button>
            `;
            
            qrCache[`${printer.id}_${type}`] = canvas;
            container.appendChild(qrDiv);
        } catch (error) {
            console.error(`Error con ${printer.id}:`, error);
            qrDiv.innerHTML = `<p style="color:red;">Error</p>`;
            container.appendChild(qrDiv);
        }
        
        resolve();
    });
}
