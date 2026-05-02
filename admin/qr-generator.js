// Generar QR individual
function generateQR(type) {
    const printerId = document.getElementById('qr-printer-select').value;
    
    if (!printerId) {
        alert('❌ Selecciona una impresora primero');
        return;
    }
    
    const printer = printers.find(p => p.id === printerId);
    if (!printer) return;
    
    // Crear el contenido del QR
    const qrContent = `${type.toUpperCase()}|${printer.id}`;
    
    // Limpiar contenedor anterior
    const container = document.getElementById('qr-result');
    container.innerHTML = '';
    
    // Crear contenedor para el QR
    const qrDiv = document.createElement('div');
    qrDiv.className = 'qr-item';
    
    // Generar QR
    new QRCode(qrDiv, {
        text: qrContent,
        width: 200,
        height: 200
    });
    
    // Agregar información
    const title = type === 'averia' ? '🔴 AVERÍA' : '🟢 TÓNER';
    qrDiv.innerHTML += `
        <p><strong>${title}</strong></p>
        <p>Impresora: ${printer.id}</p>
        <p>${printer.model}</p>
        <button onclick="downloadQR(this, '${printer.id}_${type}')">💾 Descargar QR</button>
    `;
    
    container.appendChild(qrDiv);
}

// Descargar QR como imagen
function downloadQR(button, filename) {
    const qrItem = button.parentElement;
    const canvas = qrItem.querySelector('canvas');
    
    if (canvas) {
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL();
        link.click();
    }
}

// Generar todos los QR de todas las impresoras
function generateAllQRs() {
    if (printers.length === 0) {
        alert('No hay impresoras registradas');
        return;
    }
    
    const container = document.getElementById('qr-result');
    container.innerHTML = '<h3>Todos los QR generados:</h3><div class="qr-list"></div>';
    const qrList = container.querySelector('.qr-list');
    
    printers.forEach(printer => {
        // QR para Avería
        const averiaDiv = createQRDiv(printer, 'averia', '🔴 AVERÍA');
        qrList.appendChild(averiaDiv);
        
        // QR para Tóner
        const tonerDiv = createQRDiv(printer, 'toner', '🟢 TÓNER');
        qrList.appendChild(tonerDiv);
    });
    
    container.innerHTML += '<button onclick="downloadAllQRs()" class="btn-batch">📦 Descargar todos como ZIP</button>';
}

// Crear div con QR
function createQRDiv(printer, type, title) {
    const qrDiv = document.createElement('div');
    qrDiv.className = 'qr-item';
    qrDiv.style.display = 'inline-block';
    qrDiv.style.margin = '10px';
    
    const qrContent = `${type.toUpperCase()}|${printer.id}`;
    
    // Crear QR temporal
    const tempDiv = document.createElement('div');
    new QRCode(tempDiv, {
        text: qrContent,
        width: 150,
        height: 150
    });
    
    qrDiv.appendChild(tempDiv.querySelector('canvas') || tempDiv.querySelector('img'));
    qrDiv.innerHTML += `
        <p><strong>${title}</strong></p>
        <p>${printer.id}</p>
        <p>${printer.model}</p>
        <button onclick="downloadQR(this, '${printer.id}_${type}')">💾 Descargar</button>
    `;
    
    return qrDiv;
}

// Descargar todos los QR (versión simplificada - genera un ZIP)
async function downloadAllQRs() {
    if (printers.length === 0) {
        alert('No hay impresoras registradas');
        return;
    }
    
    alert('Generando todos los QR. Se abrirán múltiples descargas.');
    
    for (const printer of printers) {
        // Esperar un poco entre descargas
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generar y descargar QR Avería
        const averiaCanvas = await generateQRCanvas(`${printer.id}_averia`, `AVERIA|${printer.id}`);
        if (averiaCanvas) {
            downloadCanvas(averiaCanvas, `${printer.id}_AVERIA.png`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generar y descargar QR Tóner
        const tonerCanvas = await generateQRCanvas(`${printer.id}_toner`, `TONER|${printer.id}`);
        if (tonerCanvas) {
            downloadCanvas(tonerCanvas, `${printer.id}_TONER.png`);
        }
    }
    
    alert('✅ Todos los QR han sido descargados');
}

// Generar QR y devolver canvas
function generateQRCanvas(id, content) {
    return new Promise((resolve) => {
        const tempDiv = document.createElement('div');
        const qr = new QRCode(tempDiv, {
            text: content,
            width: 200,
            height: 200
        });
        
        setTimeout(() => {
            const canvas = tempDiv.querySelector('canvas');
            resolve(canvas);
        }, 100);
    });
}

// Descargar canvas como imagen
function downloadCanvas(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL();
    link.click();
}