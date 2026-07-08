export class Usuario {
  constructor({
    id,
    primer_apellido,
    segundo_apellido,
    nombres,
    bloqueado,
    bloqueado_hasta,
    email,
    documento_identidad,   // ← NUEVO
    intentos_fallidos,
    password,
    estado_usuario,
    ultimo_acceso,
    foto,
    usuario_registro,
    fecha_creacion,
    ultimo_intento_fallo,
    usuario_ultima_modificacion,
    fecha_ultima_actualizacion,
  }) {
    this.id = id;
    this.primer_apellido = primer_apellido;
    this.segundo_apellido = segundo_apellido;
    this.nombres = nombres;
    this.bloqueado = bloqueado;
    this.bloqueado_hasta = bloqueado_hasta;
    this.email = email;
    this.intentos_fallidos = intentos_fallidos;
    this.password = password;
    this.estado_usuario = estado_usuario;
    this.ultimo_acceso = ultimo_acceso;
    this.foto = foto;
    this.usuario_registro = usuario_registro;
    this.fecha_creacion = fecha_creacion;
    this.ultimo_intento_fallo = ultimo_intento_fallo;
    this.usuario_ultima_modificacion = usuario_ultima_modificacion;
    this.fecha_ultima_actualizacion = fecha_ultima_actualizacion;
        this.documento_identidad = documento_identidad;   // ← NUEVO
  }
}