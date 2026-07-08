export class PersonaDTO {
  constructor({
    cod_com,
    cod_persona,
    cod_socio,
    nombres,
    primer_apellido,
    segundo_apellido,
    tipo_socio,
    tipo_documento,
    documento_identidad,
    cod_complementario,
    lugar_nacimiento,
    fecha_nacimiento,
    estado_civil,
    genero,
    celular,
    correo_electronico,
    direccion_domicilio,
  }) {
    this.cod_com = cod_com;
    //this.cod_persona = cod_persona || null;
    //this.cod_socio = cod_socio;
    this.cod_socio = String(cod_socio || '').trim();

    this.nombres = nombres?.trim().toUpperCase();
    this.primer_apellido = primer_apellido?.trim().toUpperCase();
    this.segundo_apellido = segundo_apellido?.trim().toUpperCase();
    this.tipo_socio = tipo_socio;
    this.tipo_documento = tipo_documento;
    //this.documento_identidad = documento_identidad;
    this.documento_identidad = String(documento_identidad || '').trim();
    this.cod_complementario = String(cod_complementario || '').trim();

    //this.cod_complementario = cod_complementario || null;
    this.lugar_nacimiento = lugar_nacimiento || null;
    this.fecha_nacimiento = fecha_nacimiento || null;
    this.estado_civil = estado_civil || null;
    this.genero = genero;
    this.celular = celular || null;
    this.correo_electronico = correo_electronico || null;
    this.direccion_domicilio = direccion_domicilio || null;
  }
}