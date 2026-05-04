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
    
    // Crear un div interno donde se generará el QR
    const qrCodeDiv = document.createElement('div');
    qrCodeDiv.style.marginBottom = '10px';
    qrItem.appendChild(qrCodeDiv);
    
    // Agregar información
    const title = type === 'averia' ? '🔴 AVERÍA' : '🟢 TÓNER';
    const infoDiv = document.createElement('div');
    infoDiv.innerHTML = `
        <p style="margin: 5px 0;"><strong>${title}</strong></p>
        <p style="margin: 5px 0; color: #666;">${printer.id}</p>
        <p style="margin: 5px 0; color: #666; font-size: 0.9rem;">${printer.model}</p>
    `;
    qrItem.appendChild(infoDiv);
    
    // Botón de descarga
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = '💾 Descargar QR';
    downloadBtn.style.marginTop = '10px';
    downloadBtn.style.padding = '10px 20px';
    downloadBtn.style.background = '#3498db';
    downloadBtn.style.color = 'white';
    downloadBtn.style.border = 'none';
    downloadBtn.style.borderRadius = '8px';
    downloadBtn.style.cursor = 'pointer';
    downloadBtn.style.fontWeight = 'bold';
    downloadBtn.onclick = function() {
        downloadQRFromItem(qrItem, `${printer.id}_${type}`);
    };
    qrItem.appendChild(downloadBtn);
    
    container.appendChild(qrItem);
    
    // Generar QR - La librería QRCode.js modificará qrCodeDiv
    new QRCode(qrCodeDiv, {
        text: qrData,
        width: 250,
        height: 250,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
    });
}

// Descargar QR desde el item (busca canvas o img)
function downloadQRFromItem(qrItem, filename) {
    // Buscar canvas primero
    let canvas = qrItem.querySelector('canvas');
    
    // Si no hay canvas, buscar imagen
    if (!canvas) {
        const img = qrItem.querySelector('img');
        if (img) {
            // Crear canvas temporal para la imagen
            canvas = document.createElement('canvas');
            canvas.width = 250;
            canvas.height = 250;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 250, 250);
            ctx.drawImage(img, 0, 0, 250, 250);
        }
    }
    
    if (canvas) {
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        alert('❌ No se encontró el QR para descargar. Intenta generarlo de nuevo.');
    }
}

// Descargar QR como imagen (versión antigua para compatibilidad)
function downloadQR(button, filename) {
    const qrItem = button.parentElement;
    downloadQRFromItem(qrItem, filename);
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
    
    printers.forEach(printer => {
        // QR para Avería
        const averiaItem = createQRItem(printer, 'averia', '🔴 AVERÍA');
        qrList.appendChild(averiaItem);
        
        // QR para Tóner
        const tonerItem = createQRItem(printer, 'toner', '🟢 TÓNER');
        qrList.appendChild(tonerItem);
    });
    
    // Botón para descargar todos
    const batchDiv = document.createElement('div');
    batchDiv.style.textAlign = 'center';
    batchDiv.style.marginTop = '30px';
    batchDiv.innerHTML = `<button onclick="downloadAllQRs()" class="btn-batch" style="padding: 12px 20px; background: #3498db; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">📦 Descargar todos como ZIP</button>`;
    container.appendChild(batchDiv);
}

// Crear item con QR
function createQRItem(printer, type, title) {
    const qrItem = document.createElement('div');
    qrItem.className = 'qr-item';
    qrItem.style.display = 'inline-block';
    qrItem.style.margin = '15px';
    qrItem.style.textAlign = 'center';
    qrItem.style.verticalAlign = 'top';
    
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
    qrItem.appendChild(qrCodeDiv);
    
    // Info
    const infoDiv = document.createElement('div');
    infoDiv.innerHTML = `
        <p style="margin: 5px 0;"><strong>${title}</strong></p>
        <p style="margin: 5px 0; color: #666; font-size: 0.85rem;">${printer.id}</p>
        <p style="margin: 5px 0; color: #666; font-size: 0.8rem;">${printer.model}</p>
    `;
    qrItem.appendChild(infoDiv);
    
    // Botón descarga
    const downloadBtn = document.createElement('button');
    downloadBtn.textContent = '💾 Descargar';
    downloadBtn.style.marginTop = '8px';
    downloadBtn.style.padding = '8px 16px';
    downloadBtn.style.background = '#3498db';
    downloadBtn.style.color = 'white';
    downloadBtn.style.border = 'none';
    downloadBtn.style.borderRadius = '6px';
    downloadBtn.style.cursor = 'pointer';
    downloadBtn.style.fontSize = '0.85rem';
    downloadBtn.onclick = function() {
        downloadQRFromItem(qrItem, `${printer.id}_${type}`);
    };
    qrItem.appendChild(downloadBtn);
    
    // Generar QR
    new QRCode(qrCodeDiv, {
        text: qrData,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
    });
    
    return qrItem;
}

// Descargar todos los QR
async function downloadAllQRs() {
    if (printers.length === 0) {
        alert('No hay impresoras registradas');
        return;
    }
    
    alert('Generando descargas. Acepta cada descarga en tu navegador.');
    
    for (const printer of printers) {
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Avería
        const averiaData = JSON.stringify({
            t: 'averia',
            m: printer.model,
            s: printer.serial,
            l: printer.location,
            tt: printer.tonerType,
            ae: printer.averiaEmail,
            te: printer.tonerEmail
        });
        
        const averiaCanvas = await generateQRCanvas(averiaData, 200);
        if (averiaCanvas) {
            downloadCanvas(averiaCanvas, `${printer.id}_AVERIA.png`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 600));
        
        // Tóner
        const tonerData = JSON.stringify({
            t: 'toner',
            m: printer.model,
            s: printer.serial,
            l: printer.location,
            tt: printer.tonerType,
            ae: printer.averiaEmail,
            te: printer.tonerEmail
        });
        
        const tonerCanvas = await generateQRCanvas(tonerData, 200);
        if (tonerCanvas) {
            downloadCanvas(tonerCanvas, `${printer.id}_TONER.png`);
        }
    }
    
    alert('✅ Todas las descargas han sido iniciadas');
}

// Generar QR y devolver canvas
function generateQRCanvas(content, size) {
    return new Promise((resolve) => {
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);
        
        new QRCode(tempDiv, {
            text: content,
            width: size,
            height: size,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
        
        // Dar tiempo a la librería para renderizar
        setTimeout(() => {
            const canvas = tempDiv.querySelector('canvas');
            const img = tempDiv.querySelector('img');
            
            if (canvas) {
                document.body.removeChild(tempDiv);
                resolve(canvas);
            } else if (img) {
                // Si generó img en lugar de canvas, crear canvas
                const newCanvas = document.createElement('canvas');
                newCanvas.width = size;
                newCanvas.height = size;
                const ctx = newCanvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, size, size);
                
                const tempImg = new Image();
                tempImg.onload = function() {
                    ctx.drawImage(tempImg, 0, 0, size, size);
                    document.body.removeChild(tempDiv);
                    resolve(newCanvas);
                };
                tempImg.onerror = function() {
                    document.body.removeChild(tempDiv);
                    resolve(null);
                };
                tempImg.src = img.src;
            } else {
                document.body.removeChild(tempDiv);
                resolve(null);
            }
        }, 300);
    });
}

// Descargar canvas como imagen
function downloadCanvas(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
