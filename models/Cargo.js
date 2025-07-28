// models/Cargo.js
import { Entidad } from './Entidad.js';

// ✅ CORRECCIÓN: Se añade la palabra 'export'
export class Cargo extends Entidad {
    constructor({ codigo, nombre, activo, area_codigo, area_nombre }) {
        super({ codigo, nombre, activo });
        this.area_codigo = area_codigo;
        this.area_nombre = area_nombre;
    }
}