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
    
    // Contenido del QR: TIPO|ID
    const qrContent = `${type.toUpperCase()}|${printer.id}`;
    
    // URL completa para redirigir
    const baseURL = window.location.origin + window.location.pathname.replace('/admin/', '/scanner/scanner-auto.html');
    const fullURL = `${baseURL}?qr=${encodeURIComponent(qrContent)}`;
    
    const container = document.getElementById('qr-result');
    container.innerHTML = '';
    
    // Crear contenedor del QR
    const qrDiv = document.createElement('div');
    qrDiv.className = 'qr-item';
    qrDiv.style.textAlign = 'center';
    qrDiv.style.padding = '20px';
    qrDiv.style.background = 'white';
    qrDiv.style.borderRadius = '10px';
    qrDiv.style.border = '1px solid #ddd';
    qrDiv.style.display = 'inline-block';
    qrDiv.style.margin = '10px';
    
    // Crear div para el QR (la librería lo requiere)
    const qrCodeDiv = document.createElement('div');
    qrCodeDiv.id = `qr-${Date.now()}`;
    qrDiv.appendChild(qrCodeDiv);
    
    try {
        // Generar QR usando la librería
        const qrcode = new QRCode(qrCodeDiv, {
            text: fullURL,
            width: 250,
            height: 250,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        const title = type === 'averia' ? '🔴 AVERÍA' : '🟢 TÓNER';
        
        // Guardar referencia al canvas (buscar el canvas dentro del div)
        setTimeout(() => {
            const canvas = qrCodeDiv.querySelector('canvas');
            if (canvas) {
                qrCache[`${printer.id}_${type}`] = canvas;
            }
        }, 100);
        
        qrDiv.innerHTML += `
            <p><strong>${title}</strong></p>
            <p><strong>${printer.id}</strong> - ${printer.model.substring(0, 20)}</p>
            <p style="font-size:11px; color:#27ae60;">✅ Escanea con cualquier lector QR</p>
            <button onclick="downloadSingleQR('${printer.id}_${type}')" style="margin-top:10px; padding:8px 15px; background:#27ae60; color:white; border:none; border-radius:5px; cursor:pointer;">
                💾 Descargar QR
            </button>
        `;
        
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
        alert('Error: No se encontró el QR. Intenta generarlo de nuevo.');
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
        // Generar QR Avería
        await generateAndAppendQRSimple(printer, 'averia', '🔴 AVERÍA', baseURL, qrList);
        // Generar QR Tóner
        await generateAndAppendQRSimple(printer, 'toner', '🟢 TÓNER', baseURL, qrList);
    }
    
    container.innerHTML = `
        <h3>✅ Todos los QR generados (${printers.length * 2})</h3>
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

// Generar QR individual y agregar a la lista
async function generateAndAppendQRSimple(printer, type, title, baseURL, container) {
    return new Promise((resolve) => {
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
        
        const qrCodeDiv = document.createElement('div');
        qrDiv.appendChild(qrCodeDiv);
        
        try {
            // Generar QR
            const qrcode = new QRCode(qrCodeDiv, {
                text: fullURL,
                width: 150,
                height: 150,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            
            // Guardar referencia al canvas
            setTimeout(() => {
                const canvas = qrCodeDiv.querySelector('canvas');
                if (canvas) {
                    qrCache[`${printer.id}_${type}`] = canvas;
                }
            }, 100);
            
            qrDiv.innerHTML += `<p><strong>${title}</strong><br>${printer.id}</p>`;
            qrDiv.innerHTML += `<button onclick="downloadSingleQR('${printer.id}_${type}')" style="margin-top:5px; padding:5px 10px; background:#27ae60; color:white; border:none; border-radius:3px; cursor:pointer;">💾</button>`;
            container.appendChild(qrDiv);
        } catch (error) {
            qrDiv.innerHTML = `<p style="color:red;">Error</p>`;
            container.appendChild(qrDiv);
        }
        
        resolve();
    });
}

// Descargar todos los QR en ZIP
async function downloadAllQRsAsZip() {
    const zip = new JSZip();
    const folder = zip.folder("codigos_qr_impresoras");
    
    let count = 0;
    
    for (const [filename, canvas] of Object.entries(qrCache)) {
        const dataURL = canvas.toDataURL('image/png');
        const base64Data = dataURL.split(',')[1];
        folder.file(`${filename}.png`, base64Data, { base64: true });
        count++;
    }
    
    if (count === 0) {
        alert('❌ No hay QR generados. Primero genera los QR.');
        return;
    }
    
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "codigos_qr_impresoras.zip");
    alert(`✅ Descargados ${count} códigos QR`);
}

// Función para descarga directa (alternativa)
function downloadAllQRsBatch() {
    const qrs = Object.entries(qrCache);
    if (qrs.length === 0) {
        alert('❌ No hay QR generados. Genera los QR primero.');
        return;
    }
    
    alert(`Se descargarán ${qrs.length} QR uno por uno.`);
    
    qrs.forEach(([filename, canvas], index) => {
        setTimeout(() => {
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }, index * 500);
    });
}
