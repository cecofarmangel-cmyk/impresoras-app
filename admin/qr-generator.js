// Generar QR individual
function generateQR(type) {
    const printerId = document.getElementById('qr-printer-select').value;
    
    if (!printerId) {
        alert('❌ Selecciona una impresora primero');
        return;
    }
    
    const printer = printers.find(p => p.id === printerId);
    if (!printer) return;
    
    // Crear el contenido del QR con TODOS los datos necesarios
    const qrData = JSON.stringify({
        t: type,
        m: printer.model,
        s: printer.serial,
        l: printer.location,
        tt: printer.tonerType,
        ae: printer.averiaEmail,
        te: printer.tonerEmail
    });
    
    // Limpiar contenedor anterior
    const container = document.getElementById('qr-result');
    container.innerHTML = '';
    
    // Crear contenedor para el QR
    const qrItem = document.createElement('div');
    qrItem.className = 'qr-item';
    qrItem.style.display = 'inline-block';
    qrItem.style.margin = '20px';
    qrItem.style.textAlign = 'center';
    qrItem.style.padding = '20px';
    qrItem.style.background = '#f9f9f9';
    qrItem.style.borderRadius = '10px';
    
    // Crear un div interno donde se generará el QR
    const qrCodeDiv = document.createElement('div');
    qrCodeDiv.id = 'qrcode-' + Date.now();
    qrCodeDiv.style.marginBottom = '15px';
    qrCodeDiv.style.display = 'inline-block';
    qrItem.appendChild(qrCodeDiv);
    
    // Agregar información
    const title = type === 'averia' ? '🔴 AVERÍA' : '🟢 TÓNER';
    const infoDiv = document.createElement('div');
    infoDiv.innerHTML = `
        <p style="margin: 8px 0; font-size: 1.1rem;"><strong>${title}</strong></p>
        <p style="margin: 5px 0; color: #666; font-weight: bold;">${printer.id}</p>
        <p style="margin: 5px 0; color: #666; font-size: 0.9rem;">${printer.model}</p>
    `;
    qrItem.appendChild(infoDiv);
    
    // Botón de descarga (inicialmente deshabilitado)
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = '⏳ Generando...';
    downloadBtn.disabled = true;
    downloadBtn.style.marginTop = '15px';
    downloadBtn.style.padding = '12px 24px';
    downloadBtn.style.background = '#95a5a6';
    downloadBtn.style.color = 'white';
    downloadBtn.style.border = 'none';
    downloadBtn.style.borderRadius = '8px';
    downloadBtn.style.cursor = 'not-allowed';
    downloadBtn.style.fontWeight = 'bold';
    qrItem.appendChild(downloadBtn);
    
    container.appendChild(qrItem);
    
    // Generar QR
    const qr = new QRCode(qrCodeDiv, {
        text: qrData,
        width: 250,
        height: 250,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
    });
    
    // Esperar a que el QR se renderice completamente
    setTimeout(() => {
        const img = qrCodeDiv.querySelector('img');
        if (img) {
            // Asegurar que la imagen esté cargada
            if (img.complete) {
                enableDownload(img, downloadBtn, `${printer.id}_${type}`);
            } else {
                img.onload = function() {
                    enableDownload(img, downloadBtn, `${printer.id}_${type}`);
                };
                img.onerror = function() {
                    downloadBtn.textContent = '❌ Error';
                };
            }
        } else {
            downloadBtn.textContent = '❌ Error';
        }
    }, 500);
}

// Habilitar botón de descarga
function enableDownload(imgElement, button, filename) {
    button.textContent = '💾 Descargar QR';
    button.disabled = false;
    button.style.background = '#3498db';
    button.style.cursor = 'pointer';
    button.style.pointerEvents = 'auto';
    
    button.onclick = function() {
        downloadQRImage(imgElement, filename);
    };
}

// Descargar imagen QR directamente
function downloadQRImage(imgElement, filename) {
    // Crear canvas del tamaño exacto de la imagen
    const canvas = document.createElement('canvas');
    canvas.width = 250;
    canvas.height = 250;
    const ctx = canvas.getContext('2d');
    
    // Fondo blanco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 250, 250);
    
    // Dibujar la imagen del QR
    ctx.drawImage(imgElement, 0, 0, 250, 250);
    
    // Descargar
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    
    // Pequeña demora antes de eliminar el link
    setTimeout(() => {
        document.body.removeChild(link);
    }, 100);
}

// Descargar QR (versión antigua para compatibilidad con HTML inline)
function downloadQR(button, filename) {
    const qrItem = button.closest('.qr-item');
    if (!qrItem) {
        // Fallback: buscar en parentElement
        const item = button.parentElement;
        const img = item.querySelector('img');
        if (img) {
            downloadQRImage(img, filename);
        }
        return;
    }
    
    const img = qrItem.querySelector('img');
    if (img) {
        downloadQRImage(img, filename);
    } else {
        alert('❌ No se encontró la imagen del QR');
    }
}

// Generar todos los QR de todas las impresoras
function generateAllQRs() {
    if (printers.length === 0) {
        alert('No hay impresoras registradas');
        return;
    }
    
    const container = document.getElementById('qr-result');
    container.innerHTML = '<h3 style="width: 100%; text-align: center; margin-bottom: 20px;">Todos los QR generados:</h3>';
    
    const qrList = document.createElement('div');
    qrList.className = 'qr-list';
    qrList.style.textAlign = 'center';
    container.appendChild(qrList);
    
    let delay = 0;
    printers.forEach((printer, index) => {
        // QR para Avería
        setTimeout(() => {
            const averiaItem = createQRItem(printer, 'averia', '🔴 AVERÍA');
            qrList.appendChild(averiaItem);
        }, delay);
        delay += 200;
        
        // QR para Tóner
        setTimeout(() => {
            const tonerItem = createQRItem(printer, 'toner', '🟢 TÓNER');
            qrList.appendChild(tonerItem);
        }, delay);
        delay += 200;
    });
    
    // Botón para descargar todos
    setTimeout(() => {
        const batchDiv = document.createElement('div');
        batchDiv.style.textAlign = 'center';
        batchDiv.style.marginTop = '30px';
        batchDiv.innerHTML = `<button onclick="downloadAllQRs()" class="btn-batch" style="padding: 12px 20px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">📦 Descargar todos</button>`;
        container.appendChild(batchDiv);
    }, delay + 100);
}

// Crear item con QR
function createQRItem(printer, type, title) {
    const qrItem = document.createElement('div');
    qrItem.className = 'qr-item';
    qrItem.style.display = 'inline-block';
    qrItem.style.margin = '15px';
    qrItem.style.textAlign = 'center';
    qrItem.style.verticalAlign = 'top';
    qrItem.style.padding = '15px';
    qrItem.style.background = '#f9f9f9';
    qrItem.style.borderRadius = '10px';
    
    const qrData = JSON.stringify({
        t: type,
        m: printer.model,
        s: printer.serial,
        l: printer.location,
        tt: printer.tonerType,
        ae: printer.averiaEmail,
        te: printer.tonerEmail
    });
    
    // Div para el QR
    const qrCodeDiv = document.createElement('div');
    qrCodeDiv.style.marginBottom = '10px';
    qrCodeDiv.style.display = 'inline-block';
    qrItem.appendChild(qrCodeDiv);
    
    // Info
    const infoDiv = document.createElement('div');
    infoDiv.innerHTML = `
        <p style="margin: 5px 0; font-size: 1rem;"><strong>${title}</strong></p>
        <p style="margin: 5px 0; color: #666; font-size: 0.85rem; font-weight: bold;">${printer.id}</p>
        <p style="margin: 5px 0; color: #666; font-size: 0.8rem;">${printer.model}</p>
    `;
    qrItem.appendChild(infoDiv);
    
    // Botón descarga (inicialmente deshabilitado)
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = '⏳...';
    downloadBtn.disabled = true;
    downloadBtn.style.marginTop = '10px';
    downloadBtn.style.padding = '8px 16px';
    downloadBtn.style.background = '#95a5a6';
    downloadBtn.style.color = 'white';
    downloadBtn.style.border = 'none';
    downloadBtn.style.borderRadius = '6px';
    downloadBtn.style.cursor = 'not-allowed';
    downloadBtn.style.fontSize = '0.85rem';
    qrItem.appendChild(downloadBtn);
    
    // Generar QR
    const qr = new QRCode(qrCodeDiv, {
        text: qrData,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
    });
    
    // Esperar renderizado
    setTimeout(() => {
        const img = qrCodeDiv.querySelector('img');
        if (img) {
            if (img.complete) {
                enableDownload(img, downloadBtn, `${printer.id}_${type}`);
            } else {
                img.onload = function() {
                    enableDownload(img, downloadBtn, `${printer.id}_${type}`);
                };
            }
        }
    }, 400);
    
    return qrItem;
}

// Descargar todos los QR
async function downloadAllQRs() {
    if (printers.length === 0) {
        alert('No hay impresoras registradas');
        return;
    }
    
    alert('Generando descargas... Acepta cada descarga en tu navegador.');
    
    for (const printer of printers) {
        // Avería
        await new Promise(resolve => setTimeout(resolve, 800));
        const averiaCanvas = await generateQRCanvas(JSON.stringify({
            t: 'averia', m: printer.model, s: printer.serial,
            l: printer.location, tt: printer.tonerType,
            ae: printer.averiaEmail, te: printer.tonerEmail
        }), 200);
        if (averiaCanvas) downloadCanvas(averiaCanvas, `${printer.id}_AVERIA.png`);
        
        // Tóner
        await new Promise(resolve => setTimeout(resolve, 800));
        const tonerCanvas = await generateQRCanvas(JSON.stringify({
            t: 'toner', m: printer.model, s: printer.serial,
            l: printer.location, tt: printer.tonerType,
            ae: printer.averiaEmail, te: printer.tonerEmail
        }), 200);
        if (tonerCanvas) downloadCanvas(tonerCanvas, `${printer.id}_TONER.png`);
    }
    
    alert('✅ Descargas completadas');
}

// Generar QR y devolver canvas (versión confiable)
function generateQRCanvas(content, size) {
    return new Promise((resolve) => {
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.top = '-9999px';
        document.body.appendChild(tempDiv);
        
        const qr = new QRCode(tempDiv, {
            text: content,
            width: size,
            height: size,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
        
        // Dar tiempo suficiente para renderizar
        setTimeout(() => {
            const img = tempDiv.querySelector('img');
            
            if (!img) {
                document.body.removeChild(tempDiv);
                resolve(null);
                return;
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            // Fondo blanco
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, size, size);
            
            if (img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, 0, 0, size, size);
                document.body.removeChild(tempDiv);
                resolve(canvas);
            } else {
                img.onload = function() {
                    ctx.drawImage(img, 0, 0, size, size);
                    document.body.removeChild(tempDiv);
                    resolve(canvas);
                };
                img.onerror = function() {
                    document.body.removeChild(tempDiv);
                    resolve(null);
                };
            }
        }, 600);
    });
}

// Descargar canvas como imagen
function downloadCanvas(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        if (link.parentNode) document.body.removeChild(link);
    }, 100);
}
