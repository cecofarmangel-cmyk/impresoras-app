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
    qrDiv.style.textAlign = 'center';
    qrDiv.style.padding = '20px';
    qrDiv.style.background = 'white';
    qrDiv.style.borderRadius = '10px';
    qrDiv.style.display = 'inline-block';
    
    // Crear canvas para el QR
    const canvas = document.createElement('canvas');
    qrDiv.appendChild(canvas);
    
    // Generar QR en el canvas
    QRCode.toCanvas(canvas, qrContent, {
        width: 200,
        margin: 2,
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
    }, function(error) {
        if (error) {
            console.error(error);
            container.innerHTML = '<p style="color:red;">Error al generar QR</p>';
        }
    });
    
    // Agregar información
    const title = type === 'averia' ? '🔴 AVERÍA' : '🟢 TÓNER';
    qrDiv.innerHTML += `
        <p><strong>${title}</strong></p>
        <p>Impresora: ${printer.id}</p>
        <p>${printer.model}</p>
        <button onclick="downloadQRFromCanvas(this, '${printer.id}_${type}')" style="margin-top:10px; padding:8px 15px; background:#3498db; color:white; border:none; border-radius:5px; cursor:pointer;">💾 Descargar QR</button>
    `;
    
    container.appendChild(qrDiv);
}

// Descargar QR desde canvas
function downloadQRFromCanvas(button, filename) {
    const qrItem = button.parentElement;
    const canvas = qrItem.querySelector('canvas');
    
    if (canvas) {
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL();
        link.click();
    } else {
        alert('Error: No se encontró el QR');
    }
}

// Generar todos los QR de todas las impresoras
async function generateAllQRs() {
    if (printers.length === 0) {
        alert('No hay impresoras registradas');
        return;
    }
    
    const container = document.getElementById('qr-result');
    container.innerHTML = '<h3>Todos los QR generados:</h3><div id="qr-list-container" style="display:flex; flex-wrap:wrap; gap:20px; justify-content:center;"></div>';
    const qrList = document.getElementById('qr-list-container');
    
    for (const printer of printers) {
        // QR para Avería
        const averiaDiv = await createQRCanvas(printer, 'averia', '🔴 AVERÍA');
        qrList.appendChild(averiaDiv);
        
        // QR para Tóner
        const tonerDiv = await createQRCanvas(printer, 'toner', '🟢 TÓNER');
        qrList.appendChild(tonerDiv);
    }
    
    container.innerHTML += '<div style="text-align:center; margin-top:20px;"><button onclick="downloadAllQRsBatch()" class="btn-batch">📦 Descargar todos los QR</button></div>';
}

// Crear QR en canvas
function createQRCanvas(printer, type, title) {
    return new Promise((resolve) => {
        const qrDiv = document.createElement('div');
        qrDiv.className = 'qr-item';
        qrDiv.style.textAlign = 'center';
        qrDiv.style.padding = '15px';
        qrDiv.style.background = 'white';
        qrDiv.style.borderRadius = '10px';
        qrDiv.style.border = '1px solid #ddd';
        
        const canvas = document.createElement('canvas');
        qrDiv.appendChild(canvas);
        
        const qrContent = `${type.toUpperCase()}|${printer.id}`;
        
        QRCode.toCanvas(canvas, qrContent, {
            width: 150,
            margin: 1
        }, function(error) {
            if (!error) {
                qrDiv.innerHTML += `
                    <p><strong>${title}</strong></p>
                    <p>${printer.id}</p>
                    <p style="font-size:12px;">${printer.model.substring(0, 20)}</p>
                    <button onclick="downloadQRFromCanvas(this, '${printer.id}_${type}')" style="margin-top:10px; padding:5px 10px; background:#3498db; color:white; border:none; border-radius:5px; cursor:pointer; font-size:12px;">💾 Descargar</button>
                `;
            }
            resolve(qrDiv);
        });
    });
}

// Descargar todos los QR en lote
async function downloadAllQRsBatch() {
    if (printers.length === 0) {
        alert('No hay impresoras registradas');
        return;
    }
    
    alert(`Se descargarán ${printers.length * 2} QR. Por favor espera...`);
    
    for (const printer of printers) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Generar y descargar QR Avería
        const averiaCanvas = await generateQRCanvasDirect(`${printer.id}_averia`, `AVERIA|${printer.id}`);
        if (averiaCanvas) {
            downloadCanvas(averiaCanvas, `${printer.id}_AVERIA.png`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Generar y descargar QR Tóner
        const tonerCanvas = await generateQRCanvasDirect(`${printer.id}_toner`, `TONER|${printer.id}`);
        if (tonerCanvas) {
            downloadCanvas(tonerCanvas, `${printer.id}_TONER.png`);
        }
    }
    
    alert('✅ Todos los QR han sido descargados');
}

// Generar QR y devolver canvas
function generateQRCanvasDirect(id, content) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        QRCode.toCanvas(canvas, content, {
            width: 200,
            margin: 2
        }, function(error) {
            if (error) {
                console.error(error);
                resolve(null);
            } else {
                resolve(canvas);
            }
        });
    });
}

// Descargar canvas como imagen
function downloadCanvas(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL();
    link.click();
}
