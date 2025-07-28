import { Entidad } from './Entidad.js';

export class TipoContrato extends Entidad {
    constructor({ codigo, nombre, activo }) {
        super({ codigo, nombre, activo });
    }
}