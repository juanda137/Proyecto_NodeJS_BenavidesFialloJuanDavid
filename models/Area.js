import { Entidad } from './Entidad.js';

export class Area extends Entidad {
    constructor({ codigo, nombre, activo }) {
        super({ codigo, nombre, activo });
    }
}