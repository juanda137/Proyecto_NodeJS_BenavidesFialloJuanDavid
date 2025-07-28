// models/Entidad.js

// ✅ CORRECCIÓN: Se añade la palabra 'export'
export class Entidad {
    constructor({ codigo, nombre, activo = true }) {
        this.codigo = codigo;
        this.nombre = nombre;
        this.activo = activo;
    }

    getIdentifier() {
        return `${this.nombre} (${this.codigo})`;
    }
}