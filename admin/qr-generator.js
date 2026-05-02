// Variables globales
let qrCache = {};

// Generar QR individual
async function generateQR(type) {
    const printerId = document.getElementById('qr-printer-select').value;
    
    if (!printerId) {
        alert('❌ Selecciona una impresora primero');
        return;
    }
    
    const printer = printers.find(p => p.id === printerId);
    if (!printer) return;
    
    // Contenido del QR: TIPO|ID (corto y simple)
    const qrContent = `${type.toUpperCase()}|${printer.id}`;
    
    // URL de la página que procesará el QR
    const baseURL = window.location.origin + window.location.pathname.replace('/admin/', '/scanner/scanner-auto.html');
    const fullURL = `${baseURL}?qr=${encodeURIComponent(qrContent)}`;
    
    const container = document.getElementById('qr-result');
    container.innerHTML = '';
    
    const qrDiv = document.createElement('div');
    qrDiv.className = 'qr-item';
    qrDiv.style.textAlign = 'center';
    qrDiv.style.padding = '20px';
    qrDiv.style.background = 'white';
    qrDiv.style.borderRadius = '10px';
    qrDiv.style.border = '1px solid #ddd';
    qrDiv.style.display = 'inline-block';
    qrDiv.style.margin = '10px';
    
    const canvas = document.createElement('canvas');
    canvas.id = `qr-${Date.now()}`;
    qrDiv.appendChild(canvas);
    
    try {
        // Generar QR con la URL completa
        await QRCode.toCanvas(canvas, fullURL, {
            width: 250,
            margin: 2
        });
        
        const title = type === 'averia' ? '🔴 AVERÍA' : '🟢 TÓNER';
        qrDiv.innerHTML += `
            <p><strong>${title}</strong></p>
            <p><strong>${printer.id}</strong> - ${printer.model}</p>
            <p style="font-size:11px; color:#27ae60;">✅ Escanea con cualquier lector QR</p>
            <button onclick="downloadSingleQR('${printer.id}_${type}')" style="margin-top:10px; padding:8px 15px; background:#27ae60; color:white; border:none; border-radius:5px; cursor:pointer;">
                💾 Descargar QR
            </button>
        `;
        
        qrCache[`${printer.id}_${type}`] = canvas;
        container.appendChild(qrDiv);
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `<p style="color:red;">Error al generar QR: ${error.message}</p>`;
    }
}

// Descargar QR individual
function downloadSingleQR(filename) {
    const canvas = qrCache[filename];
    if (canvas) {
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } else {
        alert('Error: No se encontró el QR. Genéralo de nuevo.');
    }
}

// Generar todos los QR
async function generateAllQRs() {
    if (printers.length === 0) {
        alert('❌ No hay impresoras registradas');
        return;
    }
    
    const container = document.getElementById('qr-result');
    container.innerHTML = '<h3>📦 Generando todos los QR...</h3><div id="qr-list-container" style="display:flex; flex-wrap:wrap; gap:20px; justify-content:center; margin-top:20px;"></div>';
    const qrList = document.getElementById('qr-list-container');
    
    const baseURL = window.location.origin + window.location.pathname.replace('/admin/', '/scanner/scanner-auto.html');
    
    for (const printer of printers) {
        // Avería
        await generateAndAppendQRSimple(printer, 'averia', '🔴 AVERÍA', baseURL, qrList);
        // Tóner
        await generateAndAppendQRSimple(printer, 'toner', '🟢 TÓNER', baseURL, qrList);
    }
    
    container.innerHTML = `
        <h3>✅ Todos los QR generados</h3>
        <div id="qr-list-container" style="display:flex; flex-wrap:wrap; gap:20px; justify-content:center; margin-top:20px;"></div>
        <div style="text-align:center; margin-top:30px;">
            <button onclick="downloadAllQRsAsZip()" style="padding:12px 25px; background:#e74c3c; color:white; border:none; border-radius:8px; cursor:pointer;">
                📦 DESCARGAR TODOS EN ZIP
            </button>
        </div>
    `;
    
    const newList = document.getElementById('qr-list-container');
    while (qrList.firstChild) {
        newList.appendChild(qrList.firstChild);
    }
}

async function generateAndAppendQRSimple(printer, type, title, baseURL, container) {
    return new Promise(async (resolve) => {
        const qrContent = `${type.toUpperCase()}|${printer.id}`;
        const fullURL = `${baseURL}?qr=${encodeURIComponent(qrContent)}`;
        
        const qrDiv = document.createElement('div');
        qrDiv.style.textAlign = 'center';
        qrDiv.style.padding = '10px';
        qrDiv.style.background = 'white';
        qrDiv.style.borderRadius = '10px';
        qrDiv.style.border = '1px solid #ddd';
        qrDiv.style.width = '180px';
        qrDiv.style.display = 'inline-block';
        qrDiv.style.margin = '5px';
        
        const canvas = document.createElement('canvas');
        canvas.width = 150;
        canvas.height = 150;
        qrDiv.appendChild(canvas);
        
        try {
            await QRCode.toCanvas(canvas, fullURL, { width: 150, margin: 1 });
            qrDiv.innerHTML += `<p><strong>${title}</strong><br>${printer.id}</p>`;
            qrDiv.innerHTML += `<button onclick="downloadSingleQR('${printer.id}_${type}')" style="margin-top:5px; padding:5px 10px; background:#27ae60; color:white; border:none; border-radius:3px; cursor:pointer;">💾</button>`;
            qrCache[`${printer.id}_${type}`] = canvas;
            container.appendChild(qrDiv);
        } catch (error) {
            qrDiv.innerHTML = `<p style="color:red;">Error</p>`;
            container.appendChild(qrDiv);
        }
        resolve();
    });
}

// Descargar ZIP
async function downloadAllQRsAsZip() {
    const zip = new JSZip();
    const folder = zip.folder("codigos_qr");
    
    for (const [filename, canvas] of Object.entries(qrCache)) {
        const dataURL = canvas.toDataURL('image/png');
        const base64Data = dataURL.split(',')[1];
        folder.file(`${filename}.png`, base64Data, { base64: true });
    }
    
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "codigos_qr.zip");
    alert('✅ ZIP descargado');
}
