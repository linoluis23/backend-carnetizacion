export class Persona {
  constructor({
    id,
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
    estado,
    usuario_registro,
    fecha_registro,
    usuario_ultima_modificacion,
    fecha_ultima_actualizacion,
  }) {
    this.id = id;
    this.cod_com = cod_com;
    this.cod_persona = cod_persona;
    this.cod_socio = cod_socio;
    this.nombres = nombres;
    this.primer_apellido = primer_apellido;
    this.segundo_apellido = segundo_apellido;
    this.tipo_socio = tipo_socio;
    this.tipo_documento = tipo_documento;
    this.documento_identidad = documento_identidad;
    this.cod_complementario = cod_complementario;
    this.lugar_nacimiento = lugar_nacimiento;
    this.fecha_nacimiento = fecha_nacimiento;
    this.estado_civil = estado_civil;
    this.genero = genero;
    this.celular = celular;
    this.correo_electronico = correo_electronico;
    this.direccion_domicilio = direccion_domicilio;
    this.estado = estado;
    this.usuario_registro = usuario_registro;
    this.fecha_registro = fecha_registro;
    this.usuario_ultima_modificacion = usuario_ultima_modificacion;
    this.fecha_ultima_actualizacion = fecha_ultima_actualizacion;
  }
}