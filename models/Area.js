// models/Area.js
import { Entidad } from './Entidad.js';

// ✅ CORRECCIÓN: Se añade la palabra 'export'
export class Area extends Entidad {
    constructor({ codigo, nombre, activo }) {
        super({ codigo, nombre, activo });
    }
}