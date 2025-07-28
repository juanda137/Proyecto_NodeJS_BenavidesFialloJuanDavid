function getHtmlTemplate(title, bodyContent) {
    return `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px;}
                h1, h2 { color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #3f23f0ff; color: white; }
                tr:nth-child(even) { background-color: #f2f2f2; }
                .container { background-color: white; padding: 20px; border-radius: 8px;}
                .total-row td { font-weight: bold; background-color: #e8e8e8; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>${title}</h1>
                ${bodyContent}
            </div>
        </body>
        </html>
    `;
}

export function generateActiveEmployeesHTML(data) {
    let currentArea = "";
    let bodyContent = "";
    let tableOpen = false;

    data.forEach((emp, index) => {
        if (emp.area.nombre !== currentArea) {
            if (tableOpen) {
                bodyContent += `</tbody></table>`;
            }
            currentArea = emp.area.nombre;
            bodyContent += `<h2>Área: ${currentArea} (${emp.area.codigo})</h2>`;
            bodyContent += `
                <table>
                    <thead>
                        <tr>
                            <th>Cargo</th>
                            <th>Tipo ID</th>
                            <th>Número ID</th>
                            <th>Nombres</th>
                            <th>Apellidos</th>
                            <th>Género</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            tableOpen = true;
        }
        bodyContent += `
            <tr>
                <td>${emp.cargo.nombre} (${emp.cargo.codigo})</td>
                <td>${emp.tipo_identificacion}</td>
                <td>${emp.numero_identificacion}</td>
                <td>${emp.nombres}</td>
                <td>${emp.apellidos}</td>
                <td>${emp.genero}</td>
            </tr>
        `;
        if (index === data.length - 1) {
            bodyContent += `</tbody></table>`;
        }
    });

    return getHtmlTemplate("Reporte de Empleados Activos por Área y Cargo", bodyContent);
}

export function generatePayrollDetailsHTML(data) {
    if (!data || data.length === 0) {
        return getHtmlTemplate("Detalle de Nómina", "<h2>No se encontraron datos para el empleado y nómina especificados.</h2>");
    }
    const details = data[0];
    let bodyContent = `
        <h2>Empleado: ${details.nombres} ${details.apellidos}</h2>
        <p><strong>Identificación:</strong> ${details.tipo_identificacion} ${details.numero_identificacion}</p>
        <p><strong>Salario Base:</strong> ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(details.salario_base)}</p>

        <h3>Devengos</h3>
        <table>
            <thead><tr><th>Código</th><th>Nombre</th><th>Valor</th></tr></thead>
            <tbody>
                ${details.devengos.map(d => `<tr><td>${d.codigo}</td><td>${d.nombre}</td><td>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(d.valor)}</td></tr>`).join('')}
            </tbody>
        </table>

        <h3>Deducciones</h3>
        <table>
            <thead><tr><th>Código</th><th>Nombre</th><th>Valor</th></tr></thead>
            <tbody>
                ${details.deducciones.map(d => `<tr><td>${d.codigo}</td><td>${d.nombre}</td><td>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(d.valor)}</td></tr>`).join('')}
            </tbody>
        </table>
    `;

    return getHtmlTemplate("Detalle de Desprendible de Nómina", bodyContent);
}

export function generateTransportAllowanceHTML(data) {
    let bodyContent = `
        <table>
            <thead>
                <tr>
                    <th>Área</th>
                    <th>Cargo</th>
                    <th>Tipo ID</th>
                    <th>Número ID</th>
                    <th>Nombres</th>
                    <th>Apellidos</th>
                    <th>Salario Base</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(emp => `
                    <tr>
                        <td>${emp.area.nombre}</td>
                        <td>${emp.cargo.nombre}</td>
                        <td>${emp.tipo_identificacion}</td>
                        <td>${emp.numero_identificacion}</td>
                        <td>${emp.nombres}</td>
                        <td>${emp.apellidos}</td>
                        <td>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(emp.salario_base)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    return getHtmlTemplate("Reporte de Empleados con Auxilio de Transporte", bodyContent);
}

export function generatePayrollSummaryHTML(data) {
    if (!data || data.length === 0) {
        return getHtmlTemplate("Resumen de Nómina", "<h2>No se encontraron datos para la nómina especificada.</h2>");
    }
    const payrollId = data[0].nomina_codigo;
    let totalDevengos = 0;
    let totalDeducciones = 0;
    let totalNeto = 0;

    const rows = data.map(emp => {
        totalDevengos += emp.total_devengos;
        totalDeducciones += emp.total_deducciones;
        totalNeto += emp.neto_pagar;
        return `
            <tr>
                <td>${emp.tipo_identificacion} ${emp.numero_identificacion}</td>
                <td>${emp.nombres} ${emp.apellidos}</td>
                <td>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(emp.salario_base)}</td>
                <td>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(emp.total_devengos)}</td>
                <td>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(emp.total_deducciones)}</td>
                <td>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(emp.neto_pagar)}</td>
            </tr>
        `;
    }).join('');

    const footer = `
        <tr class="total-row">
            <td colspan="3">TOTALES</td>
            <td>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(totalDevengos)}</td>
            <td>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(totalDeducciones)}</td>
            <td>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(totalNeto)}</td>
        </tr>
    `;

    let bodyContent = `
        <h2>Resumen para la Nómina: ${payrollId}</h2>
        <table>
            <thead>
                <tr>
                    <th>Identificación</th>
                    <th>Nombre Completo</th>
                    <th>Salario Base</th>
                    <th>Total Devengos</th>
                    <th>Total Deducciones</th>
                    <th>Neto a Pagar</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
            <tfoot>
                ${footer}
            </tfoot>
        </table>
    `;
    return getHtmlTemplate(`Resumen de Nómina ${payrollId}`, bodyContent);
}